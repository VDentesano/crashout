import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5175/';
const cdpPort = Number(process.env.CDP_PORT ?? 9222);
const outDir = path.resolve(process.env.SMOKE_OUT_DIR ?? path.join(process.cwd(), '../../docs/qa/cockpit-smoke'));

fs.mkdirSync(outDir, { recursive: true });

function requestJson(pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: cdpPort, path: pathname, method },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function openPage() {
  const target = await requestJson(`/json/new?${encodeURIComponent(baseUrl)}`, 'PUT');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;

  await new Promise((resolve) => {
    socket.addEventListener('open', resolve, { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    handler.resolve(message);
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const callId = ++id;
      pending.set(callId, { resolve });
      socket.send(JSON.stringify({ id: callId, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  return { target, socket, send };
}

async function evaluate(send, expression) {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.result.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.text);
  }
  return response.result.result.value;
}

async function capture(send, name) {
  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(screenshot.result.data, 'base64'));
}

async function load(send, width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send('Page.navigate', { url: baseUrl });
  await new Promise((resolve) => setTimeout(resolve, 800));
  await evaluate(send, "localStorage.setItem('crashout_onboarded_v1', '1')");
  await send('Page.reload');
  await new Promise((resolve) => setTimeout(resolve, 900));
}

async function measure(send, name) {
  return evaluate(
    send,
    `(() => {
      const selectors = ['.app', '.app-header', '.nav-island', '.game-aside', '.arena', '.round-console', '.app-footer', '.history-panel', '.sheet'];
      const rects = {};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        rects[selector] = {
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      }
      const inspected = [...document.querySelectorAll('button, .chip, .ticker, .panel, .verdict, .history-panel, .sheet')];
      const overflow = inspected
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1;
        })
        .slice(0, 24)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            className: String(element.className),
            text: element.textContent.trim().slice(0, 48),
            rect: {
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          };
        });
      return {
        name: ${JSON.stringify(name)},
        phase: document.querySelector('.primary')?.textContent.trim() ?? null,
        innerWidth,
        innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        activeElement: document.activeElement?.className ?? null,
        rects,
        overflow
      };
    })()`,
  );
}

async function click(send, selector) {
  return evaluate(
    send,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return false;
      element.click();
      return true;
    })()`,
  );
}

async function waitForPrimary(send, predicate, timeout = 5000) {
  const started = Date.now();
  let label = '';
  while (Date.now() - started < timeout) {
    label = await evaluate(send, "document.querySelector('.primary')?.textContent.trim() ?? ''");
    if (predicate(label)) return label;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return label;
}

async function driveMatch(send) {
  for (let i = 0; i < 18; i += 1) {
    const label = await evaluate(send, "document.querySelector('.primary')?.textContent.trim() ?? ''");
    await click(send, '.primary');
    await new Promise((resolve) => setTimeout(resolve, label.includes('CASH OUT') ? 350 : 700));
    const nextLabel = await evaluate(send, "document.querySelector('.primary')?.textContent.trim() ?? ''");
    if (nextLabel.includes('CASH OUT')) {
      await click(send, '.primary');
      await waitForPrimary(send, (text) => !text.includes('LOCKED') && !text.includes('CASH OUT'), 5000);
    }
    const verdict = await evaluate(send, "document.querySelector('.verdict.match .vmain')?.textContent.trim() ?? ''");
    if (verdict) return verdict;
  }
  return null;
}

const viewports = [
  ['desktop', 1440, 900],
  ['tablet', 820, 1180],
  ['mobile', 390, 844],
  ['short-mobile', 390, 640],
];

const { target, socket, send } = await openPage();
const results = [];

try {
  for (const [name, width, height] of viewports) {
    await load(send, width, height);
    results.push(await measure(send, `${name}-idle`));
    await capture(send, `${name}-idle`);

    await click(send, '.nav-item[aria-label="History"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    results.push(await measure(send, `${name}-history`));

    await click(send, '.nav-item[aria-label="Settings"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    results.push(await measure(send, `${name}-settings`));

    await click(send, '.nav-item[aria-label="Game"]');
    await new Promise((resolve) => setTimeout(resolve, 250));
    await click(send, '.primary');
    await new Promise((resolve) => setTimeout(resolve, 700));
    results.push(await measure(send, `${name}-running`));
    await capture(send, `${name}-running`);

    await click(send, '.primary');
    await waitForPrimary(send, (text) => !text.includes('LOCKED') && !text.includes('CASH OUT'), 5000);
    results.push(await measure(send, `${name}-round-end`));
    await capture(send, `${name}-round-end`);

    const matchVerdict = await driveMatch(send);
    results.push({ ...(await measure(send, `${name}-match-end`)), matchVerdict });
    await capture(send, `${name}-match-end`);
  }
} finally {
  fs.writeFileSync(path.join(outDir, 'measurements.json'), `${JSON.stringify(results, null, 2)}\n`);
  await send('Target.closeTarget', { targetId: target.id });
  socket.close();
}

console.log(`Wrote smoke screenshots and measurements to ${outDir}`);
console.log(JSON.stringify(results.map(({ name, phase, innerWidth, innerHeight, documentHeight, bodyHeight, overflow, matchVerdict }) => ({
  name,
  phase,
  innerWidth,
  innerHeight,
  documentHeight,
  bodyHeight,
  overflowCount: overflow.length,
  matchVerdict,
})), null, 2));
