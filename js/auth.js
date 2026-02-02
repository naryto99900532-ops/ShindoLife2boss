// auth.js
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.supabase = window.SupabaseConfig.supabase;
        this.USER_ROLES = window.SupabaseConfig.USER_ROLES;
        this.initEventListeners();
        this.checkAuth();
    }
    
    initEventListeners() {
        // Переключение между формами
        document.getElementById('switch-form-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForm();
        });
        
        // Вход
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Регистрация
        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
        
        // Выход
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }
    
    toggleAuthForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchText = document.getElementById('switch-text');
        const switchBtn = document.getElementById('switch-form-btn');
        
        if (loginForm.classList.contains('active')) {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            switchText.textContent = 'Уже есть аккаунт?';
            switchBtn.textContent = 'Войти';
        } else {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
            switchText.textContent = 'Нет аккаунта?';
            switchBtn.textContent = 'Зарегистрироваться';
        }
        
        this.clearAuthError();
    }
    
    clearAuthError() {
        document.getElementById('auth-error').textContent = '';
    }
    
    // В методе showAuthError добавьте:
showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        // Добавляем стили для ошибки
        errorElement.style.backgroundColor = '#fee';
        errorElement.style.color = '#c33';
        errorElement.style.padding = '10px';
        errorElement.style.borderRadius = '6px';
        errorElement.style.marginBottom = '15px';
        errorElement.style.border = '1px solid #fcc';
    }
}
    async login() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        
        if (!username || !password) {
            this.showAuthError('Заполните все поля');
            return;
        }
        
        try {
            // Получаем пользователя из базы
            const { data: user, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error || !user) {
                this.showAuthError('Пользователь не найден');
                return;
            }
            
            // Проверяем пароль (упрощённо)
            if (btoa(password) !== user.password_hash) {
                this.showAuthError('Неверный пароль');
                return;
            }
            
            // Обновляем время последнего входа
            await this.supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
            
            // Сохраняем пользователя в sessionStorage
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Переходим к главной панели
            this.showMainPanel();
            
            // Добавляем лог
            await this.addLog('Вход в систему', user.id);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showAuthError('Ошибка сервера');
        }
    }
    
    async register() {
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('reg-confirm').value.trim();
        
        // Валидация
        if (!username || !email || !password || !confirmPassword) {
            this.showAuthError('Заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showAuthError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAuthError('Введите корректный email');
            return;
        }
        
        try {
            // Проверяем, существует ли пользователь
            const { data: existingUser } = await this.supabase
                .from('users')
                .select('id')
                .or(`username.eq.${username},email.eq.${email}`)
                .single();
            
            if (existingUser) {
                this.showAuthError('Пользователь с таким именем или email уже существует');
                return;
            }
            
            // Создаем нового пользователя
            const passwordHash = btoa(password);
            
            const { data: user, error } = await this.supabase
                .from('users')
                .insert([
                    {
                        username,
                        email,
                        password_hash: passwordHash,
                        role: this.USER_ROLES.PLAYER
                    }
                ])
                .select()
                .single();
            
            if (error) throw error;
            
            // Автоматически входим
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Переходим к главной панели
            this.showMainPanel();
            
            // Добавляем лог
            await this.addLog('Регистрация нового аккаунта', user.id);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showAuthError('Ошибка при создании аккаунта');
        }
    }
    
    async checkAuth() {
        const loadingScreen = document.getElementById('loading-screen');
        const authScreen = document.getElementById('auth-screen');
        const mainPanel = document.getElementById('main-panel');
        
        try {
            // Проверяем подключение к Supabase
            const isConnected = await window.SupabaseConfig.checkSupabaseConnection();
            if (!isConnected) {
                this.showAuthError('Ошибка подключения к базе данных');
                loadingScreen.classList.remove('active');
                authScreen.classList.add('active');
                return;
            }
            
            // Создаем владельца если нужно
            await window.SupabaseConfig.createInitialOwner();
            
            // Проверяем авторизацию
            const savedUser = sessionStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                    
                    // Проверяем актуальность данных
                    const { data: user, error } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('id', this.currentUser.id)
                        .single();
                    
                    if (!error && user) {
                        this.currentUser = user;
                        this.showMainPanel();
                    } else {
                        sessionStorage.removeItem('currentUser');
                        this.showAuthScreen();
                    }
                } catch (error) {
                    console.error('Ошибка проверки пользователя:', error);
                    sessionStorage.removeItem('currentUser');
                    this.showAuthScreen();
                }
            } else {
                this.showAuthScreen();
            }
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showAuthError('Ошибка загрузки системы');
        } finally {
            loadingScreen.classList.remove('active');
        }
    }
    
    showAuthScreen() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-panel').classList.remove('active');
    }
    
    showMainPanel() {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-panel').classList.add('active');
        
        // Обновляем информацию о пользователе
        this.updateUserInfo();
        
        // Показываем соответствующие разделы
        this.updateNavigation();
    }
    
    updateUserInfo() {
        if (!this.currentUser) return;
        
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        const role = document.getElementById('user-role');
        
        avatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
        name.textContent = this.currentUser.username;
        role.textContent = this.getRoleName(this.currentUser.role);
    }
    
    updateNavigation() {
        if (!this.currentUser) return;
        
        // Показываем/скрываем разделы в зависимости от роли
        const adminItems = document.querySelectorAll('.admin-only');
        const ownerItems = document.querySelectorAll('.owner-only');
        
        if (this.currentUser.role === this.USER_ROLES.OWNER) {
            adminItems.forEach(item => item.style.display = 'flex');
            ownerItems.forEach(item => item.style.display = 'flex');
        } else if (this.currentUser.role === this.USER_ROLES.ADMIN) {
            adminItems.forEach(item => item.style.display = 'flex');
            ownerItems.forEach(item => item.style.display = 'none');
        } else {
            adminItems.forEach(item => item.style.display = 'none');
            ownerItems.forEach(item => item.style.display = 'none');
        }
    }
    
    getRoleName(role) {
        const roleNames = {
            [this.USER_ROLES.OWNER]: 'Владелец',
            [this.USER_ROLES.ADMIN]: 'Администратор',
            [this.USER_ROLES.PLAYER]: 'Игрок'
        };
        return roleNames[role] || 'Игрок';
    }
    
    async logout() {
        // Добавляем лог о выходе
        if (this.currentUser) {
            await this.addLog('Выход из системы', this.currentUser.id);
        }
        
        // Очищаем данные
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        
        // Возвращаемся к экрану авторизации
        this.showAuthScreen();
        
        // Очищаем формы
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        this.clearAuthError();
    }
    
    async addLog(action, userId = null) {
        try {
            await this.supabase
                .from('system_logs')
                .insert([
                    {
                        user_id: userId,
                        action: action,
                        timestamp: new Date().toISOString()
                    }
                ]);
        } catch (error) {
            console.error('Ошибка записи лога:', error);
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
