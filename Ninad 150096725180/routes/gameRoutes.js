const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');

/**
 * Game Routes Configuration
 */
router.get('/history', GameController.getHistory);
router.get('/status', GameController.getStatus);

module.exports = router;
