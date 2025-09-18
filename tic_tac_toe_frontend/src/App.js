import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Types
const EMPTY_BOARD = Array(9).fill(null);
const MODES = {
  HUMAN: 'Human vs Human',
  CPU: 'Human vs Computer',
};

// Helpers
const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function getWinner(cells) {
  for (const [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { player: cells[a], line: [a, b, c] };
    }
  }
  if (cells.every(Boolean)) return { player: 'draw', line: [] };
  return null;
}

function availableMoves(cells) {
  const moves = [];
  cells.forEach((cell, idx) => {
    if (!cell) moves.push(idx);
  });
  return moves;
}

function minimax(cells, isMaximizing, ai, human) {
  const win = getWinner(cells);
  if (win?.player === ai) return { score: 10 };
  if (win?.player === human) return { score: -10 };
  if (cells.every(Boolean)) return { score: 0 };

  if (isMaximizing) {
    let best = { score: -Infinity, move: null };
    for (const move of availableMoves(cells)) {
      const next = cells.slice();
      next[move] = ai;
      const result = minimax(next, false, ai, human);
      if (result.score > best.score) best = { score: result.score, move };
    }
    return best;
  } else {
    let best = { score: Infinity, move: null };
    for (const move of availableMoves(cells)) {
      const next = cells.slice();
      next[move] = human;
      const result = minimax(next, true, ai, human);
      if (result.score < best.score) best = { score: result.score, move };
    }
    return best;
  }
}

// PUBLIC_INTERFACE
export default function App() {
  /** The main application shell for the Tic Tac Toe game. */
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState(MODES.CPU);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, Draws: 0 });
  const [history, setHistory] = useState([EMPTY_BOARD]);
  const [statusMsg, setStatusMsg] = useState('');

  const winner = useMemo(() => getWinner(board), [board]);
  const currentPlayer = xIsNext ? 'X' : 'O';
  const aiPlayer = 'O';
  const humanPlayer = 'X';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // CPU autocall
    if (mode === MODES.CPU && !winner && !xIsNext) {
      const timer = setTimeout(() => {
        const best = minimax(board, true, aiPlayer, humanPlayer);
        handleMove(best.move);
      }, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, xIsNext, mode]);

  useEffect(() => {
    // Update status
    if (winner?.player && winner.player !== 'draw') {
      setStatusMsg(`Winner: ${winner.player}`);
      setScores(prev => ({ ...prev, [winner.player]: prev[winner.player] + 1 }));
    } else if (winner?.player === 'draw') {
      setStatusMsg('It’s a draw.');
      setScores(prev => ({ ...prev, Draws: prev.Draws + 1 }));
    } else {
      setStatusMsg(`Turn: ${currentPlayer}`);
    }
  }, [winner, currentPlayer]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const resetBoard = () => {
    setBoard(EMPTY_BOARD);
    setXIsNext(true);
    setHistory([EMPTY_BOARD]);
  };

  const newMatch = () => {
    resetBoard();
    setScores({ X: 0, O: 0, Draws: 0 });
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    newMatch();
  };

  const handleMove = (idx) => {
    if (winner || board[idx]) return;
    const next = board.slice();
    next[idx] = currentPlayer;
    setBoard(next);
    setXIsNext(!xIsNext);
    setHistory(h => [...h, next]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    const prevBoard = newHistory[newHistory.length - 1];
    setBoard(prevBoard);
    setXIsNext((newHistory.length - 1) % 2 === 0);
  };

  return (
    <div className="app-wrapper">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-badge">T3</span>
          <div className="brand-text">
            <div className="brand-title">Tic Tac Toe</div>
            <div className="brand-subtitle">Ocean Professional</div>
          </div>
        </div>
        <div className="nav-actions">
          <button className="btn ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </nav>

      <main className="container">
        <section className="panel score-panel">
          <div className="scores">
            <ScoreCard label="Player X" value={scores.X} accent="blue" />
            <ScoreCard label="Draws" value={scores.Draws} accent="gray" />
            <ScoreCard label={mode === MODES.CPU ? 'Computer (O)' : 'Player O'} value={scores.O} accent="amber" />
          </div>

          <div className="controls">
            <div className="mode">
              <label htmlFor="mode-select" className="label">Mode</label>
              <select
                id="mode-select"
                className="select"
                value={mode}
                onChange={(e) => changeMode(e.target.value)}
              >
                <option value={MODES.CPU}>Human vs Computer</option>
                <option value={MODES.HUMAN}>Human vs Human</option>
              </select>
            </div>
            <div className="buttons">
              <button className="btn primary" onClick={resetBoard} aria-label="Reset board">Reset Round</button>
              <button className="btn outline" onClick={newMatch} aria-label="New match">New Match</button>
              <button className="btn ghost" onClick={undo} aria-label="Undo move" disabled={history.length <= 1}>Undo</button>
            </div>
          </div>
        </section>

        <section className="board-section">
          <StatusBar text={statusMsg} />
          <Board
            cells={board}
            onClick={handleMove}
            winningLine={winner?.line ?? []}
            disabled={Boolean(winner) || (mode === MODES.CPU && !xIsNext)}
          />
        </section>

        <section className="panel info-panel">
          <Instructions />
        </section>
      </main>

      <footer className="footer">
        <span>Built with React • Ocean Professional theme</span>
      </footer>
    </div>
  );
}

function StatusBar({ text }) {
  return (
    <div className="status-bar" role="status" aria-live="polite">
      {text}
    </div>
  );
}

function ScoreCard({ label, value, accent }) {
  return (
    <div className={`score-card accent-${accent}`}>
      <div className="score-label">{label}</div>
      <div className="score-value">{value}</div>
    </div>
  );
}

function Instructions() {
  return (
    <div className="instructions">
      <h3>How to Play</h3>
      <ul>
        <li>Choose a mode: play a friend locally or the computer.</li>
        <li>X always starts. Tap a square to place your mark.</li>
        <li>Get three in a row horizontally, vertically, or diagonally to win.</li>
        <li>Use Reset Round to play again, or New Match to clear the scoreboard.</li>
        <li>Undo lets you step back one move (local games only).</li>
      </ul>
      <p className="tip">Tip: In computer mode, the AI plays optimally.</p>
    </div>
  );
}

function Square({ value, onClick, highlight, disabled }) {
  return (
    <button
      className={`square ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Board square ${value ? value : 'empty'}`}
    >
      {value}
    </button>
  );
}

function Board({ cells, onClick, winningLine, disabled }) {
  return (
    <div className="board" role="grid" aria-label="Tic Tac Toe board">
      {cells.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          onClick={() => onClick(idx)}
          highlight={winningLine.includes(idx)}
          disabled={disabled || Boolean(val)}
        />
      ))}
    </div>
  );
}
