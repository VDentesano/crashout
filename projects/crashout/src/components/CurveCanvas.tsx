import { useEffect, useRef } from 'react';
import { GROWTH_RATE, multiplierAt } from '../game/crashEngine';

interface Props {
  multiplier: number;
  crashed: boolean;
}

/** Live, self-scaling plot of the true exponential crash curve. */
export default function CurveCanvas({ multiplier, crashed }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { clientWidth: w, clientHeight: h } = canvas;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const elapsed = Math.max(0, Math.log(multiplier) / GROWTH_RATE);
    const tMax = Math.max(elapsed * 1.12, 800);
    const mMax = Math.max(multiplier * 1.18, 1.7);
    const pad = 6;

    const xOf = (t: number) => pad + (t / tMax) * (w - pad * 2);
    const yOf = (m: number) => h - pad - ((m - 1) / (mMax - 1)) * (h - pad * 2);

    const stroke = crashed ? '#FF3B30' : '#00FF85';
    const N = 90;

    // Filled area under the curve.
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(1));
    for (let i = 0; i <= N; i++) {
      const t = (tMax * i) / N;
      if (t > elapsed) break;
      ctx.lineTo(xOf(t), yOf(multiplierAt(t)));
    }
    ctx.lineTo(xOf(elapsed), h - pad);
    ctx.lineTo(xOf(0), h - pad);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, crashed ? 'rgba(255,59,48,0.22)' : 'rgba(0,255,133,0.20)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // The curve line.
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(1));
    for (let i = 0; i <= N; i++) {
      const t = (tMax * i) / N;
      if (t > elapsed) break;
      ctx.lineTo(xOf(t), yOf(multiplierAt(t)));
    }
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    ctx.shadowBlur = 16;
    ctx.stroke();

    // Leading dot.
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(xOf(elapsed), yOf(multiplier), crashed ? 6 : 5, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
  }, [multiplier, crashed]);

  return <canvas ref={ref} className="curve" />;
}
