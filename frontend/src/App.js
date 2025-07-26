import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const EMOJI_OPTIONS = ['😎', '🤖', '🎮', '🔥', '⭐', '🌟', '💎', '🎯', '🚀', '⚡'];

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState('menu'); // menu, lobby, playing
  const [game, setGame] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [boardTheme, setBoardTheme] = useState('classic');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const BOARD_THEMES = {
    classic: { 
      name: '🌿 Cổ điển', 
      boardBg: '#2d3748', 
      cellBg: '#48bb78', 
      cellValid: '#68d391',
      cellHover: '#38a169'
    },
    ocean: { 
      name: '🌊 Đại dương', 
      boardBg: '#1a365d', 
      cellBg: '#3182ce', 
      cellValid: '#63b3ed',
      cellHover: '#2c5282'
    },
    sunset: { 
      name: '🌅 Hoàng hôn', 
      boardBg: '#744210', 
      cellBg: '#ed8936', 
      cellValid: '#f6ad55',
      cellHover: '#c05621'
    },
    forest: { 
      name: '🌲 Rừng xanh', 
      boardBg: '#1a202c', 
      cellBg: '#38a169', 
      cellValid: '#68d391',
      cellHover: '#2f855a'
    },
    royal: { 
      name: '👑 Hoàng gia', 
      boardBg: '#44337a', 
      cellBg: '#805ad5', 
      cellValid: '#b794f6',
      cellHover: '#6b46c1'
    }
  };

  useEffect(() => {
    // Auto-fill room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setJoinRoomId(roomFromUrl.toUpperCase());
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('room_created', ({ roomId, game, color }) => {
      setRoomId(roomId);
      setGame(game);
      setPlayerColor(color);
      setGameState('lobby');
      toast.success('Phòng đã được tạo!');
    });

    newSocket.on('room_joined', ({ roomId, game, color }) => {
      setRoomId(roomId);
      setGame(game);
      setPlayerColor(color);
      setGameState('lobby');
      toast.success('Đã vào phòng!');
    });

    newSocket.on('player_joined', ({ players, game }) => {
      setPlayers(players);
      setGame(game);
      if (players.length === 2) {
        setGameState('playing');
        toast.success('Bắt đầu trò chơi!');
      }
    });

    newSocket.on('game_updated', (updatedGame) => {
      setGame(updatedGame);
      if (updatedGame.gameOver) {
        toast.success('Trò chơi kết thúc!');
      }
    });

    newSocket.on('player_left', ({ players }) => {
      setPlayers(players);
      toast.error('Một người chơi đã rời phòng');
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('chat_history', (history) => {
      setMessages(history);
    });

    newSocket.on('error', (error) => {
      toast.error(error);
    });

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) {
      toast.error('Vui lòng nhập tên!');
      return;
    }
    socket.emit('create_room', playerName);
  };

  const joinRoom = () => {
    if (!playerName.trim() || !joinRoomId.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    socket.emit('join_room', { roomId: joinRoomId.toUpperCase(), playerName });
  };

  const makeMove = (row, col) => {
    if (game.currentPlayer === playerColor && !game.gameOver) {
      socket.emit('make_move', { roomId, row, col });
    }
  };

  const resetGame = () => {
    socket.emit('reset_game', roomId);
  };

  const updateEmoji = (emoji) => {
    socket.emit('update_emoji', { roomId, emoji });
    setShowEmojiPicker(false);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('send_message', { roomId, message: newMessage });
      setNewMessage('');
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Đã copy link mời bạn bè!');
  };

  const backToMenu = () => {
    setGameState('menu');
    setGame(null);
    setRoomId('');
    setPlayerColor(null);
    setPlayers([]);
    setMessages([]);
  };

  const getValidMoves = () => {
    if (!game || game.gameOver || game.currentPlayer !== playerColor) return [];
    
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(row, col)) {
          moves.push([row, col]);
        }
      }
    }
    return moves;
  };

  const isValidMove = (row, col) => {
    if (!game || game.board[row][col] !== null) return false;

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dr, dc] of directions) {
      if (wouldCaptureInDirection(row, col, dr, dc)) {
        return true;
      }
    }
    return false;
  };

  const wouldCaptureInDirection = (row, col, dr, dc) => {
    const opponent = playerColor === 'black' ? 'white' : 'black';
    let r = row + dr;
    let c = col + dc;
    let hasOpponentBetween = false;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (game.board[r][c] === null) return false;
      if (game.board[r][c] === opponent) {
        hasOpponentBetween = true;
      } else if (game.board[r][c] === playerColor) {
        return hasOpponentBetween;
      }
      r += dr;
      c += dc;
    }
    return false;
  };

  const getScores = () => {
    if (!game) return { black: 0, white: 0 };
    let black = 0, white = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (game.board[row][col] === 'black') black++;
        else if (game.board[row][col] === 'white') white++;
      }
    }
    return { black, white };
  };

  if (gameState === 'menu') {
    return (
      <div className="app">
        <div className="menu-container">
          <div className="menu-card">
            <h1 className="game-title">🎮 Cờ Lật Online</h1>
            
            <div className="input-group">
              <input
                type="text"
                placeholder="Nhập tên của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="menu-buttons">
              <button onClick={createRoom} className="btn btn-primary">
                Tạo phòng mới
              </button>
              
              <div className="join-room-section">
                <input
                  type="text"
                  placeholder="Mã phòng (6 ký tự)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  className="input-field"
                  maxLength="6"
                />
                <button onClick={joinRoom} className="btn btn-secondary">
                  Vào phòng
                </button>
              </div>

              <button onClick={() => setShowThemeSelector(true)} className="btn btn-outline">
                🎨 Chọn màu bàn cờ
              </button>

              <button onClick={() => setShowRules(true)} className="btn btn-outline">
                📖 Luật chơi
              </button>
            </div>
          </div>
        </div>

        {showRules && (
          <div className="modal-overlay" onClick={() => setShowRules(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📖 Luật chơi Cờ Lật (Othello)</h2>
                <button onClick={() => setShowRules(false)} className="close-btn">×</button>
              </div>
              <div className="rules-content">
                <h3>🎯 Mục tiêu:</h3>
                <p>Chiếm được nhiều ô nhất trên bàn cờ 8x8</p>
                
                <h3>🎮 Cách chơi:</h3>
                <ul>
                  <li>Người chơi thứ nhất (đen) đi trước</li>
                  <li>Đặt quân cờ để "kẹp" quân đối thủ theo 8 hướng</li>
                  <li>Tất cả quân bị "kẹp" sẽ chuyển thành màu của bạn</li>
                  <li>Nếu không có nước đi hợp lệ, bạn sẽ bị bỏ lượt</li>
                  <li>Trò chơi kết thúc khi không còn ô trống hoặc cả hai không thể đi</li>
                </ul>

                <h3>🏆 Chiến thắng:</h3>
                <p>Người có nhiều quân cờ hơn khi kết thúc sẽ thắng!</p>
              </div>
            </div>
          </div>
        )}

        {showThemeSelector && (
          <div className="modal-overlay" onClick={() => setShowThemeSelector(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎨 Chọn màu bàn cờ</h2>
                <button onClick={() => setShowThemeSelector(false)} className="close-btn">×</button>
              </div>
              <div className="theme-selector">
                {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                  <div
                    key={key}
                    className={`theme-option ${boardTheme === key ? 'selected' : ''}`}
                    onClick={() => {
                      setBoardTheme(key);
                      setShowThemeSelector(false);
                      toast.success(`Đã chọn theme ${theme.name}`);
                    }}
                  >
                    <div className="theme-preview" style={{
                      background: theme.boardBg,
                      border: `3px solid ${theme.cellBg}`
                    }}>
                      <div className="preview-cells">
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellBg }}
                        ></div>
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellBg }}
                        ></div>
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellValid }}
                        ></div>
                      </div>
                    </div>
                    <span className="theme-name">{theme.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Toaster position="top-center" />
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="app">
        <div className="lobby-container">
          <div className="lobby-card">
            <h2>🏠 Phòng: {roomId}</h2>
            
            <div className="room-info">
              <button onClick={copyRoomLink} className="btn btn-outline">
                📋 Copy link mời
              </button>
              <button onClick={backToMenu} className="btn btn-secondary">
                🏠 Về menu
              </button>
            </div>

            <div className="players-waiting">
              <h3>👥 Người chơi ({players.length}/2):</h3>
              {players.map((player, index) => (
                <div key={index} className="player-info">
                  <span className="player-emoji">{player.emoji}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-color">({player.color === 'black' ? 'Đen' : 'Trắng'})</span>
                </div>
              ))}
            </div>

            {players.length < 2 && (
              <div className="waiting-message">
                <div className="spinner"></div>
                <p>Đang chờ người chơi thứ hai...</p>
              </div>
            )}
          </div>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  if (gameState === 'playing' && game) {
    const scores = getScores();
    const validMoves = getValidMoves();
    const isMyTurn = game.currentPlayer === playerColor;

    return (
      <div className="app playing">
        <div className="game-header">
          <div className="game-info">
            <h2 className="room-id">🏠 {roomId}</h2>
            <div className="turn-indicator">
              {game.gameOver ? (
                <span className="game-over">🎉 Trò chơi kết thúc!</span>
              ) : (
                <span className={`turn ${isMyTurn ? 'my-turn' : ''}`}>
                  {isMyTurn ? '🔥 Lượt của bạn!' : '⏳ Đợi đối thủ...'}
                </span>
              )}
            </div>
          </div>

          <div className="game-controls">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn btn-icon">
              {game.players[playerColor]?.emoji || '😎'}
            </button>
            <button onClick={() => setShowThemeSelector(true)} className="btn btn-icon">
              🎨
            </button>
            <button onClick={() => setShowChat(!showChat)} className="btn btn-icon">
              💬 ({messages.length})
            </button>
            <button onClick={resetGame} className="btn btn-secondary">
              🔄 Ván mới
            </button>
            <button onClick={backToMenu} className="btn btn-outline">
              🏠 Menu
            </button>
          </div>
        </div>

        <div className="game-content">
          <div className="game-board-container">
            <div className="players-bar">
              <div className={`player ${playerColor === 'black' ? 'active' : ''} ${game.currentPlayer === 'black' ? 'current' : ''}`}>
                <span className="player-emoji">{game.players.black?.emoji || '😎'}</span>
                <span className="player-name">{game.players.black?.name || 'Player 1'}</span>
                <span className="score">{scores.black}</span>
              </div>
              <div className="vs">VS</div>
              <div className={`player ${playerColor === 'white' ? 'active' : ''} ${game.currentPlayer === 'white' ? 'current' : ''}`}>
                <span className="player-emoji">{game.players.white?.emoji || '🤖'}</span>
                <span className="player-name">{game.players.white?.name || 'Player 2'}</span>
                <span className="score">{scores.white}</span>
              </div>
            </div>

            <div className="game-board" style={{
              background: BOARD_THEMES[boardTheme].boardBg
            }}>
              {game.board.map((row, rowIndex) => (
                row.map((cell, colIndex) => {
                  const isValidMoveCell = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`cell ${isValidMoveCell ? 'valid-move' : ''} ${isMyTurn && isValidMoveCell ? 'clickable' : ''}`}
                      style={{
                        background: isValidMoveCell 
                          ? BOARD_THEMES[boardTheme].cellValid 
                          : BOARD_THEMES[boardTheme].cellBg
                      }}
                      onMouseEnter={(e) => {
                        if (isMyTurn && isValidMoveCell) {
                          e.target.style.background = BOARD_THEMES[boardTheme].cellHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isValidMoveCell) {
                          e.target.style.background = BOARD_THEMES[boardTheme].cellValid;
                        } else {
                          e.target.style.background = BOARD_THEMES[boardTheme].cellBg;
                        }
                      }}
                      onClick={() => makeMove(rowIndex, colIndex)}
                    >
                      {cell && (
                        <div className={`piece ${cell}`}>
                          {game.players[cell]?.emoji || (cell === 'black' ? '😎' : '🤖')}
                        </div>
                      )}
                      {isValidMoveCell && <div className="move-hint"></div>}
                    </div>
                  );
                })
              ))}
            </div>

            {game.gameOver && (
              <div className="game-over-overlay">
                <div className="game-over-card">
                  <h2>🎉 Trò chơi kết thúc!</h2>
                  <div className="final-scores">
                    <div className="final-score">
                      <span className="emoji">{game.players.black?.emoji || '😎'}</span>
                      <span className="name">{game.players.black?.name || 'Player 1'}</span>
                      <span className="score">{scores.black}</span>
                    </div>
                    <div className="final-score">
                      <span className="emoji">{game.players.white?.emoji || '🤖'}</span>
                      <span className="name">{game.players.white?.name || 'Player 2'}</span>
                      <span className="score">{scores.white}</span>
                    </div>
                  </div>
                  <div className="winner-announcement">
                    {game.winner === 'tie' ? (
                      <h3>🤝 Hòa!</h3>
                    ) : (
                      <h3>
                        🏆 {game.players[game.winner]?.name || 'Player'} thắng!
                      </h3>
                    )}
                  </div>
                  <button onClick={resetGame} className="btn btn-primary">
                    🔄 Chơi lại
                  </button>
                </div>
              </div>
            )}
          </div>

          {showChat && (
            <div className="chat-container">
              <div className="chat-header">
                <h3>💬 Chat</h3>
                <button onClick={() => setShowChat(false)} className="close-btn">×</button>
              </div>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className="chat-message">
                    <span className="message-author">{msg.playerName}:</span>
                    <span className="message-text">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="input-field"
                />
                <button onClick={sendMessage} className="btn btn-primary">
                  Gửi
                </button>
              </div>
            </div>
          )}
        </div>

        {showThemeSelector && (
          <div className="emoji-picker-overlay" onClick={() => setShowThemeSelector(false)}>
            <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
              <h3>🎨 Chọn màu bàn cờ:</h3>
              <div className="theme-grid">
                {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                  <div
                    key={key}
                    className={`theme-option ${boardTheme === key ? 'selected' : ''}`}
                    onClick={() => {
                      setBoardTheme(key);
                      setShowThemeSelector(false);
                      toast.success(`Đã chọn theme ${theme.name}`);
                    }}
                  >
                    <div className="theme-preview" style={{
                      background: theme.boardBg,
                      border: `2px solid ${theme.cellBg}`,
                      borderRadius: '8px',
                      padding: '4px'
                    }}>
                      <div className="preview-grid">
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellBg }}
                        ></div>
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellValid }}
                        ></div>
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellBg }}
                        ></div>
                        <div 
                          className="preview-cell" 
                          style={{ background: theme.cellBg }}
                        ></div>
                      </div>
                    </div>
                    <span className="theme-name">{theme.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker-overlay" onClick={() => setShowEmojiPicker(false)}>
            <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
              <h3>Chọn emoji của bạn:</h3>
              <div className="emoji-grid">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => updateEmoji(emoji)}
                    className="emoji-option"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Toaster position="top-center" />
      </div>
    );
  }

  return null;
}

export default App;