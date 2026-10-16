// API базовый URL
const API_BASE_URL = window.location.origin + '/api';

// Элементы DOM
const passwordOutput = document.getElementById('passwordOutput');
const copyBtn = document.getElementById('copyBtn');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const uppercaseCheck = document.getElementById('uppercaseCheck');
const lowercaseCheck = document.getElementById('lowercaseCheck');
const numbersCheck = document.getElementById('numbersCheck');
const symbolsCheck = document.getElementById('symbolsCheck');
const generateBtn = document.getElementById('generateBtn');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const messageBox = document.getElementById('messageBox');
const historyList = document.getElementById('historyList');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const statTotal = document.getElementById('statTotal');
const statAvgLength = document.getElementById('statAvgLength');
const statAvgStrength = document.getElementById('statAvgStrength');

// Состояние приложения
let currentPassword = '';

// Обновление значения длины
lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

// Валидация: хотя бы один чекбокс должен быть выбран
function validateSettings() {
    const hasSelection = uppercaseCheck.checked || 
                        lowercaseCheck.checked || 
                        numbersCheck.checked || 
                        symbolsCheck.checked;
    
    generateBtn.disabled = !hasSelection;
    
    if (!hasSelection) {
        showMessage('Выберите хотя бы одну категорию символов', 'error');
    }
    
    return hasSelection;
}

// Слушатели для чекбоксов
[uppercaseCheck, lowercaseCheck, numbersCheck, symbolsCheck].forEach(checkbox => {
    checkbox.addEventListener('change', validateSettings);
});

// Генерация пароля
async function generatePassword() {
    if (!validateSettings()) {
        return;
    }

    const settings = {
        length: parseInt(lengthSlider.value),
        uppercase: uppercaseCheck.checked,
        lowercase: lowercaseCheck.checked,
        numbers: numbersCheck.checked,
        symbols: symbolsCheck.checked
    };

    try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Генерация...';

        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Ошибка генерации пароля');
        }

        currentPassword = data.data.password;
        passwordOutput.value = currentPassword;
        copyBtn.disabled = false;

        // Обновление индикатора силы
        updateStrengthIndicator(data.data.strength);

        showMessage('Пароль успешно сгенерирован!', 'success');

        // Обновление статистики и истории
        await Promise.all([
            loadStatistics(),
            loadHistory()
        ]);

    } catch (error) {
        console.error('Ошибка:', error);
        showMessage(error.message || 'Не удалось сгенерировать пароль', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Сгенерировать пароль';
    }
}

// Обновление индикатора силы пароля
function updateStrengthIndicator(score) {
    strengthBar.style.width = `${score}%`;
    
    let strengthLabel = '';
    let color = '';

    if (score < 40) {
        strengthLabel = 'Слабый';
        color = '#ef4444';
    } else if (score < 60) {
        strengthLabel = 'Средний';
        color = '#f59e0b';
    } else if (score < 80) {
        strengthLabel = 'Хороший';
        color = '#10b981';
    } else {
        strengthLabel = 'Отличный';
        color = '#10b981';
    }

    strengthText.textContent = `${strengthLabel} (${score}/100)`;
    strengthBar.style.background = color;
}

// Копирование в буфер обмена
async function copyToClipboard() {
    if (!currentPassword) {
        return;
    }

    try {
        await navigator.clipboard.writeText(currentPassword);
        showMessage('Пароль скопирован в буфер обмена!', 'success');

        // Визуальная обратная связь
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
            copyBtn.style.background = '';
        }, 300);

    } catch (error) {
        console.error('Ошибка копирования:', error);
        
        // Fallback для старых браузеров
        try {
            passwordOutput.select();
            document.execCommand('copy');
            showMessage('Пароль скопирован в буфер обмена!', 'success');
        } catch (fallbackError) {
            showMessage('Не удалось скопировать пароль', 'error');
        }
    }
}

// Показать сообщение
function showMessage(text, type = 'success') {
    messageBox.textContent = text;
    messageBox.className = `message-box ${type}`;
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
}

// Загрузка истории
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history?limit=20`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Ошибка загрузки истории');
        }

        if (!data.data || data.data.length === 0) {
            historyList.innerHTML = '<p class="empty-message">История пуста</p>';
            return;
        }

        historyList.innerHTML = data.data.map(item => {
            const date = new Date(item.createdAt);
            const formattedDate = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const badges = [];
            if (item.hasUppercase) badges.push('A-Z');
            if (item.hasLowercase) badges.push('a-z');
            if (item.hasNumbers) badges.push('0-9');
            if (item.hasSymbols) badges.push('!@#');

            let strengthClass = '';
            if (item.strengthScore < 40) strengthClass = 'weak';
            else if (item.strengthScore < 60) strengthClass = 'medium';
            else if (item.strengthScore < 80) strengthClass = 'good';
            else strengthClass = 'excellent';

            return `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-meta">${formattedDate}</div>
                        <div class="history-settings">
                            <span class="history-badge">Длина: ${item.length}</span>
                            ${badges.map(b => `<span class="history-badge">${b}</span>`).join('')}
                        </div>
                    </div>
                    <div class="history-strength" style="background: ${getStrengthColor(item.strengthScore)};">
                        ${item.strengthScore}
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        historyList.innerHTML = '<p class="empty-message">Не удалось загрузить историю</p>';
    }
}

// Загрузка статистики
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Ошибка загрузки статистики');
        }

        const stats = data.data;
        statTotal.textContent = stats.totalGenerated || 0;
        statAvgLength.textContent = stats.avgLength || 0;
        statAvgStrength.textContent = stats.avgStrength || 0;

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Получение цвета для индикатора силы
function getStrengthColor(score) {
    if (score < 40) return 'rgba(239, 68, 68, 0.2)';
    if (score < 60) return 'rgba(245, 158, 11, 0.2)';
    if (score < 80) return 'rgba(16, 185, 129, 0.2)';
    return 'rgba(16, 185, 129, 0.3)';
}

// Обработчики событий
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);
refreshHistoryBtn.addEventListener('click', loadHistory);

// Клавиша Enter для генерации
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
        generatePassword();
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Password Generator инициализирован');
    
    // Проверка доступности API
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Соединение с сервером установлено');
            await Promise.all([
                loadStatistics(),
                loadHistory()
            ]);
        }
    } catch (error) {
        console.error('❌ Ошибка соединения с сервером:', error);
        showMessage('Не удалось подключиться к серверу', 'error');
    }
});
