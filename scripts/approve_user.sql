-- скрипт для одобрения пользователя на роль Менеджера или Администратора
-- использование: замените 'user@example.com' на email пользователя


UPDATE users 
SET approved = true 
WHERE email = 'user@example.com' AND role = 'Manager';

UPDATE users 
SET approved = true 
WHERE email = 'user@example.com' AND role = 'Administrator';

SELECT id, email, role, approved, created_at 
FROM users 
WHERE role IN ('Manager', 'Administrator') AND approved = false;

SELECT id, email, role, approved, first_name, last_name, created_at 
FROM users 
ORDER BY created_at DESC;




