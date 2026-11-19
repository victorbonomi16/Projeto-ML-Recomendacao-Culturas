# Recomendação de Culturas Agrícolas com Machine Learning

Trabalho II de Machine Learning (Engenharia da Computação, SATC).
Grupo: Rafael Webber, Victor Bonomi e Vinicius Damiani.

Usamos o Crop Recommendation Dataset (Kaggle, 2.200 áreas, 7 medidas de solo e clima, 22 culturas)
para comparar SVM, Árvore de Decisão, Random Forest, XGBoost e K-means.

## Pastas

| Pasta / arquivo | Conteúdo |
| --- | --- |
| `recomendacao_culturas.ipynb` | Notebook com todo o código, já com as saídas salvas |
| `dataset.csv` | Base de dados usada no notebook |
| `Figuras/` | Gráficos gerados pelo notebook |
| `Resultados/` | Tabelas (CSV) geradas pelo notebook |
| `Modelos/` | Modelos treinados, usados pela página web |
| `app/` | Página web de teste dos modelos (Flask) |
| `Instalação/` | Scripts para instalar o ambiente e abrir a página |
| `Documentação/` | Relatório do trabalho (Word e PDF) |
| `Apresentação/` | Slides da apresentação em PDF |
| `requirements.txt` | Bibliotecas e versões usadas |

## Como rodar

1. Instale o Python 3.12.
2. Windows: dois cliques em `Instalação/instalar.bat`. macOS/Linux: `bash Instalação/instalar.sh`.
3. Abra `recomendacao_culturas.ipynb` no VS Code, escolha o kernel `.venv` e use "Run All".
4. Para abrir a página de teste: `Instalação/iniciar_pagina.bat` (ou `bash Instalação/iniciar_pagina.sh`)
   e acesse http://127.0.0.1:5000.

A semente aleatória é fixa (`random_state = 42`), então os resultados se repetem a cada execução;
só os tempos de treino mudam.
