const express = require('express');
const PasswordService = require('./passwordService');
const DatabaseService = require('./database');

const router = express.Router();
const passwordService = new PasswordService();
const dbService = new DatabaseService();

// Инициализация базы данных
let dbReady = false;
dbService.init().then(() => {
  dbReady = true;
  console.log('✅ DatabaseService готов к работе');
}).catch(err => {
  console.error('❌ Ошибка инициализации DatabaseService:', err);
});

// Middleware для проверки готовности БД
function checkDbReady(req, res, next) {
  if (!dbReady) {
    return res.status(503).json({
      success: false,
      error: 'База данных еще не готова, попробуйте снова через несколько секунд'
    });
  }
  next();
}

// Middleware для валидации
function validateGenerateRequest(req, res, next) {
  const { length, uppercase, lowercase, numbers, symbols } = req.body;

  // Проверка длины
  if (length !== undefined) {
    const len = parseInt(length);
    if (isNaN(len) || len < 8 || len > 64) {
      return res.status(400).json({
        success: false,
        error: 'Длина пароля должна быть от 8 до 64 символов'
      });
    }
  }

  // Проверка, что выбрана хотя бы одна категория
  if (!uppercase && !lowercase && !numbers && !symbols) {
    return res.status(400).json({
      success: false,
      error: 'Должна быть выбрана хотя бы одна категория символов'
    });
  }

  next();
}

// POST /api/generate - Генерация нового пароля
router.post('/generate', checkDbReady, validateGenerateRequest, (req, res) => {
  try {
    const options = {
      length: parseInt(req.body.length) || 16,
      uppercase: req.body.uppercase !== false,
      lowercase: req.body.lowercase !== false,
      numbers: req.body.numbers !== false,
      symbols: req.body.symbols !== false
    };

    // Генерируем пароль
    const password = passwordService.generatePassword(options);

    // Вычисляем силу пароля
    const strengthScore = passwordService.calculateStrength(password, options);

    // Сохраняем в БД (только хеш и метаданные, не сам пароль!)
    const passwordHash = passwordService.hashPassword(password);
    const record = dbService.savePasswordHistory({
      passwordHash,
      length: options.length,
      hasUppercase: options.uppercase,
      hasLowercase: options.lowercase,
      hasNumbers: options.numbers,
      hasSymbols: options.symbols,
      strengthScore
    });

    res.json({
      success: true,
      data: {
        password,
        strength: strengthScore,
        length: options.length,
        id: record.id
      }
    });
  } catch (error) {
    console.error('Ошибка генерации пароля:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при генерации пароля'
    });
  }
});

// GET /api/history - Получение истории генерации
router.get('/history', checkDbReady, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = dbService.getPasswordHistory(limit);

    res.json({
      success: true,
      data: history.map(item => ({
        id: item.id,
        length: item.length,
        hasUppercase: item.has_uppercase === 1,
        hasLowercase: item.has_lowercase === 1,
        hasNumbers: item.has_numbers === 1,
        hasSymbols: item.has_symbols === 1,
        strengthScore: item.strength_score,
        createdAt: item.created_at
      }))
    });
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении истории'
    });
  }
});

// GET /api/statistics - Получение статистики
router.get('/statistics', checkDbReady, (req, res) => {
  try {
    const stats = dbService.getStatistics();

    res.json({
      success: true,
      data: {
        totalGenerated: stats.total_generated || 0,
        avgLength: Math.round(stats.avg_length * 10) / 10 || 0,
        avgStrength: Math.round(stats.avg_strength * 10) / 10 || 0,
        maxStrength: stats.max_strength || 0,
        minStrength: stats.min_strength || 0
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики'
    });
  }
});

// DELETE /api/history/cleanup - Очистка старых записей
router.delete('/history/cleanup', checkDbReady, (req, res) => {
  try {
    const result = dbService.cleanOldRecords();

    res.json({
      success: true,
      data: {
        deleted: result.deleted
      }
    });
  } catch (error) {
    console.error('Ошибка очистки истории:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при очистке истории'
    });
  }
});

// GET /api/health - Проверка состояния сервера
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      dbReady: dbReady,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
