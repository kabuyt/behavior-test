// 候補者用テストロジック
(() => {
  const TIME_LIMIT_SEC = 600; // 10分
  const state = {
    name: '',
    interviewId: '',
    candidateNo: '',
    managed: false,
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

  async function initializeCandidate() {
    const params = new URLSearchParams(window.location.search);
    const interviewId = params.get('session')?.trim() || '';
    const candidateNo = params.get('no')?.trim() || '';
    if (!interviewId && !candidateNo) return;

    const startButton = $('intro-form').querySelector('button[type="submit"]');
    startButton.disabled = true;
    $('name').disabled = true;
    if (!interviewId || !candidateNo) {
      showIntroError('受験URLが正しくありません。担当者に新しいQR受験票を確認してください。\nĐường dẫn dự thi không hợp lệ. Vui lòng liên hệ người phụ trách.');
      return;
    }

    const { data, error } = await supabase.rpc('get_interview_candidate_for_test', {
      p_interview_id: interviewId,
      p_candidate_no: candidateNo,
      p_test_key: 'behavior'
    });
    const candidate = Array.isArray(data) ? data[0] : null;
    if (error || !candidate) {
      showIntroError('候補者を確認できませんでした。この企業では行動選択テストを実施しない設定か、URLが古い可能性があります。\nKhông thể xác nhận ứng viên. Vui lòng liên hệ người phụ trách.');
      return;
    }

    state.interviewId = interviewId;
    state.candidateNo = candidateNo;
    state.managed = true;
    state.name = candidate.candidate_name || `No.${candidateNo}`;
    $('name').value = state.name;
    $('name').readOnly = true;
    $('name').disabled = false;
    $('managed-notice').hidden = false;
    startButton.disabled = false;
  }

  function showIntroError(message) {
    const error = $('intro-error');
    error.textContent = message;
    error.hidden = false;
  }

  // ステップ1 → 2
  $('intro-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.name = state.managed ? state.name : $('name').value.trim();
    if (!state.name) return;

    $('candidate-label').textContent = state.name;
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

    const durationSeconds = Math.round((Date.now() - state.startedAt) / 1000);
    let data;
    let error;
    if (state.managed) {
      ({ data, error } = await supabase.rpc('submit_interview_behavior_result', {
        p_interview_id: state.interviewId,
        p_candidate_no: state.candidateNo,
        p_q1: state.answers[1] || null,
        p_q2: state.answers[2] || null,
        p_q3: state.answers[3] || null,
        p_q4: state.answers[4] || null,
        p_q5: state.answers[5] || null,
        p_q6: state.answers[6] || null,
        p_duration_seconds: durationSeconds,
        p_user_agent: navigator.userAgent,
        p_notes: timedOut ? '時間切れで自動送信' : null
      }));
    } else {
      ({ error } = await supabase.from('behavior_test_results').insert({
        company_name: '',
        candidate_name: state.name,
        q1: state.answers[1] || null,
        q2: state.answers[2] || null,
        q3: state.answers[3] || null,
        q4: state.answers[4] || null,
        q5: state.answers[5] || null,
        q6: state.answers[6] || null,
        duration_seconds: durationSeconds,
        user_agent: navigator.userAgent,
        notes: timedOut ? '時間切れで自動送信' : null
      }));
    }

    if (error) {
      alert('送信に失敗しました。担当者へ連絡してください。\n' + error.message);
      state.submitted = false;
      $('submit-btn').disabled = false;
      return;
    }

    const receiptId = typeof data === 'string' ? data.slice(0, 8) : '';
    $('done-meta').textContent = `${receiptId ? `受付ID: ${receiptId} / ` : ''}${new Date().toLocaleString('ja-JP')}`;
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

  initializeCandidate();
})();
