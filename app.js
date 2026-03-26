const OPCOES = ['A', 'B', 'C', 'D', 'E'];

let gabarito   = [];   // [{resp:'A', peso:1}]
let alunos     = [];   // [{nome, respostas:[]}]
let abaAtiva   = 'resultados';
let dadosCache = [];   // resultados calculados (usados nas abas)

// ═══════════════════════════ TOAST ═══════════════════════════

function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

// ═══════════════════════════ NOTA MINIMA ═══════════════════════════

function notaMinima() {
  return parseFloat(document.getElementById('nota-minima').value) || 6;
}

// ═══════════════════════════ STEP 1: GABARITO ═══════════════════════════

function gerarGabarito() {
  const n = parseInt(document.getElementById('num-questoes').value) || 10;
  gabarito = Array.from({ length: n }, () => ({ resp: '', peso: 1 }));
  renderGabarito();
}

function renderGabarito() {
  const grid = document.getElementById('gabarito-grid');
  grid.innerHTML = gabarito.map((q, i) => `
    <div class="questao-item">
      <div class="questao-top">
        <label>Q${i + 1}</label>
        <div class="peso-wrap">
          <span>Peso</span>
          <input type="number" min="0.1" max="99" step="0.1" value="${q.peso}"
                 oninput="alterarPeso(${i}, this.value)" />
        </div>
      </div>
      <div class="opcoes">
        ${OPCOES.map(op => `
          <button class="${q.resp === op ? 'sel' : ''}"
                  onclick="selecionarGabarito(${i},'${op}')">${op}</button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selecionarGabarito(idx, op) {
  gabarito[idx].resp = gabarito[idx].resp === op ? '' : op;
  renderGabarito();
}

function alterarPeso(idx, val) {
  gabarito[idx].peso = parseFloat(val) || 1;
}

function confirmarGabarito() {
  if (gabarito.length === 0) { alert('Gere o gabarito primeiro.'); return; }
  const vazias = gabarito.filter(g => g.resp === '').length;
  if (vazias > 0 && !confirm(`${vazias} questao(oes) sem resposta. Continuar assim?`)) return;
  alunos = [];
  document.getElementById('alunos-container').innerHTML = '';
  showStep('step-alunos');
}

// ═══════════════════════════ SALVAR / CARREGAR ═══════════════════════════

function salvarProva() {
  const nm   = notaMinima();
  const blob = new Blob([JSON.stringify({ gabarito, alunos, notaMinima: nm }, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'prova.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Prova salva!');
}

function carregarProva(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const dados = JSON.parse(ev.target.result);
      if (!dados.gabarito) throw new Error();
      gabarito = dados.gabarito;
      alunos   = dados.alunos || [];
      if (dados.notaMinima !== undefined)
        document.getElementById('nota-minima').value = dados.notaMinima;
      document.getElementById('num-questoes').value = gabarito.length;
      renderGabarito();
      toast('Prova carregada!');
    } catch { alert('Arquivo invalido.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ═══════════════════════════ STEP 2: ALUNOS ═══════════════════════════

function adicionarAluno() {
  const input = document.getElementById('aluno-nome');
  const nome  = input.value.trim();
  if (!nome) { alert('Digite o nome do aluno.'); return; }
  alunos.push({ nome, respostas: Array(gabarito.length).fill('') });
  input.value = '';
  renderAlunos();
}

function renderAlunos() {
  const container = document.getElementById('alunos-container');
  container.innerHTML = alunos.map((al, ai) => `
    <div class="aluno-card" id="aluno-card-${ai}">
      <div class="aluno-header" onclick="toggleAluno(${ai})">
        <span>${ai + 1}. ${al.nome}</span>
        <div style="display:flex;align-items:center;gap:.5rem">
          <span class="toggle">&#9660;</span>
          <button class="remove-btn" onclick="removerAluno(event,${ai})">&#10005;</button>
        </div>
      </div>
      <div class="aluno-respostas open" id="resp-${ai}">
        <div class="respostas-grid">
          ${al.respostas.map((sel, qi) => `
            <div class="resp-item">
              <label>Q${qi + 1}</label>
              <div class="opcoes">
                ${OPCOES.map(op => `
                  <button class="${sel === op ? 'sel' : ''}"
                          onclick="selecionarResposta(${ai},${qi},'${op}')">${op}</button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function toggleAluno(ai) { document.getElementById(`resp-${ai}`).classList.toggle('open'); }

function removerAluno(e, ai) {
  e.stopPropagation();
  alunos.splice(ai, 1);
  renderAlunos();
}

function selecionarResposta(ai, qi, op) {
  alunos[ai].respostas[qi] = alunos[ai].respostas[qi] === op ? '' : op;
  renderAlunos();
}

// ═══════════════════════════ CSV ═══════════════════════════

function importarCSV(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const linhas = ev.target.result.trim().split(/\r?\n/);
    let importados = 0;
    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const nome = cols[0];
      if (!nome) continue;
      const respostas = Array(gabarito.length).fill('');
      for (let q = 0; q < gabarito.length; q++) {
        const val = (cols[q + 1] || '').toUpperCase();
        if (OPCOES.includes(val)) respostas[q] = val;
      }
      alunos.push({ nome, respostas });
      importados++;
    }
    renderAlunos();
    toast(`${importados} aluno(s) importado(s)!`);
  };
  reader.readAsText(file);
  e.target.value = '';
}

function baixarModeloCSV(e) {
  e.preventDefault();
  const cab   = ['Nome', ...gabarito.map((_, i) => `Q${i + 1}`)].join(',');
  const ex    = ['Aluno Exemplo', ...gabarito.map(() => 'A')].join(',');
  const blob  = new Blob([cab + '\n' + ex + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = 'modelo_respostas.csv'; a.click();
  URL.revokeObjectURL(url);
}

function voltarGabarito() { showStep('step-gabarito'); }

function verResultados() {
  if (alunos.length === 0) { alert('Adicione pelo menos um aluno.'); return; }
  dadosCache = alunos.map(al => ({ ...al, ...calcular(al) }));
  dadosCache.sort((a, b) => b.nota - a.nota);
  renderResultados(dadosCache);
  renderEstatisticasQuestoes();
  renderRevisao();
  mudarAba('resultados');
  showStep('step-resultados');
}

// ═══════════════════════════ CALCULAR ═══════════════════════════

function calcular(al) {
  const pesoTotal = gabarito.reduce((s, q) => s + q.peso, 0);
  let pontosObtidos = 0, acertos = 0, erros = 0, brancos = 0;

  const detalhe = al.respostas.map((resp, qi) => {
    const q = gabarito[qi];
    if (!resp)          { brancos++;  return { status: 'branco', peso: q.peso }; }
    if (resp === q.resp){ acertos++; pontosObtidos += q.peso; return { status: 'certo',  peso: q.peso }; }
    erros++;
    return { status: 'errado', peso: q.peso };
  });

  const nota = pesoTotal > 0 ? (pontosObtidos / pesoTotal) * 10 : 0;
  return { acertos, erros, brancos, nota, detalhe, pontosObtidos, pesoTotal };
}

// ═══════════════════════════ ABA: RESULTADOS ═══════════════════════════

function renderResultados(dados) {
  const nm        = notaMinima();
  const container = document.getElementById('resultados-container');
  const pesoTotal = gabarito.reduce((s, q) => s + q.peso, 0);
  const media     = dados.reduce((s, d) => s + d.nota, 0) / (dados.length || 1);
  const aprovados = dados.filter(d => d.nota >= nm).length;

  container.innerHTML = `
    <div class="resumo-geral">
      <div class="resumo-item"><div class="val">${dados.length}</div><div class="lbl">Alunos</div></div>
      <div class="resumo-item"><div class="val">${gabarito.length}</div><div class="lbl">Questoes</div></div>
      <div class="resumo-item"><div class="val">${pesoTotal.toFixed(1)}</div><div class="lbl">Pts totais</div></div>
      <div class="resumo-item"><div class="val">${media.toFixed(1)}</div><div class="lbl">Media turma</div></div>
      <div class="resumo-item"><div class="val">${aprovados}/${dados.length}</div><div class="lbl">Aprovados (&ge;${nm})</div></div>
    </div>
    ${dados.map((d, i) => {
      const classe = d.nota >= nm ? (d.nota >= nm + 1 ? 'nota-ap' : 'nota-rp') : 'nota-rep';
      const pct    = pesoTotal > 0 ? Math.round((d.pontosObtidos / pesoTotal) * 100) : 0;
      return `
        <div class="resultado-card" id="rc-${i}">
          <div class="resultado-header" onclick="toggleResultado(${i})">
            <span class="nome">${i + 1}. ${d.nome}</span>
            <span class="nota-badge ${classe}">${d.nota.toFixed(1)} &mdash; ${d.pontosObtidos.toFixed(1)}/${pesoTotal.toFixed(1)} pts</span>
          </div>
          <div class="resultado-detalhe" id="res-${i}">
            <div class="acertos-bar"><div class="acertos-bar-fill" style="width:${pct}%"></div></div>
            <div style="font-size:.8rem;color:#777;margin:.25rem 0 .5rem">
              ${pct}% de aproveitamento &bull; ${d.acertos} acertos &bull; ${d.erros} erros &bull; ${d.brancos} em branco
            </div>
            <div class="questoes-resultado">
              ${d.detalhe.map((dt, qi) => {
                const ra = d.respostas[qi] || '-';
                const rc = gabarito[qi].resp || '-';
                let label;
                if (dt.status === 'certo')   label = `Q${qi+1}: ${ra} (+${dt.peso})`;
                else if (dt.status === 'errado') label = `Q${qi+1}: ${ra}&ne;${rc}`;
                else label = `Q${qi+1}: &mdash;`;
                return `<div class="q-result ${dt.status}">${label}</div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }).join('')}
  `;
  renderGrafico(dados);
}

function toggleResultado(i) { document.getElementById(`res-${i}`).classList.toggle('open'); }

// ═══════════════════════════ FILTRO ═══════════════════════════

function filtrarAlunos() {
  const termo = document.getElementById('filtro-aluno').value.toLowerCase();
  const filtrado = dadosCache.filter(d => d.nome.toLowerCase().includes(termo));
  renderResultados(filtrado);
}

// ═══════════════════════════ ABA: ESTATISTICAS POR QUESTAO ═══════════════════════════

function renderEstatisticasQuestoes() {
  const container = document.getElementById('questoes-stats-container');
  const total     = alunos.length;

  const stats = gabarito.map((q, qi) => {
    let acertos = 0, erros = 0, brancos = 0;
    const dist = {};
    alunos.forEach(al => {
      const r = al.respostas[qi] || '';
      if (!r)          { brancos++; }
      else if (r === q.resp) { acertos++; dist[r] = (dist[r] || 0) + 1; }
      else             { erros++;   dist[r] = (dist[r] || 0) + 1; }
    });
    const pct = total > 0 ? Math.round((acertos / total) * 100) : 0;
    return { qi, q, acertos, erros, brancos, pct, dist };
  });

  container.innerHTML = `
    <h2 class="grafico-titulo" style="margin-bottom:1rem">Estatisticas por Questao</h2>
    <div class="stats-grid">
      ${stats.map(s => {
        const fillClass = s.pct >= 70 ? 'stat-fill-ok' : s.pct >= 40 ? 'stat-fill-warn' : 'stat-fill-bad';
        const distStr = OPCOES
          .filter(op => s.dist[op])
          .map(op => `${op}:${s.dist[op]}`)
          .join(' &bull; ');
        return `
          <div class="stat-card">
            <div class="stat-titulo">Q${s.qi+1} &mdash; Gabarito: <strong>${s.q.resp || '?'}</strong> &mdash; Peso: ${s.q.peso}</div>
            <div class="stat-mini-bar"><div class="stat-mini-fill ${fillClass}" style="width:${s.pct}%"></div></div>
            <div class="stat-nums">
              <span style="color:#38a169;font-weight:700">${s.pct}% acerto</span>
              <span>${s.acertos} certas &bull; ${s.erros} erradas &bull; ${s.brancos} em branco</span>
            </div>
            ${distStr ? `<div style="font-size:.75rem;color:#888;margin-top:.25rem">${distStr}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

// ═══════════════════════════ ABA: REVISAO ═══════════════════════════

function renderRevisao() {
  const container = document.getElementById('revisao-container');
  const opts = dadosCache.map((d, i) => `<option value="${i}">${d.nome} (${d.nota.toFixed(1)})</option>`).join('');

  container.innerHTML = `
    <h2 class="grafico-titulo" style="margin-bottom:1rem">Revisao Lado a Lado</h2>
    <div class="revisao-select">
      <label>Selecionar aluno:</label>
      <select id="select-revisao" onchange="renderTabelaRevisao()">
        ${opts}
      </select>
    </div>
    <div id="tabela-revisao-wrap"></div>`;

  renderTabelaRevisao();
}

function renderTabelaRevisao() {
  const sel  = document.getElementById('select-revisao');
  if (!sel) return;
  const idx  = parseInt(sel.value);
  const d    = dadosCache[idx];
  if (!d) return;

  const rows = gabarito.map((q, qi) => {
    const ra  = d.respostas[qi] || '';
    const rc  = q.resp || '';
    const st  = !ra ? 'branco' : ra === rc ? 'certo' : 'errado';
    const raDisplay = ra
      ? (st === 'errado' ? `<span class="resp-errada">${ra}</span>` : ra)
      : '&mdash;';
    return `
      <tr class="${st}">
        <td><strong>Q${qi+1}</strong></td>
        <td class="gabarito-col">${rc || '?'}</td>
        <td>${raDisplay}</td>
        <td>${st === 'certo' ? '&#10003; +' + q.peso : st === 'errado' ? '&#10007;' : '&mdash;'}</td>
      </tr>`;
  }).join('');

  document.getElementById('tabela-revisao-wrap').innerHTML = `
    <table class="revisao-tabela">
      <thead><tr><th>Questao</th><th>Gabarito</th><th>Resposta de ${d.nome}</th><th>Resultado</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ═══════════════════════════ ABAS ═══════════════════════════

function mudarAba(aba) {
  abaAtiva = aba;
  ['resultados','questoes','revisao'].forEach(a => {
    document.getElementById(`painel-${a}`).style.display  = a === aba ? 'block' : 'none';
    document.getElementById(`aba-${a}`).classList.toggle('active', a === aba);
  });
}

// ═══════════════════════════ GRAFICO ═══════════════════════════

function renderGrafico(dados) {
  const nm     = notaMinima();
  const canvas = document.getElementById('grafico-canvas');
  const DPR    = window.devicePixelRatio || 1;
  const W      = canvas.parentElement.clientWidth - 64;
  const BAR_H  = 30;
  const PAD_L  = 150, PAD_R = 60, PAD_T = 24, PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const H      = PAD_T + dados.length * (BAR_H + 10) + PAD_B;

  canvas.width  = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, W, H);

  [0, 2, 4, 6, 8, 10].forEach(v => {
    const x = PAD_L + (v / 10) * chartW;
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, PAD_T); ctx.lineTo(x, H - PAD_B); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(v, x, H - PAD_B + 16);
  });

  const xAp = PAD_L + (nm / 10) * chartW;
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#e53e3e'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(xAp, PAD_T); ctx.lineTo(xAp, H - PAD_B); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#e53e3e'; ctx.font = 'bold 10px Segoe UI, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText(`Min ${nm}`, xAp, PAD_T - 8);

  dados.forEach((d, i) => {
    const y    = PAD_T + i * (BAR_H + 10);
    const barW = (d.nota / 10) * chartW;
    const cor  = d.nota >= nm ? (d.nota >= nm + 1 ? '#38a169' : '#d69e2e') : '#e53e3e';

    ctx.fillStyle = '#444'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textAlign = 'right';
    let nome = d.nome;
    while (ctx.measureText(nome).width > PAD_L - 10 && nome.length > 3) nome = nome.slice(0, -1);
    if (nome !== d.nome) nome += '…';
    ctx.fillText(nome, PAD_L - 8, y + BAR_H / 2 + 4);

    const grad = ctx.createLinearGradient(PAD_L, 0, PAD_L + barW, 0);
    grad.addColorStop(0, cor); grad.addColorStop(1, cor + 'aa');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(PAD_L, y, Math.max(barW, 2), BAR_H, 5); ctx.fill();

    ctx.fillStyle = '#333'; ctx.font = 'bold 11px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(d.nota.toFixed(1), PAD_L + barW + 6, y + BAR_H / 2 + 4);
  });

  ctx.fillStyle = '#777'; ctx.font = '11px Segoe UI, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('Nota (0-10)', PAD_L + chartW / 2, H - 6);
}

// ═══════════════════════════ IMPRIMIR ═══════════════════════════

function imprimirResultados() {
  mudarAba('resultados');
  document.querySelectorAll('.resultado-detalhe').forEach(el => el.classList.add('open'));
  setTimeout(() => window.print(), 150);
}

// ═══════════════════════════ EXPORTAR PDF ═══════════════════════════

function exportarPDF() {
  if (!window.jspdf) { toast('Biblioteca PDF nao carregada. Verifique sua conexao.'); return; }
  const { jsPDF } = window.jspdf;
  const nm        = notaMinima();
  const pesoTotal = gabarito.reduce((s, q) => s + q.peso, 0);
  const media     = dadosCache.reduce((s, d) => s + d.nota, 0) / (dadosCache.length || 1);
  const aprovados = dadosCache.filter(d => d.nota >= nm).length;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  let   y   = 15;

  // Cabecalho
  doc.setFillColor(26, 127, 75);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont(undefined, 'bold');
  doc.text('Relatorio de Resultados', W / 2, 12, { align: 'center' });
  doc.setFontSize(9); doc.setFont(undefined, 'normal');
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}`, W / 2, 20, { align: 'center' });
  y = 36;

  // Resumo geral
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10); doc.setFont(undefined, 'bold');
  doc.text('Resumo da Turma', 14, y); y += 5;

  doc.autoTable({
    startY: y,
    head: [['Alunos', 'Questoes', 'Pts Totais', 'Media', `Aprovados (>=${nm})`]],
    body: [[
      dadosCache.length,
      gabarito.length,
      pesoTotal.toFixed(1),
      media.toFixed(2),
      `${aprovados} / ${dadosCache.length}`
    ]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [26, 127, 75], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    theme: 'grid'
  });
  y = doc.lastAutoTable.finalY + 8;

  // Tabela de resultados
  doc.setFontSize(10); doc.setFont(undefined, 'bold');
  doc.text('Resultados por Aluno', 14, y); y += 4;

  const bodyAlunos = dadosCache.map((d, i) => [
    i + 1,
    d.nome,
    d.nota.toFixed(2),
    `${d.pontosObtidos.toFixed(1)} / ${pesoTotal.toFixed(1)}`,
    d.acertos,
    d.erros,
    d.brancos,
    d.nota >= nm ? 'Aprovado' : 'Reprovado'
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Nome', 'Nota', 'Pontos', 'Acertos', 'Erros', 'Brancos', 'Situacao']],
    body: bodyAlunos,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 127, 75], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      2: { halign: 'center' }, 3: { halign: 'center' },
      4: { halign: 'center' }, 5: { halign: 'center' },
      6: { halign: 'center' }, 7: { halign: 'center' }
    },
    didParseCell(data) {
      if (data.column.index === 7 && data.section === 'body') {
        const val = data.cell.raw;
        data.cell.styles.textColor = val === 'Aprovado' ? [26, 127, 75] : [229, 62, 62];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 14, right: 14 },
    theme: 'striped'
  });
  y = doc.lastAutoTable.finalY + 8;

  // Estatisticas por questao
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFontSize(10); doc.setFont(undefined, 'bold');
  doc.text('Estatisticas por Questao', 14, y); y += 4;

  const bodyQuestoes = gabarito.map((q, qi) => {
    let acertos = 0;
    alunos.forEach(al => { if (al.respostas[qi] === q.resp) acertos++; });
    const pct = alunos.length > 0 ? ((acertos / alunos.length) * 100).toFixed(1) : '0.0';
    return [`Q${qi + 1}`, q.resp || '?', q.peso, acertos, alunos.length - acertos, `${pct}%`];
  });

  doc.autoTable({
    startY: y,
    head: [['Questao', 'Gabarito', 'Peso', 'Acertos', 'Erros/Branco', '% Acerto']],
    body: bodyQuestoes,
    styles: { fontSize: 8, halign: 'center' },
    headStyles: { fillColor: [26, 127, 75], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    theme: 'striped'
  });

  // Rodape em todas as paginas
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setFontSize(8); doc.setFont(undefined, 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(`Pagina ${p} de ${totalPaginas} — Corretor de Prova`, W / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save('resultados_prova.pdf');
  toast('PDF exportado!');
}

// ═══════════════════════════ EXPORTAR CSV ═══════════════════════════

function exportarResultados() {
  const pesoTotal = gabarito.reduce((s, q) => s + q.peso, 0);
  let csv = 'Nome,Nota,Pontos,PontosTotais,Acertos,Erros,Brancos\n';
  dadosCache.forEach(d => {
    csv += `"${d.nome}",${d.nota.toFixed(2)},${d.pontosObtidos.toFixed(2)},${pesoTotal.toFixed(2)},${d.acertos},${d.erros},${d.brancos}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'resultados.csv'; a.click();
  URL.revokeObjectURL(url);
  toast('CSV exportado!');
}

// ═══════════════════════════ NAV ═══════════════════════════

function voltarAlunos() { showStep('step-alunos'); }

function novaProva() {
  gabarito = []; alunos = []; dadosCache = [];
  document.getElementById('num-questoes').value = 10;
  document.getElementById('nota-minima').value  = 6;
  document.getElementById('gabarito-grid').innerHTML  = '';
  document.getElementById('alunos-container').innerHTML = '';
  showStep('step-gabarito');
}

function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════ EXEMPLO ═══════════════════════════

function carregarExemplo() {
  gabarito = [
    { resp: 'A', peso: 1 }, { resp: 'C', peso: 1 }, { resp: 'B', peso: 2 },
    { resp: 'D', peso: 1 }, { resp: 'A', peso: 1 }, { resp: 'E', peso: 2 },
    { resp: 'B', peso: 1 }, { resp: 'C', peso: 1 }, { resp: 'D', peso: 2 },
    { resp: 'A', peso: 1 }
  ];
  alunos = [
    { nome: 'Ana Silva',         respostas: ['A','C','B','D','A','E','B','C','D','A'] },
    { nome: 'Bruno Costa',       respostas: ['A','C','A','D','B','E','B','A','D','C'] },
    { nome: 'Carla Mendes',      respostas: ['B','C','B','A','A','E','C','C','B','A'] },
    { nome: 'Diego Lopes',       respostas: ['A','B','B','D','A','A','B','C','D','E'] },
    { nome: 'Elisa Rocha',       respostas: ['A','C','B','D','C','E','A','C','A','A'] },
    { nome: 'Felipe Nunes',      respostas: ['A','C','B','D','A','E','B','C','D','A'] },
    { nome: 'Gabriela Teixeira', respostas: ['C','A','B','D','A','E','A','C','B','A'] },
    { nome: 'Henrique Dias',     respostas: ['A','C','E','D','B','A','B','C','D','C'] },
    { nome: 'Isabela Ferreira',  respostas: ['A','C','B','D','A','E','C','A','D','A'] },
    { nome: 'Joao Almeida',      respostas: ['B','A','B','C','A','E','B','D','A','A'] },
    { nome: 'Karen Souza',       respostas: ['A','C','B','D','A','E','B','C','A','B'] },
    { nome: 'Lucas Martins',     respostas: ['A','B','A','D','C','E','B','C','D','A'] },
    { nome: 'Mariana Oliveira',  respostas: ['A','C','B','A','A','B','B','C','D','A'] },
    { nome: 'Nicolas Pereira',   respostas: ['C','C','B','D','B','E','A','C','D','E'] },
    { nome: 'Olivia Santos',     respostas: ['A','C','B','D','A','E','B','C','D','A'] },
  ];
  document.getElementById('num-questoes').value = gabarito.length;
  renderGabarito();
  toast('Dados de exemplo carregados!');
}

window.addEventListener('DOMContentLoaded', () => gerarGabarito());
