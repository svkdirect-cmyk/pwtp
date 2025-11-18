class AdminAuth {
    constructor() {
        this.isAuthenticated = false;
        this.adminUsers = [
            {
                username: 'admin',
                password: 'darkpaws2024',
                name: 'Главный администратор',
                role: 'superadmin'
            },
            {
                username: 'moderator', 
                password: 'mod123',
                name: 'Модератор',
                role: 'moderator'
            }
        ];
        
        this.init();
    }

    init() {
        this.checkExistingAuth();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('admin-login');
        const logoutBtn = document.getElementById('admin-logout');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Enter key для логина
        const passwordInput = document.getElementById('admin-password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }
    }

    handleLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        
        if (!username || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        const user = this.authenticate(username, password);
        
        if (user) {
            this.login(user);
        } else {
            this.showMessage('Неверные учетные данные', 'error');
        }
    }

    authenticate(username, password) {
        return this.adminUsers.find(user => 
            user.username === username && user.password === password
        );
    }

    login(user) {
        this.isAuthenticated = true;
        this.currentUser = user;
        
        // Сохраняем сессию
        localStorage.setItem('adminAuth', JSON.stringify({
            user: user,
            loginTime: Date.now()
        }));
        
        this.showAdminPanel();
        this.showMessage(`Добро пожаловать, ${user.name}!`, 'success');
    }

    handleLogout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            this.logout();
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('adminAuth');
        this.showLoginScreen();
        this.showMessage('Вы вышли из системы', 'info');
    }

    checkExistingAuth() {
        const savedAuth = localStorage.getItem('adminAuth');
        
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                const loginTime = authData.loginTime;
                const currentTime = Date.now();
                const sessionDuration = 12 * 60 * 60 * 1000; // 12 часов
                
                if (currentTime - loginTime < sessionDuration) {
                    this.login(authData.user);
                } else {
                    localStorage.removeItem('adminAuth');
                    this.showLoginScreen();
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                localStorage.removeItem('adminAuth');
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
    }

    showAdminPanel() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        
        // Обновляем информацию о пользователе
        if (this.currentUser) {
            const displayName = document.getElementById('admin-display-name');
            if (displayName) {
                displayName.textContent = this.currentUser.name;
            }
        }
    }

    showMessage(message, type = 'info') {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getMessageColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getMessageColor(type) {
        const colors = {
            'success': '#2ecc71',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        return colors[type] || '#3498db';
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'superadmin': ['*'],
            'moderator': ['users.view', 'users.edit', 'analytics.view']
        };
        
        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }
}

// Инициализация аутентификации
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuth();
});
