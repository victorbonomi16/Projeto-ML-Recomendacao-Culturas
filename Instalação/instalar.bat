@echo off
rem ==========================================================================
rem  Instala o projeto em um computador Windows novo.
rem  Cria o ambiente virtual (.venv), instala as bibliotecas do requirements.txt
rem  e testa se tudo funciona. Basta dar dois cliques neste arquivo.
rem ==========================================================================
chcp 65001 >nul
setlocal
rem Trabalha sempre na pasta onde este arquivo está, de onde quer que seja aberto.
cd /d "%~dp0.."

echo.
echo ==========================================================
echo   Recomendação de Culturas - instalação do projeto
echo ==========================================================
echo.

rem --- 1. Procura o Python 3.12 (mesma versão usada no projeto) ---
set "PYTHON="
py -3.12 --version >nul 2>&1 && set "PYTHON=py -3.12"
if not defined PYTHON (
    python -c "import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)" >nul 2>&1 && set "PYTHON=python"
)
if not defined PYTHON (
    echo [ERRO] Python 3.12 não encontrado.
    echo.
    echo Instale por um destes caminhos e depois rode este arquivo de novo:
    echo   - Site: https://www.python.org/downloads/  ^(marque "Add python.exe to PATH"^)
    echo   - Ou no terminal: winget install -e --id Python.Python.3.12
    echo.
    pause
    exit /b 1
)
echo [1/4] Python encontrado:
%PYTHON% --version

rem --- 2. Cria o ambiente virtual, se ainda não existir ---
if exist ".venv\Scripts\python.exe" (
    echo [2/4] Ambiente virtual .venv já existe; será reaproveitado.
) else (
    echo [2/4] Criando o ambiente virtual .venv ...
    %PYTHON% -m venv .venv
    if errorlevel 1 goto erro
)
set "VENV_PYTHON=.venv\Scripts\python.exe"

rem --- 3. Instala as bibliotecas com as versões travadas no requirements.txt ---
echo [3/4] Instalando as bibliotecas (pode levar alguns minutos na primeira vez) ...
"%VENV_PYTHON%" -m pip install --upgrade pip --quiet
if errorlevel 1 goto erro
"%VENV_PYTHON%" -m pip install -r requirements.txt
if errorlevel 1 goto erro

rem --- 4. Testa se tudo importa e mostra as versões ---
echo.
echo [4/4] Testando a instalação ...
"%VENV_PYTHON%" -c "import numpy, pandas, matplotlib, sklearn, xgboost, flask; from importlib.metadata import version; [print(f'  {n:<13} {version(n)}') for n in ['numpy', 'pandas', 'matplotlib', 'scikit-learn', 'xgboost', 'flask']]"
if errorlevel 1 goto erro

echo.
if not exist "dataset.csv" echo [AVISO] dataset.csv não está nesta pasta. O notebook precisa dele.
if not exist "Modelos\modelos_recomendacao.joblib" (
    echo [AVISO] O arquivo Modelos\modelos_recomendacao.joblib não existe.
    echo         Abra o recomendacao_culturas.ipynb no VS Code e use "Run All" para gerá-lo
    echo         antes de abrir a página de teste.
)
echo ==========================================================
echo   Instalação concluída!
echo   - Notebook: abra recomendacao_culturas.ipynb no VS Code e escolha o kernel .venv
echo   - Página de teste: dois cliques em iniciar_pagina.bat
echo ==========================================================
echo.
pause
exit /b 0

:erro
echo.
echo [ERRO] A instalação parou no passo acima. Confira a mensagem e a conexão com a internet.
pause
exit /b 1
