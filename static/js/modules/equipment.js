

async function loadEquipment() {
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="empty-state">Загрузка...</div>';
    try{
        const response = await fetch(`${API_BASE}/equipment`, {
            headers : { 'Authorization' : `Bearer ${authToken}`}
        });
        if (response.ok) {
            const data = await response.json();
            renderEquipment(data.equipment || []);

        } else if (response.status === 401 || response.status === 403) {
            window.setAuthToken(null);
            window.setCurrentUser({});
            if (window.hideHeader) window.hideHeader();
            if (window.showAuthRequiredModal) window.showAuthRequiredModal();
            if (window.navigate) window.navigate('/home');
        } else {
            const data = await response.json();
            grid.innerHTML = `<div class="empty-state">${data.error || 'Ошибка загрузки данных'}</div>`;
        }
    }
    catch (error) {
        grid.innerHTML = '<div class="empty-state">Ошибка подключения</div>';
    }
}

function renderEquipment(equipmentList) {
    const currentUser = window.getCurrentUser();
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    if (equipmentList.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет оборудования</div>';
        return;
    }

    const isManager = currentUser && (currentUser.role === 'Manager' || currentUser.role === 'Administrator');
    const isClient = currentUser && currentUser.role === 'Client';

    grid.innerHTML = equipmentList.map(eq => {
        const statusText = eq.status === 'available' ? 'Свободно' : 
                          eq.status === 'in_lease' ? 'В лизинге' : 'Возвращено';
        const statusClass = eq.status === 'available' ? 'status-available' : 
                           eq.status === 'in_lease' ? 'status-leased' : 'status-returned';
        const clientInfo = eq.client ? 
            `<p><strong>Клиент:</strong> ${eq.client.first_name} ${eq.client.last_name}</p>` : 
            '';
        const yearInfo = eq.year ? `${eq.year} г.` : 'Год не указан';
        const typeLabel = eq.type || 'Оборудование';
        
        return `
            <div class="equipment-card">
                <div class="equipment-status-chip ${statusClass}">${statusText}</div>
                ${eq.photo ? `<img src="${eq.photo}" alt="${eq.model}">` : 
                  `<div class="no-photo">Нет фото</div>`}
                <div class="equipment-meta">
                    <span>${typeLabel}</span>
                    <span>${yearInfo}</span>
                </div>
                <h3>${eq.model || 'Без модели'}</h3>
                ${eq.description ? `<p class="description">${eq.description}</p>` : ''}
                <div class="equipment-price">
                    ${eq.cost ? eq.cost.toLocaleString('ru-RU') + ' ₽' : 'Цена не указана'}
                </div>
                <div class="info">
                    ${clientInfo}
                </div>
                ${isManager ? `
                    <div class="actions">
                        <button class="btn btn-sm" onclick="window.openEquipmentModal(${eq.id})" style="flex: 1;">Редактировать</button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteEquipment(${eq.id})" style="flex: 1;">Удалить</button>
                    </div>
                ` : ''}
                ${isClient && eq.status === 'available' ? `
                    <div style="display: flex; margin-top: 12px;">
                        <button class="btn btn-primary" onclick="window.openLeaseModal(${eq.id}, '${eq.type} - ${eq.model}', ${eq.cost})" style="width: 100%;">Подать заявку</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openEquipmentModal(id) {
    console.log('openEquipmentModal called with id:', id);
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    const modal = document.getElementById('equipmentModal');
    const form = document.getElementById('equipmentForm');
    const title = document.getElementById('equipmentModalTitle');
    const errorEl = document.getElementById('equipmentModalError');
    
    console.log('Modal element:', modal);
    console.log('Form element:', form);
    
    if (!modal) {
        console.error('equipmentModal element not found');
        return;
    }
    if (!form) {
        console.error('equipmentForm element not found');
        return;
    }
    
    if (id) {
        // Редактирование
        title.textContent = 'Редактировать оборудование';
        fetch(`${API_BASE}/equipment/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        .then(r => r.json())
        .then(data => {
            if (data.equipment) {
                const eq = data.equipment;
                document.getElementById('equipmentId').value = eq.id;
                document.getElementById('equipmentType').value = eq.type;
                document.getElementById('equipmentModel').value = eq.model || '';
                document.getElementById('equipmentSerial').value = eq.serial || '';
                document.getElementById('equipmentYear').value = eq.year || '';
                document.getElementById('equipmentCost').value = eq.cost || '';
                document.getElementById('equipmentPhoto').value = eq.photo || '';
                document.getElementById('equipmentDescription').value = eq.description || '';
                console.log('Adding show class to modal');
                modal.classList.add('show');
                console.log('Modal classes after adding show:', modal.className);
            }
        });
    } else {
        // Создание
        if (title) title.textContent = 'Добавить оборудование';
        form.reset();
        const idInput = document.getElementById('equipmentId');
        if (idInput) idInput.value = '';
        const typeInput = document.getElementById('equipmentType');
        if (typeInput) typeInput.value = '';
        const modelInput = document.getElementById('equipmentModel');
        if (modelInput) modelInput.value = '';
        const serialInput = document.getElementById('equipmentSerial');
        if (serialInput) serialInput.value = '';
        const yearInput = document.getElementById('equipmentYear');
        if (yearInput) yearInput.value = '';
        const costInput = document.getElementById('equipmentCost');
        if (costInput) costInput.value = '';
        const photoInput = document.getElementById('equipmentPhoto');
        if (photoInput) photoInput.value = '';
        const descInput = document.getElementById('equipmentDescription');
        if (descInput) descInput.value = '';
        console.log('Adding show class to modal');
        modal.classList.add('show');
        console.log('Modal classes after adding show:', modal.className);
    }
    
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
}

function closeEquipmentModal() {
    console.log('closeEquipmentModal called');
    const modal = document.getElementById('equipmentModal');
    console.log('Modal element:', modal);
    if (modal) {
        console.log('Removing show class from modal');
        modal.classList.remove('show');
        console.log('Modal classes after removing show:', modal.className);
    } else {
        console.error('equipmentModal element not found');
    }
    const form = document.getElementById('equipmentForm');
    if (form) form.reset();
    if (window.clearErrors) window.clearErrors();
}

async function handleEquipmentSubmit(e) {
    e.preventDefault();
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;
    
    if (window.clearErrors) window.clearErrors();
    
    const id = document.getElementById('equipmentId').value;
    const data = {
        type: document.getElementById('equipmentType').value,
        model: document.getElementById('equipmentModel').value,
        serial: document.getElementById('equipmentSerial').value,
        year: parseInt(document.getElementById('equipmentYear').value) || 0,
        cost: parseFloat(document.getElementById('equipmentCost').value) || 0,
        photo: document.getElementById('equipmentPhoto').value,
        description: document.getElementById('equipmentDescription').value
    };
    
    try {
        const url = id ? `${API_BASE}/equipment/${id}` : `${API_BASE}/equipment`;
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
            closeEquipmentModal();
            await loadEquipment();
            if (window.showNotification) window.showNotification('Успешно', id ? 'Оборудование обновлено!' : 'Оборудование добавлено!', 'success');
        } else {
            if (window.showError) window.showError('equipmentModalError', result.error || 'Ошибка сохранения');
        }
    } catch (error) {
        if (window.showError) window.showError('equipmentModalError', 'Ошибка подключения к серверу');
    }
}

let equipmentToDelete = null;

function deleteEquipment(id) {
    equipmentToDelete = id;
    const modal = document.getElementById('deleteEquipmentModal');
    if (modal) modal.classList.add('show');
}

function closeDeleteEquipmentModal() {
    const modal = document.getElementById('deleteEquipmentModal');
    if (modal) modal.classList.remove('show');
    equipmentToDelete = null;
}

async function confirmDeleteEquipment() {
    if (!equipmentToDelete) return;
    const authToken = window.getAuthToken();
    const API_BASE = window.API_BASE;

    try {
        const response = await fetch(`${API_BASE}/equipment/${equipmentToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            closeDeleteEquipmentModal();
            loadEquipment();
            if (window.showNotification) window.showNotification('Успешно', 'Оборудование успешно удалено', 'success');
        } else {
            const data = await response.json();
            if (window.showNotification) window.showNotification('Ошибка', data.error || 'Ошибка удаления оборудования', 'error');
        }
    } catch (error) {
        if (window.showNotification) window.showNotification('Ошибка', 'Ошибка подключения к серверу', 'error');
    }
}

window.loadEquipment = loadEquipment;
window.renderEquipment = renderEquipment;
window.openEquipmentModal = openEquipmentModal;
window.closeEquipmentModal = closeEquipmentModal;
window.handleEquipmentSubmit = handleEquipmentSubmit;
window.deleteEquipment = deleteEquipment;
window.closeDeleteEquipmentModal = closeDeleteEquipmentModal;
window.confirmDeleteEquipment = confirmDeleteEquipment;

