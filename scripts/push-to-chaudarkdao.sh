#!/usr/bin/env bash
# Push / update code len https://github.com/Chaudarkdao/Smart-Home
#
#   bash scripts/push-to-chaudarkdao.sh
#   SKIP_COMMIT=1 bash scripts/push-to-chaudarkdao.sh
#   REMOTE_BRANCH=Nhn.Ngn bash scripts/push-to-chaudarkdao.sh
#
# LAN DAU — neu "Author identity unknown":
#   git config --global user.name "Ten ban"
#   git config --global user.email "email-github@example.com"

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Chaudarkdao/Smart-Home.git}"
REMOTE_NAME="${REMOTE_NAME:-chaudarkdao}"
LOCAL_BRANCH="${LOCAL_BRANCH:-$(git branch --show-current)}"
REMOTE_BRANCH="${REMOTE_BRANCH:-Nhn.Ngn}"
COMMIT_MSG="${COMMIT_MSG:-Update: Smart Home frontend & auto gate}"
SKIP_COMMIT="${SKIP_COMMIT:-0}"

cd "$(dirname "$0")/.."

echo "=== Push to Chaudarkdao/Smart-Home ==="
echo "Project:       $(pwd)"
echo "Local branch:  $LOCAL_BRANCH"
echo "Remote branch: $REMOTE_BRANCH"
echo "Remote:        $REMOTE_NAME -> $REPO_URL"
echo ""

if ! git config user.name >/dev/null 2>&1 || ! git config user.email >/dev/null 2>&1; then
  echo "Chua cau hinh git user.name / user.email."
  echo '  git config --global user.name "Ten ban"'
  echo '  git config --global user.email "email@github.com"'
  exit 1
fi

if git ls-files --error-unmatch Backend/.env Frontend/.env &>/dev/null 2>&1; then
  echo "CANH BAO: .env dang bi git track."
  echo "  git rm --cached Backend/.env Frontend/.env"
  exit 1
fi

if [ "$SKIP_COMMIT" != "1" ] && [ -n "$(git status --porcelain)" ]; then
  git status -sb
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "Commit OK."
else
  echo "Khong co thay doi hoac SKIP_COMMIT=1 — bo qua commit."
fi

if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote set-url "$REMOTE_NAME" "$REPO_URL"
else
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

echo "Dang push..."
if [ "$LOCAL_BRANCH" = "$REMOTE_BRANCH" ]; then
  git push -u "$REMOTE_NAME" "$LOCAL_BRANCH"
else
  git push -u "$REMOTE_NAME" "${LOCAL_BRANCH}:${REMOTE_BRANCH}"
fi

WEB="${REPO_URL%.git}"
echo ""
echo "Push thanh cong!"
echo "Xem code: $WEB/tree/$REMOTE_BRANCH"
