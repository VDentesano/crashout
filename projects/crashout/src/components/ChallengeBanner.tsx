/**
 * ChallengeBanner — shown on load when the URL has `?c=<multiplier>`.
 * Dismissable. Anchors the viral loop: someone shared → new player sees the target.
 */
interface Props {
  multiplier: string;
  onDismiss: () => void;
}

export default function ChallengeBanner({ multiplier, onDismiss }: Props) {
  return (
    <div className="challenge-banner">
      <span className="challenge-text">
        Someone cashed out at <strong>{multiplier}×</strong> — beat them.
      </span>
      <button className="challenge-dismiss" onClick={onDismiss} aria-label="Dismiss challenge">
        ✕
      </button>
    </div>
  );
}
