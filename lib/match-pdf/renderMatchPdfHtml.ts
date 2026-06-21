import { escapeHtml } from "./formatters";
import type {
  ErrorsWinnersBlock,
  GameScoreRow,
  GameTimeline,
  MatchPdfPayload,
  RubberSection,
  ShotAnalysisBlock,
  StatsBlock,
} from "./types";

const PRIMARY = "#4F46E5";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

function renderPlayerLine(
  player: { name: string; location?: string; isWinner: boolean },
  sets: number
): string {
  const location = player.location
    ? `<span class="location">${escapeHtml(player.location)}</span>`
    : "";
  const winnerClass = player.isWinner ? " winner" : "";
  return `
    <div class="player-row${winnerClass}">
      <div class="player-name">
        ${escapeHtml(player.name)}
        ${location}
      </div>
      <div class="player-score">${sets}</div>
    </div>`;
}

function renderScoreTable(
  games: GameScoreRow[],
  side1Name: string,
  side2Name: string,
  side1GamesWon: number,
  side2GamesWon: number,
  totalDuration?: string
): string {
  const rows = games
    .map((g) => {
      const s1Class = g.winnerSide === "side1" ? "win-cell" : "";
      const s2Class = g.winnerSide === "side2" ? "win-cell" : "";
      return `
        <tr>
          <td>Game ${g.gameNumber}</td>
          <td class="${s1Class}">${g.side1Score}</td>
          <td class="${s2Class}">${g.side2Score}</td>
          <td>${escapeHtml(g.duration ?? "—")}</td>
        </tr>`;
    })
    .join("");

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Game</th>
          <th>${escapeHtml(side1Name)}</th>
          <th>${escapeHtml(side2Name)}</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="totals-row">
          <td><strong>Games won</strong></td>
          <td><strong>${side1GamesWon}</strong></td>
          <td><strong>${side2GamesWon}</strong></td>
          <td>${totalDuration ? `<strong>${escapeHtml(totalDuration)}</strong>` : "—"}</td>
        </tr>
      </tbody>
    </table>`;
}

function renderTimeline(timeline: GameTimeline[]): string {
  return timeline
    .map((game) => {
      const points = game.points
        .map(
          (p) =>
            `<span class="point${p.streakHighlight ? " streak" : ""}">${p.pointNumber}. ${escapeHtml(p.scorerLabel)} (${p.scoreAfter}${p.stroke ? ` · ${escapeHtml(p.stroke)}` : ""})</span>`
        )
        .join("");
      const streaks =
        game.streakNotes.length > 0
          ? `<div class="streak-notes">${game.streakNotes.map((n) => `<em>${escapeHtml(n)}</em>`).join(" · ")}</div>`
          : "";
      return `
        <div class="timeline-game">
          <h4>Game ${game.gameNumber}</h4>
          <div class="point-sequence">${points}</div>
          ${streaks}
        </div>`;
    })
    .join("");
}

function renderStats(stats: StatsBlock): string {
  const pct = (won: number, total: number) =>
    total > 0 ? `${Math.round((won / total) * 100)}%` : "—";

  return `
    <table class="data-table stats-table">
      <thead>
        <tr>
          <th>Stat</th>
          <th>${escapeHtml(stats.side1Name)}</th>
          <th>${escapeHtml(stats.side2Name)}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Service points won</td>
          <td>${stats.servePointsWon[0]} (${pct(stats.servePointsWon[0], stats.serveTotals[0])})</td>
          <td>${stats.servePointsWon[1]} (${pct(stats.servePointsWon[1], stats.serveTotals[1])})</td>
        </tr>
        <tr>
          <td>Return points won</td>
          <td>${stats.receivePointsWon[0]} (${pct(stats.receivePointsWon[0], stats.receiveTotals[0])})</td>
          <td>${stats.receivePointsWon[1]} (${pct(stats.receivePointsWon[1], stats.receiveTotals[1])})</td>
        </tr>
        <tr>
          <td>Longest point streak</td>
          <td>${stats.longestStreak[0]}</td>
          <td>${stats.longestStreak[1]}</td>
        </tr>
        <tr>
          <td>Clutch points won</td>
          <td>${stats.clutchPointsWon[0]}</td>
          <td>${stats.clutchPointsWon[1]}</td>
        </tr>
        <tr>
          <td>Deuce points won</td>
          <td>${stats.deucePointsWon[0]}</td>
          <td>${stats.deucePointsWon[1]}</td>
        </tr>
      </tbody>
    </table>`;
}

function renderErrorsWinners(block: ErrorsWinnersBlock, side1Name: string, side2Name: string): string {
  return `
    <table class="data-table">
      <thead>
        <tr>
          <th></th>
          <th>${escapeHtml(side1Name)}</th>
          <th>${escapeHtml(side2Name)}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Winners</td><td>${block.side1.winners}</td><td>${block.side2.winners}</td></tr>
        <tr><td>Errors (net)</td><td>${block.side1.errors}</td><td>${block.side2.errors}</td></tr>
      </tbody>
    </table>
    <p class="note">Errors counted from net-point strokes only; full forced/unforced taxonomy is not tracked.</p>`;
}

function renderShotAnalysis(blocks: ShotAnalysisBlock[]): string {
  return blocks
    .map((block) => {
      const strokes = block.strokes
        .slice(0, 8)
        .map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${s.count}</td></tr>`)
        .join("");
      const zoneTotal = block.zones.left + block.zones.mid + block.zones.right;
      const zones =
        zoneTotal > 0
          ? `<p class="zone-line">Placement: Left ${block.zones.left} · Mid ${block.zones.mid} · Right ${block.zones.right}</p>`
          : "";
      return `
        <div class="shot-block">
          <h4>${escapeHtml(block.playerName)}</h4>
          <table class="data-table compact">
            <thead><tr><th>Shot type</th><th>Count</th></tr></thead>
            <tbody>${strokes}</tbody>
          </table>
          ${zones}
        </div>`;
    })
    .join("");
}

function renderRubberSection(rubber: RubberSection): string {
  const resultLine = `${escapeHtml(rubber.side1Name)} ${rubber.side1Sets} – ${rubber.side2Sets} ${escapeHtml(rubber.side2Name)}`;
  let extra = "";
  if (rubber.sections.stats && rubber.stats) {
    extra += `<div class="section"><h3>Stats</h3>${renderStats(rubber.stats)}</div>`;
  }
  if (rubber.sections.timeline && rubber.timeline) {
    extra += `<div class="section"><h3>Point Timeline (winning shots)</h3>${renderTimeline(rubber.timeline)}</div>`;
  }
  if (rubber.sections.shotAnalysis && rubber.shotAnalysis) {
    extra += `<div class="section"><h3>Shot Analysis</h3>${renderShotAnalysis(rubber.shotAnalysis)}</div>`;
  }
  if (rubber.sections.matchTimeline && rubber.matchTimeline?.length) {
    extra += `<div class="section"><h3>Key Moments</h3><ul>${rubber.matchTimeline.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul></div>`;
  }

  return `
    <div class="rubber page-break">
      <h2>${escapeHtml(rubber.title)}</h2>
      <p class="rubber-result">${resultLine}</p>
      ${renderScoreTable(
        rubber.games,
        rubber.side1Name,
        rubber.side2Name,
        rubber.side1GamesWon,
        rubber.side2GamesWon
      )}
      ${extra}
    </div>`;
}

export function renderMatchPdfHtml(payload: MatchPdfPayload): string {
  const headerTitle =
    payload.matchType === "tournament" && payload.tournamentName
      ? escapeHtml(payload.tournamentName)
      : "Friendly Match";

  const logoHtml = payload.tournamentLogoUrl
    ? `<img class="tournament-logo" src="${escapeHtml(payload.tournamentLogoUrl)}" alt="Tournament logo" />`
    : `<div class="brand-mark">TTPro</div>`;

  const metaParts = [
    `Match ID: ${escapeHtml(payload.shortMatchId)}`,
    payload.matchDate !== "—" ? payload.matchDate : null,
    payload.venue ? escapeHtml(payload.venue) : null,
    payload.city ? escapeHtml(payload.city) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const roundHtml =
    payload.sections.roundInfo && payload.roundLabel
      ? `<p class="round-label">${escapeHtml(payload.roundLabel)}</p>`
      : "";

  const teamLogos =
    payload.isTeamTie && (payload.side1LogoUrl || payload.side2LogoUrl)
      ? `<div class="team-logos">
          ${payload.side1LogoUrl ? `<img src="${escapeHtml(payload.side1LogoUrl)}" alt="" />` : ""}
          ${payload.side2LogoUrl ? `<img src="${escapeHtml(payload.side2LogoUrl)}" alt="" />` : ""}
        </div>`
      : "";

  let bodySections = "";

  if (payload.isTeamTie && payload.rubbers?.length) {
    bodySections += payload.rubbers.map(renderRubberSection).join("");
  } else {
    bodySections += `
      <div class="section">
        <h3>Score Breakdown</h3>
        ${renderScoreTable(
          payload.games,
          payload.side1Name,
          payload.side2Name,
          payload.side1GamesWon,
          payload.side2GamesWon,
          payload.totalMatchDuration
        )}
      </div>`;
  }

  if (!payload.isTeamTie) {
    if (payload.sections.timeline && payload.timeline) {
      bodySections += `<div class="section"><h3>Point Timeline (winning shots)</h3>${renderTimeline(payload.timeline)}</div>`;
    }
    if (payload.sections.stats && payload.stats) {
      bodySections += `<div class="section"><h3>Match Stats</h3>${renderStats(payload.stats)}</div>`;
    }
    if (payload.sections.errorsVsWinners && payload.errorsVsWinners) {
      bodySections += `<div class="section"><h3>Winners vs Errors</h3>${renderErrorsWinners(payload.errorsVsWinners, payload.side1Name, payload.side2Name)}</div>`;
    }
    if (payload.sections.shotAnalysis && payload.shotAnalysis) {
      bodySections += `<div class="section"><h3>Shot Analysis</h3>${renderShotAnalysis(payload.shotAnalysis)}</div>`;
    }
  }

  if (payload.sections.matchTimeline && payload.matchTimeline?.length) {
    bodySections += `<div class="section"><h3>Match Timeline</h3><ul class="timeline-list">${payload.matchTimeline.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul></div>`;
  }

  if (payload.sections.achievements && payload.achievements?.length) {
    bodySections += `<div class="section"><h3>Highlights</h3><ul class="achievements">${payload.achievements.map((a) => `<li><strong>${escapeHtml(a.title)}</strong> — ${escapeHtml(a.description)}</li>`).join("")}</ul></div>`;
  }

  const recordedStamp = payload.isRecorded
    ? `<span class="stamp">Match Recorded</span>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 18mm 14mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${TEXT};
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid ${PRIMARY};
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-left { flex: 1; }
    .header-right { text-align: right; min-width: 72px; }
    .tournament-logo { max-height: 48px; max-width: 120px; object-fit: contain; }
    .brand-mark {
      font-size: 20px;
      font-weight: 800;
      color: ${PRIMARY};
      letter-spacing: -0.02em;
    }
    h1 { font-size: 20px; margin: 0 0 4px; color: ${TEXT}; }
    .meta { color: ${MUTED}; font-size: 10px; margin: 0; }
    .round-label {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      background: #eef2ff;
      color: ${PRIMARY};
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    .players {
      background: #f8fafc;
      border: 1px solid ${BORDER};
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .player-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${BORDER};
    }
    .player-row:last-child { border-bottom: none; }
    .player-name { font-size: 14px; font-weight: 600; }
    .player-row.winner .player-name { font-weight: 700; }
    .player-score { font-size: 22px; font-weight: 800; color: ${TEXT}; }
    .player-row.winner .player-score { color: ${PRIMARY}; }
    .location { font-size: 10px; color: ${MUTED}; font-weight: 400; margin-left: 4px; }
    .section { margin-bottom: 18px; }
    .section h3 {
      font-size: 13px;
      color: ${PRIMARY};
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .data-table th, .data-table td {
      border: 1px solid ${BORDER};
      padding: 6px 8px;
      text-align: center;
    }
    .data-table th {
      background: #f1f5f9;
      font-weight: 600;
      text-align: center;
    }
    .data-table th:first-child, .data-table td:first-child { text-align: left; }
    .win-cell { font-weight: 700; }
    .totals-row { background: #f8fafc; }
    .timeline-game { margin-bottom: 10px; }
    .timeline-game h4 { margin: 0 0 4px; font-size: 11px; }
    .point-sequence { line-height: 1.6; }
    .point { display: inline-block; margin: 0 6px 4px 0; padding: 2px 4px; background: #f8fafc; border-radius: 3px; }
    .point.streak { background: #fef3c7; font-weight: 600; }
    .streak-notes { color: ${MUTED}; font-size: 9px; margin-top: 4px; }
    .note { color: ${MUTED}; font-size: 9px; font-style: italic; }
    .shot-block { margin-bottom: 12px; }
    .shot-block h4 { margin: 0 0 6px; font-size: 11px; }
    .zone-line { font-size: 10px; color: ${MUTED}; margin: 4px 0 0; }
    .rubber { margin-top: 8px; padding-top: 8px; border-top: 1px dashed ${BORDER}; }
    .rubber h2 { font-size: 14px; margin: 0 0 4px; }
    .rubber-result { font-weight: 600; margin: 0 0 10px; }
    .page-break { page-break-before: always; }
    .page-break:first-of-type { page-break-before: auto; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid ${BORDER};
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: ${MUTED};
      font-size: 9px;
    }
    .stamp {
      border: 1px solid ${MUTED};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    ul { margin: 0; padding-left: 18px; }
    li { margin-bottom: 4px; }
    .team-logos img { max-height: 32px; max-width: 64px; margin-left: 8px; object-fit: contain; vertical-align: middle; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${headerTitle}</h1>
      <p class="meta">${metaParts}</p>
      ${roundHtml}
    </div>
    <div class="header-right">${logoHtml}${teamLogos}</div>
  </div>

  <div class="players">
    ${renderPlayerLine(payload.side1, payload.side1Sets)}
    <div style="text-align:center;color:${MUTED};font-size:10px;padding:2px 0;">vs</div>
    ${renderPlayerLine(payload.side2, payload.side2Sets)}
  </div>

  ${bodySections}

  <div class="footer">
    <div>
      ${payload.scorerName ? `Scorer: ${escapeHtml(payload.scorerName)} · ` : ""}
      Generated by TTPro · ${escapeHtml(payload.generatedAt)}
    </div>
    ${recordedStamp}
  </div>
</body>
</html>`;
}
