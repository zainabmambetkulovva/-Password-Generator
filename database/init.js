const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'passwords.db');

// Создаем и инициализируем базу данных
async function initDatabase() {
  const SQL = await initSqlJs();
  
  let db;
  // Проверяем, существует ли файл базы данных
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }
  
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
  
  db.run(createTableQuery);
  
  // Сохраняем базу данных в файл
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  db.close();
  
  console.log('✅ База данных успешно инициализирована');
  console.log(`📁 Путь к базе данных: ${dbPath}`);
}

if (require.main === module) {
  initDatabase().catch(err => {
    console.error('Ошибка инициализации базы данных:', err);
    process.exit(1);
  });
}

module.exports = { initDatabase };
