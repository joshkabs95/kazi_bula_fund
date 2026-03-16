#!/bin/bash
# ============================================================
#  Budget Master — Deployment Script
#  VPS: 72.62.21.162  |  User: root
#  Run: bash deploy.sh
# ============================================================
set -e

APP_DIR="/var/www/budget-app"
REPO="https://github.com/joshkabs95/kazi_bula_fund.git"
VENV="$APP_DIR/venv"
FRONTEND_BUILD="$APP_DIR/frontend_build"

echo "======================================"
echo "  Budget Master — Deployment Start"
echo "======================================"

# ── 1. System dependencies ────────────────────────────────
echo "[1/9] Installing system packages..."
apt-get update -q
apt-get install -y -q python3 python3-venv python3-pip nodejs npm nginx git curl

# ── 2. Clone / Pull repo ─────────────────────────────────
echo "[2/9] Syncing repository..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 3. Backend virtualenv + deps ─────────────────────────
echo "[3/9] Setting up Python virtual environment..."
python3 -m venv "$VENV"
"$VENV/bin/pip" install --upgrade pip -q
"$VENV/bin/pip" install -r "$APP_DIR/backend/requirements.txt" -q

# ── 4. Backend .env ──────────────────────────────────────
echo "[4/9] Configuring backend environment..."
cp "$APP_DIR/backend/.env.production" "$APP_DIR/backend/.env"

# ── 5. Django setup ──────────────────────────────────────
echo "[5/9] Running Django migrations and collectstatic..."
cd "$APP_DIR/backend"
"$VENV/bin/python" manage.py migrate --settings=config.settings_prod
"$VENV/bin/python" manage.py collectstatic --noinput --settings=config.settings_prod
"$VENV/bin/python" manage.py seed --settings=config.settings_prod || true

# ── 6. Frontend build ────────────────────────────────────
echo "[6/9] Building React frontend..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build

mkdir -p /var/www/budget-app/frontend
cp -r "$APP_DIR/frontend/dist/." /var/www/budget-app/frontend/

# ── 7. Systemd service ───────────────────────────────────
echo "[7/9] Installing systemd service..."
cp "$APP_DIR/deploy/budget-backend.service" /etc/systemd/system/budget-backend.service
systemctl daemon-reload
systemctl enable budget-backend
systemctl restart budget-backend

# ── 8. Nginx config ──────────────────────────────────────
echo "[8/9] Configuring Nginx..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/budget-app
ln -sf /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/budget-app
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 9. Done ──────────────────────────────────────────────
echo ""
echo "======================================"
echo "  ✅ Deployment completed!"
echo "  App: http://72.62.21.162"
echo "  Demo: demo@budget.fr / Demo1234!"
echo "======================================"
