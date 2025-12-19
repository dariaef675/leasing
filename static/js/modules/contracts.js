let allContracts = [];

async function loadContracts() {
    const currentUser = window.getCurrentUser();
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    const isManager = currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Administrator');
    const contractsGrid = document.getElementById('contractsGrid');
    const pageTitle = document.getElementById('contractsPageTitle');
    const createContractBtn = document.getElementById('createContractBtn');
    const contractFilters = document.getElementById('contractFilters');
    const archivedToggle = document.getElementById('showArchivedContractsBtn');

    if (pageTitle) pageTitle.textContent = 'Договоры';
    if (createContractBtn) createContractBtn.style.display = isManager ? 'flex' : 'none';
    if (contractFilters) contractFilters.style.display = isManager ? 'block' : 'none';
    if (archivedToggle) archivedToggle.style.display = (currentUser && currentUser.role === 'Administrator') ? 'inline-flex' : 'none';
    
    if (contractsGrid) {
        contractsGrid.style.display = 'grid';
        contractsGrid.innerHTML = '<div class="empty-state">Загрузка...</div>';
    }
    
    try {
        const response = await fetch(`${API_BASE}/contracts`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            allContracts = data.contracts || [];
            

            if (isManager) {
                await loadClientsForFilter();
            }
            
            applyContractFilters();
        } else if (response.status === 401 || response.status === 403) {
            window.setAuthToken(null);
            window.setCurrentUser({});
            if (window.hideHeader) window.hideHeader();
            if (window.showAuthRequiredModal) window.showAuthRequiredModal();
            if (window.navigate) window.navigate('/home');
        } else {
            const data = await response.json();
            if (contractsGrid) contractsGrid.innerHTML = `<div class="empty-state">${data.error || 'Ошибка загрузки данных'}</div>`;
        }
    } catch (error) {
        if (contractsGrid) contractsGrid.innerHTML = '<div class="empty-state">Ошибка подключения</div>';
    }
}

async function loadArchivedContracts() {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const contractsGrid = document.getElementById('contractsGrid');
    const pageTitle = document.getElementById('contractsPageTitle');

    if (pageTitle) pageTitle.textContent = 'Архивные договоры';
    if (contractsGrid) {
        contractsGrid.style.display = 'grid';
        contractsGrid.innerHTML = '<div class="empty-state">Загрузка...</div>';
    }

    try {
        const response = await fetch(`${API_BASE}/contracts?archived=true`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const archivedContracts = data.contracts || [];
            renderContracts(archivedContracts);
        } else if (response.status === 401 || response.status === 403) {
            window.setAuthToken(null);
            window.setCurrentUser({});
            if (window.hideHeader) window.hideHeader();
            if (window.showAuthRequiredModal) window.showAuthRequiredModal();
            if (window.navigate) window.navigate('/home');
        } else {
            const data = await response.json();
            if (contractsGrid) contractsGrid.innerHTML = `<div class="empty-state">${data.error || 'Ошибка загрузки данных'}</div>`;
        }
    } catch (error) {
        if (contractsGrid) contractsGrid.innerHTML = '<div class="empty-state">Ошибка подключения</div>';
    }
}

async function loadClientsForFilter() {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    try {
        const response = await fetch(`${API_BASE}/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            const clientSelect = document.getElementById('filterContractClient');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Все клиенты</option>';
                (data.clients || []).forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.last_name} ${client.first_name} ${client.middle_name || ''}`;
                    clientSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading clients for filter:', error);
    }
}

function applyContractFilters() {
    let filtered = [...allContracts];
    
    // Фильтр по клиенту
    const clientFilter = document.getElementById('filterContractClient');
    if (clientFilter && clientFilter.value) {
        const clientId = parseInt(clientFilter.value);
        filtered = filtered.filter(contract => contract.client_id === clientId);
    }

    const termFilter = document.getElementById('filterContractTerm');
    if (termFilter && termFilter.value) {
        filtered = filtered.filter(contract => {
            const start = new Date(contract.start_date);
            const end = new Date(contract.end_date);
            const years = end.getFullYear() - start.getFullYear();
            const months = end.getMonth() - start.getMonth();
            let totalMonths = years * 12 + months;
            if (end.getDate() < start.getDate()) totalMonths--;
            if (totalMonths < 1) totalMonths = 1;
            
            const termValue = termFilter.value;
            if (termValue === '1-6') return totalMonths >= 1 && totalMonths <= 6;
            if (termValue === '7-12') return totalMonths >= 7 && totalMonths <= 12;
            if (termValue === '13-24') return totalMonths >= 13 && totalMonths <= 24;
            if (termValue === '25+') return totalMonths >= 25;
            return true;
        });
    }

    const idFilter = document.getElementById('filterContractId');
    if (idFilter && idFilter.value) {
        const contractId = parseInt(idFilter.value);
        filtered = filtered.filter(contract => contract.id === contractId);
    }
    
    renderContracts(filtered);
}

function renderContracts(contracts) {
    const currentUser = window.getCurrentUser();
    const grid = document.getElementById('contractsGrid');
    if (!grid) return;

    if (contracts.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет договоров</div>';
        return;
    }

    const isManager = currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Administrator');
    const isClient = currentUser && currentUser.role === 'Client';

    const renderCard = (contract) => {

        let statusText;
        if (isClient) {
            statusText = {
                'pending': 'На рассмотрении у менеджера',
                'in_processing': 'В обработке',
                'approved': 'Одобрен',
                'active': 'Активен',
                'completed': 'Завершен',
                'rejected': 'Отклонен'
            }[contract.status] || contract.status;
        } else {
            statusText = {
                'pending': 'Необходимо одобрение',
                'in_processing': 'В обработке',
                'approved': 'Одобрен',
                'active': 'Активен',
                'completed': 'Завершен',
                'rejected': 'Отклонен'
            }[contract.status] || contract.status;
        }
        
        const statusClass = {
            'pending': 'status-pending',
            'in_processing': 'status-processing',
            'approved': 'status-approved',
            'active': 'status-active',
            'completed': 'status-completed',
            'rejected': 'status-rejected'
        }[contract.status] || '';

        const startDate = new Date(contract.start_date).toLocaleDateString('ru-RU');
        const endDate = new Date(contract.end_date).toLocaleDateString('ru-RU');

        // Расчет срока лизинга в месяцах
        const start = new Date(contract.start_date);
        const end = new Date(contract.end_date);
        const years = end.getFullYear() - start.getFullYear();
        const monthsDiff = end.getMonth() - start.getMonth();
        let months = years * 12 + monthsDiff;
        if (end.getDate() < start.getDate()) months--;
        if (months < 1) months = 1;

        // Используем данные сервера
        const monthlyPayment = contract.monthly_payment ?? 0;
        const totalAmount = contract.total_amount ?? 0;
        let overpayment = contract.overpayment ?? 0;

        // Если переплата не посчитана на сервере, считаем её на фронтенде
        if ((!overpayment || overpayment === 0) && contract.equipment && contract.equipment.cost) {
            const baseCost = Number(contract.equipment.cost) || 0;
            const total = Number(totalAmount) || 0;
            if (baseCost > 0 && total > 0) {
                overpayment = Math.max(total - baseCost, 0);
            }
        }

        return `
            <div class="contract-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f0f0f0;">
                    <h3 style="margin: 0; font-size: 20px; font-weight: 600;">Договор #${contract.id}</h3>
                    <span class="${statusClass}" style="padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">${statusText}</span>
                </div>
                <div class="info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; flex-grow: 1;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Оборудование</p>
                        <p style="margin: 0; font-size: 16px; font-weight: 500;">${contract.equipment ? `${contract.equipment.type} - ${contract.equipment.model}` : 'N/A'}</p>
                        ${contract.equipment ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Стоимость: ${contract.equipment.cost ? contract.equipment.cost.toLocaleString('ru-RU') + ' ₽' : '-'}</p>` : ''}
                    </div>
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Клиент</p>
                        <p style="margin: 0; font-size: 16px; font-weight: 500;">${contract.client ? `${contract.client.first_name} ${contract.client.last_name}` : 'N/A'}</p>
                        ${contract.client && contract.client.email ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">${contract.client.email}</p>` : ''}
                    </div>
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600;">Период лизинга</p>
                        <p style="margin: 0; font-size: 16px; font-weight: 500;">${startDate} - ${endDate}</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Срок: ${months} мес.</p>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333;">Лизинговая информация</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                        <div>
                            <p>Ежемесячный платеж: ${monthlyPayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</p>
                        </div>
                        <div>
                            <p>Общая сумма лизинга: ${totalAmount.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</p>
                        </div>
                        ${overpayment > 0 ? `
                        <div>
                            <p>Переплата: ${overpayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₽</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ${contract.client_notes ? `
                    <div style="margin-bottom: 16px; padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #856404;">Заметки клиента:</p>
                        <p style="margin: 0; font-size: 14px; color: #856404;">${contract.client_notes}</p>
                    </div>
                ` : ''}
                ${isManager ? `
                    <div class="actions" style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
                        <button class="btn btn-sm" onclick="window.editContract(${contract.id})" style="flex: 1; background: #2563eb; color: white;">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 4px;">
                                <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68609 11.9439 1.59231C12.1715 1.49853 12.4142 1.45166 12.6587 1.45468C12.9031 1.4577 13.1444 1.51055 13.3693 1.61001C13.5942 1.70947 13.7982 1.85343 13.97 2.03334C14.1418 2.21325 14.2778 2.42566 14.3708 2.65828C14.4638 2.8909 14.5118 3.13918 14.5118 3.39001C14.5118 3.64084 14.4638 3.88912 14.3708 4.12174C14.2778 4.35436 14.1418 4.56677 13.97 4.74668L5.16667 13.55L1.33333 14.6667L2.45 10.8333L11.333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Редактировать
                        </button>
                        ${contract.status === 'pending' ? `
                        <button class="btn btn-sm" onclick="window.setContractStatus(${contract.id}, 'in_processing')" style="flex: 1; background: #ffc107; color: #000;">В обработку</button>
                        <button class="btn btn-sm btn-success" onclick="window.approveContract(${contract.id})" style="flex: 1;">Одобрить</button>
                        <button class="btn btn-sm btn-danger" onclick="window.rejectContract(${contract.id})" style="flex: 1;">Отклонить</button>
                ` : ''}
                        ${contract.status === 'in_processing' ? `
                        <button class="btn btn-sm btn-success" onclick="window.approveContract(${contract.id})" style="flex: 1;">Одобрить</button>
                        <button class="btn btn-sm btn-danger" onclick="window.rejectContract(${contract.id})" style="flex: 1;">Отклонить</button>
                ` : ''}
                        ${contract.status === 'active' ? `
                            <button class="btn btn-sm" onclick="window.completeContract(${contract.id})" style="flex: 1;">Завершить</button>
                        ` : ''}
                        ${(contract.status === 'completed' || contract.status === 'rejected') ? `
                            <button class="btn btn-sm btn-danger" onclick="window.deleteContract(${contract.id})" style="flex: 1;">Удалить</button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    };

    // Для менеджера/админа разделяем заявки клиентов и остальные договоры
    if (isManager) {
        const applications = contracts.filter(c => c.status === 'pending' || c.status === 'in_processing');
        const others = contracts.filter(c => c.status !== 'pending' && c.status !== 'in_processing');

        let html = '';

        html += `
            <div style="grid-column: 1 / -1; margin-bottom: 8px;">
                <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Заявки от клиентов</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Заявки, ожидающие обработки менеджера.</p>
            </div>
        `;
        if (applications.length === 0) {
            html += `<div class="empty-state" style="grid-column: 1 / -1;">Нет заявок от клиентов</div>`;
        } else {
            html += applications.map(renderCard).join('');
        }

        html += `
            <div style="grid-column: 1 / -1; margin: 24px 0 8px;">
                <h3 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Договоры</h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Активные, завершенные и прочие договоры.</p>
            </div>
        `;
        if (others.length === 0) {
            html += `<div class="empty-state" style="grid-column: 1 / -1;">Нет договоров</div>`;
        } else {
            html += others.map(renderCard).join('');
        }

        grid.innerHTML = html;
    } else {
        // Для клиента отображаем плоский список
        grid.innerHTML = contracts.map(renderCard).join('');
    }
}

function renderEquipmentForLease(equipmentList) {
    const grid = document.getElementById('equipmentForLeaseGrid');
    if (!grid) return;

    if (equipmentList.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет доступного оборудования</div>';
        return;
    }

    // Показываем только доступное оборудование
    const availableEquipment = equipmentList.filter(eq => eq.status === 'available');

    if (availableEquipment.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет свободного оборудования для лизинга</div>';
        return;
    }

    grid.innerHTML = availableEquipment.map(eq => {
        return `
            <div class="equipment-card">
                ${eq.photo ? `<img src="${eq.photo}" alt="${eq.model}">` : 
                  `<div class="no-photo">Нет фото</div>`}
                <h3>${eq.type} - ${eq.model}</h3>
                ${eq.description ? `<p class="description">${eq.description}</p>` : ''}
                <div class="info">
                    <p><strong>Стоимость:</strong> ${eq.cost ? eq.cost.toLocaleString('ru-RU') + ' ₽' : '-'}</p>
                    ${eq.year ? `<p><strong>Год:</strong> ${eq.year}</p>` : ''}
                    <p><strong>Статус:</strong> <span class="status-available">Свободно</span></p>
                </div>
                <button class="btn btn-primary" onclick="window.openLeaseModal(${eq.id}, '${eq.type} - ${eq.model}', ${eq.cost})" style="width: 100%; margin-top: 12px;">Подать заявку на лизинг</button>
            </div>
        `;
    }).join('');
}

function openLeaseModal(equipmentId, equipmentName, equipmentCost) {
    const modal = document.getElementById('leaseModal');
    const form = document.getElementById('leaseForm');
    const errorEl = document.getElementById('leaseModalError');
    
    if (!modal || !form) return;
    
    document.getElementById('leaseEquipmentId').value = equipmentId;
    document.getElementById('leaseEquipmentName').textContent = equipmentName;
    document.getElementById('leaseEquipmentCost').textContent = `Стоимость: ${equipmentCost.toLocaleString('ru-RU')} ₽`;
    
    // Устанавливаем минимальную дату на сегодня
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leaseStartDate').min = today;
    document.getElementById('leaseEndDate').min = today;
    
    form.reset();
    document.getElementById('leaseEquipmentId').value = equipmentId;
    document.getElementById('leaseCalculation').style.display = 'none';
    
    if (errorEl) errorEl.classList.remove('show');
    modal.classList.add('show');
}

function closeLeaseModal() {
    const modal = document.getElementById('leaseModal');
    if (modal) modal.classList.remove('show');
    const form = document.getElementById('leaseForm');
    if (form) form.reset();
    if (window.clearErrors) window.clearErrors();
}

function calculateLeaseCost() {
    const startDate = document.getElementById('leaseStartDate').value;
    const endDate = document.getElementById('leaseEndDate').value;
    const costText = document.getElementById('leaseEquipmentCost').textContent;
    const equipmentCost = parseFloat(costText.replace(/[^\d.]/g, '')) || 0;
    
    if (!startDate || !endDate || !equipmentCost || equipmentCost === 0) {
        document.getElementById('leaseCalculation').style.display = 'none';
        return;
    }
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    if (end <= start) {
        document.getElementById('leaseCalculation').style.display = 'none';
        return;
    }
    
    // Точный расчет месяцев
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    let totalMonths = years * 12 + months;
    
    // Если день окончания меньше дня начала, вычитаем месяц
    if (end.getDate() < start.getDate()) {
        totalMonths--;
    }
    
    if (totalMonths < 1) {
        totalMonths = 1;
    }
    
    // Расчет: 15% годовых, аннуитетный платеж
    const interestRate = 0.15;
    const monthlyRate = interestRate / 12;
    
    if (monthlyRate === 0) {
        // Без процентов
        const monthlyPayment = equipmentCost / totalMonths;
        const totalAmount = equipmentCost;
        document.getElementById('leaseMonthlyPayment').textContent = monthlyPayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('leaseTotalAmount').textContent = totalAmount.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        // С процентами
        const pow = Math.pow(1 + monthlyRate, totalMonths);
        const monthlyPayment = equipmentCost * (monthlyRate * pow) / (pow - 1);
        const totalAmount = monthlyPayment * totalMonths;
        
        document.getElementById('leaseMonthlyPayment').textContent = monthlyPayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('leaseTotalAmount').textContent = totalAmount.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
    
    document.getElementById('leaseCalculation').style.display = 'block';
}

async function handleLeaseSubmit(e) {
    e.preventDefault();
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    if (window.clearErrors) window.clearErrors();
    
    const equipmentId = document.getElementById('leaseEquipmentId').value;
    const startDate = document.getElementById('leaseStartDate').value;
    const endDate = document.getElementById('leaseEndDate').value;
    const notes = document.getElementById('leaseNotes').value;
    
    if (!startDate || !endDate) {
        if (window.showError) window.showError('leaseModalError', 'Укажите даты начала и окончания');
        return;
    }
    
    // Форматируем даты в ISO 8601 формат для Go
    const startDateISO = new Date(startDate + 'T00:00:00Z').toISOString();
    const endDateISO = new Date(endDate + 'T00:00:00Z').toISOString();
    
    try {
        const response = await fetch(`${API_BASE}/contracts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                equipment_id: parseInt(equipmentId),
                start_date: startDateISO,
                end_date: endDateISO,
                client_notes: notes
            })
        });

        const data = await response.json();
        if (response.ok) {
            closeLeaseModal();
            if (window.loadContracts) loadContracts();
            if (window.loadEquipment) window.loadEquipment();
            if (window.showNotification) window.showNotification('Успешно', 'Заявка успешно подана! Менеджер рассмотрит её в ближайшее время.', 'success');
        } else {
            const errorMessage = data.error || 'Ошибка при создании заявки';

            // Если сервер сообщает, что нужен телефон, перенаправляем в профиль
            if (errorMessage.includes('номер телефона')) {
                closeLeaseModal();
                const confirmed = await window.showConfirm(
                    'Требуется заполнение профиля',
                    errorMessage,
                    'Для подачи заявки необходимо указать номер телефона в профиле. Перейти к заполнению профиля?'
                );
                if (confirmed) {
                    if (window.navigate) window.navigate('/profile');
                    setTimeout(() => {
                        const editBtn = document.getElementById('editProfileBtn');
                        if (editBtn) editBtn.click();
                    }, 500);
                }
                return;
            }

            if (window.showError) window.showError('leaseModalError', errorMessage);
        }
    } catch (error) {
        if (window.showError) window.showError('leaseModalError', 'Ошибка подключения к серверу');
    }
}

async function deleteContract(contractId) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    const confirmed = await window.showConfirm(
        'Удаление договора',
        'Вы уверены, что хотите удалить этот договор?',
        'Договор будет перенесен в архив и останется доступен администратору.'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            if (window.showNotification) window.showNotification('Успешно', 'Договор успешно удален и перенесен в архив.', 'success');
            loadContracts();
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка при удалении договора', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function approveContract(contractId) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    const confirmed = await window.showConfirm(
        'Одобрение заявки',
        'Вы уверены, что хотите одобрить эту заявку?',
        'Договор станет активным, оборудование будет закреплено за клиентом.'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'approved' })
        });

        if (response.ok) {
            if (window.showNotification) window.showNotification('Заявка одобрена', 'Договор успешно активирован.', 'success');
            loadContracts();
            if (window.loadEquipment) window.loadEquipment();
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка при одобрении заявки', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function rejectContract(contractId) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    const confirmed = await window.showConfirm(
        'Отклонение заявки',
        'Вы уверены, что хотите отклонить эту заявку?',
        'Заявка будет отклонена, оборудование останется доступным для других клиентов.'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'rejected' })
        });

        if (response.ok) {
            loadContracts();
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка при отклонении заявки', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function setContractStatus(contractId, status) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: status })
        });

        if (response.ok) {
            loadContracts();
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка при изменении статуса', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function editContract(contractId) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    // Открываем модальное окно создания договора с данными существующего договора
    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const contract = data.contract;
            
            // Заполняем форму данными договора
            const modal = document.getElementById('createContractModal');
            const form = document.getElementById('createContractForm');
            
            if (modal && form) {
                // Устанавливаем ID договора для редактирования
                form.dataset.contractId = contractId;
                
                // Загружаем клиентов и оборудование
                await openCreateContractModal();
                
                // Заполняем поля
                document.getElementById('contractClientId').value = contract.client_id;
                document.getElementById('contractEquipmentId').value = contract.equipment_id;
                document.getElementById('contractStartDate').value = new Date(contract.start_date).toISOString().split('T')[0];
                document.getElementById('contractEndDate').value = new Date(contract.end_date).toISOString().split('T')[0];
                document.getElementById('contractManagerNotes').value = contract.manager_notes || '';
                
                // Обновляем заголовок
                const modalTitle = modal.querySelector('h3');
                if (modalTitle) modalTitle.textContent = 'Редактировать договор';
                
                // Пересчитываем стоимость
                calculateContractCost();
            }
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка загрузки договора', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function completeContract(contractId) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    const confirmed = await window.showConfirm(
        'Завершение договора',
        'Вы уверены, что хотите завершить этот договор?',
        'Оборудование будет освобождено и станет доступным для других клиентов.'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (response.ok) {
            loadContracts();
            if (window.loadEquipment) window.loadEquipment();
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка при завершении договора', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка подключения', 'Не удалось подключиться к серверу. Проверьте подключение к интернету и попробуйте снова.', 'error', 'Если проблема сохраняется, обратитесь к администратору системы.');
    }
}

async function openCreateContractModal() {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const modal = document.getElementById('createContractModal');
    const form = document.getElementById('createContractForm');
    const clientSelect = document.getElementById('contractClientId');
    const equipmentSelect = document.getElementById('contractEquipmentId');
    
    if (!modal || !form || !clientSelect || !equipmentSelect) return;
    
    // Загружаем клиентов
    try {
        const clientsResponse = await fetch(`${API_BASE}/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (clientsResponse.ok) {
            const clientsData = await clientsResponse.json();
            clientSelect.innerHTML = '<option value="">Выберите клиента</option>';
            (clientsData.clients || []).forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = `${client.last_name} ${client.first_name} ${client.middle_name || ''} (${client.email})`;
                clientSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
    
    // Загружаем оборудование
    try {
        const equipmentResponse = await fetch(`${API_BASE}/equipment`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (equipmentResponse.ok) {
            const equipmentData = await equipmentResponse.json();
            equipmentSelect.innerHTML = '<option value="">Выберите оборудование</option>';
            (equipmentData.equipment || []).forEach(eq => {
                const option = document.createElement('option');
                option.value = eq.id;
                option.textContent = `${eq.type} - ${eq.model} (${eq.cost ? eq.cost.toLocaleString('ru-RU') + ' ₽' : '-'})`;
                option.dataset.cost = eq.cost || 0;
                equipmentSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading equipment:', error);
    }
    
    // Устанавливаем минимальную дату на сегодня
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('contractStartDate').min = today;
    document.getElementById('contractEndDate').min = today;
    
    form.reset();
    document.getElementById('contractCalculation').style.display = 'none';
    if (window.clearErrors) window.clearErrors();
    modal.classList.add('show');
    
    // Добавляем обработчики для расчета стоимости
    equipmentSelect.addEventListener('change', calculateContractCost);
    document.getElementById('contractStartDate').addEventListener('change', calculateContractCost);
    document.getElementById('contractEndDate').addEventListener('change', calculateContractCost);
}

function calculateContractCost() {
    const equipmentSelect = document.getElementById('contractEquipmentId');
    const startDate = document.getElementById('contractStartDate').value;
    const endDate = document.getElementById('contractEndDate').value;
    
    if (!equipmentSelect.value || !startDate || !endDate) {
        document.getElementById('contractCalculation').style.display = 'none';
        return;
    }
    
    const equipmentCost = parseFloat(equipmentSelect.options[equipmentSelect.selectedIndex].dataset.cost) || 0;
    if (equipmentCost === 0) {
        document.getElementById('contractCalculation').style.display = 'none';
        return;
    }
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    if (end <= start) {
        document.getElementById('contractCalculation').style.display = 'none';
        return;
    }
    
    // Расчет месяцев
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    let totalMonths = years * 12 + months;
    if (end.getDate() < start.getDate()) {
        totalMonths--;
    }
    if (totalMonths < 1) totalMonths = 1;
    
    // Расчет стоимости (используем правильную формулу со сложными процентами)
    const interestRate = 0.15; // 15% годовых
    const monthlyRate = Math.pow(1 + interestRate, 1.0/12) - 1; // Месячная ставка из годовой
    let monthlyPayment, totalAmount, overpayment;
    
    if (monthlyRate === 0) {
        monthlyPayment = equipmentCost / totalMonths;
        totalAmount = equipmentCost;
        overpayment = 0;
    } else {
        const pow = Math.pow(1 + monthlyRate, totalMonths);
        monthlyPayment = equipmentCost * (monthlyRate * pow) / (pow - 1);
        totalAmount = monthlyPayment * totalMonths;
        overpayment = totalAmount - equipmentCost;
    }
    
    document.getElementById('contractMonthlyPayment').textContent = monthlyPayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('contractTotalAmount').textContent = totalAmount.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('contractOverpayment').textContent = overpayment.toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('contractCalculation').style.display = 'block';
}

function closeCreateContractModal() {
    const modal = document.getElementById('createContractModal');
    if (modal) modal.classList.remove('show');
    const form = document.getElementById('createContractForm');
    if (form) {
        form.reset();
        delete form.dataset.contractId; // Очищаем ID редактирования
    }
    const modalTitle = modal?.querySelector('h3');
    if (modalTitle) modalTitle.textContent = 'Создать договор';
    if (window.clearErrors) window.clearErrors();
}

async function handleCreateContractSubmit(e) {
    e.preventDefault();
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    if (window.clearErrors) window.clearErrors();
    
    const form = document.getElementById('createContractForm');
    const contractId = form.dataset.contractId; // ID для редактирования
    
    const clientId = document.getElementById('contractClientId').value;
    const equipmentId = document.getElementById('contractEquipmentId').value;
    const startDate = document.getElementById('contractStartDate').value;
    const endDate = document.getElementById('contractEndDate').value;
    const managerNotes = document.getElementById('contractManagerNotes').value;
    
    if (!clientId || !equipmentId || !startDate || !endDate) {
        if (window.showError) window.showError('createContractModalError', 'Заполните все обязательные поля');
        return;
    }
    
    // Форматируем даты в ISO 8601
    const startDateISO = new Date(startDate + 'T00:00:00Z').toISOString();
    const endDateISO = new Date(endDate + 'T00:00:00Z').toISOString();
    
    try {
        // Сначала получаем информацию об оборудовании для расчета стоимости
        const equipmentResponse = await fetch(`${API_BASE}/equipment/${equipmentId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!equipmentResponse.ok) {
            if (window.showError) window.showError('createContractModalError', 'Ошибка загрузки данных об оборудовании');
            return;
        }
        
        const equipmentData = await equipmentResponse.json();
        const equipment = equipmentData.equipment;
        
        // Рассчитываем стоимость (используем правильную формулу со сложными процентами)
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const years = end.getFullYear() - start.getFullYear();
        const months = end.getMonth() - start.getMonth();
        let totalMonths = years * 12 + months;
        if (end.getDate() < start.getDate()) {
            totalMonths--;
        }
        if (totalMonths < 1) totalMonths = 1;
        
        const interestRate = 0.15;
        const monthlyRate = Math.pow(1 + interestRate, 1.0/12) - 1; // Месячная ставка из годовой
        let monthlyPayment, totalAmount;
        
        if (monthlyRate === 0) {
            monthlyPayment = equipment.cost / totalMonths;
            totalAmount = equipment.cost;
        } else {
            const pow = Math.pow(1 + monthlyRate, totalMonths);
            monthlyPayment = equipment.cost * (monthlyRate * pow) / (pow - 1);
            totalAmount = monthlyPayment * totalMonths;
        }
        
        if (contractId) {
            // Редактирование существующего договора
            const response = await fetch(`${API_BASE}/contracts/${contractId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    monthly_payment: Math.round(monthlyPayment * 100) / 100,
                    manager_notes: managerNotes
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                closeCreateContractModal();
                await loadContracts();
                if (window.showNotification) window.showNotification('Успешно', 'Договор успешно обновлен!', 'success');
            } else {
                if (window.showError) window.showError('createContractModalError', data.error || 'Ошибка обновления договора');
            }
        } else {
            // Создание нового договора
            const response = await fetch(`${API_BASE}/contracts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    client_id: parseInt(clientId),
                    equipment_id: parseInt(equipmentId),
                    start_date: startDateISO,
                    end_date: endDateISO,
                    monthly_payment: Math.round(monthlyPayment * 100) / 100,
                    total_amount: Math.round(totalAmount * 100) / 100,
                    status: 'active',
                    manager_notes: managerNotes
                })
            });
        
            const data = await response.json();
        
            if (response.ok) {
                closeCreateContractModal();
                await loadContracts();
                if (window.showNotification) window.showNotification('Успешно', 'Договор успешно создан!', 'success');
            } else {
                if (window.showError) window.showError('createContractModalError', data.error || 'Ошибка создания договора');
            }
        }
    } catch (error) {
        if (window.showError) window.showError('createContractModalError', 'Ошибка подключения к серверу');
    }
}

// Инициализация обработчиков фильтров
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const clientFilter = document.getElementById('filterContractClient');
        const termFilter = document.getElementById('filterContractTerm');
        const idFilter = document.getElementById('filterContractId');
        const clearBtn = document.getElementById('clearContractFiltersBtn');
        const archivedBtn = document.getElementById('showArchivedContractsBtn');
        
        if (clientFilter) {
            clientFilter.addEventListener('change', applyContractFilters);
        }
        if (termFilter) {
            termFilter.addEventListener('change', applyContractFilters);
        }
        if (idFilter) {
            idFilter.addEventListener('input', applyContractFilters);
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (clientFilter) clientFilter.value = '';
                if (termFilter) termFilter.value = '';
                if (idFilter) idFilter.value = '';
                applyContractFilters();
            });
        }

        if (archivedBtn) {
            archivedBtn.addEventListener('click', () => {
                // При повторном нажатии возвращаемся к обычным договорам
                if (archivedBtn.dataset.mode === 'archived') {
                    archivedBtn.dataset.mode = 'active';
                    archivedBtn.textContent = 'Архивные договоры';
                    loadContracts();
                } else {
                    archivedBtn.dataset.mode = 'archived';
                    archivedBtn.textContent = 'Текущие договоры';
                    loadArchivedContracts();
                }
            });
        }
    });
}

// Экспорт функций в глобальную область видимости
window.loadContracts = loadContracts;
window.loadArchivedContracts = loadArchivedContracts;
window.applyContractFilters = applyContractFilters;
window.renderContracts = renderContracts;
window.renderEquipmentForLease = renderEquipmentForLease;
window.openLeaseModal = openLeaseModal;
window.closeLeaseModal = closeLeaseModal;
window.calculateLeaseCost = calculateLeaseCost;
window.handleLeaseSubmit = handleLeaseSubmit;
window.deleteContract = deleteContract;
window.approveContract = approveContract;
window.rejectContract = rejectContract;
window.setContractStatus = setContractStatus;
window.editContract = editContract;
window.completeContract = completeContract;
window.openCreateContractModal = openCreateContractModal;
window.calculateContractCost = calculateContractCost;
window.closeCreateContractModal = closeCreateContractModal;
window.handleCreateContractSubmit = handleCreateContractSubmit;

