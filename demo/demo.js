// Демо-режим для GitHub Pages: сервера нет, запросы к /api/v1 обрабатываются
// прямо в браузере на тестовых данных. Данные сбрасываются при обновлении страницы.
(function () {
    const API = '/api/v1';
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const daysAgo = (n) => new Date(now - n * DAY).toISOString();
    const daysAhead = (n) => new Date(now + n * DAY).toISOString();

    // ---------- тестовые данные ----------

    const users = [
        { id: 1, email: 'admin@leasing.local', first_name: 'Анна', last_name: 'Администратова', phone: '+7 (900) 000-00-01', role: 'Administrator', approved: true, created_at: daysAgo(400) },
        { id: 2, email: 'manager@leasing.local', first_name: 'Иван', last_name: 'Менеджеров', phone: '+7 (900) 000-00-02', role: 'Manager', approved: true, created_at: daysAgo(380) },
        { id: 3, email: 'client@leasing.local', first_name: 'Олег', last_name: 'Соколов', phone: '+7 (900) 000-00-03', role: 'Client', approved: true, created_at: daysAgo(300) },
        { id: 4, email: 'manager2@leasing.local', first_name: 'Мария', last_name: 'Управляющая', phone: '+7 (900) 000-00-04', role: 'Manager', approved: true, created_at: daysAgo(250) },
        { id: 5, email: 'newmanager@leasing.local', first_name: 'Пётр', last_name: 'Новиков', phone: '+7 (900) 000-00-05', role: 'Manager', approved: false, created_at: daysAgo(3) },
        { id: 6, email: 'client2@leasing.local', first_name: 'Елена', last_name: 'Кузнецова', phone: '+7 (900) 000-00-06', role: 'Client', approved: true, created_at: daysAgo(120) },
    ];

    const clients = [
        { id: 1, user_id: 3, first_name: 'Олег', last_name: 'Соколов', middle_name: 'Игоревич', email: 'client@leasing.local', phone: '+7 (900) 000-00-03', company_name: 'ООО «СтройТех»', inn: '7700000001', address: 'г. Москва, ул. Примерная, д. 1', created_by: 2, created_at: daysAgo(300) },
        { id: 2, user_id: 6, first_name: 'Елена', last_name: 'Кузнецова', middle_name: 'Павловна', email: 'client2@leasing.local', phone: '+7 (900) 000-00-06', company_name: 'ООО «АгроЛайн»', inn: '7700000002', address: 'г. Казань, ул. Тестовая, д. 12', created_by: 2, created_at: daysAgo(120) },
        { id: 3, user_id: null, first_name: 'Дмитрий', last_name: 'Орлов', middle_name: 'Сергеевич', email: 'orlov@example.com', phone: '+7 (900) 000-00-07', company_name: 'ИП Орлов Д. С.', inn: '770000000003', address: 'г. Тула, пр. Демонстрационный, д. 5', created_by: 2, created_at: daysAgo(200) },
        { id: 4, user_id: null, first_name: 'Светлана', last_name: 'Миронова', middle_name: 'Андреевна', email: 'mironova@example.com', phone: '+7 (900) 000-00-08', company_name: 'АО «МеталлПром»', inn: '7700000004', address: 'г. Екатеринбург, ул. Образцовая, д. 40', created_by: 4, created_at: daysAgo(90) },
        { id: 5, user_id: null, first_name: 'Артём', last_name: 'Волков', middle_name: 'Николаевич', email: 'volkov@example.com', phone: '+7 (900) 000-00-09', company_name: 'ООО «ТрансЛогистик»', inn: '7700000005', address: 'г. Самара, ул. Пробная, д. 8', created_by: 4, created_at: daysAgo(30) },
    ];

    const equipment = [
        { id: 1, type: 'авто', model: 'КАМАЗ 5490 Neo', serial: 'DEMO-0001', year: 2023, cost: 8900000, status: 'in_lease', client_id: 1, description: 'Седельный тягач для магистральных перевозок', created_at: daysAgo(290) },
        { id: 2, type: 'авто', model: 'ГАЗель NEXT', serial: 'DEMO-0002', year: 2024, cost: 3200000, status: 'in_lease', client_id: 5, description: 'Лёгкий коммерческий фургон', created_at: daysAgo(280) },
        { id: 3, type: 'авто', model: 'LADA Largus фургон', serial: 'DEMO-0003', year: 2024, cost: 1850000, status: 'available', client_id: null, description: 'Компактный грузовой автомобиль', created_at: daysAgo(150) },
        { id: 4, type: 'экскаватор', model: 'JCB JS220', serial: 'DEMO-0004', year: 2022, cost: 14500000, status: 'in_lease', client_id: 1, description: 'Гусеничный экскаватор, 22 т', created_at: daysAgo(270) },
        { id: 5, type: 'экскаватор', model: 'Hitachi ZX200', serial: 'DEMO-0005', year: 2021, cost: 12800000, status: 'available', client_id: null, description: 'Гусеничный экскаватор, 20 т', created_at: daysAgo(260) },
        { id: 6, type: 'экскаватор', model: 'Volvo EC140', serial: 'DEMO-0006', year: 2023, cost: 11200000, status: 'in_lease', client_id: 3, description: 'Экскаватор среднего класса', created_at: daysAgo(100) },
        { id: 7, type: 'станок', model: 'Токарный станок с ЧПУ CK6140', serial: 'DEMO-0007', year: 2023, cost: 2700000, status: 'in_lease', client_id: 4, description: 'Токарный станок с числовым программным управлением', created_at: daysAgo(240) },
        { id: 8, type: 'станок', model: 'Фрезерный центр VMC850', serial: 'DEMO-0008', year: 2024, cost: 6400000, status: 'in_lease', client_id: 2, description: 'Вертикальный обрабатывающий центр', created_at: daysAgo(80) },
        { id: 9, type: 'станок', model: 'Лазерный резак LF3015', serial: 'DEMO-0009', year: 2022, cost: 5100000, status: 'available', client_id: null, description: 'Оптоволоконный лазерный станок', created_at: daysAgo(60) },
    ];

    const contracts = [];
    const archivedContracts = [];
    let nextId = { users: 7, clients: 6, equipment: 10, contracts: 1 };

    function leaseMonths(start, end) {
        const s = new Date(start), e = new Date(end);
        let m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
        if (e.getDate() < s.getDate()) m--;
        return Math.max(m, 1);
    }

    const round2 = (x) => Math.round(x * 100) / 100;

    // та же формула, что в utils/lease_calculator.go
    function leaseCost(cost, months, rate) {
        const r = Math.pow(1 + rate, 1 / 12) - 1;
        const pow = Math.pow(1 + r, months);
        const monthly = round2(cost * (r * pow) / (pow - 1));
        return [monthly, round2(monthly * months)];
    }

    function seedContract(clientId, equipmentId, startedDaysAgo, months, status, clientNotes, managerNotes) {
        const eq = equipment.find(e => e.id === equipmentId);
        const start = daysAgo(startedDaysAgo);
        const end = new Date(new Date(start).setMonth(new Date(start).getMonth() + months)).toISOString();
        const [monthly, total] = leaseCost(eq.cost, months, 0.15);
        const pending = status === 'pending';
        contracts.push({
            id: nextId.contracts++, client_id: clientId, equipment_id: equipmentId,
            start_date: start, end_date: end, monthly_payment: monthly, total_amount: total, status,
            processed_by: pending ? null : 2, processed_at: pending ? null : daysAgo(Math.max(startedDaysAgo - 2, 0)),
            client_notes: clientNotes || '', manager_notes: managerNotes || '',
            created_at: daysAgo(startedDaysAgo + 5), updated_at: daysAgo(Math.max(startedDaysAgo - 2, 0)),
        });
    }

    seedContract(1, 1, 280, 36, 'active', 'Нужен тягач для новых маршрутов', 'Документы проверены');
    seedContract(1, 4, 150, 24, 'active', '', 'Одобрено, техника передана');
    seedContract(5, 2, 20, 18, 'in_processing', 'Фургон для доставки по городу', 'Ожидаем выписку из банка');
    seedContract(3, 6, 95, 12, 'active', '', '');
    seedContract(4, 7, 230, 6, 'completed', 'Станок на время выполнения заказа', 'Договор закрыт, техника возвращена');
    seedContract(2, 8, 4, 24, 'pending', 'Расширяем производство', '');
    seedContract(4, 7, 2, 12, 'pending', 'Хотим продлить аренду станка', '');

    // ---------- вспомогательное ----------

    const publicUser = (u) => {
        const { password, ...rest } = u;
        return { updated_at: u.created_at, ...rest };
    };
    const findClient = (id) => clients.find(c => c.id === id) || null;
    const findEquipment = (id) => equipment.find(e => e.id === id) || null;
    const withClient = (eq) => ({ photo: '', updated_at: eq.created_at, ...eq, client: eq.client_id ? findClient(eq.client_id) : null });
    const expand = (c) => ({ ...c, client: findClient(c.client_id), equipment: findEquipment(c.equipment_id) });
    const isStaff = (u) => u.role === 'Administrator' || u.role === 'Manager';
    const forbidden = [403, { error: 'Нет прав' }];
    const notFound = [404, { error: 'Не найдено' }];

    function userFromHeaders(headers) {
        const h = new Headers(headers || {}).get('Authorization') || '';
        const m = h.match(/^Bearer demo\.(\d+)$/);
        return m ? users.find(u => u.id === Number(m[1])) : null;
    }

    function stats() {
        const active = contracts.filter(c => c.status === 'active');
        const pending = contracts.filter(c => c.status === 'pending');
        const types = [...new Set(equipment.map(e => e.type))];
        const statuses = [...new Set(equipment.map(e => e.status))];
        const staff = users.filter(isStaff);
        const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
        return {
            clients: { total: clients.length, active: new Set(active.map(c => c.client_id)).size },
            users: { total: users.length, approved_admins: staff.filter(u => u.approved).length, pending: staff.filter(u => !u.approved).length },
            roles: {
                clients: users.filter(u => u.role === 'Client').length,
                managers: users.filter(u => u.role === 'Manager').length,
                admins: users.filter(u => u.role === 'Administrator').length,
            },
            equipment: {
                total: equipment.length,
                available: equipment.filter(e => e.status === 'available').length,
                leased: equipment.filter(e => e.status === 'in_lease').length,
                total_value: sum(equipment, e => e.cost),
                by_type: types.map(t => ({ type: t, count: equipment.filter(e => e.type === t).length, value: sum(equipment.filter(e => e.type === t), e => e.cost) })),
                by_status: statuses.map(s => ({ status: s, count: equipment.filter(e => e.status === s).length })),
            },
            contracts: {
                total: contracts.length,
                pending: pending.length,
                active: active.length,
                completed: contracts.filter(c => c.status === 'completed').length,
                total_value: sum(contracts, c => c.total_amount),
                monthly_income: sum(active, c => c.monthly_payment),
                avg_waiting_time_days: pending.length ? sum(pending, c => (now - new Date(c.created_at)) / DAY) / pending.length : 0,
                avg_months: contracts.length ? sum(contracts, c => leaseMonths(c.start_date, c.end_date)) / contracts.length : 0,
            },
        };
    }

    const categoryRates = { 'легковой': 0.12, 'коммерческий': 0.13, 'грузовой': 0.14, 'спецтехника': 0.15, 'сельхозтехника': 0.16, 'оборудование': 0.17 };

    function calculate(b) {
        const rate = (categoryRates[b.category] || 0.12) / 12;
        const P = Number(b.asset_value), n = Number(b.contract_term);
        if (!(P > 0) || !(n > 0)) return [400, { error: 'Некорректные данные' }];
        const pow = Math.pow(1 + rate, n);
        const payment = b.payment_type === 'even' ? P * (rate * pow) / (pow - 1) : P / n + P * rate;
        return [200, { monthly_payment: round2(payment) }];
    }

    // ---------- обработка запросов ----------

    function handle(method, path, query, body, user) {
        const parts = path.split('/').filter(Boolean);
        const resource = parts[0];
        const id = parts[1] ? Number(parts[1]) : null;

        if (resource === 'login' && method === 'POST') {
            // в демо подходит любой пароль; неизвестный email входит как клиент
            const u = users.find(x => x.email === String(body.email || '').toLowerCase()) || users[2];
            return [200, { message: 'Вход выполнен успешно', token: 'demo.' + u.id, user: publicUser(u) }];
        }
        if (resource === 'register' && method === 'POST') {
            return [201, { message: 'Пользователь успешно зарегистрирован', user: { id: 0, email: body.email, role: 'Client', approved: true } }];
        }
        if (resource === 'calculate-lease' && method === 'POST') return calculate(body);

        if (!user) return [401, { error: 'Требуется авторизация' }];

        if (resource === 'profile') {
            if (method === 'PUT') {
                ['first_name', 'last_name', 'phone'].forEach(k => { if (body[k] !== undefined) user[k] = body[k]; });
                return [200, { message: 'Профиль успешно обновлен', user: publicUser(user) }];
            }
            return [200, { user: publicUser(user) }];
        }

        if (resource === 'stats') return isStaff(user) ? [200, stats()] : forbidden;

        if (resource === 'clients') {
            if (!isStaff(user)) return forbidden;
            if (method === 'GET' && !id) return [200, { clients, count: clients.length }];
            if (method === 'POST') {
                const client = { id: nextId.clients++, user_id: null, created_by: user.id, created_at: new Date().toISOString(), ...body };
                clients.push(client);
                return [201, { message: 'Клиент успешно создан', client }];
            }
            const client = findClient(id);
            if (!client) return notFound;
            if (method === 'GET') return [200, { client }];
            if (method === 'PUT') { Object.assign(client, body); return [200, { message: 'Клиент успешно обновлен', client }]; }
            if (method === 'DELETE') { clients.splice(clients.indexOf(client), 1); return [200, { message: 'Клиент успешно удален' }]; }
        }

        if (resource === 'equipment') {
            if (method === 'GET' && !id) {
                const list = (user.role === 'Client' ? equipment.filter(e => e.status === 'available') : equipment).map(withClient);
                return [200, { equipment: list, count: list.length }];
            }
            if (method === 'GET') { const eq = findEquipment(id); return eq ? [200, { equipment: withClient(eq) }] : notFound; }
            if (!isStaff(user)) return forbidden;
            if (method === 'POST') {
                const eq = { id: nextId.equipment++, status: 'available', client_id: null, created_at: new Date().toISOString(), ...body };
                equipment.push(eq);
                return [201, { message: 'Оборудование успешно создано', equipment: withClient(eq) }];
            }
            const eq = findEquipment(id);
            if (!eq) return notFound;
            if (method === 'PUT') { Object.assign(eq, body); return [200, { message: 'Оборудование успешно обновлено', equipment: withClient(eq) }]; }
            if (method === 'DELETE') { equipment.splice(equipment.indexOf(eq), 1); return [200, { message: 'Оборудование успешно удалено' }]; }
        }

        if (resource === 'contracts') {
            const ownClient = clients.find(c => c.user_id === user.id);
            const visible = (list) => (user.role === 'Client' ? list.filter(c => ownClient && c.client_id === ownClient.id) : list);

            if (method === 'GET' && !id) {
                const list = visible(query.get('archived') === 'true' ? archivedContracts : contracts).map(expand);
                return [200, { contracts: list, count: list.length }];
            }
            if (method === 'GET') {
                const c = visible(contracts).find(x => x.id === id);
                return c ? [200, { contract: expand(c) }] : notFound;
            }
            if (method === 'POST') {
                const eq = findEquipment(Number(body.equipment_id));
                if (!eq) return [404, { error: 'Оборудование не найдено' }];
                if (eq.status !== 'available') return [400, { error: 'Оборудование недоступно для лизинга' }];
                let client = ownClient;
                if (user.role !== 'Client') {
                    client = findClient(Number(body.client_id));
                    if (!client) return [404, { error: 'Клиент не найден' }];
                } else if (!client) {
                    client = { id: nextId.clients++, user_id: user.id, first_name: user.first_name || 'Клиент', last_name: user.last_name || 'Системы', email: user.email, phone: user.phone, created_by: user.id, created_at: new Date().toISOString() };
                    clients.push(client);
                }
                let monthly = body.monthly_payment, total = body.total_amount;
                if (monthly == null || total == null) {
                    [monthly, total] = leaseCost(eq.cost, leaseMonths(body.start_date, body.end_date), 0.15);
                }
                const staff = user.role !== 'Client';
                const contract = {
                    id: nextId.contracts++, client_id: client.id, equipment_id: eq.id,
                    start_date: body.start_date, end_date: body.end_date, monthly_payment: monthly, total_amount: total,
                    status: staff && body.status ? body.status : 'pending',
                    processed_by: staff ? user.id : null, processed_at: staff ? new Date().toISOString() : null,
                    client_notes: body.client_notes || '', manager_notes: body.manager_notes || '',
                    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                };
                contracts.push(contract);
                eq.status = 'in_lease';
                eq.client_id = client.id;
                return [201, { message: 'Лизинговый договор успешно оформлен', contract: expand(contract) }];
            }
            if (!isStaff(user)) return forbidden;
            const contract = contracts.find(x => x.id === id);
            if (!contract) return [404, { error: 'Договор не найден' }];
            const eq = findEquipment(contract.equipment_id);
            if (method === 'PUT') {
                if (body.status) {
                    contract.status = body.status === 'approved' ? 'active' : body.status;
                    if (body.status === 'in_processing' || body.status === 'approved') {
                        contract.processed_by = user.id;
                        contract.processed_at = new Date().toISOString();
                    }
                    if (eq && body.status === 'approved') { eq.status = 'in_lease'; eq.client_id = contract.client_id; }
                    if (eq && (body.status === 'completed' || body.status === 'rejected')) { eq.status = 'available'; eq.client_id = null; }
                }
                if (body.manager_notes) contract.manager_notes = body.manager_notes;
                if (body.monthly_payment != null) {
                    contract.monthly_payment = body.monthly_payment;
                    contract.total_amount = body.monthly_payment * leaseMonths(contract.start_date, contract.end_date);
                }
                contract.updated_at = new Date().toISOString();
                return [200, { message: 'Договор успешно обновлен', contract: expand(contract) }];
            }
            if (method === 'DELETE') {
                contracts.splice(contracts.indexOf(contract), 1);
                archivedContracts.push(contract);
                if (eq) { eq.status = 'available'; eq.client_id = null; }
                return [200, { message: 'Договор успешно удален' }];
            }
        }

        if (resource === 'users') {
            if (user.role !== 'Administrator') return forbidden;
            if (method === 'GET' && !id) return [200, { users: users.map(publicUser), count: users.length }];
            if (method === 'POST') {
                if (users.some(u => u.email === body.email)) return [409, { error: 'Пользователь с таким email уже существует' }];
                const { password, ...fields } = body;
                const created = { id: nextId.users++, approved: false, created_at: new Date().toISOString(), ...fields };
                users.push(created);
                return [201, { message: 'Пользователь успешно создан', user: publicUser(created) }];
            }
            const target = users.find(u => u.id === id);
            if (!target) return notFound;
            if (method === 'GET') return [200, { user: publicUser(target) }];
            if (method === 'PUT') {
                const { password, ...fields } = body;
                Object.assign(target, fields);
                return [200, { message: 'Пользователь успешно обновлен', user: publicUser(target) }];
            }
            if (method === 'DELETE') {
                if (target.id === user.id) return [400, { error: 'Нельзя удалить собственную учетную запись' }];
                users.splice(users.indexOf(target), 1);
                return [200, { message: 'Пользователь успешно удален' }];
            }
        }

        return notFound;
    }

    const realFetch = window.fetch.bind(window);
    window.fetch = async function (input, init = {}) {
        const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
        const at = url.pathname.indexOf(API);
        if (at === -1) return realFetch(input, init);

        let body = {};
        try { body = init.body ? JSON.parse(init.body) : {}; } catch (e) {}
        const [status, data] = handle(
            (init.method || 'GET').toUpperCase(),
            url.pathname.slice(at + API.length),
            url.searchParams,
            body,
            userFromHeaders(init.headers)
        );
        return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    };

    // ---------- маршруты ----------
    // На Pages сайт лежит в подкаталоге и не умеет отдавать index.html по любому пути,
    // поэтому страница хранится в хеше: /leasing/#/clients вместо /clients.

    const pushState = window.history.pushState.bind(window.history);
    window.history.pushState = function (state, title, url) {
        if (typeof url === 'string' && url.startsWith('/')) {
            url = window.location.pathname + '#' + url;
        }
        return pushState(state, title, url);
    };

    const handleRoute = window.router.handleRoute.bind(window.router);
    window.router.handleRoute = function (path) {
        if (path === window.location.pathname) {
            path = window.location.hash.slice(1) || '/home';
        }
        return handleRoute(path);
    };

    // ---------- панель демо-режима ----------

    function loginAs(userId) {
        const u = users.find(x => x.id === userId);
        window.setAuthToken('demo.' + u.id);
        window.setCurrentUser(publicUser(u));
        window.location.hash = '';
        window.location.reload();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const bar = document.createElement('div');
        bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:100000;display:flex;flex-wrap:wrap;gap:8px 12px;' +
            'align-items:center;justify-content:center;padding:10px 16px;background:#111827;color:#f9fafb;' +
            'font:14px/1.4 system-ui,-apple-system,sans-serif;box-shadow:0 -2px 12px rgba(0,0,0,.25)';
        bar.innerHTML = '<span><b>Демо-режим.</b> Данные тестовые, изменения сбрасываются при обновлении страницы. Войти как:</span>';
        [[1, 'Администратор'], [2, 'Менеджер'], [3, 'Клиент']].forEach(([id, label]) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = 'padding:6px 14px;border:0;border-radius:6px;background:#dc2626;color:#fff;font:inherit;font-weight:600;cursor:pointer';
            btn.addEventListener('click', () => loginAs(id));
            bar.appendChild(btn);
        });
        document.body.appendChild(bar);
        document.body.style.paddingBottom = '64px';
    });
})();
