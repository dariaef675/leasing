// Simple router for SPA
const router = window.router = {
    currentPage: 'home',
    history: [],

    init() {
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });


        const initialPath = window.location.pathname.replace(/^\/+/, '') || 'home';
        this.history = [initialPath];
        this.handleRoute(window.location.pathname);

        window.addEventListener('pagechange', (e) => {
            const page = e.detail.page;

            switch (page) {
                case 'equipment':
                    if (window.loadEquipment) {
                        window.loadEquipment();
                    }
                    setTimeout(() => {
                        const addEquipmentBtn = document.getElementById('addEquipmentBtn');
                        if (addEquipmentBtn && !addEquipmentBtn.dataset.listenerAttached) {
                            addEquipmentBtn.dataset.listenerAttached = 'true';
                            addEquipmentBtn.addEventListener('click', () => {
                                console.log('Add equipment button clicked from equipment page');
                                if (window.openEquipmentModal) {
                                    window.openEquipmentModal();
                                } else {
                                    console.error('openEquipmentModal is not defined');
                                }
                            });
                        }
                    }, 100);
                    break;

                case 'clients':
                    if (window.loadClients) {
                        window.loadClients();
                    }

                    setTimeout(() => {
                        const addClientBtn = document.getElementById('addClientBtn');
                        if (addClientBtn && !addClientBtn.dataset.listenerAttached) {
                            addClientBtn.dataset.listenerAttached = 'true';
                            addClientBtn.addEventListener('click', () => {
                                console.log('Add client button clicked from clients page');
                                if (window.openClientModal) {
                                    window.openClientModal();
                                } else {
                                    console.error('openClientModal is not defined');
                                }
                            });
                        }
                    }, 100);
                    break;

                case 'contracts':
                    if (window.loadContracts) {
                        window.loadContracts();
                    }
                    break;

                case 'stats':
                    if (window.loadStats) {
                        window.loadStats();
                    }
                    break;

                case 'profile':
                    if (window.loadClientProfile) {
                        window.loadClientProfile();
                    }
                    setTimeout(() => {
                        if (window.setupProfileEdit) window.setupProfileEdit();
                    }, 100);
                    break;

                case 'users':
                    if (window.loadUsers) {
                        window.loadUsers();
                    }
                    break;

                case 'admin':

                    break;
            }
        });
    },

    navigate(path) {

        const normalizedPath = path.replace(/^\/+/, '') || 'home';
        if (this.history[this.history.length - 1] !== normalizedPath) {
            this.history.push(normalizedPath);
            if (this.history.length > 50) {
                this.history.shift();
            }
        }
        
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    },

    handleRoute(path) {

        path = path.replace(/^\/+/, '') || 'home';


        const protectedPages = ['dashboard', 'clients', 'equipment', 'contracts', 'stats', 'profile', 'admin', 'users'];
        if (protectedPages.includes(path)) {
            const authToken = localStorage.getItem('authToken');
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            if (!authToken || !currentUser.email) {
                if (window.showAuthRequiredModal) {
                    window.showAuthRequiredModal();
                }
                path = 'home';
            } else if (path === 'dashboard' && currentUser.role === 'Administrator') {
                path = 'admin';
            }
        }
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        const pageMap = {
            '': 'homePage',
            'home': 'homePage',
            'login': 'authPage',
            'register': 'authPage',
            'dashboard': 'dashboardPage',
            'clients': 'clientsPage',
            'equipment': 'equipmentPage',
            'contracts': 'contractsPage',
            'stats': 'statsPage',
            'profile': 'clientProfilePage',
            'admin': 'adminPage',
            'users': 'usersPage',
            'about': 'aboutPage'
        };

        const pageId = pageMap[path] || 'homePage';
        const page = document.getElementById(pageId);

        console.log('Router: path =', path, 'pageId =', pageId, 'page element =', page);

        if (page) {
            page.style.display = 'block';
            this.currentPage = path;
            console.log('Page displayed:', pageId);
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === path) {
                    link.classList.add('active');
                }
            });
            window.dispatchEvent(new CustomEvent('pagechange', { detail: { page: path } }));
        } else {
            console.error('Router: Page element not found for pageId:', pageId);
            const homePage = document.getElementById('homePage');
            if (homePage) {
                homePage.style.display = 'block';
                this.currentPage = 'home';
            }
        }
    }
};

function navigate(path) {
    router.navigate(path);
}

window.navigate = navigate;

document.addEventListener('DOMContentLoaded', () => {
    router.init();
});


