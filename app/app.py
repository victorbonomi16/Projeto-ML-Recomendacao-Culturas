"""
Página de teste dos modelos (Flask).
Usa os modelos salvos na seção 11 do notebook. Para rodar: python app/app.py
e abrir http://127.0.0.1:5000
"""

import os

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request

PASTA_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMINHO_MODELOS = os.path.join(PASTA_PROJETO, "Modelos", "modelos_recomendacao.joblib")

if not os.path.exists(CAMINHO_MODELOS):
    raise SystemExit(
        f"Arquivo de modelos não encontrado em: {CAMINHO_MODELOS}\n"
        "Execute o notebook recomendacao_culturas.ipynb até a seção 11 para gerá-lo."
    )

pacote_modelos = joblib.load(CAMINHO_MODELOS)
MODELOS = pacote_modelos["modelos"]
CODIFICADOR_ALVO = pacote_modelos["codificador_alvo"]
COLUNAS_ATRIBUTOS = pacote_modelos["colunas_atributos"]
NOMES_CULTURAS = pacote_modelos["nomes_culturas"]
METRICAS_TESTE = pacote_modelos["metricas_teste"]
HIPERPARAMETROS = pacote_modelos["hiperparametros"]
LIMITES_ATRIBUTOS = pacote_modelos["limites_atributos"]
PERFIL_CULTURAS = pacote_modelos["perfil_culturas"]

# textos e ícones da página (os números vêm do arquivo de modelos)
APARENCIA_ATRIBUTOS = {
    "N": {"rotulo": "Nitrogênio", "sigla": "N", "grupo": "Solo", "unidade": "", "passo": 1,
          "dica": "Ajuda no crescimento das folhas"},
    "P": {"rotulo": "Fósforo", "sigla": "P", "grupo": "Solo", "unidade": "", "passo": 1,
          "dica": "Raízes, flores e frutos"},
    "K": {"rotulo": "Potássio", "sigla": "K", "grupo": "Solo", "unidade": "", "passo": 1,
          "dica": "Resistência da planta e qualidade dos frutos"},
    "ph": {"rotulo": "pH do solo", "sigla": "pH", "grupo": "Solo", "unidade": "", "passo": 0.1,
           "dica": "Acidez do solo (7 = neutro)"},
    "temperature": {"rotulo": "Temperatura", "sigla": "°C", "grupo": "Clima", "unidade": "°C", "passo": 0.1,
                    "dica": "Temperatura média do local"},
    "humidity": {"rotulo": "Umidade", "sigla": "%", "grupo": "Clima", "unidade": "%", "passo": 0.1,
                 "dica": "Umidade relativa do ar"},
    "rainfall": {"rotulo": "Chuva", "sigla": "mm", "grupo": "Clima", "unidade": "mm", "passo": 1,
                 "dica": "Chuva acumulada no período"},
}

EMOJIS_CULTURAS = {
    "apple": "🍎", "banana": "🍌", "blackgram": "🫘", "chickpea": "🫛", "coconut": "🥥",
    "coffee": "☕", "cotton": "☁️", "grapes": "🍇", "jute": "🌿", "kidneybeans": "🫘",
    "lentil": "🫛", "maize": "🌽", "mango": "🥭", "mothbeans": "🫘", "mungbean": "🫛",
    "muskmelon": "🍈", "orange": "🍊", "papaya": "🍈", "pigeonpeas": "🫛", "pomegranate": "🍎",
    "rice": "🌾", "watermelon": "🍉",
}

DESCRICAO_MODELOS = {
    "Random Forest": "Votação de muitas árvores treinadas em paralelo (bagging)",
    "SVM": "Fronteiras de separação com a maior margem entre as culturas",
    "XGBoost": "Árvores em sequência, cada uma corrige a anterior (boosting)",
    "Árvore de Decisão": "Sequência de perguntas do tipo “chuva ≤ 150 mm?”",
}


def arredondar_para_passo(valor, passo, para_cima):
    funcao = np.ceil if para_cima else np.floor
    return round(float(funcao(valor / passo) * passo), 1)


def montar_informacoes_pagina():
    atributos = []
    for coluna in COLUNAS_ATRIBUTOS:
        aparencia = APARENCIA_ATRIBUTOS[coluna]
        passo = aparencia["passo"]
        atributos.append({
            "coluna": coluna,
            **aparencia,
            "minimo": arredondar_para_passo(LIMITES_ATRIBUTOS[coluna]["min"], passo, para_cima=False),
            "maximo": arredondar_para_passo(LIMITES_ATRIBUTOS[coluna]["max"], passo, para_cima=True),
            "mediana": round(float(LIMITES_ATRIBUTOS[coluna]["median"]), 1),
        })

    nomes_ordenados = sorted(MODELOS, key=lambda nome: METRICAS_TESTE[nome]["acuracia"], reverse=True)
    modelos = [{
        "nome": nome,
        "descricao": DESCRICAO_MODELOS.get(nome, ""),
        "acuracia": float(METRICAS_TESTE[nome]["acuracia"]),
        "f1_macro": float(METRICAS_TESTE[nome]["f1_macro"]),
        "hiperparametros": {chave.replace("svc__", ""): str(valor) for chave, valor in HIPERPARAMETROS[nome].items()},
    } for nome in nomes_ordenados]

    culturas = [{
        "cultura": cultura,
        "nome": NOMES_CULTURAS[cultura],
        "emoji": EMOJIS_CULTURAS.get(cultura, "🌱"),
        "perfil": {coluna: round(float(valor), 1) for coluna, valor in PERFIL_CULTURAS[cultura].items()},
    } for cultura in sorted(PERFIL_CULTURAS, key=lambda c: NOMES_CULTURAS[c])]

    return {"atributos": atributos, "modelos": modelos, "culturas": culturas}


def traduzir_classes(modelo, classes):
    # o XGBoost devolve códigos (0 a 21)
    classes = np.asarray(classes)
    if np.issubdtype(classes.dtype, np.integer):
        return CODIFICADOR_ALVO.inverse_transform(classes)
    return classes


def descrever_cultura(cultura):
    return {"cultura": cultura, "nome": NOMES_CULTURAS[cultura], "emoji": EMOJIS_CULTURAS.get(cultura, "🌱")}


def recomendar(nome_modelo, entrada):
    modelo = MODELOS[nome_modelo]
    cultura = str(traduzir_classes(modelo, modelo.predict(entrada))[0])

    # o SVM foi treinado sem probability=True, então não tem predict_proba
    mais_provaveis = None
    if hasattr(modelo, "predict_proba"):
        probabilidades = modelo.predict_proba(entrada)[0]
        classes = traduzir_classes(modelo, modelo.classes_)
        ordem = np.argsort(probabilidades)[::-1][:3]
        mais_provaveis = [{**descrever_cultura(str(classes[i])), "probabilidade": float(probabilidades[i])}
                          for i in ordem if probabilidades[i] >= 0.005]
    return cultura, mais_provaveis


app = Flask(__name__)
INFORMACOES_PAGINA = montar_informacoes_pagina()


@app.route("/")
def pagina_inicial():
    return render_template("index.html", informacoes=INFORMACOES_PAGINA)


@app.route("/api/recomendar", methods=["POST"])
def api_recomendar():
    corpo = request.get_json(silent=True) or {}
    nome_modelo = corpo.get("modelo")
    if nome_modelo not in MODELOS:
        return jsonify({"erro": "Modelo desconhecido."}), 400

    try:
        valores = {coluna: float(corpo["valores"][coluna]) for coluna in COLUNAS_ATRIBUTOS}
    except (KeyError, TypeError, ValueError):
        return jsonify({"erro": "Informe um número válido para cada uma das 7 variáveis."}), 400

    entrada = pd.DataFrame([valores], columns=COLUNAS_ATRIBUTOS)

    cultura, mais_provaveis = recomendar(nome_modelo, entrada)

    todos_modelos = [{"modelo": item["nome"], **descrever_cultura(recomendar(item["nome"], entrada)[0])}
                     for item in INFORMACOES_PAGINA["modelos"]]

    return jsonify({
        "modelo": nome_modelo,
        **descrever_cultura(cultura),
        "mais_provaveis": mais_provaveis,
        "todos_modelos": todos_modelos,
    })


if __name__ == "__main__":
    print("Página de teste disponível em: http://127.0.0.1:5000  (Ctrl+C para encerrar)")
    app.run(host="127.0.0.1", port=5000, debug=False)
