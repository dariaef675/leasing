#!/bin/bash

# скрипт для настройки базы данных PostgreSQL

echo "Настройка базы данных для лизинговой службы..."


# измените пароль для БД здесь
PGPASSWORD=change_me psql -U postgres -h localhost << EOF

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
    echo "ALTER USER postgres PASSWORD 'change_me';"
fi


