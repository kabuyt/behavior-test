// 候補者用テストロジック
(() => {
  const TIME_LIMIT_SEC = 600; // 10分
  const state = {
    company: '',
    name: '',
    candidateNumber: '',
    answers: {},      // { 1: 3, 2: 2, ... }
    startedAt: null,
    submitted: false,
    timerId: null
  };

  const $ = (id) => document.getElementById(id);
  const show = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
  };

  // ステップ1 → 2
  $('intro-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.company = $('company').value.trim();
    state.name = $('name').value.trim();
    state.candidateNumber = $('candidate-number').value.trim();
    if (!state.company || !state.name) return;

    $('candidate-label').textContent = `${state.company} / ${state.name}`;
    renderQuestions();
    show('step-test');
    startTimer();
    state.startedAt = Date.now();
  });

  // 問題描画
  function renderQuestions() {
    const container = $('questions-container');
    container.innerHTML = QUESTIONS.map(q => `
      <article class="question" id="q-${q.n}">
        <h2><span class="qnum">【${q.n}】</span> ${escapeHtml(q.ja)}</h2>
        <p class="vi">${escapeHtml(q.vi)}</p>
        <div class="choices">
          ${q.choices.map(c => `
            <label class="choice">
              <input type="radio" name="q${q.n}" value="${c.id}">
              <span class="choice-body">
                <span class="choice-id">${c.id}</span>
                <span class="choice-text">
                  <span>${escapeHtml(c.ja)}</span>
                  <span class="vi">${escapeHtml(c.vi)}</span>
                </span>
              </span>
            </label>
          `).join('')}
        </div>
      </article>
    `).join('');

    container.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => {
        const qn = parseInt(input.name.replace('q', ''), 10);
        state.answers[qn] = parseInt(input.value, 10);
        updateProgress();
      });
    });
  }

  function updateProgress() {
    const count = Object.keys(state.answers).length;
    $('progress').textContent = `${count} / 6`;
    $('submit-btn').disabled = count < 6;
  }

  // タイマー
  function startTimer() {
    const deadline = Date.now() + TIME_LIMIT_SEC * 1000;
    state.timerId = setInterval(() => {
      const remain = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      const m = String(Math.floor(remain / 60)).padStart(2, '0');
      const s = String(remain % 60).padStart(2, '0');
      $('timer').textContent = `${m}:${s}`;
      if (remain <= 60) $('timer').classList.add('urgent');
      if (remain === 0) {
        clearInterval(state.timerId);
        submitAnswers(true);
      }
    }, 250);
  }

  // 送信
  $('submit-btn').addEventListener('click', () => {
    if (!confirm('回答を送信します。よろしいですか？\nBạn chắc chắn muốn gửi bài?')) return;
    submitAnswers(false);
  });

  async function submitAnswers(timedOut) {
    if (state.submitted) return;
    state.submitted = true;
    $('submit-btn').disabled = true;
    clearInterval(state.timerId);

    const payload = {
      company_name: state.company,
      candidate_name: state.name,
      candidate_number: state.candidateNumber || null,
      q1: state.answers[1] || null,
      q2: state.answers[2] || null,
      q3: state.answers[3] || null,
      q4: state.answers[4] || null,
      q5: state.answers[5] || null,
      q6: state.answers[6] || null,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
      user_agent: navigator.userAgent,
      notes: timedOut ? '時間切れで自動送信' : null
    };

    const { data, error } = await supabase
      .from('behavior_test_results')
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert('送信に失敗しました。担当者へ連絡してください。\n' + error.message);
      state.submitted = false;
      $('submit-btn').disabled = false;
      return;
    }

    $('done-meta').textContent = `受付ID: ${data.id.slice(0, 8)} / ${new Date().toLocaleString('ja-JP')}`;
    show('step-done');
  }

  // ページ離脱防止
  window.addEventListener('beforeunload', (e) => {
    if (state.startedAt && !state.submitted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
})();
