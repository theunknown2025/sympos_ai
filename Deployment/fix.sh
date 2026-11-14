#!/usr/bin/env bash
###############################################################################
# PM2 ecosystem fix: use ecosystem.config.cjs when package.json has
# "type": "module" (CommonJS module.exports fails on .js).
#
# Usage (on the VPS):
#   chmod +x fix.sh
#   ./fix.sh
#
# Custom install path:
#   APP_DIR=/opt/my-app ./fix.sh
###############################################################################
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sympos-ai}"
APP_NAME="$(basename "$APP_DIR")"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
EMAIL_SERVER_PORT="${EMAIL_SERVER_PORT:-3001}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "Error: directory not found: $APP_DIR" >&2
  exit 1
fi

ENV_FILE="${APP_DIR}/.env"
if [[ -f "$ENV_FILE" ]]; then
  line="$(grep -E '^EMAIL_SERVER_PORT=' "$ENV_FILE" 2>/dev/null | tail -1 || true)"
  if [[ -n "$line" ]]; then
    val="${line#EMAIL_SERVER_PORT=}"
    val="${val%$'\r'}"
    val="${val#\"}"
    val="${val%\"}"
    val="${val#\'}"
    val="${val%\'}"
    [[ -n "$val" ]] && EMAIL_SERVER_PORT="$val"
  fi
fi

echo "==> Using APP_DIR=$APP_DIR APP_NAME=$APP_NAME"
echo "==> Ports: email API=$EMAIL_SERVER_PORT frontend preview=$FRONTEND_PORT"

cd "$APP_DIR"

echo "==> Removing legacy ecosystem.config.js (if any)"
rm -f "${APP_DIR}/ecosystem.config.js"

echo "==> Writing ecosystem.config.cjs"
mkdir -p "${APP_DIR}/logs"
cat > "${APP_DIR}/ecosystem.config.cjs" << EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}-email-api',
      script: 'server/email-api.js',
      cwd: '${APP_DIR}',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: ${EMAIL_SERVER_PORT}
      },
      error_file: '${APP_DIR}/logs/email-api-error.log',
      out_file: '${APP_DIR}/logs/email-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: '${APP_NAME}-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '${APP_DIR}',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: ${FRONTEND_PORT}
      },
      error_file: '${APP_DIR}/logs/frontend-error.log',
      out_file: '${APP_DIR}/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

echo "==> Restarting PM2 apps for this project only"
pm2 delete "${APP_NAME}-email-api" 2>/dev/null || true
pm2 delete "${APP_NAME}-frontend" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Done. Check: pm2 status && pm2 logs --lines 30"
