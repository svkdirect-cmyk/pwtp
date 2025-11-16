class HamsterClicker {
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
            lastSave: Date.now()
        };
        
        this.init();
    }

    init() {
        this.tg.expand();
        this.setupEventListeners();
        this.loadGameState();
        this.initTelegramAuth();
    }

    initTelegramAuth() {
        if (this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            this.showGameScreen();
        } else {
            this.showAuthScreen();
        }
    }

    setupEventListeners() {
        // Кнопка начала игры
        document.getElementById('start-btn').addEventListener('click', () => {
            this.tg.openTelegramLink('https://t.me/HamsterClickerBot?start=game');
        });

        // Клик по хомяку
        document.getElementById('hamster').addEventListener('click', (e) => {
            this.handleClick(e);
        });

        // Кнопки улучшений
        document.querySelectorAll('.btn-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeType = e.target.closest('.upgrade-item').dataset.upgrade;
                this.buyUpgrade(upgradeType);
            });
        });
    }

    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
    }

    showGameScreen() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        // Обновляем информацию пользователя
        document.getElementById('user-avatar').src = this.user.photo_url || '';
        document.getElementById('user-name').textContent = this.user.first_name || 'Игрок';
        
        this.updateUI();
        this.startAutoClicker();
    }

    handleClick(event) {
        const hamster = document.getElementById('hamster');
        const rect = hamster.getBoundingClientRect();
        
        // Создаем эффект клика
        this.createClickEffect(event.clientX, event.clientY);
        
        // Вычисляем очки
        let points = this.gameState.upgrades.clickPower;
        
        // Шанс крита
        const critChance = this.gameState.upgrades.criticalChance * 0.05; // 5% за уровень
        if (Math.random() < critChance) {
            points *= 2;
            this.createClickEffect(event.clientX, event.clientY, `CRIT! +${points}`, '#ff0000');
        }
        
        this.addScore(points);
        
        // Анимация хомяка
        hamster.style.transform = 'scale(0.95)';
        setTimeout(() => {
            hamster.style.transform = 'scale(1)';
        }, 100);
    }

    createClickEffect(x, y, text = `+${this.gameState.upgrades.clickPower}`, color = '#ffeb3b') {
        const effect = document.getElementById('click-effect');
        effect.textContent = text;
        effect.style.color = color;
        effect.style.left = (x - 20) + 'px';
        effect.style.top = (y - 20) + 'px';
        effect.style.animation = 'none';
        
        setTimeout(() => {
            effect.style.animation = 'floatUp 1s ease-out forwards';
        }, 10);
    }

    addScore(points) {
        this.gameState.score += points;
        
        // Проверка уровня
        const newLevel = Math.floor(Math.sqrt(this.gameState.score / 100)) + 1;
        if (newLevel > this.gameState.level) {
            this.gameState.level = newLevel;
            this.showLevelUpMessage();
        }
        
        this.updateUI();
        this.saveGameState();
    }

    showLevelUpMessage() {
        // Можно добавить красивую анимацию уровня
        console.log(`Новый уровень: ${this.gameState.level}`);
    }

    buyUpgrade(upgradeType) {
        const costs = {
            'click-power': 10 * Math.pow(2, this.gameState.upgrades.clickPower - 1),
            'auto-click': this.gameState.upgrades.autoClick === 0 ? 50 : 100 * Math.pow(2, this.gameState.upgrades.autoClick - 1),
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
        } else {
            this.showMessage('Недостаточно очков!');
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0) {
                const autoPoints = this.gameState.upgrades.autoClick;
                this.addScore(autoPoints);
                
                // Создаем автоматический эффект клика
                const hamster = document.getElementById('hamster');
                const rect = hamster.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                this.createClickEffect(x, y, `AUTO +${autoPoints}`, '#4ecdc4');
            }
        }, 1000); // Каждую секунду
    }

    updateUI() {
        // Обновляем счет и уровень
        document.getElementById('score').textContent = Math.floor(this.gameState.score);
        document.getElementById('level').textContent = this.gameState.level;
        
        // Обновляем кнопки улучшений
        this.updateUpgradeButtons();
        
        // Обновляем таблицу лидеров
        this.updateLeaderboard();
    }

    updateUpgradeButtons() {
        const upgrades = document.querySelectorAll('.upgrade-item');
        
        upgrades.forEach(item => {
            const type = item.dataset.upgrade;
            const levelSpan = item.querySelector('.upgrade-level');
            const button = item.querySelector('.btn-upgrade');
            
            let level, cost, name;
            
            switch(type) {
                case 'click-power':
                    level = this.gameState.upgrades.clickPower;
                    cost = 10 * Math.pow(2, level - 1);
                    name = 'Сила клика';
                    levelSpan.textContent = `Ур. ${level}`;
                    button.textContent = `Улучшить (${cost})`;
                    break;
                    
                case 'auto-click':
                    level = this.gameState.upgrades.autoClick;
                    cost = level === 0 ? 50 : 100 * Math.pow(2, level - 1);
                    name = level === 0 ? 'Купить авто-клик' : 'Авто-клик';
                    levelSpan.textContent = level === 0 ? 'Не куплено' : `Ур. ${level}`;
                    button.textContent = level === 0 ? `Купить (${cost})` : `Улучшить (${cost})`;
                    break;
                    
                case 'critical-chance':
                    level = this.gameState.upgrades.criticalChance;
                    cost = 25 * Math.pow(2, level - 1);
                    name = 'Шанс крита';
                    levelSpan.textContent = `Ур. ${level}`;
                    button.textContent = `Улучшить (${cost})`;
                    break;
            }
            
            button.disabled = this.gameState.score < cost;
        });
    }

    updateLeaderboard() {
        // В реальном приложении здесь был бы запрос к серверу
        const leaderboard = [
            { name: 'Топовый Хомяк', score: 15000 },
            { name: 'Хомяк-чемпион', score: 12000 },
            { name: this.user.first_name, score: Math.floor(this.gameState.score) },
            { name: 'Начинающий', score: 5000 },
            { name: 'Новичок', score: 3000 }
        ].sort((a, b) => b.score - a.score);
        
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        
        leaderboard.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${player.name === this.user.first_name ? 'you' : ''}`;
            item.innerHTML = `
                <span>${index + 1}. ${player.name}</span>
                <span>${player.score}</span>
            `;
            list.appendChild(item);
        });
    }

    showMessage(text) {
        // Простая реализация сообщения
        alert(text);
    }

    saveGameState() {
        // Сохраняем в localStorage (в реальном приложении - на сервер)
        const saveData = {
            ...this.gameState,
            userId: this.user?.id,
            lastSave: Date.now()
        };
        localStorage.setItem('hamsterClicker_save', JSON.stringify(saveData));
    }

    loadGameState() {
        const saved = localStorage.getItem('hamsterClicker_save');
        if (saved) {
            const saveData = JSON.parse(saved);
            
            // Проверяем, что сохранение принадлежит текущему пользователю
            if (!this.user || saveData.userId === this.user.id) {
                this.gameState = { ...this.gameState, ...saveData };
            }
        }
    }
}

// Инициализация игры когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new HamsterClicker();
});

// Обработка видимости страницы для авто-сохранения
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Сохраняем игру когда пользователь уходит
        const game = window.hamsterGame;
        if (game) {
            game.saveGameState();
        }
    }
});