#!/bin/bash
# Ejecutar EN LA VM Oracle (como ubuntu), después de clonar el repo.
# Uso: bash ~/barcelona/deploy/oracle/install-app.sh
set -euo pipefail

REPO_ROOT="${HOME}/barcelona"
BACKEND="${REPO_ROOT}/backend"

if [[ ! -f "${BACKEND}/package.json" ]]; then
  echo "No encuentro ${BACKEND}. Clona antes:"
  echo "  git clone https://github.com/eduardolozada1958/barcelona-chalco.git ~/barcelona"
  exit 1
fi

if [[ ! -f "${BACKEND}/.env.production" ]]; then
  echo "Falta ${BACKEND}/.env.production"
  echo "Copia las variables desde Render Dashboard → Environment."
  echo "  nano ${BACKEND}/.env.production"
  exit 1
fi

cd "${BACKEND}"
npm ci --include=dev
npm run build
npm prune --omit=dev

sudo cp "${REPO_ROOT}/deploy/oracle/barcelona-api.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable barcelona-api
sudo systemctl restart barcelona-api

sudo cp "${REPO_ROOT}/deploy/oracle/nginx-barcelona-api.conf" /etc/nginx/sites-available/barcelona-api
sudo ln -sf /etc/nginx/sites-available/barcelona-api /etc/nginx/sites-enabled/barcelona-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "OK. Prueba en la VM:"
echo "  curl -s http://127.0.0.1/health"
echo "Desde fuera (IP pública):"
echo "  curl -s http://$(curl -s ifconfig.me)/health"
