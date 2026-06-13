#!/bin/bash
# Bootstrap inicial — ejecutar una vez al conectar por SSH a la VM Oracle (Ubuntu ARM).
# curl -sSL https://raw.githubusercontent.com/eduardolozada1958/barcelona-chalco/main/deploy/oracle/setup-vm.sh | bash
set -euo pipefail

echo "==> Actualizar sistema"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

echo "==> Node.js 22 + herramientas"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx build-essential

echo "==> Carpetas WhatsApp (auth en disco)"
mkdir -p "${HOME}/barcelona-data/whatsapp-auth"

echo "==> Clonar repo (si no existe)"
if [[ ! -d "${HOME}/barcelona/.git" ]]; then
  git clone https://github.com/eduardolozada1958/barcelona-chalco.git "${HOME}/barcelona"
fi

echo ""
echo "Siguiente:"
echo "  1) nano ~/barcelona/backend/.env.production   (copia env de Render)"
echo "  2) Ajusta en .env.production:"
echo "       CORS_ORIGIN=https://barcelona-chalco.pages.dev"
echo "       APP_PUBLIC_URL=https://barcelona-chalco.pages.dev"
echo "       WHATSAPP_AUTH_STORAGE=disk"
echo "       WHATSAPP_AUTH_DIR=/home/ubuntu/barcelona-data/whatsapp-auth"
echo "  3) bash ~/barcelona/deploy/oracle/install-app.sh"
