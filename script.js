class DarkPawsClicker {
    constructor() {
        this.tg = null;
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
            dailyQuests: {
                lastRefresh: Date.now(),
                completedToday: 0,
                currentQuests: [],
                streak: 0,
                lastClaim: null,
                totalCompleted: 0
            },
            coopEvents: {
                activeEvents: [],
                participation: {},
                rewardsClaimed: [],
                totalParticipated: 0
            },
            lastSave: Date.now(),
            userId: null
        };
        
        this.particles = [];
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        this.lastTouch = null;
        this.isTelegram = false;
        this.isInitialized = false;
        
        this.setupErrorHandling();
        this.waitForTelegramInit();
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ TELEGRAM ====================

    async waitForTelegramInit() {
        console.log('Waiting for Telegram Web App initialization...');
        
        if (window.Telegram && window.Telegram.WebApp) {
            setTimeout(() => this.initTelegram(), 100);
        } else {
            let attempts = 0;
            const maxAttempts = 10;
            
            const initInterval = setInterval(() => {
                attempts++;
                if (window.Telegram && window.Telegram.WebApp) {
                    clearInterval(initInterval);
                    this.initTelegram();
                } else if (attempts >= maxAttempts) {
                    clearInterval(initInterval);
                    console.log('Telegram API not available, running in standalone mode');
                    this.initStandalone();
                }
            }, 200);
        }
    }

    initTelegram() {
        this.tg = window.Telegram.WebApp;
        this.isTelegram = true;
        
        console.log('Telegram Web App initialized:', {
            platform: this.tg.platform,
            version: this.tg.version,
            initData: this.tg.initData ? 'available' : 'unavailable'
        });

        // Инициализируем приложение
        this.tg.ready();
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        // Применяем тему Telegram
        this.applyTelegramTheme();
        
        // Настраиваем кнопку назад
        this.setupBackButton();
        
        // Инициализируем остальные системы
        this.initGame();
    }

    initStandalone() {
        console.log('Initializing in standalone mode');
        this.isTelegram = false;
        this.initGame();
    }

    initGame() {
        this.setupEventListeners();
        this.initUserAuth();
        this.loadGameState();
        
        // Инициализация новых систем
        this.initDailyQuests();
        this.initCoopEvents();
        this.startQuestRefreshTimer();
        
        this.updateUI();
        this.startAutoClicker();
        this.setupTabs();
        this.startPlayTimeCounter();
        this.updateComboTab();
        this.updateQuestsStats();
        
        this.isInitialized = true;
        
        console.log('Dark Paws Clicker initialized successfully');
    }

    setupBackButton() {
        if (!this.isTelegram) return;
        
        this.tg.BackButton.onClick(() => {
            this.handleBackButton();
        });
    }

    handleBackButton() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal && profileModal.classList.contains('active')) {
            this.closeProfile();
            return;
        }
        
        this.tg.BackButton.hide();
    }

    applyTelegramTheme() {
        if (!this.isTelegram) return;
        
        document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#0a0a0a');
        document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#e0e0e0');
        document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#888');
        document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', this.tg.themeParams.secondary_bg_color || '#1a1a1a');
    }

    // ==================== АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ ====================

    initUserAuth() {
        if (this.isTelegram && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            const tgUser = this.tg.initDataUnsafe.user;
            this.user = {
                id: tgUser.id,
                first_name: tgUser.first_name || 'Игрок',
                username: tgUser.username,
                language_code: tgUser.language_code,
                photo_url: tgUser.photo_url,
                is_premium: tgUser.is_premium || false
            };
            
            console.log('Telegram user authenticated:', this.user);
            
            if (!this.gameState.userId) {
                this.gameState.userId = `tg_${tgUser.id}`;
            }
        } else {
            console.log('No Telegram user data available, using local storage');
            this.user = {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Игрок',
                username: 'player_' + Math.floor(Math.random() * 1000)
            };
            
            if (!this.gameState.userId) {
                this.gameState.userId = `local_${this.user.id}`;
            }
        }
        
        this.updateUserInfo();
    }

    // ==================== ТАКТИЛЬНЫЕ ОТКЛИКИ ====================

    hapticFeedback(type = 'light') {
        if (!this.isTelegram || !this.tg.HapticFeedback) return;
        
        try {
            switch(type) {
                case 'light':
                    this.tg.HapticFeedback.impactOccurred('light');
                    break;
                case 'medium':
                    this.tg.HapticFeedback.impactOccurred('medium');
                    break;
                case 'heavy':
                    this.tg.HapticFeedback.impactOccurred('heavy');
                    break;
                case 'success':
                    this.tg.HapticFeedback.notificationOccurred('success');
                    break;
                case 'error':
                    this.tg.HapticFeedback.notificationOccurred('error');
                    break;
                case 'warning':
                    this.tg.HapticFeedback.notificationOccurred('warning');
                    break;
            }
        } catch (error) {
            console.log('Haptic feedback error:', error);
        }
    }

    // ==================== ОБЛАЧНОЕ ХРАНИЛИЩЕ ====================

    async saveToCloudStorage() {
        if (!this.isTelegram || !this.tg.CloudStorage) {
            return false;
        }
        
        try {
            const saveData = JSON.stringify({
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now(),
                version: '1.0'
            });
            
            this.tg.CloudStorage.setItem('darkPawsSave', saveData);
            console.log('Game saved to Telegram Cloud Storage');
            return true;
        } catch (error) {
            console.error('Cloud storage save error:', error);
            return false;
        }
    }

    async loadFromCloudStorage() {
        if (!this.isTelegram || !this.tg.CloudStorage) {
            return null;
        }
        
        try {
            const savedData = await this.tg.CloudStorage.getItem('darkPawsSave');
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Cloud storage load error:', error);
        }
        
        return null;
    }

    async saveGameState() {
        this.gameState.lastSave = Date.now();
        
        try {
            const cloudSaved = await this.saveToCloudStorage();
            
            const saveData = {
                ...this.gameState,
                userId: this.user?.id
            };
            
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            
            if (cloudSaved) {
                console.log('Game state saved to cloud and local storage');
            } else {
                console.log('Game state saved to local storage only');
            }
        } catch (error) {
            console.error('Save error:', error);
            
            try {
                const saveData = {
                    ...this.gameState,
                    userId: this.user?.id
                };
                localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            } catch (localError) {
                console.error('Local storage save error:', localError);
            }
        }
    }

    async loadGameState() {
        try {
            const cloudData = await this.loadFromCloudStorage();
            
            if (cloudData) {
                console.log('Game state loaded from cloud storage');
                this.migrateGameState(cloudData);
                return;
            }
            
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                console.log('Game state loaded from local storage');
                this.migrateGameState(saveData);
            }
        } catch (error) {
            console.error('Load game state error:', error);
        }
    }

    migrateGameState(saveData) {
        const defaultGameState = {
            score: 0,
            totalEarnedScore: 0,
            level: 1,
            upgrades: { clickPower: 1, autoClick: 0, criticalChance: 1 },
            stats: { totalClicks: 0, totalScore: 0, playTime: 0, joinDate: new Date().toISOString(), criticalHits: 0 },
            friends: [],
            comboCards: [],
            activeDeck: [],
            cardEffects: { clickPower: 1, autoClick: 0, criticalChance: 0, criticalMultiplier: 1, multiplier: 1, chaos: false },
            achievements: { firstSteps: false, hardWorker: false, clickMaster: false, clickLegend: false },
            dailyQuests: { lastRefresh: Date.now(), completedToday: 0, currentQuests: [], streak: 0, lastClaim: null, totalCompleted: 0 },
            coopEvents: { activeEvents: [], participation: {}, rewardsClaimed: [], totalParticipated: 0 },
            lastSave: Date.now()
        };
        
        this.gameState = { ...defaultGameState, ...saveData };
        
        if (!this.gameState.totalEarnedScore) {
            this.gameState.totalEarnedScore = this.gameState.score || 0;
        }
        
        if (!this.gameState.activeDeck) {
            this.gameState.activeDeck = [];
        }
        
        if (!this.gameState.cardEffects) {
            this.gameState.cardEffects = defaultGameState.cardEffects;
        }
        
        if (!this.gameState.dailyQuests) {
            this.gameState.dailyQuests = defaultGameState.dailyQuests;
        }
        
        if (!this.gameState.coopEvents) {
            this.gameState.coopEvents = defaultGameState.coopEvents;
        }
        
        this.applyCardEffects();
    }

    // ==================== ОСНОВНОЙ ГЕЙМПЛЕЙ ====================

    setupEventListeners() {
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            pawButton.addEventListener('click', (e) => {
                this.handleClick(e);
            });
            
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
                this.lastTouch = {
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY
                };
            }, { passive: false });
            
            pawButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
                
                if (this.lastTouch) {
                    const touchEvent = {
                        clientX: this.lastTouch.clientX,
                        clientY: this.lastTouch.clientY
                    };
                    this.handleClick(touchEvent);
                    this.lastTouch = null;
                }
            }, { passive: false });
        }

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

        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.inviteFriends();
            });
        }

        const refreshBtn = document.getElementById('refresh-friends');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadFriendsList();
                this.loadLeaderboard();
            });
        }

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
                if (e.target === profileModal) {
                    this.closeProfile();
                }
            });
        }

        const shareProfile = document.getElementById('share-profile');
        if (shareProfile) {
            shareProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareProfile();
            });
        }

        const questsTab = document.querySelector('[data-tab="quests-tab"]');
        if (questsTab) {
            questsTab.addEventListener('click', () => {
                this.updateQuestsUI();
                this.updateEventsUI();
                this.updateQuestsStats();
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }

    handleClick(event) {
        this.hapticFeedback('light');
        
        this.gameState.stats.totalClicks++;
        
        if (this.gameState.cardEffects.chaos) {
            this.applyChaosEffect();
        }
        
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
            
            this.hapticFeedback('heavy');
        }
        
        this.addScore(points, isCritical);
        this.createParticles(event);
        
        this.updateQuestProgress('clicks');
        this.contributeToEvent('community_clicks', 1);
        
        if (isCritical) {
            this.updateQuestProgress('critical_hits');
            this.contributeToEvent('critical_storm', 1);
        }
        
        if (this.gameState.stats.totalClicks % 10 === 0) {
            this.saveGameState();
        }
        
        this.checkAchievements();
    }

    applyChaosEffect() {
        const randomEffect = Math.random();
        if (randomEffect < 0.3) {
            this.gameState.cardEffects.clickPower *= 1.5;
            setTimeout(() => {
                this.gameState.cardEffects.clickPower /= 1.5;
            }, 3000);
        }
    }

    addScore(points, isCritical = false) {
        const oldLevel = this.gameState.level;
        
        this.gameState.score += points;
        this.gameState.totalEarnedScore += points;
        
        this.updateQuestProgress('score', points);
        
        let leveledUp = false;
        const maxLevel = this.getMaxLevel();
        
        while (this.gameState.level < maxLevel && 
               this.gameState.totalEarnedScore >= this.getRequiredScoreForLevel(this.gameState.level + 1)) {
            this.gameState.level++;
            leveledUp = true;
            
            if (this.gameState.level >= maxLevel) break;
        }
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
            this.updateQuestProgress('level_up');
            this.contributeToEvent('level_rush', this.gameState.level - oldLevel);
        }
        
        if (isCritical) {
            this.showCriticalEffect(points);
        }
    }

    getMaxLevel() {
        return 100;
    }

    getRequiredScoreForLevel(level) {
        if (level <= 1) return 0;
        return Math.pow(level - 1, 2) * 100;
    }

    buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 50 * Math.pow(2, this.gameState.upgrades.autoClick),
            'critical-chance': 25 * Math.pow(2, this.gameState.upgrades.criticalChance - 1)
        };

        const cost = costs[upgradeType];
        
        if (this.gameState.score >= cost) {
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
            
            this.hapticFeedback('success');
            
            this.updateQuestProgress('upgrades');
            
            this.updateUI();
            this.saveGameState();
            
            this.showUpgradeNotification(upgradeType);
        } else {
            this.hapticFeedback('error');
            this.showInsufficientFundsNotification(cost);
        }
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

    // ==================== СИСТЕМА ЕЖЕДНЕВНЫХ ЗАДАНИЙ ====================

    initDailyQuests() {
        const now = Date.now();
        const lastRefresh = this.gameState.dailyQuests.lastRefresh;
        const isNewDay = !this.isSameDay(now, lastRefresh);

        if (isNewDay || this.gameState.dailyQuests.currentQuests.length === 0) {
            this.refreshDailyQuests();
        }
        
        this.updateQuestsUI();
    }

    isSameDay(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getDate() === d2.getDate() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getFullYear() === d2.getFullYear();
    }

    refreshDailyQuests() {
        const availableQuests = this.getAvailableQuests();
        const selectedQuests = this.selectDailyQuests(availableQuests, 3);
        
        this.gameState.dailyQuests.lastRefresh = Date.now();
        this.gameState.dailyQuests.completedToday = 0;
        this.gameState.dailyQuests.currentQuests = selectedQuests;

        this.saveGameState();
        this.updateQuestsUI();
        
        console.log('Ежедневные задания обновлены!');
    }

    getAvailableQuests() {
        return [
            {
                id: 'click_100',
                title: 'Трудолюбивая лапа',
                description: 'Сделайте 100 кликов',
                icon: '🎯',
                type: 'clicks',
                target: 100,
                progress: 0,
                reward: { coins: 50, exp: 25 },
                rarity: 'common'
            },
            {
                id: 'level_up',
                title: 'Восхождение',
                description: 'Повысьте уровень',
                icon: '📈',
                type: 'level_up',
                target: 1,
                progress: 0,
                reward: { coins: 100, exp: 50 },
                rarity: 'rare'
            },
            {
                id: 'critical_10',
                title: 'Точность мастера',
                description: 'Сделайте 10 критических ударов',
                icon: '💥',
                type: 'critical_hits',
                target: 10,
                progress: 0,
                reward: { coins: 75, exp: 40 },
                rarity: 'uncommon'
            },
            {
                id: 'upgrade_buy',
                title: 'Улучшатель',
                description: 'Купите 3 улучшения',
                icon: '🛠️',
                type: 'upgrades',
                target: 3,
                progress: 0,
                reward: { coins: 120, exp: 60 },
                rarity: 'rare'
            },
            {
                id: 'combo_cards',
                title: 'Стратег',
                description: 'Активируйте 2 карты в колоде',
                icon: '🎴',
                type: 'combo_cards',
                target: 2,
                progress: 0,
                reward: { coins: 150, exp: 75 },
                rarity: 'epic'
            },
            {
                id: 'score_5000',
                title: 'Заработок',
                description: 'Заработайте 5000 очков',
                icon: '💰',
                type: 'score',
                target: 5000,
                progress: 0,
                reward: { coins: 200, exp: 100 },
                rarity: 'uncommon'
            }
        ];
    }

    selectDailyQuests(availableQuests, count) {
        const shuffled = [...availableQuests].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(quest => ({
            ...quest,
            progress: 0,
            completed: false,
            claimed: false
        }));
    }

    updateQuestProgress(type, amount = 1) {
        let updated = false;
        let questCompleted = false;
        
        this.gameState.dailyQuests.currentQuests.forEach(quest => {
            if (!quest.completed && quest.type === type) {
                const oldProgress = quest.progress;
                quest.progress = Math.min(quest.progress + amount, quest.target);
                
                if (quest.progress >= quest.target && !quest.completed) {
                    quest.completed = true;
                    questCompleted = true;
                    this.showQuestCompleteNotification(quest);
                }
                
                if (quest.progress !== oldProgress) {
                    updated = true;
                }
            }
        });

        if (updated) {
            this.updateQuestsUI();
            this.saveGameState();
        }
        
        return questCompleted;
    }

    claimQuestReward(questId) {
        const quest = this.gameState.dailyQuests.currentQuests.find(q => q.id === questId);
        
        if (quest && quest.completed && !quest.claimed) {
            quest.claimed = true;
            
            this.gameState.score += quest.reward.coins;
            this.addScore(quest.reward.exp, false);
            
            this.gameState.dailyQuests.completedToday++;
            this.gameState.dailyQuests.totalCompleted++;
            
            this.updateStreak();
            
            this.showRewardNotification(quest);
            this.updateQuestsUI();
            this.updateQuestsStats();
            this.saveGameState();
            
            return true;
        }
        return false;
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastClaim = this.gameState.dailyQuests.lastClaim;
        
        if (!lastClaim || lastClaim !== today) {
            if (lastClaim && this.isYesterday(new Date(lastClaim))) {
                this.gameState.dailyQuests.streak++;
            } else if (!lastClaim) {
                this.gameState.dailyQuests.streak = 1;
            } else {
                this.gameState.dailyQuests.streak = 1;
            }
            this.gameState.dailyQuests.lastClaim = today;
        }
    }

    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    startQuestRefreshTimer() {
        setInterval(() => {
            const now = Date.now();
            const lastRefresh = this.gameState.dailyQuests.lastRefresh;
            
            if (!this.isSameDay(now, lastRefresh)) {
                this.refreshDailyQuests();
            }
        }, 60000);
    }

    // ==================== КООПЕРАТИВНЫЕ ИВЕНТЫ ====================

    initCoopEvents() {
        const now = Date.now();
        let activeEvents = this.gameState.coopEvents.activeEvents;
        
        activeEvents = activeEvents.filter(event => {
            if (event.endTime < now && !event.completed) {
                this.finalizeEvent(event);
                return false;
            }
            return true;
        });

        this.gameState.coopEvents.activeEvents = activeEvents;

        if (activeEvents.length === 0) {
            setTimeout(() => {
                this.createNewCoopEvent();
            }, 2000);
        }
        
        this.updateEventsUI();
    }

    createNewCoopEvent() {
        const events = this.getCoopEventTemplates();
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        const event = {
            ...randomEvent,
            startTime: Date.now(),
            endTime: Date.now() + (randomEvent.duration * 60 * 60 * 1000),
            totalProgress: 0,
            participantCount: 0,
            completed: false,
            rewardsDistributed: false
        };

        this.gameState.coopEvents.activeEvents.push(event);
        this.saveGameState();
        this.updateEventsUI();
        
        console.log('Новый кооперативный ивент создан:', event.name);
    }

    getCoopEventTemplates() {
        return [
            {
                id: 'community_clicks',
                name: 'Общий клик-марафон',
                description: 'Все игроки вместе должны сделать 1,000,000 кликов!',
                icon: '👥',
                type: 'total_clicks',
                target: 1000000,
                duration: 24,
                rewards: {
                    personal: { coins: 200, exp: 100 },
                    community: { coins: 500, exp: 250 }
                }
            },
            {
                id: 'critical_storm',
                name: 'Шторм критических ударов',
                description: 'Совместно нанести 50,000 критических ударов',
                icon: '⚡',
                type: 'critical_hits',
                target: 50000,
                duration: 12,
                rewards: {
                    personal: { coins: 150, exp: 75 },
                    community: { coins: 300, exp: 150 }
                }
            },
            {
                id: 'level_rush',
                name: 'Гонка уровней',
                description: 'Сообщество должно суммарно достичь 500 уровней',
                icon: '🏆',
                type: 'levels_gained',
                target: 500,
                duration: 48,
                rewards: {
                    personal: { coins: 300, exp: 150 },
                    community: { coins: 1000, exp: 500 }
                }
            }
        ];
    }

    contributeToEvent(eventId, contribution) {
        const event = this.gameState.coopEvents.activeEvents.find(e => e.id === eventId);
        
        if (event && !event.completed) {
            event.totalProgress += contribution;
            
            if (!this.gameState.coopEvents.participation[eventId]) {
                this.gameState.coopEvents.participation[eventId] = {
                    personalProgress: 0,
                    contributed: 0,
                    rewardClaimed: false
                };
                event.participantCount = (event.participantCount || 0) + 1;
                this.gameState.coopEvents.totalParticipated++;
            }
            
            this.gameState.coopEvents.participation[eventId].personalProgress += contribution;
            this.gameState.coopEvents.participation[eventId].contributed += contribution;

            if (event.totalProgress >= event.target && !event.completed) {
                this.finalizeEvent(event);
            }

            this.updateEventsUI();
            this.updateQuestsStats();
            this.saveGameState();
        }
    }

    finalizeEvent(event) {
        event.completed = true;
        event.totalProgress = Math.min(event.totalProgress, event.target);
        event.rewardsDistributed = true;
        
        console.log(`Ивент "${event.name}" завершен! Прогресс: ${event.totalProgress}/${event.target}`);
        
        setTimeout(() => {
            this.createNewCoopEvent();
        }, 10000);
    }

    claimEventReward(eventId) {
        const event = this.gameState.coopEvents.activeEvents.find(e => e.id === eventId);
        const participation = this.gameState.coopEvents.participation[eventId];
        
        if (event && event.completed && participation && !participation.rewardClaimed) {
            participation.rewardClaimed = true;
            
            this.gameState.score += event.rewards.personal.coins;
            this.addScore(event.rewards.personal.exp, false);
            
            if (event.totalProgress >= event.target) {
                this.gameState.score += event.rewards.community.coins;
                this.addScore(event.rewards.community.exp, false);
            }
            
            this.showEventRewardNotification(event);
            this.updateEventsUI();
            this.saveGameState();
            
            return true;
        }
        return false;
    }

    // ==================== UI ОБНОВЛЕНИЯ ====================

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
    }

    updateHeaderProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        
        let progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        let percentage = 0;
        if (totalNeeded > 0) {
            percentage = (progress / totalNeeded) * 100;
        } else {
            percentage = 100;
        }
        
        percentage = Math.max(0, Math.min(100, percentage));
        
        const progressFillHeader = document.getElementById('level-progress-header');
        
        if (progressFillHeader) {
            progressFillHeader.style.width = `${percentage}%`;
        }
    }

    updateEarnedScoreDisplay() {
        let earnedScoreElement = document.getElementById('earned-score-display');
        
        if (!earnedScoreElement) {
            earnedScoreElement = document.createElement('div');
            earnedScoreElement.id = 'earned-score-display';
            earnedScoreElement.className = 'earned-score-display';
            
            const progressBar = document.querySelector('.header-progress');
            if (progressBar) {
                progressBar.appendChild(earnedScoreElement);
            }
        }
        
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        
        if (totalNeeded > 0) {
            earnedScoreElement.textContent = `${this.formatNumber(progress)} / ${this.formatNumber(totalNeeded)} очков до уровня ${this.gameState.level + 1}`;
        } else {
            earnedScoreElement.textContent = 'Максимальный уровень достигнут!';
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

    updateQuestsUI() {
        const questsContainer = document.getElementById('quests-container');
        if (!questsContainer) return;

        const quests = this.gameState.dailyQuests.currentQuests;
        
        if (quests.length === 0) {
            questsContainer.innerHTML = `
                <div class="empty-quests">
                    <div class="empty-icon">📅</div>
                    <h4>Заданий пока нет</h4>
                    <p>Новые задания появятся завтра!</p>
                </div>
            `;
            return;
        }

        let html = '';
        quests.forEach(quest => {
            const progressPercent = (quest.progress / quest.target) * 100;
            const isCompleted = quest.completed;
            const isClaimed = quest.claimed;
            
            html += `
                <div class="quest-item ${isCompleted ? 'completed' : ''} ${isClaimed ? 'claimed' : ''} ${quest.rarity}">
                    <div class="quest-icon">${quest.icon}</div>
                    <div class="quest-info">
                        <div class="quest-title">${quest.title}</div>
                        <div class="quest-description">${quest.description}</div>
                        <div class="quest-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="progress-text">${this.formatNumber(quest.progress)}/${this.formatNumber(quest.target)}</div>
                        </div>
                    </div>
                    <div class="quest-reward">
                        ${isClaimed ? 
                            '<div class="reward-claimed">✓</div>' :
                            `<button class="claim-btn ${isCompleted ? 'active' : ''}" 
                                     onclick="window.clickerGame.claimQuestReward('${quest.id}')"
                                     ${!isCompleted ? 'disabled' : ''}>
                                +${quest.reward.coins} 🪙
                            </button>`
                        }
                    </div>
                </div>
            `;
        });

        questsContainer.innerHTML = html;
    }

    updateEventsUI() {
        const eventsContainer = document.getElementById('events-container');
        if (!eventsContainer) return;

        const activeEvents = this.gameState.coopEvents.activeEvents;
        
        if (activeEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-events">
                    <div class="empty-icon">⏰</div>
                    <h4>Ивентов пока нет</h4>
                    <p>Следующий ивент скоро начнется!</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        activeEvents.forEach(event => {
            const progressPercent = (event.totalProgress / event.target) * 100;
            const participation = this.gameState.coopEvents.participation[event.id];
            const timeLeft = event.endTime - Date.now();
            const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
            const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
            
            html += `
                <div class="event-item ${event.completed ? 'completed' : ''}">
                    <div class="event-header">
                        <div class="event-icon">${event.icon}</div>
                        <div class="event-info">
                            <div class="event-name">${event.name}</div>
                            <div class="event-description">${event.description}</div>
                        </div>
                        <div class="event-time">${hoursLeft}ч ${minutesLeft}м</div>
                    </div>
                    
                    <div class="event-progress">
                        <div class="progress-info">
                            <span>Прогресс: ${this.formatNumber(event.totalProgress)}/${this.formatNumber(event.target)}</span>
                            <span>Участников: ${event.participantCount || 0}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    
                    ${participation ? `
                        <div class="personal-contribution">
                            Ваш вклад: ${this.formatNumber(participation.contributed)}
                        </div>
                    ` : ''}
                    
                    <div class="event-rewards">
                        ${event.completed ? 
                            `<button class="claim-event-btn ${participation && !participation.rewardClaimed ? 'active' : ''}"
                                     onclick="window.clickerGame.claimEventReward('${event.id}')"
                                     ${!participation || participation.rewardClaimed ? 'disabled' : ''}>
                                Получить награду
                            </button>` :
                            '<div class="event-active">Ивент активен • Участвуйте!</div>'
                        }
                    </div>
                </div>
            `;
        });

        eventsContainer.innerHTML = html;
    }

    updateQuestsStats() {
        const currentStreak = document.getElementById('current-streak');
        const totalQuests = document.getElementById('total-quests');
        const eventsParticipated = document.getElementById('events-participated');
        const dailyStreak = document.querySelector('.daily-streak span');

        if (currentStreak) {
            currentStreak.textContent = this.gameState.dailyQuests.streak;
        }
        if (totalQuests) {
            totalQuests.textContent = this.gameState.dailyQuests.totalCompleted;
        }
        if (eventsParticipated) {
            eventsParticipated.textContent = this.gameState.coopEvents.totalParticipated;
        }
        if (dailyStreak) {
            dailyStreak.textContent = this.gameState.dailyQuests.streak;
        }
    }

    // ==================== ФОРМАТИРОВАНИЕ ЧИСЕЛ ====================

    formatNumber(number) {
        if (number < 1000) {
            return Math.floor(number).toString();
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) {
            return Math.floor(number).toLocaleString();
        }
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        if (tier > 0) {
            if (scaled < 10) {
                return scaled.toFixed(2) + suffix;
            } else if (scaled < 100) {
                return scaled.toFixed(1) + suffix;
            } else {
                return Math.floor(scaled) + suffix;
            }
        }
        
        return Math.floor(number).toLocaleString();
    }

    formatNumberRounded(number) {
        if (number < 1000) {
            return Math.floor(number).toString();
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) {
            return Math.floor(number).toLocaleString();
        }
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        return Math.floor(scaled) + suffix;
    }

    formatNumberPrecise(number) {
        if (number < 1000) {
            return Math.floor(number).toString();
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const tier = Math.floor(Math.log10(Math.abs(number)) / 3);
        
        if (tier >= suffixes.length) {
            return Math.floor(number).toLocaleString();
        }
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        if (scaled >= 1000) {
            return this.formatNumberPrecise(scaled) + suffix;
        }
        
        if (scaled < 10) {
            return scaled.toFixed(2) + suffix;
        } else if (scaled < 100) {
            return scaled.toFixed(1) + suffix;
        } else {
            return Math.floor(scaled) + suffix;
        }
    }

    // ==================== УВЕДОМЛЕНИЯ ====================

    showQuestCompleteNotification(quest) {
        console.log(`🎉 Задание выполнено: ${quest.title}`);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎉 Задание выполнено!',
                message: `${quest.title}\n\nНаграда: ${quest.reward.coins} монет + ${quest.reward.exp} опыта`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    showRewardNotification(quest) {
        this.createRewardParticles(quest.reward.coins);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎁 Награда получена!',
                message: `Вы получили ${quest.reward.coins} монет и ${quest.reward.exp} опыта за задание "${quest.title}"`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    showEventRewardNotification(event) {
        console.log(`🏆 Награда за ивент получена: ${event.name}`);
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🏆 Награда за ивент!',
                message: `Вы получили награду за участие в "${event.name}"`,
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
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '✅ Улучшение куплено!',
                message: `Вы улучшили: ${upgradeNames[upgradeType]}`,
                buttons: [{ type: 'ok' }]
            });
        }
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
        }
    }

    // ==================== ПРОФИЛЬ И ШЕРИНГ ====================

    shareProfile() {
        const shareText = `Мой профиль в Dark Paws Clicker! 🐾\nУровень: ${this.gameState.level}\nОчки: ${this.formatNumber(this.gameState.score)}\nПрисоединяйся к игре!`;
        
        if (this.isTelegram) {
            if (this.tg.showShareAlert) {
                this.tg.showShareAlert({
                    title: 'Поделиться профилем',
                    message: shareText,
                    url: window.location.href
                });
            } else if (this.tg.share) {
                this.tg.share(shareText);
            } else {
                this.tg.showPopup({
                    title: 'Поделиться профилем',
                    message: shareText,
                    buttons: [{ type: 'ok' }]
                });
                
                this.copyToClipboard(shareText + '\n' + window.location.href);
            }
        } else if (navigator.share) {
            navigator.share({
                title: 'Dark Paws Clicker',
                text: shareText,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(shareText + '\n' + window.location.href);
            alert('Ссылка скопирована в буфер обмена!');
        }
    }

    inviteFriends() {
        const referralUrl = `${window.location.href}?startapp=ref_${this.user.id}`;
        const shareText = `Присоединяйся к Dark Paws Clicker! 🎮\n\nПрокачивай свою лапу, собирай карты и соревнуйся с друзьями!\n\nИграй тут: ${referralUrl}`;
        
        if (this.isTelegram) {
            this.tg.showPopup({
                title: '🐾 Пригласить друга',
                message: `Поделись игрой с друзьями и получай бонусы!\n\nТвоя реферальная ссылка:\n${referralUrl}`,
                buttons: [
                    {
                        type: 'default',
                        text: '📤 Поделиться',
                        id: 'share'
                    },
                    {
                        type: 'cancel',
                        text: 'Отмена'
                    }
                ]
            }).then((buttonId) => {
                if (buttonId === 'share') {
                    if (this.tg.share) {
                        this.tg.share(shareText);
                    } else {
                        this.copyToClipboard(shareText);
                        this.tg.showPopup({
                            title: '✅ Скопировано!',
                            message: 'Ссылка скопирована в буфер обмена. Отправь её другу!',
                            buttons: [{ type: 'ok' }]
                        });
                    }
                }
            });
        } else if (navigator.share) {
            navigator.share({
                title: 'Dark Paws Clicker',
                text: shareText,
                url: referralUrl
            });
        } else {
            this.copyToClipboard(shareText);
            alert('Реферальная ссылка скопирована в буфер обмена!');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    // ==================== СУЩЕСТВУЮЩИЕ МЕТОДЫ ====================

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
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
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
            case 'friends-tab':
                this.updateFriendsTab();
                break;
            case 'levels-tab':
                this.updateLevelsTab();
                break;
            case 'combo-tab':
                this.updateComboTab();
                break;
            case 'quests-tab':
                this.updateQuestsUI();
                this.updateEventsUI();
                this.updateQuestsStats();
                break;
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
            
            if (username) {
                username.textContent = this.user.first_name || 'Player';
            }
            if (levelText) {
                levelText.textContent = `Уровень ${this.gameState.level}`;
            }
        }
    }

    openProfile() {
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (this.isTelegram) {
                this.tg.BackButton.show();
            }
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            if (this.isTelegram) {
                this.tg.BackButton.hide();
            }
        }
    }

    updateProfileModal() {
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

        this.updateProfileStats();
        this.updateProfileAchievements();
        this.updateProfileUpgrades();
    }

    updateProfileStats() {
        const totalClicks = document.getElementById('profile-total-clicks');
        const playTime = document.getElementById('profile-play-time');
        const totalScore = document.getElementById('profile-total-score');
        const joinDate = document.getElementById('profile-join-date');

        if (totalClicks) {
            totalClicks.textContent = this.formatNumber(this.gameState.stats.totalClicks);
        }
        if (playTime) {
            const hours = Math.floor(this.gameState.stats.playTime / 3600000);
            playTime.textContent = `${hours}ч`;
        }
        if (totalScore) {
            totalScore.textContent = this.formatNumber(this.gameState.totalEarnedScore);
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
                if (particle.parentNode === container) {
                    container.removeChild(particle);
                }
            }, 1000);
        }
    }

    createRewardParticles(amount) {
        const container = document.getElementById('particles-container');
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const coin = document.createElement('div');
            coin.className = 'reward-particle';
            coin.textContent = '🪙';
            coin.style.setProperty('--random-x', Math.random());
            coin.style.setProperty('--random-y', Math.random());
            
            container.appendChild(coin);
            
            setTimeout(() => {
                if (coin.parentNode === container) {
                    container.removeChild(coin);
                }
            }, 1000);
        }
    }

    showLevelUp() {
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
        
        this.saveGameState();
    }

    showCriticalEffect(points) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const critText = document.createElement('div');
        critText.className = 'critical-hit';
        critText.textContent = `CRIT! +${this.formatNumberRounded(points)}`;
        
        container.appendChild(critText);
        
        setTimeout(() => {
            if (critText.parentNode === container) {
                container.removeChild(critText);
            }
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
        
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: '🎉 Новое достижение!',
                message: `Вы получили достижение: "${achievementName}"`,
                buttons: [{ type: 'ok' }]
            });
        }
        
        this.saveGameState();
    }

    updateFriendsTab() {
        const friendsCount = document.querySelector('.friends-count span');
        const friendsBonus = document.querySelector('.friends-bonus span');
        
        if (friendsCount) {
            friendsCount.textContent = this.gameState.friends.length;
        }
        
        const friendCount = this.gameState.friends.length;
        let bonusPercent = 0;
        
        if (friendCount >= 5) bonusPercent = 15;
        else if (friendCount >= 3) bonusPercent = 10;
        else if (friendCount >= 1) bonusPercent = 5;
        
        if (friendsBonus) {
            friendsBonus.textContent = bonusPercent + '%';
        }
        
        this.updateFriendsList();
        this.updateFriendsBonuses();
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
                            <div class="friend-stats">Уровень ${friend.level || 1} • <span class="friend-score">${this.formatNumber(friend.score || 0)} очков</span></div>
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

    loadFriendsList() {
        this.gameState.friends = [
            { first_name: 'Друг 1', level: 5, score: 1500 },
            { first_name: 'Друг 2', level: 3, score: 800 },
            { first_name: 'Друг 3', level: 7, score: 12500 },
            { first_name: 'Друг 4', level: 12, score: 85000 },
            { first_name: 'Друг 5', level: 15, score: 250000 }
        ];
        this.updateFriendsTab();
    }

    loadLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        if (!container) return;
        
        const leaderboard = [
            { first_name: 'Чемпион', score: 5000000 },
            { first_name: 'Профи', score: 2500000 },
            { first_name: 'Любитель', score: 1200000 },
            { first_name: 'Новичок', score: 500000 },
            { first_name: 'Игрок', score: 150000 }
        ];
        
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
                    <div class="leaderboard-score">${this.formatNumber(player.score || 0)}</div>
                </div>
            `;
        });
        
        container.innerHTML = leaderboardHTML;
    }

    updateLevelsTab() {
        const currentLevel = document.querySelector('.current-level span');
        if (currentLevel) {
            currentLevel.textContent = this.gameState.level;
        }
        
        this.updateLevelsProgress();
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
            
            card.classList.remove('active', 'locked', 'completed');
            
            if (levelNumber < this.gameState.level) {
                card.classList.add('completed');
                if (status) {
                    status.textContent = 'Пройден';
                    status.classList.add('completed');
                }
            } else if (levelNumber === this.gameState.level) {
                card.classList.add('active');
                
                const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
                const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
                const progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
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
                    status.textContent = `${this.formatNumber(requiredScore)} очков`;
                    status.classList.remove('completed');
                }
            }
        });
    }

    updateComboTab() {
        this.updateDeckStats();
        this.updateComboCards();
    }

    updateDeckStats() {
        const deckPower = document.querySelector('.power-value');
        const deckStats = document.querySelectorAll('.stat-value');
        const comboCount = document.querySelector('.combo-count span');
        const deckSize = document.querySelector('.deck-size span');
        
        if (deckPower) {
            deckPower.textContent = this.formatNumberRounded(this.calculateDeckPower());
        }
        
        if (comboCount) {
            comboCount.textContent = `${this.gameState.activeDeck.length}/4`;
        }
        
        if (deckSize) {
            deckSize.textContent = `${this.gameState.activeDeck.length}/4`;
        }
        
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

        this.setupComboCardListeners();
    }

    setupComboCardListeners() {
        const cards = document.querySelectorAll('.combo-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('locked')) {
                    this.showCardLockedMessage(card);
                } else {
                    this.toggleCardInDeck(card);
                }
            });
        });
    }

    toggleCardInDeck(card) {
        const cardId = parseInt(card.dataset.cardId);
        const cardIndex = this.gameState.activeDeck.indexOf(cardId);
        const cardData = this.getCardData(cardId);
        
        if (cardIndex === -1) {
            if (this.gameState.activeDeck.length < 4) {
                this.gameState.activeDeck.push(cardId);
                card.classList.add('active');
                this.applyCardEffects();
                
                this.updateQuestProgress('combo_cards');
                
                this.showCardNotification('Карта добавлена в колоду', cardData);
            } else {
                this.showCardNotification('Колода полна! Максимум 4 карты', cardData);
            }
        } else {
            this.gameState.activeDeck.splice(cardIndex, 1);
            card.classList.remove('active');
            this.applyCardEffects();
            this.showCardNotification('Карта убрана из колоды', cardData);
        }
        
        this.updateDeckStats();
        this.saveGameState();
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
                description: 'Добавляет 5 авто-кликов в секунду',
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
                    if (stat === 'clickPower' || stat === 'multiplier') {
                        this.gameState.cardEffects[stat] *= card.stats[stat];
                    } else {
                        this.gameState.cardEffects[stat] += card.stats[stat];
                    }
                } else {
                    this.gameState.cardEffects[stat] = card.stats[stat];
                }
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
        }
    }

    showCardNotification(message, cardData) {
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: `🎴 ${cardData.name}`,
                message: `${message}\n\n${cardData.description}`,
                buttons: [{ type: 'ok' }]
            });
        }
    }

    startPlayTimeCounter() {
        setInterval(() => {
            this.gameState.stats.playTime += 1000;
            if (this.gameState.stats.playTime % 60000 === 0) {
                this.saveGameState();
            }
        }, 1000);
    }

    // ==================== ОБРАБОТКА ОШИБОК ====================

    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.trackError('GlobalError', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.trackError('UnhandledRejection', event.reason);
        });
    }

    trackError(type, error) {
        if (this.isTelegram && this.tg.sendData) {
            this.tg.sendData(JSON.stringify({
                type: 'error',
                errorType: type,
                errorMessage: error?.message || String(error),
                userId: this.user?.id,
                timestamp: Date.now()
            }));
        }
    }

    isAppReady() {
        return this.isInitialized && this.user !== null;
    }

    safeUpdateUI() {
        if (!this.isAppReady()) {
            setTimeout(() => this.safeUpdateUI(), 100);
            return;
        }
        this.updateUI();
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Dark Paws Clicker');
    
    if (window.Telegram && window.Telegram.WebApp) {
        console.log('Telegram Web App environment detected');
    } else {
        console.log('Standalone browser environment detected');
    }
    
    window.clickerGame = new DarkPawsClicker();
    
    window.addEventListener('error', (event) => {
        console.error('Global error caught:', event.error);
    });
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'telegram_game_score') {
        if (window.clickerGame) {
            window.clickerGame.addScore(event.data.score);
        }
    }
});
