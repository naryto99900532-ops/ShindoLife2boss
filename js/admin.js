class AdminManager {
    constructor() {
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
            window.playersManager.showNotification('Введите имя игрока', 'error');
            return;
        }
        
        try {
            // Проверяем, существует ли игрок
            const { data: existingPlayer } = await supabase
                .from('players')
                .select('id')
                .eq('username', username)
                .single();
            
            if (existingPlayer) {
                window.playersManager.showNotification('Игрок уже существует', 'error');
                return;
            }
            
            // Добавляем игрока
            const { data: player, error } = await supabase
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
            await window.playersManager.loadPlayers();
            
            // Закрываем модальное окно
            document.getElementById('modal').style.display = 'none';
            
            // Логируем действие
            await this.logAction(`Добавлен игрок: ${username}`);
            
            window.playersManager.showNotification('Игрок успешно добавлен', 'success');
            
        } catch (error) {
            console.error('Ошибка добавления игрока:', error);
            window.playersManager.showNotification('Ошибка при добавлении игрока', 'error');
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
    
    async logAction(action) {
        if (!window.authManager.currentUser) return;
        
        try {
            await supabase
                .from('system_logs')
                .insert([
                    {
                        user_id: window.authManager.currentUser.id,
                        action: action,
                        details: JSON.stringify({ role: window.authManager.currentUser.role }),
                        timestamp: new Date().toISOString()
                    }
                ]);
        } catch (error) {
            console.error('Ошибка записи лога:', error);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager.currentUser?.role === USER_ROLES.ADMIN || 
        window
