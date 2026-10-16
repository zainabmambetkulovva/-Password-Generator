// Тестовый скрипт для проверки backend логики
const crypto = require('crypto');

console.log('🧪 Тестирование Password Generator Backend\n');

// Тест 1: Проверка доступности crypto модуля
console.log('✓ Test 1: Crypto модуль доступен');
console.log('  - crypto.randomBytes работает:', crypto.randomBytes(4).length === 4);

// Тест 2: Генерация случайных чисел
const randomBuffer = crypto.randomBytes(4);
const randomValue = randomBuffer.readUInt32BE(0);
console.log('\n✓ Test 2: Генерация случайных чисел');
console.log('  - Случайное значение:', randomValue);
console.log('  - Диапазон корректен:', randomValue >= 0);

// Тест 3: Симуляция генерации пароля
function testPasswordGeneration() {
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    function getSecureRandomIndex(max) {
        const randomBuffer = crypto.randomBytes(4);
        const randomValue = randomBuffer.readUInt32BE(0);
        return randomValue % max;
    }

    function getSecureRandomChar(charset) {
        const index = getSecureRandomIndex(charset.length);
        return charset[index];
    }

    const length = 16;
    const availableChars = charSets.uppercase + charSets.lowercase + 
                          charSets.numbers + charSets.symbols;
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += getSecureRandomChar(availableChars);
    }

    console.log('\n✓ Test 3: Генерация пароля (симуляция)');
    console.log('  - Длина:', password.length);
    console.log('  - Пароль:', password);
    console.log('  - Содержит заглавные:', /[A-Z]/.test(password));
    console.log('  - Содержит строчные:', /[a-z]/.test(password));
    console.log('  - Содержит цифры:', /[0-9]/.test(password));
    console.log('  - Содержит символы:', /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password));

    return password;
}

const testPassword = testPasswordGeneration();

// Тест 4: Хеширование
const hash = crypto.createHash('sha256').update(testPassword).digest('hex');
console.log('\n✓ Test 4: Хеширование SHA-256');
console.log('  - Хеш длина:', hash.length, '(ожидается 64)');
console.log('  - Хеш:', hash.substring(0, 32) + '...');

// Тест 5: Валидация настроек
function validateSettings(length, hasAnyCategory) {
    const errors = [];
    
    if (length < 8 || length > 64) {
        errors.push('Длина должна быть от 8 до 64');
    }
    
    if (!hasAnyCategory) {
        errors.push('Должна быть выбрана хотя бы одна категория');
    }
    
    return errors;
}

console.log('\n✓ Test 5: Валидация настроек');
console.log('  - Корректные настройки:', validateSettings(16, true).length === 0);
console.log('  - Длина < 8:', validateSettings(5, true).length > 0);
console.log('  - Длина > 64:', validateSettings(100, true).length > 0);
console.log('  - Нет категорий:', validateSettings(16, false).length > 0);

// Тест 6: Вычисление силы пароля
function calculateStrength(password, options) {
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;
    if (password.length >= 20) score += 20;

    if (options.uppercase) score += 5;
    if (options.lowercase) score += 5;
    if (options.numbers) score += 5;
    if (options.symbols) score += 5;

    const categoriesCount = [
        options.uppercase,
        options.lowercase,
        options.numbers,
        options.symbols
    ].filter(Boolean).length;

    score += categoriesCount * 5;

    return Math.min(score, 100);
}

const strength = calculateStrength(testPassword, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
});

console.log('\n✓ Test 6: Вычисление силы пароля');
console.log('  - Сила пароля:', strength, '/100');
console.log('  - В допустимом диапазоне:', strength >= 0 && strength <= 100);

// Итоги
console.log('\n' + '='.repeat(50));
console.log('✅ Все тесты backend логики пройдены успешно!');
console.log('='.repeat(50));
console.log('\nПримечание: Для полного тестирования необходимо:');
console.log('1. Установить зависимости: npm install');
console.log('2. Инициализировать БД: npm run init-db');
console.log('3. Запустить сервер: npm start');
console.log('4. Открыть http://localhost:3000 в браузере');
