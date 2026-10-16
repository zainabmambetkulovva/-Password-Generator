const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { initDatabase } = require('../database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация базы данных при старте
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Статические файлы (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// API маршруты
app.use('/api', routes);

// Отправка index.html для всех остальных запросов (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Password Generator Server запущен! 🚀   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   🌐 URL: http://localhost:${PORT}         ║`);
  console.log(`║   📡 API: http://localhost:${PORT}/api     ║`);
  console.log(`║   🔒 Окружение: ${process.env.NODE_ENV || 'development'}        ║`);
  console.log('╚════════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM. Завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nПолучен сигнал SIGINT. Завершение работы...');
  process.exit(0);
});
