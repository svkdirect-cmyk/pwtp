class DarkPawsClicker {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.gameState = {
            score: 0,
            level: 1,
            upgrades: {
                clickPower: 1,
                autoClick: 0,
                criticalChance: 1
            },
            stats: {
                totalClicks: 0,
                totalScore: 0,
                playTime: 0,
                joinDate: new Date().toISOString(),
                criticalHits: 0
            },
            friends: [],
            comboCards: [],
            achievements: {
                firstSteps: false,
                hardWorker: false,
                clickMaster: false,
                clickLegend: false
            },
            lastSave: Date.now()
        };
        
        this.particles = [];
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.lastTouch = null;
        
        // Настройки сервера
        this.apiUrl = 'https://your-server.com/api';
        this.botToken = 'YOUR_BOT_TOKEN_HERE';
        
        // Настройки админ-панели
        this.adminEnabled = false;
        this.adminCode = '1337';
        
        this.init();
    }

    init() {
        console.log('Initializing Dark Paws Clicker...');
        
        // Инициализируем Telegram Web App
        if (this.tg && this.tg.expand) {
            this.tg.expand();
            this.tg.enableClosingConfirmation();
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        this.loadGameState();
        this.updateUI();
        this.startAutoClicker();
        this.animateParticles();
        
        // Инициализируем вкладки
        this.setupTabs();
        
        // Запускаем отсчет времени игры
        this.startPlayTimeCounter();
        
        // Инициализируем серверные функции
        this.initServerFeatures();
        
        // Инициализируем админ-панель
        this.setupAdminPanel();
    }

    initServerFeatures() {
        // Автоматическая загрузка состояния при старте
        if (this.user && this.user.id) {
            this.loadGameStateFromServer();
        }
        
        // Обработка реферальных ссылок
        this.processReferralLink();
    }

    setupEventListeners() {
        // Клик по лапке
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            pawButton.addEventListener('click', (e) => {
                this.handleClick(e);
            });
            
            // Добавляем тактильную обратную связь
            pawButton.addEventListener('mousedown', () => {
                pawButton.classList.add('click-animation');
            });
            
            pawButton.addEventListener('mouseup', () => {
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
            });
            
            pawButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                pawButton.classList.add('click-animation');
                // Сохраняем позицию касания для создания частиц
                this.lastTouch = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            });
            
            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
                
                // Обрабатываем клик с позицией касания
                if (this.lastTouch) {
                    const touchEvent = {
                        clientX: this.lastTouch.clientX,
                        clientY: this.lastTouch.clientY
                    };
                    this.handleClick(touchEvent);
                    this.lastTouch = null;
                }
            });
        }

        // Кнопки улучшений
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    const upgradeType = upgradeCard.dataset.upgrade;
                    this.buyUpgrade(upgradeType);
                }
            });
        });

        // Кнопка приглашения друзей
        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.inviteFriends();
            });
        }

        // Кнопка обновления списка друзей
        const refreshBtn = document.getElementById('refresh-friends');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadFriendsList();
                this.loadLeaderboard();
            });
        }

        // Клик по всей секции профиля для открытия
        const profileOpener = document.getElementById('profile-opener');
        if (profileOpener) {
            profileOpener.addEventListener('click', (e) => {
                e.preventDefault();
                this.openProfile();
            });
        }

        // Закрытие модального окна профиля
        const closeProfile = document.getElementById('close-profile');
        if (closeProfile) {
            closeProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeProfile();
            });
        }

        // Клик по фону для закрытия модального окна
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.closeProfile();
                }
            });
        }

        // Кнопка поделиться профилем
        const shareProfile = document.getElementById('share-profile');
        if (shareProfile) {
            shareProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareProfile();
            });
        }
    }

    setupAdminPanel() {
        // Секретная комбинация для открытия админки (удерживать палец на лапке 3 секунды)
        const pawButton = document.getElementById('paw-button');
        let pressTimer;
        
        if (pawButton) {
            pawButton.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.showAdminActivation();
                }, 3000);
            });
            
            pawButton.addEventListener('touchend', (e) => {
                clearTimeout(pressTimer);
            });
            
            pawButton.addEventListener('mousedown', (e) => {
                pressTimer = setTimeout(() => {
                    this.showAdminActivation();
                }, 3000);
            });
            
            pawButton.addEventListener('mouseup', (e) => {
                clearTimeout(pressTimer);
            });
            
            pawButton.addEventListener('mouseleave', (e) => {
                clearTimeout(pressTimer);
            });
        }

        // Обработчики для админ-панели
        this.setupAdminEventListeners();
    }

    setupAdminEventListeners() {
        // Закрытие админ-панели
        const closeAdmin = document.getElementById('close-admin');
        if (closeAdmin) {
            closeAdmin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeAdminPanel();
            });
        }

        // Клик по фону для закрытия
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.addEventListener('click', (e) => {
                if (e.target === adminPanel) {
                    this.closeAdminPanel();
                }
            });
        }

        // Быстрые действия
        document.getElementById('admin-add-1000')?.addEventListener('click', () => this.adminAddScore(1000));
        document.getElementById('admin-add-10000')?.addEventListener('click', () => this.adminAddScore(10000));
        document.getElementById('admin-level-up')?.addEventListener('click', () => this.adminLevelUp());
        document.getElementById('admin-max-upgrades')?.addEventListener('click', () => this.adminMaxUpgrades());
        document.getElementById('admin-reset-game')?.addEventListener('click', () => this.adminResetGame());
        document.getElementById('admin-unlock-all')?.addEventListener('click', () => this.adminUnlockAll());

        // Серверные действия
        document.getElementById('admin-test-connection')?.addEventListener('click', () => this.adminTestConnection());
        document.getElementById('admin-force-save')?.addEventListener('click', () => this.adminForceSave());
        document.getElementById('admin-force-load')?.addEventListener('click', () => this.adminForceLoad());

        // Отладка
        document.getElementById('admin-export-save')?.addEventListener('click', () => this.adminExportSave());
        document.getElementById('admin-import-save')?.addEventListener('click', () => this.adminImportSave());
        document.getElementById('admin-show-logs')?.addEventListener('click', () => this.adminShowLogs());
        document.getElementById('admin-clear-data')?.addEventListener('click', () => this.adminClearData());

        // Основные кнопки
        document.getElementById('admin-apply')?.addEventListener('click', () => this.adminApplyChanges());
        document.getElementById('admin-save-close')?.addEventListener('click', () => this.adminSaveAndClose());
    }

    showAdminActivation() {
        if (this.adminEnabled) {
            this.openAdminPanel();
            return;
        }

        const code = prompt('🔐 Введите админ код:');
        if (code === this.adminCode) {
            this.adminEnabled = true;
            this.openAdminPanel();
            this.adminLog('Админ панель активирована');
        } else if (code) {
            alert('❌ Неверный код доступа');
        }
    }

    openAdminPanel() {
        if (!this.adminEnabled) return;
        
        this.updateAdminPanel();
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAdminPanel() {
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateAdminPanel() {
        // Заполняем поля текущими значениями
        document.getElementById('admin-score').value = this.gameState.score;
        document.getElementById('admin-level').value = this.gameState.level;
        document.getElementById('admin-total-clicks').value = this.gameState.stats.totalClicks;
        document.getElementById('admin-play-time').value = Math.floor(this.gameState.stats.playTime / 3600000);
        
        document.getElementById('admin-click-power').value = this.gameState.upgrades.clickPower;
        document.getElementById('admin-auto-click').value = this.gameState.upgrades.autoClick;
        document.getElementById('admin-critical').value = this.gameState.upgrades.criticalChance;
        
        document.getElementById('admin-api-url').value = this.apiUrl;
        document.getElementById('admin-bot-token').value = this.botToken;
    }

    // Методы быстрых действий
    adminAddScore(amount) {
        this.gameState.score += amount;
        this.updateUI();
        this.adminLog(`Добавлено ${amount} очков`);
    }

    adminLevelUp() {
        this.gameState.level++;
        this.showLevelUp();
        this.adminLog(`Уровень повышен до ${this.gameState.level}`);
    }

    adminMaxUpgrades() {
        this.gameState.upgrades.clickPower = 100;
        this.gameState.upgrades.autoClick = 100;
        this.gameState.upgrades.criticalChance = 100;
        this.updateUI();
        this.adminLog('Все улучшения установлены на максимум');
    }

    adminResetGame() {
        if (confirm('⚠️ ВЫ УВЕРЕНЫ? Это полностью сбросит всю игру!')) {
            const originalUser = { ...this.user };
            this.gameState = {
                score: 0,
                level: 1,
                upgrades: { clickPower: 1, autoClick: 0, criticalChance: 1 },
                stats: { totalClicks: 0, totalScore: 0, playTime: 0, joinDate: new Date().toISOString(), criticalHits: 0 },
                friends: [],
                comboCards: [],
                achievements: { firstSteps: false, hardWorker: false, clickMaster: false, clickLegend: false },
                lastSave: Date.now()
            };
            this.user = originalUser;
            this.updateUI();
            this.saveGameState();
            this.adminLog('Игра полностью сброшена');
        }
    }

    adminUnlockAll() {
        this.gameState.achievements.firstSteps = true;
        this.gameState.achievements.hardWorker = true;
        this.gameState.achievements.clickMaster = true;
        this.gameState.achievements.clickLegend = true;
        this.gameState.level = 20;
        this.updateUI();
        this.adminLog('Все достижения и уровни разблокированы');
    }

    // Серверные методы
    async adminTestConnection() {
        this.adminLog('Тестирование соединения с сервером...');
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                this.adminLog('✅ Соединение с сервером установлено');
            } else {
                this.adminLog('❌ Сервер недоступен');
            }
        } catch (error) {
            this.adminLog(`❌ Ошибка соединения: ${error.message}`);
        }
    }

    adminForceSave() {
        this.saveGameState();
        this.adminLog('Принудительное сохранение выполнено');
    }

    async adminForceLoad() {
        const success = await this.loadGameStateFromServer();
        if (success) {
            this.updateUI();
            this.adminLog('Данные загружены с сервера');
        } else {
            this.adminLog('❌ Не удалось загрузить данные с сервера');
        }
    }

    // Методы отладки
    adminExportSave() {
        const saveData = {
            gameState: this.gameState,
            user: this.user,
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `darkpaws_save_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.adminLog('Сохранение экспортировано');
    }

    adminImportSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const saveData = JSON.parse(event.target.result);
                        this.gameState = { ...this.gameState, ...saveData.gameState };
                        this.updateUI();
                        this.saveGameState();
                        this.adminLog('Сохранение импортировано');
                    } catch (error) {
                        this.adminLog('❌ Ошибка импорта: неверный формат файла');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    adminShowLogs() {
        const debugInfo = `
=== СИСТЕМНАЯ ИНФОРМАЦИЯ ===
User ID: ${this.user?.id || 'N/A'}
Level: ${this.gameState.level}
Score: ${this.gameState.score}
Total Clicks: ${this.gameState.stats.totalClicks}
Play Time: ${Math.floor(this.gameState.stats.playTime / 3600000)}ч
Critical Hits: ${this.gameState.stats.criticalHits}
Upgrades: ${JSON.stringify(this.gameState.upgrades)}
Last Save: ${new Date(this.gameState.lastSave).toLocaleString()}
Telegram WebApp: ${!!this.tg}
Admin Enabled: ${this.adminEnabled}
        `.trim();
        
        document.getElementById('admin-debug-output').value = debugInfo;
    }

    adminClearData() {
        if (confirm('⚠️ ОЧИСТИТЬ ВСЕ ДАННЫЕ? Это удалит все сохранения!')) {
            localStorage.removeItem('darkPawsClicker_save');
            location.reload();
        }
    }

    // Применение изменений
    adminApplyChanges() {
        // Применяем изменения из полей ввода
        this.gameState.score = parseInt(document.getElementById('admin-score').value) || 0;
        this.gameState.level = parseInt(document.getElementById('admin-level').value) || 1;
        this.gameState.stats.totalClicks = parseInt(document.getElementById('admin-total-clicks').value) || 0;
        this.gameState.stats.playTime = (parseFloat(document.getElementById('admin-play-time').value) || 0) * 3600000;
        
        this.gameState.upgrades.clickPower = parseInt(document.getElementById('admin-click-power').value) || 1;
        this.gameState.upgrades.autoClick = parseInt(document.getElementById('admin-auto-click').value) || 0;
        this.gameState.upgrades.criticalChance = parseInt(document.getElementById('admin-critical').value) || 1;
        
        this.apiUrl = document.getElementById('admin-api-url').value;
        this.botToken = document.getElementById('admin-bot-token').value;
        
        this.updateUI();
        this.adminLog('Изменения применены');
    }

    adminSaveAndClose() {
        this.adminApplyChanges();
        this.saveGameState();
        this.closeAdminPanel();
        this.adminLog('Изменения сохранены и панель закрыта');
    }

    adminLog(message) {
        console.log(`[ADMIN] ${message}`);
        const debugOutput = document.getElementById('admin-debug-output');
        if (debugOutput) {
            const timestamp = new Date().toLocaleTimeString();
            debugOutput.value += `[${timestamp}] ${message}\n`;
            debugOutput.scrollTop = debugOutput.scrollHeight;
        }
    }

    initTelegramAuth() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            console.log('User authenticated:', this.user);
            this.updateUserInfo();
        } else {
            console.log('No user data available');
            // Для демо создаем тестового пользователя
            this.user = {
                id: Math.floor(Math.random() * 10000),
                first_name: 'Игрок',
                username: 'player_' + Math.floor(Math.random() * 1000),
                photo_url: ''
            };
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        if (this.user) {
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-name');
            const levelText = document.querySelector('.level-text');
            
            if (avatar) {
                if (this.user.photo_url) {
                    avatar.src = this.user.photo_url;
                } else {
                    avatar.style.display = 'none';
                }
            }
            if (username) {
                username.textContent = this.user.first_name || 'Player';
            }
            if (levelText) {
                levelText.textContent = `Уровень ${this.gameState.level}`;
            }
        }
    }

    // СЕРВЕРНЫЕ ФУНКЦИИ

    // Серверное сохранение
    async saveGameStateToServer() {
        try {
            const response = await fetch(`${this.apiUrl}/save-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: this.user,
                    gameState: this.gameState
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('Game saved to server');
                return true;
            } else {
                console.error('Server save failed');
                return false;
            }
        } catch (error) {
            console.error('Server save error:', error);
            return false;
        }
    }

    // Серверная загрузка
    async loadGameStateFromServer() {
        try {
            const response = await fetch(`${this.apiUrl}/load-game/${this.user.id}`);
            const result = await response.json();

            if (result.exists && result.gameState) {
                this.gameState = { ...this.gameState, ...result.gameState };
                console.log('Game loaded from server');
                this.updateUI();
                return true;
            } else {
                console.log('No server save found');
                return false;
            }
        } catch (error) {
            console.error('Server load error:', error);
            return false;
        }
    }

    // Улучшенная система приглашения друзей
    async inviteFriends() {
        if (this.tg && this.tg.showContactPicker) {
            try {
                const contact = await this.tg.showContactPicker();
                
                if (contact) {
                    const inviteMessage = `🎮 <b>Dark Paws Clicker</b>\n\n` +
                        `Привет! ${this.user.first_name} приглашает тебя в увлекательную игру-кликер!\n\n` +
                        `• Прокачивай свою лапу 🐾\n` +
                        `• Открывай улучшения ⚡\n` +
                        `• Соревнуйся с друзьями 🏆\n\n` +
                        `Присоединяйся и стань легендой кликов!`;

                    // Отправляем приглашение через сервер
                    const response = await fetch(`${this.apiUrl}/invite-friend`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            fromUserId: this.user.id,
                            toUserId: contact.user_id,
                            message: inviteMessage
                        })
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        this.tg.showPopup({
                            title: '✅ Приглашение отправлено',
                            message: `Приглашение успешно отправлено ${contact.first_name || 'другу'}`,
                            buttons: [{ type: 'ok' }]
                        });
                    } else {
                        throw new Error('Failed to send invite');
                    }
                }
            } catch (error) {
                console.error('Invite error:', error);
                this.tg.showPopup({
                    title: '❌ Ошибка',
                    message: 'Не удалось отправить приглашение',
                    buttons: [{ type: 'ok' }]
                });
            }
        } else {
            // Fallback для браузера
            const shareText = `Присоединяйся к Dark Paws Clicker! 🎮\nИграй и прокачивай свою лапу!\n\nСсылка: ${window.location.href}?ref=${this.user.id}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Dark Paws Clicker',
                    text: shareText,
                    url: window.location.href + `?ref=${this.user.id}`
                });
            } else {
                // Копирование ссылки в буфер обмена
                navigator.clipboard.writeText(window.location.href + `?ref=${this.user.id}`);
                alert('Ссылка скопирована в буфер обмена! Отправь её другу: ' + shareText);
            }
        }
    }

    // Добавление друга
    async addFriend(friendId) {
        try {
            const response = await fetch(`${this.apiUrl}/add-friend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.user.id,
                    friendId: friendId
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Add friend error:', error);
            return false;
        }
    }

    // Загрузка списка друзей
    async loadFriendsList() {
        try {
            const response = await fetch(`${this.apiUrl}/friends/${this.user.id}`);
            const result = await response.json();
            
            if (result.friends) {
                this.gameState.friends = result.friends;
                this.updateFriendsTab();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Load friends error:', error);
            return false;
        }
    }

    // Загрузка таблицы лидеров
    async loadLeaderboard() {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard`);
            const result = await response.json();
            
            if (result.leaderboard) {
                this.updateLeaderboard(result.leaderboard);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Load leaderboard error:', error);
            return false;
        }
    }

    // Обработка реферальных ссылок
    async processReferral(referrerId) {
        if (referrerId && referrerId !== this.user.id.toString()) {
            try {
                const response = await fetch(`${this.apiUrl}/referral/${referrerId}?userId=${this.user.id}`);
                const result = await response.json();
                
                if (result.success && result.bonusApplied) {
                    // Начисляем бонусы
                    this.gameState.score += 100;
                    this.updateUI();
                    
                    this.tg.showPopup({
                        title: '🎁 Бонус за приглашение!',
                        message: 'Вы получили +100 очков за присоединение по приглашению друга!',
                        buttons: [{ type: 'ok' }]
                    });
                }
                return result.success;
            } catch (error) {
                console.error('Referral processing error:', error);
                return false;
            }
        }
        return false;
    }

    // Автоматическая обработка реферальной ссылки при загрузке
    processReferralLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        const startParam = urlParams.get('startapp');
        
        let referrerId = refParam;
        if (!referrerId && startParam && startParam.startsWith('ref_')) {
            referrerId = startParam.replace('ref_', '');
        }
        
        if (referrerId) {
            // Обрабатываем реферала после инициализации игры
            setTimeout(() => {
                if (this.user && this.user.id) {
                    this.processReferral(referrerId);
                }
            }, 3000);
        }
    }

    // ОСТАЛЬНЫЕ ФУНКЦИИ ИГРЫ

    setupTabs() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Убираем активный класс со всех кнопок
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Показываем выбранную вкладку
        const targetTab = document.getElementById(tabId);
        const targetTabButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetTabButton) {
            targetTab.classList.add('active');
            targetTabButton.classList.add('active');
            this.currentTab = tabId;
            
            // Обновляем контент вкладки если нужно
            this.updateTabContent(tabId);
        }
    }

    updateTabContent(tabId) {
        switch(tabId) {
            case 'friends-tab':
                this.updateFriendsTab();
                break;
            case 'levels-tab':
                this.updateLevelsTab();
                break;
            case 'combo-tab':
                this.updateComboTab();
                break;
        }
    }

    updateFriendsTab() {
        // Обновляем счетчик друзей
        const friendsCount = document.querySelector('.friends-count span');
        const friendsBonus = document.querySelector('.friends-bonus span');
        
        if (friendsCount) {
            friendsCount.textContent = this.gameState.friends.length;
        }
        
        // Рассчитываем бонусы за друзей
        const friendCount = this.gameState.friends.length;
        let bonusPercent = 0;
        
        if (friendCount >= 5) bonusPercent = 15;
        else if (friendCount >= 3) bonusPercent = 10;
        else if (friendCount >= 1) bonusPercent = 5;
        
        if (friendsBonus) {
            friendsBonus.textContent = bonusPercent + '%';
        }
        
        // Обновляем список друзей
        this.updateFriendsList();
        
        // Обновляем бонусы
        this.updateFriendsBonuses();
        
        // Загружаем таблицу лидеров
        this.loadLeaderboard();
    }

    updateFriendsList() {
        const container = document.getElementById('friends-list-container');
        if (!container) return;
        
        if (this.gameState.friends.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>Друзей пока нет</h3>
                    <p>Пригласите друзей и получайте бонусы за их прогресс</p>
                </div>
            `;
        } else {
            let friendsHTML = '';
            this.gameState.friends.forEach(friend => {
                friendsHTML += `
                    <div class="friend-item">
                        <div class="friend-avatar">
                            ${friend.first_name ? friend.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="friend-info">
                            <div class="friend-name">${friend.first_name || 'Unknown'}</div>
                            <div class="friend-stats">Уровень ${friend.level} • <span class="friend-score">${friend.score} очков</span></div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = friendsHTML;
        }
    }

    updateFriendsBonuses() {
        const bonusCards = document.querySelectorAll('.bonus-card');
        const friendCount = this.gameState.friends.length;
        
        bonusCards.forEach((card, index) => {
            const status = card.querySelector('.bonus-status');
            const requiredFriends = [1, 3, 5][index];
            
            if (status) {
                if (friendCount >= requiredFriends) {
                    status.textContent = 'Активно';
                    status.classList.add('active');
                } else {
                    status.textContent = 'Не активно';
                    status.classList.remove('active');
                }
            }
        });
    }

    updateLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="loading">Нет данных</div>';
            return;
        }
        
        let leaderboardHTML = '';
        leaderboard.forEach((player, index) => {
            const rank = index + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + '.';
            
            leaderboardHTML += `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${rankIcon}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-avatar">
                            ${player.first_name ? player.first_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="leaderboard-name">${player.first_name || 'Unknown'}</div>
                    </div>
                    <div class="leaderboard-score">${player.score}</div>
                </div>
            `;
        });
        
        container.innerHTML = leaderboardHTML;
    }

    updateLevelsTab() {
        // Обновляем текущий уровень
        const currentLevel = document.querySelector('.current-level span');
        if (currentLevel) {
            currentLevel.textContent = this.gameState.level;
        }
        
        // Обновляем индикатор прогресса
        this.updateLevelsProgress();
        
        // Обновляем карточки уровней
        this.updateLevelCards();
    }

    updateLevelsProgress() {
        const levelCircles = document.querySelectorAll('.level-circle');
        levelCircles.forEach((circle, index) => {
            const levelNumber = index + 1;
            
            circle.classList.remove('active');
            if (levelNumber <= this.gameState.level) {
                circle.classList.add('active');
            }
        });
    }

    updateLevelCards() {
        const levelCards = document.querySelectorAll('.level-card');
        
        levelCards.forEach((card, index) => {
            const levelNumber = index + 1;
            const status = card.querySelector('.level-status');
            
            // Убираем все классы статуса
            card.classList.remove('active', 'locked', 'completed');
            
            if (levelNumber < this.gameState.level) {
                card.classList.add('completed');
                if (status) {
                    status.textContent = 'Пройден';
                    status.classList.add('completed');
                }
            } else if (levelNumber === this.gameState.level) {
                card.classList.add('active');
                
                // Показываем прогресс до следующего уровня
                const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
                const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
                const progress = Math.max(0, this.gameState.score - currentLevelScore);
                const totalNeeded = nextLevelScore - currentLevelScore;
                
                if (status) {
                    if (totalNeeded > 0) {
                        const percentage = Math.min(100, (progress / totalNeeded) * 100);
                        status.textContent = `${Math.floor(percentage)}%`;
                    } else {
                        status.textContent = 'Макс уровень';
                    }
                    status.classList.remove('completed');
                }
            } else {
                card.classList.add('locked');
                const requiredScore = this.getRequiredScoreForLevel(levelNumber);
                if (status) {
                    status.textContent = `${requiredScore} очков`;
                    status.classList.remove('completed');
                }
            }
        });
    }

    updateComboTab() {
        // Обновляем статистику колоды
        this.updateDeckStats();
        
        // Обновляем коллекцию карт
        this.updateComboCards();
    }

    updateDeckStats() {
        const deckPower = document.querySelector('.power-value');
        const deckStats = document.querySelectorAll('.stat-value');
        
        if (deckPower) {
            deckPower.textContent = this.calculateDeckPower();
        }
        
        // Заглушка для статистики
        if (deckStats.length >= 3) {
            deckStats[0].textContent = '0%';
            deckStats[1].textContent = '0%';
            deckStats[2].textContent = '0%';
        }
    }

    calculateDeckPower() {
        // Простой расчет силы колоды
        return this.gameState.comboCards.length * 10;
    }

    updateComboCards() {
        const comboCards = document.querySelectorAll('.combo-card');
        
        comboCards.forEach((card, index) => {
            // В реальном приложении здесь будет проверка наличия карт
            // Сейчас все карты заблокированы
            card.classList.add('locked');
        });
    }

    openProfile() {
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    updateProfileModal() {
        // Обновляем аватар
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            if (this.user && this.user.photo_url) {
                profileAvatar.src = this.user.photo_url;
                profileAvatar.style.display = 'block';
            } else {
                profileAvatar.style.display = 'none';
            }
        }

        // Обновляем основную информацию
        const profileName = document.getElementById('profile-name');
        const profileLevel = document.getElementById('profile-level');
        const profileId = document.getElementById('profile-id');
        const profileRank = document.getElementById('profile-rank');

        if (profileName) {
            profileName.textContent = this.user ? this.user.first_name : 'Player';
        }
        if (profileLevel) {
            profileLevel.textContent = this.gameState.level;
        }
        if (profileId) {
            profileId.textContent = this.user ? this.user.id : '0000';
        }
        if (profileRank) {
            profileRank.textContent = this.getPlayerRank();
        }

        // Обновляем статистику
        this.updateProfileStats();

        // Обновляем достижения
        this.updateProfileAchievements();

        // Обновляем улучшения
        this.updateProfileUpgrades();
    }

    updateProfileStats() {
        const totalClicks = document.getElementById('profile-total-clicks');
        const playTime = document.getElementById('profile-play-time');
        const totalScore = document.getElementById('profile-total-score');
        const joinDate = document.getElementById('profile-join-date');

        if (totalClicks) {
            totalClicks.textContent = this.gameState.stats.totalClicks.toLocaleString();
        }
        if (playTime) {
            const hours = Math.floor(this.gameState.stats.playTime / 3600000);
            playTime.textContent = `${hours}ч`;
        }
        if (totalScore) {
            totalScore.textContent = this.gameState.stats.totalScore.toLocaleString();
        }
        if (joinDate) {
            const joinDateObj = new Date(this.gameState.stats.joinDate);
            const now = new Date();
            const diffTime = Math.abs(now - joinDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                joinDate.textContent = 'Сегодня';
            } else if (diffDays === 2) {
                joinDate.textContent = 'Вчера';
            } else if (diffDays <= 7) {
                joinDate.textContent = `${diffDays} дней назад`;
            } else {
                joinDate.textContent = joinDateObj.toLocaleDateString('ru-RU');
            }
        }
    }

    updateProfileAchievements() {
        // Обновляем статус достижений
        const achievements = document.querySelectorAll('.achievement');
        
        if (achievements.length >= 4) {
            achievements[0].classList.toggle('unlocked', this.gameState.achievements.firstSteps);
            achievements[1].classList.toggle('unlocked', this.gameState.achievements.hardWorker);
            achievements[2].classList.toggle('unlocked', this.gameState.achievements.clickMaster);
            achievements[3].classList.toggle('unlocked', this.gameState.achievements.clickLegend);
        }
    }

    updateProfileUpgrades() {
        const clickPower = document.getElementById('profile-click-power');
        const autoClick = document.getElementById('profile-auto-click');
        const critical = document.getElementById('profile-critical');

        if (clickPower) {
            clickPower.textContent = this.gameState.upgrades.clickPower;
        }
        if (autoClick) {
            autoClick.textContent = this.gameState.upgrades.autoClick;
        }
        if (critical) {
            critical.textContent = this.gameState.upgrades.criticalChance;
        }
    }

    getPlayerRank() {
        const level = this.gameState.level;
        if (level >= 20) return 'Легенда';
        if (level >= 15) return 'Мастер';
        if (level >= 10) return 'Опытный';
        if (level >= 5) return 'Новичок';
        return 'Начинающий';
    }

    shareProfile() {
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'Поделиться профилем',
                message: `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${this.gameState.score}\nПрисоединяйся!`,
                buttons: [
                    { type: 'default', text: 'Поделиться' },
                    { type: 'cancel', text: 'Отмена' }
                ]
            });
        } else {
            // Заглушка для браузера
            const shareText = `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${this.gameState.score}\nПрисоединяйся!`;
            if (navigator.share) {
                navigator.share({
                    title: 'Dark Paws Clicker',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                alert(shareText);
            }
        }
    }

    startPlayTimeCounter() {
        setInterval(() => {
            this.gameState.stats.playTime += 1000; // +1 секунда
            // Сохраняем на сервер каждую минуту
            if (this.gameState.stats.playTime % 60000 === 0) {
                this.saveGameState();
            }
        }, 1000);
    }

    handleClick(event) {
        // Увеличиваем счетчик кликов
        this.gameState.stats.totalClicks++;
        this.gameState.stats.totalScore += this.gameState.upgrades.clickPower;

        // Проверяем достижения
        this.checkAchievements();

        // Создаем эффекты частиц
        this.createParticles(event);
        
        // Вычисляем очки
        let points = this.gameState.upgrades.clickPower;
        let isCritical = false;
        
        // Шанс критического удара
        const critChance = this.gameState.upgrades.criticalChance * 0.03;
        if (Math.random() < critChance) {
            points *= 3;
            isCritical = true;
            this.gameState.stats.criticalHits++;
        }
        
        this.addScore(points, isCritical);
        
        // Автосохранение на сервер каждые 10 кликов
        if (this.gameState.stats.totalClicks % 10 === 0) {
            this.saveGameState();
        }
    }

    checkAchievements() {
        const clicks = this.gameState.stats.totalClicks;
        
        if (clicks >= 100 && !this.gameState.achievements.firstSteps) {
            this.gameState.achievements.firstSteps = true;
            this.showAchievementNotification('Первые шаги');
        }
        if (clicks >= 1000 && !this.gameState.achievements.hardWorker) {
            this.gameState.achievements.hardWorker = true;
            this.showAchievementNotification('Усердный работник');
        }
        if (clicks >= 10000 && !this.gameState.achievements.clickMaster) {
            this.gameState.achievements.clickMaster = true;
            this.showAchievementNotification('Клик-мастер');
        }
        if (clicks >= 50000 && !this.gameState.achievements.clickLegend) {
            this.gameState.achievements.clickLegend = true;
            this.showAchievementNotification('Легенда кликов');
        }
    }

    showAchievementNotification(achievementName) {
        // Можно добавить красивое уведомление
        console.log(`🎉 Достижение разблокировано: ${achievementName}`);
        
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎉 Новое достижение!',
                message: `Вы получили достижение: "${achievementName}"`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        // Сохраняем достижение на сервер
        this.saveGameState();
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        // Получаем координаты клика
        let clientX, clientY;
        
        if (event.touches && event.touches[0]) {
            // Для touch событий
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Для mouse событий
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Создаем 8-12 частиц
        const particleCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Случайное направление и расстояние
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Устанавливаем CSS переменные для анимации
            particle.style.cssText = `
                --tx: ${tx}px;
                --ty: ${ty}px;
                left: ${x}px;
                top: ${y}px;
                width: ${2 + Math.random() * 4}px;
                height: ${2 + Math.random() * 4}px;
                opacity: ${0.3 + Math.random() * 0.7};
                animation: particle-float ${0.8 + Math.random() * 0.4}s ease-out forwards;
            `;
            
            container.appendChild(particle);
            
            // Удаляем частицу после анимации
            setTimeout(() => {
                if (particle.parentNode === container) {
                    container.removeChild(particle);
                }
            }, 1200);
        }
    }

    animateParticles() {
        // Фоновая анимация редких частиц
        setInterval(() => {
            if (Math.random() < 0.1) {
                this.createBackgroundParticle();
            }
        }, 1000);
    }

    createBackgroundParticle() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Случайная позиция по краям
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // верх
                x = Math.random() * container.offsetWidth;
                y = 0;
                break;
            case 1: // право
                x = container.offsetWidth;
                y = Math.random() * container.offsetHeight;
                break;
            case 2: // низ
                x = Math.random() * container.offsetWidth;
                y = container.offsetHeight;
                break;
            case 3: // лево
                x = 0;
                y = Math.random() * container.offsetHeight;
                break;
        }
        
        // Направление к центру
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        const angle = Math.atan2(centerY - y, centerX - x);
        const distance = 100 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.cssText = `
            --tx: ${tx}px;
            --ty: ${ty}px;
            left: ${x}px;
            top: ${y}px;
            width: ${1 + Math.random() * 2}px;
            height: ${1 + Math.random() * 2}px;
            opacity: ${0.1 + Math.random() * 0.2};
            animation: particle-float ${2 + Math.random() * 2}s ease-out forwards;
        `;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode === container) {
                container.removeChild(particle);
            }
        }, 4000);
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ДОБАВЛЕНИЯ ОЧКОВ
    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        
        // Проверка уровня с защитой от ухода в минус
        let leveledUp = false;
        while (this.gameState.score >= this.getRequiredScoreForLevel(this.gameState.level + 1) && this.gameState.level < this.getMaxLevel()) {
            this.gameState.level++;
            leveledUp = true;
        }
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
        }
        
        // Визуальный эффект при критическом ударе
        if (isCritical) {
            this.showCriticalEffect(points);
        }
    }

    // Добавляем метод для получения максимального уровня
    getMaxLevel() {
        return 100; // Максимальный уровень игры
    }

    // ИСПРАВЛЕННАЯ ФОРМУЛА РАСЧЕТА ОЧКОВ ДЛЯ УРОВНЕЙ
    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100; // Исправленная формула
    }

    showLevelUp() {
        // Можно добавить анимацию уровня
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
        if (levelText) {
            levelText.textContent = `Уровень ${this.gameState.level}`;
        }
        
        // Сохраняем на сервер при повышении уровня
        this.saveGameState();
    }

    showCriticalEffect(points) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const critText = document.createElement('div');
        critText.className = 'particle critical-hit';
        critText.textContent = `CRIT! +${points}`;
        critText.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            font-weight: bold;
            color: var(--text-accent);
            pointer-events: none;
            z-index: 20;
            animation: floatUp 1.5s ease-out forwards;
        `;
        
        container.appendChild(critText);
        
        setTimeout(() => {
            if (critText.parentNode === container) {
                container.removeChild(critText);
            }
        }, 1500);
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ПОКУПКИ УЛУЧШЕНИЙ
    buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 100 * Math.pow(2, this.gameState.upgrades.autoClick - 1),
            'critical-chance': 25 * Math.pow(2, this.gameState.upgrades.criticalChance - 1)
        };

        const cost = costs[upgradeType];
        
        if (this.gameState.score >= cost) {
            // Сохраняем текущий прогресс до покупки
            const oldScore = this.gameState.score;
            
            this.gameState.score -= cost;
            
            switch(upgradeType) {
                case 'click-power':
                    this.gameState.upgrades.clickPower++;
                    break;
                case 'auto-click':
                    this.gameState.upgrades.autoClick++;
                    break;
                case 'critical-chance':
                    this.gameState.upgrades.criticalChance++;
                    break;
            }
            
            // Проверяем, не понизился ли уровень из-за траты очков
            this.checkLevelAfterPurchase(oldScore);
            
            this.updateUI();
            this.saveGameState();
            
            // Показываем сообщение о успешной покупке
            this.showUpgradeNotification(upgradeType);
        } else {
            // Показываем сообщение о недостатке очков
            this.showInsufficientFundsNotification(cost);
        }
    }

    // НОВЫЙ МЕТОД: Проверка уровня после покупки улучшений
    checkLevelAfterPurchase(oldScore) {
        const currentLevel = this.gameState.level;
        const currentScore = this.gameState.score;
        
        // Проверяем, не упал ли игрок ниже требований текущего уровня
        while (currentScore < this.getRequiredScoreForLevel(currentLevel) && currentLevel > 1) {
            this.gameState.level--;
            // Продолжаем проверять, пока не найдем подходящий уровень
        }
        
        // Если уровень изменился, показываем уведомление
        if (this.gameState.level !== currentLevel) {
            this.showLevelDownNotification(currentLevel, this.gameState.level);
        }
    }

    showLevelDownNotification(oldLevel, newLevel) {
        console.log(`🔽 Уровень понижен с ${oldLevel} до ${newLevel}`);
        
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '⚠️ Уровень понижен',
                message: `Из-за траты очков ваш уровень понизился с ${oldLevel} до ${newLevel}`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    showUpgradeNotification(upgradeType) {
        const upgradeNames = {
            'click-power': 'Сила лапы',
            'auto-click': 'Авто-клик', 
            'critical-chance': 'Точность'
        };
        
        console.log(`🔼 Улучшение куплено: ${upgradeNames[upgradeType]}`);
        
        // Можно добавить визуальное уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '✅ Улучшение куплено!',
                message: `Вы улучшили: ${upgradeNames[upgradeType]}`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    showInsufficientFundsNotification(requiredAmount) {
        console.log(`❌ Недостаточно очков. Нужно: ${requiredAmount}`);
        
        // Можно добавить визуальное уведомление
        if (this.tg && this.tg.showPopup) {
            this.tg.showPopup({
                title: '❌ Недостаточно очков',
                message: `Для покупки нужно: ${requiredAmount} очков`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0) {
                const autoPoints = this.gameState.upgrades.autoClick;
                this.addScore(autoPoints);
                
                // Сохраняем на сервер каждые 60 авто-кликов
                if (Math.random() < 0.016) { // ~1 раз в минуту
                    this.saveGameState();
                }
            }
        }, 1000);
    }

    updateUI() {
        // Обновляем счет и уровень
        const scoreElement = document.getElementById('score');
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        
        if (scoreElement) scoreElement.textContent = Math.floor(this.gameState.score).toLocaleString();
        if (levelBadge) levelBadge.textContent = this.gameState.level;
        if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;
        
        // Обновляем прогресс бар в шапке
        this.updateHeaderProgressBar();
        
        // Обновляем кнопки улучшений
        this.updateUpgradeButtons();
    }

    // ИСПРАВЛЕННЫЙ МЕТОД ОБНОВЛЕНИЯ ПРОГРЕСС БАРА
    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        // Исправление: не даем прогрессу уходить в минус
        let progress = Math.max(0, this.gameState.score - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        // Если достигнут максимум текущего уровня, показываем 100%
        let percentage = 0;
        if (totalNeeded > 0) {
            percentage = (progress / totalNeeded) * 100;
        } else {
            percentage = 100; // Если следующий уровень требует 0 очков (максимальный уровень)
        }
        
        // Ограничиваем процент от 0 до 100
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        
        if (progressFillHeader) {
            progressFillHeader.style.width = `${percentage}%`;
        }
    }

    updateUpgradeButtons() {
        const upgrades = document.querySelectorAll('.upgrade-card');
        
        upgrades.forEach(card => {
            const type = card.dataset.upgrade;
            const levelSpan = card.querySelector('.upgrade-level span');
            const button = card.querySelector('.upgrade-btn');
            
            if (!levelSpan || !button) return;
            
            let level, cost;
            
            switch(type) {
                case 'click-power':
                    level = this.gameState.upgrades.clickPower;
                    cost = 10 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
                    
                case 'auto-click':
                    level = this.gameState.upgrades.autoClick;
                    cost = level === 0 ? 50 : 100 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
                    
                case 'critical-chance':
                    level = this.gameState.upgrades.criticalChance;
                    cost = 25 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = cost;
                    button.dataset.cost = cost;
                    break;
            }
            
            // Обновляем доступность кнопок
            if (this.gameState.score >= cost) {
                button.disabled = false;
                button.classList.add('affordable');
            } else {
                button.disabled = true;
                button.classList.remove('affordable');
            }
        });
    }

    // ОБНОВЛЕННАЯ СИСТЕМА СОХРАНЕНИЯ
    saveGameState() {
        // Сохраняем в localStorage как fallback
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
        } catch (error) {
            console.error('Local storage save error:', error);
        }

        // Сохраняем на сервер
        this.saveGameStateToServer();
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Проверяем, что сохранение принадлежит текущему пользователю
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    console.log('Game state loaded from localStorage:', this.gameState);
                }
            }
        } catch (error) {
            console.error('Error loading game state from localStorage:', error);
        }
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

// Закрытие модальных окон по ESC и горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (window.clickerGame) {
            window.clickerGame.closeProfile();
            window.clickerGame.closeAdminPanel();
        }
    }
    
    // Секретная комбинация Ctrl+Alt+A для админки
    if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        if (window.clickerGame) {
            window.clickerGame.showAdminActivation();
        }
    }
});
