# Push lenh nhanh len branch Nhn.Ngn - repo Chaudarkdao/Smart-Home
# Chay trong PowerShell: .\push-nhn-ngn.ps1
# Hoac co commit message: .\push-nhn-ngn.ps1 -Message "Mo ta thay doi"

param(
    [string]$Message = "",
    [switch]$SkipCommit,
    [switch]$Rebase
)

$ErrorActionPreference = "Stop"
$ProjectPath = $PSScriptRoot
$Branch = "Nhn.Ngn"
$Remote = "origin"
$RemoteUrl = "https://github.com/Chaudarkdao/Smart-Home.git"

Set-Location $ProjectPath

Write-Host "=== Kiem tra remote ===" -ForegroundColor Cyan
$remotes = git remote -v 2>$null
if (-not $remotes) {
    git remote add origin $RemoteUrl
} elseif (-not (git remote get-url origin 2>$null)) {
    git remote add origin $RemoteUrl
}

Write-Host "`n=== Chuyen branch $Branch ===" -ForegroundColor Cyan
git fetch origin
$current = git branch --show-current
if ($current -ne $Branch) {
    git checkout $Branch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout -b $Branch "origin/$Branch" 2>$null
        if ($LASTEXITCODE -ne 0) {
            git checkout -b $Branch
        }
    }
}

Write-Host "`n=== Trang thai ===" -ForegroundColor Cyan
git status -sb

if (-not $SkipCommit) {
    Write-Host "`n=== Stage & commit ===" -ForegroundColor Cyan
    git add -A
    $status = git status --porcelain
    if ($status) {
        if (-not $Message) {
            $Message = Read-Host "Nhap commit message"
        }
        if (-not $Message.Trim()) {
            Write-Host "Bo qua commit (khong co message)." -ForegroundColor Yellow
        } else {
            git commit -m $Message
        }
    } else {
        Write-Host "Khong co thay doi de commit." -ForegroundColor Yellow
    }
}

Write-Host "`n=== Pull tu origin/$Branch ===" -ForegroundColor Cyan
if ($Rebase) {
    git pull origin $Branch --rebase
} else {
    git pull origin $Branch --no-rebase
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Pull co conflict - sua file roi chay lai hoac: git add -A ; git commit" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Push len origin/$Branch ===" -ForegroundColor Cyan
git push -u origin $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDa push thanh cong: $RemoteUrl (branch $Branch)" -ForegroundColor Green
} else {
    Write-Host "`nPush that bai. Thu: git push -u origin $Branch" -ForegroundColor Red
    exit 1
}
