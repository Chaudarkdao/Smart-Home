#!/usr/bin/env bash
# Push AI-PROJECT len repo GitHub cua Chaudarkdao
# Chay tu thu muc goc project:
#   bash scripts/push-to-chaudarkdao.sh
#
# Sua REPO_URL neu repo khac ten/duong dan

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Chaudarkdao/AI-PROJECT.git}"
REMOTE_NAME="${REMOTE_NAME:-chaudarkdao}"
BRANCH="${BRANCH:-test_1}"
COMMIT_MSG="${COMMIT_MSG:-Update: frontend router, auto gate UI, IoT face flow}"
SKIP_COMMIT="${SKIP_COMMIT:-0}"

cd "$(dirname "$0")/.."
echo "Project: $(pwd)"
echo "Branch:  $BRANCH"
echo "Remote:  $REMOTE_NAME -> $REPO_URL"

if git ls-files --error-unmatch Backend/.env Frontend/.env &>/dev/null; then
  echo "CANH BAO: File .env dang duoc git track. Go truoc khi push:"
  echo "  git rm --cached Backend/.env Frontend/.env"
  exit 1
fi

if [ "$SKIP_COMMIT" != "1" ] && [ -n "$(git status --porcelain)" ]; then
  git status -sb
  git add -A
  git commit -m "$COMMIT_MSG"
else
  echo "Khong co thay doi moi, bo qua commit."
fi

if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote set-url "$REMOTE_NAME" "$REPO_URL"
else
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

git push -u "$REMOTE_NAME" "$BRANCH"
echo "Push thanh cong: $REMOTE_NAME / $BRANCH"
