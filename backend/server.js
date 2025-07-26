const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Game state management
const rooms = new Map();

class OthelloGame {
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'black';
    this.players = {
      black: { emoji: '😎', name: 'Player 1' },
      white: { emoji: '🤖', name: 'Player 2' }
    };
    this.gameOver = false;
    this.winner = null;
  }

  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    // Initial setup
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  }

  isValidMove(row, col, player) {
    if (this.board[row][col] !== null) return false;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      if (this.wouldCaptureInDirection(row, col, dr, dc, player)) {
        return true;
      }
    }
    return false;
  }

  wouldCaptureInDirection(row, col, dr, dc, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    let r = row + dr;
    let c = col + dc;
    let hasOpponentBetween = false;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (this.board[r][c] === null) return false;
      if (this.board[r][c] === opponent) {
        hasOpponentBetween = true;
      } else if (this.board[r][c] === player) {
        return hasOpponentBetween;
      }
      r += dr;
      c += dc;
    }
    return false;
  }

  makeMove(row, col, player) {
    if (!this.isValidMove(row, col, player)) return false;

    this.board[row][col] = player;
    this.captureInAllDirections(row, col, player);
    
    // Switch player
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    
    // Check if next player has valid moves
    if (!this.hasValidMoves(this.currentPlayer)) {
      // Switch back if opponent can't move
      this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
      
      // If current player also can't move, game over
      if (!this.hasValidMoves(this.currentPlayer)) {
        this.gameOver = true;
        this.determineWinner();
      }
    }

    return true;
  }

  captureInAllDirections(row, col, player) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      this.captureInDirection(row, col, dr, dc, player);
    }
  }

  captureInDirection(row, col, dr, dc, player) {
    if (!this.wouldCaptureInDirection(row, col, dr, dc, player)) return;

    const opponent = player === 'black' ? 'white' : 'black';
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === opponent) {
      this.board[r][c] = player;
      r += dr;
      c += dc;
    }
  }

  hasValidMoves(player) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col, player)) {
          return true;
        }
      }
    }
    return false;
  }

  getValidMoves(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col, player)) {
          moves.push([row, col]);
        }
      }
    }
    return moves;
  }

  determineWinner() {
    const scores = this.getScores();
    if (scores.black > scores.white) {
      this.winner = 'black';
    } else if (scores.white > scores.black) {
      this.winner = 'white';
    } else {
      this.winner = 'tie';
    }
  }

  getScores() {
    let black = 0, white = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === 'black') black++;
        else if (this.board[row][col] === 'white') white++;
      }
    }
    return { black, white };
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'black';
    this.gameOver = false;
    this.winner = null;
  }
}

// Generate room ID
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create room
  socket.on('create_room', (playerName) => {
    const roomId = generateRoomId();
    const game = new OthelloGame();
    
    rooms.set(roomId, {
      id: roomId,
      game,
      players: [{ id: socket.id, name: playerName, color: 'black', emoji: '😎' }],
      messages: []
    });

    socket.join(roomId);
    socket.emit('room_created', { roomId, game: game, color: 'black' });
  });

  // Join room
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', 'Room is full');
      return;
    }

    const color = room.players.length === 0 ? 'black' : 'white';
    const emoji = color === 'black' ? '😎' : '🤖';
    
    room.players.push({ id: socket.id, name: playerName, color, emoji });
    socket.join(roomId);

    // Update game players
    room.game.players[color] = { emoji, name: playerName };

    socket.emit('room_joined', { roomId, game: room.game, color });
    io.to(roomId).emit('player_joined', { 
      players: room.players, 
      game: room.game 
    });

    // Send existing messages to new player
    socket.emit('chat_history', room.messages);
  });

  // Make move
  socket.on('make_move', ({ roomId, row, col }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.color !== room.game.currentPlayer) return;

    if (room.game.makeMove(row, col, player.color)) {
      io.to(roomId).emit('game_updated', room.game);
    }
  });

  // Update player emoji
  socket.on('update_emoji', ({ roomId, emoji }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    player.emoji = emoji;
    room.game.players[player.color].emoji = emoji;

    io.to(roomId).emit('game_updated', room.game);
  });

  // Reset game
  socket.on('reset_game', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.game.resetGame();
    io.to(roomId).emit('game_updated', room.game);
  });

  // Chat message
  socket.on('send_message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const chatMessage = {
      id: Date.now(),
      playerName: player.name,
      message,
      timestamp: new Date().toISOString()
    };

    room.messages.push(chatMessage);
    
    // Keep only last 100 messages
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    io.to(roomId).emit('new_message', chatMessage);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from rooms
    for (const [roomId, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('player_left', { players: room.players });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
