# Push AI-PROJECT len repo GitHub cua Chaudarkdao
# Chay trong PowerShell tu thu muc goc project:
#   .\scripts\push-to-chaudarkdao.ps1
#
# Lan dau: sua bien $RepoUrl ben duoi (URL repo cua Chaudarkdao)

param(
    [string]$RepoUrl = "https://github.com/Chaudarkdao/AI-PROJECT.git",
    [string]$RemoteName = "chaudarkdao",
    [string]$Branch = "test_1",
    [string]$CommitMessage = "Update: frontend router, auto gate UI, IoT face flow",
    [switch]$SkipCommit
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host "Branch:  $Branch" -ForegroundColor Cyan
Write-Host "Remote:  $RemoteName -> $RepoUrl" -ForegroundColor Cyan

# Kiem tra .env khong bi commit
$trackedEnv = git ls-files "Backend/.env" "Frontend/.env" 2>$null
if ($trackedEnv) {
    Write-Host "CANH BAO: File .env dang duoc git track. Go khoi index truoc khi push:" -ForegroundColor Red
    Write-Host "  git rm --cached Backend/.env Frontend/.env" -ForegroundColor Yellow
    exit 1
}

if (-not $SkipCommit) {
    $status = git status --porcelain
    if ($status) {
        Write-Host "`nThay doi se commit:" -ForegroundColor Yellow
        git status -sb
        git add -A
        git commit -m $CommitMessage
    } else {
        Write-Host "Khong co thay doi moi, bo qua commit." -ForegroundColor Gray
    }
}

# Them hoac cap nhat remote Chaudarkdao
$existing = git remote get-url $RemoteName 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add $RemoteName $RepoUrl
    Write-Host "Da them remote '$RemoteName'." -ForegroundColor Green
} elseif ($existing -ne $RepoUrl) {
    git remote set-url $RemoteName $RepoUrl
    Write-Host "Da cap nhat URL remote '$RemoteName'." -ForegroundColor Green
}

# Push (can quyen ghi repo Chaudarkdao: collaborator hoac owner)
git push -u $RemoteName $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPush thanh cong: $RemoteName / $Branch" -ForegroundColor Green
    Write-Host "Xem tren GitHub: $($RepoUrl -replace '\.git$','')/tree/$Branch" -ForegroundColor Green
} else {
    Write-Host "`nPush that bai. Kiem tra:" -ForegroundColor Red
    Write-Host "  1. URL repo dung chua? (sua `$RepoUrl trong script)" -ForegroundColor Yellow
    Write-Host "  2. Da dang nhap GitHub? (gh auth login hoac Personal Access Token)" -ForegroundColor Yellow
    Write-Host "  3. Ban co quyen push vao repo Chaudarkdao?" -ForegroundColor Yellow
    exit 1
}
