// Script para capturar e debugar erros
// Execute no console do navegador (F12 -> Console)

console.log('=== CAPTURA DE ERROS ATIVA ===');

// Capturar erros JavaScript
window.addEventListener('error', (event) => {
    console.error('🚨 ERRO JAVASCRIPT:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Capturar erros de Promise rejeitadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 PROMISE REJEITADA:', {
        reason: event.reason,
        promise: event.promise
    });
});

// Função para verificar estado geral
window.checkAppState = () => {
    console.log('=== VERIFICANDO ESTADO DO APP ===');
    
    // 1. Verificar React
    if (window.React) {
        console.log('✅ React carregado');
    } else {
        console.log('❌ React não encontrado');
    }
    
    // 2. Verificar Supabase
    if (window.supabase) {
        console.log('✅ Supabase carregado');
    } else {
        console.log('❌ Supabase não encontrado');
    }
    
    // 3. Verificar URL atual
    console.log('🔗 URL atual:', window.location.href);
    console.log('🔗 Hash:', window.location.hash);
    console.log('🔗 Pathname:', window.location.pathname);
    
    // 4. Verificar React Router
    const rootElement = document.getElementById('root');
    if (rootElement) {
        console.log('✅ Root element encontrado');
        console.log('📄 Conteúdo do root:', rootElement.innerHTML.length > 0 ? 'TEM CONTEÚDO' : 'VAZIO');
    } else {
        console.log('❌ Root element não encontrado');
    }
    
    // 5. Verificar console por erros
    console.log('🔍 Verificar acima por erros em vermelho');
};

// Função para forçar navegação
window.forceNavigate = (path) => {
    console.log('🔄 Forçando navegação para:', path);
    
    // Múltiplas tentativas de navegação
    try {
        // Método 1: pushState
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', path);
            window.dispatchEvent(new PopStateEvent('popstate'));
            console.log('✅ pushState executado');
        }
        
        // Método 2: hash
        window.location.hash = '#' + path;
        console.log('✅ hash atualizado');
        
        // Método 3: location.href (mais drástico)
        setTimeout(() => {
            window.location.href = path;
            console.log('✅ location.href executado');
        }, 1000);
        
    } catch (err) {
        console.error('❌ Erro na navegação:', err);
    }
};

// Função para debug de autenticação
window.debugAuth = async () => {
    console.log('=== DEBUG DE AUTENTICAÇÃO ===');
    
    try {
        if (!window.supabase) {
            console.error('❌ Supabase não disponível');
            return;
        }
        
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return;
        }
        
        if (session?.user) {
            console.log('✅ Usuário autenticado:', {
                id: session.user.id,
                email: session.user.email,
                created_at: session.user.created_at
            });
            
            // Testar busca de decks
            const { data: decks, error: deckError } = await window.supabase
                .from('decks')
                .select('id, name, format, cover_image_url')
                .eq('owner_id', session.user.id);
                
            if (deckError) {
                console.error('❌ Erro ao buscar decks:', deckError);
            } else {
                console.log('📦 Decks encontrados:', decks.length);
                if (decks.length > 0) {
                    console.log('🎯 Primeiro deck:', decks[0]);
                    
                    // Testar navegação para o primeiro deck
                    console.log('🔄 Para testar navegação, execute:');
                    console.log(`forceNavigate('/deckbuilder/${decks[0].id}')`);
                }
            }
            
        } else {
            console.log('❌ Usuário não autenticado');
            console.log('Para fazer login, execute: window.supabase.auth.signInWithPassword({email: "seu-email", password: "sua-senha"})');
        }
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
};

// Executar verificação inicial
setTimeout(() => {
    checkAppState();
    debugAuth();
}, 2000);

console.log('=== COMANDOS DISPONÍVEIS ===');
console.log('checkAppState() - Verificar estado geral');
console.log('debugAuth() - Debug de autenticação e decks');
console.log('forceNavigate("/path") - Forçar navegação');
console.log('🔍 Observe o console por erros em vermelho!');