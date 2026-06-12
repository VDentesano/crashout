/**
 * ShareChallenge — shown after a round or match resolves when the player cashed out.
 * One-click copy of a challenge link with the cashout multiplier as `?c=` param.
 */
import { useState } from 'react';

const BASE_URL = 'https://crashout-euq.pages.dev';

interface Props {
  multiplier: number;
}

export default function ShareChallenge({ multiplier }: Props) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);

  const mx = multiplier.toFixed(2);
  const url = `${BASE_URL}/?c=${mx}`;
  const text = `I cashed out at ${mx}× on CRASHOUT — beat me: ${url}`;

  function handleCopy() {
    if (!navigator.clipboard?.writeText) {
      setFallback(true);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setFallback(true));
  }

  if (fallback) {
    return (
      <div className="share-challenge-fallback">
        <span className="share-challenge-fallback-label">COPY MANUALLY</span>
        <input
          className="share-challenge-fallback-text"
          type="text"
          readOnly
          value={text}
          onFocus={(e) => e.target.select()}
        />
      </div>
    );
  }

  return (
    <button className={`share-challenge ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? (
        <>✓ COPIED</>
      ) : (
        <>⬆ SHARE {mx}× CHALLENGE</>
      )}
    </button>
  );
}
