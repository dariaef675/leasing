// Модальные окна (уведомления и подтверждения)

function showAuthRequiredModal() {
    const modal = document.getElementById('authRequiredModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAuthRequiredModal() {
    console.log('closeAuthRequiredModal called');
    const modal = document.getElementById('authRequiredModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        setTimeout(() => {
            modal.style.display = '';
        }, 100);
    }
}

function showNotification(title, message, type = 'info', details = null) {
    const modal = document.getElementById('notificationModal');
    const modalTitle = document.getElementById('notificationModalTitle');
    const modalMessage = document.getElementById('notificationModalMessage');
    const modalIcon = document.getElementById('notificationModalIcon');
    const modalDetails = document.getElementById('notificationModalDetails');
    const modalHeader = document.getElementById('notificationModalHeader');
    
    if (!modal) return;
    

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    

    let iconColor = '#374151';
    let headerBg = '#f8f9fa';
    let headerBorder = '#e5e7eb';
    
    switch(type) {
        case 'error':
            iconColor = '#cc0000';
            headerBg = '#fef2f2';
            headerBorder = '#fecaca';
            modalIcon.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            `;
            break;
        case 'success':
            iconColor = '#059669';
            headerBg = '#f0fdf4';
            headerBorder = '#bbf7d0';
            modalIcon.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
            `;
            break;
        case 'warning':
            iconColor = '#d97706';
            headerBg = '#fffbeb';
            headerBorder = '#fde68a';
            modalIcon.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
            `;
            break;
        default: // info
            iconColor = '#2563eb';
            headerBg = '#eff6ff';
            headerBorder = '#bfdbfe';
            modalIcon.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
            `;
    }

    modalHeader.style.background = '#ffffff';
    modalHeader.style.borderBottom = `1px solid ${headerBorder}`;
    

    if (details) {
        modalDetails.style.display = 'block';
        modalDetails.querySelector('p').textContent = details;
    } else {
        modalDetails.style.display = 'none';
    }
    

    modal.classList.add('show');
}


let confirmModalResolve = null;

function showConfirm(title, message, details = null) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('confirmModalTitle');
        const modalMessage = document.getElementById('confirmModalMessage');
        const modalDetails = document.getElementById('confirmModalDetails');
        
        if (!modal) {
            resolve(false);
            return;
        }
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        if (details) {
            modalDetails.style.display = 'block';
            modalDetails.querySelector('p').textContent = details;
        } else {
            modalDetails.style.display = 'none';
        }
        
        confirmModalResolve = resolve;
        modal.classList.add('show');
    });
}

function closeConfirmModal(result = false) {
    console.log('closeConfirmModal called with result:', result);
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        setTimeout(() => {
            modal.style.display = '';
        }, 100);
    }
    if (confirmModalResolve) {
        confirmModalResolve(result);
        confirmModalResolve = null;
    }
}

function closeNotificationModal() {
    console.log('closeNotificationModal called');
    const modal = document.getElementById('notificationModal');
    console.log('Notification modal element:', modal);
    if (modal) {
        console.log('Removing show class from notification modal');
        modal.classList.remove('show');
        console.log('Modal classes after removing show:', modal.className);

        modal.style.display = 'none';
        setTimeout(() => {
            modal.style.display = '';
        }, 100);
    } else {
        console.error('notificationModal element not found');
    }
}

window.showAuthRequiredModal = showAuthRequiredModal;
window.closeAuthRequiredModal = closeAuthRequiredModal;
window.showNotification = showNotification;
window.showConfirm = showConfirm;
window.closeConfirmModal = closeConfirmModal;
window.closeNotificationModal = closeNotificationModal;

