// Script para testar login e navegação
// Execute no console do navegador (F12 -> Console)

console.log('=== TESTE DE LOGIN E NAVEGAÇÃO ===');

// Função para testar login completo
window.testLoginFlow = async (email = 'teste@deckmaster.com', password = 'teste123456') => {
    console.log('🔐 Testando fluxo de login...');
    
    try {
        // 1. Verificar estado inicial
        const initialSession = await window.supabase.auth.getSession();
        console.log('1️⃣ Estado inicial:', initialSession.data.session ? 'Logado' : 'Não logado');
        
        // 2. Fazer logout se necessário
        if (initialSession.data.session) {
            console.log('2️⃣ Fazendo logout primeiro...');
            await window.supabase.auth.signOut();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 3. Tentar login
        console.log('3️⃣ Fazendo login...');
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
            
            // Se usuário não existe, tentar criar
            if (error.message.includes('Invalid login credentials')) {
                console.log('4️⃣ Usuário não existe, criando...');
                const signUpResult = await window.supabase.auth.signUp({
                    email: email,
                    password: password
                });
                
                if (signUpResult.error) {
                    console.error('❌ Erro ao criar usuário:', signUpResult.error);
                    return false;
                } else {
                    console.log('✅ Usuário criado:', signUpResult.data.user?.email);
                    // Tentar login novamente
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return await window.testLoginFlow(email, password);
                }
            }
            return false;
        }
        
        // 4. Verificar se login foi bem-sucedido
        console.log('4️⃣ Login realizado:', data.user?.email);
        
        // 5. Aguardar um pouco e verificar o estado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalSession = await window.supabase.auth.getSession();
        console.log('5️⃣ Estado final:', finalSession.data.session ? 'Logado' : 'Não logado');
        
        // 6. Simular navegação
        console.log('6️⃣ Simulando navegação para home...');
        window.location.hash = '#/';
        
        return true;
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return false;
    }
};

// Função para verificar estado atual
window.checkAuthState = async () => {
    console.log('=== VERIFICANDO ESTADO DE AUTENTICAÇÃO ===');
    
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return null;
        }
        
        if (session?.user) {
            console.log('✅ Usuário logado:', {
                id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at
            });
            
            // Testar busca de decks
            const { data: decks, error: deckError } = await window.supabase
                .from('decks')
                .select('*')
                .eq('owner_id', session.user.id);
                
            if (deckError) {
                console.error('❌ Erro ao buscar decks:', deckError);
            } else {
                console.log('📦 Decks do usuário:', decks.length);
            }
            
            return session.user;
        } else {
            console.log('ℹ️ Usuário não logado');
            return null;
        }
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        return null;
    }
};

console.log('=== COMANDOS DISPONÍVEIS ===');
console.log('testLoginFlow() - Testar fluxo completo de login');
console.log('checkAuthState() - Verificar estado atual de autenticação');
console.log('testLoginFlow("email", "senha") - Login personalizado');