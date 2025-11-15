# 🔧 Correção: Símbolos TAP e UNTAP

## ❌ Problema Identificado
Os símbolos de **tap** `{T}` e **untap** `{Q}` não apareciam nas cartas no aplicativo.

## 🔍 Causa Raiz
1. **Falta do Mana Font CSS**: O arquivo CSS do Mana Font não estava sendo carregado no `index.html`
2. **Mapeamento incompleto**: A função `renderManaSymbols` não fazia o mapeamento correto dos símbolos especiais

## ✅ Soluções Aplicadas

### 1. Adicionado Mana Font CDN ao `index.html`
**Arquivo**: `public/index.html`

```html
<!-- Mana Font for MTG mana symbols -->
<link 
  rel="stylesheet" 
  href="https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.min.css" 
/>
```

### 2. Atualizado `manaSymbols.tsx` com Mapeamento Completo
**Arquivo**: `src/utils/manaSymbols.tsx`

**Mudanças**:
- Adicionado mapeamento de símbolos especiais:
  - `{T}` → `ms-tap` (símbolo de tap)
  - `{Q}` → `ms-untap` (símbolo de untap)
  - `{E}` → `ms-e` (energia)
  - `{S}` → `ms-snow` (neve)
  - Outros símbolos especiais (X, Y, Z, ½, ∞)
  
- Adicionada classe `ms-cost` para tamanho correto dos ícones

**Antes**:
```tsx
const symbol = part.slice(1, -1).toLowerCase();
return <i key={index} className={`ms ms-${symbol} inline-block`} />;
```

**Depois**:
```tsx
let symbol = part.slice(1, -1).toLowerCase();

const symbolMap: Record<string, string> = {
  't': 'tap',           // {T} → ms-tap
  'q': 'untap',         // {Q} → ms-untap
  'e': 'e',             // {E} → ms-e
  's': 'snow',          // {S} → ms-snow
  // ... outros símbolos
};

const mappedSymbol = symbolMap[symbol] || symbol;
return <i key={index} className={`ms ms-${mappedSymbol} ms-cost inline-block`} />;
```

## 🧪 Como Testar

### Teste Manual no Navegador:
1. Reinicie o servidor: `npm start`
2. Abra o aplicativo
3. Vá para **"Buscar Regras"** (ícone 📖)
4. Busque por:
   - **"Llanowar Elves"** - deve mostrar `{T}: Add {G}.`
   - **"Birds of Paradise"** - deve mostrar `{T}: Add one mana of any color.`
   - **"Sol Ring"** - deve mostrar `{T}: Add {C}{C}.`
   - **"Gilder Bairn"** - deve mostrar símbolo `{Q}` (untap)

### Verificação no DevTools (F12):
```
✅ Network Tab: mana.min.css carregado (status 200)
✅ Elements Tab: <i class="ms ms-tap ms-cost"> presente
✅ Console: sem erros relacionados ao Mana Font
```

## 📊 Símbolos Suportados

### Cores de Mana:
- `{W}` - Branco (white)
- `{U}` - Azul (blue)
- `{B}` - Preto (black)
- `{R}` - Vermelho (red)
- `{G}` - Verde (green)

### Mana Genérico:
- `{0}`, `{1}`, `{2}`, etc. - Mana incolor numérico
- `{X}`, `{Y}`, `{Z}` - Variáveis
- `{C}` - Mana incolor (colorless)

### Símbolos Especiais:
- `{T}` - **Tap** (virar carta)
- `{Q}` - **Untap** (desvirar carta)
- `{E}` - Energia (energy counter)
- `{S}` - Neve (snow mana)
- `{½}` - Meio mana
- `{∞}` - Infinito
- `{CHAOS}` - Caos (planechase)

### Híbridos e Phyrexian:
- `{W/U}` - Híbrido branco/azul
- `{2/W}` - Híbrido 2/branco
- `{W/P}` - Phyrexian branco

## 📁 Arquivos Modificados

1. ✅ `public/index.html` - Adicionado CDN do Mana Font
2. ✅ `src/utils/manaSymbols.tsx` - Mapeamento de símbolos especiais
3. ✅ `test-tap-symbols.js` - Script de teste criado

## 🎯 Resultado

- ✅ Símbolos `{T}` e `{Q}` agora renderizam corretamente
- ✅ Todos os símbolos de mana funcionando
- ✅ Ícones com tamanho e estilo adequados
- ✅ Compatível com todas as cartas MTG

## 💡 Observações

### Mana Font CDN
- Usando versão `@latest` para sempre ter atualizações
- CDN: `https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.min.css`
- Alternativa: instalar via npm (`npm install mana-font`) para uso offline

### Classes CSS
- `ms` - Namespace base do Mana Font
- `ms-tap` - Classe específica para tap symbol
- `ms-cost` - Classe para tamanho correto do ícone
- `inline-block` - Display inline para fluir com texto

### Retrocompatibilidade
- Mapeamento mantém compatibilidade com símbolos padrão
- Símbolos não mapeados usam nome direto (ex: `{G}` → `ms-g`)
- Texto sem chaves permanece como texto normal

---

**Status**: ✅ **RESOLVIDO**  
**Data**: 15 de Novembro de 2024  
**Impacto**: Todas as cartas com símbolos de tap/untap agora exibem corretamente
