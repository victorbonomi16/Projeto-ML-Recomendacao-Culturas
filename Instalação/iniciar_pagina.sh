#!/usr/bin/env bash
# Abre a página de teste dos modelos (http://127.0.0.1:5000). Uso: bash iniciar_pagina.sh
# Precisa ter rodado o instalar.sh antes. Para encerrar, Ctrl+C.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -x .venv/bin/python ] || { echo "[ERRO] Rode primeiro: bash instalar.sh"; exit 1; }
[ -f Modelos/modelos_recomendacao.joblib ] || { echo "[ERRO] Modelos não encontrados. Rode o notebook até a etapa 10."; exit 1; }

# Abre o navegador 3 segundos depois, tempo de o servidor carregar os modelos.
( sleep 3; (command -v open >/dev/null && open http://127.0.0.1:5000) || xdg-open http://127.0.0.1:5000 >/dev/null 2>&1 || true ) &
.venv/bin/python app/app.py
