import { useEffect, useState } from 'react';
import { fetchHistory, type MatchRecord, type MatchStats } from '../game/history';

function fmt(m: number | null): string {
  return m === null ? 'BUST' : `${m.toFixed(2)}×`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<{ matches: MatchRecord[]; stats: MatchStats } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory(20).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <button className="sheet-backdrop" aria-label="Close history" onClick={onClose} />
      <div className="history-panel" role="dialog" aria-label="Match history">
        <div className="history-header">
          <span className="history-title">MATCH HISTORY</span>
          <button className="history-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && (
          <div className="history-empty">Loading…</div>
        )}

        {!loading && !data && (
          <div className="history-empty">Unavailable offline.</div>
        )}

        {!loading && data && (
          <>
            <div className="history-stats">
              <Stat label="MATCHES" value={String(data.stats.total)} />
              <Stat label="WINS" value={String(data.stats.wins)} accent="volt" />
              <Stat label="LOSSES" value={String(data.stats.losses)} accent="crash" />
              <Stat label="WIN RATE" value={`${Math.round(data.stats.winRate * 100)}%`} />
              <Stat
                label="NET"
                value={`${data.stats.netDelta >= 0 ? '+' : ''}${data.stats.netDelta}`}
                accent={data.stats.netDelta >= 0 ? 'volt' : 'crash'}
              />
              {data.stats.bestCashout !== null && (
                <Stat label="BEST" value={fmt(data.stats.bestCashout)} accent="gold" />
              )}
            </div>

            {data.matches.length === 0 ? (
              <div className="history-empty">No matches yet — play one!</div>
            ) : (
              <div className="history-list">
                {data.matches.map((m) => (
                  <div key={m.id} className={`history-row ${m.outcome}`}>
                    <span className={`history-outcome ${m.outcome}`}>
                      {m.outcome === 'win' ? 'WIN' : m.outcome === 'loss' ? 'LOSS' : 'DRAW'}
                    </span>
                    <span className="history-crash">{fmt(m.cashout_multiplier)}</span>
                    <span className="history-meta">
                      crash {Number(m.crash_point).toFixed(2)}×
                    </span>
                    <span className={`history-delta ${m.delta >= 0 ? 'win' : 'loss'}`}>
                      {m.delta >= 0 ? '+' : ''}{m.delta}
                    </span>
                    <span className="history-time">{timeAgo(m.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'volt' | 'crash' | 'gold';
}) {
  return (
    <div className="history-stat">
      <span className="history-stat-label">{label}</span>
      <span className={`history-stat-value ${accent ? `history-accent-${accent}` : ''}`}>
        {value}
      </span>
    </div>
  );
}
