# 📥 Sistema de Importação de Decks - DeckMaster

## 🎯 Visão Geral

O sistema de importação aceita **automaticamente** múltiplos formatos de deck lista, detectando o formato e processando as cartas corretamente.

---

## 🔍 Detecção Automática de Formato

O sistema analisa o texto colado e identifica automaticamente um dos seguintes formatos:

### 1️⃣ **PLAIN_TEXT** (Texto Simples)
Formato básico, uma carta por linha com quantidade.

**Exemplo:**
```
4 Lightning Bolt
2 Counterspell
1 Black Lotus
10 Island
```

**Regras:**
- Formato: `<quantidade> <nome da carta>`
- Aceita `4x Lightning Bolt` ou `4 Lightning Bolt`
- Se não tiver quantidade, assume 1

---

### 2️⃣ **TEXT_STANDARD** (Texto com Categorias)
Formato usado por Moxfield, Archidekt, etc.

**Exemplo:**
```
Commander (1)
1 Atraxa, Praetors' Voice

Creatures (10)
4 Birds of Paradise
2 Llanowar Elves
4 Noble Hierarch

Instants (5)
2 Swords to Plowshares
3 Counterspell
```

**Regras:**
- Linhas de categoria são ignoradas: `Creatures (10)`
- Cartas seguem formato: `<quantidade> <nome>`
- Linhas vazias são ignoradas

---

### 3️⃣ **MTGA** (MTG Arena)
Formato nativo do MTG Arena.

**Exemplo:**
```
Deck
4 Lightning Bolt (LEA) 162
1 Black Lotus (LEA) 232
10 Island (M21) 265
```

**Regras:**
- Primeira linha deve ser `Deck`
- Formato: `<quantidade> <nome> (<set>) <número>`
- Set e número são ignorados na importação (buscamos pelo nome)

---

### 4️⃣ **JSON** (JSON Simples ou API)
Formatos JSON estruturados.

**Exemplo JSON_EXPORT:**
```json
{
  "deck_name": "Meu Deck",
  "cards": [
    {"name": "Lightning Bolt", "quantity": 4},
    {"name": "Counterspell", "quantity": 2}
  ]
}
```

**Exemplo API_JSON:**
```json
{
  "deck_name": "Atraxa Tokens",
  "format": "Commander",
  "cards": [
    {"id": "12345", "name": "Birds of Paradise", "qty": 1},
    {"id": "67890", "name": "Swords to Plowshares", "qty": 2}
  ]
}
```

**Exemplo com Commander:**
```json
{
  "commander": "Atraxa, Praetors' Voice",
  "cards": [
    {"name": "Birds of Paradise", "quantity": 1}
  ]
}
```

**Regras:**
- Aceita `quantity` ou `qty`
- Aceita `name` ou `card_name`
- Commander é adicionado como carta com quantidade 1
- Array direto também é aceito

---

### 5️⃣ **CSV** (Planilha)
Formato de tabela para Excel, Google Sheets.

**Exemplo:**
```csv
Quantity,Name,Set,CollectorNumber
4,Lightning Bolt,LEA,162
2,Counterspell,LEA,55
1,Black Lotus,LEA,232
```

**Regras:**
- Primeira linha (header) é ignorada
- Colunas: Quantity, Name, Set (opcional), CollectorNumber (opcional)
- Separador: vírgula (`,`)

---

### 6️⃣ **APP_DECK_FILE** (Cockatrice, XMage, Forge)
Formato usado por aplicativos de mesa.

**Exemplo:**
```
[Commander]
1 Atraxa, Praetors' Voice

[Creatures]
4 Birds of Paradise
2 Noble Hierarch

[Instants]
2 Swords to Plowshares
```

**Regras:**
- Categorias entre colchetes `[Creatures]`
- Linhas de categoria são ignoradas
- Formato: `<quantidade> <nome>`

---

## 🔧 Como Funciona a Detecção

1. **JSON**: Detecta se começa com `{` ou `[`
2. **CSV**: Detecta vírgulas + header com "quantity"
3. **MTGA**: Detecta se começa com "Deck\n"
4. **APP_DECK_FILE**: Detecta categorias entre colchetes `[...]`
5. **TEXT_STANDARD**: Detecta padrão de categoria `Nome (Contagem)`
6. **PLAIN_TEXT**: Formato padrão (fallback)

---

## ✨ Funcionalidades

### 🎨 **Interface Visual**
- ✅ Detecção automática exibida em badge azul
- ✅ Lista de formatos suportados sempre visível
- ✅ Textarea grande (320px) com scroll
- ✅ Ícone de upload no título
- ✅ Placeholder com exemplo

### 🛡️ **Validação**
- ✅ Verifica se há cartas após parse
- ✅ Alerta se nenhuma carta for detectada
- ✅ Try-catch para JSON inválido
- ✅ Feedback visual durante importação

### 📊 **Logs de Debug**
```javascript
console.log("📥 Formato detectado:", format);
console.log("📋 Cartas a importar:", cards);
```

---

## 📝 Exemplos de Uso

### Importar do MTG Arena
1. Abra MTG Arena
2. Vá no deck e clique em "Export"
3. Copie todo o texto (começando com "Deck")
4. Cole no modal de importação
5. ✅ Detectado como **MTGA**

### Importar de Moxfield
1. Abra Moxfield e vá no deck
2. Clique em "Export" > "Text"
3. Copie a lista com categorias
4. Cole no modal
5. ✅ Detectado como **TEXT_STANDARD**

### Importar JSON de API
1. Receba JSON de uma API
2. Cole diretamente no modal
3. ✅ Detectado como **JSON**

### Importar CSV do Excel
1. Exporte planilha como CSV
2. Copie o conteúdo
3. Cole no modal
4. ✅ Detectado como **CSV**

---

## 🚀 Melhorias Futuras

### Prioridade Alta
- [ ] Upload de arquivo (.txt, .json, .csv)
- [ ] Validação de nomes de cartas via Scryfall
- [ ] Preview de cartas antes de importar
- [ ] Opção de substituir ou adicionar ao deck atual

### Prioridade Média
- [ ] Suporte a sideboard
- [ ] Importação de múltiplos decks de uma vez
- [ ] Histórico de importações
- [ ] Detecção de formato com IA

### Prioridade Baixa
- [ ] Importação de imagens de deck lista
- [ ] OCR para texto de imagem
- [ ] Suporte a formatos de outras línguas

---

## 🐛 Tratamento de Erros

### Casos Cobertos
- ✅ JSON inválido → Tenta como texto simples
- ✅ Formato desconhecido → Usa PLAIN_TEXT
- ✅ Nenhuma carta detectada → Alerta ao usuário
- ✅ Erro durante importação → Exibe mensagem de erro

### Casos a Melhorar
- [ ] Cartas com nomes inválidos
- [ ] Quantidades negativas ou zero
- [ ] Formatos híbridos (mistura de formatos)

---

## 💡 Dicas para Usuários

1. **Cole todo o texto de uma vez** - Não precisa editar antes
2. **Formatos misturados não são suportados** - Use um formato por vez
3. **O sistema detecta automaticamente** - Não precisa selecionar o formato
4. **Nomes devem ser exatos** - Acentuação e caracteres especiais importam
5. **Quantidade é opcional** - Se não tiver, assume 1

---

## 🔗 Compatibilidade

### ✅ Totalmente Compatível
- MTG Arena
- MTGO
- Moxfield
- Archidekt
- Cockatrice
- XMage
- Forge
- Qualquer exportação do DeckMaster

### ⚠️ Parcialmente Compatível
- TappedOut (pode precisar formatação)
- EDHRec (depende do formato)
- Scryfall (funciona mas pode ter extras)

### ❌ Não Compatível
- Imagens de deck lista
- PDF
- Formatos proprietários criptografados

---

**Última atualização:** Novembro 2025  
**Versão:** 2.0
