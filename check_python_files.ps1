# Check all Python files for syntax errors
$backendDir = "C:\Users\Hayyuu\volcanostrat-ai\backend"

Get-ChildItem -Path "$backendDir" -Filter "*.py" -Recurse | ForEach-Object {
    $file = $_.FullName
    Write-Host "Checking: $file" -ForegroundColor Cyan
    try {
        python -m py_compile $file
        Write-Host "  ✅ OK" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ ERROR: $_" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Yellow
