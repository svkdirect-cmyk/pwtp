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
            lastSave: Date.now()
        };
        
        this.particles = [];
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
        
        // Запускаем анимацию частиц
        this.animateParticles();
    }

    initTelegramAuth() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            this.user = this.tg.initDataUnsafe.user;
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        if (this.user) {
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-name');
            
            if (avatar && this.user.photo_url) {
                avatar.src = this.user.photo_url;
            }
            if (username) {
                username.textContent = this.user.first_name || 'Player';
            }
        }
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
            
            pawButton.addEventListener('touchstart', () => {
                pawButton.classList.add('click-animation');
            });
            
            pawButton.addEventListener('touchend', () => {
                setTimeout(() => {
                    pawButton.classList.remove('click-animation');
                }, 150);
            });
        }

        // Кнопки улучшений
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeCard = e.target.closest('.upgrade-card');
                if (upgradeCard) {
                    const upgradeType = upgradeCard.dataset.upgrade;
                    this.buyUpgrade(upgradeType);
                }
            });
        });
    }

    handleClick(event) {
        // Создаем эффекты частиц
        this.createParticles(event);
        
        // Вычисляем очки
        let points = this.gameState.upgrades.clickPower;
        let isCritical = false;
        
        // Шанс критического удара
        const critChance = this.gameState.upgrades.criticalChance * 0.03; // 3% за уровень
        if (Math.random() < critChance) {
            points *= 3;
            isCritical = true;
        }
        
        this.addScore(points, isCritical);
        this.saveGameState();
    }

    createParticles(event) {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
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
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            
            // Случайный размер
            const size = 2 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Случайная прозрачность
            const opacity = 0.3 + Math.random() * 0.7;
            particle.style.opacity = opacity;
            
            // Анимация
            particle.style.animation = `particle-float ${0.8 + Math.random() * 0.4}s ease-out forwards`;
            
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
            if (Math.random() < 0.1) { // 10% шанс создать частицу
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
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // Маленький размер и низкая opacity
        const size = 1 + Math.random() * 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = 0.1 + Math.random() * 0.2;
        
        particle.style.animation = `particle-float ${2 + Math.random() * 2}s ease-out forwards`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode === container) {
                container.removeChild(particle);
            }
        }, 4000);
    }

    addScore(points, isCritical = false) {
        const oldScore = this.gameState.score;
        this.gameState.score += points;
        
        // Проверка уровня
        const requiredForNextLevel = this.getRequiredScoreForLevel(this.gameState.level + 1);
        if (this.gameState.score >= requiredForNextLevel) {
            this.gameState.level++;
            this.showLevelUp();
        }
        
        this.updateUI();
        
        // Визуальный эффект при критическом ударе
        if (isCritical) {
            this.showCriticalEffect(points);
        }
    }

    getRequiredScoreForLevel(level) {
        return Math.pow(level, 2) * 100;
    }

    showLevelUp() {
        // Можно добавить анимацию уровня
        const levelBadge = document.querySelector('.level-badge');
        if (levelBadge) {
            levelBadge.textContent = this.gameState.level;
            levelBadge.classList.add('pulse');
            setTimeout(() => levelBadge.classList.remove('pulse'), 1000);
        }
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
        }
    }

    startAutoClicker() {
        setInterval(() => {
            if (this.gameState.upgrades.autoClick > 0) {
                const autoPoints = this.gameState.upgrades.autoClick;
                this.addScore(autoPoints);
            }
        }, 1000);
    }

    updateUI() {
        // Обновляем счет и уровень
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        
        if (scoreElement) scoreElement.textContent = Math.floor(this.gameState.score);
        if (levelElement) levelElement.textContent = this.gameState.level;
        
        // Обновляем силу клика и авто-клик
        const clickPowerElement = document.getElementById('click-power');
        const autoClicksElement = document.getElementById('auto-clicks');
        
        if (clickPowerElement) clickPowerElement.textContent = this.gameState.upgrades.clickPower;
        if (autoClicksElement) autoClicksElement.textContent = this.gameState.upgrades.autoClick;
        
        // Обновляем кнопки улучшений
        this.updateUpgradeButtons();
        
        // Обновляем прогресс бар
        this.updateProgressBar();
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

    updateProgressBar() {
        const currentLevelScore = this.getRequiredScoreForLevel(this.gameState.level);
        const nextLevelScore = this.getRequiredScoreForLevel(this.gameState.level + 1);
        const progress = this.gameState.score - currentLevelScore;
        const totalNeeded = nextLevelScore - currentLevelScore;
        const percentage = (progress / totalNeeded) * 100;
        
        const progressFill = document.getElementById('level-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.floor(progress)}/${totalNeeded}`;
        }
    }

    saveGameState() {
        try {
            const saveData = {
                ...this.gameState,
                userId: this.user?.id,
                lastSave: Date.now()
            };
            localStorage.setItem('darkPawsClicker_save', JSON.stringify(saveData));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('darkPawsClicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Проверяем, что сохранение принадлежит текущему пользователю
                if (!this.user || saveData.userId === this.user.id) {
                    this.gameState = { ...this.gameState, ...saveData };
                    console.log('Game state loaded:', this.gameState);
                }
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.clickerGame = new DarkPawsClicker();
});

// Авто-сохранение
window.addEventListener('beforeunload', () => {
    if (window.clickerGame) {
        window.clickerGame.saveGameState();
    }
});
