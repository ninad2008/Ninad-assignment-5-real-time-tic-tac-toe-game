# Real-Time Tic Tac Toe (Socket Programming Assignment)

A real-time multiplayer Tic Tac Toe web application built using **Node.js**, **Express.js**, **Socket.io**, and **Firebase Firestore**.

---

## 🚀 Features

- **User Login**: Username-based login system with validation.
- **Symbol Assignment**: First connected player gets symbol **'X'**, second player gets symbol **'O'**.
- **2-Player Room Limit**: Maximum 2 players per room. Rejects third user with an explicit error message.
- **Real-Time Sync**: Instant move synchronization across all connected clients via WebSockets (Socket.io).
- **Turn Management & Win Detection**: Full Tic Tac Toe win/draw detection (rows, columns, diagonals).
- **Visual Winner Announcement**: Animated popup modal and winning line cell highlighting on game completion.
- **Database Integration (Firebase Firestore)**: Saves game records (`player_x`, `player_o`, `winner`, `total_moves`, `created_at`) directly into Google Cloud Firebase Firestore database.
- **Live Game History**: Real-time game history table rendered on the frontend.
- **Connection Status & Active Count**: Header indicators showing real-time Socket connection status and live connected users counter.
- **Responsive UI**: Retro arcade cabinet & anime fighting game theme with CRT scanlines and 8-bit sound effects.

---

## 🛠️ Project Structure

```
Ninad 150096725180/
├── server.js            // Clean Express server & Socket.io initialization
├── config/
│   └── db.js            // Firebase Firestore initialization & database helpers
├── models/
│   └── GameHistory.js   // Data model layer for database interaction
├── controllers/
│   └── gameController.js// Express HTTP route controller logic
├── routes/
│   └── gameRoutes.js    // API router definitions (/api/history, /api/status)
├── middlewares/
│   ├── logger.js        // HTTP request logger middleware
│   └── errorHandler.js  // Centralized error handling middleware
├── sockets/
│   └── gameSocket.js    // Real-time Socket.io event logic & room state manager
├── package.json         // Project metadata & dependencies
├── public/
│   ├── index.html       // Main HTML layout
│   ├── style.css        // CSS styles & responsive layout
│   └── script.js        // Client-side Socket.io event handling
└── README.md            // Project documentation
```

---

## 📦 Installation & Setup

1. **Navigate into the project folder**:
   ```bash
   cd "Ninad 150096725180"
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Database Configuration**:
   Firebase Admin credentials are already integrated in `config/db.js` for project `tic-tac-toe-26926`.

4. **Start the application**:
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`.

---

## 🗄️ Database Schema (Firebase Firestore)

Game records are stored in the Cloud Firestore collection: `game_history`

Each document contains the following fields:
- `player_x` (string): Username of Player X
- `player_o` (string): Username of Player O
- `winner` (string): Username of the winner or `'Draw'`
- `total_moves` (number): Number of moves made in the match
- `created_at` (string ISO timestamp): Date and time the match concluded

---

## 🔌 Socket Events Reference

| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `user-login` | Client ➔ Server | Sends username for login validation |
| `login-success` | Server ➔ Client | Confirms login with assigned symbol ('X' / 'O') |
| `login-error` | Server ➔ Client | Returns error message (e.g. room full / username taken) |
| `players-update` | Server ➔ Client | Broadcasts current active players list to all clients |
| `game-start` | Server ➔ Client | Emits when 2 players join, initializes game state |
| `make-move` | Client ➔ Server | Sends player move with cell index and symbol |
| `move-made` | Server ➔ Client | Broadcasts updated cell move to all clients |
| `game-over` | Server ➔ Client | Announces winner/draw, winning line array, and saves DB record |
| `reset-game` | Client ➔ Server | Requests room game state reset |
| `game-reset` | Server ➔ Client | Confirms reset state to all clients |
| `disconnect` | Server ➔ Client | Handles player departure and room status cleanup |

---

## ✅ Submission Checklist

- [x] Correct Express server with Socket.io configuration
- [x] Username validation & X/O assignment
- [x] 2-Player room limit (rejects 3rd player)
- [x] Complete Tic Tac Toe turn management and winner detection
- [x] Real-time state synchronization
- [x] Database integration with Firebase Firestore (`config/db.js`)
- [x] Game history saved and displayed on frontend
- [x] Retro Arcade Machine & Anime Fighting Game UI design
- [x] Documented README.md file
