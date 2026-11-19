@echo off
rem ==========================================================================
rem  Abre a página de teste dos modelos (http://127.0.0.1:5000).
rem  Precisa ter rodado o instalar.bat antes. Para encerrar, feche esta janela.
rem ==========================================================================
chcp 65001 >nul
cd /d "%~dp0.."

if not exist ".venv\Scripts\python.exe" (
    echo [ERRO] Ambiente virtual não encontrado. Rode primeiro o instalar.bat.
    pause
    exit /b 1
)
if not exist "Modelos\modelos_recomendacao.joblib" (
    echo [ERRO] Modelos não encontrados. Rode o notebook até a etapa 10 para gerá-los.
    pause
    exit /b 1
)

rem Abre o navegador 3 segundos depois, tempo de o servidor carregar os modelos.
start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://127.0.0.1:5000"
".venv\Scripts\python.exe" app\app.py
pause
