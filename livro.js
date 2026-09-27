/*
  Bestiário de Windhelm: o livro que se folheia.

  As páginas saem de criaturas.js. Este arquivo monta o livro, desenha o
  pergaminho e o couro, vira as folhas em 3D e cuida da navegação.
*/
(() => {
  'use strict';

  const DADOS = window.BESTIARIO || { titulo: 'Bestiário de Windhelm', livro: '', criaturas: [] };
  DADOS.autor = DADOS.autor || 'Eivor';
  DADOS.cargo = DADOS.cargo || 'Mago da Corte';

  // medidas de desenho (px). O palco inteiro é escalado para caber na tela.
  const PW = 540, PH = 700, BD = 14;          // página e sobra da capa
  const CW = PW + BD, CH = PH + 2 * BD;       // uma capa
  const BW = CW * 2;                          // livro aberto
  const REDUZIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const raiz = document.documentElement;
  const cena = $('#cena'), palco = $('#palco'), livro = $('#livro');

  /* ---------------- utilidades ---------------- */

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function romano(n) {
    const t = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let s = '';
    for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
    return s;
  }
  const lista = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]);
  const f1 = n => n.toFixed(1);

  /* ---------------- ornamentos desenhados a pena ---------------- */

  function floreio() {
    return '<svg class="floreio" viewBox="0 0 240 24" aria-hidden="true">' +
      '<path d="M6 12 C50 3 88 19 120 12 C152 5 190 21 234 12 C190 16.5 152 9 120 13.6 C88 18 50 7.5 6 12Z"/>' +
      '<path d="M120 4.5 L126.5 12 L120 19.5 L113.5 12Z"/>' +
      '<circle cx="100" cy="13.5" r="1.6"/><circle cx="140" cy="10.5" r="1.6"/></svg>';
  }

  function borrao(seed, x, y, r) {
    const R = rng(seed);
    const k = 12, pts = [];
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2, rr = r * (0.72 + R() * 0.45);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let d = 'M' + mid(pts[k - 1], pts[0]).map(f1).join(',');
    for (let i = 0; i < k; i++) {
      const p = pts[i], m = mid(p, pts[(i + 1) % k]);
      d += 'Q' + p.map(f1).join(',') + ' ' + m.map(f1).join(',');
    }
    let sat = '';
    for (let i = 0; i < 5; i++) {
      const a = R() * 6.283, dd = r * (1.35 + R() * 1.4);
      sat += `<circle cx="${f1(Math.cos(a) * dd)}" cy="${f1(Math.sin(a) * dd)}" r="${f1(r * (0.07 + R() * 0.15))}"/>`;
    }
    const s = r * 6;
    return `<svg class="borrao" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="${-s / 2} ${-s / 2} ${s} ${s}" aria-hidden="true"><path d="${d}Z"/>${sat}</svg>`;
  }

  // pata de urso: o urso é o símbolo de Windhelm
  function pata() {
    const dedos = [[21, 42, -40, 7, 9.5], [34.5, 27.5, -17, 7.6, 10.2], [50, 22.5, 0, 7.8, 10.6], [65.5, 27.5, 17, 7.6, 10.2], [79, 42, 40, 7, 9.5]];
    let d = 'M50,46 C63,46 78,54 79,68 C80,81 69,88 60,85 C56,84 53,82 50,82 C47,82 44,84 40,85 C31,88 20,81 21,68 C22,54 37,46 50,46Z ';
    let elipses = '';
    for (const [cx, cy, a, rx, ry] of dedos) {
      elipses += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})"/>`;
      const r = (a * Math.PI) / 180, ux = Math.sin(r), uy = -Math.cos(r), px = -uy, py = ux;
      const bx = cx + ux * (ry - 3), by = cy + uy * (ry - 3);
      const tx = cx + ux * (ry + 10) + px * 2, ty = cy + uy * (ry + 10) + py * 2;
      d += `M${f1(bx + px * 3.4)},${f1(by + py * 3.4)} Q${f1(bx + ux * 7 + px * 3)},${f1(by + uy * 7 + py * 3)} ${f1(tx)},${f1(ty)} Q${f1(bx + ux * 5 - px * 0.8)},${f1(by + uy * 5 - py * 0.8)} ${f1(bx - px * 3.4)},${f1(by - py * 3.4)}Z `;
    }
    return `<path d="${d}"/>${elipses}`;
  }

  function seta() {
    return '<svg class="seta" viewBox="0 0 50 80" aria-hidden="true">' +
      '<path d="M8 76 C20 70 30 58 26 44 C22 30 30 16 34 5"/>' +
      '<path d="M26 11 L34 4 L39 14"/></svg>';
  }

  /* ---------------- conteúdo das páginas ---------------- */

  const paginas = [];
  const criaturas = DADOS.criaturas || [];

  function exLibris() {
    return `<div class="exlibris">
      <p class="t-medio">Ex libris</p>
      ${floreio()}
      <p>Este livro pertence a Windhelm.</p>
      <p class="pequeno">Se o encontrar perdido na neve, devolva-o a Windhelm.</p>
      <p class="runas">ᚹ</p>
    </div>`;
  }

  function rosto() {
    const [a, ...b] = DADOS.titulo.split(' ');
    return `<div class="rosto">
      <div class="topo">
        <p class="t-grande">${esc(a)}</p>
        <p class="t-medio">${esc(b.join(' '))}</p>
        ${floreio()}
      </div>
      <svg class="pata-tinta" viewBox="0 0 100 92" aria-hidden="true">${pata()}</svg>
      <div class="topo">
        <p class="livro-n">${esc(DADOS.livro || '')}</p>
        <p class="autor">Escrito por ${esc(DADOS.autor)}, ${esc(DADOS.cargo)},</p>
        <p class="autoria">com a ajuda de todos os moradores de Windhelm</p>
      </div>
    </div>`;
  }

  function prefacio() {
    return `<h2 class="t-pagina">A quem lê</h2>
      ${floreio()}
      <p>Eu, ${esc(DADOS.autor)}, ${esc(DADOS.cargo)}, reúno neste livro as feras de Skyrim, com a ajuda de todos os moradores de Windhelm que as viram e voltaram para contar. Cada fera tem o seu registro e o seu retrato.</p>
      <dl class="legenda">
        <div><dt>Espólio</dt><dd>o que se tira do corpo abatido.</dd></div>
        <div><dt>Glória</dt><dd>a experiência em combate de cada abate.</dd></div>
        <div><dt>Bando</dt><dd>quantas andam juntas.</dd></div>
        <div><dt>Fraquezas</dt><dd>o que mais as fere.</dd></div>
        <div><dt>Tática</dt><dd>como enfrentá-las.</dd></div>
        <div><dt>Proteção</dt><dd>o que usar para se defender.</dd></div>
        <div><dt>Região</dt><dd>onde costumam ser vistas.</dd></div>
      </dl>
      <p class="fecho-texto">Leia antes de partir. Conte-me o que viu ao voltar.</p>
      <p class="assinatura">${esc(DADOS.autor)}</p>`;
  }

  // retratos da fera: a lista "retratos" ou, no formato simples, "imagem" + "nota"
  const retratosDe = c => (c.retratos && c.retratos.length ? c.retratos : [{ imagem: c.imagem, legenda: c.nome, nota: c.nota }]);
  // com mais de um retrato, os campos ganham uma página só para eles
  const camposSeparados = c => retratosDe(c).length > 1;

  function campos(c) {
    const texto = v => (Array.isArray(v) ? lista(v) : String(v));
    const ponto = t => (/[.!?]$/.test(t) ? t : t + '.');
    const item = (rotulo, valor, extra = '') => `<div><dt>${rotulo}</dt><dd>${esc(ponto(texto(valor)))}${extra}</dd></div>`;
    const f = [];
    if (c.espolio && c.espolio.length) f.push(item('Espólio', c.espolio, c.aviso ? `<span class="aviso">${esc(c.aviso)}</span>` : ''));
    if (c.xp != null) f.push(item('Glória', `${c.xp} de experiência em combate por cada um abatido`));
    if (c.bando) f.push(item('Bando', c.bando));
    if (c.fraquezas) f.push(item('Fraquezas', c.fraquezas));
    if (c.tatica) f.push(item('Tática', c.tatica));
    if (c.protecao) f.push(item('Proteção', c.protecao));
    if (c.regiao) f.push(item('Região', c.regiao));
    return `<dl class="campos">${f.join('')}</dl>`;
  }

  function tipos(c) {
    if (!c.tipos || !c.tipos.length) return '';
    return `<dl class="campos tipos">${c.tipos.map(t => `<div><dt>${esc(t.nome)}</dt><dd>${esc(t.texto)}</dd></div>`).join('')}</dl>`;
  }

  function registro(c, k) {
    const txt = String(c.descricao || '');
    return `<header>
        <p class="t-sobre">${esc(DADOS.titulo)}:</p>
        <h2 class="t-nome">${esc(c.nome)}</h2>
        ${c.runas ? `<p class="runas" aria-hidden="true">${esc(c.runas)}</p>` : ''}
      </header>
      ${txt ? `<p class="relato"><span class="capitular">${esc(txt[0])}</span>${esc(txt.slice(1))}</p>` : ''}
      ${floreio()}
      ${tipos(c)}
      ${camposSeparados(c) ? '' : campos(c)}
      ${borrao(900 + k * 17, 352, 104, 5)}`;
  }

  function paginaCampos(c) {
    return `<header>
        <p class="t-sobre">${esc(c.nome)}:</p>
        <h2 class="t-pagina">O que se sabe</h2>
      </header>
      ${floreio()}
      ${campos(c)}`;
  }

  function retrato(c, r) {
    const legenda = r.legenda || c.nome;
    const fig = r.imagem
      ? `<img src="${esc(r.imagem)}" alt="Retrato: ${esc(legenda)}" draggable="false" decoding="async">`
      : '<p class="sem-retrato">Retrato ainda por desenhar.</p>';
    return `<figure class="retrato">${fig}<figcaption class="t-legenda${legenda.length > 13 ? ' longa' : ''}">${esc(legenda)}</figcaption></figure>
      ${r.nota ? `<p class="nota-margem">${esc(r.nota)}${seta()}</p>` : ''}`;
  }

  function sumario() {
    const pg = id => romano(paginas.findIndex(p => p.id === id) - 2);
    const feras = criaturas.map((c, k) =>
      `<li><a href="#${esc(c.id)}" data-ir="${esc(c.id)}"><span class="num">${romano(k + 1).toUpperCase()}.</span><span class="nm">${esc(c.nome)}</span><span class="pontos"></span><span class="pg">${pg(c.id)}</span></a></li>`).join('');
    return `<h2 class="t-pagina">Sumário</h2>
      ${floreio()}
      <ol class="indice">
        <li><a href="#prefacio" data-ir="prefacio"><span class="nm">A quem lê</span><span class="pontos"></span><span class="pg">${pg('prefacio')}</span></a></li>
        <li class="cap-titulo">Das feras</li>
        ${feras}
        <li class="cap-titulo">&nbsp;</li>
        <li><a href="#notas" data-ir="notas"><span class="nm">Notas de campo</span><span class="pontos"></span><span class="pg">${pg('notas')}</span></a></li>
      </ol>
      <p class="obs">As próximas páginas aguardam novas feras.</p>`;
  }

  function notas() {
    return '<h2 class="t-pagina">Notas de campo</h2><div class="pautas"></div>';
  }

  function fim() {
    return `<div class="fim">
      <p class="t-medio">Aqui terminam os registros.</p>
      <p>Por ora.</p>
      ${floreio()}
      <p class="runas">ᚠᛁᛗ</p>
    </div>`;
  }

  // ordem das páginas: índice par = página da direita (frente da folha),
  // índice ímpar = página da esquerda (verso da folha)
  paginas.push({ id: 'capa', tipo: 'capa-frente' });
  paginas.push({ id: 'guarda', tipo: 'guarda', html: exLibris() });
  paginas.push({ id: 'inicio', tipo: 'papel', html: rosto() });
  paginas.push({ id: 'prefacio', tipo: 'papel', html: prefacio(), folio: true });
  paginas.push({ id: 'sumario', tipo: 'papel', html: '', folio: true });
  // cada fera começa numa página da esquerda e ocupa um número par de páginas:
  // registro, retrato; e, com mais retratos, o segundo retrato e a página dos campos
  criaturas.forEach((c, k) => {
    const base = { tipo: 'papel', folio: true, nome: c.nome, criatura: c.id };
    const seq = [{ ...base, id: c.id, html: registro(c, k) }];
    retratosDe(c).forEach((r, i) => {
      seq.push({ ...base, id: c.id + '-retrato' + (i ? '-' + (i + 1) : ''), html: retrato(c, r), classe: 'pg-retrato' });
      if (i === 1) seq.push({ ...base, id: c.id + '-campos', html: paginaCampos(c) });
    });
    if (seq.length % 2) seq.push({ ...base, id: c.id + '-notas', html: '<h2 class="t-pagina">Notas</h2><div class="pautas"></div>' });
    paginas.push(...seq);
  });
  paginas.push({ id: 'notas', tipo: 'papel', html: notas(), folio: true });
  paginas.push({ id: 'fim', tipo: 'papel', html: fim(), folio: true });
  paginas.push({ id: 'guarda-final', tipo: 'papel', html: '' });
  paginas.push({ id: 'contracapa-dentro', tipo: 'guarda', html: '' });
  paginas.push({ id: 'contracapa', tipo: 'capa-verso' });
  paginas.find(p => p.id === 'sumario').html = sumario();

  const N = paginas.length / 2; // número de folhas

  /* ---------------- capa de couro (SVG) ---------------- */

  // trança nórdica de dois fios, com o fio de cima alternando nos cruzamentos
  function tranca(x1, y1, x2, y2, amp = 6.2, per = 22) {
    const L = Math.hypot(x2 - x1, y2 - y1), k = Math.max(1, Math.round(L / per)), p = L / k;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, vx = -uy, vy = ux;
    const linha = (s0, s1, sg) => {
      const n = Math.max(2, Math.ceil((s1 - s0) / 2));
      let d = '';
      for (let i = 0; i <= n; i++) {
        const s = s0 + ((s1 - s0) * i) / n, w = sg * amp * Math.sin((2 * Math.PI * s) / p);
        d += (i ? 'L' : 'M') + f1(x1 + ux * s + vx * w) + ',' + f1(y1 + uy * s + vy * w);
      }
      return d;
    };
    const A = linha(0, L, 1), B = linha(0, L, -1);
    let cima = '';
    for (let j = 0; j < k; j++) cima += linha(j * p + p * 0.2, j * p + p * 0.8, 1);
    return `<path class="fio-f" d="${A}"/><path class="fio" d="${A}"/><path class="fio-f" d="${B}"/><path class="fio" d="${B}"/><path class="fio-f" d="${cima}"/><path class="fio" d="${cima}"/>`;
  }

  function cantoneira(tr) {
    return `<g transform="${tr}">
      <path class="ferro" d="M0,0 H100 L93,7 C70,13 47,25 34,33 C25,46 13,70 7,93 L0,100 Z"/>
      <path class="ferro-dobra" d="M0,0 H100 L96,4 H4 V96 L0,100 Z"/>
      <path class="ferro-linha" d="M82,12 C62,18 45,27 36,34 C28,45 18,63 12,82"/>
      <path class="ferro-luz" d="M83,13.3 C63,19.3 46,28.3 37,35.3 C29,46 19.3,64 13.3,83"/>
      <circle class="ferrugem" cx="44" cy="12" r="3"/><circle class="ferrugem" cx="10" cy="40" r="2.2"/><circle class="ferrugem" cx="27" cy="21" r="1.6"/>
      <circle class="rebite" cx="17" cy="17" r="4.4"/><circle class="rebite" cx="63" cy="11" r="3.3"/><circle class="rebite" cx="11" cy="63" r="3.3"/>
    </g>`;
  }

  function svgCapa(verso) {
    const W = CW, H = CH;
    const R0 = { x: 46, y: 30, w: W - 46 - 30, h: H - 60 };
    const ins = (r, d) => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });
    const R1 = ins(R0, 15), R2 = ins(R0, 30), Rf = ins(R0, -5);
    const ret = (r, c) => `<rect class="${c}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>`;
    const cantos = [[R1.x, R1.y], [R1.x + R1.w, R1.y], [R1.x + R1.w, R1.y + R1.h], [R1.x, R1.y + R1.h]];
    const moldura = `
      <rect class="dobradica" x="19" y="0" width="4" height="${H}"/>
      <rect class="dobradica-luz" x="23" y="0" width="1.5" height="${H}"/>
      ${ret(ins(Rf, 0), 'cego')}${ret(ins(Rf, 1), 'cego-luz')}
      <g class="dourado">
        ${ret(R0, 'regra')}${ret(R2, 'regra')}
        ${tranca(R1.x, R1.y, R1.x + R1.w, R1.y)}${tranca(R1.x + R1.w, R1.y, R1.x + R1.w, R1.y + R1.h)}
        ${tranca(R1.x + R1.w, R1.y + R1.h, R1.x, R1.y + R1.h)}${tranca(R1.x, R1.y + R1.h, R1.x, R1.y)}
        ${cantos.map(([x, y]) => `<circle class="fio-f" cx="${x}" cy="${y}" r="9"/><circle class="ouro" cx="${x}" cy="${y}" r="8"/><circle cx="${x}" cy="${y}" r="3" fill="#1a0c07"/>`).join('')}
      </g>`;
    const guarnicoes = cantoneira('') + cantoneira(`translate(${W},0) scale(-1,1)`) +
      cantoneira(`translate(${W},${H}) scale(-1,-1)`) + cantoneira(`translate(0,${H}) scale(1,-1)`);

    if (!verso) {
      const cx = (26 + W) / 2, cy = 452, R = 112;
      const ra = R - 25;
      const anel = `M${cx - ra},${cy} a${ra},${ra} 0 1,1 ${2 * ra},0 a${ra},${ra} 0 1,1 ${-2 * ra},0`;
      const runas = 'ᛒᛖᛊᛏᛁᚨᚱᛁᛟ ᛫ ᛞᛖ ᛫ ᚹᛁᚾᛞᚺᛖᛚᛗ ᛫ ᛒᛖᛊᛏᛁᚨᚱᛁᛟ ᛫ ᛞᛖ ᛫ ᚹᛁᚾᛞᚺᛖᛚᛗ ᛫';
      return `<svg class="arte" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        ${moldura}
        <path id="anel-capa" d="${anel}" fill="none"/>
        <circle class="relevo" cx="${cx}" cy="${cy}" r="${R}"/>
        <circle class="cego" cx="${cx}" cy="${cy}" r="${R + 5}"/>
        <g class="dourado">
          <circle class="regra" cx="${cx}" cy="${cy}" r="${R}" style="stroke-width:2.6"/>
          <circle class="regra" cx="${cx}" cy="${cy}" r="${R - 30}"/>
          <text class="runas-anel"><textPath href="#anel-capa" xlink:href="#anel-capa"textLength="${f1(2 * Math.PI * ra - 6)}" lengthAdjust="spacing">${runas}</textPath></text>
          <g transform="translate(${cx - 62.5},${cy - 60}) scale(1.25)" class="ouro">${pata()}</g>
          <path class="ouro" d="M${cx - 70},94 H${cx - 12} L${cx},88 L${cx + 12},94 H${cx + 70} L${cx + 12},96 L${cx},102 L${cx - 12},96Z"/>
          <text class="runas-base" x="${cx}" y="${cy + R + 62}" text-anchor="middle">ᚹᛁᚾᛞᚺᛖᛚᛗ</text>
        </g>
        <g>
          <path class="arranhao-s" d="M96,592 C112,612 128,640 138,668"/><path class="arranhao" d="M95,590 C111,610 127,638 137,666"/>
          <path class="arranhao-s" d="M112,584 C128,606 143,632 154,662"/><path class="arranhao" d="M111,582 C127,604 142,630 153,660"/>
          <path class="arranhao-s" d="M129,580 C143,598 156,620 166,646"/><path class="arranhao" d="M128,578 C142,596 155,618 165,644"/>
        </g>
        <g>
          <rect class="correia" x="${W - 74}" y="${H / 2 - 17}" width="60" height="34" rx="3"/>
          <path class="costura" d="M${W - 70},${H / 2 - 12} H${W - 18} M${W - 70},${H / 2 + 12} H${W - 18}"/>
          <path class="ferro" d="M${W - 30},${H / 2 - 30} H${W} V${H / 2 + 30} H${W - 30} Q${W - 42},${H / 2} ${W - 30},${H / 2 - 30}Z"/>
          <circle class="rebite" cx="${W - 16}" cy="${H / 2 - 16}" r="3.4"/><circle class="rebite" cx="${W - 16}" cy="${H / 2 + 16}" r="3.4"/>
        </g>
        ${guarnicoes}
      </svg>`;
    }
    const cx = (W - 26) / 2, cy = H / 2, R = 72;
    return `<svg class="arte" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <g transform="translate(${W},0) scale(-1,1)">${moldura}</g>
      <circle class="relevo" cx="${cx}" cy="${cy}" r="${R}"/>
      <g class="dourado">
        <circle class="regra" cx="${cx}" cy="${cy}" r="${R}" style="stroke-width:2.4"/>
        <circle class="regra" cx="${cx}" cy="${cy}" r="${R - 10}"/>
        <text class="runas-base" x="${cx}" y="${cy + 22}" text-anchor="middle" style="font-size:64px;letter-spacing:0">ᚹ</text>
      </g>
      <g transform="translate(${W},0) scale(-1,1)">${guarnicoes}</g>
    </svg>`;
  }

  function etiqueta() {
    const [a, ...b] = DADOS.titulo.split(' ');
    return `<div class="etiqueta pagina-etiqueta">
      <div class="papel v1 recorte"></div>
      <div class="conteudo" data-seed="77">
        <p class="t-grande">${esc(a)}</p>
        <p class="t-medio">${esc(b.join(' '))}</p>
        <p class="livro-n">${esc(DADOS.livro || '')}</p>
      </div>
    </div>`;
  }

  /* ---------------- montagem das folhas ---------------- */

  function face(p, idx, qual) {
    const lado = idx % 2 === 0 ? 'direita' : 'esquerda';
    const base = `face ${qual} ${lado}`;
    const sombra = '<div class="sombra-folha"></div>';
    if (p.tipo === 'capa-frente') return `<div class="${base} capa-face">${svgCapa(false)}${etiqueta()}${sombra}</div>`;
    if (p.tipo === 'capa-verso') return `<div class="${base} capa-face">${svgCapa(true)}${sombra}</div>`;
    if (p.tipo === 'guarda') {
      return `<div class="${base} capa-face guarda"><div class="colado pagina ${lado}"><div class="papel v${idx % 3}"></div><div class="conteudo" data-seed="${idx}">${p.html}</div></div>${sombra}</div>`;
    }
    const folio = p.folio ? `<div class="folio">${romano(idx - 2)}</div>` : '';
    return `<div class="${base} pagina"><div class="papel v${(idx * 7 + 1) % 3}"></div><div class="conteudo ${p.classe || ''}" data-seed="${idx}">${p.html}</div>${folio}${sombra}</div>`;
  }

  livro.insertAdjacentHTML('beforeend', `
    <div class="sombra-livro esq"></div><div class="sombra-livro dir"></div>
    <div class="enchimento esq">${[3, 2, 1].map(k => `<div class="papel v${k % 3}" style="transform:translate(${-k * 2.4}px,${k * 2.1}px) rotate(${-0.12 * k}deg)"></div>`).join('')}</div>
    <div class="enchimento dir">${[3, 2, 1].map(k => `<div class="papel v${(k + 1) % 3}" style="transform:translate(${k * 2.4}px,${k * 2.1}px) rotate(${0.12 * k}deg)"></div>`).join('')}</div>
    <div class="sombra-virada esq"></div><div class="sombra-virada dir"></div>`);
  // as folhas soltas usam a textura do lado certo
  $('.enchimento.esq').classList.add('esquerda');
  $('.enchimento.dir').classList.add('direita');

  const folhas = [];
  const sombrasFolha = [];
  for (let k = 0; k < N; k++) {
    const el = document.createElement('div');
    el.className = 'folha' + (k === 0 ? ' capa capa-1' : k === N - 1 ? ' capa capa-2' : '');
    el.innerHTML = face(paginas[2 * k], 2 * k, 'frente') + face(paginas[2 * k + 1], 2 * k + 1, 'verso');
    livro.appendChild(el);
    folhas.push(el);
    sombrasFolha.push([el.querySelector('.frente > .sombra-folha'), el.querySelector('.verso > .sombra-folha')]);
  }
  const sombraE = $('.sombra-livro.esq'), sombraD = $('.sombra-livro.dir');
  const enchE = $('.enchimento.esq'), enchD = $('.enchimento.dir');
  const virE = $('.sombra-virada.esq'), virD = $('.sombra-virada.dir');

  // etiqueta da capa com bordas rasgadas
  (function recortarEtiqueta() {
    const R = rng(4242), w = 348, h = 158, st = 5, pts = [];
    for (let x = 0; x <= w; x += st) pts.push([x, R() * 3.2]);
    for (let y = 0; y <= h; y += st) pts.push([w - R() * 3.2, y]);
    for (let x = w; x >= 0; x -= st) pts.push([x, h - R() * 3.2]);
    for (let y = h; y >= 0; y -= st) pts.push([R() * 3.2, y]);
    $('.etiqueta .papel').style.clipPath = 'polygon(' + pts.map(([x, y]) => `${f1(x)}px ${f1(y)}px`).join(',') + ')';
  })();

  /* ---------------- escrita à mão: cada palavra com sua carga de tinta ---------------- */

  function molharPena(el, seed) {
    const R = rng(seed);
    let carga = 1, restantes = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nos = [];
    while (walker.nextNode()) nos.push(walker.currentNode);
    for (const t of nos) {
      if (!t.nodeValue.trim() || t.parentElement.closest('svg')) continue;
      const frag = document.createDocumentFragment();
      for (const w of t.nodeValue.split(/(\s+)/)) {
        if (!w) continue;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); continue; }
        if (--restantes <= 0) { carga = 0.97 + R() * 0.03; restantes = 8 + ((R() * 12) | 0); } // molhou a pena
        carga -= 0.018 + R() * 0.014;
        const s = document.createElement('span');
        s.className = 'pal';
        s.textContent = w;
        s.style.cssText = `--o:${clamp(carga + (R() - 0.5) * 0.08, 0.66, 1).toFixed(2)};--r:${((R() - 0.5) * 1.7).toFixed(2)}deg;--y:${((R() - 0.5) * 1.5).toFixed(2)}px`;
        frag.appendChild(s);
      }
      t.parentNode.replaceChild(frag, t);
    }
  }
  $$('.conteudo').forEach(el => molharPena(el, +el.dataset.seed || 1));

  // se um texto novo for longo demais, a letra encolhe até caber na página
  function caber(el) {
    let fs = parseFloat(getComputedStyle(el).fontSize), n = 0;
    while (el.scrollHeight > el.clientHeight + 4 && n++ < 16) {
      fs *= 0.965;
      el.style.fontSize = fs.toFixed(2) + 'px';
    }
  }

  /* ---------------- texturas: pergaminho e couro ---------------- */

  let TEX = 1.3;

  // canvas em memória (sem placa de vídeo): as texturas são desenhadas uma vez e
  // exportadas, e assim evitam o vaivém de pixels com a GPU
  function tela(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d', { willReadFrequently: true });
    return c;
  }

  // ruído suave (valores em grade, interpolação suavizada). Cada camada usa a
  // grade girada num ângulo diferente, para as manchas não formarem quadrados.
  function ruido(W, H, cel, R) {
    const ang = R() * Math.PI, ca = Math.cos(ang) / cel, sa = Math.sin(ang) / cel;
    // a grade girada precisa cobrir toda a página em qualquer ângulo, sem índice negativo
    const n = Math.ceil((2 * (W + H)) / cel) + 6, off = (W + H) / cel + 2;
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = R();
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fx = x * ca - y * sa + off, fy = x * sa + y * ca + off;
        const ix = fx | 0, iy = fy | 0;
        let tx = fx - ix, ty = fy - iy;
        tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const r0 = iy * n + ix, r1 = r0 + n;
        const a = g[r0], b = g[r0 + 1], c = g[r1], d = g[r1 + 1];
        out[y * W + x] = a + (b - a) * tx + (c - a + (d - c - b + a) * tx) * ty;
      }
    }
    return out;
  }

  function curva(R, n) {
    const a = Array.from({ length: n + 2 }, () => R());
    return u => { const f = clamp(u, 0, 1) * n, i = f | 0, t = f - i, s = t * t * (3 - 2 * t); return a[i] + (a[i + 1] - a[i]) * s; };
  }

  function rasgar(g, W, H, R, T) {
    const fr = curva(R, 16), fr2 = curva(R, 60), ft = curva(R, 10), fb = curva(R, 12);
    const entalhes = Array.from({ length: 3 }, () => [0.1 + R() * 0.8, 0.015 + R() * 0.035, 5 + R() * 11]);
    const pts = [], passo = 2.5 * T;
    for (let x = 0; x <= W; x += passo) { const u = x / W; pts.push([x, (0.5 + 2.8 * ft(u) + 1.1 * R()) * T * (0.35 + 1.4 * u * u)]); }
    for (let y = 0; y <= H; y += passo) {
      const u = y / H;
      let d = 2 + 6.5 * fr(u) + 3 * fr2(u) + 1.5 * R();
      for (const [p, w, prof] of entalhes) { const z = (u - p) / w; d += prof * Math.exp(-z * z); }
      d += 10 * (Math.max(0, 1 - u * 16) + Math.max(0, 1 - (1 - u) * 16));
      pts.push([W - d * T, y]);
    }
    for (let x = W; x >= 0; x -= passo) { const u = x / W; pts.push([x, H - (0.8 + 3.4 * fb(u) + 1.2 * R()) * T * (0.45 + 1.15 * u)]); }
    const p = new Path2D();
    p.moveTo(0, pts[0][1]);
    for (const [x, y] of pts) p.lineTo(x, y);
    p.lineTo(0, H);
    p.closePath();
    g.save(); g.globalCompositeOperation = 'destination-in'; g.globalAlpha = 1; g.fillStyle = '#000'; g.fill(p); g.restore();
    g.save(); g.globalCompositeOperation = 'source-atop';
    g.strokeStyle = 'rgba(80,50,24,.5)'; g.lineWidth = 5 * T; g.stroke(p);
    g.strokeStyle = 'rgba(50,30,12,.6)'; g.lineWidth = 1.5 * T; g.stroke(p);
    g.restore();
  }

  // pergaminho castanho, manchado e queimado nas bordas, como nos livros de Skyrim
  function pergaminho(seed) {
    const R = rng(seed), T = TEX;
    const W = Math.round(PW * T), H = Math.round(PH * T);
    const c = tela(W, H), g = c.getContext('2d');
    const n1 = ruido(W, H, 95 * T, R), n2 = ruido(W, H, 28 * T, R), n3 = ruido(W, H, 7 * T, R), n4 = ruido(W, H, 170 * T, R);
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const v = n1[i] * 0.5 + n2[i] * 0.32 + n3[i] * 0.18;
        const t = clamp((v - 0.26) / 0.52, 0, 1);
        let r = 190 - 36 * t, gg = 174 - 36 * t, b = 136 - 34 * t;
        // manchas de umidade
        let s = clamp((n2[i] * 0.55 + n4[i] * 0.45 - 0.6) / 0.2, 0, 1);
        s = s * s * (3 - 2 * s) * 0.3;
        r += (126 - r) * s; gg += (96 - gg) * s; b += (62 - b) * s;
        // bordas escurecidas: externa, topo e pé (a lombada fica à esquerda)
        const e = Math.min((W - x) / T, (y / T) * 1.25, ((H - y) / T) * 1.1);
        let q = clamp(1 - e / (15 + 48 * n1[i] + 18 * n3[i]), 0, 1);
        q *= q;
        r += (92 - r) * q * 0.8; gg += (62 - gg) * q * 0.8; b += (36 - b) * q * 0.82;
        const w = clamp(1 - Math.min(e, (x / T) * 2) / 150, 0, 1) * 0.15;
        const gr = (R() - 0.5) * 12;
        d[i * 4] = r * (1 - w) + gr;
        d[i * 4 + 1] = gg * (1 - w) + gr;
        d[i * 4 + 2] = b * (1 - w * 1.1) + gr * 0.9;
        d[i * 4 + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    // manchas grandes e suaves
    for (let k = 0; k < 20; k++) {
      const x = R() * W, y = R() * H, rr = (8 + R() * 36) * T;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(108,76,42,${(0.07 + R() * 0.12).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(108,76,42,0)');
      g.fillStyle = gr;
      g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    // marca de copo
    {
      const x = W * (0.25 + R() * 0.5), y = H * (0.3 + R() * 0.5), rr = (34 + R() * 20) * T;
      g.strokeStyle = 'rgba(96,64,34,.1)'; g.lineWidth = 3 * T;
      g.beginPath(); g.arc(x, y, rr, R() * 3, R() * 3 + 4.6); g.stroke();
    }
    // pintas de mofo e sujeira
    for (let k = 0; k < 280; k++) {
      let x = R() * W;
      const y = R() * H;
      if (R() < 0.35) x = W - Math.pow(R(), 2) * W * 0.35;
      const rr = (0.4 + Math.pow(R(), 3) * 2.6) * T;
      g.fillStyle = `rgba(${(58 + R() * 40) | 0},${(36 + R() * 24) | 0},${(18 + R() * 14) | 0},${(0.22 + R() * 0.55).toFixed(2)})`;
      g.beginPath(); g.ellipse(x, y, rr, rr * (0.55 + R() * 0.6), R() * 3, 0, 6.3); g.fill();
    }
    // fibras
    g.lineCap = 'round';
    for (let k = 0; k < 170; k++) {
      const x = R() * W, y = R() * H, l = (4 + R() * 26) * T, a = R() * Math.PI;
      g.strokeStyle = R() < 0.5 ? `rgba(224,210,172,${(0.1 + R() * 0.18).toFixed(2)})` : `rgba(70,46,24,${(0.07 + R() * 0.13).toFixed(2)})`;
      g.lineWidth = (0.5 + R() * 0.7) * T;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 4 * T, y + Math.sin(a) * l * 0.5 + (R() - 0.5) * 4 * T, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    rasgar(g, W, H, R, T);
    // espelho para a página da esquerda (lombada à direita)
    const e = tela(W, H), ge = e.getContext('2d');
    ge.translate(W, 0); ge.scale(-1, 1); ge.drawImage(c, 0, 0);
    return [c, e];
  }

  // couro escuro, gasto nas quinas, com poros e arranhões
  function couro(seed) {
    const R = rng(seed), T = TEX;
    const W = Math.round(CW * T), H = Math.round(CH * T);
    const c = tela(W, H), g = c.getContext('2d');
    const n1 = ruido(W, H, 70 * T, R), n2 = ruido(W, H, 16 * T, R), n3 = ruido(W, H, 3.2 * T, R);
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const v = n1[i] * 0.6 + n2[i] * 0.25 + n3[i] * 0.15;
        let t = clamp((v - 0.3) / 0.45, 0, 1); t = t * t * (3 - 2 * t);
        let r = 26 + 36 * t, gg = 13 + 21 * t, b = 9 + 13 * t;
        // manchas escuras de gordura, leves
        const m = clamp((0.38 - n2[i]) / 0.25, 0, 1) * 0.14;
        r *= 1 - m; gg *= 1 - m; b *= 1 - m;
        const e = Math.min(x, W - x, y, H - y) / T;
        let q = clamp(1 - e / (9 + 26 * n1[i]), 0, 1); q = q * q * 0.9;
        r += (98 - r) * q * 0.6; gg += (62 - gg) * q * 0.6; b += (40 - b) * q * 0.6;
        const poro = n3[i] < 0.22 ? 0.66 : n3[i] > 0.8 ? 1.12 : 1;
        const gr = (R() - 0.5) * 13;
        d[i * 4] = r * poro + gr; d[i * 4 + 1] = gg * poro + gr; d[i * 4 + 2] = b * poro + gr; d[i * 4 + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let k = 0; k < 80; k++) {
      const x = R() * W, y = R() * H, l = (6 + R() * 50) * T, a = R() * Math.PI * 2;
      g.strokeStyle = `rgba(150,104,72,${(0.05 + R() * 0.12).toFixed(2)})`;
      g.lineWidth = (0.5 + R() * 1) * T;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 8 * T, y + Math.sin(a) * l * 0.5 + (R() - 0.5) * 8 * T, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    return c;
  }

  function gerarTexturas() {
    // só tira a cor de fundo provisória quando as sete texturas estiverem prontas
    // aplicadas todas juntas, para as páginas serem redesenhadas uma vez só
    const TOTAL = 7;
    const urls = {};
    const definir = (nome, canvas) => {
      const usar = url => {
        urls[nome] = url;
        if (Object.keys(urls).length < TOTAL) return;
        requestAnimationFrame(() => {
          for (const [n, u] of Object.entries(urls)) livro.style.setProperty(n, `url("${u}")`);
          raiz.classList.add('texturas');
        });
      };
      try {
        canvas.toBlob(b => (b ? usar(URL.createObjectURL(b)) : usar(canvas.toDataURL())), 'image/webp', 0.9);
      } catch (e) { /* sem textura: fica a cor de fundo */ }
    };
    const tarefas = [
      () => definir('--tx-couro', couro(11)),
      () => { const [d, e] = pergaminho(101); definir('--pd0', d); definir('--pe0', e); },
      () => { const [d, e] = pergaminho(202); definir('--pd1', d); definir('--pe1', e); },
      () => { const [d, e] = pergaminho(303); definir('--pd2', d); definir('--pe2', e); }
    ];
    let i = 0;
    const passo = () => { if (i < tarefas.length) { tarefas[i++](); setTimeout(passo, 20); } };
    passo();
  }

  /* ---------------- som de papel (sintetizado) ---------------- */

  let actx = null, somLigado = true;
  try { somLigado = localStorage.getItem('bestiario-som') !== '0'; } catch (e) { /* sem armazenamento */ }

  function som(tipo, fimEm) {
    if (!somLigado) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
      const sr = actx.sampleRate, capa = tipo === 'capa', dur = capa ? 0.75 : 0.5;
      const buf = actx.createBuffer(1, Math.floor(sr * dur), sr), d = buf.getChannelData(0);
      let estalo = 0;
      for (let k = 0; k < d.length; k++) {
        const t = k / d.length;
        const env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 2) * (1 - t * 0.4);
        if (Math.random() < 0.004) estalo = 1;
        estalo *= 0.992;
        d[k] = (Math.random() * 2 - 1) * env * (0.45 + 0.9 * estalo);
      }
      const t0 = actx.currentTime;
      const src = actx.createBufferSource(); src.buffer = buf;
      const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(capa ? 500 : 1400, t0);
      bp.frequency.exponentialRampToValueAtTime(capa ? 1300 : 3800, t0 + dur * 0.8);
      const g = actx.createGain(); g.gain.value = capa ? 0.45 : 0.2;
      src.connect(bp).connect(g).connect(actx.destination);
      src.start(t0);
      if (capa && fimEm) { // baque da capa pousando
        const o = actx.createOscillator(), og = actx.createGain(), tb = t0 + fimEm;
        o.type = 'sine';
        o.frequency.setValueAtTime(120, tb); o.frequency.exponentialRampToValueAtTime(42, tb + 0.2);
        og.gain.setValueAtTime(0.0001, t0); og.gain.setValueAtTime(0.0001, tb);
        og.gain.exponentialRampToValueAtTime(0.55, tb + 0.012); og.gain.exponentialRampToValueAtTime(0.0001, tb + 0.28);
        o.connect(og).connect(actx.destination);
        o.start(t0); o.stop(tb + 0.32);
      }
    } catch (e) { /* sem áudio */ }
  }

  /* ---------------- estado e poses ---------------- */

  let f = 0;               // folhas já viradas (0 = fechado na capa, N = fechado na contracapa)
  let lado = 'dir';        // no celular, qual página da dupla está em foco
  let modo = 'duplo';      // 'duplo' mostra as duas páginas; 'simples' mostra uma
  let animando = false;
  let fila = [];
  let ladoFinal = null;
  let jaAbriu = false;

  const tf = (dx, dy, th) => `translate3d(${dx}px,${dy}px,0) perspective(2600px) rotateY(${th}deg)`;
  const ehPapel = j => j > 0 && j < N - 1;

  function assentar(fv = f, excluir = -1) {
    let papE = 0, papD = 0;
    for (let j = 0; j < N; j++) {
      if (j === excluir) continue;
      const el = folhas[j], virada = j < fv, papel = ehPapel(j);
      if (papel) { if (virada) papE++; else papD++; }
      let prof = virada ? fv - 1 - j : j - fv;
      if (excluir >= 0 && (virada ? excluir > j && excluir < fv : excluir >= fv && excluir < j)) prof--;
      let dx = 0, dy = 0;
      if (papel) { const k = Math.min(prof, 3); dx = (virada ? -1 : 1) * k * 1.8; dy = k * 1.4; }
      el.style.zIndex = virada ? (j + 1) * 10 : (N - j) * 10;
      el.style.transform = tf(dx, dy, virada ? -180 : 0);
      el.style.visibility = papel && prof > 3 ? 'hidden' : '';
      el.classList.remove('movendo');
      sombrasFolha[j][0].style.opacity = sombrasFolha[j][1].style.opacity = '';
    }
    enchE.classList.toggle('on', papE >= 1);
    enchD.classList.toggle('on', papD >= 1);
    if (excluir < 0) {
      virE.style.opacity = virD.style.opacity = '0';
      livro.classList.toggle('fechado-frente', fv === 0);
      livro.classList.toggle('fechado-verso', fv === N);
    } else {
      livro.classList.remove('fechado-frente', 'fechado-verso');
    }
  }

  function poseMovel(i, th) {
    const el = folhas[i];
    el.style.transform = tf(0, 0, th);
    const t = -th / 180;
    sombrasFolha[i][0].style.opacity = (Math.min(1, t * 2) * 0.9).toFixed(3);
    sombrasFolha[i][1].style.opacity = (Math.min(1, (1 - t) * 2) * 0.9).toFixed(3);
    const a = (th * Math.PI) / 180, proj = PW * Math.cos(a), ergue = Math.abs(Math.sin(a));
    const suave = 30 + 90 * (1 - Math.abs(Math.cos(a)));
    const pr = Math.abs(proj);
    const projetada = (ang, al) => `linear-gradient(${ang}deg, rgba(12,6,0,${(al * 0.6).toFixed(3)}) 0px, rgba(12,6,0,${al.toFixed(3)}) ${pr.toFixed(0)}px, rgba(12,6,0,0) ${(pr + suave).toFixed(0)}px)`;
    const lombada = (ang, al) => `linear-gradient(${ang}deg, rgba(12,6,0,${al.toFixed(3)}) 0px, rgba(12,6,0,0) 70px)`;
    const temE = i > 0, temD = i < N - 1;
    if (proj >= 0) {
      virD.style.background = projetada(90, 0.45 * ergue);
      virE.style.background = lombada(270, 0.25 * ergue);
    } else {
      virE.style.background = projetada(270, 0.45 * ergue);
      virD.style.background = lombada(90, 0.25 * ergue);
    }
    virD.style.opacity = temD ? '1' : '0';
    virE.style.opacity = temE ? '1' : '0';
  }

  function camera(fv = f) {
    let foco;
    if (fv <= 0) foco = 'dir';
    else if (fv >= N) foco = 'esq';
    else foco = modo === 'duplo' ? 'centro' : lado;
    const off = foco === 'centro' ? 0 : foco === 'dir' ? -CW / 2 : CW / 2;
    livro.style.transform = `translateX(${off}px)`;
    sombraE.style.opacity = fv > 0 ? '1' : '0';
    sombraD.style.opacity = fv < N ? '1' : '0';
  }

  const suave = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const saida = k => 1 - Math.pow(1 - k, 3);

  function animar(i, de, para, dur, easing, pronto) {
    const t0 = performance.now();
    const passo = agora => {
      const k = Math.min(1, (agora - t0) / dur);
      poseMovel(i, de + (para - de) * easing(k));
      if (k < 1) requestAnimationFrame(passo); else pronto();
    };
    requestAnimationFrame(passo);
  }

  function comecar(i, nf) {
    animando = true;
    assentar(nf, i);
    const el = folhas[i];
    el.style.zIndex = 1000;
    el.style.visibility = '';
    el.classList.add('movendo');
  }

  function virar(dir, rapido = false) {
    if (animando) { if (fila.length < 8) fila.push(dir); return; }
    const i = dir > 0 ? f : f - 1;
    if (i < 0 || i >= N) { fila = []; ladoFinal = null; return; }
    const nf = f + dir;
    if (modo === 'simples') lado = !fila.length && ladoFinal ? ladoFinal : dir > 0 ? 'esq' : 'dir';
    const capa = i === 0 || i === N - 1;
    const dur = REDUZIDO ? 180 : rapido || fila.length ? 430 : capa ? 1150 : 900;
    comecar(i, nf);
    camera(nf);
    som(capa ? 'capa' : 'folha', dur / 1000 - 0.04);
    animar(i, dir > 0 ? 0 : -180, dir > 0 ? -180 : 0, dur, suave, () => terminar(nf));
  }

  function terminar(nf) {
    f = nf;
    animando = false;
    assentar();
    if (fila.length) { virar(fila.shift(), true); return; }
    if (ladoFinal) { lado = ladoFinal; ladoFinal = null; camera(); }
    depois();
  }

  function avancar() {
    if (modo === 'simples' && f > 0 && f < N && lado === 'esq' && !animando) { lado = 'dir'; camera(); depois(); return; }
    virar(1);
  }
  function voltar() {
    if (modo === 'simples' && f > 0 && f < N && lado === 'dir' && !animando) { lado = 'esq'; camera(); depois(); return; }
    virar(-1);
  }

  function irPara(alvo, instantaneo = false) {
    const p = typeof alvo === 'number' ? alvo : paginas.findIndex(pg => pg.id === alvo);
    if (p < 0 || animando) return;
    const tfim = p % 2 === 0 ? p / 2 : (p + 1) / 2;
    const tl = p % 2 === 0 ? 'dir' : 'esq';
    if (instantaneo) { f = tfim; lado = tl; assentar(); camera(); depois(); return; }
    const delta = tfim - f;
    if (!delta) { lado = tl; camera(); depois(); return; }
    ladoFinal = tl;
    fila = Array(Math.abs(delta) - 1).fill(Math.sign(delta));
    virar(Math.sign(delta), Math.abs(delta) > 1);
  }

  /* ---------------- depois de cada movimento ---------------- */

  const btAnt = $('#bt-ant'), btProx = $('#bt-prox'), btSom = $('#bt-som'), aviso = $('#aviso-abrir'), anuncio = $('#anuncio');
  if (matchMedia('(hover: none)').matches) aviso.textContent = 'Toque na capa para abrir';

  function visiveis() {
    const v = [];
    if (modo === 'duplo' || f === 0 || f === N) {
      if (f > 0) v.push(2 * f - 1);
      if (f < N) v.push(2 * f);
    } else {
      v.push(lado === 'esq' ? 2 * f - 1 : 2 * f);
    }
    return v;
  }

  function depois() {
    if (f > 0) jaAbriu = true;
    aviso.classList.toggle('oculto', jaAbriu);
    const noInicio = f === 0, noFim = f === N;
    btAnt.disabled = noInicio;
    btProx.disabled = noFim;
    const vis = visiveis();
    const nomes = vis.map(p => {
      const pg = paginas[p];
      if (pg.id === 'capa') return 'Capa';
      if (pg.id === 'contracapa') return 'Contracapa';
      if (pg.nome) return pg.nome;
      return { guarda: 'Guarda', inicio: 'Folha de rosto', prefacio: 'A quem lê', sumario: 'Sumário', notas: 'Notas de campo', fim: 'Fim dos registros' }[pg.id] || '';
    }).filter(Boolean);
    anuncio.textContent = [...new Set(nomes)].join(', ');
    // âncora no endereço, para compartilhar uma página
    const pgs = vis.map(p => paginas[p]);
    const alvo = pgs.find(pg => pg.criatura || ['prefacio', 'sumario', 'notas', 'fim', 'inicio'].includes(pg.id));
    const hash = alvo ? '#' + alvo.id : '';
    try {
      if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search);
    } catch (e) { /* ambiente sem histórico */ }
  }

  /* ---------------- tamanho da tela ---------------- */

  function medir() {
    const vw = innerWidth, vh = innerHeight;
    const barra = $('.dicas').offsetHeight || 64;
    const aw = vw - 24, ah = vh - barra - 22;
    const sD = Math.min(aw / (BW + 36), ah / (CH + 30));
    modo = sD * PW >= 300 && vw >= vh * 0.9 ? 'duplo' : 'simples';
    const s = modo === 'duplo' ? sD : Math.min((vw - 12) / (CW + 10), ah / (CH + 30));
    palco.style.setProperty('--s', s.toFixed(4));
    palco.style.setProperty('--cy', ((vh - barra) / 2 + 4).toFixed(0) + 'px');
    raiz.dataset.modo = modo;
    return s;
  }

  /* ---------------- controles ---------------- */

  function ladoDoToque(x) {
    if (f === 0) return 1;
    if (f === N) return -1;
    if (modo === 'duplo') {
      const r = livro.getBoundingClientRect();
      return x > r.left + r.width / 2 ? 1 : -1;
    }
    return x > innerWidth / 2 ? 1 : -1;
  }

  let suprimir = false;

  cena.addEventListener('click', e => {
    if (suprimir) { suprimir = false; return; }
    const a = e.target.closest('a[data-ir]');
    if (a) { e.preventDefault(); irPara(a.dataset.ir); return; }
    if (e.target.closest('a,button') || !e.target.closest('#livro')) return;
    ladoDoToque(e.clientX) > 0 ? avancar() : voltar();
  });

  // arrastar a folha com o mouse: a beirada acompanha o ponteiro
  let arr = null;
  const livroX = x => { const r = livro.getBoundingClientRect(); return ((x - r.left) / r.width) * BW; };

  livro.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.button !== 0 || animando || modo !== 'duplo') return;
    if (e.target.closest('a,button')) return;
    const dir = ladoDoToque(e.clientX);
    const i = dir > 0 ? f : f - 1;
    if (i < 0 || i >= N) return;
    arr = { dir, i, x0: e.clientX, bx0: livroX(e.clientX), th: dir > 0 ? 0 : -180, p: 0, v: 0, ux: e.clientX, ut: e.timeStamp, movendo: false };
  });

  addEventListener('pointermove', e => {
    if (!arr) return;
    if (!arr.movendo) {
      if (Math.abs(e.clientX - arr.x0) < 7) return;
      arr.movendo = true;
      comecar(arr.i, f + arr.dir);
      livro.classList.add('arrastando');
      som(arr.i === 0 || arr.i === N - 1 ? 'capa' : 'folha');
    }
    const bx = livroX(e.clientX);
    const p = arr.dir > 0
      ? (arr.bx0 - bx) / Math.max(40, arr.bx0 - (BW / 2 - PW))
      : (bx - arr.bx0) / Math.max(40, BW / 2 + PW - arr.bx0);
    arr.p = clamp(p, 0, 1);
    const g = (Math.acos(1 - 2 * arr.p) * 180) / Math.PI;
    arr.th = arr.dir > 0 ? -g : -180 + g;
    const dt = Math.max(1, e.timeStamp - arr.ut);
    arr.v = ((e.clientX - arr.ux) / dt) * -arr.dir;
    arr.ux = e.clientX; arr.ut = e.timeStamp;
    poseMovel(arr.i, arr.th);
  });

  function soltar() {
    if (!arr) return;
    const a = arr;
    arr = null;
    livro.classList.remove('arrastando');
    if (!a.movendo) return;
    suprimir = true;
    setTimeout(() => { suprimir = false; }, 0);
    const completa = a.p > 0.5 || a.v > 0.45;
    const destino = completa ? (a.dir > 0 ? -180 : 0) : a.dir > 0 ? 0 : -180;
    const resta = Math.abs(destino - a.th) / 180;
    const nf = completa ? f + a.dir : f;
    if (completa) camera(nf);
    animar(a.i, a.th, destino, REDUZIDO ? 120 : 180 + 520 * resta, saida, () => terminar(nf));
  }
  addEventListener('pointerup', soltar);
  addEventListener('pointercancel', soltar);

  // deslizar o dedo no celular e no tablet
  let toque = null;
  cena.addEventListener('touchstart', e => {
    toque = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  cena.addEventListener('touchend', e => {
    if (!toque) return;
    const t = e.changedTouches[0], dx = t.clientX - toque.x, dy = t.clientY - toque.y;
    toque = null;
    if (window.visualViewport && visualViewport.scale > 1.05) return;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suprimir = true;
      setTimeout(() => { suprimir = false; }, 450);
      dx < 0 ? avancar() : voltar();
    }
  }, { passive: true });

  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.target.closest('button,a'))) { e.preventDefault(); avancar(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); voltar(); }
    else if (k === 'Home' || k === 'Escape') { e.preventDefault(); irPara(0); }
    else if (k === 'End') { e.preventDefault(); irPara(paginas.length - 1); }
    else if (k === 's' || k === 'S') irPara('sumario');
    else if (k === 'm' || k === 'M') alternarSom();
  });

  btAnt.addEventListener('click', voltar);
  btProx.addEventListener('click', avancar);
  $('#bt-sum').addEventListener('click', () => irPara('sumario'));
  $('#bt-fechar').addEventListener('click', () => irPara(0));
  btSom.addEventListener('click', alternarSom);

  function alternarSom() {
    somLigado = !somLigado;
    try { localStorage.setItem('bestiario-som', somLigado ? '1' : '0'); } catch (e) { /* sem armazenamento */ }
    btSom.setAttribute('aria-pressed', String(somLigado));
    $('#rotulo-som').textContent = somLigado ? 'Som' : 'Mudo';
  }
  btSom.setAttribute('aria-pressed', String(somLigado));
  $('#rotulo-som').textContent = somLigado ? 'Som' : 'Mudo';

  addEventListener('hashchange', () => {
    const alvo = decodeURIComponent(location.hash.slice(1));
    if (alvo && paginas.some(p => p.id === alvo)) irPara(alvo);
  });

  let tempoResize = 0;
  const remedir = () => {
    clearTimeout(tempoResize);
    tempoResize = setTimeout(() => { medir(); if (!animando) camera(); depois(); }, 60);
  };
  addEventListener('resize', remedir);
  addEventListener('load', remedir);

  /* ---------------- início ---------------- */

  const escala = medir();
  TEX = clamp((window.devicePixelRatio || 1) * escala, 1, 1.8);
  livro.style.transition = 'none';
  assentar();
  camera();
  const h = decodeURIComponent(location.hash.slice(1));
  if (h && paginas.some(p => p.id === h)) irPara(h, true);
  depois();
  requestAnimationFrame(() => requestAnimationFrame(() => { livro.style.transition = ''; }));
  gerarTexturas();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { $$('.conteudo').forEach(caber); remedir(); });
})();
