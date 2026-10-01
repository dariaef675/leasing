#!/bin/bash

# скрипт для настройки базы данных PostgreSQL

echo "Настройка базы данных для лизинговой службы..."

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

PGPASSWORD=$DB_PASSWORD psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} << EOF

-- Создание базы данных (если не существует)
SELECT 'CREATE DATABASE leasing_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'leasing_db')\gexec

-- Проверка
\l leasing_db

EOF

if [ $? -eq 0 ]; then
    echo "База данных настроена успешно!"
else
    echo "Ошибка при настройке базы данных."
    echo "Возможные причины:"
    echo "1. Неверный пароль для пользователя postgres"
    echo "2. PostgreSQL не запущен"
    echo "3. Пользователь postgres не существует"
    echo ""
    echo "Попробуйте изменить пароль в PostgreSQL:"
    echo "sudo -u postgres psql"
    echo "ALTER USER postgres PASSWORD '<ваш пароль>';"
fi


