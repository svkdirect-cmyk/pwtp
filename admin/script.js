class AdminPanel {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.users = [];
        this.cards = [];
        this.upgrades = [];
        this.levels = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Кнопки действий
        document.getElementById('refresh-stats')?.addEventListener('click', () => this.refreshStats());
        document.getElementById('export-users')?.addEventListener('click', () => this.exportUsers());
        document.getElementById('add-upgrade')?.addEventListener('click', () => this.showAddUpgradeModal());
        document.getElementById('add-card')?.addEventListener('click', () => this.showAddCardModal());
        document.getElementById('add-level')?.addEventListener('click', () => this.showAddLevelModal());
        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings')?.addEventListener('click', () => this.resetSettings());
        document.getElementById('create-backup')?.addEventListener('click', () => this.createBackup());
        document.getElementById('restore-backup')?.addEventListener('click', () => this.restoreBackup());

        // Поиск
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        // Пагинация
        document.getElementById('prev-page')?.addEventListener('click', () => this.previousPage());
        document.getElementById('next-page')?.addEventListener('click', () => this.nextPage());

        // Модальные окна
        this.setupModalListeners();
    }

    setupNavigation() {
        // Активируем первую вкладку
        this.switchTab('dashboard');
    }

    switchTab(tabId) {
        // Деактивируем все вкладки
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        const targetTab = document.getElementById(`${tabId}-tab`);
        const targetNav = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetNav) {
            targetTab.classList.add('active');
            targetNav.classList.add('active');
        }
        
        // Загружаем данные для вкладки
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch(tabId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'upgrades':
                this.loadUpgrades();
                break;
            case 'cards':
                this.loadCards();
                break;
            case 'levels':
                this.loadLevels();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'backup':
                this.loadBackups();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    loadData() {
        this.loadUsersData();
        this.loadGameData();
        this.updateStats();
    }

    loadUsersData() {
        try {
            const usersData = localStorage.getItem('darkPawsClicker_users');
            this.users = usersData ? JSON.parse(usersData) : [];
        } catch (error) {
            console.error('Error loading users data:', error);
            this.users = [];
        }
    }

    loadGameData() {
        // Загружаем данные игры из основного приложения
        try {
            const gameData = localStorage.getItem('darkPawsClicker_save');
            if (gameData) {
                const data = JSON.parse(gameData);
                this.cards = data.comboCards || [];
                this.upgrades = data.upgrades || [];
            }
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    updateStats() {
        document.getElementById('stat-users').textContent = this.users.length;
        document.getElementById('stat-active').textContent = this.getActiveUsersCount();
        document.getElementById('stat-total-clicks').textContent = this.getTotalClicks();
        document.getElementById('stat-data-size').textContent = this.getDataSize();
        
        // Обновляем бейджи
        document.getElementById('users-badge').textContent = this.users.length;
        document.getElementById('cards-badge').textContent = this.cards.length;
    }

    getActiveUsersCount() {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return this.users.filter(user => {
            const lastActive = new Date(user.lastActive || user.gameState?.lastSave || 0).getTime();
            return now - lastActive < twentyFourHours;
        }).length;
    }

    getTotalClicks() {
        return this.users.reduce((total, user) => {
            return total + (user.gameState?.stats?.totalClicks || 0);
        }, 0).toLocaleString();
    }

    getDataSize() {
        const data = localStorage.getItem('darkPawsClicker_users') || '';
        const size = new Blob([data]).size;
        return Math.round(size / 1024) + ' KB';
    }

    // Методы для работы с пользователями
    loadUsers() {
        this.renderUsersTable();
    }

    renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const usersToShow = this.users.slice(startIndex, endIndex);

        let html = '';
        
        usersToShow.forEach(user => {
            const gameState = user.gameState || {};
            const stats = gameState.stats || {};
            const lastActive = user.lastActive || stats.lastSave || Date.now();
            
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-small">
                                ${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div class="user-name">${user.first_name || 'Unknown'}</div>
                                <div class="user-username">@${user.username || 'no_username'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${gameState.level || 1}</td>
                    <td>${Math.floor(gameState.score || 0).toLocaleString()}</td>
                    <td>${stats.totalClicks || 0}</td>
                    <td>${this.formatDate(lastActive)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action btn-edit" onclick="adminPanel.editUser(${user.id})" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete" onclick="adminPanel.deleteUser(${user.id})" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button class="btn-action btn-reset" onclick="adminPanel.resetUser(${user.id})" title="Сбросить прогресс">
                                <i class="fas fa-undo"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="7" class="no-data">Пользователи не найдены</td></tr>';
        this.updatePagination();
    }

    searchUsers(query) {
        if (!query.trim()) {
            this.currentPage = 1;
            this.renderUsersTable();
            return;
        }

        const filteredUsers = this.users.filter(user => 
            user.id.toString().includes(query) ||
            user.first_name?.toLowerCase().includes(query.toLowerCase()) ||
            user.username?.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        let html = '';
        users.forEach(user => {
            const gameState = user.gameState || {};
            const stats = gameState.stats || {};
            
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.first_name || 'Unknown'}</td>
                    <td>${gameState.level || 1}</td>
                    <td>${Math.floor(gameState.score || 0)}</td>
                    <td>${stats.totalClicks || 0}</td>
                    <td>${this.formatDate(user.lastActive)}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="adminPanel.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminPanel.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="7" class="no-data">Пользователи не найдены</td></tr>';
    }

    updatePagination() {
        const totalPages = Math.ceil(this.users.length / this.itemsPerPage);
        document.getElementById('current-page').textContent = this.currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderUsersTable();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.users.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderUsersTable();
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.showEditUserModal(user);
    }

    deleteUser(userId) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsersData();
        this.renderUsersTable();
        this.updateStats();
        
        this.showNotification('Пользователь удален', 'success');
    }

    resetUser(userId) {
        if (!confirm('Сбросить прогресс пользователя? Это действие нельзя отменить.')) return;

        const user = this.users.find(u => u.id === userId);
        if (user && user.gameState) {
            user.gameState = {
                score: 0,
                totalEarnedScore: 0,
                level: 1,
                upgrades: { clickPower: 1, autoClick: 0, criticalChance: 1 },
                stats: { totalClicks: 0, totalScore: 0, playTime: 0, joinDate: new Date().toISOString() },
                friends: [],
                comboCards: [],
                activeDeck: [],
                cardEffects: { clickPower: 1, autoClick: 0, criticalChance: 0, criticalMultiplier: 1, multiplier: 1, chaos: false },
                achievements: { firstSteps: false, hardWorker: false, clickMaster: false, clickLegend: false },
                lastSave: Date.now()
            };
            
            this.saveUsersData();
            this.renderUsersTable();
            this.showNotification('Прогресс пользователя сброшен', 'success');
        }
    }

    exportUsers() {
        const data = {
            users: this.users,
            exportDate: new Date().toISOString(),
            totalUsers: this.users.length
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `darkpaws_users_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Данные пользователей экспортированы', 'success');
    }

    // Вспомогательные методы
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
    }

    showNotification(message, type = 'info') {
        if (window.adminAuth) {
            window.adminAuth.showMessage(message, type);
        } else {
            alert(message);
        }
    }

    saveUsersData() {
        try {
            localStorage.setItem('darkPawsClicker_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users data:', error);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    // Заглушки для остальных методов (реализация аналогична)
    loadDashboard() {
        console.log('Loading dashboard...');
    }

    loadUpgrades() {
        console.log('Loading upgrades...');
    }

    loadCards() {
        console.log('Loading cards...');
    }

    loadLevels() {
        console.log('Loading levels...');
    }

    loadSettings() {
        console.log('Loading settings...');
    }

    loadBackups() {
        console.log('Loading backups...');
    }

    loadAnalytics() {
        console.log('Loading analytics...');
    }

    refreshStats() {
        this.loadData();
        this.showNotification('Статистика обновлена', 'success');
    }

    setupModalListeners() {
        // Закрытие модальных окон
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target.dataset.modal) {
                    this.hideModal(e.target.dataset.modal);
                } else {
                    this.hideAllModals();
                }
            });
        });

        // ESC для закрытия
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    showEditUserModal(user) {
        // Заполняем форму данными пользователя
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.first_name || '';
        document.getElementById('edit-user-level').value = user.gameState?.level || 1;
        document.getElementById('edit-user-score').value = Math.floor(user.gameState?.score || 0);
        document.getElementById('edit-user-clicks').value = user.gameState?.stats?.totalClicks || 0;
        
        // Показываем модальное окно
        this.showModal('edit-user-modal');
        
        // Назначаем обработчик сохранения
        document.getElementById('save-user-changes').onclick = () => this.saveUserChanges(user.id);
    }

    saveUserChanges(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Обновляем данные пользователя
        user.first_name = document.getElementById('edit-user-name').value;
        if (user.gameState) {
            user.gameState.level = parseInt(document.getElementById('edit-user-level').value);
            user.gameState.score = parseInt(document.getElementById('edit-user-score').value);
            user.gameState.stats.totalClicks = parseInt(document.getElementById('edit-user-clicks').value);
        }

        this.saveUsersData();
        this.renderUsersTable();
        this.hideModal('edit-user-modal');
        this.showNotification('Изменения сохранены', 'success');
    }

    showAddUpgradeModal() {
        this.showModal('create-upgrade-modal');
    }

    showAddCardModal() {
        // Реализация аналогична showAddUpgradeModal
        this.showNotification('Функция в разработке', 'info');
    }

    showAddLevelModal() {
        this.showNotification('Функция в разработке', 'info');
    }

    saveSettings() {
        this.showNotification('Настройки сохранены', 'success');
    }

    resetSettings() {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
            this.showNotification('Настройки сброшены', 'success');
        }
    }

    createBackup() {
        const data = {
            users: this.users,
            settings: this.getCurrentSettings(),
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `darkpaws_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Резервная копия создана', 'success');
    }

    restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (confirm('Восстановить данные из резервной копии? Текущие данные будут перезаписаны.')) {
                        this.users = data.users || [];
                        this.applySettings(data.settings || {});
                        this.saveUsersData();
                        this.loadData();
                        this.showNotification('Данные восстановлены', 'success');
                    }
                } catch (error) {
                    this.showNotification('Ошибка при восстановлении: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    getCurrentSettings() {
        return {
            baseCost: parseInt(document.getElementById('base-cost')?.value || 10),
            costMultiplier: parseFloat(document.getElementById('cost-multiplier')?.value || 2),
            baseExp: parseInt(document.getElementById('base-exp')?.value || 100)
        };
    }

    applySettings(settings) {
        // Применяем настройки к форме
        if (document.getElementById('base-cost')) {
            document.getElementById('base-cost').value = settings.baseCost || 10;
        }
        if (document.getElementById('cost-multiplier')) {
            document.getElementById('cost-multiplier').value = settings.costMultiplier || 2;
        }
        if (document.getElementById('base-exp')) {
            document.getElementById('base-exp').value = settings.baseExp || 100;
        }
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки аутентификации
    setTimeout(() => {
        if (window.adminAuth && window.adminAuth.isAuthenticated) {
            window.adminPanel = new AdminPanel();
        }
    }, 100);
});
