// Модуль для работы с клиентами
// Использует глобальные переменные из config.js: API_BASE, authToken, currentUser

let allClients = [];

async function loadClients() {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state loading">Загрузка...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/clients`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            allClients = data.clients || [];
            applyFiltersAndSort();
        } else if (response.status === 401 || response.status === 403) {
            window.setAuthToken(null);
            window.setCurrentUser({});
            if (window.hideHeader) window.hideHeader();
            if (window.showAuthRequiredModal) window.showAuthRequiredModal();
            if (window.navigate) window.navigate('/home');
        } else {
            const data = await response.json();
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${data.error || 'Ошибка загрузки данных'}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Ошибка подключения</td></tr>';
    }
}

function applyFiltersAndSort() {
    let filtered = [...allClients];

    const searchInput = document.getElementById('searchClients');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(client => {
            const fullName = `${client.first_name || ''} ${client.last_name || ''} ${client.middle_name || ''}`.toLowerCase();
            const email = (client.email || '').toLowerCase();
            const phone = (client.phone || '').toLowerCase();
            const company = (client.company_name || '').toLowerCase();
            const inn = (client.inn || '').toLowerCase();
            return fullName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm) || company.includes(searchTerm) || inn.includes(searchTerm);
        });
    }

    const sortSelect = document.getElementById('sortClients');
    const sortValue = sortSelect?.value || 'id_asc';
    filtered.sort((a, b) => {
        switch(sortValue) {
            case 'id_asc': return a.id - b.id;
            case 'id_desc': return b.id - a.id;
            case 'name_asc': 
                const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                return nameA.localeCompare(nameB, 'ru');
            case 'name_desc':
                const nameA2 = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                const nameB2 = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                return nameB2.localeCompare(nameA2, 'ru');
            case 'email_asc': return (a.email || '').localeCompare(b.email || '', 'ru');
            case 'email_desc': return (b.email || '').localeCompare(a.email || '', 'ru');
            default: return 0;
        }
    });
    
    renderClients(filtered);
}

function renderClients(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Нет клиентов</td></tr>';
        return;
    }

    tbody.innerHTML = clients.map(client => {
        const fullName = `${client.last_name || ''} ${client.first_name || ''} ${client.middle_name || ''}`.trim();
        const phone = client.phone || 'Не указан';
        const company = client.company_name || 'Не указана';
        const inn = client.inn || 'Не указан';
        
        return `
            <tr>
                <td style="padding: 12px;">${client.id}</td>
                <td style="padding: 12px;">${fullName || 'Не указано'}</td>
                <td style="padding: 12px;">${client.email || 'Не указан'}</td>
                <td style="padding: 12px;">${phone}</td>
                <td style="padding: 12px;">${company}</td>
                <td style="padding: 12px;">${inn}</td>
                <td style="padding: 12px;">
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.editClient(${client.id})" title="Редактировать">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M11.333 2.00001C11.5084 1.82465 11.7163 1.68609 11.9439 1.59231C12.1715 1.49853 12.4142 1.45166 12.6587 1.45468C12.9031 1.4577 13.1444 1.51055 13.3693 1.61001C13.5942 1.70947 13.7982 1.85343 13.97 2.03334C14.1418 2.21325 14.2778 2.42566 14.3708 2.65828C14.4638 2.8909 14.5118 3.13918 14.5118 3.39001C14.5118 3.64084 14.4638 3.88912 14.3708 4.12174C14.2778 4.35436 14.1418 4.56677 13.97 4.74668L5.16667 13.55L1.33333 14.6667L2.45 10.8333L11.333 2.00001Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="window.deleteClient(${client.id})" title="Удалить">
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

function openClientModal(clientId = null) {
    console.log('openClientModal called with clientId:', clientId);
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('modalTitle');
    const errorEl = document.getElementById('modalError');
    
    console.log('Modal element:', modal);
    console.log('Form element:', form);
    
    if (!modal) {
        console.error('clientModal element not found');
        return;
    }
    if (!form) {
        console.error('clientForm element not found');
        return;
    }
    
    if (clientId) {
        loadClientData(clientId);
    } else {
        if (title) title.textContent = 'Добавить клиента';
        form.reset();
        const clientIdInput = document.getElementById('clientId');
        if (clientIdInput) clientIdInput.value = '';
        if (errorEl) {
            errorEl.classList.remove('show');
            errorEl.textContent = '';
        }
        console.log('Adding show class to modal');
        modal.classList.add('show');
        console.log('Modal classes after adding show:', modal.className);
        console.log('Modal computed display:', window.getComputedStyle(modal).display);
    }
}

async function loadClientData(id) {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const modal = document.getElementById('clientModal');
    const form = document.getElementById('clientForm');
    const title = document.getElementById('modalTitle');
    
    try {
        const response = await fetch(`${API_BASE}/clients/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const client = data.client;
            
            if (title) title.textContent = 'Редактировать клиента';
            const clientIdInput = document.getElementById('clientId');
            if (clientIdInput) clientIdInput.value = client.id;
            const firstNameInput = document.getElementById('firstName');
            if (firstNameInput) firstNameInput.value = client.first_name || '';
            const lastNameInput = document.getElementById('lastName');
            if (lastNameInput) lastNameInput.value = client.last_name || '';
            const middleNameInput = document.getElementById('middleName');
            if (middleNameInput) middleNameInput.value = client.middle_name || '';
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.value = client.email || '';
            const phoneInput = document.getElementById('phone');
            if (phoneInput) phoneInput.value = client.phone || '';
            const companyInput = document.getElementById('companyName');
            if (companyInput) companyInput.value = client.company_name || '';
            const innInput = document.getElementById('inn');
            if (innInput) innInput.value = client.inn || '';
            const addressInput = document.getElementById('address');
            if (addressInput) addressInput.value = client.address || '';
            
            if (modal) modal.classList.add('show');
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка загрузки данных', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка', 'Ошибка подключения к серверу', 'error');
    }
}

async function handleClientSubmit(e) {
    e.preventDefault();
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    if (window.clearErrors) window.clearErrors();
    
    const clientIdInput = document.getElementById('clientId');
    const id = clientIdInput ? clientIdInput.value : '';
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const middleNameInput = document.getElementById('middleName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const companyInput = document.getElementById('companyName');
    const innInput = document.getElementById('inn');
    const addressInput = document.getElementById('address');
    
    const data = {
        first_name: firstNameInput ? firstNameInput.value.trim() : '',
        last_name: lastNameInput ? lastNameInput.value.trim() : '',
        middle_name: middleNameInput ? middleNameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        phone: phoneInput ? phoneInput.value.trim() : '',
        company_name: companyInput ? companyInput.value.trim() : '',
        inn: innInput ? innInput.value.trim() : '',
        address: addressInput ? addressInput.value.trim() : ''
    };
    
    try {
        const url = id ? `${API_BASE}/clients/${id}` : `${API_BASE}/clients`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (response.ok) {
            const modal = document.getElementById('clientModal');
            if (modal) modal.classList.remove('show');
            await loadClients();
            if (window.showNotification) window.showNotification('Успешно', id ? 'Клиент обновлен!' : 'Клиент добавлен!', 'success');
        } else {
            if (window.showError) {
                window.showError('modalError', result.error || 'Ошибка сохранения');
            } else if (window.showNotification) {
                window.showNotification('Ошибка', result.error || 'Ошибка сохранения', 'error');
            }
        }
    } catch (error) {
        if (window.showError) {
            window.showError('modalError', 'Ошибка подключения к серверу');
        } else if (window.showNotification) {
            window.showNotification('Ошибка', 'Ошибка подключения к серверу', 'error');
        }
    }
}

let clientToDelete = null;

function deleteClient(id) {
    clientToDelete = id;
    const modal = document.getElementById('deleteClientModal');
    if (modal) modal.classList.add('show');
}

function closeDeleteClientModal() {
    const modal = document.getElementById('deleteClientModal');
    if (modal) modal.classList.remove('show');
    clientToDelete = null;
}

async function confirmDeleteClient() {
    if (!clientToDelete) return;
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;

    try {
        const response = await fetch(`${API_BASE}/clients/${clientToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            closeDeleteClientModal();
            loadClients();
            if (window.showNotification) window.showNotification('Успешно', 'Клиент успешно удален', 'success');
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка удаления клиента', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка', 'Ошибка подключения к серверу', 'error');
    }
}

function editClient(id) {
    openClientModal(id);
}

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('searchClients');
        const sortSelect = document.getElementById('sortClients');
        const clearBtn = document.getElementById('clearFiltersBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', applyFiltersAndSort);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', applyFiltersAndSort);
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (sortSelect) sortSelect.value = 'id_asc';
                applyFiltersAndSort();
            });
        }
    });
}

window.loadClients = loadClients;
window.applyFiltersAndSort = applyFiltersAndSort;
window.renderClients = renderClients;
window.openClientModal = openClientModal;
window.loadClientData = loadClientData;
window.handleClientSubmit = handleClientSubmit;
window.deleteClient = deleteClient;
window.closeDeleteClientModal = closeDeleteClientModal;
window.confirmDeleteClient = confirmDeleteClient;
window.editClient = editClient;

