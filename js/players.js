class PlayersManager {
    constructor() {
        this.players = [];
        this.initEventListeners();
        this.loadPlayers();
    }
    
    initEventListeners() {
        // Обновление списка игроков
        document.getElementById('refresh-players').addEventListener('click', () => {
            this.loadPlayers();
        });
        
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }
    
    switchSection(section) {
        // Скрываем все разделы
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Скрываем все пункты меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Показываем выбранный раздел
        document.getElementById(`${section}-section`).classList.add('active');
        
        // Активируем пункт меню
        document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    }
    
    async loadPlayers() {
        try {
            const { data: players, error } = await supabase
                .from('players')
                .select('*')
                .order('score', { ascending: false });
            
            if (error) throw error;
            
            this.players = players || [];
            this.renderPlayers();
            
            // Обновляем статистику если пользователь админ
            if (window.authManager.currentUser?.role === USER_ROLES.ADMIN || 
                window.authManager.currentUser?.role === USER_ROLES.OWNER) {
                this.updateAdminStats();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки игроков:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    }
    
    renderPlayers() {
        const container = document.getElementById('players-list');
        
        if (this.players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Игроки не найдены</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.players.map(player => `
            <div class="player-card">
                <div class="player-header">
                    <div class="player-avatar">${player.username.charAt(0)}</div>
                    <div class="player-info">
                        <h3>${player.username}</h3>
                        <span class="player-rank ${this.getRankClass(player.pvp_rank)}">
                            ${player.pvp_rank}
                        </span>
                        ${player.is_vip ? '<span class="vip-badge">VIP</span>' : ''}
                    </div>
                </div>
                <div class="player-stats">
                    <div class="stat">
                        <span class="stat-value">${player.total_wins}</span>
                        <span class="stat-label">Побед</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${player.total_losses}</span>
                        <span class="stat-label">Поражений</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${player.score}</span>
                        <span class="stat-label">Очки</span>
                    </div>
                </div>
                <div class="player-actions">
                    <button class="btn-small" onclick="playersManager.viewPlayer('${player.id}')">
                        Просмотр
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getRankClass(rank) {
        const rankClasses = {
            'SSS+': 'rank-sss',
            'SS+': 'rank-ss',
            'S+': 'rank-s',
            'A+': 'rank-a',
            'B+': 'rank-b'
        };
        return rankClasses[rank] || 'rank-b';
    }
    
    async updateAdminStats() {
        try {
            // Общее количество игроков
            const { count: totalPlayers } = await supabase
                .from('players')
                .select('*', { count: 'exact' });
            
            // Количество онлайн (за последние 15 минут)
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const { count: onlinePlayers } = await supabase
                .from('players')
                .select('*', { count: 'exact' })
                .gt('updated_at', fifteenMinutesAgo);
            
            // Общее количество матчей
            const { data: players } = await supabase
                .from('players')
                .select('total_wins, total_losses');
            
            let totalMatches = 0;
            if (players) {
                totalMatches = players.reduce((sum, player) => 
                    sum + (player.total_wins || 0) + (player.total_losses || 0), 0);
            }
            
            // Обновляем UI
            document.getElementById('total-players').textContent = totalPlayers || 0;
            document.getElementById('online-players').textContent = onlinePlayers || 0;
            document.getElementById('total-matches').textContent = totalMatches;
            
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
        }
    }
    
    viewPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        this.showModal(
            `Игрок: ${player.username}`,
            `
                <div class="player-details">
                    <div class="detail-row">
                        <span class="detail-label">Никнейм:</span>
                        <span class="detail-value">${player.nickname || 'Не указан'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">PvP Ранг:</span>
                        <span class="detail-value ${this.getRankClass(player.pvp_rank)}">
                            ${player.pvp_rank}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Статистика:</span>
                        <span class="detail-value">
                            ${player.total_wins}W / ${player.total_losses}L
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Очки рейтинга:</span>
                        <span class="detail-value">${player.score}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">VIP статус:</span>
                        <span class="detail-value">
                            ${player.is_vip ? '✅ Да' : '❌ Нет'}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Дата регистрации:</span>
                        <span class="detail-value">
                            ${new Date(player.created_at).toLocaleDateString('ru-RU')}
                        </span>
                    </div>
                </div>
            `
        );
    }
    
    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'block';
        
        // Закрытие модального окна
        document.querySelector('.modal-close').onclick = () => {
            document.getElementById('modal').style.display = 'none';
        };
        
        window.onclick = (event) => {
            if (event.target === document.getElementById('modal')) {
                document.getElementById('modal').style.display = 'none';
            }
        };
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
    window.playersManager = new PlayersManager();
});
