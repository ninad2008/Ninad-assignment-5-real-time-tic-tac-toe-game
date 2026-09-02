const GameHistoryModel = require('../models/GameHistory');

// In-Memory Game Room State
let players = []; // [{ id, username, symbol }]
let board = Array(9).fill(null);
let currentTurn = 'X';
let gameActive = false;
let moveCount = 0;

// Winning combinations for 3x3 grid
const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

/**
 * Check if current board state has a winner
 * @param {Array} currentBoard 9-element array
 */
function checkWinner(currentBoard) {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return combo;
    }
  }
  return null;
}

/**
 * Reset internal room game state
 */
function resetGameState() {
  board = Array(9).fill(null);
  currentTurn = 'X';
  gameActive = players.length === 2;
  moveCount = 0;
}

/**
 * Initialize Socket.io Events
 * @param {Object} io Socket.io Server instance
 */
function initGameSocket(io) {
  io.on('connection', async (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Broadcast online client count
    io.emit('active-players-count', io.engine.clientsCount);

    // Sync room player state
    socket.emit('players-update', {
      players: players.map(p => ({ username: p.username, symbol: p.symbol })),
      gameActive,
      currentTurn,
      board
    });

    // Send recent game history from model
    try {
      const history = await GameHistoryModel.getRecent(20);
      socket.emit('history-update', history);
    } catch (err) {
      console.error('History fetch error:', err.message);
    }

    /**
     * Event: user-login
     */
    socket.on('user-login', (data) => {
      const username = data && data.username ? data.username.trim() : '';

      if (!username) {
        return socket.emit('login-error', { message: 'Username cannot be empty.' });
      }

      if (players.length >= 2) {
        return socket.emit('login-error', { message: 'Game is full! Maximum 2 players allowed.' });
      }

      if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
        return socket.emit('login-error', { message: 'Username is already taken.' });
      }

      const symbol = players.length === 0 ? 'X' : 'O';
      const newPlayer = { id: socket.id, username, symbol };
      players.push(newPlayer);

      console.log(`👤 Player logged in: ${username} (${symbol})`);

      socket.emit('login-success', {
        username,
        symbol,
        playerIndex: players.length - 1
      });

      io.emit('players-update', {
        players: players.map(p => ({ username: p.username, symbol: p.symbol })),
        gameActive,
        currentTurn,
        board
      });

      if (players.length === 2) {
        resetGameState();
        gameActive = true;
        console.log('🎮 Game started!');
        io.emit('game-start', {
          board,
          turn: currentTurn,
          players: players.map(p => ({ username: p.username, symbol: p.symbol }))
        });
      }
    });

    /**
     * Event: make-move
     */
    socket.on('make-move', async (data) => {
      const { index, symbol } = data;

      if (!gameActive) {
        return socket.emit('move-error', { message: 'Game is not active.' });
      }

      const player = players.find(p => p.id === socket.id);
      if (!player) {
        return socket.emit('move-error', { message: 'Player not found in room.' });
      }

      if (player.symbol !== currentTurn || player.symbol !== symbol) {
        return socket.emit('move-error', { message: "It's not your turn!" });
      }

      if (index < 0 || index > 8 || board[index] !== null) {
        return socket.emit('move-error', { message: 'Invalid move.' });
      }

      board[index] = symbol;
      moveCount++;

      const winningLine = checkWinner(board);

      if (winningLine) {
        gameActive = false;
        const winnerName = player.username;
        const playerX = players.find(p => p.symbol === 'X')?.username || 'Player X';
        const playerO = players.find(p => p.symbol === 'O')?.username || 'Player O';

        console.log(`🏆 Game Won by: ${winnerName}`);

        // Save game record via Model
        await GameHistoryModel.create({
          playerX,
          playerO,
          winner: winnerName,
          totalMoves: moveCount
        });

        const updatedHistory = await GameHistoryModel.getRecent(20);

        io.emit('move-made', { index, symbol, board, nextTurn: null });

        io.emit('game-over', {
          result: 'win',
          winner: winnerName,
          symbol,
          winningLine,
          board,
          history: updatedHistory
        });
      } else if (moveCount === 9) {
        gameActive = false;
        const playerX = players.find(p => p.symbol === 'X')?.username || 'Player X';
        const playerO = players.find(p => p.symbol === 'O')?.username || 'Player O';

        console.log('🤝 Game Draw!');

        // Save draw record via Model
        await GameHistoryModel.create({
          playerX,
          playerO,
          winner: 'Draw',
          totalMoves: moveCount
        });

        const updatedHistory = await GameHistoryModel.getRecent(20);

        io.emit('move-made', { index, symbol, board, nextTurn: null });

        io.emit('game-over', {
          result: 'draw',
          winner: 'Draw',
          symbol: null,
          winningLine: null,
          board,
          history: updatedHistory
        });
      } else {
        currentTurn = currentTurn === 'X' ? 'O' : 'X';
        io.emit('move-made', {
          index,
          symbol,
          board,
          nextTurn: currentTurn
        });
      }
    });

    /**
     * Event: reset-game
     */
    socket.on('reset-game', () => {
      resetGameState();
      console.log('🔄 Game state reset.');
      io.emit('game-reset', {
        board,
        turn: 'X',
        gameActive,
        players: players.map(p => ({ username: p.username, symbol: p.symbol }))
      });
    });

    /**
     * Event: fetch-history
     */
    socket.on('fetch-history', async () => {
      try {
        const history = await GameHistoryModel.getRecent(20);
        socket.emit('history-update', history);
      } catch (err) {
        console.error('Fetch history error:', err.message);
      }
    });

    /**
     * Event: disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      const index = players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        const disconnectedPlayer = players[index];
        players.splice(index, 1);

        console.log(`👋 Player left: ${disconnectedPlayer.username}`);

        gameActive = false;
        board = Array(9).fill(null);
        currentTurn = 'X';
        moveCount = 0;

        io.emit('players-update', {
          players: players.map(p => ({ username: p.username, symbol: p.symbol })),
          gameActive: false,
          currentTurn: 'X',
          board
        });

        io.emit('player-left', {
          message: `${disconnectedPlayer.username} disconnected. Waiting for a new player to join.`,
          board
        });
      }

      io.emit('active-players-count', io.engine.clientsCount);
    });
  });
}

module.exports = initGameSocket;
