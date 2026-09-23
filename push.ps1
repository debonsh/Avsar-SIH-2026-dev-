# One-click push: .\push.ps1 -m "what changed"
# Stages all, commits (skips when nothing changed), pushes main to origin.
param([string]$m = "")
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
git add -A -- . ':!app/node_modules/.vite'
if (-not (git status --porcelain)) { Write-Host "Nothing to push."; exit 0 }
if (-not $m) { $m = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
git commit -m $m
git push origin main
