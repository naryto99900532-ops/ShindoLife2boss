class OwnerManager {
    constructor() {
        this.admins = [];
        this.initEventListeners();
        this.loadAdmins();
    }
    
    initEventListeners() {
        // Назначение администратора
        document.getElementById('assign-admin-btn').addEventListener('click', () => {
            this.assignAdmin();
        });
        
        // Снятие администратора
        document.getElementById('remove-admin-btn').addEventListener('click', () => {
            this.removeAdmin();
        });
    }
    
    async loadAdmins() {
        try {
            const { data: admins, error } = await supabase
                .from('users')
                .select('*')
                .in('role', [USER_ROLES.ADMIN, USER_ROLES.OWNER])
                .order('username');
            
            if (error) throw error;
            
            this.admins = admins || [];
            this.renderAdminList();
            this.renderAdminSelect();
            
        } catch (error) {
            console.error('Ошибка загрузки администраторов:', error);
        }
    }
    
    renderAdminList() {
        const container = document.getElementById('current-admins-list');
        
        if (this.admins.length === 0) {
            container.innerHTML = '<p class="empty-message">Администраторы не назначены</p>';
            return;
        }
        
        container.innerHTML = this.admins.map(admin => `
            <div class="admin-card">
                <div class="admin-info">
                    <div class="admin-avatar">${admin.username.charAt(0)}</div>
                    <div>
                        <div class="admin-name">${admin.username}</div>
                        <div class="admin-role">
                            ${admin.role === USER_ROLES.OWNER ? '👑 Владелец' : '🔧 Администратор'}
                        </div>
                        <div class="admin-email">${admin.email}</div>
                    </div>
                </div>
                <div class="admin-actions">
                    ${admin.role !== USER_ROLES.OWNER ? `
                        <button class="btn-danger btn-small" 
                                onclick="ownerManager.confirmRemoveAdmin('${admin.id}', '${admin.username}')">
                            Снять
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    renderAdminSelect() {
        const select = document.getElementById('admin-list');
        const nonOwnerAdmins = this.admins.filter(admin => admin.role !== USER_ROLES.OWNER);
        
        select.innerHTML = '<option value="">Выберите администратора</option>' +
            nonOwnerAdmins.map(admin => `
                <option value="${admin.id}">${admin.username} (${admin.email})</option>
            `).join('');
    }
    
    async assignAdmin() {
        const username = document.getElementById('assign-admin-name').value.trim();
        
        if (!username) {
            this.showNotification('Введите имя пользователя', 'error');
            return;
        }
        
        try {
            // Ищем пользователя
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error || !user) {
                this.showNotification('Пользователь не найден', 'error');
                return;
            }
            
            // Проверяем, не является ли уже администратором
            if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.OWNER) {
                this.showNotification('Пользователь уже является администратором', 'warning');
                return;
            }
            
            // Подтверждение
            if (!confirm(`Назначить пользователя "${username}" администратором?`)) {
                return;
            }
            
            // Обновляем роль
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: USER_ROLES.ADMIN })
                .eq('id', user.id);
            
            if (updateError) throw updateError;
            
            // Обновляем список
            await this.loadAdmins();
            
            // Очищаем поле
            document.getElementById('assign-admin-name').value = '';
            
            // Логируем
            await this.logAction(`Назначен администратор: ${username}`);
            
            this.showNotification(`Пользователь ${username} назначен администратором`, 'success');
            
        } catch (error) {
            console.error('Ошибка назначения администратора:', error);
            this.showNotification('Ошибка при назначении администратора', 'error');
        }
    }
    
    async removeAdmin() {
        const adminId = document.getElementById('admin-list').value;
        
        if (!adminId) {
            this.showNotification('Выберите администратора', 'error');
            return;
        }
        
        const admin = this.admins.find(a => a.id === adminId);
        if (!admin) return;
        
        await this.confirmRemoveAdmin(adminId, admin.username);
    }
    
    async confirmRemoveAdmin(adminId, username) {
        if (!confirm(`Снять администратора "${username}"?`)) {
            return;
        }
        
        try {
            // Возвращаем роль "игрок"
            const { error } = await supabase
                .from('users')
                .update({ role: USER_ROLES.PLAYER })
                .eq('id', adminId);
            
            if (error) throw error;
            
            // Обновляем списки
            await this.loadAdmins();
            
            // Логируем
            await this.logAction(`Снят администратор: ${username}`);
            
            this.showNotification(`Администратор ${username} снят`, 'success');
            
        } catch (error) {
            console.error('Ошибка снятия администратора:', error);
            this.showNotification('Ошибка при снятии администратора', 'error');
        }
    }
    
    async logAction(action) {
        if (!window.authManager.currentUser) return;
        
        try {
            await supabase
                .from('system_logs')
                .insert([
                    {
                        user_id: window.authManager.currentUser.id,
                        action: action,
                        details: JSON.stringify({ role: USER_ROLES.OWNER }),
                        timestamp: new Date().toISOString()
                    }
                ]);
        } catch (error) {
            console.error('Ошибка записи лога:', error);
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager.currentUser?.role === USER_ROLES.OWNER) {
        window.ownerManager = new OwnerManager();
    }
});
