
function checkApiAuth(response) {
    if (response.status === 401 || response.status === 403) {
        window.setAuthToken(null);
        window.setCurrentUser({});
        hideHeader();
        if (window.showAuthRequiredModal) {
            window.showAuthRequiredModal();
        }
        navigate('/home');
        return true;
    }

    if (!response.ok) {
        handleHttpError(response);
        return true;
    }
    
    return false;
}

async function handleHttpError(response) {
    let title = 'Ошибка';
    let message = 'Произошла ошибка при выполнении запроса';
    let details = null;
    
    switch(response.status) {
        case 400:
            title = 'Некорректный запрос';
            message = 'Проверьте правильность введенных данных';
            try {
                const data = await response.json();
                if (data.error) {
                    details = data.error;
                }
            } catch (e) {}
            break;
        case 401:
            title = 'Требуется авторизация';
            message = 'Для выполнения этого действия необходимо войти в систему';
            if (window.showAuthRequiredModal) {
                window.showAuthRequiredModal();
            }
            return;
        case 403:
            title = 'Доступ запрещен';
            message = 'У вас нет прав для выполнения этого действия';
            break;
        case 404:
            title = 'Страница не найдена';
            message = 'Запрашиваемый ресурс не найден';
            details = 'Возможно, страница была удалена или перемещена. Проверьте правильность адреса.';
            break;
        case 409:
            title = 'Конфликт данных';
            message = 'Данные уже существуют или конфликтуют с существующими';
            try {
                const data = await response.json();
                if (data.error) {
                    details = data.error;
                }
            } catch (e) {}
            break;
        case 422:
            title = 'Ошибка валидации';
            message = 'Проверьте правильность заполнения всех полей';
            try {
                const data = await response.json();
                if (data.error) {
                    details = data.error;
                }
            } catch (e) {}
            break;
        case 500:
            title = 'Ошибка сервера';
            message = 'На сервере произошла ошибка. Попробуйте позже';
            details = 'Если проблема сохраняется, обратитесь к администратору системы.';
            break;
        case 503:
            title = 'Сервис недоступен';
            message = 'Сервис временно недоступен. Попробуйте позже';
            details = 'Выполняются технические работы. Пожалуйста, попробуйте через несколько минут.';
            break;
        default:
            title = `Ошибка ${response.status}`;
            message = 'Произошла ошибка при выполнении запроса';
            try {
                const data = await response.json();
                if (data.error) {
                    message = data.error;
                }
            } catch (e) {}
    }
    
    if (window.showNotification) {
        window.showNotification(title, message, 'error', details);
    }
}

window.checkApiAuth = checkApiAuth;
window.handleHttpError = handleHttpError;

