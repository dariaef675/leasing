// Авторизация и управление сессией

function checkAuth() {
    const authToken = window.getAuthToken();
    const currentUser = window.getCurrentUser();
    
    if (authToken && currentUser.email) {
        showHeader();
        updateUserInfo();

        if (currentUser.role !== 'Client' && !currentUser.approved) {
            navigate('/profile');
            if (window.showNotification) {
                window.showNotification('Требуется одобрение', 'Ваша роль требует одобрения администратором. Ожидайте подтверждения.', 'warning');
            }
        } else {

            if (currentUser.role === 'Administrator') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    } else {
        hideHeader();
        navigate('/home');
    }
}

function showHeader() {
    const header = document.getElementById('header');
    const navMenu = document.getElementById('navMenu');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentUser = window.getCurrentUser();
    
    if (header) header.style.display = 'block';
    if (userInfo) userInfo.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'block';
    

    if (navMenu) navMenu.style.display = 'flex';
    

    const isManager = currentUser.role === 'Manager';
    const isAdmin = currentUser.role === 'Administrator';
    const isClient = currentUser.role === 'Client';
    

    if (isAdmin) {
        const adminDropdown = document.getElementById('adminMenuDropdown');
        const adminDirectLink = document.getElementById('adminDirectLink');
        
        if (adminDropdown) {
            adminDropdown.style.display = 'block';
            adminDropdown.style.position = 'relative';
            console.log('Admin dropdown displayed for admin user');
        } else {
            console.error('adminMenuDropdown element not found');
        }
        

        if (adminDirectLink) {
            adminDirectLink.style.display = 'block';
        }
    } else {
        const adminDropdown = document.getElementById('adminMenuDropdown');
        const adminDirectLink = document.getElementById('adminDirectLink');
        if (adminDropdown) adminDropdown.style.display = 'none';
        if (adminDirectLink) adminDirectLink.style.display = 'none';
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const page = link.dataset.page;

        if (page === 'about') {
            link.style.display = 'block';
            return;
        }
        
        if (isClient) {

            link.style.display = (page === 'equipment' || page === 'profile') ? 'block' : 'none';
        } else if (isManager) {

            link.style.display = (page === 'clients' || page === 'equipment' || page === 'contracts' || page === 'stats') ? 'block' : 'none';
        } else if (isAdmin) {
            link.style.display = 'none';
        } else {
            link.style.display = 'none';
        }
    });

    const addEquipmentBtn = document.getElementById('addEquipmentBtn');
    if (addEquipmentBtn) {
        addEquipmentBtn.style.display = isManager || isAdmin ? 'block' : 'none';
    }
    
    const openCalculatorBtn = document.getElementById('openCalculatorBtn');
    if (openCalculatorBtn) {
        openCalculatorBtn.style.display = isClient ? 'flex' : 'none';
    }
    
    const addContractBtn = document.getElementById('addContractBtn');
    if (addContractBtn) {
        addContractBtn.style.display = currentUser.role === 'Client' ? 'block' : 'none';
    }
}

function hideHeader() {
    const header = document.getElementById('header');
    const navMenu = document.getElementById('navMenu');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (header) header.style.display = 'none';
    if (navMenu) navMenu.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function updateUserInfo() {
    const currentUser = window.getCurrentUser();
    const userEmail = document.getElementById('userEmail');
    const userRole = document.getElementById('userRole');
    
    if (userEmail) userEmail.textContent = currentUser.email;
    if (userRole && window.getRoleName) {
        userRole.textContent = window.getRoleName(currentUser.role);
    }
}

function handlePageChange(page) {
    const protectedPages = ['dashboard', 'clients', 'equipment', 'contracts', 'stats', 'profile', 'admin', 'users'];
    const authToken = window.getAuthToken();
    const currentUser = window.getCurrentUser();

    if (protectedPages.includes(page)) {
        if (!authToken || !currentUser.email) {
            if (window.showAuthRequiredModal) {
                window.showAuthRequiredModal();
            }
            navigate('/home');
            return;
        }
    }
    
    if (page === 'admin' && currentUser.role === 'Administrator') {

    } else if (page === 'dashboard') {
        if (currentUser.role === 'Administrator') {
            if (window.navigate) window.navigate('/admin');
        } else if (currentUser.role === 'Manager') {
            if (window.loadStats) window.loadStats();
        }
    } else if (page === 'clients' && (currentUser.role === 'Manager' || currentUser.role === 'Administrator')) {
        if (window.loadClients) window.loadClients();
    } else if (page === 'stats' && (currentUser.role === 'Manager' || currentUser.role === 'Administrator')) {
        if (window.loadStats) window.loadStats();
    } else if (page === 'profile' && currentUser.role === 'Client') {
        if (window.loadClientProfile) window.loadClientProfile();
    } else if (page === 'equipment') {
        if (window.loadEquipment) window.loadEquipment();
    } else if (page === 'contracts') {
        if (window.loadContracts) window.loadContracts();
    } else if (page === 'users' && currentUser.role === 'Administrator') {
        if (window.loadUsers) window.loadUsers();
    } else if (page === 'about') {
    }
}

async function handleLogin(e) {
    e.preventDefault();
    if (window.clearErrors) window.clearErrors();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${window.API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            window.setAuthToken(data.token);
            window.setCurrentUser(data.user);
            showHeader();
            updateUserInfo();
            

            if (data.user.role !== 'Client' && !data.user.approved) {
                navigate('/profile');
                if (window.showNotification) {
                    window.showNotification('Требуется одобрение', 'Ваша роль требует одобрения администратором. Ожидайте подтверждения.', 'warning');
                }
            } else {
                if (currentUser.role === 'Administrator') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            }
        } else {
            if (data.error && data.error.includes('одобрения')) {
                if (window.showNotification) {
                    window.showNotification('Требуется одобрение', data.error, 'warning');
                }
            } else {
                if (window.showError) {
                    window.showError('loginError', data.error || 'Неверный email или пароль');
                }
            }
        }
    } catch (error) {
        if (window.showNotification) {
            window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleRegister called');
    if (window.clearErrors) window.clearErrors();
    
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const firstNameInput = document.getElementById('registerFirstName');
    const lastNameInput = document.getElementById('registerLastName');
    
    if (!emailInput || !passwordInput) {
        console.error('Register form inputs not found');
        if (window.showNotification) {
            window.showNotification('Ошибка', 'Не найдены поля формы регистрации', 'error');
        }
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const lastName = lastNameInput ? lastNameInput.value.trim() : '';
    
    if (!email || !password) {
        if (window.showError) {
            window.showError('registerError', 'Заполните все обязательные поля');
        } else if (window.showNotification) {
            window.showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
        }
        return;
    }
    
    try {
        console.log('Sending registration request:', { email, password, first_name: firstName, last_name: lastName });
        const response = await fetch(`${window.API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
        });

        const data = await response.json();
        console.log('Registration response:', response.status, data);
        
        if (response.ok) {
            if (window.showNotification) {
                window.showNotification('Успешно', 'Регистрация успешна! Ваша заявка отправлена на одобрение администратору.', 'success');
            } else if (window.showError) {
                window.showError('registerError', 'Регистрация успешна! Ваша заявка отправлена на одобрение администратору.', 'success');
            }

            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (firstNameInput) firstNameInput.value = '';
            if (lastNameInput) lastNameInput.value = '';

            if (window.switchTab) {
                window.switchTab('login');
            }
        } else {
            if (window.showError) {
                window.showError('registerError', data.error || 'Ошибка при регистрации');
            } else if (window.showNotification) {
                window.showNotification('Ошибка', data.error || 'Ошибка при регистрации', 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        if (window.showNotification) {
            window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
        }
    }
}

function handleLogout() {
    window.setAuthToken(null);
    window.setCurrentUser({});
    hideHeader();
    navigate('/home');
}

window.checkAuth = checkAuth;
window.showHeader = showHeader;
window.hideHeader = hideHeader;
window.updateUserInfo = updateUserInfo;
window.handlePageChange = handlePageChange;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;

