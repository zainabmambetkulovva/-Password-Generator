# 🚀 Деплой Password Generator на Vercel

## ⚠️ Важно: Ограничения Vercel

Vercel использует **serverless функции**, которые имеют ограничения:
- ❌ SQLite **НЕ РАБОТАЕТ** на Vercel (нет постоянного файла БД)
- ❌ История и статистика **НЕ БУДУТ СОХРАНЯТЬСЯ** между запросами
- ✅ Генерация паролей **РАБОТАЕТ** (не требует БД)

## 🔄 Альтернативные решения

### Вариант 1: Только генератор (без истории и статистики)
Проще всего - развернуть только frontend с генерацией паролей без backend.

### Вариант 2: Использовать облачную БД
Заменить SQLite на:
- **MongoDB Atlas** (бесплатный tier)
- **PostgreSQL** на Supabase
- **Firebase Firestore**

### Вариант 3: Другой хостинг
Использовать платформы, поддерживающие постоянное хранилище:
- **Heroku** (поддерживает SQLite с ограничениями)
- **Railway**
- **Render**
- **DigitalOcean App Platform**
- Обычный **VPS** (лучший вариант)

---

## 📦 Деплой на Vercel (текущая версия)

### Шаг 1: Установите Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Войдите в Vercel

```bash
vercel login
```

### Шаг 3: Деплой проекта

```bash
vercel
```

Следуйте инструкциям на экране:
- Выберите scope (ваш аккаунт)
- Link to existing project? → No
- Project name → password-generator
- Directory → ./ (текущая папка)
- Deploy? → Yes

### Шаг 4: Production деплой

```bash
vercel --prod
```

---

## 🌐 Деплой на Railway (рекомендуется)

Railway поддерживает SQLite и постоянное хранилище.

### Шаг 1: Зарегистрируйтесь на Railway

Перейдите на https://railway.app и войдите через GitHub

### Шаг 2: Создайте новый проект

1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите репозиторий `-Password-Generator`

### Шаг 3: Настройте переменные окружения

В настройках проекта добавьте:
```
NODE_ENV=production
PORT=3009
DATABASE_PATH=/app/database/passwords.db
```

### Шаг 4: Добавьте том для постоянного хранилища

В настройках проекта:
1. Перейдите в "Volumes"
2. Создайте новый том
3. Mount path: `/app/database`

Railway автоматически деплоит проект!

---

## 🔧 Деплой на Render

### Шаг 1: Зарегистрируйтесь на Render

Перейдите на https://render.com

### Шаг 2: Создайте Web Service

1. New → Web Service
2. Connect GitHub репозиторий
3. Настройте:
   - **Name:** password-generator
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Шаг 3: Добавьте Disk для SQLite

1. В настройках сервиса перейдите в "Disks"
2. Add Disk:
   - **Name:** database
   - **Mount Path:** `/opt/render/project/src/database`
   - **Size:** 1 GB

Render автоматически деплоит!

---

## 🐳 Деплой на VPS (самый надежный)

### Требования
- Ubuntu/Debian VPS
- Node.js 14+
- Nginx (опционально)
- PM2 для управления процессом

### Шаг 1: Подключитесь к серверу

```bash
ssh user@your-server-ip
```

### Шаг 2: Установите зависимости

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Установка Nginx (опционально)
sudo apt install -y nginx
```

### Шаг 3: Клонируйте проект

```bash
cd /var/www
sudo git clone https://github.com/zainabmambetkulovva/-Password-Generator.git
cd -Password-Generator
```

### Шаг 4: Настройте проект

```bash
# Установите зависимости
sudo npm install

# Создайте .env файл
sudo nano .env
```

Содержимое `.env`:
```env
PORT=3009
NODE_ENV=production
DATABASE_PATH=/var/www/-Password-Generator/database/passwords.db
```

```bash
# Инициализируйте базу данных
sudo npm run init-db
```

### Шаг 5: Запустите с PM2

```bash
sudo pm2 start backend/server.js --name password-generator
sudo pm2 save
sudo pm2 startup
```

### Шаг 6: Настройте Nginx (опционально)

```bash
sudo nano /etc/nginx/sites-available/password-generator
```

Содержимое:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/password-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Шаг 7: Настройте SSL (опционально)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📊 Сравнение платформ

| Платформа | SQLite | Бесплатно | Сложность | Рекомендация |
|-----------|--------|-----------|-----------|--------------|
| Vercel | ❌ | ✅ | Легко | Только для static/frontend |
| Railway | ✅ | ✅ (500ч) | Легко | ⭐ Рекомендуется |
| Render | ✅ | ✅ | Легко | ⭐ Отличный выбор |
| Heroku | ⚠️ | ✅ (ограничено) | Средне | Возможно |
| VPS | ✅ | ❌ | Сложно | ⭐⭐⭐ Лучшая производительность |

---

## ✅ Рекомендация

Для этого проекта с SQLite лучше всего подходят:
1. **Railway** - простой деплой, поддержка SQLite, бесплатный tier
2. **Render** - хорошая альтернатива Railway
3. **VPS** - для продакшн приложений

**НЕ рекомендуется Vercel** для проектов с SQLite, так как база данных не сохраняется между запросами.

---

## 🔄 Автоматический деплой

После первой настройки на Railway/Render, каждый `git push` в main ветку автоматически деплоит новую версию!

```bash
git add .
git commit -m "Update features"
git push origin main
```

Railway/Render автоматически:
1. Обнаружат изменения
2. Скачают код
3. Установят зависимости
4. Перезапустят сервер
