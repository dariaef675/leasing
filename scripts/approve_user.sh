#!/bin/bash

# скрипт для одобрения пользователя через командную строку

if [ -z "$1" ]; then
    echo "Использование: ./approve_user.sh <email> [role]"
    echo "Пример: ./approve_user.sh manager@example.com Manager"
    echo ""
    echo "Доступные роли: Manager, Administrator"
    exit 1
fi

EMAIL=$1
ROLE=${2:-Manager}

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-leasing_db}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo "Одобрение пользователя $EMAIL на роль $ROLE..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
UPDATE users 
SET approved = true 
WHERE email = '$EMAIL' AND role = '$ROLE';

SELECT id, email, role, approved, first_name, last_name 
FROM users 
WHERE email = '$EMAIL';
EOF

if [ $? -eq 0 ]; then
    echo "✓ Пользователь $EMAIL одобрен как $ROLE"
else
    echo "✗ Ошибка при одобрении пользователя"
fi


