// 管理画面ロジック
(() => {
  const $ = (id) => document.getElementById(id);
  let allResults = [];

  // ログイン
  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('admin-pw').value === ADMIN_PASSWORD) {
      $('login-gate').classList.remove('active');
      $('admin-main').classList.add('active');
      loadResults();
    } else {
      alert('パスワードが違います');
    }
  });

  // タブ切替
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.id === `tab-${tab}`));
    document.querySelector('[data-tab="detail"]').style.display =
      tab === 'detail' ? '' : 'none';
  }

  $('reload-btn').addEventListener('click', loadResults);
  $('csv-btn').addEventListener('click', exportCSV);
  $('back-to-list').addEventListener('click', () => switchTab('list'));
  $('print-btn').addEventListener('click', () => window.print());
  $('pdf-btn').addEventListener('click', downloadPDF);

  let currentReportTarget = null;

  function downloadPDF() {
    const el = document.querySelector('#detail-body .report');
    if (!el) { alert('レポートが表示されていません'); return; }
    const meta = currentReportTarget;
    const fname = meta
      ? `行動選択テスト_${meta.company_name}_${meta.candidate_name}_${(meta.submitted_at||'').slice(0,10)}.pdf`
      : `行動選択テスト_${new Date().toISOString().slice(0,10)}.pdf`;

    const btn = $('pdf-btn');
    const orig = btn.textContent;
    btn.textContent = '生成中...';
    btn.disabled = true;

    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: fname,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(el).save().then(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }).catch(err => {
      alert('PDF生成に失敗しました: ' + err.message);
      btn.textContent = orig;
      btn.disabled = false;
    });
  }
  $('search').addEventListener('input', renderList);

  // データ取得
  async function loadResults() {
    const { data, error } = await supabase
      .from('behavior_test_results')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) { alert('読込失敗: ' + error.message); return; }
    allResults = data || [];
    renderList();
    renderStats();
  }

  // 一覧描画
  function renderList() {
    const kw = $('search').value.trim().toLowerCase();
    const rows = allResults.filter(r =>
      !kw ||
      (r.company_name || '').toLowerCase().includes(kw) ||
      (r.candidate_name || '').toLowerCase().includes(kw)
    );

    const body = $('results-body');
    body.innerHTML = rows.map(r => `
      <tr data-id="${r.id}">
        <td>${fmtDate(r.submitted_at)}</td>
        <td>${escapeHtml(r.company_name)}</td>
        <td>${escapeHtml(r.candidate_name)}</td>
        <td>${escapeHtml(r.candidate_number || '')}</td>
        <td>${escapeHtml(r.job_type || '')}</td>
        <td>${r.q1 ?? '-'}</td><td>${r.q2 ?? '-'}</td><td>${r.q3 ?? '-'}</td>
        <td>${r.q4 ?? '-'}</td><td>${r.q5 ?? '-'}</td><td>${r.q6 ?? '-'}</td>
        <td class="score">${r.total_score ?? '-'}</td>
        <td class="grade grade-${r.grade || 'x'}">${r.grade || '-'}</td>
        <td>${fmtDuration(r.duration_seconds)}</td>
        <td><button class="link detail-btn">詳細</button></td>
      </tr>
    `).join('') || '<tr><td colspan="15" class="empty">データなし</td></tr>';

    body.querySelectorAll('.detail-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        renderDetail(allResults.find(r => r.id === id));
      });
    });

    // サマリーカード
    const total = allResults.length;
    const byGrade = (g) => allResults.filter(r => r.grade === g).length;
    const avg = total
      ? (allResults.reduce((s, r) => s + (r.total_score || 0), 0) / total).toFixed(1)
      : '-';
    $('sum-total').textContent = total;
    $('sum-a').textContent = byGrade('A');
    $('sum-b').textContent = byGrade('B');
    $('sum-c').textContent = byGrade('C');
    $('sum-d').textContent = byGrade('D');
    $('sum-avg').textContent = avg;
  }

  // 集計描画
  function renderStats() {
    const host = $('question-stats');
    host.innerHTML = QUESTIONS.map(q => {
      const total = allResults.filter(r => r[`q${q.n}`] != null).length || 1;
      const bars = q.choices.map(c => {
        const n = allResults.filter(r => r[`q${q.n}`] === c.id).length;
        const pct = Math.round(n / total * 100);
        return `
          <div class="bar-row">
            <span class="bar-label">
              <span class="bar-id">${c.id}</span>
              <span class="bar-text">${escapeHtml(c.ja)}</span>
              <span class="bar-score score-${c.score}">${c.score}点</span>
            </span>
            <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
            <span class="bar-count">${n}人 (${pct}%)</span>
          </div>`;
      }).join('');
      return `
        <div class="stats-q">
          <h3>【${q.n}】${escapeHtml(q.ja)}</h3>
          ${bars}
        </div>`;
    }).join('');
  }

  // 個別詳細（レポート形式）
  function renderDetail(r) {
    if (!r) return;
    currentReportTarget = r;
    const grade = calcGrade(r.total_score || 0);
    const rows = QUESTIONS.map(q => {
      const chosenId = r[`q${q.n}`];
      const chosen = q.choices.find(c => c.id === chosenId);
      return `
        <section class="detail-q">
          <h3>【${q.n}】${escapeHtml(q.ja)}</h3>
          <p class="vi">${escapeHtml(q.vi)}</p>
          ${chosen ? `
            <div class="chosen score-${chosen.score}">
              <div class="chosen-head">
                選択: <strong>${chosen.id}</strong>
                <span class="score-pill">${chosen.score} / 3点</span>
              </div>
              <div class="chosen-text">${escapeHtml(chosen.ja)}</div>
              <div class="chosen-vi">${escapeHtml(chosen.vi)}</div>
              <div class="analysis"><strong>行動分析:</strong> ${escapeHtml(chosen.analysis)}</div>
            </div>
          ` : '<div class="chosen empty">未回答</div>'}
        </section>
      `;
    }).join('');

    $('detail-body').innerHTML = `
      <article class="report">
        <header class="report-head">
          <div>
            <h2>行動選択テスト 結果レポート</h2>
            <p class="meta">
              <strong>${escapeHtml(r.company_name)}</strong> / ${escapeHtml(r.candidate_name)}
              ${r.candidate_number ? ` (No.${escapeHtml(r.candidate_number)})` : ''}
            </p>
            <p class="meta">
              求人区分: ${escapeHtml(r.job_type || '-')} ／
              受験日時: ${fmtDate(r.submitted_at)} ／
              所要時間: ${fmtDuration(r.duration_seconds)}
            </p>
          </div>
          <div class="grade-box grade-${r.grade}">
            <div class="grade-letter">${r.grade || '-'}</div>
            <div class="grade-score">${r.total_score ?? 0} / 18点</div>
            <div class="grade-label">${grade.label}</div>
          </div>
        </header>
        <p class="overall">${escapeHtml(grade.comment)}</p>
        ${rows}
      </article>
    `;
    switchTab('detail');
    window.scrollTo(0, 0);
  }

  // CSV出力
  function exportCSV() {
    if (!allResults.length) { alert('データがありません'); return; }
    const header = ['受験日時','会社名','氏名','候補者番号','求人区分',
      'Q1','Q2','Q3','Q4','Q5','Q6','点数','評価','所要秒'];
    const rows = allResults.map(r => [
      fmtDate(r.submitted_at), r.company_name, r.candidate_name,
      r.candidate_number || '', r.job_type || '',
      r.q1, r.q2, r.q3, r.q4, r.q5, r.q6,
      r.total_score, r.grade, r.duration_seconds
    ]);
    const csv = [header, ...rows].map(row =>
      row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior_test_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // utils
  function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function fmtDuration(sec) {
    if (sec == null) return '-';
    return `${Math.floor(sec/60)}分${sec%60}秒`;
  }
  const pad = (n) => String(n).padStart(2, '0');
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
})();
