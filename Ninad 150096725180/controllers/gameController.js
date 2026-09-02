const GameHistoryModel = require('../models/GameHistory');

/**
 * Game Controller
 * Business logic for HTTP endpoints
 */
class GameController {
  /**
   * GET /api/history
   * Retrieve recent game history records
   */
  static async getHistory(req, res, next) {
    try {
      const history = await GameHistoryModel.getRecent(20);
      return res.status(200).json({
        success: true,
        count: history.length,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/status
   * Server health and API status endpoint
   */
  static getStatus(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Tic Tac Toe Server is running',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = GameController;
