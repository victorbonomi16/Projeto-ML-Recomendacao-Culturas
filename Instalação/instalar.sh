#!/usr/bin/env bash
# ==========================================================================
#  Instala o projeto em um computador macOS ou Linux.
#  Cria o ambiente virtual (.venv), instala as bibliotecas do requirements.txt
#  e testa se tudo funciona.   Uso: bash instalar.sh
# ==========================================================================
set -euo pipefail
cd "$(dirname "$0")/.."   # trabalha sempre na pasta do projeto

echo "=== Recomendação de Culturas - instalação do projeto ==="

# 1. Procura o Python 3.12 (mesma versão usada no projeto)
PYTHON=""
for candidato in python3.12 python3 python; do
    if command -v "$candidato" >/dev/null 2>&1 && \
       "$candidato" -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)" 2>/dev/null; then
        PYTHON="$candidato"; break
    fi
done
if [ -z "$PYTHON" ]; then
    echo "[ERRO] Python 3.12 não encontrado. Instale em https://www.python.org/downloads/ e rode de novo."
    exit 1
fi
echo "[1/4] Python encontrado: $($PYTHON --version)"

# 2. Cria o ambiente virtual, se ainda não existir
if [ -x ".venv/bin/python" ]; then
    echo "[2/4] Ambiente virtual .venv já existe; será reaproveitado."
else
    echo "[2/4] Criando o ambiente virtual .venv ..."
    "$PYTHON" -m venv .venv
fi

# 3. Instala as bibliotecas com as versões travadas no requirements.txt
echo "[3/4] Instalando as bibliotecas (pode levar alguns minutos na primeira vez) ..."
.venv/bin/python -m pip install --upgrade pip --quiet
.venv/bin/python -m pip install -r requirements.txt

# 4. Testa se tudo importa e mostra as versões
echo "[4/4] Testando a instalação ..."
.venv/bin/python -c "import numpy, pandas, matplotlib, sklearn, xgboost, flask; from importlib.metadata import version; [print(f'  {n:<13} {version(n)}') for n in ['numpy', 'pandas', 'matplotlib', 'scikit-learn', 'xgboost', 'flask']]"

[ -f dataset.csv ] || echo "[AVISO] dataset.csv não está nesta pasta. O notebook precisa dele."
[ -f Modelos/modelos_recomendacao.joblib ] || \
    echo "[AVISO] Modelos/modelos_recomendacao.joblib não existe: rode o notebook (Run All) antes de abrir a página."
echo "Instalação concluída! Página de teste: bash iniciar_pagina.sh"
