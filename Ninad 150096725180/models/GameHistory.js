const { supabase, saveGameRecord, fetchGameHistory } = require('../config/db');

/**
 * GameHistory Model
 * Handles data interaction with Supabase database (and local fallback)
 */
class GameHistoryModel {
  /**
   * Save a completed game record
   * @param {Object} data { playerX, playerO, winner, totalMoves }
   */
  static async create(data) {
    return await saveGameRecord(data);
  }

  /**
   * Fetch recent game history records
   * @param {number} limit Number of records to return
   */
  static async getRecent(limit = 20) {
    const history = await fetchGameHistory();
    return history.slice(0, limit);
  }
}

module.exports = GameHistoryModel;
