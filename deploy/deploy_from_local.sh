#!/bin/bash
# ============================================================
#  Budget Master — Script de déploiement DEPUIS ta machine locale
#  Usage : bash deploy_from_local.sh
# ============================================================
VPS_IP="72.62.21.162"
VPS_USER="root"
VPS_PASS="Kaseka@Vps-243"
REPO="https://github.com/joshkabs95/kazi_bula_fund.git"
APP_DIR="/var/www/budget-app"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Budget Master — Déploiement VPS         ║"
echo "║   → $VPS_IP                    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Vérifie que sshpass est installé
if ! command -v sshpass &> /dev/null; then
  echo "Installation de sshpass..."
  sudo apt-get install -y sshpass 2>/dev/null || brew install hudochenkov/sshpass/sshpass 2>/dev/null
fi

SSH="sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no root@$VPS_IP"

echo "[1/8] Mise à jour du système..."
$SSH "apt-get update -q && apt-get install -y -q python3 python3-venv python3-pip nginx git curl"

echo "[2/8] Installation de Node.js 20..."
$SSH "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"

echo "[3/8] Clone / Pull du dépôt..."
$SSH "
  if [ -d $APP_DIR/.git ]; then
    cd $APP_DIR && git fetch origin && git reset --hard origin/main
  else
    git clone $REPO $APP_DIR
  fi
"

# Also push the claude branch to main on VPS
$SSH "
  cd $APP_DIR
  git fetch origin
  git checkout claude/create-github-repo-4LkBk 2>/dev/null || true
  git merge origin/claude/create-github-repo-4LkBk 2>/dev/null || true
  git checkout main 2>/dev/null || git checkout -b main
  git merge claude/create-github-repo-4LkBk 2>/dev/null || true
"

echo "[4/8] Environnement Python..."
$SSH "
  python3 -m venv $APP_DIR/venv
  $APP_DIR/venv/bin/pip install --upgrade pip -q
  $APP_DIR/venv/bin/pip install -r $APP_DIR/backend/requirements.txt -q
"

echo "[5/8] Configuration Django..."
$SSH "
  cp $APP_DIR/backend/.env.production $APP_DIR/backend/.env
  cd $APP_DIR/backend
  $APP_DIR/venv/bin/python manage.py migrate --settings=config.settings_prod
  $APP_DIR/venv/bin/python manage.py collectstatic --noinput --settings=config.settings_prod
  $APP_DIR/venv/bin/python manage.py seed --settings=config.settings_prod 2>/dev/null || true
"

echo "[6/8] Build frontend React..."
$SSH "
  cd $APP_DIR/frontend
  npm install --silent
  npm run build
  mkdir -p /var/www/budget-app/dist
  cp -r $APP_DIR/frontend/dist/. /var/www/budget-app/dist/
"

echo "[7/8] Service systemd Gunicorn..."
$SSH "
  cp $APP_DIR/deploy/budget-backend.service /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable budget-backend
  systemctl restart budget-backend
  sleep 2
  systemctl status budget-backend --no-pager | head -10
"

echo "[8/8] Configuration Nginx..."
$SSH "
  # Update nginx root to point to /var/www/budget-app/dist
  sed 's|root /var/www/budget-app/frontend;|root /var/www/budget-app/dist;|g' \
    $APP_DIR/deploy/nginx.conf > /etc/nginx/sites-available/budget-app
  ln -sf /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/budget-app
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅  Déploiement terminé !               ║"
echo "║                                           ║"
echo "║   App  : http://$VPS_IP       ║"
echo "║   Login: demo@budget.fr                  ║"
echo "║   Pass : Demo1234!                        ║"
echo "╚══════════════════════════════════════════╝"
