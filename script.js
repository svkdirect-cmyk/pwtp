class DarkPawsClicker {
    constructor() {
        this.tg = window.Telegram?.WebApp;
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
                playTime: 0,
                joinDate: new Date().toISOString(),
                criticalHits: 0
            },
            friends: [],
            activeDeck: [],
            cardEffects: {
                clickPower: 1,
                autoClick: 0,
                criticalChance: 0,
                criticalMultiplier: 1
            },
            lastSave: Date.now()
        };
        
        this.currentTab = 'game-tab';
        this.startTime = Date.now();
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Dark Paws Clicker for Telegram...');
        
        // Инициализация Telegram Web App
        if (this.tg) {
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            this.tg.setHeaderColor('#1a1a1a');
            this.tg.setBackgroundColor('#0a0a0a');
        }
        
        this.setupEventListeners();
        this.initTelegramAuth();
        this.loadGameState();
        this.updateUI();
        this.startAutoClicker();
        this.setupTabs();
        this.startPlayTimeCounter();
    }

    setupEventListeners() {
        // Основная кнопка
        const pawButton = document.getElementById('paw-button');
        if (pawButton) {
            const handleClick = (e) => {
                e.preventDefault();
                this.handleClick(e);
            };
            
            pawButton.addEventListener('click', handleClick);
            pawButton.addEventListener('touchstart', handleClick, { passive: false });
        }

        // Улучшения
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    this.buyUpgrade(upgradeCard.dataset.upgrade);
                }
            });
        });

        // Кнопки друзей
        document.getElementById('invite-friends')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.inviteFriends();
        });

        document.getElementById('refresh-friends')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadFriendsList();
        });

        // Профиль
        document.getElementById('profile-opener')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openProfile();
        });

        document.getElementById('close-profile')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeProfile();
        });

        document.getElementById('share-profile')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.shareProfile();
        });

        // Закрытие модалки по клику вне
        document.getElementById('profile-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeProfile();
            }
        });
    }

    initTelegramAuth() {
        if (this.tg?.initDataUnsafe?.user) {
            this.user = this.tg.initDataUnsafe.user;
            console.log('✅ User authenticated:', this.user);
        } else {
            // Заглушка для разработки
            this.user = {
                id: Math.floor(Math.random() * 10000),
                first_name: 'Игрок',
                username: 'player'
            };
            console.log('⚠️ Using mock user data');
        }
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.user) {
            const setAvatar = (elementId, text) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = text;
                    if (this.user.photo_url) {
                        element.style.backgroundImage = `url(${this.user.photo_url})`;
                        element.style.backgroundSize = 'cover';
                    }
                }
            };

            setAvatar('user-avatar', this.user.first_name?.charAt(0).toUpperCase() || 'P');
            setAvatar('profile-avatar', this.user.first_name?.charAt(0).toUpperCase() || 'P');

            document.getElementById('user-name').textContent = this.user.first_name || 'Player';
            document.getElementById('profile-name').textContent = this.user.first_name || 'Player';
            document.getElementById('profile-id').textContent = this.user.id || '0000';
        }
    }

    setupTabs() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
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
            
            // Ленивая загрузка контента вкладок
            if (tabId === 'combo-tab') {
                this.updateComboTab();
            } else if (tabId === 'friends-tab') {
                this.updateFriendsTab();
            } else if (tabId === 'levels-tab') {
                this.updateLevelsTab();
            }
        }
    }

    updateFriendsTab() {
        const friendsCount = this.gameState.friends.length;
        document.querySelector('.friends-count span').textContent = friendsCount;
        
        const bonusPercent = friendsCount >= 3 ? 10 : friendsCount >= 1 ? 5 : 0;
        document.querySelector('.friends-bonus span').textContent = bonusPercent + '%';
        
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
                    <p>Пригласите друзей и получайте бонусы</p>
                </div>
            `;
        } else {
            container.innerHTML = this.gameState.friends.map(friend => `
                <div class="friend-item">
                    <div class="friend-avatar">${friend.first_name?.charAt(0) || 'U'}</div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.first_name || 'Unknown'}</div>
                        <div class="friend-stats">Уровень ${friend.level || 1}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateFriendsBonuses() {
        const friendCount = this.gameState.friends.length;
        document.querySelectorAll('.bonus-card').forEach((card, index) => {
            const status = card.querySelector('.bonus-status');
            const required = index === 0 ? 1 : 3;
            
            if (status) {
                if (friendCount >= required) {
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
        // Заглушка для демонстрации
        this.gameState.friends = [
            { first_name: 'Друг 1', level: 2 },
            { first_name: 'Друг 2', level: 1 }
        ];
        this.updateFriendsTab();
        
        // Показать уведомление в Telegram
        this.showTelegramAlert('Список друзей обновлен!');
    }

    updateLevelsTab() {
        document.querySelector('.current-level span').textContent = this.gameState.level;
        this.updateLevelCards();
    }

    updateLevelCards() {
        document.querySelectorAll('.level-card').forEach((card, index) => {
            const levelNumber = index + 1;
            const status = card.querySelector('.level-status');
            
            card.classList.remove('active', 'locked', 'completed');
            
            if (levelNumber < this.gameState.level) {
                card.classList.add('completed');
                status.textContent = 'Пройден';
                status.classList.add('completed');
            } else if (levelNumber === this.gameState.level) {
                card.classList.add('active');
                const progress = this.calculateLevelProgress();
                status.textContent = `${progress}%`;
                status.classList.remove('completed');
            } else {
                card.classList.add('locked');
                const required = this.getRequiredScoreForLevel(levelNumber);
                status.textContent = `${required} очков`;
                status.classList.remove('completed');
            }
        });
    }

    calculateLevelProgress() {
        const current = this.getRequiredScoreForLevel(this.gameState.level);
        const next = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = this.gameState.totalEarnedScore - current;
        const totalNeeded = next - current;
        
        return totalNeeded > 0 ? Math.min(100, Math.floor((progress / totalNeeded) * 100)) : 100;
    }

    updateComboTab() {
        this.updateDeckStats();
        this.updateComboCards();
    }

    updateDeckStats() {
        const power = this.calculateDeckPower();
        document.querySelector('.power-value').textContent = power;
        document.querySelector('.combo-count span').textContent = 
        document.querySelector('.deck-size span').textContent = `${this.gameState.activeDeck.length}/4`;
        
        const clickBonus = ((this.gameState.cardEffects.clickPower - 1) * 100).toFixed(0);
        const autoBonus = this.gameState.cardEffects.autoClick;
        
        document.querySelectorAll('.stat-value')[0].textContent = `${clickBonus}%`;
        document.querySelectorAll('.stat-value')[1].textContent = `${autoBonus}`;
    }

    calculateDeckPower() {
        return this.gameState.activeDeck.length * 10 + 
               this.gameState.activeDeck.reduce((sum, cardId) => {
                   const card = this.getCardData(cardId);
                   return sum + (card?.power || 0);
               }, 0);
    }

    updateComboCards() {
        const container = document.getElementById('cards-grid-container');
        if (!container) return;

        const cards = this.getAllCards();
        container.innerHTML = cards.map(card => {
            const locked = !card.unlocked;
            const active = this.gameState.activeDeck.includes(card.id);
            
            return `
                <div class="combo-card ${locked ? 'locked' : ''} ${active ? 'active' : ''}" 
                     data-card-id="${card.id}">
                    <div class="card-frame">
                        <div class="card-rarity ${card.rarity}">
                            ${this.getRarityText(card.rarity)}
                        </div>
                        <div class="card-icon">${card.icon}</div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-stats">${card.description}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.setupComboCardListeners();
    }

    setupComboCardListeners() {
        document.querySelectorAll('.combo-card:not(.locked)').forEach(card => {
            card.addEventListener('click', () => {
                this.toggleCardInDeck(card);
            });
        });
    }

    toggleCardInDeck(card) {
        const cardId = parseInt(card.dataset.cardId);
        const index = this.gameState.activeDeck.indexOf(cardId);
        
        if (index === -1) {
            if (this.gameState.activeDeck.length < 4) {
                this.gameState.activeDeck.push(cardId);
                card.classList.add('active');
                this.showTelegramAlert('Карта добавлена в колоду!');
            } else {
                this.showTelegramAlert('Колода полна! Максимум 4 карты.');
            }
        } else {
            this.gameState.activeDeck.splice(index, 1);
            card.classList.remove('active');
            this.showTelegramAlert('Карта убрана из колоды.');
        }
        
        this.applyCardEffects();
        this.updateDeckStats();
        this.saveGameState();
    }

    getAllCards() {
        return [
            { id: 1, name: 'Лапа новичка', rarity: 'common', icon: '🐾', 
              description: '+5% сила клика', unlocked: true, power: 5 },
            { id: 2, name: 'Энергия', rarity: 'rare', icon: '⚡', 
              description: '+2 авто-клика', unlocked: this.gameState.level >= 2, power: 10 },
            { id: 3, name: 'Точность', rarity: 'epic', icon: '🎯', 
              description: '+10% шанс крита', unlocked: this.gameState.level >= 3, power: 15 },
            { id: 4, name: 'Мощь', rarity: 'legendary', icon: '💪', 
              description: '+25% сила клика', unlocked: this.gameState.level >= 5, power: 25 }
        ];
    }

    getCardData(cardId) {
        return this.getAllCards().find(card => card.id === cardId);
    }

    getRarityText(rarity) {
        const map = { 'common': 'Обычная', 'rare': 'Редкая', 'epic': 'Эпическая', 'legendary': 'Легендарная' };
        return map[rarity] || rarity;
    }

    applyCardEffects() {
        this.gameState.cardEffects = { clickPower: 1, autoClick: 0, criticalChance: 0, criticalMultiplier: 1 };
        
        this.gameState.activeDeck.forEach(cardId => {
            const card = this.getCardData(cardId);
            if (!card) return;
            
            // Простая логика усилений на основе карт
            if (card.id === 1) this.gameState.cardEffects.clickPower *= 1.05;
            if (card.id === 2) this.gameState.cardEffects.autoClick += 2;
            if (card.id === 3) this.gameState.cardEffects.criticalChance += 0.1;
            if (card.id === 4) this.gameState.cardEffects.clickPower *= 1.25;
        });
    }

    handleClick(event) {
        this.gameState.stats.totalClicks++;
        
        let points = this.gameState.upgrades.clickPower;
        points *= this.gameState.cardEffects.clickPower;
        
        // Шанс критического удара
        const critChance = this.gameState.upgrades.criticalChance * 0.02 + this.gameState.cardEffects.criticalChance;
        if (Math.random() < critChance) {
            points *= 3;
            this.gameState.stats.criticalHits++;
            this.showCriticalEffect(points);
        }
        
        this.addScore(points);
        this.createParticles(event);
        
        // Авто-сохранение каждые 10 кликов
        if (this.gameState.stats.totalClicks % 10 === 0) {
            this.saveGameState();
        }
    }

    addScore(points, isCritical = false) {
        this.gameState.score += points;
        this.gameState.totalEarnedScore += points;
        
        // Проверка повышения уровня
        while (this.gameState.level < 100 && 
               this.gameState.totalEarnedScore >= this.getRequiredScoreForLevel(this.gameState.level + 1)) {
            this.gameState.level++;
            this.showLevelUp();
        }
        
        this.updateUI();
    }

    getRequiredScoreForLevel(level) {
        return level <= 1 ? 0 : Math.pow(level - 1, 2) * 100;
    }

    showLevelUp() {
        const badge = document.querySelector('.level-badge');
        if (badge) {
            badge.textContent = this.gameState.level;
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 300);
        }
        
        this.showTelegramAlert(`🎉 Уровень ${this.gameState.level} достигнут!`);
        this.saveGameState();
    }

    showCriticalEffect(points) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const critText = document.createElement('div');
        critText.className = 'critical-hit';
        critText.textContent = `CRIT! +${Math.floor(points)}`;
        container.appendChild(critText);
        
        setTimeout(() => critText.remove(), 1500);
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const x = (event.clientX || event.touches?.[0]?.clientX || 0) - rect.left;
        const y = (event.clientY || event.touches?.[0]?.clientY || 0) - rect.top;
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
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
                case 'click-power': this.gameState.upgrades.clickPower++; break;
                case 'auto-click': this.gameState.upgrades.autoClick++; break;
                case 'critical-chance': this.gameState.upgrades.criticalChance++; break;
            }
            
            this.updateUI();
            this.saveGameState();
            this.showTelegramAlert('Улучшение куплено!');
        } else {
            this.showTelegramAlert(`Недостаточно очков. Нужно: ${cost}`);
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0 || this.gameState.cardEffects.autoClick > 0) {
                const points = (this.gameState.upgrades.autoClick + this.gameState.cardEffects.autoClick) * 
                              this.gameState.cardEffects.clickPower;
                this.addScore(points);
            }
        }, 1000);
    }

    startPlayTimeCounter() {
        setInterval(() => {
            this.gameState.stats.playTime += 1000;
        }, 1000);
    }

    updateUI() {
        // Обновление счета и уровня
        document.getElementById('score').textContent = Math.floor(this.gameState.score).toLocaleString();
        document.querySelector('.level-badge').textContent = this.gameState.level;
        document.querySelector('.level-text').textContent = `Уровень ${this.gameState.level}`;
        
        // Прогресс бар
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = Math.max(0, this.gameState.totalEarnedScore - currentLevelScore);
        const totalNeeded = nextLevelScore - currentLevelScore;
        const percentage = totalNeeded > 0 ? (progress / totalNeeded) * 100 : 100;
        
        document.getElementById('level-progress-header').style.width = `${Math.min(100, percentage)}%`;
        document.getElementById('earned-score-display').textContent = 
            totalNeeded > 0 ? 
            `${Math.floor(progress)} / ${totalNeeded} очков до уровня ${this.gameState.level + 1}` :
            'Максимальный уровень!';
        
        // Кнопки улучшений
        this.updateUpgradeButtons();
    }

    updateUpgradeButtons() {
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const type = card.dataset.upgrade;
            const levelSpan = card.querySelector('.upgrade-level span');
            const button = card.querySelector('.upgrade-btn');
            
            let level, cost;
            switch(type) {
                case 'click-power':
                    level = this.gameState.upgrades.clickPower;
                    cost = 10 * Math.pow(2, level - 1);
                    break;
                case 'auto-click':
                    level = this.gameState.upgrades.autoClick;
                    cost = level === 0 ? 50 : 50 * Math.pow(2, level);
                    break;
                case 'critical-chance':
                    level = this.gameState.upgrades.criticalChance;
                    cost = 25 * Math.pow(2, level - 1);
                    break;
            }
            
            levelSpan.textContent = level;
            button.textContent = cost;
            
            if (this.gameState.score >= cost) {
                button.disabled = false;
                button.classList.add('affordable');
            } else {
                button.disabled = true;
                button.classList.remove('affordable');
            }
        });
    }

    openProfile() {
        this.updateProfileModal();
        document.getElementById('profile-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeProfile() {
        document.getElementById('profile-modal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    updateProfileModal() {
        document.getElementById('profile-level').textContent = this.gameState.level;
        document.getElementById('profile-total-clicks').textContent = this.gameState.stats.totalClicks.toLocaleString();
        
        const hours = Math.floor(this.gameState.stats.playTime / 3600000);
        document.getElementById('profile-play-time').textContent = `${hours}ч`;
        
        document.getElementById('profile-click-power').textContent = this.gameState.upgrades.clickPower;
        document.getElementById('profile-auto-click').textContent = this.gameState.upgrades.autoClick;
        document.getElementById('profile-critical').textContent = this.gameState.upgrades.criticalChance;
    }

    shareProfile() {
        const shareText = `Мой профиль в Dark Paws Clicker!\nУровень: ${this.gameState.level}\nОчки: ${Math.floor(this.gameState.score)}\nПрисоединяйся!`;
        
        if (this.tg?.showPopup) {
            this.tg.showPopup({
                title: 'Поделиться профилем',
                message: shareText,
                buttons: [{ type: 'default', text: 'Поделиться' }, { type: 'cancel' }]
            });
        } else if (navigator.share) {
            navigator.share({
                title: 'Dark Paws Clicker',
                text: shareText
            });
        } else {
            alert(shareText);
        }
    }

    inviteFriends() {
        const shareText = `Присоединяйся к Dark Paws Clicker! 🎮\nИграй и прокачивай свою лапу!\n\nСсылка: ${window.location.href}?ref=${this.user.id}`;
        
        if (this.tg?.showPopup) {
            this.tg.showPopup({
                title: 'Пригласить друга',
                message: 'Поделитесь игрой с друзьями!',
                buttons: [{ type: 'default', text: 'Поделиться' }, { type: 'cancel' }]
            });
        } else if (navigator.share) {
            navigator.share({
                title: 'Dark Paws Clicker',
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText);
            this.showTelegramAlert('Ссылка скопирована в буфер обмена!');
        }
    }

    showTelegramAlert(message) {
        if (this.tg?.showPopup) {
            this.tg.showPopup({
                title: 'Dark Paws',
                message: message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            console.log('Alert:', message);
        }
    }

    saveGameState() {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPaws_save', JSON.stringify(saveData));
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPaws_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Совместимость с предыдущими версиями
                if (!saveData.totalEarnedScore) saveData.totalEarnedScore = saveData.score || 0;
                if (!saveData.activeDeck) saveData.activeDeck = [];
                if (!saveData.cardEffects) saveData.cardEffects = { clickPower: 1, autoClick: 0, criticalChance: 0, criticalMultiplier: 1 };
                
                // Загружаем только если это тот же пользователь
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    this.applyCardEffects();
                    console.log('✅ Game state loaded');
                }
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение при закрытии
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});
