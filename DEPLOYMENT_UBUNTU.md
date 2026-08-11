# Руководство по деплою системы на Ubuntu с СУБД PostgreSQL

В данном руководстве описан процесс развертывания платформы обучения службы поддержки на сервере с операционной системой **Ubuntu Linux** с использованием базы данных **PostgreSQL**.

---

## 📁 Созданные скрипты и файлы в проекте

1. **`scripts/schema.sql`** — SQL-файл создания структуры таблиц в PostgreSQL.
2. **`scripts/init_postgres.ts`** — TypeScript/Node.js скрипт для автоматического создания базы данных и переноса данных.
3. **`scripts/init_onb_db.py`** — Python-скрипт для автоматического создания базы данных **`onb`** и загрузки всех данных проекта.
4. **`scripts/setup_ubuntu.sh`** — Bash-скрипт для автоматической установки зависимостей и настройки сервера Ubuntu.
5. **`docker-compose.yml`** — Конфигурация для запуска приложения и PostgreSQL в контейнерах Docker.

---

## 🚀 Вариант 1: Быстрая автоматическая установка на Ubuntu

На чистом сервере Ubuntu сгенерируйте и запустите bash-скрипт автонастройки:

```bash
chmod +x scripts/setup_ubuntu.sh
./scripts/setup_ubuntu.sh
```

Скрипт автоматически:
- Установит Node.js, NPM и PostgreSQL.
- Настроит пользователя `postgres` и создаст БД `support_platform`.
- Запустит созданный скрипт инициализации `npm run db:init`.
- Скомпилирует приложение и настроит фоновый автозапуск через **Systemd**.

---

## 🛠️ Вариант 2: Пошаговая ручная установка

### Шаг 1. Установка PostgreSQL и Node.js

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib curl git build-essential

# Установка Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Шаг 2. Настройка базы данных PostgreSQL

Запустите PostgreSQL и задайте пароль пользователя:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Настройка пароля пользователя postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres_password';"
```

### Шаг 3. Клонирование / Копирование проекта и настройка `.env`

Создайте файл `.env` в корне проекта:

```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=support_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password
```

### Шаг 4. Запуск скрипта создания и наполнения БД

Установите пакеты и запустите специальный скрипт миграции данных из текущего проекта (`database.json`) в PostgreSQL:

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск отдельного скрипта инициализации и заполнения PostgreSQL
npm run db:init
```

При выполнении команды `npm run db:init` произойдет следующее:
1. Проверка наличия базы данных `support_platform` (и её автоматическое создание при отсутствии).
2. Создание всех таблиц из файла `scripts/schema.sql`.
3. Загрузка данных из текущего файла проекта `database.json` и импорт в соответственные таблицы PostgreSQL (`employees`, `courses`, `tickets`, `support_stores` и др.).

### Шаг 5. Сборка и запуск приложения

```bash
# Сборка проекта
npm run build

# Запуск сервера
npm start
```

Приложение запустится на порту `3000` и будет автоматически взаимодействовать с PostgreSQL.

---

## 🐳 Вариант 3: Запуск через Docker Compose

Если на вашем сервере установлен Docker:

```bash
# Запуск контейнеров в фоновом режиме
docker-compose up -d --build

# Первичный импорт данных в PostgreSQL
docker-compose exec app npm run db:init
```

---

## 🔍 Проверка успешного наполнения PostgreSQL

Вы можете проверить перенесенные данные, подключившись к PostgreSQL напрямую:

```bash
sudo -u postgres psql -d support_platform
```

В консоли PostgreSQL выполните SQL-запросы:

```sql
\dt                  -- список созданных таблиц
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM tickets;
```
