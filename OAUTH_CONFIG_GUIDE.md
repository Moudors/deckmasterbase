# 🔐 Guia de Configuração OAuth Google

## ✅ Checklist de Configuração

### 1️⃣ **Supabase Dashboard**
Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers

#### Configurações do Provider Google:
- ✅ **Google Enabled**: ON
- ✅ **Client ID**: (do Google Cloud Console)
- ✅ **Client Secret**: (do Google Cloud Console)

#### Site URL:
```
https://deckmasterbase.vercel.app
```

#### Redirect URLs (adicione TODAS):
```
https://ygzyshbfmcwegxgqcuwr.supabase.co/auth/v1/callback
https://deckmasterbase.vercel.app
https://deckmasterbase.vercel.app/
http://localhost:3000
http://localhost:3000/
```

---

### 2️⃣ **Google Cloud Console**
Acesse: https://console.cloud.google.com/apis/credentials

#### Criar/Editar OAuth 2.0 Client ID:

**URIs de redirecionamento autorizados:**
```
https://ygzyshbfmcwegxgqcuwr.supabase.co/auth/v1/callback
```

**Origens JavaScript autorizadas:**
```
https://deckmasterbase.vercel.app
http://localhost:3000
```

---

### 3️⃣ **Fluxo OAuth Atual**

```
1. Usuário clica "Login com Google"
   ↓
2. signInWithGoogle() é chamado
   - redirectTo: "https://deckmasterbase.vercel.app/"
   ↓
3. Redirect para Google OAuth
   ↓
4. Usuário autoriza no Google
   ↓
5. Google redireciona para Supabase:
   "https://ygzyshbfmcwegxgqcuwr.supabase.co/auth/v1/callback"
   ↓
6. Supabase processa tokens e redireciona para:
   "https://deckmasterbase.vercel.app/#access_token=XXX&..."
   ↓
7. App.tsx detecta hash fragments
   ↓
8. useAuthState() atualiza com usuário
   ↓
9. Redirect para home "/"
```

---

### 4️⃣ **Verificação em Produção**

#### Console do navegador deve mostrar:
```
🔄 Iniciando login com Google
📍 Redirect URL: https://deckmasterbase.vercel.app/
🌐 Origin: https://deckmasterbase.vercel.app
✅ OAuth iniciado, aguardando redirect...

[Após redirect do Google]

🔄 Callback OAuth detectado, processando tokens...
✅ Usuário autenticado, redirecionando para home...
```

---

### 5️⃣ **Troubleshooting**

#### ❌ Redireciona para /login sem hash:
- Verificar se o **Client ID** e **Client Secret** estão corretos no Supabase
- Verificar se a URL de callback do Supabase está no Google Cloud Console

#### ❌ Erro "redirect_uri_mismatch":
- Adicionar `https://SEU_PROJETO.supabase.co/auth/v1/callback` no Google Cloud Console

#### ❌ Não detecta o callback:
- Verificar se `detectSessionInUrl: true` está no supabase.ts
- Verificar console do navegador para erros

#### ❌ Loop infinito de redirect:
- Verificar se `replace: true` está no navigate() do App.tsx e LoginPage.tsx

---

### 6️⃣ **URLs Importantes**

**Supabase Project URL:**
```
https://ygzyshbfmcwegxgqcuwr.supabase.co
```

**Callback URL (Google Cloud Console):**
```
https://ygzyshbfmcwegxgqcuwr.supabase.co/auth/v1/callback
```

**Production URL (Vercel):**
```
https://deckmasterbase.vercel.app
```

**Local Development:**
```
http://localhost:3000
```

---

## 🧪 Testando Localmente

1. Certifique-se que o `.env` tem:
```env
REACT_APP_SUPABASE_URL=https://ygzyshbfmcwegxgqcuwr.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

2. Adicione no Google Cloud Console:
```
http://localhost:3000
```

3. Teste o fluxo:
```bash
npm start
```

4. Acesse: http://localhost:3000/login
5. Clique em "Login com Google"
6. Autorize no Google
7. Deve redirecionar para: http://localhost:3000/#access_token=...
8. App detecta e redireciona para: http://localhost:3000/

---

## 📝 Notas Importantes

- ⚠️ O Supabase **SEMPRE** usa hash fragments (#) para passar tokens, não query params (?)
- ⚠️ O callback do Google vai para o Supabase primeiro, não para o app diretamente
- ⚠️ O `redirectTo` especifica para onde o Supabase redireciona DEPOIS de processar
- ✅ `detectSessionInUrl: true` é essencial para o Supabase processar os tokens
- ✅ `skipBrowserRedirect: false` garante que o redirect aconteça
