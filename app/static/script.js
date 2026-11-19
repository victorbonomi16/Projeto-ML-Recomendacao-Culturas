// Página de teste: barras, seletor de modelos e resultado.
// Os dados vêm de window.INFORMACOES (montado pelo app.py).

const INFO = window.INFORMACOES;

const CORES_ATRIBUTOS = {
  N: ["#a5d66b", "#2e7d32"],
  P: ["#ffcc80", "#e8710a"],
  K: ["#d4a5e0", "#7b3fa0"],
  ph: ["#e53935", "#7b3fa0"],
  temperature: ["#4fc3f7", "#e53935"],
  humidity: ["#b2ebf2", "#00838f"],
  rainfall: ["#bbdefb", "#1565c0"],
};
const DEGRADES_ESPECIAIS = {
  ph: "#e53935, #fdd835 35%, #43a047 55%, #1e88e5 75%, #7b3fa0",
  temperature: "#4fc3f7, #ffd54f 55%, #e53935",
};

const valores = {};
let modeloSelecionado = INFO.modelos[0].nome;
let temporizador = null;

const formatarNumero = (valor, casas = 1) =>
  Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });
const formatarPct = (fracao, casas = 2) =>
  (fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) + "%";
const casasDecimais = (passo) => (String(passo).split(".")[1] || "").length;

function criarVariavel(atributo) {
  const [c1, c2] = CORES_ATRIBUTOS[atributo.coluna];
  const linha = document.createElement("div");
  linha.className = "variavel";
  linha.style.setProperty("--c1", c1);
  linha.style.setProperty("--c2", c2);
  linha.style.setProperty("--gradiente", DEGRADES_ESPECIAIS[atributo.coluna] || `${c1}, ${c2}`);

  const id = `barra-${atributo.coluna}`;
  linha.innerHTML = `
    <div class="variavel-cabecalho">
      <span class="icone" aria-hidden="true">${atributo.sigla}</span>
      <div class="variavel-texto">
        <label for="${id}">${atributo.rotulo}</label>
        <small>${atributo.dica}</small>
      </div>
      <div class="valor">
        <input type="number" inputmode="decimal" aria-label="${atributo.rotulo} (valor)"
               min="${atributo.minimo}" max="${atributo.maximo}" step="${atributo.passo}">
        ${atributo.unidade ? `<span>${atributo.unidade}</span>` : ""}
      </div>
    </div>
    <div class="barra">
      <input type="range" id="${id}" min="${atributo.minimo}" max="${atributo.maximo}" step="${atributo.passo}">
      <div class="limites"><span>${formatarNumero(atributo.minimo)}</span><span>${formatarNumero(atributo.maximo)}</span></div>
    </div>`;

  const barra = linha.querySelector('input[type="range"]');
  const caixa = linha.querySelector('input[type="number"]');
  barra.addEventListener("input", () => definirValor(atributo, barra.value, true));
  caixa.addEventListener("change", () => definirValor(atributo, caixa.value, true));
  caixa.addEventListener("keydown", (evento) => { if (evento.key === "Enter") caixa.blur(); });

  atributo.elementos = { barra, caixa };
  return linha;
}

function definirValor(atributo, valorNovo, veioDoUsuario = false) {
  let valor = Number(String(valorNovo).replace(",", "."));
  if (!Number.isFinite(valor)) valor = valores[atributo.coluna] ?? atributo.mediana;
  // mantém o valor dentro da faixa do dataset
  valor = Math.min(atributo.maximo, Math.max(atributo.minimo, valor));
  valor = Number(valor.toFixed(casasDecimais(atributo.passo)));
  valores[atributo.coluna] = valor;

  const { barra, caixa } = atributo.elementos;
  barra.value = valor;
  caixa.value = valor;
  const percentual = ((valor - atributo.minimo) / (atributo.maximo - atributo.minimo)) * 100;
  barra.style.setProperty("--p", `${percentual}%`);

  if (veioDoUsuario) {
    document.getElementById("perfil-cultura").value = "";
    agendarAtualizacaoAutomatica();
  }
}

function montarEntradas() {
  const container = document.getElementById("grupos-atributos");
  const grupos = [...new Set(INFO.atributos.map((a) => a.grupo))];
  grupos.forEach((grupo) => {
    const bloco = document.createElement("div");
    bloco.className = "grupo";
    bloco.innerHTML = `<p class="grupo-titulo">${grupo}</p>`;
    INFO.atributos.filter((a) => a.grupo === grupo).forEach((a) => bloco.appendChild(criarVariavel(a)));
    container.appendChild(bloco);
  });
  aplicarValores(Object.fromEntries(INFO.atributos.map((a) => [a.coluna, a.mediana])));

  const seletor = document.getElementById("perfil-cultura");
  INFO.culturas.forEach((c) => seletor.add(new Option(`${c.emoji}  ${c.nome}`, c.cultura)));
  seletor.addEventListener("change", () => {
    const cultura = INFO.culturas.find((c) => c.cultura === seletor.value);
    if (!cultura) return;
    aplicarValores(cultura.perfil);
    recomendarCultura();
  });

  document.getElementById("botao-medianas").addEventListener("click", () => {
    seletor.value = "";
    aplicarValores(Object.fromEntries(INFO.atributos.map((a) => [a.coluna, a.mediana])));
    agendarAtualizacaoAutomatica();
  });
}

function aplicarValores(novosValores) {
  INFO.atributos.forEach((a) => definirValor(a, novosValores[a.coluna]));
}

function montarModelos() {
  const lista = document.getElementById("lista-modelos");
  document.getElementById("qtd-modelos").textContent = INFO.modelos.length;

  INFO.modelos.forEach((modelo, posicao) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "modelo";
    botao.setAttribute("role", "radio");
    botao.dataset.nome = modelo.nome;
    botao.title = modelo.descricao;
    botao.innerHTML = `
      ${posicao === 0 ? '<span class="etiqueta-melhor">Melhor</span>' : ""}
      <span class="modelo-nome">${modelo.nome}</span>
      <span class="modelo-acerto"><strong>${formatarPct(modelo.acuracia)}</strong> de acerto no teste</span>`;
    botao.addEventListener("click", () => selecionarModelo(modelo.nome, true));
    lista.appendChild(botao);
  });

  const detalhe = document.createElement("p");
  detalhe.className = "modelo-detalhe";
  detalhe.id = "modelo-detalhe";
  lista.after(detalhe);
  selecionarModelo(modeloSelecionado);
}

function selecionarModelo(nome, veioDoUsuario = false) {
  modeloSelecionado = nome;
  document.querySelectorAll(".modelo").forEach((botao) =>
    botao.setAttribute("aria-checked", String(botao.dataset.nome === nome)));

  const modelo = INFO.modelos.find((m) => m.nome === nome);
  const parametros = Object.entries(modelo.hiperparametros)
    .map(([chave, valor]) => `<code>${chave}=${valor}</code>`).join(" ");
  document.getElementById("modelo-detalhe").innerHTML = `${modelo.descricao}.<br>${parametros}`;

  if (veioDoUsuario && document.querySelector(".destaque")) recomendarCultura();
}

function agendarAtualizacaoAutomatica() {
  if (!document.getElementById("atualizar-automatico").checked) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(recomendarCultura, 180);
}

async function recomendarCultura() {
  const botao = document.getElementById("botao-recomendar");
  botao.disabled = true;
  botao.querySelector(".rotulo-botao").textContent = "Analisando…";
  try {
    const resposta = await fetch("/api/recomendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelo: modeloSelecionado, valores }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Não foi possível gerar a recomendação.");
    mostrarResultado(dados);
  } catch (erro) {
    document.getElementById("detalhes").hidden = true;
    document.getElementById("resultado").innerHTML =
      `<p class="erro">${erro.message.includes("fetch") ? "O servidor não respondeu. Confira se o app.py está rodando." : erro.message}</p>`;
  } finally {
    botao.disabled = false;
    botao.querySelector(".rotulo-botao").textContent = "Recomendar cultura";
  }
}

function mostrarResultado(dados) {
  const area = document.getElementById("resultado");

  const blocoProbabilidades = dados.mais_provaveis
    ? dados.mais_provaveis.map((item) => `
        <div class="probabilidade">
          <span aria-hidden="true">${item.emoji}</span>
          <span class="nome">${item.nome}</span>
          <strong>${formatarPct(item.probabilidade, 1)}</strong>
          <div class="faixa"><i data-largura="${item.probabilidade * 100}%"></i></div>
        </div>`).join("")
    : `<p class="nota">O SVM decide pela fronteira de separação entre as culturas e, como no notebook, foi treinado sem cálculo de probabilidades. Por isso ele mostra só a cultura escolhida.</p>`;

  const votos = dados.todos_modelos.map((voto) => {
    const concorda = voto.cultura === dados.cultura;
    return `
      <div class="voto ${concorda ? "concorda" : "discorda"}">
        <span class="marca" aria-hidden="true">${concorda ? "✓" : "≠"}</span>
        <span class="quem">${voto.modelo}</span>
        <span class="qual">${voto.emoji} ${voto.nome}</span>
      </div>`;
  }).join("");
  const quantosConcordam = dados.todos_modelos.filter((v) => v.cultura === dados.cultura).length;

  const cultura = INFO.culturas.find((c) => c.cultura === dados.cultura);
  const cabecalhoComparacao = INFO.atributos.map((a) => `<th>${a.rotulo}</th>`).join("");
  const celulasSeuLocal = INFO.atributos.map((a) => {
    const diferenca = Math.abs(valores[a.coluna] - cultura.perfil[a.coluna]) / (a.maximo - a.minimo);
    const classe = diferenca <= 0.1 ? "perto" : diferenca >= 0.25 ? "longe" : "";
    return `<td class="${classe}">${formatarNumero(valores[a.coluna])} ${a.unidade}</td>`;
  }).join("");
  const celulasMediana = INFO.atributos.map((a) =>
    `<td>${formatarNumero(cultura.perfil[a.coluna])} ${a.unidade}</td>`).join("");

  area.innerHTML = `
    <div class="destaque">
      <div class="emoji-cultura" aria-hidden="true">${dados.emoji}</div>
      <div>
        <div class="rotulo-pequeno">Cultura recomendada</div>
        <div class="nome-cultura">${dados.nome}</div>
        <div class="por-modelo">segundo o ${dados.modelo}</div>
      </div>
    </div>

    <div class="secao-resultado">
      <h3>Culturas mais prováveis</h3>
      ${blocoProbabilidades}
    </div>`;

  const detalhes = document.getElementById("detalhes");
  detalhes.hidden = false;
  detalhes.innerHTML = `
    <div class="secao-resultado">
      <h3>Os outros modelos concordam? (${quantosConcordam} de ${dados.todos_modelos.length})</h3>
      <div class="consenso">${votos}</div>
    </div>

    <div class="secao-resultado">
      <h3>Seu local × perfil típico de ${dados.nome}</h3>
      <div class="tabela-rolagem">
        <table class="comparacao">
          <thead><tr><th></th>${cabecalhoComparacao}</tr></thead>
          <tbody>
            <tr><td>Seu local</td>${celulasSeuLocal}</tr>
            <tr><td>Mediana da cultura</td>${celulasMediana}</tr>
          </tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:8px">Verde: valor próximo do típico da cultura · marrom: valor bem diferente.</p>
    </div>`;

  requestAnimationFrame(() => requestAnimationFrame(() =>
    area.querySelectorAll(".faixa i").forEach((barra) => { barra.style.width = barra.dataset.largura; })));
}

montarEntradas();
montarModelos();
document.getElementById("botao-recomendar").addEventListener("click", recomendarCultura);
document.getElementById("atualizar-automatico").addEventListener("change", (evento) => {
  if (evento.target.checked) recomendarCultura();
});
