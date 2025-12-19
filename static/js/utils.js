// Утилиты и вспомогательные функции

function goBack() {
    if (window.router && window.router.history && window.router.history.length > 1) {

        window.router.history.pop();

        const previousPage = window.router.history[window.router.history.length - 1];
        navigate('/' + previousPage);
    } else {

        navigate('/');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id === `${tab}Tab` ? 'block' : 'none';
    });
}

function getRoleName(role) {
    const roleNames = {
        'Client': 'Клиент',
        'Manager': 'Менеджер',
        'Administrator': 'Администратор'
    };
    return roleNames[role] || role;
}

function showError(elementId, message, type = 'error') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.className = `error-message ${type}`;
    }
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

window.goBack = goBack;
window.switchTab = switchTab;
window.getRoleName = getRoleName;
window.showError = showError;
window.clearErrors = clearErrors;

