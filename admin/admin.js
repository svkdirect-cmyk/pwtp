class AdminPanel {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.users = [];
        this.cards = [];
        this.upgrades = [];
        this.levels = [];
        this.settings = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAllData();
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
        
        // Фильтры карт
        document.getElementById('card-rarity-filter')?.addEventListener('change', (e) => {
            this.filterCards();
        });
        
        document.getElementById('card-status-filter')?.addEventListener('change', (e) => {
            this.filterCards();
        });
    }

    setupNavigation() {
        this.switchTab('dashboard');
    }

    switchTab(tabId) {
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabId}-tab`);
        const targetNav = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetNav) {
            targetTab.classList.add('active');
            targetNav.classList.add('active');
        }
        
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

    loadAllData() {
        this.loadUsersData();
        this.loadGameData();
        this.loadSettingsData();
        this.updateStats();
    }

    loadUsersData() {
        try {
            const usersData = localStorage.getItem('darkPawsClicker_users');
            this.users = usersData ? JSON.parse(usersData) : [];
            console.log('Loaded users:', this.users);
        } catch (error) {
            console.error('Error loading users data:', error);
            this.users = [];
        }
    }

    loadGameData() {
        try {
            // Загружаем карты из основного игры
            const gameData = localStorage.getItem('darkPawsClicker_save');
            if (gameData) {
                const data = JSON.parse(gameData);
                this.cards = this.getAllCardsData();
                this.upgrades = this.getUpgradesData();
                this.levels = this.getLevelsData();
            } else {
                // Если данных нет, создаем демо-данные
                this.cards = this.getAllCardsData();
                this.upgrades = this.getUpgradesData();
                this.levels = this.getLevelsData();
            }
        } catch (error) {
            console.error('Error loading game data:', error);
            this.cards = this.getAllCardsData();
            this.upgrades = this.getUpgradesData();
            this.levels = this.getLevelsData();
        }
    }

    loadSettingsData() {
        try {
            const settingsData = localStorage.getItem('darkPawsClicker_settings');
            this.settings = settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            baseCost: 10,
            costMultiplier: 2,
            baseExp: 100,
            maxLevel: 100,
            autoSaveInterval: 30,
            maxFriends: 50
        };
    }

    getAllCardsData() {
        return [
            {
                id: 1,
                name: 'Лапа новичка',
                rarity: 'common',
                icon: '🐾',
                stats: { clickPower: 1.05 },
                description: 'Увеличивает силу клика на 5%',
                unlocked: true,
                active: false
            },
            {
                id: 2,
                name: 'Энергия',
                rarity: 'rare',
                icon: '⚡',
                stats: { autoClick: 3 },
                description: 'Добавляет 3 авто-клика в секунду',
                unlocked: true,
                active: false
            },
            {
                id: 3,
                name: 'Точность',
                rarity: 'epic',
                icon: '🎯',
                stats: { criticalChance: 0.15 },
                description: 'Увеличивает шанс критического удара на 15%',
                unlocked: true,
                active: false
            },
            {
                id: 4,
                name: 'Алмазная лапа',
                rarity: 'legendary',
                icon: '💎',
                stats: { multiplier: 2 },
                description: 'Удваивает все бонусы от карт в колоде',
                unlocked: false,
                active: false
            },
            {
                id: 5,
                name: 'Удача',
                rarity: 'common',
                icon: '🍀',
                stats: { criticalChance: 0.10 },
                description: 'Увеличивает шанс критического удара на 10%',
                unlocked: true,
                active: false
            },
            {
                id: 6,
                name: 'Скорость',
                rarity: 'rare',
                icon: '🚀',
                stats: { autoClick: 5 },
                description: 'Добавляет 5 авто-кликов в секунду',
                unlocked: true,
                active: false
            },
            {
                id: 7,
                name: 'Мощь',
                rarity: 'epic',
                icon: '💪',
                stats: { clickPower: 1.25 },
                description: 'Увеличивает силу клика на 25%',
                unlocked: false,
                active: false
            },
            {
                id: 8,
                name: 'Феникс',
                rarity: 'legendary',
                icon: '🔥',
                stats: { criticalMultiplier: 3 },
                description: 'Утраивает множитель критического удара',
                unlocked: false,
                active: false
            },
            {
                id: 9,
                name: 'Бесконечность',
                rarity: 'mythic',
                icon: '♾️',
                stats: { clickPower: 1.5, autoClick: 10, criticalChance: 0.25 },
                description: 'Мощная карта, увеличивающая все характеристики значительно',
                unlocked: false,
                active: false
            },
            {
                id: 10,
                name: 'Хаос',
                rarity: 'mythic',
                icon: '🌪️',
                stats: { chaos: true, multiplier: 1.5 },
                description: 'Случайным образом усиливает все показатели каждый клик',
                unlocked: false,
                active: false
            }
        ];
    }

    getUpgradesData() {
        return {
            'click-power': {
                name: 'Сила лапы',
                baseCost: 10,
                currentLevel: 1,
                multiplier: 2,
                description: 'Увеличивает силу каждого клика'
            },
            'auto-click': {
                name: 'Авто-клик',
                baseCost: 50,
                currentLevel: 0,
                multiplier: 2,
                description: 'Автоматически кликает каждую секунду'
            },
            'critical-chance': {
                name: 'Точность',
                baseCost: 25,
                currentLevel: 1,
                multiplier: 2,
                description: 'Увеличивает шанс критического удара'
            }
        };
    }

    getLevelsData() {
        const levels = {};
        for (let i = 1; i <= 10; i++) {
            levels[i] = {
                requiredScore: Math.pow(i - 1, 2) * 100,
                rewards: this.getLevelRewards(i),
                unlocked: i <= 1
            };
        }
        return levels;
    }

    getLevelRewards(level) {
        const rewards = {
            1: { type: 'clickPower', value: 10, description: '+10 к силе клика' },
            2: { type: 'autoClick', value: 1, description: '+1 авто-клик/сек' },
            3: { type: 'criticalChance', value: 10, description: '+10% шанс крита' },
            4: { type: 'multiplier', value: 2, description: 'x2 все бонусы' },
            5: { type: 'card', value: 'diamond-paw', description: 'Карта Алмазная лапа' }
        };
        return rewards[level] || { type: 'score', value: level * 100, description: 'Бонусные очки' };
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
        
        if (usersToShow.length === 0) {
            html = '<tr><td colspan="7" class="no-data">Пользователи не найдены</td></tr>';
        } else {
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
        }

        tbody.innerHTML = html;
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
        if (users.length === 0) {
            html = '<tr><td colspan="7" class="no-data">Пользователи не найдены</td></tr>';
        } else {
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
        }

        tbody.innerHTML = html;
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
                stats: { 
                    totalClicks: 0, 
                    totalScore: 0, 
                    playTime: 0, 
                    joinDate: new Date().toISOString(),
                    criticalHits: 0
                },
                friends: [],
                comboCards: [],
                activeDeck: [],
                cardEffects: { 
                    clickPower: 1, 
                    autoClick: 0, 
                    criticalChance: 0, 
                    criticalMultiplier: 1, 
                    multiplier: 1, 
                    chaos: false 
                },
                achievements: { 
                    firstSteps: false, 
                    hardWorker: false, 
                    clickMaster: false, 
                    clickLegend: false 
                },
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

    // Методы для улучшений
    loadUpgrades() {
        this.renderUpgradesList();
    }

    renderUpgradesList() {
        const container = document.getElementById('upgrades-list');
        if (!container) return;

        let html = '';
        Object.entries(this.upgrades).forEach(([id, upgrade]) => {
            html += `
                <div class="upgrade-admin-item">
                    <div class="upgrade-icon">⚡</div>
                    <div style="flex: 1;">
                        <div class="user-name">${upgrade.name}</div>
                        <div class="user-stats">
                            Уровень: ${upgrade.currentLevel} | 
                            Базовая стоимость: ${upgrade.baseCost} | 
                            Множитель: ${upgrade.multiplier}
                        </div>
                        <div class="user-stats">${upgrade.description}</div>
                    </div>
                    <div class="user-actions">
                        <button class="admin-btn btn-edit" onclick="adminPanel.editUpgrade('${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="no-data">Улучшения не найдены</div>';
    }

    editUpgrade(upgradeId) {
        const upgrade = this.upgrades[upgradeId];
        if (!upgrade) return;

        const newCost = prompt(`Новая базовая стоимость для "${upgrade.name}":`, upgrade.baseCost);
        if (newCost !== null && !isNaN(newCost)) {
            upgrade.baseCost = parseInt(newCost);
            this.saveUpgradesData();
            this.renderUpgradesList();
            this.showNotification('Стоимость улучшения обновлена', 'success');
        }
    }

    // Методы для карт
    loadCards() {
        this.renderCardsGrid();
    }

    renderCardsGrid() {
        const container = document.getElementById('cards-grid-admin');
        if (!container) return;

        let html = '';
        this.cards.forEach(card => {
            html += `
                <div class="card-admin-item" data-rarity="${card.rarity}" data-status="${card.unlocked ? 'active' : 'inactive'}">
                    <div class="card-admin-icon">${card.icon}</div>
                    <div class="card-admin-name">${card.name}</div>
                    <div class="card-admin-rarity ${card.rarity}">${this.getRarityText(card.rarity)}</div>
                    <div class="card-admin-stats">${card.description}</div>
                    <div class="card-admin-status ${card.unlocked ? 'unlocked' : 'locked'}">
                        ${card.unlocked ? '🔓 Разблокирована' : '🔒 Заблокирована'}
                    </div>
                    <div class="card-admin-actions">
                        <button class="admin-btn btn-edit" onclick="adminPanel.editCard(${card.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="admin-btn btn-delete" onclick="adminPanel.deleteCard(${card.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="no-data">Карты не найдены</div>';
    }

    filterCards() {
        const rarityFilter = document.getElementById('card-rarity-filter').value;
        const statusFilter = document.getElementById('card-status-filter').value;
        
        const cards = document.querySelectorAll('.card-admin-item');
        cards.forEach(card => {
            const rarity = card.dataset.rarity;
            const status = card.dataset.status;
            
            let show = true;
            
            if (rarityFilter && rarity !== rarityFilter) {
                show = false;
            }
            
            if (statusFilter && status !== statusFilter) {
                show = false;
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }

    getRarityText(rarity) {
        const rarityMap = {
            'common': 'Обычная',
            'rare': 'Редкая',
            'epic': 'Эпическая',
            'legendary': 'Легендарная',
            'mythic': 'Мифическая'
        };
        return rarityMap[rarity] || rarity;
    }

    editCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        const newUnlocked = confirm(`Карта "${card.name}"\n\nТекущий статус: ${card.unlocked ? 'Разблокирована' : 'Заблокирована'}\n\nИзменить статус?`);
        if (newUnlocked !== null) {
            card.unlocked = newUnlocked;
            this.saveCardsData();
            this.renderCardsGrid();
            this.showNotification('Статус карты обновлен', 'success');
        }
    }

    deleteCard(cardId) {
        if (!confirm('Вы уверены, что хотите удалить эту карту?')) return;

        this.cards = this.cards.filter(c => c.id !== cardId);
        this.saveCardsData();
        this.renderCardsGrid();
        this.showNotification('Карта удалена', 'success');
    }

    // Методы для уровней
    loadLevels() {
        this.renderLevelsList();
    }

    renderLevelsList() {
        const container = document.getElementById('levels-list');
        if (!container) return;

        let html = '';
        Object.entries(this.levels).forEach(([level, data]) => {
            html += `
                <div class="level-admin-item">
                    <div class="level-icon">${level}</div>
                    <div style="flex: 1;">
                        <div class="user-name">Уровень ${level}</div>
                        <div class="user-stats">Требуется очков: ${data.requiredScore}</div>
                        <div class="user-stats">Награда: ${data.rewards.description}</div>
                        <div class="user-stats">Статус: ${data.unlocked ? '🔓 Разблокирован' : '🔒 Заблокирован'}</div>
                    </div>
                    <div class="user-actions">
                        <button class="admin-btn btn-edit" onclick="adminPanel.editLevel(${level})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="no-data">Уровни не найдены</div>';
    }

    editLevel(level) {
        const levelData = this.levels[level];
        if (!levelData) return;

        const newScore = prompt(`Новое требуемое количество очков для уровня ${level}:`, levelData.requiredScore);
        if (newScore !== null && !isNaN(newScore)) {
            levelData.requiredScore = parseInt(newScore);
            this.saveLevelsData();
            this.renderLevelsList();
            this.showNotification('Требования уровня обновлены', 'success');
        }
    }

    // Методы для настроек
    loadSettings() {
        this.renderSettings();
    }

    renderSettings() {
        document.getElementById('base-cost').value = this.settings.baseCost;
        document.getElementById('cost-multiplier').value = this.settings.costMultiplier;
        document.getElementById('base-exp').value = this.settings.baseExp;
        document.getElementById('auto-save').value = this.settings.autoSaveInterval;
        document.getElementById('max-level').value = this.settings.maxLevel;
        document.getElementById('max-friends').value = this.settings.maxFriends;
    }

    saveSettings() {
        this.settings.baseCost = parseInt(document.getElementById('base-cost').value);
        this.settings.costMultiplier = parseFloat(document.getElementById('cost-multiplier').value);
        this.settings.baseExp = parseInt(document.getElementById('base-exp').value);
        this.settings.autoSaveInterval = parseInt(document.getElementById('auto-save').value);
        this.settings.maxLevel = parseInt(document.getElementById('max-level').value);
        this.settings.maxFriends = parseInt(document.getElementById('max-friends').value);

        this.saveSettingsData();
        this.showNotification('Настройки сохранены', 'success');
    }

    resetSettings() {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
            this.settings = this.getDefaultSettings();
            this.renderSettings();
            this.saveSettingsData();
            this.showNotification('Настройки сброшены', 'success');
        }
    }

    // Методы для резервных копий
    loadBackups() {
        this.renderBackupList();
    }

    renderBackupList() {
        const container = document.getElementById('backup-list');
        if (!container) return;

        // Заглушка для списка backup'ов
        container.innerHTML = `
            <div class="no-data" style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">💾</div>
                <h3>Резервные копии</h3>
                <p>Здесь будут отображаться созданные резервные копии</p>
            </div>
        `;
    }

    createBackup() {
        const data = {
            users: this.users,
            cards: this.cards,
            upgrades: this.upgrades,
            levels: this.levels,
            settings: this.settings,
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
                        this.cards = data.cards || [];
                        this.upgrades = data.upgrades || {};
                        this.levels = data.levels || {};
                        this.settings = data.settings || this.getDefaultSettings();
                        
                        this.saveAllData();
                        this.loadAllData();
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

    // Методы для аналитики
    loadAnalytics() {
        this.renderAnalytics();
    }

    renderAnalytics() {
        // Заглушка для аналитики
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach(container => {
            container.innerHTML = '<div class="no-data" style="text-align: center; padding: 20px;">График аналитики</div>';
        });
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

    // Методы сохранения данных
    saveUsersData() {
        try {
            localStorage.setItem('darkPawsClicker_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users data:', error);
            this.showNotification('Ошибка сохранения данных пользователей', 'error');
        }
    }

    saveCardsData() {
        try {
            localStorage.setItem('darkPawsClicker_cards', JSON.stringify(this.cards));
        } catch (error) {
            console.error('Error saving cards data:', error);
        }
    }

    saveUpgradesData() {
        try {
            localStorage.setItem('darkPawsClicker_upgrades', JSON.stringify(this.upgrades));
        } catch (error) {
            console.error('Error saving upgrades data:', error);
        }
    }

    saveLevelsData() {
        try {
            localStorage.setItem('darkPawsClicker_levels', JSON.stringify(this.levels));
        } catch (error) {
            console.error('Error saving levels data:', error);
        }
    }

    saveSettingsData() {
        try {
            localStorage.setItem('darkPawsClicker_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    saveAllData() {
        this.saveUsersData();
        this.saveCardsData();
        this.saveUpgradesData();
        this.saveLevelsData();
        this.saveSettingsData();
    }

    // Методы для модальных окон
    setupModalListeners() {
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target.dataset.modal) {
                    this.hideModal(e.target.dataset.modal);
                } else {
                    this.hideAllModals();
                }
            });
        });

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
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-user-name').value = user.first_name || '';
        document.getElementById('edit-user-level').value = user.gameState?.level || 1;
        document.getElementById('edit-user-score').value = Math.floor(user.gameState?.score || 0);
        document.getElementById('edit-user-clicks').value = user.gameState?.stats?.totalClicks || 0;
        
        this.showModal('edit-user-modal');
        
        document.getElementById('save-user-changes').onclick = () => this.saveUserChanges(user.id);
    }

    saveUserChanges(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

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
        this.showNotification('Функция добавления карт в разработке', 'info');
    }

    showAddLevelModal() {
        this.showNotification('Функция добавления уровней в разработке', 'info');
    }

    // Дашборд
    loadDashboard() {
        this.renderDashboard();
    }

    renderDashboard() {
        this.renderTopPlayers();
        this.renderRecentActivity();
        this.renderSystemAlerts();
    }

    renderTopPlayers() {
        const container = document.getElementById('top-players');
        if (!container) return;

        const topPlayers = [...this.users]
            .sort((a, b) => (b.gameState?.score || 0) - (a.gameState?.score || 0))
            .slice(0, 5);

        let html = '';
        topPlayers.forEach((user, index) => {
            const gameState = user.gameState || {};
            html += `
                <div class="top-player-item">
                    <div class="top-player-rank">${index + 1}</div>
                    <div class="top-player-avatar">
                        ${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div class="top-player-info">
                        <div class="top-player-name">${user.first_name || 'Unknown'}</div>
                        <div class="top-player-score">${Math.floor(gameState.score || 0).toLocaleString()} очков</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="no-data">Нет данных об игроках</div>';
    }

    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recentUsers = [...this.users]
            .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
            .slice(0, 5);

        let html = '';
        recentUsers.forEach(user => {
            html += `
                <div class="activity-item">
                    <div class="activity-avatar">
                        ${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div class="activity-info">
                        <div class="activity-user">${user.first_name || 'Unknown'}</div>
                        <div class="activity-time">${this.formatRelativeTime(user.lastActive)}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<div class="no-data">Нет recent activity</div>';
    }

    renderSystemAlerts() {
        const container = document.getElementById('system-alerts');
        if (!container) return;

        const alerts = [];
        
        if (this.users.length === 0) {
            alerts.push({ type: 'warning', message: 'Нет зарегистрированных пользователей' });
        }
        
        if (Object.keys(this.upgrades).length === 0) {
            alerts.push({ type: 'warning', message: 'Не настроены улучшения' });
        }
        
        if (this.cards.length === 0) {
            alerts.push({ type: 'warning', message: 'Не настроены карты' });
        }

        let html = '';
        if (alerts.length === 0) {
            html = '<div class="alert success">✅ Все системы работают нормально</div>';
        } else {
            alerts.forEach(alert => {
                html += `<div class="alert ${alert.type}">${alert.message}</div>`;
            });
        }

        container.innerHTML = html;
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        return `${days} дн назад`;
    }

    refreshStats() {
        this.loadAllData();
        this.showNotification('Статистика обновлена', 'success');
    }
}

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.adminAuth && window.adminAuth.isAuthenticated) {
            window.adminPanel = new AdminPanel();
        }
    }, 100);
});
