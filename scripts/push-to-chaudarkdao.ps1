# Push / update code len https://github.com/Chaudarkdao/Smart-Home
#
# Chay tu thu muc goc project (PowerShell):
#   .\scripts\push-to-chaudarkdao.ps1
#
# Chi push, khong commit:
#   .\scripts\push-to-chaudarkdao.ps1 -SkipCommit
#
# Push branch test_1 len main tren GitHub:
#   .\scripts\push-to-chaudarkdao.ps1 -RemoteBranch main
#
# LAN DAU — neu chua co git user (loi "Author identity unknown"):
#   git config --global user.name "Ten ban"
#   git config --global user.email "email-github@example.com"

param(
    [string]$RepoUrl = "https://github.com/Chaudarkdao/Smart-Home.git",
    [string]$RemoteName = "chaudarkdao",
    [string]$LocalBranch = "",
    [string]$RemoteBranch = "",
    [string]$CommitMessage = "Update: Smart Home frontend & auto gate",
    [switch]$SkipCommit
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

if (-not $LocalBranch) {
    $LocalBranch = (git branch --show-current).Trim()
    if (-not $LocalBranch) {
        Write-Host "Khong xac dinh duoc branch hien tai. Dat -LocalBranch test_1" -ForegroundColor Red
        exit 1
    }
}
if (-not $RemoteBranch) {
    $RemoteBranch = $LocalBranch
}

Write-Host "=== Push to Chaudarkdao/Smart-Home ===" -ForegroundColor Cyan
Write-Host "Project:       $ProjectRoot"
Write-Host "Local branch:  $LocalBranch"
Write-Host "Remote branch: $RemoteBranch"
Write-Host "Remote:        $RemoteName -> $RepoUrl"
Write-Host ""

# Kiem tra identity (khong tu dong config)
$gitName = git config user.name 2>$null
$gitEmail = git config user.email 2>$null
if (-not $gitName -or -not $gitEmail) {
    Write-Host "Chua cau hinh git user.name / user.email." -ForegroundColor Red
    Write-Host "Chay truoc khi commit:" -ForegroundColor Yellow
    Write-Host '  git config --global user.name "Ten ban"'
    Write-Host '  git config --global user.email "email@github.com"'
    Write-Host "Hoac chi trong repo nay (bo --global)." -ForegroundColor Yellow
    exit 1
}

# Khong push .env
$trackedEnv = @(git ls-files "Backend/.env", "Frontend/.env" 2>$null) | Where-Object { $_ }
if ($trackedEnv.Count -gt 0) {
    Write-Host "CANH BAO: .env dang bi git track. Go truoc khi push:" -ForegroundColor Red
    Write-Host "  git rm --cached Backend/.env Frontend/.env" -ForegroundColor Yellow
    exit 1
}

if (-not $SkipCommit) {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Commit cac thay doi:" -ForegroundColor Yellow
        git status -sb
        git add -A
        git commit -m $CommitMessage
        Write-Host "Commit OK." -ForegroundColor Green
    } else {
        Write-Host "Khong co file thay doi — bo qua commit." -ForegroundColor Gray
    }
} else {
    Write-Host "SkipCommit: khong tao commit moi." -ForegroundColor Gray
}

$existing = git remote get-url $RemoteName 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote add $RemoteName $RepoUrl
    Write-Host "Da them remote '$RemoteName'." -ForegroundColor Green
} elseif ($existing -ne $RepoUrl) {
    git remote set-url $RemoteName $RepoUrl
    Write-Host "Da cap nhat URL remote '$RemoteName'." -ForegroundColor Green
}

Write-Host "Dang push..." -ForegroundColor Cyan
if ($LocalBranch -eq $RemoteBranch) {
    git push -u $RemoteName $LocalBranch
} else {
    git push -u $RemoteName "${LocalBranch}:${RemoteBranch}"
}

if ($LASTEXITCODE -eq 0) {
    $web = $RepoUrl -replace '\.git$', ''
    Write-Host ""
    Write-Host "Push thanh cong!" -ForegroundColor Green
    Write-Host "Xem code: $web/tree/$RemoteBranch"
} else {
    Write-Host ""
    Write-Host "Push that bai. Kiem tra:" -ForegroundColor Red
    Write-Host "  - Da dang nhap GitHub? (gh auth login)"
    Write-Host "  - Co quyen push vao Chaudarkdao/Smart-Home?"
    Write-Host "  - Branch '$RemoteBranch' co ton tai tren remote? Thu -RemoteBranch main"
    exit 1
}
