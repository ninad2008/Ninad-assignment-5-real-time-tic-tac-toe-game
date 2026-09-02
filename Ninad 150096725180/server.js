const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

// Modular Imports
const requestLogger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const gameRoutes = require('./routes/gameRoutes');
const initGameSocket = require('./sockets/gameSocket');

// Express App & HTTP Server Initialization
const app = express();
const server = http.createServer(app);

// Socket.io Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware Registration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static Web Assets
app.use(express.static(path.join(__dirname, 'public')));

// Router Registration
app.use('/api', gameRoutes);

// Socket Event Handlers Registration
initGameSocket(io);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Modular Tic Tac Toe Server running on http://localhost:${PORT}`);
  console.log(`===================================================`);
});
