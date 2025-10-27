# Script para corrigir encoding UTF-8 corrompido
$ErrorActionPreference = "Stop"

$replacements = @{
    'ðŸ"'' = '🔒'
    'ðŸŽ¯' = '🎯'
    'ðŸŽ´' = '🎴'
    'ðŸ'¾' = '💾'
    'ðŸ"§' = '🔧'
    'ðŸ"„' = '🔄'
    'ðŸ"Ž' = '🔎'
    'âœ…' = '✅'
    'â€¢' = '•'
    'sÃ³' = 'só'
    'UsuÃ¡rio' = 'Usuario'
    'avanÃ§ada' = 'avançada'
    'jÃ¡' = 'já'
    'nÃ£o' = 'não'
    'operaÃ§Ã£o' = 'operação'
    'sÃ­ncrona' = 'síncrona'
    'AtualizaÃ§Ã£o' = 'Atualização'
    'crÃ­ticos' = 'críticos'
    'crÃ­tico' = 'crítico'
    'estÃ¡' = 'está'
    'funÃ§Ã£o' = 'função'
    'temporÃ¡rio' = 'temporário'
    'DependÃªncias' = 'Dependências'
    'disponÃ­vel' = 'disponível'
    'vocÃª' = 'você'
    'seleÃ§Ã£o' = 'seleção'
    'edição' = 'edição'
    'versão' = 'versão'
    'português' = 'português'
    'página' = 'página'
    'confirmação' = 'confirmação'
    'remoção' = 'remoção'
    'deleção' = 'deleção'
}

$files = @(
    'src\pages\Deckbuilder.jsx',
    'src\pages\Home.jsx',
    'src\components\deck\DeleteQuantityDialog.jsx',
    'src\components\deck\ArtSelector.jsx',
    'src\services\translator.ts'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processando: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        
        foreach ($key in $replacements.Keys) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
        }
        
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Corrigido"
    }
}

Write-Host "`n✅ Todos os arquivos foram corrigidos!"
