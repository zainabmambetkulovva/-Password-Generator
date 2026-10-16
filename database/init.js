const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'passwords.db');

// Создаем и инициализируем базу данных
function initDatabase() {
  const db = new Database(dbPath);
  
  // Создаем таблицу для хранения истории генерации паролей
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS password_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      length INTEGER NOT NULL,
      has_uppercase INTEGER NOT NULL,
      has_lowercase INTEGER NOT NULL,
      has_numbers INTEGER NOT NULL,
      has_symbols INTEGER NOT NULL,
      strength_score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableQuery);
  
  console.log('✅ База данных успешно инициализирована');
  console.log(`📁 Путь к базе данных: ${dbPath}`);
  
  db.close();
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
