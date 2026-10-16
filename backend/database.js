const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/passwords.db');

class DatabaseService {
  constructor() {
    this.db = null;
    this.SQL = null;
  }

  async init() {
    if (this.db) return;
    
    this.SQL = await initSqlJs();
    
    // Загружаем существующую базу или создаем новую
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      this.db = new this.SQL.Database(filebuffer);
    } else {
      this.db = new this.SQL.Database();
    }
  }

  saveToFile() {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }

  // Сохранение информации о сгенерированном пароле
  savePasswordHistory(data) {
    const stmt = this.db.prepare(`
      INSERT INTO password_history 
      (password_hash, length, has_uppercase, has_lowercase, has_numbers, has_symbols, strength_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      data.passwordHash,
      data.length,
      data.hasUppercase ? 1 : 0,
      data.hasLowercase ? 1 : 0,
      data.hasNumbers ? 1 : 0,
      data.hasSymbols ? 1 : 0,
      data.strengthScore
    ]);
    
    stmt.free();
    
    // Получаем ID последней вставленной записи
    const result = this.db.exec("SELECT last_insert_rowid() as id");
    const lastId = result[0].values[0][0];
    
    this.saveToFile();
    
    return { id: lastId };
  }

  // Получение истории генерации паролей
  getPasswordHistory(limit = 50) {
    const result = this.db.exec(`
      SELECT id, length, has_uppercase, has_lowercase, has_numbers, has_symbols, 
             strength_score, created_at
      FROM password_history 
      ORDER BY id DESC 
      LIMIT ${limit}
    `);
    
    if (!result.length) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    return values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }

  // Получение статистики
  getStatistics() {
    const result = this.db.exec(`
      SELECT 
        COUNT(*) as total_generated,
        AVG(length) as avg_length,
        AVG(strength_score) as avg_strength,
        MAX(strength_score) as max_strength,
        MIN(strength_score) as min_strength
      FROM password_history
    `);
    
    if (!result.length || !result[0].values.length) {
      return {
        total_generated: 0,
        avg_length: 0,
        avg_strength: 0,
        max_strength: 0,
        min_strength: 0
      };
    }
    
    const columns = result[0].columns;
    const values = result[0].values[0];
    
    const stats = {};
    columns.forEach((col, idx) => {
      stats[col] = values[idx];
    });
    
    return stats;
  }

  // Удаление старых записей (оставляем последние 1000)
  cleanOldRecords() {
    const result = this.db.exec(`
      SELECT COUNT(*) as count FROM password_history
    `);
    
    const totalCount = result[0] ? result[0].values[0][0] : 0;
    
    if (totalCount > 1000) {
      this.db.run(`
        DELETE FROM password_history 
        WHERE id NOT IN (
          SELECT id FROM password_history 
          ORDER BY id DESC 
          LIMIT 1000
        )
      `);
      
      this.saveToFile();
      return { deleted: totalCount - 1000 };
    }
    
    return { deleted: 0 };
  }

  close() {
    if (this.db) {
      this.saveToFile();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = DatabaseService;
