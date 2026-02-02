// supabase-config.js - единственный файл для инициализации Supabase

// Конфигурация Supabase - ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ
const SUPABASE_URL = 'https://dkyqegxdcerlqnfvodjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreXFlZ3hkY2VybHFuZnZvZGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTc2NzQsImV4cCI6MjA4NTYzMzY3NH0.n6KO-IQMZboeOMCnJQw6gAs8DdWFDZpevAOWBQrxFWA';

// Инициализация Supabase
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Роли пользователей
const USER_ROLES = {
    OWNER: 'owner',
    ADMIN: 'admin',
    PLAYER: 'player'
};

// Проверка подключения
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count');
        if (error) throw error;
        console.log('Supabase подключен успешно');
        return true;
    } catch (error) {
        console.error('Ошибка подключения к Supabase:', error);
        return false;
    }
}

// Создание первого владельца при первом запуске
async function createInitialOwner() {
    try {
        const { data: existingOwners, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('role', USER_ROLES.OWNER)
            .limit(1);
        
        if (checkError) throw checkError;
        
        if (existingOwners.length === 0) {
            const passwordHash = btoa('admin123');
            
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        username: 'admin',
                        email: 'admin@bobix.com',
                        password_hash: passwordHash,
                        role: USER_ROLES.OWNER,
                        metadata: { is_initial: true }
                    }
                ]);
            
            if (error) throw error;
            
            console.log('Создан аккаунт владельца: admin / admin123');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка при создании владельца:', error);
        return false;
    }
}

// Создание таблиц (SQL для Supabase)
const CREATE_TABLES_SQL = `
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'player',
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Таблица игроков
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    pvp_rank VARCHAR(10) DEFAULT 'B+',
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица логов
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
`;

// Экспортируем всё для использования в других файлах
window.SupabaseConfig = {
    supabase,
    USER_ROLES,
    checkSupabaseConnection,
    createInitialOwner,
    CREATE_TABLES_SQL
};
