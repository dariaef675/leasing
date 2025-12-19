// Конфигурация приложения
const API_BASE = '/api/v1';

let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

window.API_BASE = API_BASE;
window.getAuthToken = () => authToken;
window.setAuthToken = (token) => {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};
window.getCurrentUser = () => currentUser;
window.setCurrentUser = (user) => {
    currentUser = user;
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
};

