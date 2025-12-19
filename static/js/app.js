// Основная логика приложения
// Конфигурация, API, модальные окна, утилиты и авторизация вынесены в отдельные модули

// Функция расчета стоимости лизинга для калькулятора (выполняется на бэкенде)
async function calculateLeaseCostForCalculator() {
    const assetValueInput = document.getElementById('calcAssetValue');
    const contractTermInput = document.getElementById('calcContractTerm');
    const paymentTypeRadio = document.querySelector('input[name="calcPaymentType"]:checked');
    const activeCategoryBtn = document.querySelector('.calc-category-btn.active');
    
    if (!assetValueInput || !contractTermInput) return;
    
    const assetValue = parseFloat(assetValueInput.value) || 0;
    const contractTerm = parseInt(contractTermInput.value) || 0;
    const paymentType = paymentTypeRadio ? paymentTypeRadio.value : 'even';
    
    // Если стоимость или срок равны 0, показываем 0
    if (assetValue <= 0 || contractTerm <= 0) {
        const calcMonthlyPayment = document.getElementById('calcMonthlyPayment');
        if (calcMonthlyPayment) calcMonthlyPayment.textContent = '0 руб.';
        return;
    }
    
    // Получаем категорию оборудования
    let category = 'оборудование'; // По умолчанию
    if (activeCategoryBtn) {
        category = activeCategoryBtn.dataset.category;
    }
    
    // Отправляем запрос на бэкенд для расчета
    try {
        const API_BASE = window.API_BASE || '/api/v1';
        const response = await fetch(`${API_BASE}/calculate-lease`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                asset_value: assetValue,
                contract_term: contractTerm,
                category: category,
                payment_type: paymentType
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка расчета');
        }
        
        const data = await response.json();
        const monthlyPayment = data.monthly_payment || 0;
        
        // Обновляем отображение
        const calcMonthlyPayment = document.getElementById('calcMonthlyPayment');
        if (calcMonthlyPayment) {
            calcMonthlyPayment.textContent = monthlyPayment.toLocaleString('ru-RU', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }) + ' руб.';
        }
    } catch (error) {
        console.error('Ошибка при расчете лизинга:', error);
        const calcMonthlyPayment = document.getElementById('calcMonthlyPayment');
        if (calcMonthlyPayment) calcMonthlyPayment.textContent = 'Ошибка расчета';
    }
}

// Экспортируем функцию в window сразу
window.calculateLeaseCostForCalculator = calculateLeaseCostForCalculator;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    if (window.checkAuth) {
        window.checkAuth();
    }
    

    window.addEventListener('pagechange', (e) => {
        if (window.handlePageChange) {
            window.handlePageChange(e.detail.page);
        }
    });
});

function setupEventListeners() {

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });


    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const clientForm = document.getElementById('clientForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            if (window.handleLogin) window.handleLogin(e);
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            console.log('Register form submit event');
            if (window.handleRegister) {
                window.handleRegister(e);
            } else {
                console.error('handleRegister is not defined');
            }
        });
    }
    if (clientForm) clientForm.addEventListener('submit', (e) => {
        if (window.handleClientSubmit) window.handleClientSubmit(e);
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) addClientBtn.addEventListener('click', () => {
        console.log('Add client button clicked');
        if (window.openClientModal) {
            console.log('Calling openClientModal');
            window.openClientModal();
        } else {
            console.error('openClientModal is not defined');
        }
    });
    
    const addEquipmentBtn = document.getElementById('addEquipmentBtn');
    if (addEquipmentBtn) addEquipmentBtn.addEventListener('click', () => {
        console.log('Add equipment button clicked');
        if (window.openEquipmentModal) {
            console.log('Calling openEquipmentModal');
            window.openEquipmentModal();
        } else {
            console.error('openEquipmentModal is not defined');
        }
    });
    
    const openCalculatorBtn = document.getElementById('openCalculatorBtn');
    if (openCalculatorBtn) openCalculatorBtn.addEventListener('click', () => {
        if (window.openLeaseCalculatorStandalone) window.openLeaseCalculatorStandalone();
    });
    
    
    const createContractBtn = document.getElementById('createContractBtn');
    if (createContractBtn) createContractBtn.addEventListener('click', () => {
        if (window.openCreateContractModal) window.openCreateContractModal();
    });
    
    const createContractForm = document.getElementById('createContractForm');
    if (createContractForm) createContractForm.addEventListener('submit', (e) => {
        if (window.handleCreateContractSubmit) window.handleCreateContractSubmit(e);
    });
    
    const closeCreateContractModalBtn = document.getElementById('closeCreateContractModal');
    const cancelCreateContractBtn = document.getElementById('cancelCreateContractBtn');
    if (closeCreateContractModalBtn) {
        closeCreateContractModalBtn.addEventListener('click', () => {
            if (window.closeCreateContractModal) window.closeCreateContractModal();
        });
    }
    if (cancelCreateContractBtn) {
        cancelCreateContractBtn.addEventListener('click', () => {
            if (window.closeCreateContractModal) window.closeCreateContractModal();
        });
    }
    
    const createContractModal = document.getElementById('createContractModal');
    if (createContractModal) {
        createContractModal.addEventListener('click', (e) => {
            if (e.target.id === 'createContractModal') {
                if (window.closeCreateContractModal) window.closeCreateContractModal();
            }
        });
    }
    
    const equipmentForm = document.getElementById('equipmentForm');
    if (equipmentForm) equipmentForm.addEventListener('submit', (e) => {
        if (window.handleEquipmentSubmit) window.handleEquipmentSubmit(e);
    });

    const closeEquipmentModalBtn = document.getElementById('closeEquipmentModal');
    const cancelEquipmentBtn = document.getElementById('cancelEquipmentBtn');
    if (closeEquipmentModalBtn) {
        closeEquipmentModalBtn.addEventListener('click', () => {
            console.log('Close equipment modal button clicked');
            if (window.closeEquipmentModal) {
                window.closeEquipmentModal();
            } else {
                console.error('closeEquipmentModal is not defined');
            }
        });
    }
    if (cancelEquipmentBtn) {
        cancelEquipmentBtn.addEventListener('click', () => {
            console.log('Cancel equipment button clicked');
            if (window.closeEquipmentModal) {
                window.closeEquipmentModal();
            } else {
                console.error('closeEquipmentModal is not defined');
            }
        });
    }

    const equipmentModal = document.getElementById('equipmentModal');
    if (equipmentModal) {
        equipmentModal.addEventListener('click', (e) => {
            if (e.target === equipmentModal) {
                if (window.closeEquipmentModal) window.closeEquipmentModal();
            }
        });
    }
    const confirmBtn = document.getElementById('confirmDeleteEquipmentBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmDeleteEquipment);
    }
    
    // Обработчики для модального окна удаления оборудования
    const closeDeleteEquipmentModalBtn = document.getElementById('closeDeleteEquipmentModal');
    const cancelDeleteEquipmentBtn = document.getElementById('cancelDeleteEquipmentBtn');
    if (closeDeleteEquipmentModalBtn) {
        closeDeleteEquipmentModalBtn.addEventListener('click', () => {
            if (window.closeDeleteEquipmentModal) window.closeDeleteEquipmentModal();
        });
    }
    if (cancelDeleteEquipmentBtn) {
        cancelDeleteEquipmentBtn.addEventListener('click', () => {
            if (window.closeDeleteEquipmentModal) window.closeDeleteEquipmentModal();
        });
    }
    
    const deleteEquipmentModal = document.getElementById('deleteEquipmentModal');
    if (deleteEquipmentModal) {
        deleteEquipmentModal.addEventListener('click', (e) => {
            if (e.target.id === 'deleteEquipmentModal') {
                if (window.closeDeleteEquipmentModal) window.closeDeleteEquipmentModal();
            }
        });
    }

    const closeDeleteClientModalBtn = document.getElementById('closeDeleteClientModal');
    const cancelDeleteClientBtn = document.getElementById('cancelDeleteClientBtn');
    const confirmDeleteClientBtn = document.getElementById('confirmDeleteClientBtn');
    if (closeDeleteClientModalBtn) {
        closeDeleteClientModalBtn.addEventListener('click', () => {
            if (window.closeDeleteClientModal) window.closeDeleteClientModal();
        });
    }
    if (cancelDeleteClientBtn) {
        cancelDeleteClientBtn.addEventListener('click', () => {
            if (window.closeDeleteClientModal) window.closeDeleteClientModal();
        });
    }
    if (confirmDeleteClientBtn) {
        confirmDeleteClientBtn.addEventListener('click', () => {
            if (window.confirmDeleteClient) window.confirmDeleteClient();
        });
    }
    
    const deleteClientModal = document.getElementById('deleteClientModal');
    if (deleteClientModal) {
        deleteClientModal.addEventListener('click', (e) => {
            if (e.target.id === 'deleteClientModal') {
                if (window.closeDeleteClientModal) window.closeDeleteClientModal();
            }
        });
    }

    const leaseForm = document.getElementById('leaseForm');
    if (leaseForm) {
        leaseForm.addEventListener('submit', (e) => {
            if (window.handleLeaseSubmit) window.handleLeaseSubmit(e);
        });
    }
    
    const closeLeaseModalBtn = document.getElementById('closeLeaseModal');
    const cancelLeaseBtn = document.getElementById('cancelLeaseBtn');
    if (closeLeaseModalBtn) {
        closeLeaseModalBtn.addEventListener('click', () => {
            if (window.closeLeaseModal) window.closeLeaseModal();
        });
    }
    if (cancelLeaseBtn) {
        cancelLeaseBtn.addEventListener('click', () => {
            if (window.closeLeaseModal) window.closeLeaseModal();
        });
    }
    
    const leaseModal = document.getElementById('leaseModal');
    if (leaseModal) {
        leaseModal.addEventListener('click', (e) => {
            if (e.target.id === 'leaseModal') {
                if (window.closeLeaseModal) window.closeLeaseModal();
            }
        });
    }

    const leaseStartDate = document.getElementById('leaseStartDate');
    const leaseEndDate = document.getElementById('leaseEndDate');
    if (leaseStartDate && leaseEndDate) {
        [leaseStartDate, leaseEndDate].forEach(input => {
            input.addEventListener('change', calculateLeaseCost);
        });
    }

    const closeLeaseCalculatorModalBtn = document.getElementById('closeLeaseCalculatorModal');
    if (closeLeaseCalculatorModalBtn) {
        closeLeaseCalculatorModalBtn.addEventListener('click', () => {
            if (window.closeLeaseCalculatorModal) window.closeLeaseCalculatorModal();
        });
    }
    
    const leaseCalculatorModal = document.getElementById('leaseCalculatorModal');
    if (leaseCalculatorModal) {
        leaseCalculatorModal.addEventListener('click', (e) => {
            if (e.target.id === 'leaseCalculatorModal') {
                if (window.closeLeaseCalculatorModal) window.closeLeaseCalculatorModal();
            }
        });
    }

    // Инициализация обработчиков калькулятора
    function initCalculatorHandlers() {
        const calcAssetValue = document.getElementById('calcAssetValue');
        const calcAssetValueSlider = document.getElementById('calcAssetValueSlider');
        if (calcAssetValue && calcAssetValueSlider) {
            // Удаляем старые обработчики, если есть
            calcAssetValue.replaceWith(calcAssetValue.cloneNode(true));
            calcAssetValueSlider.replaceWith(calcAssetValueSlider.cloneNode(true));
            
            const newCalcAssetValue = document.getElementById('calcAssetValue');
            const newCalcAssetValueSlider = document.getElementById('calcAssetValueSlider');
            
            newCalcAssetValue.addEventListener('input', async () => {
                newCalcAssetValueSlider.value = newCalcAssetValue.value;
                await calculateLeaseCostForCalculator();
            });
            newCalcAssetValueSlider.addEventListener('input', async () => {
                newCalcAssetValue.value = newCalcAssetValueSlider.value;
                await calculateLeaseCostForCalculator();
            });
        }
        
        const calcContractTerm = document.getElementById('calcContractTerm');
        const calcContractTermSlider = document.getElementById('calcContractTermSlider');
        if (calcContractTerm && calcContractTermSlider) {
            // Удаляем старые обработчики, если есть
            calcContractTerm.replaceWith(calcContractTerm.cloneNode(true));
            calcContractTermSlider.replaceWith(calcContractTermSlider.cloneNode(true));
            
            const newCalcContractTerm = document.getElementById('calcContractTerm');
            const newCalcContractTermSlider = document.getElementById('calcContractTermSlider');
            
            newCalcContractTerm.addEventListener('input', async () => {
                newCalcContractTermSlider.value = newCalcContractTerm.value;
                await calculateLeaseCostForCalculator();
            });
            newCalcContractTermSlider.addEventListener('input', async () => {
                newCalcContractTerm.value = newCalcContractTermSlider.value;
                await calculateLeaseCostForCalculator();
            });
        }

        document.querySelectorAll('input[name="calcPaymentType"]').forEach(radio => {
            radio.addEventListener('change', async () => {
                await calculateLeaseCostForCalculator();
            });
        });

        // Обработчики для кнопок категорий
        document.querySelectorAll('.calc-category-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                // Убираем активный класс у всех кнопок
                document.querySelectorAll('.calc-category-btn').forEach(b => b.classList.remove('active'));
                // Добавляем активный класс к выбранной кнопке
                btn.classList.add('active');
                // Пересчитываем стоимость
                await calculateLeaseCostForCalculator();
            });
        });
    }
    
    // Вызываем инициализацию сразу и при открытии модального окна
    initCalculatorHandlers();
    window.initCalculatorHandlers = initCalculatorHandlers;
    

    // Обработчик выбора категории оборудования
    document.querySelectorAll('.calc-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.calc-category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Пересчитываем при изменении категории
            if (window.calculateLeaseCostForCalculator) {
                calculateLeaseCostForCalculator();
            }
        });
    });
    


    function closeModalHandler() {
        const modal = document.getElementById('clientModal');
        if (modal) {
            modal.classList.remove('show');
            const form = document.getElementById('clientForm');
            if (form) form.reset();
            const errorEl = document.getElementById('modalError');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.classList.remove('show');
            }
        }
    }
    
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    if (closeModal) closeModal.addEventListener('click', closeModalHandler);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModalHandler);
    


    setupProfileEdit();
    

    const closeAuthRequiredModalBtn = document.getElementById('closeAuthRequiredModal');
    const authRequiredCancelBtn = document.getElementById('authRequiredCancelBtn');
    const authRequiredRegisterBtn = document.getElementById('authRequiredRegisterBtn');
    const authRequiredModal = document.getElementById('authRequiredModal');
    
    if (closeAuthRequiredModalBtn) {
        closeAuthRequiredModalBtn.addEventListener('click', () => {
            if (window.closeAuthRequiredModal) window.closeAuthRequiredModal();
        });
    }
    if (authRequiredCancelBtn) {
        authRequiredCancelBtn.addEventListener('click', () => {
            if (window.closeAuthRequiredModal) window.closeAuthRequiredModal();
        });
    }
    if (authRequiredRegisterBtn) {
        authRequiredRegisterBtn.addEventListener('click', () => {
            if (window.closeAuthRequiredModal) window.closeAuthRequiredModal();
            navigate('/register');
            // Switch to register tab
            setTimeout(() => {
                const registerTab = document.querySelector('.tab-btn[data-tab="register"]');
                if (registerTab) {
                    registerTab.click();
                }
            }, 100);
        });
    }
    if (authRequiredModal) {
        authRequiredModal.addEventListener('click', (e) => {
            if (e.target.id === 'authRequiredModal') {
                if (window.closeAuthRequiredModal) window.closeAuthRequiredModal();
            }
        });
    }
    

    document.addEventListener('click', (e) => {

        const editProfileBtn = e.target.closest('#editProfileBtn');
        if (editProfileBtn || e.target.id === 'editProfileBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit profile button clicked (delegated)', e.target);
            const currentUser = window.getCurrentUser();
            if (!currentUser || !currentUser.email) {
                console.error('Current user not found');
                return;
            }
            
            const firstNameInput = document.getElementById('profileFirstName');
            const lastNameInput = document.getElementById('profileLastName');
            const phoneInput = document.getElementById('profilePhone');
            const infoView = document.getElementById('profileInfoView');
            const editForm = document.getElementById('profileEditForm');
            const editBtn = document.getElementById('editProfileBtn');
            
            console.log('Profile edit elements:', { firstNameInput, lastNameInput, phoneInput, infoView, editForm, editBtn });
            
            if (firstNameInput) firstNameInput.value = currentUser.first_name || '';
            if (lastNameInput) lastNameInput.value = currentUser.last_name || '';
            if (phoneInput) phoneInput.value = currentUser.phone || '';
            
            if (infoView) {
                infoView.style.display = 'none';
                console.log('Info view hidden');
            }
            if (editForm) {
                editForm.style.display = 'block';
                console.log('Edit form shown');
            }
            if (editBtn) {
                editBtn.style.display = 'none';
                console.log('Edit button hidden');
            }
            return;
        }
        

        const cancelEditBtn = e.target.closest('#cancelEditBtn');
        if (cancelEditBtn || e.target.id === 'cancelEditBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cancel profile edit button clicked (delegated)');
            const infoView = document.getElementById('profileInfoView');
            const editForm = document.getElementById('profileEditForm');
            const editBtn = document.getElementById('editProfileBtn');
            
            if (infoView) {
                infoView.style.display = 'grid';
                console.log('Info view shown');
            }
            if (editForm) {
                editForm.style.display = 'none';
                console.log('Edit form hidden');
            }
            if (editBtn) {
                editBtn.style.display = 'flex';
                console.log('Edit button shown');
            }
            if (window.clearErrors) window.clearErrors();
            return;
        }

        if (e.target.id === 'closeNotificationModal' || e.target.id === 'notificationModalOkBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing notification modal');
            if (window.closeNotificationModal) {
                window.closeNotificationModal();
            }
            return;
        }
        

        if (e.target.id === 'closeConfirmModal' || e.target.id === 'confirmModalCancelBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing confirm modal (cancel)');
            if (window.closeConfirmModal) {
                window.closeConfirmModal(false);
            }
            return;
        }
        
        if (e.target.id === 'confirmModalOkBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing confirm modal (ok)');
            if (window.closeConfirmModal) {
                window.closeConfirmModal(true);
            }
            return;
        }
        

        if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
            const modalId = e.target.id;
            if (modalId === 'notificationModal' && window.closeNotificationModal) {
                window.closeNotificationModal();
            } else if (modalId === 'confirmModal' && window.closeConfirmModal) {
                window.closeConfirmModal(false);
            } else if (modalId === 'authRequiredModal' && window.closeAuthRequiredModal) {
                window.closeAuthRequiredModal();
            }
        }
    });

    const closeNotificationModalBtn = document.getElementById('closeNotificationModal');
    const notificationModalOkBtn = document.getElementById('notificationModalOkBtn');
    const notificationModal = document.getElementById('notificationModal');
    
    if (closeNotificationModalBtn) {
        closeNotificationModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
            e.stopPropagation();
            console.log('Close notification modal button clicked');
            if (window.closeNotificationModal) window.closeNotificationModal();
        });
    }
    if (notificationModalOkBtn) {
        notificationModalOkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Notification modal OK button clicked');
            if (window.closeNotificationModal) window.closeNotificationModal();
        });
    }
    
    // Confirm modal handlers (дополнительная привязка для надежности)
    const closeConfirmModalBtn = document.getElementById('closeConfirmModal');
    const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    const confirmModalOkBtn = document.getElementById('confirmModalOkBtn');
    
    if (closeConfirmModalBtn) {
        closeConfirmModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
            e.stopPropagation();
            console.log('Close confirm modal button clicked');
            if (window.closeConfirmModal) window.closeConfirmModal(false);
        });
    }
    if (confirmModalCancelBtn) {
        confirmModalCancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Confirm modal cancel button clicked');
            if (window.closeConfirmModal) window.closeConfirmModal(false);
        });
    }
    if (confirmModalOkBtn) {
        confirmModalOkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Confirm modal OK button clicked');
            if (window.closeConfirmModal) window.closeConfirmModal(true);
        });
    }
}

// Модальные окна вынесены в модуль modals.js
// пример, когда данные пришли с сервера
function renderContractCalculation(contract) {
    const calculationBlock = document.getElementById('contractCalculation');
    calculationBlock.style.display = 'block';

    document.getElementById('contractMonthlyPayment').textContent =
        (contract.monthly_payment ?? 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    document.getElementById('contractTotalAmount').textContent =
        (contract.total_amount ?? 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('contractOverpayment').textContent =
        (contract.overpayment ?? 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});

}


function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === `${tab}Form`);
    });
    clearErrors();
}

// Функции авторизации вынесены в модуль auth.js

// API функции вынесены в модуль api.js

async function loadDashboard() {
    const statsContainer = document.getElementById('dashboardStats');
    if (!statsContainer) return;
    
    try {
        const response = await fetch(`${window.API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (checkApiAuth(response)) return;
        
        if (response.ok) {
            const data = await response.json();
            renderDashboardStats(data);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderDashboardStats(stats) {
    const container = document.getElementById('dashboardStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
                <div class="stat-value">${stats.clients.total}</div>
                <div class="stat-label">Всего клиентов</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">✓</div>
            <div class="stat-content">
                <div class="stat-value">${stats.clients.active}</div>
                <div class="stat-label">Активных клиентов</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
                <div class="stat-value">${stats.users.total}</div>
                <div class="stat-label">Всего пользователей</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
                <div class="stat-value">${stats.users.pending}</div>
                <div class="stat-label">Ожидают одобрения</div>
            </div>
        </div>
    `;
}

// Функции для клиентов, оборудования и договоров перенесены в модули:
// - static/js/modules/clients.js
// - static/js/modules/equipment.js
// - static/js/modules/contracts.js

// Функции для работы с оборудованием перенесены в static/js/modules/equipment.js
// Используются window.renderEquipment, window.openEquipmentModal, window.closeEquipmentModal и т.д. из модуля




// Функции для работы с клиентами перенесены в static/js/modules/clients.js
// Используются window.renderClients, window.openClientModal и т.д. из модуля

async function loadStats() {
    try {
        const response = await fetch(`${window.API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderStats(data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}


// Переменные для хранения графиков
let contractsDynamicsChart = null;
let equipmentTypesChart = null;

function renderStats(stats) {
    const clients = stats.clients || {};
    const users = stats.users || {};
    const equipment = stats.equipment || {};
    const contracts = stats.contracts || {};
    
    const totalClients = clients.total || 0;
    const activeClients = clients.active || 0;
    const totalUsers = users.total || 0;
    const approvedAdmins = users.approved_admins || 0;
    const pendingApprovals = users.pending || 0;
    const totalEquipment = equipment.total || 0;
    const availableEquipment = equipment.available || 0;
    const leasedEquipment = equipment.leased || 0;
    const totalContracts = contracts.total || 0;
    const pendingContracts = contracts.pending || 0;
    const activeContracts = contracts.active || 0;
    const completedContracts = contracts.completed || 0;
    const monthlyIncome = contracts.monthly_income || 0;
    const totalContractValue = contracts.total_value || 0;
    const avgMonths = (contracts.avg_months || 0).toFixed(1);
    const avgWaitingDays = (contracts.avg_waiting_time_days || 0).toFixed(1);
    
    // KPI карточки
    const kpiContainer = document.getElementById('statsKPICards');
    if (kpiContainer) {
        kpiContainer.innerHTML = `
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #1f2937;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Количество договоров</div>
                <div style="font-size: 32px; font-weight: 700; color: #1f2937; line-height: 1;">${totalContracts}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #374151;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Общая стоимость</div>
                <div style="font-size: 32px; font-weight: 700; color: #1f2937; line-height: 1;">${(totalContractValue / 1000).toFixed(0)} тыс. ₽</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #4b5563;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Клиенты</div>
                <div style="font-size: 32px; font-weight: 700; color: #1f2937; line-height: 1;">${totalClients}</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #6b7280;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Месячный доход</div>
                <div style="font-size: 32px; font-weight: 700; color: #1f2937; line-height: 1;">${(monthlyIncome / 1000).toFixed(0)} тыс. ₽</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #9ca3af;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Оборудование</div>
                <div style="font-size: 32px; font-weight: 700; color: #1f2937; line-height: 1;">${totalEquipment}</div>
            </div>
        `;
    }
    
    // Таблица договоров по статусам
    const tableContainer = document.getElementById('contractsStatsTable');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f9fafb; border-bottom: 2px solid #1f2937;">
                        <th style="text-align: left; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">Статус</th>
                        <th style="text-align: right; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">Количество</th>
                        <th style="text-align: right; padding: 14px 16px; font-size: 11px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">Средний срок</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #d1d5db;">
                        <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; font-weight: 500;">Активные</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; font-weight: 700; color: #1f2937;">${activeContracts}</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; color: #6b7280;">${avgMonths} мес.</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #d1d5db;">
                        <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; font-weight: 500;">Ожидают</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; font-weight: 700; color: #1f2937;">${pendingContracts}</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; color: #6b7280;">${avgWaitingDays} дн.</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #d1d5db;">
                        <td style="padding: 14px 16px; font-size: 14px; color: #1f2937; font-weight: 500;">Завершенные</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; font-weight: 700; color: #1f2937;">${completedContracts}</td>
                        <td style="text-align: right; padding: 14px 16px; font-size: 14px; color: #6b7280;">-</td>
                    </tr>
                </tbody>
            </table>
        `;
    }
    
    // Метрики конверсии
    const conversionContainer = document.getElementById('conversionMetrics');
    if (conversionContainer) {
        const conversionRate = totalClients > 0 ? ((activeContracts / totalClients) * 100).toFixed(1) : 0;
        const avgContractValue = totalContracts > 0 ? (totalContractValue / totalContracts).toFixed(0) : 0;
        
        conversionContainer.innerHTML = `
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #1f2937;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Конверсия</div>
                <div style="font-size: 28px; font-weight: 700; color: #1f2937; line-height: 1;">${conversionRate}%</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #374151;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Средняя стоимость договора</div>
                <div style="font-size: 28px; font-weight: 700; color: #1f2937; line-height: 1;">${avgContractValue} ₽</div>
            </div>
            <div style="background: #ffffff; border: 1px solid #d1d5db; padding: 24px; border-radius: 0; border-left: 4px solid #4b5563;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Средний срок договора</div>
                <div style="font-size: 28px; font-weight: 700; color: #1f2937; line-height: 1;">${avgMonths} мес.</div>
            </div>
        `;
    }
    
    // Графики
    renderStatsCharts(stats);
}

function renderEquipmentCharts(stats) {
    const container = document.getElementById('equipmentChartsSection');
    if (!container || !window.Chart) return;
    
    const equipment = stats.equipment || {};
    const byType = equipment.by_type || [];
    const byStatus = equipment.by_status || [];
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Диаграмма распределения по типам оборудования
    if (byType.length > 0) {
        const typeChartContainer = document.createElement('div');
        typeChartContainer.className = 'chart-container';
        typeChartContainer.innerHTML = `
            <h3>Распределение оборудования по типам</h3>
            <div class="chart-wrapper">
                <canvas id="equipmentTypeChart"></canvas>
            </div>
        `;
        container.appendChild(typeChartContainer);
        
        const typeCtx = document.getElementById('equipmentTypeChart');
        if (typeCtx) {
            new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: byType.map(item => item.type || 'Не указан'),
                    datasets: [{
                        data: byType.map(item => item.count),
                        backgroundColor: [
                            '#1f2937',
                            '#cc0000',
                            '#000000',
                            '#7f1d1d',
                            '#374151',
                            '#6b7280',
                            '#9ca3af',
                            '#111827'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 13,
                                    weight: '500'
                                },
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                                size: 14,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} ед. (${percentage}%)`;
                                }
                            }
                        }
                    }
        }
    });
}
    }
    
    // Диаграмма распределения по статусам
    if (byStatus.length > 0) {
        const statusChartContainer = document.createElement('div');
        statusChartContainer.className = 'chart-container';
        statusChartContainer.innerHTML = `
            <h3>Распределение оборудования по статусам</h3>
            <div class="chart-wrapper">
                <canvas id="equipmentStatusChart"></canvas>
            </div>
        `;
        container.appendChild(statusChartContainer);
        
        const statusCtx = document.getElementById('equipmentStatusChart');
        if (statusCtx) {
            const statusLabels = {
                'available': 'Доступно',
                'in_lease': 'В лизинге',
                'returned': 'Возвращено'
            };
            
            new Chart(statusCtx, {
                type: 'bar',
                data: {
                    labels: byStatus.map(item => statusLabels[item.status] || item.status),
                    datasets: [{
                        label: 'Количество единиц',
                        data: byStatus.map(item => item.count),
                        backgroundColor: [
                            '#1f2937',
                            '#cc0000',
                            '#6b7280'
                        ],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                                size: 14,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 13
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 12
                                }
                            },
                            grid: {
                                color: '#e5e7eb',
                                lineWidth: 1
                            },
                            border: {
                                color: '#d1d5db'
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '500'
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Диаграмма стоимости по типам
    if (byType.length > 0 && byType.some(item => item.value > 0)) {
        const valueChartContainer = document.createElement('div');
        valueChartContainer.className = 'chart-container';
        valueChartContainer.innerHTML = `
            <h3>Стоимость оборудования по типам</h3>
            <div class="chart-wrapper">
                <canvas id="equipmentValueChart"></canvas>
            </div>
        `;
        container.appendChild(valueChartContainer);
        
        const valueCtx = document.getElementById('equipmentValueChart');
        if (valueCtx) {
            new Chart(valueCtx, {
                type: 'line',
                data: {
                    labels: byType.map(item => item.type || 'Не указан'),
                    datasets: [{
                        label: 'Стоимость (₽)',
                        data: byType.map(item => item.value || 0),
                        borderColor: '#cc0000',
                        backgroundColor: 'rgba(204, 0, 0, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#cc0000',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: {
                                size: 14,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y || 0;
                                    return `Стоимость: ${value.toLocaleString('ru-RU')} ₽`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: 12
                                },
                                callback: function(value) {
                                    return value.toLocaleString('ru-RU') + ' ₽';
                                }
                            },
                            grid: {
                                color: '#e5e7eb',
                                lineWidth: 1
                            },
                            border: {
                                color: '#d1d5db'
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 12,
                                    weight: '500'
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }
    }
}

function renderStatsCharts(stats) {
    if (!window.Chart) return;
    
    const contracts = stats.contracts || {};
    const equipment = stats.equipment || {};
    const byType = equipment.by_type || [];
    

    const dynamicsCtx = document.getElementById('contractsDynamicsChart');
    if (dynamicsCtx) {

        if (contractsDynamicsChart) {
            contractsDynamicsChart.destroy();
        }
        

        const labels = [];
        const activeData = [];
        const pendingData = [];
        const completedData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
            // Примерные данные (в реальности нужно получать с сервера)
            activeData.push(Math.floor(Math.random() * 10) + 5);
            pendingData.push(Math.floor(Math.random() * 5) + 2);
            completedData.push(Math.floor(Math.random() * 3) + 1);
        }
        
        contractsDynamicsChart = new Chart(dynamicsCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Активные',
                        data: activeData,
                        backgroundColor: '#374151',
                        borderRadius: 0
                    },
                    {
                        label: 'Ожидают',
                        data: pendingData,
                        backgroundColor: '#6b7280',
                        borderRadius: 0
                    },
                    {
                        label: 'Завершенные',
                        data: completedData,
                        backgroundColor: '#9ca3af',
                        borderRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { font: { size: 12 } },
                        grid: { color: '#f3f4f6' }
                    },
                    x: {
                        ticks: { font: { size: 12 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // График по типам оборудования (horizontal bar chart)
    const typesCtx = document.getElementById('equipmentTypesChart');
    if (typesCtx && byType.length > 0) {
        // Уничтожаем предыдущий график, если он существует
        if (equipmentTypesChart) {
            equipmentTypesChart.destroy();
        }
        
        equipmentTypesChart = new Chart(typesCtx, {
            type: 'bar',
            data: {
                labels: byType.map(item => item.type || 'Не указан'),
                datasets: [{
                    label: 'Количество',
                    data: byType.map(item => item.count || 0),
                    backgroundColor: '#374151',
                    borderRadius: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { font: { size: 12 } },
                        grid: { color: '#f3f4f6' }
                    },
                    y: {
                        ticks: { font: { size: 12 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

async function loadClientProfile() {
    try {
        const response = await fetch(`${window.API_BASE}/profile`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            window.setCurrentUser(user);
            
            const displayName = user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.email.split('@')[0];
            
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileRoleBadge = document.getElementById('profileRoleBadge');
            
            if (profileName) profileName.textContent = displayName;
            if (profileEmail) profileEmail.textContent = user.email;
            if (profileRoleBadge) profileRoleBadge.textContent = window.getRoleName ? window.getRoleName(user.role) : user.role;
            
            const infoFirstName = document.getElementById('infoFirstName');
            if (infoFirstName) infoFirstName.textContent = user.first_name || 'Не указано';
            const infoLastName = document.getElementById('infoLastName');
            if (infoLastName) infoLastName.textContent = user.last_name || 'Не указано';
            const infoPhone = document.getElementById('infoPhone');
            if (infoPhone) infoPhone.textContent = user.phone || 'Не указано';
            const infoEmail = document.getElementById('infoEmail');
            if (infoEmail) infoEmail.textContent = user.email;
            const infoRole = document.getElementById('infoRole');
            if (infoRole) infoRole.textContent = window.getRoleName ? window.getRoleName(user.role) : user.role;
            
            const infoCreatedAt = document.getElementById('infoCreatedAt');
            if (infoCreatedAt) {
            if (user.created_at) {
                const date = new Date(user.created_at);
                    infoCreatedAt.textContent = date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } else {
                    infoCreatedAt.textContent = 'Не указана';
                }
            }
            
            // Привязываем обработчики для страницы профиля
            if (window.setupProfileEdit) {
                setTimeout(() => {
                    window.setupProfileEdit();
                }, 100);
            }
            
            // Загружаем договоры клиента
            if (window.loadClientContracts) {
                window.loadClientContracts();
            } else if (typeof loadClientContracts === 'function') {
            loadClientContracts();
            }
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadClientContracts() {
    const contractsList = document.getElementById('contractsList');
    if (!contractsList) {
        console.warn('contractsList element not found');
        return;
    }
    
    try {
        const response = await fetch(`${window.API_BASE}/contracts`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const contracts = data.contracts || [];
            console.log('Loaded contracts:', contracts.length);
            renderClientContracts(contracts);
        } else {
            console.error('Failed to load contracts:', response.status, response.statusText);
            const errorData = await response.json().catch(() => ({}));
            console.error('Error details:', errorData);
            contractsList.innerHTML = `
                <div class="empty-state-card">
                    <p style="color: var(--text-secondary);">Ошибка загрузки договоров</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading contracts:', error);
        contractsList.innerHTML = `
            <div class="empty-state-card">
                <p style="color: var(--text-secondary);">Ошибка загрузки договоров</p>
            </div>
        `;
    }
}

function renderClientContracts(contracts) {
    const contractsList = document.getElementById('contractsList');
    if (!contractsList) return;
    
    if (contracts.length === 0) {
        contractsList.innerHTML = `
            <div class="empty-state-card">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="opacity: 0.3; margin-bottom: 1rem;">
                    <path d="M12 8H36C37.1 8 38 8.9 38 10V38C38 39.1 37.1 40 36 40H12C10.9 40 10 39.1 10 38V10C10 8.9 10.9 8 12 8Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 16H32M16 24H28" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p style="color: var(--text-secondary);">У вас пока нет договоров</p>
            </div>
        `;
        return;
    }
    
    contractsList.innerHTML = contracts.map(contract => {
        const statusText = {
            'pending': 'На рассмотрении у менеджера',
            'in_processing': 'В обработке',
            'approved': 'Одобрен',
            'active': 'Активен',
            'completed': 'Завершен',
            'rejected': 'Отклонен'
        }[contract.status] || contract.status;
        
        const statusClass = {
            'pending': 'status-pending',
            'approved': 'status-approved',
            'active': 'status-active',
            'completed': 'status-completed',
            'rejected': 'status-rejected'
        }[contract.status] || '';
        
        const startDate = new Date(contract.start_date).toLocaleDateString('ru-RU');
        const endDate = new Date(contract.end_date).toLocaleDateString('ru-RU');

        // Вычисляем количество месяцев
        const start = new Date(contract.start_date);
        const end = new Date(contract.end_date);
        const months = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)));

        const equipmentName = contract.equipment ? `${contract.equipment.type} - ${contract.equipment.model}` : 'N/A';
        const equipmentCost = contract.equipment && contract.equipment.cost
            ? Number(contract.equipment.cost) || 0
            : 0;
        const monthlyPayment = Number(contract.monthly_payment) || 0;
        const totalAmount = Number(contract.total_amount) || 0;

        let overpayment = 0;
        if (equipmentCost > 0 && totalAmount > 0) {
            overpayment = Math.max(totalAmount - equipmentCost, 0);
        }
        
        return `
            <div class="contract-card" style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Договор #${contract.id}</h3>
                <div class="info">
                    <p><strong>Оборудование:</strong> ${equipmentName}</p>
                    <p><strong>Период:</strong> ${startDate} - ${endDate}</p>
                    <p><strong>Ежемесячный платеж:</strong> ${monthlyPayment ? monthlyPayment.toLocaleString('ru-RU') + ' ₽' : '-'}</p>
                    <p><strong>Общая сумма:</strong> ${totalAmount ? totalAmount.toLocaleString('ru-RU') + ' ₽' : '-'}</p>
                    ${overpayment > 0 ? `<p><strong>Переплата:</strong> ${overpayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽</p>` : ''}
                    <p><strong>Статус:</strong> <span class="${statusClass}">${statusText}</span></p>
                    ${contract.status === 'active' || contract.status === 'completed' ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #374151;">
                            <div><strong>График платежей:</strong></div>
                            <div>Ежемесячный платёж: ${monthlyPayment ? monthlyPayment.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽' : '-'}</div>
                            <div>Срок: ${startDate} – ${endDate}</div>
                            <div>Количество платежей: ${months} мес.</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function setupProfileEdit() {
    console.log('setupProfileEdit called');
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('profileEditForm');
    const infoView = document.getElementById('profileInfoView');
    const form = document.getElementById('profileEditForm');
    
    console.log('Profile edit elements:', { editBtn, cancelBtn, editForm, infoView, form });
    

    if (editBtn) {

        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        
        newEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit profile button clicked (direct handler)');
            const currentUser = window.getCurrentUser();
            if (!currentUser || !currentUser.email) {
                console.error('Current user not found');
        return;
    }
    
            const firstNameInput = document.getElementById('profileFirstName');
            const lastNameInput = document.getElementById('profileLastName');
            const phoneInput = document.getElementById('profilePhone');
            const infoViewEl = document.getElementById('profileInfoView');
            const editFormEl = document.getElementById('profileEditForm');
            
            console.log('Profile edit elements in handler:', { firstNameInput, lastNameInput, phoneInput, infoViewEl, editFormEl });
            
            if (firstNameInput) firstNameInput.value = currentUser.first_name || '';
            if (lastNameInput) lastNameInput.value = currentUser.last_name || '';
            if (phoneInput) phoneInput.value = currentUser.phone || '';
            
            if (infoViewEl) {
                infoViewEl.style.display = 'none';
                console.log('Info view hidden');
            }
            if (editFormEl) {
                editFormEl.style.display = 'block';
                console.log('Edit form shown');
            }
            if (newEditBtn) {
                newEditBtn.style.display = 'none';
                console.log('Edit button hidden');
            }
        });
    }
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
            e.stopPropagation();
            console.log('Cancel profile edit button clicked');
            if (infoView) infoView.style.display = 'grid';
            if (editForm) editForm.style.display = 'none';
            const editBtnAfter = document.getElementById('editProfileBtn');
            if (editBtnAfter) editBtnAfter.style.display = 'flex';
            if (window.clearErrors) window.clearErrors();
        });
    }
    
    if (form) {

        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Profile form submitted');
            if (window.clearErrors) window.clearErrors();
            
            const firstNameInput = document.getElementById('profileFirstName');
            const lastNameInput = document.getElementById('profileLastName');
            const phoneInput = document.getElementById('profilePhone');
            const infoView = document.getElementById('profileInfoView');
            const editForm = document.getElementById('profileEditForm');
            
            const profileData = {
                first_name: firstNameInput ? firstNameInput.value.trim() : '',
                last_name: lastNameInput ? lastNameInput.value.trim() : '',
                phone: phoneInput ? phoneInput.value.trim() : ''
            };
            
            try {
                const response = await fetch(`${window.API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.getAuthToken()}`
            },
                    body: JSON.stringify(profileData)
        });

            const data = await response.json();

        if (response.ok) {
                    if (window.loadClientProfile) {
                        await window.loadClientProfile();
                    }
                    if (infoView) infoView.style.display = 'grid';
                    if (editForm) editForm.style.display = 'none';
                    const editBtnAfter = document.getElementById('editProfileBtn');
                    if (editBtnAfter) editBtnAfter.style.display = 'flex';
                    if (window.showNotification) {
                        window.showNotification('Успешно', 'Профиль обновлен!', 'success');
                    }
        } else {
                    if (window.showError) {
                        window.showError('profileError', data.error || 'Ошибка обновления профиля');
                    } else if (window.showNotification) {
                        window.showNotification('Ошибка', data.error || 'Ошибка обновления профиля', 'error');
                    }
        }
    } catch (error) {
                console.error('Profile update error:', error);
                if (window.showError) {
                    window.showError('profileError', 'Ошибка подключения к серверу');
                } else if (window.showNotification) {
                    window.showNotification('Ошибка', 'Ошибка подключения к серверу', 'error');
                }
            }
        });
    }
}


window.setupProfileEdit = setupProfileEdit;


function toggleAdminMenu() {
    console.log('toggleAdminMenu called');
    const menuList = document.getElementById('adminMenuList');
    const arrow = document.getElementById('adminMenuArrow');
    
    console.log('Menu list element:', menuList);
    console.log('Arrow element:', arrow);
    
    if (menuList && arrow) {
        const isOpen = menuList.style.display === 'block';
        console.log('Current display:', menuList.style.display, 'isOpen:', isOpen);
        menuList.style.display = isOpen ? 'none' : 'block';
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        console.log('New display:', menuList.style.display);
    } else {
        console.error('adminMenuList or adminMenuArrow element not found');
    }
}

document.addEventListener('click', (e) => {
    const adminDropdown = document.getElementById('adminMenuDropdown');
    const menuList = document.getElementById('adminMenuList');
    if (adminDropdown && menuList && menuList.style.display === 'block') {
        if (!adminDropdown.contains(e.target)) {
            menuList.style.display = 'none';
            const arrow = document.getElementById('adminMenuArrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }
    }
});


let allUsers = [];

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state loading">Загрузка...</td></tr>';
    
    try {
        const response = await fetch(`${window.API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            allUsers = data.users || [];
            renderUsers(allUsers);
        } else if (response.status === 401 || response.status === 403) {

            window.setAuthToken(null);
            window.setCurrentUser({});
            hideHeader();
            showAuthRequiredModal();
            navigate('/home');
        } else {
            const data = await response.json();
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${data.error || 'Ошибка загрузки данных'}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Ошибка подключения</td></tr>';
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет пользователей</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const roleName = {
            'Administrator': 'Администратор',
            'Manager': 'Менеджер',
            'Client': 'Клиент'
        }[user.role] || user.role;
        
        const roleBadge = {
            'Administrator': '<span style="padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 12px; font-size: 12px; font-weight: 600;">Администратор</span>',
            'Manager': '<span style="padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; font-weight: 600;">Менеджер</span>',
            'Client': '<span style="padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 12px; font-size: 12px; font-weight: 600;">Клиент</span>'
        }[user.role] || '';
        
        const statusBadge = user.approved 
            ? '<span style="padding: 4px 12px; background: #d1fae5; color: #065f46; border-radius: 12px; font-size: 12px; font-weight: 600;">Одобрен</span>'
            : '<span style="padding: 4px 12px; background: #fee2e2; color: #000000; border-radius: 12px; font-size: 12px; font-weight: 600;">Ожидает</span>';
        
        const fullName = (user.first_name && user.last_name) 
            ? `${user.last_name} ${user.first_name}` 
            : 'Не указано';
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
                <td style="padding: 16px 20px; color: #6b7280; font-weight: 500;">${user.id}</td>
                <td style="padding: 16px 20px; color: #111827; font-weight: 500;">${user.email}</td>
                <td style="padding: 16px 20px; color: #374151;">${fullName}</td>
                <td style="padding: 16px 20px;">${roleBadge}</td>
                <td style="padding: 16px 20px;">${statusBadge}</td>
                <td style="padding: 16px 20px;">
                    <div class="action-buttons" style="display: flex; gap: 8px;">
                        <button class="btn-icon" onclick="editUser(${user.id})" title="Редактировать" style="padding: 6px; border-radius: 6px; background: rgba(204, 0, 0, 0.1); color: #cc0000; border: none; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68609 11.9439 1.59231C12.1715 1.49853 12.4142 1.45166 12.6587 1.45468C12.9031 1.4577 13.1444 1.51055 13.3693 1.61001C13.5942 1.70947 13.7982 1.85343 13.97 2.03334C14.1418 2.21325 14.2778 2.42566 14.3708 2.65828C14.4638 2.8909 14.5118 3.13918 14.5118 3.39001C14.5118 3.64084 14.4638 3.88912 14.3708 4.12174C14.2778 4.35436 14.1418 4.56677 13.97 4.74668L5.16667 13.55L1.33333 14.6667L2.45 10.8333L11.333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Удалить" style="padding: 6px; border-radius: 6px; background: #fef2f2; color: #cc0000; border: none; cursor: pointer;">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    const errorEl = document.getElementById('userModalError');
    
    if (!modal || !form) return;
    
    if (userId) {
        title.textContent = 'Редактировать пользователя';
        document.getElementById('userId').value = userId;
        loadUserData(userId);
    } else {
        title.textContent = 'Добавить пользователя';
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
    }
    
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
    
    modal.classList.add('show');
}

async function loadUserData(id) {
    try {
        const response = await fetch(`${window.API_BASE}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userFirstName').value = user.first_name || '';
            document.getElementById('userLastName').value = user.last_name || '';
            document.getElementById('userPhone').value = user.phone || '';
            document.getElementById('userRole').value = user.role;
            document.getElementById('userApproved').checked = user.approved;
            document.getElementById('userPassword').required = false;
            document.getElementById('userPassword').placeholder = 'Оставьте пустым, чтобы не менять';
        }
    } catch (error) {
        showError('userModalError', 'Ошибка загрузки данных пользователя');
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();
    clearErrors();
    
    const userId = document.getElementById('userId').value;
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const firstName = document.getElementById('userFirstName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;
    const approved = document.getElementById('userApproved').checked;
    
    if (!email || !role) {
        showError('userModalError', 'Заполните все обязательные поля');
        return;
    }
    
    if (!userId && !password) {
        showError('userModalError', 'Пароль обязателен при создании пользователя');
        return;
    }
    
    const userData = {
        email: email,
        role: role,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        approved: approved
    };
    
    if (password) {
        userData.password = password;
    }
    
    try {
        const url = userId ? `${window.API_BASE}/users/${userId}` : `${window.API_BASE}/users`;
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.getAuthToken()}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const modal = document.getElementById('userModal');
            if (modal) modal.classList.remove('show');
            await loadUsers();
            showNotification('Успешно', userId ? 'Пользователь успешно обновлен!' : 'Пользователь успешно добавлен!', 'success');
        } else {
            showError('userModalError', data.error || 'Ошибка сохранения');
        }
    } catch (error) {
        showError('userModalError', 'Ошибка подключения к серверу');
    }
}

let userToDelete = null;

function deleteUser(id) {
    userToDelete = id;
    const modal = document.getElementById('deleteUserModal');
    if (modal) modal.classList.add('show');
}

function closeDeleteUserModal() {
    const modal = document.getElementById('deleteUserModal');
    if (modal) modal.classList.remove('show');
    userToDelete = null;
}

async function confirmDeleteUser() {
    if (!userToDelete) return;

    try {
        const response = await fetch(`${window.API_BASE}/users/${userToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });

        if (response.ok) {
            closeDeleteUserModal();
            loadUsers();
            showNotification('Успешно', 'Пользователь успешно удален', 'success');
        } else {
            const data = await response.json();
            showNotification('Ошибка', data.error || 'Ошибка удаления пользователя', 'error');
        }
    } catch (error) {
        showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

function editUser(id) {
    openUserModal(id);
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.classList.remove('show');
    const form = document.getElementById('userForm');
    if (form) form.reset();
    clearErrors();
}


if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => openUserModal());
        }
        
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', handleUserSubmit);
        }
        
        const closeUserModalBtn = document.getElementById('closeUserModal');
        const cancelUserBtn = document.getElementById('cancelUserBtn');
        if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', closeUserModal);
        if (cancelUserBtn) cancelUserBtn.addEventListener('click', closeUserModal);
        
        const userModal = document.getElementById('userModal');
        if (userModal) {
            userModal.addEventListener('click', (e) => {
                if (e.target.id === 'userModal') closeUserModal();
            });
        }
        
        const closeDeleteUserModalBtn = document.getElementById('closeDeleteUserModal');
        const cancelDeleteUserBtn = document.getElementById('cancelDeleteUserBtn');
        const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
        if (closeDeleteUserModalBtn) {
            closeDeleteUserModalBtn.addEventListener('click', () => {
                if (window.closeDeleteUserModal) window.closeDeleteUserModal();
            });
        }
        if (cancelDeleteUserBtn) {
            cancelDeleteUserBtn.addEventListener('click', () => {
                if (window.closeDeleteUserModal) window.closeDeleteUserModal();
            });
        }
        if (confirmDeleteUserBtn) confirmDeleteUserBtn.addEventListener('click', confirmDeleteUser);
    });
}


function closeLeaseCalculatorModal() {
    const modal = document.getElementById('leaseCalculatorModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

window.toggleAdminMenu = toggleAdminMenu;
window.loadUsers = loadUsers;
window.closeUserModal = closeUserModal;
window.closeDeleteUserModal = closeDeleteUserModal;
window.closeLeaseCalculatorModal = closeLeaseCalculatorModal;
window.loadClientProfile = loadClientProfile;
window.loadClientContracts = loadClientContracts;
window.setupProfileEdit = setupProfileEdit;


function openLeaseCalculatorStandalone() {
    console.log('openLeaseCalculatorStandalone called');
    const modal = document.getElementById('leaseCalculatorModal');
    if (!modal) {
        console.error('leaseCalculatorModal element not found');
        return;
    }
    

    const calcAssetValue = document.getElementById('calcAssetValue');
    const calcContractTerm = document.getElementById('calcContractTerm');
    
    // Изначально все параметры должны быть 0
    if (calcAssetValue) {
        calcAssetValue.value = 0;
    }
    if (calcContractTerm) {
        calcContractTerm.value = 1; // Минимум 1 месяц
    }
    

    const calcAssetValueSlider = document.getElementById('calcAssetValueSlider');
    const calcContractTermSlider = document.getElementById('calcContractTermSlider');
    
    if (calcAssetValueSlider) calcAssetValueSlider.value = 0;
    if (calcContractTermSlider) calcContractTermSlider.value = 1; // Минимум 1 месяц для слайдера
    

    const annuityRadio = document.querySelector('input[name="calcPaymentType"][value="even"]');
    if (annuityRadio) annuityRadio.checked = true;
    

    modal.dataset.equipmentId = '';
    modal.dataset.equipmentName = '';
    modal.dataset.equipmentCost = '';
    

    

    modal.classList.add('show');
    
    // Переинициализируем обработчики после открытия модального окна
    if (window.initCalculatorHandlers) {
        setTimeout(() => {
            window.initCalculatorHandlers();
        }, 50);
    }
    
    // Рассчитываем стоимость
    if (window.calculateLeaseCostForCalculator) {
        setTimeout(async () => {
            await window.calculateLeaseCostForCalculator();
        }, 150);
    }
}


window.openLeaseCalculatorStandalone = openLeaseCalculatorStandalone;
