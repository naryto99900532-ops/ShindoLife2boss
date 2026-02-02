// Инициализация Supabase
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);
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
            // Хешируем пароль (в продакшене используйте bcrypt)
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
