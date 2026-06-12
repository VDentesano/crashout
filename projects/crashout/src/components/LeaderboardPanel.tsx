import { useEffect, useState } from 'react';
import { playerId as currentPlayerId } from '../analytics/logger';
import {
  fetchLeaderboard,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type LeaderboardWindow,
} from '../game/leaderboard';

function fmtValue(value: number, metric: LeaderboardMetric): string {
  if (metric === 'netDelta') return `${value >= 0 ? '+' : ''}${value}`;
  if (metric === 'bestCashout') return `${value.toFixed(2)}×`;
  return `${Math.round(value * 100)}%`;
}

function truncate(id: string, max = 10): string {
  return id.length > max ? id.slice(0, max) + '…' : id;
}

export default function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const [metric, setMetric] = useState<LeaderboardMetric>('netDelta');
  const [window, setWindow] = useState<LeaderboardWindow>('all');
  const [data, setData] = useState<{ leaderboard: LeaderboardEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetchLeaderboard({ metric, window, limit: 20 }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [metric, window]);

  const metricLabel: Record<LeaderboardMetric, string> = {
    netDelta: 'NET',
    bestCashout: 'BEST ×',
    winRate: 'WIN %',
  };

  const valueAccent = (entry: LeaderboardEntry): 'volt' | 'crash' | 'gold' | undefined => {
    if (metric === 'netDelta') return entry.value >= 0 ? 'volt' : 'crash';
    if (metric === 'bestCashout') return 'gold';
    return undefined;
  };

  return (
    <>
      <button className="sheet-backdrop" aria-label="Close leaderboard" onClick={onClose} />
      <div className="history-panel" role="dialog" aria-label="Global leaderboard">
        <div className="history-header">
          <span className="history-title">LEADERBOARD</span>
          <button className="history-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Metric tabs */}
        <div className="lb-tabs">
          {(['netDelta', 'bestCashout', 'winRate'] as LeaderboardMetric[]).map((m) => (
            <button
              key={m}
              className={`lb-tab ${metric === m ? 'active' : ''}`}
              onClick={() => setMetric(m)}
            >
              {metricLabel[m]}
            </button>
          ))}
        </div>

        {/* Window toggle */}
        <div className="lb-windows">
          {(['all', '7d'] as LeaderboardWindow[]).map((w) => (
            <button
              key={w}
              className={`lb-win ${window === w ? 'active' : ''}`}
              onClick={() => setWindow(w)}
            >
              {w === 'all' ? 'ALL TIME' : '7 DAYS'}
            </button>
          ))}
        </div>

        {loading && <div className="history-empty">Loading…</div>}

        {!loading && !data && (
          <div className="history-empty">Unavailable offline.</div>
        )}

        {!loading && data && data.leaderboard.length === 0 && (
          <div className="history-empty">
            {metric === 'winRate'
              ? 'No players with ≥5 matches yet.'
              : 'No data yet — play some matches!'}
          </div>
        )}

        {!loading && data && data.leaderboard.length > 0 && (
          <div className="history-list">
            {data.leaderboard.map((entry) => {
              const isMe = entry.playerId === currentPlayerId;
              const accent = valueAccent(entry);
              return (
                <div
                  key={entry.playerId}
                  className={`lb-row${isMe ? ' lb-row-me' : ''}`}
                >
                  <span className="lb-rank">#{entry.rank}</span>
                  <span className="lb-player" title={entry.playerId}>
                    {truncate(entry.playerId)}{isMe ? ' ★' : ''}
                  </span>
                  <span className="lb-matches">{entry.matchesPlayed}m</span>
                  <span className={`lb-value ${accent ? `history-accent-${accent}` : ''}`}>
                    {fmtValue(entry.value, metric)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
