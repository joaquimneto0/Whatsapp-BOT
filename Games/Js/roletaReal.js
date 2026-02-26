const fs = require('fs');
const path = require('path');

const CAMINHO_JSON_ROLETA_REAL = path.join(__dirname, '..', 'Json', 'roletaReal.json');

// Numeros da roleta europeia (0-36) com cores
const NUMEROS_ROLETA = [
  { numero: 0,  cor: 'verde' },
  { numero: 1,  cor: 'vermelho' }, { numero: 2,  cor: 'preto' },
  { numero: 3,  cor: 'vermelho' }, { numero: 4,  cor: 'preto' },
  { numero: 5,  cor: 'vermelho' }, { numero: 6,  cor: 'preto' },
  { numero: 7,  cor: 'vermelho' }, { numero: 8,  cor: 'preto' },
  { numero: 9,  cor: 'vermelho' }, { numero: 10, cor: 'preto' },
  { numero: 11, cor: 'preto' },    { numero: 12, cor: 'vermelho' },
  { numero: 13, cor: 'preto' },    { numero: 14, cor: 'vermelho' },
  { numero: 15, cor: 'preto' },    { numero: 16, cor: 'vermelho' },
  { numero: 17, cor: 'preto' },    { numero: 18, cor: 'vermelho' },
  { numero: 19, cor: 'vermelho' }, { numero: 20, cor: 'preto' },
  { numero: 21, cor: 'vermelho' }, { numero: 22, cor: 'preto' },
  { numero: 23, cor: 'vermelho' }, { numero: 24, cor: 'preto' },
  { numero: 25, cor: 'vermelho' }, { numero: 26, cor: 'preto' },
  { numero: 27, cor: 'vermelho' }, { numero: 28, cor: 'preto' },
  { numero: 29, cor: 'preto' },    { numero: 30, cor: 'vermelho' },
  { numero: 31, cor: 'preto' },    { numero: 32, cor: 'vermelho' },
  { numero: 33, cor: 'preto' },    { numero: 34, cor: 'vermelho' },
  { numero: 35, cor: 'preto' },    { numero: 36, cor: 'vermelho' }
];

const EMOJI_COR = { vermelho: '🔴', preto: '⚫', verde: '🟢' };
const NOME_COR = { vermelho: 'Vermelho', preto: 'Preto', verde: 'Verde' };

// Tipos de aposta e seus multiplicadores
const TIPOS_APOSTA = {
  vermelho: { tipo: 'cor', valor: 'vermelho', multi: 2, desc: '🔴 Vermelho' },
  preto:    { tipo: 'cor', valor: 'preto',    multi: 2, desc: '⚫ Preto' },
  par:   { tipo: 'paridade', valor: 'par',   multi: 2, desc: '🔢 Par' },
  impar: { tipo: 'paridade', valor: 'impar', multi: 2, desc: '🔢 Ímpar' },
  baixo: { tipo: 'faixa', valor: 'baixo', multi: 2, desc: '⬇️ Baixo (1-18)' },
  alto:  { tipo: 'faixa', valor: 'alto',  multi: 2, desc: '⬆️ Alto (19-36)' },
  duzia1: { tipo: 'duzia', valor: 1, multi: 3, desc: '1ª Dúzia (1-12)' },
  duzia2: { tipo: 'duzia', valor: 2, multi: 3, desc: '2ª Dúzia (13-24)' },
  duzia3: { tipo: 'duzia', valor: 3, multi: 3, desc: '3ª Dúzia (25-36)' },
  coluna1: { tipo: 'coluna', valor: 1, multi: 3, desc: '1ª Coluna' },
  coluna2: { tipo: 'coluna', valor: 2, multi: 3, desc: '2ª Coluna' },
  coluna3: { tipo: 'coluna', valor: 3, multi: 3, desc: '3ª Coluna' }
};

const carregarEstado = () => {
  try {
    if (!fs.existsSync(CAMINHO_JSON_ROLETA_REAL)) {
      const estadoInicial = {
        partidaAtual: 0,
        apostas: [],
        historico: [],
        rodando: false
      };
      fs.writeFileSync(CAMINHO_JSON_ROLETA_REAL, JSON.stringify(estadoInicial, null, 2));
      return estadoInicial;
    }
    const conteudo = fs.readFileSync(CAMINHO_JSON_ROLETA_REAL, 'utf8').replace(/^\uFEFF/, '').trim();
    return conteudo ? JSON.parse(conteudo) : { partidaAtual: 0, apostas: [], historico: [], rodando: false };
  } catch {
    return { partidaAtual: 0, apostas: [], historico: [], rodando: false };
  }
};

const salvarEstado = (estado) => {
  fs.writeFileSync(CAMINHO_JSON_ROLETA_REAL, JSON.stringify(estado, null, 2));
};

const girarRoleta = () => {
  const indice = Math.floor(Math.random() * NUMEROS_ROLETA.length);
  return NUMEROS_ROLETA[indice];
};

const verificarAposta = (aposta, resultado) => {
  const num = resultado.numero;
  const cor = resultado.cor;

  if (aposta.tipoAposta === 'numero') {
    return num === aposta.valorAposta;
  }

  // Zero perde para todas as apostas externas
  if (num === 0) return false;

  switch (aposta.tipoAposta) {
    case 'cor':
      return cor === aposta.valorAposta;
    case 'paridade':
      return aposta.valorAposta === 'par' ? num % 2 === 0 : num % 2 !== 0;
    case 'faixa':
      return aposta.valorAposta === 'baixo' ? (num >= 1 && num <= 18) : (num >= 19 && num <= 36);
    case 'duzia':
      if (aposta.valorAposta === 1) return num >= 1 && num <= 12;
      if (aposta.valorAposta === 2) return num >= 13 && num <= 24;
      return num >= 25 && num <= 36;
    case 'coluna':
      if (aposta.valorAposta === 1) return num % 3 === 1;
      if (aposta.valorAposta === 2) return num % 3 === 2;
      return num % 3 === 0;
    default:
      return false;
  }
};

const parseAposta = (texto) => {
  if (!texto) return null;
  const t = texto.toLowerCase().trim();

  const num = parseInt(t, 10);
  if (!isNaN(num) && num >= 0 && num <= 36 && String(num) === t) {
    return { tipoAposta: 'numero', valorAposta: num, multi: 35, desc: `🔢 Nº ${num}` };
  }

  const tipoInfo = TIPOS_APOSTA[t];
  if (tipoInfo) {
    return { tipoAposta: tipoInfo.tipo, valorAposta: tipoInfo.valor, multi: tipoInfo.multi, desc: tipoInfo.desc };
  }

  return null;
};

const obterTempoRestante = (proximaPartida) => {
  const restante = Math.max(0, proximaPartida - Date.now());
  return Math.ceil(restante / 1000);
};

const formatarHistorico = (historico, limite = 10) => {
  if (!historico || historico.length === 0) return '   _Nenhuma partida registrada._';
  const ultimos = historico.slice(-limite).reverse();
  return ultimos.map((h) => {
    const emoji = EMOJI_COR[h.cor] || '⚪';
    const nome = NOME_COR[h.cor] || h.cor;
    return `   ${emoji} *${h.numero}* — ${nome}`;
  }).join('\n');
};

const formatarHistoricoCompacto = (historico, limite = 12) => {
  if (!historico || historico.length === 0) return '_sem dados_';
  const ultimos = historico.slice(-limite).reverse();
  return ultimos.map(h => {
    const emoji = EMOJI_COR[h.cor] || '⚪';
    return `${emoji}${h.numero}`;
  }).join('  ');
};

// Barra visual para animacao
const gerarBarraGiro = (etapa, total) => {
  const preenchido = Math.round((etapa / total) * 10);
  const vazio = 10 - preenchido;
  return '▓'.repeat(preenchido) + '░'.repeat(vazio);
};

// Sequencia de numeros que a "bola" passa durante a animacao
const gerarSequenciaAnimacao = (resultado) => {
  const frames = [];
  const qtdFrames = 5;
  for (let i = 0; i < qtdFrames; i++) {
    const idx = Math.floor(Math.random() * NUMEROS_ROLETA.length);
    frames.push(NUMEROS_ROLETA[idx]);
  }
  frames.push(resultado);
  return frames;
};

const textoAjuda = () => {
  return `╔══════════════════════╗
      🎰  *ROLETA REAL*  🎰
╚══════════════════════╝

📌 *COMANDOS*
┌─────────────────────
│ /roletareal — _Status da rodada_
│ /apostar <tipo> <valor> — _Apostar_
│ /historicoroleta — _Histórico_
└─────────────────────

📌 *TIPOS DE APOSTA*
┌─────────────────────
│ 🔴 *vermelho* · ⚫ *preto* — _2x_
│ 🔢 *par* · *impar* — _2x_
│ ⬇️ *baixo* (1-18) · ⬆️ *alto* (19-36) — _2x_
│ 📊 *duzia1* · *duzia2* · *duzia3* — _3x_
│ 📊 *coluna1* · *coluna2* · *coluna3* — _3x_
│ 🎯 *0* a *36* (número exato) — _35x_
└─────────────────────

📌 *EXEMPLOS*
┌─────────────────────
│ /apostar vermelho 1000
│ /apostar 17 500
│ /apostar duzia1 2000
└─────────────────────

⏱️ _Rodadas a cada 30s em background._
_Só notifica quando há apostas._`;
};

module.exports = {
  NUMEROS_ROLETA,
  EMOJI_COR,
  NOME_COR,
  TIPOS_APOSTA,
  carregarEstado,
  salvarEstado,
  girarRoleta,
  verificarAposta,
  parseAposta,
  obterTempoRestante,
  formatarHistorico,
  formatarHistoricoCompacto,
  gerarBarraGiro,
  gerarSequenciaAnimacao,
  textoAjuda
};
