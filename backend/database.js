const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/passwords.db');

class DatabaseService {
  constructor() {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
  }

  // Сохранение информации о сгенерированном пароле
  savePasswordHistory(data) {
    const stmt = this.db.prepare(`
      INSERT INTO password_history 
      (password_hash, length, has_uppercase, has_lowercase, has_numbers, has_symbols, strength_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.passwordHash,
      data.length,
      data.hasUppercase ? 1 : 0,
      data.hasLowercase ? 1 : 0,
      data.hasNumbers ? 1 : 0,
      data.hasSymbols ? 1 : 0,
      data.strengthScore
    );
    
    return { id: info.lastInsertRowid };
  }

  // Получение истории генерации паролей
  getPasswordHistory(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT id, length, has_uppercase, has_lowercase, has_numbers, has_symbols, 
             strength_score, created_at
      FROM password_history 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  // Получение статистики
  getStatistics() {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_generated,
        AVG(length) as avg_length,
        AVG(strength_score) as avg_strength,
        MAX(strength_score) as max_strength,
        MIN(strength_score) as min_strength
      FROM password_history
    `).get();
    
    return stats;
  }

  // Удаление старых записей (оставляем последние 1000)
  cleanOldRecords() {
    const stmt = this.db.prepare(`
      DELETE FROM password_history 
      WHERE id NOT IN (
        SELECT id FROM password_history 
        ORDER BY created_at DESC 
        LIMIT 1000
      )
    `);
    
    const info = stmt.run();
    return { deleted: info.changes };
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
