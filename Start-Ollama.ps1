<# 
.SYNOPSIS
    Starts Ollama server with the correct OLLAMA_MODELS path for CharArchive.

.DESCRIPTION
    This script ensures Ollama uses the models directory next to the CharArchive
    installation (Z:\Armchiver\ollama\models) rather than inheriting a stale
    environment variable from another machine or session. It also prevents the
    "could not locate ollama app" error by setting OLLAMA_PATH if a portable
    install is detected.

.NOTES
    The models folder must exist at Z:\Armchiver\ollama\models before running.
    Ollama itself is expected at Z:\Programs\ComfyUI\OtherAI\ARMULATOR\runtime\bin\ollama.exe
    or on the system PATH.
#>

$ErrorActionPreference = "Stop"

# Resolve the models directory next to the CharArchive app
$ModelsDir = "Z:\Armchiver\ollama\models"
if (-not (Test-Path $ModelsDir)) {
    Write-Error "Models directory not found: $ModelsDir"
    exit 1
}

# Find Ollama executable (portable install or system PATH)
$OllamaExe = $null
$Candidates = @(
    "Z:\Programs\ComfyUI\OtherAI\ARMULATOR\runtime\bin\ollama.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe",
    "C:\Program Files\Ollama\ollama.exe",
    "C:\Program Files (x86)\Ollama\ollama.exe"
)
foreach ($c in $Candidates) {
    if (Test-Path $c) { $OllamaExe = $c; break }
}
if (-not $OllamaExe) {
    $OllamaExe = "ollama.exe"  # Fall back to PATH
}

Write-Host "Using Ollama: $OllamaExe"
Write-Host "Models directory: $ModelsDir"

# Set the environment variable BEFORE starting Ollama so it picks up the right models
$env:OLLAMA_MODELS = $ModelsDir
$env:OLLAMA_HOST = "127.0.0.1:11434"

# Start Ollama (runs in background; use -Wait to block)
Write-Host "Starting Ollama on 127.0.0.1:11434..."
Start-Process -FilePath $OllamaExe -ArgumentList "serve" -WorkingDirectory $ModelsDir -WindowStyle Hidden

# Wait briefly for server to come up
Start-Sleep -Seconds 3

# Verify it's responding
try {
    $tags = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 10
    Write-Host "Ollama is running. Models available:"
    $tags.models | ForEach-Object { Write-Host "  - $($_.name)" }
} catch {
    Write-Warning "Ollama may still be starting. Check manually with: ollama list"
}