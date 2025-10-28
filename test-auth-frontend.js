// Script para testar e debugar autenticação
// Execute no console do navegador (F12 -> Console)

console.log('=== TESTE DE AUTENTICAÇÃO ===');

// 1. Verificar se o supabase está disponível
if (typeof window.supabase !== 'undefined') {
    console.log('✅ Supabase client encontrado');
    
    // 2. Verificar sessão atual
    window.supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return;
        }
        
        if (session) {
            console.log('✅ Usuário autenticado:', {
                id: session.user.id,
                email: session.user.email,
                session: session
            });
            
            // 3. Testar query de decks
            window.supabase
                .from('decks')
                .select('*')
                .eq('owner_id', session.user.id)
                .then(({ data, error }) => {
                    if (error) {
                        console.error('❌ Erro ao buscar decks:', error);
                    } else {
                        console.log('📦 Decks encontrados:', data);
                        console.log('📊 Total de decks:', data.length);
                    }
                });
                
        } else {
            console.log('❌ Usuário NÃO autenticado');
            console.log('Redirecionando para login...');
            
            // Tentar fazer login (opcional)
            console.log('Para fazer login, execute:');
            console.log('window.supabase.auth.signInWithPassword({email: "seu-email", password: "sua-senha"})');
        }
    });
    
} else {
    console.error('❌ Supabase client não encontrado');
    console.log('Verificando importações...');
    
    // Verificar se existem outros objetos relacionados
    const possibleNames = ['supabase', 'supabaseClient', 'client'];
    possibleNames.forEach(name => {
        if (window[name]) {
            console.log(`✅ Encontrado: window.${name}`);
        }
    });
}

// 4. Verificar localStorage para tokens
console.log('=== VERIFICAR TOKENS NO STORAGE ===');
const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('token')
);
console.log('🔑 Chaves de auth encontradas:', authKeys);
authKeys.forEach(key => {
    console.log(`${key}:`, localStorage.getItem(key));
});

// 5. Função helper para login rápido
window.quickLogin = async (email, password) => {
    if (!email || !password) {
        console.log('❌ Email e senha são obrigatórios');
        console.log('Uso: quickLogin("seu-email@exemplo.com", "sua-senha")');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
        } else {
            console.log('✅ Login realizado com sucesso:', data);
            // Recarregar a página para atualizar o estado
            setTimeout(() => window.location.reload(), 1000);
        }
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
};

console.log('=== COMANDOS DISPONÍVEIS ===');
console.log('quickLogin("email", "senha") - Fazer login rápido');
console.log('window.supabase.auth.getUser() - Verificar usuário atual');
console.log('window.supabase.auth.signOut() - Fazer logout');