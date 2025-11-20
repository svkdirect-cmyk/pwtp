class DarkPawsClicker {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.gameState = {
            score: 0,
            totalEarnedScore: 0,
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
        
        this.particles = [];
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.lastTouch = null;
        this.isTelegram = false;
        this.pawButton = document.getElementById('paw-button');
        
        // ОПТИМАЛЬНЫЕ НАСТРОЙКИ СОХРАНЕНИЯ
        this.cloudSaveEnabled = false;
        this.saveInProgress = false;
        this.lastCloudSave = 0;
        
        // ВАШИ ИНТЕРВАЛЫ СОХРАНЕНИЯ
        this.saveIntervals = {
            IMMEDIATE: 0,
            HIGH_PRIORITY: 500,
            MEDIUM_PRIORITY: 2000,
            LOW_PRIORITY: 5000,
            AUTO_SAVE: 15000
        };
        
        // ПРИОРИТЕТЫ СОБЫТИЙ
        this.savePriorities = {
            levelUp: 'IMMEDIATE',
            upgrade: 'HIGH_PRIORITY',
            achievement: 'HIGH_PRIORITY',
            cardChange: 'HIGH_PRIORITY',
            bigScore: 'HIGH_PRIORITY',
            manualSync: 'IMMEDIATE',
            clickBatch: 'MEDIUM_PRIORITY',
            tabSwitch: 'MEDIUM_PRIORITY',
            profileOpen: 'MEDIUM_PRIORITY',
            autoTimerFast: 'LOW_PRIORITY',
            autoTimerFull: 'AUTO_SAVE',
            visibilityChange: 'LOW_PRIORITY'
        };
        
        // ОЧЕРЕДЬ СОХРАНЕНИЙ
        this.saveQueue = [];
        this.isProcessingQueue = false;
        
        // СТАТИСТИКА СИНХРОНИЗАЦИИ
        this.syncStats = {
            totalSaves: 0,
            cloudSaves: 0,
            failedSaves: 0,
            lastSyncTime: 0
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Dark Paws Clicker for Telegram Mini Apps...');
        
        if (this.tg) {
            this.isTelegram = true;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            this.tg.BackButton.hide();
            
            this.applyTelegramTheme();
            this.disableZoom();
            await this.initCloudStorage();
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        await this.loadGameState();
        this.updateUI();
        this.startAutoClicker();
        this.setupTabs();
        this.startPlayTimeCounter();
        this.updateComboTab();
        
        // Инициализация эффектов кнопки
        this.setupFloatingParticles();
        this.setupHapticFeedback();
        
        this.showSyncNotification();
    }

    /* ⭐ ПАРЯЩИЕ ЧАСТИЦЫ ВОКРУГ КНОПКИ */
    setupFloatingParticles() {
        const container = document.getElementById('floating-particles');
        if (!container) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            
            const startX = (Math.random() - 0.5) * 200;
            const startY = (Math.random() - 0.5) * 200;
            const midX = (Math.random() - 0.5) * 250;
            const midY = (Math.random() - 0.5) * 250;
            const endX = (Math.random() - 0.5) * 180;
            const endY = (Math.random() - 0.5) * 180;
            
            particle.style.setProperty('--start-x', startX);
            particle.style.setProperty('--start-y', startY);
            particle.style.setProperty('--mid-x', midX);
            particle.style.setProperty('--mid-y', midY);
            particle.style.setProperty('--end-x', endX);
            particle.style.setProperty('--end-y', endY);
            
            particle.style.animationDelay = `${Math.random() * 4}s`;
            
            const colors = ['#ffd700', '#ff6b00', '#ff0000', '#00ff00', '#0080ff'];
            particle.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`;
            
            container.appendChild(particle);
        }
    }

    /* 🎆 ВЗРЫВ ЧАСТИЦ ПО ВСЕМУ ЭКРАНУ */
    createExplosion(isCritical = false) {
        const explosionContainer = document.getElementById('click-explosion');
        if (!explosionContainer) return;

        explosionContainer.innerHTML = '';

        const particleCount = isCritical ? 40 : 25;
        const colors = isCritical 
            ? ['#ff0000', '#ff8000', '#ffff00', '#ffffff', '#ff00ff']
            : ['#ffd700', '#ffffff', '#00ffff', '#ff00ff', '#80ff00'];

        // Получаем позицию кнопки относительно окна
        const buttonRect = this.pawButton.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            
            // Случайное направление взрыва по всему экрану
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 300; // Увеличиваем дистанцию
            const explodeX = Math.cos(angle) * distance;
            const explodeY = Math.sin(angle) * distance;
            
            particle.style.setProperty('--explode-x', explodeX);
            particle.style.setProperty('--explode-y', explodeY);
            
            // Позиционируем частицы от центра кнопки
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = `radial-gradient(circle, ${color}, transparent)`;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            const size = 3 + Math.random() * 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Случайная задержка для более натурального взрыва
            particle.style.animationDelay = `${Math.random() * 0.4}s`;
            
            // Разные формы для разнообразия
            if (Math.random() > 0.7) {
                particle.style.borderRadius = '2px';
                particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
            
            explosionContainer.appendChild(particle);
        }

        // Очистка через 2 секунды
        setTimeout(() => {
            explosionContainer.innerHTML = '';
        }, 2000);
    }

    /* 🎮 УЛУЧШЕННАЯ ТАКТИЛЬНАЯ ОТДАЧА ДЛЯ МОБИЛЬНЫХ */
    setupHapticFeedback() {
        if (!this.pawButton) return;

        let pressStartTime = 0;
        let isPressing = false;

        // Начало нажатия
        this.pawButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressStartTime = Date.now();
            isPressing = true;
            
            // Легкая вибрация при начале нажатия
            this.triggerHapticFeedback('light');
            
            // Визуальная обратная связь
            this.pawButton.style.transition = 'transform 0.1s ease';
            this.pawButton.style.transform = 'scale(0.9)';
        });

        // Окончание нажатия
        this.pawButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            const pressDuration = Date.now() - pressStartTime;
            isPressing = false;
            
            // Разная вибрация в зависимости от длительности нажатия
            if (pressDuration > 500) {
                this.triggerHapticFeedback('long');
                this.createLongPressEffect();
            } else if (pressDuration > 200) {
                this.triggerHapticFeedback('medium');
            } else {
                this.triggerHapticFeedback('light');
            }
            
            // Возврат к нормальному размеру
            this.pawButton.style.transform = 'scale(1)';
        });

        // Отмена нажатия (например, при выходе за пределы кнопки)
        this.pawButton.addEventListener('touchcancel', (e) => {
            isPressing = false;
            this.pawButton.style.transform = 'scale(1)';
        });
    }

    triggerHapticFeedback(type) {
        if (navigator.vibrate) {
            const patterns = {
                'light': [50],
                'medium': [100],
                'heavy': [150],
                'long': [200, 50, 200]
            };
            navigator.vibrate(patterns[type] || [50]);
        }
    }

    /* 🔥 ЭФФЕКТ ДОЛГОГО НАЖАТИЯ */
    createLongPressEffect() {
        const button = document.getElementById('paw-button');
        button.classList.add('critical-mode');
        
        // Создаем дополнительный взрыв для долгого нажатия
        this.createExplosion(true);
        
        setTimeout(() => {
            button.classList.remove('critical-mode');
        }, 800);
    }

    /* 🔥 КРИТИЧЕСКИЕ ЭФФЕКТЫ */
    showCriticalEffect(points) {
        const button = document.getElementById('paw-button');
        button.classList.add('critical-mode');
        
        setTimeout(() => {
            button.classList.remove('critical-mode');
        }, 800);
    }

    // ОСТАЛЬНЫЕ МЕТОДЫ КЛАССА (сохранены из предыдущей версии)
    formatNumber(number) {
        if (number < 1000) return Math.floor(number).toString();
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) return Math.floor(number).toLocaleString();
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        if (tier > 0) {
            if (scaled < 10) return scaled.toFixed(2) + suffix;
            else if (scaled < 100) return scaled.toFixed(1) + suffix;
            else return Math.floor(scaled) + suffix;
        }
        
        return Math.floor(number).toLocaleString();
    }

    formatNumberRounded(number) {
        if (number < 1000) return Math.floor(number).toString();
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) return Math.floor(number).toLocaleString();
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        return Math.floor(scaled) + suffix;
    }

    formatNumberPrecise(number) {
        if (number < 1000) return Math.floor(number).toString();
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) return Math.floor(number).toLocaleString();
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        if (scaled >= 1000) return this.formatNumberPrecise(scaled) + suffix;
        
        if (scaled < 10) return scaled.toFixed(2) + suffix;
        else if (scaled < 100) return scaled.toFixed(1) + suffix;
        else return Math.floor(scaled) + suffix;
    }

    async initCloudStorage() {
        if (this.tg && this.tg.CloudStorage) {
            try {
                this.cloudSaveEnabled = true;
                console.log('Cloud storage enabled');
                await this.tg.CloudStorage.getItem('test');
                console.log('Cloud storage is available');
            } catch (error) {
                console.warn('Cloud storage not available:', error);
                this.cloudSaveEnabled = false;
            }
        } else {
            console.log('Cloud storage not supported in this environment');
            this.cloudSaveEnabled = false;
        }
    }

    async saveGameState(priority = 'MEDIUM_PRIORITY', reason = 'auto') {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now(),
                saveReason: reason,
                priority: priority
            };
            
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            this.addToSaveQueue(saveData, priority, reason);
            
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    addToSaveQueue(saveData, priority, reason) {
        const queueItem = {
            saveData,
            priority,
            reason,
            timestamp: Date.now(),
            priorityLevel: this.getPriorityLevel(priority)
        };
        
        const index = this.saveQueue.findIndex(item => 
            item.priorityLevel <= queueItem.priorityLevel
        );
        
        if (index === -1) this.saveQueue.push(queueItem);
        else this.saveQueue.splice(index, 0, queueItem);
        
        if (!this.isProcessingQueue) this.processSaveQueue();
        
        if (this.saveQueue.length > 15) this.saveQueue = this.saveQueue.slice(0, 10);
    }

    async processSaveQueue() {
        if (this.isProcessingQueue || this.saveQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.saveQueue.length > 0) {
            const queueItem = this.saveQueue.shift();
            const delay = this.calculateSaveDelay(queueItem);
            
            if (delay > 0) await this.delay(delay);
            
            if (Date.now() - queueItem.timestamp < 30000) {
                await this.executeCloudSave(queueItem);
            }
            
            await this.delay(50);
        }
        
        this.isProcessingQueue = false;
    }

    async executeCloudSave(queueItem) {
        if (!this.cloudSaveEnabled || this.saveInProgress) return;
        
        this.saveInProgress = true;
        try {
            const cloudSaveData = {
                ...queueItem.saveData,
                version: '1.2',
                deviceId: this.getDeviceId(),
                saveReason: queueItem.reason,
                priority: queueItem.priority,
                timestamp: Date.now()
            };
            
            const saveString = JSON.stringify(cloudSaveData);
            
            if (this.tg && this.tg.CloudStorage) {
                await this.tg.CloudStorage.setItem('darkPawsSave', saveString);
                
                this.lastCloudSave = Date.now();
                this.syncStats.cloudSaves++;
                this.syncStats.totalSaves++;
                this.syncStats.lastSyncTime = Date.now();
                
                console.log(`✅ Cloud: ${queueItem.reason} (${queueItem.priority})`);
                
                if (this.shouldShowSyncIndicator(queueItem)) {
                    this.showSyncIndicator(queueItem.reason, queueItem.priority);
                }
            }
        } catch (error) {
            console.error('❌ Cloud save failed:', error);
            this.syncStats.failedSaves++;
            
            if (this.isHighPriority(queueItem.priority)) this.retrySave(queueItem);
        } finally {
            this.saveInProgress = false;
        }
    }

    retrySave(queueItem, attempt = 1) {
        if (attempt > 2) return;
        
        setTimeout(async () => {
            console.log(`🔄 Retry ${queueItem.reason} (attempt ${attempt})`);
            await this.executeCloudSave(queueItem);
        }, 1000 * attempt);
    }

    getPriorityLevel(priority) {
        const levels = {
            'IMMEDIATE': 0,
            'HIGH_PRIORITY': 1,
            'MEDIUM_PRIORITY': 2,
            'LOW_PRIORITY': 3,
            'AUTO_SAVE': 4
        };
        return levels[priority] || 2;
    }

    calculateSaveDelay(queueItem) {
        const now = Date.now();
        const timeSinceLastSave = now - this.lastCloudSave;
        const minInterval = this.saveIntervals[queueItem.priority] || 2000;
        return Math.max(0, minInterval - timeSinceLastSave);
    }

    isHighPriority(priority) {
        return priority === 'IMMEDIATE' || priority === 'HIGH_PRIORITY';
    }

    shouldShowSyncIndicator(queueItem) {
        const showForReasons = ['levelUp', 'upgrade', 'achievement', 'cardChange', 'manualSync'];
        return showForReasons.includes(queueItem.reason);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    async showSyncNotification() {
        if (this.cloudSaveEnabled) console.log('🔗 Синхронизация с облаком активна');
        else console.log('⚠️ Синхронизация с облаком недоступна');
    }

    showSyncIndicator(reason, priority) {
        const existingIndicator = document.getElementById('cloud-sync-indicator');
        if (existingIndicator) existingIndicator.remove();
        
        const priorityClass = this.getPriorityClass(priority);
        const reasonText = this.getReasonText(reason);
        
        const indicator = document.createElement('div');
        indicator.id = 'cloud-sync-indicator';
        indicator.className = `sync-indicator ${priorityClass}`;
        indicator.innerHTML = `🔗 ${reasonText}`;
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(139, 92, 246, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    getPriorityClass(priority) {
        const classes = {
            'IMMEDIATE': 'sync-indicator-immediate',
            'HIGH_PRIORITY': 'sync-indicator-high',
            'MEDIUM_PRIORITY': 'sync-indicator-medium',
            'LOW_PRIORITY': 'sync-indicator-low'
        };
        return classes[priority] || 'sync-indicator-medium';
    }

    getReasonText(reason) {
        const texts = {
            'levelUp': 'Уровень повышен!',
            'upgrade': 'Улучшение куплено!',
            'achievement': 'Достижение получено!',
            'cardChange': 'Колода изменена!',
            'manualSync': 'Синхронизировано',
            'bigScore': 'Большой результат!'
        };
        return texts[reason] || 'Сохранено';
    }

    async loadGameState() {
        try {
            const cloudData = await this.loadFromCloud();
            
            if (cloudData && this.shouldUseCloudSave(cloudData)) {
                this.gameState = { ...this.gameState, ...cloudData.gameState };
                this.applyCardEffects();
                console.log('Using cloud save data');
            } else {
                const saved = localStorage.getItem('darkPawsClicker_save');
                if (saved) {
                    const saveData = JSON.parse(saved);
                    
                    if (!saveData.totalEarnedScore) saveData.totalEarnedScore = saveData.score || 0;
                    if (!saveData.activeDeck) saveData.activeDeck = [];
                    if (!saveData.cardEffects) saveData.cardEffects = {
                        clickPower: 1,
                        autoClick: 0,
                        criticalChance: 0,
                        criticalMultiplier: 1,
                        multiplier: 1,
                        chaos: false
                    };
                    
                    if (!this.user || saveData.userId === this.user.id) {
                        this.gameState = { ...this.gameState, ...saveData };
                        this.applyCardEffects();
                        console.log('Game state loaded from localStorage');
                    }
                }
            }
            
            console.log(`Уровень: ${this.gameState.level}, Очки: ${this.gameState.score}, Всего заработано: ${this.gameState.totalEarnedScore}`);
            
        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }

    async loadFromCloud() {
        if (!this.cloudSaveEnabled) return null;
        
        try {
            if (this.tg && this.tg.CloudStorage) {
                const saved = await this.tg.CloudStorage.getItem('darkPawsSave');
                if (saved) {
                    const saveData = JSON.parse(saved);
                    if (this.validateCloudSave(saveData)) {
                        console.log('Game loaded from cloud');
                        return saveData;
                    } else console.warn('Invalid cloud save data');
                }
            }
        } catch (error) {
            console.error('Cloud load error:', error);
        }
        
        return null;
    }

    validateCloudSave(saveData) {
        if (!saveData || !saveData.gameState) return false;
        const required = ['score', 'level', 'upgrades', 'stats', 'totalEarnedScore'];
        const hasRequired = required.every(field => field in saveData.gameState);
        const versionValid = saveData.version && parseFloat(saveData.version) >= 1.0;
        return hasRequired && versionValid;
    }

    shouldUseCloudSave(cloudData) {
        if (!cloudData || !cloudData.gameState) return false;
        const localSave = localStorage.getItem('darkPawsClicker_save');
        if (!localSave) return true;
        
        try {
            const localData = JSON.parse(localSave);
            const cloudTime = cloudData.lastSave || 0;
            const localTime = localData.lastSave || 0;
            return cloudTime > localTime;
        } catch (error) {
            return true;
        }
    }

    disableZoom() {
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) event.preventDefault();
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) event.preventDefault();
            lastTouchEnd = now;
        }, false);

        document.addEventListener('gesturestart', function(event) { event.preventDefault(); });
        document.addEventListener('gesturechange', function(event) { event.preventDefault(); });
        document.addEventListener('gestureend', function(event) { event.preventDefault(); });
    }

    applyTelegramTheme() {
        document.documentElement.style.setProperty('--tg-theme-bg-color', '#0a0a0a');
        document.documentElement.style.setProperty('--tg-theme-text-color', '#e0e0e0');
        document.documentElement.style.setProperty('--tg-theme-hint-color', '#888');
        document.documentElement.style.setProperty('--tg-theme-link-color', '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-color', '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', '#1a1a1a');
    }

    setupEventListeners() {
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            pawButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleClick(e);
            });
            
            pawButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.lastTouch = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            }, { passive: false });
            
            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.lastTouch) {
                    const touchEvent = {
                        clientX: this.lastTouch.clientX,
                        clientY: this.lastTouch.clientY
                    };
                    this.handleClick(touchEvent);
                    this.lastTouch = null;
                }
            }, { passive: false });
            
            pawButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });
        }

        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    const upgradeType = upgradeCard.dataset.upgrade;
                    await this.buyUpgrade(upgradeType);
                }
            });
        });

        const profileOpener = document.getElementById('profile-opener');
        if (profileOpener) {
            profileOpener.addEventListener('click', (e) => {
                e.preventDefault();
                this.openProfile();
            });
        }

        const closeProfile = document.getElementById('close-profile');
        if (closeProfile) {
            closeProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeProfile();
            });
        }

        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) this.closeProfile();
            });
        }

        const shareProfile = document.getElementById('share-profile');
        if (shareProfile) {
            shareProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareProfile();
            });
        }

        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) await this.saveGameState('LOW_PRIORITY', 'visibilityChange');
        });

        window.addEventListener('beforeunload', async () => {
            await this.saveGameState('HIGH_PRIORITY', 'pageUnload');
        });
        
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
        document.addEventListener('gestureend', (e) => e.preventDefault());
    }

    initTelegramAuth() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            console.log('Telegram user authenticated:', this.user);
            this.updateUserInfo();
        } else {
            console.log('No Telegram user data available, using mock data');
            this.user = {
                id: Math.floor(Math.random() * 10000),
                first_name: 'Игрок',
                username: 'player_' + Math.floor(Math.random() * 1000)
            };
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        if (this.user) {
            const avatar = document.getElementById('user-avatar');
            const profileAvatar = document.getElementById('profile-avatar');
            const username = document.getElementById('user-name');
            const levelText = document.querySelector('.level-text');
            
            if (avatar) {
                if (this.user.photo_url) {
                    avatar.style.backgroundImage = `url(${this.user.photo_url})`;
                    avatar.style.backgroundSize = 'cover';
                    avatar.style.backgroundPosition = 'center';
                    avatar.textContent = '';
                } else {
                    avatar.textContent = this.user.first_name ? this.user.first_name.charAt(0).toUpperCase() : 'P';
                    avatar.style.backgroundImage = 'none';
                }
            }
            
            if (profileAvatar) {
                if (this.user.photo_url) {
                    profileAvatar.style.backgroundImage = `url(${this.user.photo_url})`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    profileAvatar.textContent = '';
                } else {
                    profileAvatar.textContent = this.user.first_name ? this.user.first_name.charAt(0).toUpperCase() : 'P';
                    profileAvatar.style.backgroundImage = 'none';
                }
            }
            
            if (username) username.textContent = this.user.first_name || 'Player';
            if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;
        }
    }

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
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        
        const targetTab = document.getElementById(tabId);
        const targetTabButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetTabButton) {
            targetTab.classList.add('active');
            targetTabButton.classList.add('active');
            this.currentTab = tabId;
            this.updateTabContent(tabId);
        }
    }

    updateTabContent(tabId) {
        switch(tabId) {
            case 'levels-tab': this.updateLevelsTab(); break;
            case 'combo-tab': this.updateComboTab(); break;
        }
    }

    updateLevelsTab() {
        this.updateLevelsProgress();
        this.updateLevelCards();
    }

    updateLevelsProgress() {
        const levelCircles = document.querySelectorAll('.level-circle');
        const levelLines = document.querySelectorAll('.level-line');
        
        levelLines.forEach(line => {
            if (!line.querySelector('.level-line-fill')) {
                const fill = document.createElement('div');
                fill.className = 'level-line-fill';
                line.appendChild(fill);
            }
        });
        
        levelCircles.forEach(circle => {
            circle.classList.remove('active', 'completed', 'current');
            const originalLevel = circle.dataset.level;
            if (originalLevel) circle.textContent = originalLevel;
        });
        
        const milestoneLevels = [1, 25, 50, 75, 100];
        const currentLevel = this.gameState.level;
        
        levelCircles.forEach((circle, index) => {
            const circleLevel = parseInt(circle.dataset.level);
            const isLastCircle = index === levelCircles.length - 1;
            
            if (currentLevel >= circleLevel) {
                circle.classList.add('completed');
                if (currentLevel === circleLevel) {
                    circle.textContent = currentLevel;
                    circle.classList.add('active');
                } else circle.textContent = circleLevel;
                
                if (index > 0) {
                    const prevLine = levelLines[index - 1];
                    const fill = prevLine.querySelector('.level-line-fill');
                    if (fill) fill.style.width = '100%';
                    prevLine.classList.add('completed');
                }
            } else {
                if (index > 0) {
                    const prevCircleLevel = milestoneLevels[index - 1];
                    if (currentLevel > prevCircleLevel && currentLevel < circleLevel) {
                        circle.textContent = currentLevel;
                        circle.classList.add('active');
                        
                        const progressInRange = currentLevel - prevCircleLevel;
                        const totalRange = circleLevel - prevCircleLevel;
                        const percentage = (progressInRange / totalRange) * 100;
                        
                        const prevLine = levelLines[index - 1];
                        const fill = prevLine.querySelector('.level-line-fill');
                        if (fill) fill.style.width = `${percentage}%`;
                        prevLine.classList.add('partial');
                    } else circle.textContent = circleLevel;
                } else circle.textContent = circleLevel;
            }
        });
        
        if (currentLevel >= 100) {
            levelCircles.forEach(circle => {
                circle.classList.add('completed');
                if (circle.dataset.level === "100") {
                    circle.textContent = currentLevel;
                    circle.classList.add('active');
                } else circle.textContent = circle.dataset.level;
            });
            levelLines.forEach(line => {
                const fill = line.querySelector('.level-line-fill');
                if (fill) fill.style.width = '100%';
                line.classList.add('completed');
            });
        }
    }

    updateLevelCards() {
        const levelCards = document.querySelectorAll('.level-card');
        const milestoneLevels = [1, 25, 50, 75, 100];
        
        levelCards.forEach((card, index) => {
            const milestoneLevel = milestoneLevels[index];
            const status = card.querySelector('.level-status');
            
            card.classList.remove('active', 'locked', 'completed');
            
            if (milestoneLevel < this.gameState.level) {
                card.classList.add('completed');
                if (status) {
                    status.textContent = 'Пройден';
                    status.classList.add('completed');
                }
            } else if (milestoneLevel === this.gameState.level) {
                card.classList.add('active');
                if (status) {
                    if (milestoneLevel < 100) {
                        const nextMilestone = milestoneLevels[index + 1];
                        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
                        const nextLevelScore = this.getRequiredScoreForLevel(nextMilestone);
                        const progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
                        const totalNeeded = nextLevelScore - currentLevelScore;
                        
                        if (totalNeeded > 0) {
                            const percentage = Math.min(100, (progress / totalNeeded) * 100);
                            status.textContent = `${Math.floor(percentage)}%`;
                        }
                    } else status.textContent = 'Макс уровень';
                    status.classList.remove('completed');
                }
            } else {
                card.classList.add('locked');
                const requiredScore = this.getRequiredScoreForLevel(milestoneLevel);
                if (status) {
                    status.textContent = `${this.formatNumber(requiredScore)} очков`;
                    status.classList.remove('completed');
                }
            }
            
            const levelNumber = card.querySelector('.level-number');
            if (levelNumber) levelNumber.textContent = `Уровень ${milestoneLevel}`;
        });
    }

    updateComboTab() {
        console.log('Updating combo tab...');
        this.updateDeckStats();
        this.updateComboCards();
    }

    updateDeckStats() {
        const deckPower = document.querySelector('.power-value');
        const deckStats = document.querySelectorAll('.stat-value');
        const deckSize = document.querySelector('.deck-size span');
        
        if (deckPower) deckPower.textContent = this.formatNumberRounded(this.calculateDeckPower());
        if (deckSize) deckSize.textContent = `${this.gameState.activeDeck.length}/4`;
        
        const clickBonus = ((this.gameState.cardEffects.clickPower - 1) * 100).toFixed(0);
        const autoBonus = this.gameState.cardEffects.autoClick;
        const critBonus = (this.gameState.cardEffects.criticalChance * 100).toFixed(0);
        
        if (deckStats.length >= 3) {
            deckStats[0].textContent = `${clickBonus}%`;
            deckStats[1].textContent = `${this.formatNumberRounded(autoBonus)}`;
            deckStats[2].textContent = `${critBonus}%`;
        }
    }

    calculateDeckPower() {
        let power = this.gameState.activeDeck.length * 10;
        
        this.gameState.activeDeck.forEach(cardId => {
            const card = this.getCardData(cardId);
            if (card) {
                switch(card.rarity) {
                    case 'common': power += 5; break;
                    case 'rare': power += 15; break;
                    case 'epic': power += 30; break;
                    case 'legendary': power += 50; break;
                    case 'mythic': power += 100; break;
                }
            }
        });
        
        return power;
    }

    updateComboCards() {
        const comboCards = this.getAllCards();
        const cardsGrid = document.getElementById('cards-grid-container');
        
        if (!cardsGrid) {
            console.error('cards-grid-container not found!');
            return;
        }

        console.log('Found cards grid container, generating cards...');

        let cardsHTML = '';
        comboCards.forEach(card => {
            const lockedClass = card.unlocked ? '' : 'locked';
            const activeClass = this.gameState.activeDeck.includes(card.id) ? 'active' : '';
            
            cardsHTML += `
                <div class="combo-card ${lockedClass} ${activeClass}" data-card-id="${card.id}">
                    <div class="card-frame">
                        <div class="card-rarity ${card.rarity}">
                            ${this.getRarityText(card.rarity)}
                        </div>
                        <div class="card-icon">${card.icon}</div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-stats">${card.description}</div>
                        ${activeClass ? '<div class="card-active-indicator">✓</div>' : ''}
                    </div>
                </div>
            `;
        });

        cardsGrid.innerHTML = cardsHTML;
        console.log(`Generated ${comboCards.length} cards in the grid`);
        this.setupComboCardListeners();
    }

    setupComboCardListeners() {
        const cards = document.querySelectorAll('.combo-card');
        console.log(`Setting up listeners for ${cards.length} cards`);
        
        cards.forEach(card => {
            card.addEventListener('click', async () => {
                if (card.classList.contains('locked')) this.showCardLockedMessage(card);
                else await this.toggleCardInDeck(card);
            });
        });
    }

    async toggleCardInDeck(card) {
        const cardId = parseInt(card.dataset.cardId);
        const cardIndex = this.gameState.activeDeck.indexOf(cardId);
        const cardData = this.getCardData(cardId);
        
        if (cardIndex === -1) {
            if (this.gameState.activeDeck.length < 4) {
                this.gameState.activeDeck.push(cardId);
                card.classList.add('active');
                this.applyCardEffects();
                this.showCardNotification('Карта добавлена в колоду', cardData);
            } else this.showCardNotification('Колода полна! Максимум 4 карты', cardData);
        } else {
            this.gameState.activeDeck.splice(cardIndex, 1);
            card.classList.remove('active');
            this.applyCardEffects();
            this.showCardNotification('Карта убрана из колоды', cardData);
        }
        
        this.updateDeckStats();
        await this.saveGameState('HIGH_PRIORITY', 'cardChange');
    }

    getCardData(cardId) {
        const allCards = this.getAllCards();
        return allCards.find(card => card.id === cardId);
    }

    getAllCards() {
        return [
            {
                id: 1,
                name: 'Лапа новичка',
                rarity: 'common',
                icon: '🐾',
                stats: { clickPower: 1.05 },
                description: 'Увеличивает силу клика на 5%',
                unlocked: this.gameState.level >= 1
            },
            {
                id: 2,
                name: 'Энергия',
                rarity: 'rare',
                icon: '⚡',
                stats: { autoClick: 3 },
                description: 'Добавляет 3 авто-клика в секунду',
                unlocked: this.gameState.level >= 2
            },
            {
                id: 3,
                name: 'Точность',
                rarity: 'epic',
                icon: '🎯',
                stats: { criticalChance: 0.15 },
                description: 'Увеличивает шанс критического удара на 15%',
                unlocked: this.gameState.level >= 3
            },
            {
                id: 4,
                name: 'Алмазная лапа',
                rarity: 'legendary',
                icon: '💎',
                stats: { multiplier: 2 },
                description: 'Удваивает все бонусы от карт в колоде',
                unlocked: this.gameState.level >= 5
            },
            {
                id: 5,
                name: 'Удача',
                rarity: 'common',
                icon: '🍀',
                stats: { criticalChance: 0.10 },
                description: 'Увеличивает шанс критического удара на 10%',
                unlocked: this.gameState.level >= 1
            },
            {
                id: 6,
                name: 'Скорость',
                rarity: 'rare',
                icon: '🚀',
                stats: { autoClick: 5 },
                description: 'Добавляет 5 авто-клика в секунду',
                unlocked: this.gameState.level >= 2
            },
            {
                id: 7,
                name: 'Мощь',
                rarity: 'epic',
                icon: '💪',
                stats: { clickPower: 1.25 },
                description: 'Увеличивает силу клика на 25%',
                unlocked: this.gameState.level >= 4
            },
            {
                id: 8,
                name: 'Феникс',
                rarity: 'legendary',
                icon: '🔥',
                stats: { criticalMultiplier: 3 },
                description: 'Утраивает множитель критического удара',
                unlocked: this.gameState.level >= 6
            },
            {
                id: 9,
                name: 'Бесконечность',
                rarity: 'mythic',
                icon: '♾️',
                stats: { clickPower: 1.5, autoClick: 10, criticalChance: 0.25 },
                description: 'Мощная карта, увеличивающая все характеристики значительно',
                unlocked: this.gameState.level >= 8
            },
            {
                id: 10,
                name: 'Хаос',
                rarity: 'mythic',
                icon: '🌪️',
                stats: { chaos: true, multiplier: 1.5 },
                description: 'Случайным образом усиливает все показатели каждый клик',
                unlocked: this.gameState.level >= 10
            }
        ];
    }

    applyCardEffects() {
        this.gameState.cardEffects = {
            clickPower: 1,
            autoClick: 0,
            criticalChance: 0,
            criticalMultiplier: 1,
            multiplier: 1,
            chaos: false
        };
        
        let hasDiamondPaw = false;
        
        this.gameState.activeDeck.forEach(cardId => {
            const card = this.getCardData(cardId);
            if (!card) return;
            
            if (card.id === 4) hasDiamondPaw = true;
            
            Object.keys(card.stats).forEach(stat => {
                if (typeof card.stats[stat] === 'number') {
                    if (stat === 'clickPower' || stat === 'multiplier') this.gameState.cardEffects[stat] *= card.stats[stat];
                    else this.gameState.cardEffects[stat] += card.stats[stat];
                } else this.gameState.cardEffects[stat] = card.stats[stat];
            });
        });
        
        if (hasDiamondPaw) {
            this.gameState.cardEffects.clickPower *= this.gameState.cardEffects.multiplier;
            this.gameState.cardEffects.autoClick *= this.gameState.cardEffects.multiplier;
            this.gameState.cardEffects.criticalChance *= this.gameState.cardEffects.multiplier;
        }
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

    showCardLockedMessage(card) {
        const cardId = card.dataset.cardId;
        console.log(`Карта ${cardId} заблокирована`);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🔒 Карта заблокирована',
                message: 'Эта карта будет доступна на более высоких уровнях',
                buttons: [{ type: 'ok' }]
            });
        } else alert('Эта карта будет доступна на более высоких уровнях');
    }

    showCardNotification(message, cardData) {
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: `🎴 ${cardData.name}`,
                message: `${message}\n\n${cardData.description}`,
                buttons: [{ type: 'ok' }]
            });
        } else alert(`🎴 ${cardData.name}\n${message}\n\n${cardData.description}`);
    }

    openProfile() {
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (this.isTelegram) {
                this.tg.BackButton.show();
                this.tg.BackButton.onClick(() => this.closeProfile());
            }
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            if (this.isTelegram) this.tg.BackButton.hide();
        }
    }

    updateProfileModal() {
        const profileName = document.getElementById('profile-name');
        const profileLevel = document.getElementById('profile-level');
        const profileId = document.getElementById('profile-id');
        const profileRank = document.getElementById('profile-rank');

        if (profileName) profileName.textContent = this.user ? this.user.first_name : 'Player';
        if (profileLevel) profileLevel.textContent = this.gameState.level;
        if (profileId) profileId.textContent = this.user ? this.user.id : '0000';
        if (profileRank) profileRank.textContent = this.getPlayerRank();

        this.updateProfileStats();
        this.updateProfileAchievements();
        this.updateProfileUpgrades();
    }

    updateProfileStats() {
        const totalClicks = document.getElementById('profile-total-clicks');
        const playTime = document.getElementById('profile-play-time');
        const totalScore = document.getElementById('profile-total-score');
        const joinDate = document.getElementById('profile-join-date');

        if (totalClicks) totalClicks.textContent = this.formatNumber(this.gameState.stats.totalClicks);
        if (playTime) {
            const hours = Math.floor(this.gameState.stats.playTime / 3600000);
            playTime.textContent = `${hours}ч`;
        }
        if (totalScore) totalScore.textContent = this.formatNumber(this.gameState.totalEarnedScore);
        if (joinDate) {
            const joinDateObj = new Date(this.gameState.stats.joinDate);
            const now = new Date();
            const diffTime = Math.abs(now - joinDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) joinDate.textContent = 'Сегодня';
            else if (diffDays === 2) joinDate.textContent = 'Вчера';
            else if (diffDays <= 7) joinDate.textContent = `${diffDays} дней назад`;
            else joinDate.textContent = joinDateObj.toLocaleDateString('ru-RU');
        }
    }

    updateProfileAchievements() {
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

        if (clickPower) clickPower.textContent = this.gameState.upgrades.clickPower;
        if (autoClick) autoClick.textContent = this.gameState.upgrades.autoClick;
        if (critical) critical.textContent = this.gameState.upgrades.criticalChance;
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
        const shareText = `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${this.formatNumber(this.gameState.score)}\nПрисоединяйся!`;
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: 'Поделиться профилем',
                message: shareText,
                buttons: [
                    { type: 'default', text: 'Поделиться' },
                    { type: 'cancel', text: 'Отмена' }
                ]
            });
        } else if (navigator.share) {
            navigator.share({
                title: 'Dark Paws Clicker',
                text: shareText,
                url: window.location.href
            });
        } else alert(shareText);
    }

    /* 🎮 ОБНОВЛЕННЫЙ МЕТОД КЛИКА С ЭФФЕКТАМИ */
    async handleClick(event) {
        this.gameState.stats.totalClicks++;
        
        if (this.gameState.cardEffects.chaos) this.applyChaosEffect();
        
        let points = this.gameState.upgrades.clickPower;
        let isCritical = false;
        
        points *= this.gameState.cardEffects.clickPower;
        
        const baseCritChance = this.gameState.upgrades.criticalChance * 0.03;
        const totalCritChance = baseCritChance + this.gameState.cardEffects.criticalChance;
        
        if (Math.random() < totalCritChance) {
            const critMultiplier = this.gameState.cardEffects.criticalMultiplier;
            points *= (critMultiplier > 1 ? critMultiplier : 3);
            isCritical = true;
            this.gameState.stats.criticalHits++;
        }
        
        await this.addScore(points, isCritical);
        this.createParticles(event);
        this.createExplosion(isCritical); // 🎆 Взрыв частиц по всему экрану
        
        if (isCritical) this.showCriticalEffect(points);
        
        if (this.gameState.stats.totalClicks % 3 === 0) {
            await this.saveGameState('MEDIUM_PRIORITY', 'clickBatch');
        }
        
        this.checkAchievements();
    }

    applyChaosEffect() {
        const randomEffect = Math.random();
        if (randomEffect < 0.3) {
            this.gameState.cardEffects.clickPower *= 1.5;
            setTimeout(() => this.gameState.cardEffects.clickPower /= 1.5, 3000);
        }
    }

    async addScore(points, isCritical = false) {
        this.gameState.score += points;
        this.gameState.totalEarnedScore += points;
        
        let leveledUp = false;
        const maxLevel = this.getMaxLevel();
        
        while (this.gameState.level < maxLevel) {
            const requiredScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
            if (this.gameState.totalEarnedScore >= requiredScore) {
                this.gameState.level++;
                leveledUp = true;
            } else break;
        }
        
        this.updateUI();
        
        if (leveledUp) await this.showLevelUp();
        if (isCritical) this.showCriticalEffect(points);
        
        let savePriority = 'MEDIUM_PRIORITY';
        let reason = 'score';
        
        if (leveledUp) {
            savePriority = 'IMMEDIATE';
            reason = 'levelUp';
        } else if (points > 100) {
            savePriority = 'HIGH_PRIORITY';
            reason = 'bigScore';
        } else if (points > 50) {
            savePriority = 'MEDIUM_PRIORITY';
            reason = 'score';
        }
        
        if (leveledUp || points > 20) await this.saveGameState(savePriority, reason);
    }

    async showLevelUp() {
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
        if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;
        
        console.log(`🎉 Уровень повышен до ${this.gameState.level}!`);
    }

    showCriticalEffect(points) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const critText = document.createElement('div');
        critText.className = 'critical-hit';
        critText.textContent = `CRIT! +${this.formatNumberRounded(points)}`;
        
        container.appendChild(critText);
        
        setTimeout(() => {
            if (critText.parentNode === container) container.removeChild(critText);
        }, 1500);
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
        console.log(`🎉 Достижение разблокировано: ${achievementName}`);
        this.saveGameState('HIGH_PRIORITY', 'achievement');
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎉 Новое достижение!',
                message: `Вы получили достижение: "${achievementName}"`,
                buttons: [{ type: 'ok' }]
            });
        } else alert(`🎉 Новое достижение: ${achievementName}`);
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        let clientX, clientY;
        
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const particleCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = (2 + Math.random() * 4) + 'px';
            particle.style.height = (2 + Math.random() * 4) + 'px';
            particle.style.opacity = (0.3 + Math.random() * 0.7);
            
            container.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode === container) container.removeChild(particle);
            }, 1000);
        }
    }

    getMaxLevel() {
        return 100;
    }

    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        
        if (level <= 10) return Math.pow(level - 1, 2) * 100;
        else if (level <= 25) return this.getRequiredScoreForLevel(10) + (level - 10) * 5000;
        else if (level <= 50) return this.getRequiredScoreForLevel(25) + (level - 25) * 10000;
        else if (level <= 75) return this.getRequiredScoreForLevel(50) + (level - 50) * 25000;
        else return this.getRequiredScoreForLevel(75) + (level - 75) * 50000;
    }

    async buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 50 * Math.pow(2, this.gameState.upgrades.autoClick),
            'critical-chance': 25 * Math.pow(2, this.gameState.upgrades.criticalChance - 1)
        };

        const cost = costs[upgradeType];
        
        if (this.gameState.score >= cost) {
            this.gameState.score -= cost;
            
            switch(upgradeType) {
                case 'click-power': this.gameState.upgrades.clickPower++; break;
                case 'auto-click': this.gameState.upgrades.autoClick++; break;
                case 'critical-chance': this.gameState.upgrades.criticalChance++; break;
            }
            
            this.updateUI();
            await this.saveGameState('HIGH_PRIORITY', 'upgrade');
            this.showUpgradeNotification(upgradeType);
        } else this.showInsufficientFundsNotification(cost);
    }

    showUpgradeNotification(upgradeType) {
        const upgradeNames = {
            'click-power': 'Сила лапы',
            'auto-click': 'Авто-клик',
            'critical-chance': 'Точность'
        };
        
        console.log(`🔼 Улучшение куплено: ${upgradeNames[upgradeType]}`);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '✅ Улучшение куплено!',
                message: `Вы улучшили: ${upgradeNames[upgradeType]}`,
                buttons: [{ type: 'ok' }]
            });
        } else alert(`✅ Улучшение куплено: ${upgradeNames[upgradeType]}`);
    }

    showInsufficientFundsNotification(cost) {
        const formattedCost = this.formatNumberPrecise(cost);
        console.log(`❌ Недостаточно очков. Нужно: ${formattedCost}`);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '❌ Недостаточно очков',
                message: `Для покупки нужно: ${formattedCost} очков`,
                buttons: [{ type: 'ok' }]
            });
        } else alert(`❌ Недостаточно очков. Нужно: ${formattedCost}`);
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0 || this.gameState.cardEffects.autoClick > 0) {
                const baseAutoPoints = this.gameState.upgrades.autoClick;
                const cardAutoPoints = this.gameState.cardEffects.autoClick;
                const totalPoints = baseAutoPoints + cardAutoPoints;
                
                if (totalPoints > 0) {
                    let points = totalPoints * this.gameState.cardEffects.clickPower;
                    this.addScore(points);
                }
            }
        }, 1000);
    }

    startPlayTimeCounter() {
        setInterval(async () => {
            this.gameState.stats.playTime += 1000;
            
            if (this.gameState.stats.playTime % 15000 === 0) {
                await this.saveGameState('LOW_PRIORITY', 'autoTimerFast');
            }
            
            if (this.gameState.stats.playTime % 30000 === 0) {
                await this.saveGameState('AUTO_SAVE', 'autoTimerFull');
            }
        }, 1000);
    }

    updateUI() {
        const scoreElement = document.getElementById('score');
        const levelBadge = document.querySelector('.level-badge');
        const levelText = document.querySelector('.level-text');
        
        if (scoreElement) scoreElement.textContent = this.formatNumber(this.gameState.score);
        if (levelBadge) levelBadge.textContent = this.gameState.level;
        if (levelText) levelText.textContent = `Уровень ${this.gameState.level}`;
        
        this.updateHeaderProgressBar();
        this.updateUpgradeButtons();
        this.updateUserInfo();
        this.updateEarnedScoreDisplay();
        
        if (this.currentTab === 'levels-tab') this.updateLevelsTab();
    }

    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        let progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        let percentage = 0;
        if (totalNeeded > 0) percentage = (progress / totalNeeded) * 100;
        else percentage = 100;
        
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        if (progressFillHeader) progressFillHeader.style.width = `${percentage}%`;
    }

    updateEarnedScoreDisplay() {
        let earnedScoreElement = document.getElementById('earned-score-display');
        
        if (!earnedScoreElement) {
            earnedScoreElement = document.createElement('div');
            earnedScoreElement.id = 'earned-score-display';
            earnedScoreElement.className = 'earned-score-display';
            
            const headerProgress = document.querySelector('.header-progress');
            if (headerProgress) headerProgress.appendChild(earnedScoreElement);
        }
        
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        if (totalNeeded > 0) {
            earnedScoreElement.textContent = `${this.formatNumber(progress)} / ${this.formatNumber(totalNeeded)} очков до уровня ${this.gameState.level + 1}`;
        } else earnedScoreElement.textContent = 'Максимальный уровень достигнут!';
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
                    button.textContent = this.formatNumberPrecise(cost);
                    break;
                    
                case 'auto-click':
                    level = this.gameState.upgrades.autoClick;
                    cost = level === 0 ? 50 : 50 * Math.pow(2, level);
                    levelSpan.textContent = level;
                    button.textContent = this.formatNumberPrecise(cost);
                    break;
                    
                case 'critical-chance':
                    level = this.gameState.upgrades.criticalChance;
                    cost = 25 * Math.pow(2, level - 1);
                    levelSpan.textContent = level;
                    button.textContent = this.formatNumberPrecise(cost);
                    break;
            }
            
            if (this.gameState.score >= cost) {
                button.disabled = false;
                button.classList.add('affordable');
            } else {
                button.disabled = true;
                button.classList.remove('affordable');
            }
        });
    }

    async forceSync() {
        console.log('🔄 Принудительная синхронизация...');
        await this.saveGameState('IMMEDIATE', 'manualSync');
    }

    getSyncStats() {
        const successRate = this.syncStats.totalSaves > 0 
            ? (this.syncStats.cloudSaves / this.syncStats.totalSaves * 100).toFixed(1)
            : 0;
            
        return {
            ...this.syncStats,
            successRate: `${successRate}%`,
            queueLength: this.saveQueue.length,
            cloudEnabled: this.cloudSaveEnabled,
            lastSync: this.syncStats.lastSyncTime ? 
                new Date(this.syncStats.lastSyncTime).toLocaleTimeString() : 'Никогда'
        };
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Обработка видимости страницы
document.addEventListener('visibilitychange', async () => {
    if (document.hidden && window.clickerGame) {
        await window.clickerGame.saveGameState('LOW_PRIORITY', 'visibilityChange');
    }
});

// Обработка закрытия страницы
window.addEventListener('beforeunload', async () => {
    if (window.clickerGame) {
        await window.clickerGame.saveGameState('HIGH_PRIORITY', 'pageUnload');
    }
});
