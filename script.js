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
        
        this.init();
    }

    // Добавляем функцию форматирования чисел
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
        
        // Форматируем с 1-2 знаками после запятой для больших чисел
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

    // Функция для форматирования с округлением до целых
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

    // Функция для точного форматирования (для улучшений)
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
        
        // Для очень больших чисел показываем без десятичных
        if (scaled >= 1000) {
            return this.formatNumberPrecise(scaled) + suffix;
        }
        
        // Определяем количество знаков после запятой
        if (scaled < 10) {
            return scaled.toFixed(2) + suffix;
        } else if (scaled < 100) {
            return scaled.toFixed(1) + suffix;
        } else {
            return Math.floor(scaled) + suffix;
        }
    }

    init() {
        console.log('Initializing Dark Paws Clicker for Telegram Mini Apps...');
        
        // Инициализация Telegram Web App
        if (this.tg) {
            this.isTelegram = true;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            this.tg.BackButton.hide();
            
            // Установка цветовой схемы Telegram
            this.applyTelegramTheme();
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        this.loadGameState();
        this.updateUI();
        this.startAutoClicker();
        this.setupTabs();
        this.startPlayTimeCounter();
        this.updateComboTab();
    }

    applyTelegramTheme() {
        // Используем CSS переменные для поддержки тем Telegram
        document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color || '#0a0a0a');
        document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color || '#e0e0e0');
        document.documentElement.style.setProperty('--tg-theme-hint-color', this.tg.themeParams.hint_color || '#888');
        document.documentElement.style.setProperty('--tg-theme-link-color', this.tg.themeParams.link_color || '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color || '#8b5cf6');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', this.tg.themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', this.tg.themeParams.secondary_bg_color || '#1a1a1a');
    }

    setupEventListeners() {
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            // Улучшенная обработка кликов для мобильных устройств
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
            
            // Оптимизированные touch события
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

        // Улучшения
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

        // Профиль
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

        // Обработка видимости приложения
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveGameState();
            }
        });

        // Обработка ухода со страницы
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
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
            
            if (username) {
                username.textContent = this.user.first_name || 'Player';
            }
            if (levelText) {
                levelText.textContent = `Уровень ${this.gameState.level}`;
            }
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
            case 'levels-tab':
                this.updateLevelsTab();
                break;
            case 'combo-tab':
                this.updateComboTab();
                break;
        }
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
        const levelLines = document.querySelectorAll('.level-line');
        
        // Сбрасываем все стили
        levelCircles.forEach(circle => {
            circle.classList.remove('active', 'completed');
        });
        levelLines.forEach(line => {
            line.classList.remove('completed', 'partial');
            line.style.background = '';
        });
        
        levelCircles.forEach((circle, index) => {
            const circleLevel = parseInt(circle.dataset.level);
            const isLastCircle = index === levelCircles.length - 1;
            
            if (this.gameState.level >= circleLevel) {
                // Полностью заполненный кружок
                circle.classList.add('completed');
                
                // Заполняем линию до этого кружка (кроме первого)
                if (index > 0) {
                    const prevLine = levelLines[index - 1];
                    prevLine.classList.add('completed');
                    prevLine.style.background = 'var(--gradient-primary)';
                }
            } else if (!isLastCircle) {
                // Частичное заполнение для текущего уровня
                const nextCircleLevel = parseInt(levelCircles[index + 1].dataset.level);
                const currentRange = nextCircleLevel - circleLevel;
                const progressInRange = Math.max(0, this.gameState.level - circleLevel);
                const percentage = (progressInRange / currentRange) * 100;
                
                if (progressInRange > 0) {
                    circle.classList.add('active');
                    
                    // Частично заполняем линию
                    const currentLine = levelLines[index];
                    currentLine.classList.add('partial');
                    currentLine.style.background = `linear-gradient(90deg, 
                        var(--gradient-primary) 0% ${percentage}%, 
                        var(--bg-tertiary) ${percentage}% 100%)`;
                }
            }
        });
        
        // Особый случай: если уровень выше 100, отмечаем все как завершенные
        if (this.gameState.level >= 100) {
            levelCircles.forEach(circle => circle.classList.add('completed'));
            levelLines.forEach(line => {
                line.classList.add('completed');
                line.style.background = 'var(--gradient-primary)';
            });
        }
    }

    updateLevelCards() {
        const levelCards = document.querySelectorAll('.level-card');
        
        // Определяем milestone уровни
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
                    } else {
                        status.textContent = 'Макс уровень';
                    }
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
            
            // Обновляем номера уровней в карточках
            const levelNumber = card.querySelector('.level-number');
            if (levelNumber) {
                levelNumber.textContent = `Уровень ${milestoneLevel}`;
            }
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
        } else {
            alert('Эта карта будет доступна на более высоких уровнях');
        }
    }

    showCardNotification(message, cardData) {
        if (this.isTelegram && this.tg.showPopup) {
            this.tg.showPopup({
                title: `🎴 ${cardData.name}`,
                message: `${message}\n\n${cardData.description}`,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(`🎴 ${cardData.name}\n${message}\n\n${cardData.description}`);
        }
    }

    openProfile() {
        this.updateProfileModal();
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Показать кнопку "Назад" в Telegram
            if (this.isTelegram) {
                this.tg.BackButton.show();
                this.tg.BackButton.onClick(() => {
                    this.closeProfile();
                });
            }
        }
    }

    closeProfile() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Скрыть кнопку "Назад" в Telegram
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
        } else {
            alert(shareText);
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

    handleClick(event) {
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
        }
        
        this.addScore(points, isCritical);
        this.createParticles(event);
        
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
        } else {
            alert(`🎉 Новое достижение: ${achievementName}`);
        }
        
        this.saveGameState();
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

    addScore(points, isCritical = false) {
        this.gameState.score += points;
        this.gameState.totalEarnedScore += points;
        
        let leveledUp = false;
        const maxLevel = this.getMaxLevel();
        
        // Проверяем повышение уровня
        while (this.gameState.level < maxLevel) {
            const requiredScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
            if (this.gameState.totalEarnedScore >= requiredScore) {
                this.gameState.level++;
                leveledUp = true;
            } else {
                break;
            }
        }
        
        this.updateUI();
        
        if (leveledUp) {
            this.showLevelUp();
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
        
        // Нелинейная прогрессия для больших уровней
        if (level <= 10) {
            return Math.pow(level - 1, 2) * 100;
        } else if (level <= 25) {
            return this.getRequiredScoreForLevel(10) + (level - 10) * 5000;
        } else if (level <= 50) {
            return this.getRequiredScoreForLevel(25) + (level - 25) * 10000;
        } else if (level <= 75) {
            return this.getRequiredScoreForLevel(50) + (level - 50) * 25000;
        } else {
            return this.getRequiredScoreForLevel(75) + (level - 75) * 50000;
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
        
        console.log(`🎉 Уровень повышен до ${this.gameState.level}!`);
        
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
            
            this.updateUI();
            this.saveGameState();
            
            this.showUpgradeNotification(upgradeType);
        } else {
            this.showInsufficientFundsNotification(cost);
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
        } else {
            alert(`✅ Улучшение куплено: ${upgradeNames[upgradeType]}`);
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
        } else {
            alert(`❌ Недостаточно очков. Нужно: ${formattedCost}`);
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
            console.log(`Прогресс уровня: ${percentage}% (${progress}/${totalNeeded})`);
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

    saveGameState() {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
            console.log('Game state saved');
        } catch (error) {
            console.error('Local storage save error:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Миграция старых сохранений
                if (!saveData.totalEarnedScore) {
                    saveData.totalEarnedScore = saveData.score || 0;
                }
                
                if (!saveData.activeDeck) {
                    saveData.activeDeck = [];
                }
                
                if (!saveData.cardEffects) {
                    saveData.cardEffects = {
                        clickPower: 1,
                        autoClick: 0,
                        criticalChance: 0,
                        criticalMultiplier: 1,
                        multiplier: 1,
                        chaos: false
                    };
                }
                
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    this.applyCardEffects();
                    console.log('Game state loaded from localStorage');
                    console.log(`Уровень: ${this.gameState.level}, Очки: ${this.gameState.score}, Всего заработано: ${this.gameState.totalEarnedScore}`);
                }
            }
        } catch (error) {
            console.error('Error loading game state from localStorage:', error);
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Обработка видимости страницы
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});

// Обработка закрытия страницы
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});
