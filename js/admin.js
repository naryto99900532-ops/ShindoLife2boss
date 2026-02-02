// admin.js
class AdminManager {
    constructor() {
        this.supabase = window.SupabaseConfig.supabase;
        this.USER_ROLES = window.SupabaseConfig.USER_ROLES;
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Действия админ-панели
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleAction(action);
            });
        });
    }
    
    handleAction(action) {
        switch(action) {
            case 'add-player':
                this.showAddPlayerForm();
                break;
            case 'edit-player':
                this.showEditPlayerForm();
                break;
            case 'manage-pvp':
                this.showPvPManagement();
                break;
        }
    }
    
    showAddPlayerForm() {
        if (!window.playersManager) return;
        
        window.playersManager.showModal(
            'Добавить игрока',
            `
                <form id="add-player-form" class="modal-form">
                    <div class="form-group">
                        <label>Имя в Roblox*</label>
                        <input type="text" id="new-player-username" required>
                    </div>
                    <div class="form-group">
                        <label>Никнейм в Discord</label>
                        <input type="text" id="new-player-nickname">
                    </div>
                    <div class="form-group">
                        <label>Начальный ранг PvP</label>
                        <select id="new-player-rank">
                            <option value="B+">B+</option>
                            <option value="A+">A+</option>
                            <option value="S+">S+</option>
                            <option value="SS+">SS+</option>
                            <option value="SSS+">SSS+</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="new-player-vip">
                            VIP статус
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Добавить</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modal').style.display='none'">
                            Отмена
                        </button>
                    </div>
                </form>
            `
        );
        
        // Обработка формы
        document.getElementById('add-player-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addPlayer();
        });
    }
    
    async addPlayer() {
        const username = document.getElementById('new-player-username').value.trim();
        const nickname = document.getElementById('new-player-nickname').value.trim();
        const pvpRank = document.getElementById('new-player-rank').value;
        const isVip = document.getElementById('new-player-vip').checked;
        
        if (!username) {
            this.showNotification('Введите имя игрока', 'error');
            return;
        }
        
        try {
            // Проверяем, существует ли игрок
            const { data: existingPlayer, error: checkError } = await this.supabase
                .from('players')
                .select('id')
                .eq('username', username)
                .single();
            
            if (existingPlayer) {
                this.showNotification('Игрок уже существует', 'error');
                return;
            }
            
            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }
            
            // Добавляем игрока
            const { data: player, error } = await this.supabase
                .from('players')
                .insert([
                    {
                        username,
                        nickname: nickname || null,
                        pvp_rank: pvpRank,
                        is_vip: isVip,
                        score: this.calculateInitialScore(pvpRank)
                    }
                ])
                .select()
                .single();
            
            if (error) throw error;
            
            // Обновляем список
            if (window.playersManager) {
                await window.playersManager.loadPlayers();
            }
            
            // Закрываем модальное окно
            document.getElementById('modal').style.display = 'none';
            
            // Логируем действие
            await this.logAction(`Добавлен игрок: ${username}`);
            
            this.showNotification('Игрок успешно добавлен', 'success');
            
        } catch (error) {
            console.error('Ошибка добавления игрока:', error);
            this.showNotification('Ошибка при добавлении игрока', 'error');
        }
    }
    
    calculateInitialScore(rank) {
        const rankScores = {
            'B+': 100,
            'A+': 300,
            'S+': 500,
            'SS+': 700,
            'SSS+': 1000
        };
        return rankScores[rank] || 100;
    }
    
    showEditPlayerForm() {
        this.showNotification('Функция редактирования в разработке', 'info');
    }
    
    showPvPManagement() {
        this.showNotification('Функция управления PvP в разработке', 'info');
    }
    
    async logAction(action) {
        const currentUser = window.authManager?.currentUser;
        if (!currentUser) return;
        
        try {
            await this.supabase
                .from('system_logs')
                .insert([
                    {
                        user_id: currentUser.id,
                        action: action,
                        details: JSON.stringify({ role: currentUser.role }),
                        timestamp: new Date().toISOString()
                    }
                ]);
        } catch (error) {
            console.error('Ошибка записи лога:', error);
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.authManager?.currentUser;
    if (currentUser && 
        (currentUser.role === window.SupabaseConfig.USER_ROLES.ADMIN || 
         currentUser.role === window.SupabaseConfig.USER_ROLES.OWNER)) {
        window.adminManager = new AdminManager();
    }
});
