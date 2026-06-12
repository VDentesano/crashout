/**
 * First-visit "how to play" overlay. Shows once (localStorage), re-openable from
 * the HUD "?" button. Three plain-language rules — the 10-second explainer that
 * keeps a first-timer from bouncing before they understand the duel.
 */
export const ONBOARD_KEY = 'crashout_onboarded_v1';

const STEPS = [
  { n: '01', k: 'RIDE', t: 'The multiplier climbs from 1.00×. The longer you hold, the bigger it grows.' },
  { n: '02', k: 'CASH OUT', t: 'Hit space or tap to bank that round’s points before the crash.' },
  { n: '03', k: 'DON’T CRASH', t: 'Wait too long and the round busts — it scores zero. Greed is the gamble.' },
];

export default function Onboarding({ onClose }: { onClose: () => void }) {
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="How to play CRASHOUT">
      <div className="onboard-card">
        <div className="onboard-tag">HOW TO PLAY</div>
        <div className="onboard-brand">
          CRASH<span>OUT</span>
        </div>
        <p className="onboard-lede">
          A 1v1 duel. Out-cash your opponent across a <b>best-of-5</b> ladder — highest score takes
          the match.
        </p>
        <ol className="onboard-steps">
          {STEPS.map((s) => (
            <li key={s.n} style={{ animationDelay: `${0.12 + Number(s.n) * 0.07}s` }}>
              <span className="step-n">{s.n}</span>
              <span className="step-body">
                <b>{s.k}</b>
                {s.t}
              </span>
            </li>
          ))}
        </ol>
        <button className="onboard-go" onClick={onClose}>
          ENTER THE DUEL →
        </button>
        <p className="onboard-foot">
          Play money — <strong>on-chain crypto duels coming soon.</strong>
        </p>
      </div>
    </div>
  );
}
