const crypto = require('crypto');

class PasswordService {
  constructor() {
    this.charSets = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };
  }

  // Генерация пароля с использованием Web Crypto API (через Node.js crypto)
  generatePassword(options) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true
    } = options;

    // Валидация
    if (length < 8 || length > 64) {
      throw new Error('Длина пароля должна быть от 8 до 64 символов');
    }

    if (!uppercase && !lowercase && !numbers && !symbols) {
      throw new Error('Должна быть выбрана хотя бы одна категория символов');
    }

    // Формируем набор доступных символов
    let availableChars = '';
    const requiredChars = [];

    if (uppercase) {
      availableChars += this.charSets.uppercase;
      requiredChars.push(this.getSecureRandomChar(this.charSets.uppercase));
    }
    if (lowercase) {
      availableChars += this.charSets.lowercase;
      requiredChars.push(this.getSecureRandomChar(this.charSets.lowercase));
    }
    if (numbers) {
      availableChars += this.charSets.numbers;
      requiredChars.push(this.getSecureRandomChar(this.charSets.numbers));
    }
    if (symbols) {
      availableChars += this.charSets.symbols;
      requiredChars.push(this.getSecureRandomChar(this.charSets.symbols));
    }

    // Генерируем оставшиеся символы
    const remainingLength = length - requiredChars.length;
    const randomChars = [];
    
    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(this.getSecureRandomChar(availableChars));
    }

    // Объединяем обязательные и случайные символы
    const allChars = [...requiredChars, ...randomChars];

    // Перемешиваем массив с использованием алгоритма Фишера-Йейтса
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = this.getSecureRandomIndex(i + 1);
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }

    return allChars.join('');
  }

  // Получение случайного символа с использованием crypto
  getSecureRandomChar(charset) {
    const index = this.getSecureRandomIndex(charset.length);
    return charset[index];
  }

  // Получение безопасного случайного индекса
  getSecureRandomIndex(max) {
    const randomBuffer = crypto.randomBytes(4);
    const randomValue = randomBuffer.readUInt32BE(0);
    return randomValue % max;
  }

  // Вычисление силы пароля
  calculateStrength(password, options) {
    let score = 0;
    
    // Базовые баллы за длину
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;
    if (password.length >= 20) score += 20;

    // Баллы за разнообразие символов
    if (options.uppercase) score += 5;
    if (options.lowercase) score += 5;
    if (options.numbers) score += 5;
    if (options.symbols) score += 5;

    // Дополнительные баллы за комбинации
    const categoriesCount = [
      options.uppercase,
      options.lowercase,
      options.numbers,
      options.symbols
    ].filter(Boolean).length;

    score += categoriesCount * 5;

    return Math.min(score, 100);
  }

  // Создание хеша пароля для хранения (не сам пароль!)
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

module.exports = PasswordService;
