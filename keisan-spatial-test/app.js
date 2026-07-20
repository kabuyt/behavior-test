(function () {
  const state = {
    name: "",
    answers: {},
    startedAt: null,
    submitted: false,
    timerId: null
  };

  const { questions, operatorChoices, isAnswered, scoreAnswers, formatAnswer } = window.TEST_APP;

  const $ = (id) => document.getElementById(id);

  function show(id) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    $(id).classList.add("active");
  }

  function renderQuestion(question) {
    if (question.type === "text") {
      return `
        <article class="question" data-question-id="${question.id}">
          <div class="question-badge">Q${question.number}</div>
          <div class="question-body">
            <h3>${question.title}</h3>
            <input class="answer-input" type="text" data-kind="text" data-question-id="${question.id}" placeholder="ここに入力">
          </div>
        </article>
      `;
    }

    if (question.type === "operators") {
      const options = operatorChoices.map((choice) => `<option value="${choice.value}">${choice.label}</option>`).join("");
      return `
        <article class="question" data-question-id="${question.id}">
          <div class="question-badge">Q${question.number}</div>
          <div class="question-body">
            <div class="operator-line">
              <span>${question.expression[0]}</span>
              <select data-kind="operator" data-position="0" data-question-id="${question.id}">
                <option value="">?</option>
                ${options}
              </select>
              <span>${question.expression[1]}</span>
              <select data-kind="operator" data-position="1" data-question-id="${question.id}">
                <option value="">?</option>
                ${options}
              </select>
              <span>${question.expression[2]} = ${question.target}</span>
            </div>
          </div>
        </article>
      `;
    }

    const prompt = question.promptImage
      ? `<img class="prompt-image" src="${question.promptImage}" alt="${question.title}">`
      : question.promptHtml;

    const choices = question.choices.map((choice) => `
      <label class="choice-pill">
        <input type="radio" name="${question.id}" value="${choice.value}" data-kind="choice" data-question-id="${question.id}">
        <span>${choice.label}</span>
      </label>
    `).join("");

    return `
      <article class="question image-question" data-question-id="${question.id}">
        <div class="question-badge">Q${question.number}</div>
        <div class="question-body">
          <h3>${question.title}</h3>
          <div class="prompt-wrap">${prompt}</div>
          <div class="choice-row">${choices}</div>
        </div>
      </article>
    `;
  }

  function renderAll() {
    $("section-arithmetic").innerHTML = questions.filter((q) => q.section === "arithmetic").map(renderQuestion).join("");
    $("section-operators").innerHTML = questions.filter((q) => q.section === "operators").map(renderQuestion).join("");
    $("section-spatial").innerHTML = questions.filter((q) => q.section === "spatial").map(renderQuestion).join("");

    document.querySelectorAll("[data-kind='text']").forEach((input) => {
      input.addEventListener("input", () => {
        state.answers[input.dataset.questionId] = input.value.trim();
        updateProgress();
      });
    });

    document.querySelectorAll("[data-kind='operator']").forEach((select) => {
      select.addEventListener("change", () => {
        const questionId = select.dataset.questionId;
        const prev = Array.isArray(state.answers[questionId]) ? state.answers[questionId].slice() : ["", ""];
        prev[Number(select.dataset.position)] = select.value;
        state.answers[questionId] = prev;
        updateProgress();
      });
    });

    document.querySelectorAll("[data-kind='choice']").forEach((radio) => {
      radio.addEventListener("change", () => {
        state.answers[radio.dataset.questionId] = radio.value;
        updateProgress();
      });
    });
  }

  function updateProgress() {
    const answeredCount = questions.filter((question) => isAnswered(question, state.answers[question.id])).length;
    $("progress").textContent = answeredCount + " / " + questions.length;
    $("submit-btn").disabled = answeredCount !== questions.length;
  }

  function startTimer() {
    const deadline = Date.now() + window.TEST_APP.durationSec * 1000;
    state.timerId = window.setInterval(() => {
      const remain = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      const minute = String(Math.floor(remain / 60)).padStart(2, "0");
      const second = String(remain % 60).padStart(2, "0");
      $("timer").textContent = minute + ":" + second;
      if (remain <= 60) $("timer").classList.add("urgent");
      if (remain === 0) {
        window.clearInterval(state.timerId);
        submitAnswers(true);
      }
    }, 250);
  }

  async function submitAnswers(timedOut) {
    if (state.submitted) return;
    state.submitted = true;
    $("submit-btn").disabled = true;
    window.clearInterval(state.timerId);

    const score = scoreAnswers(state.answers);
    const payload = {
      candidate_name: state.name,
      score,
      max_score: questions.length,
      answers: state.answers,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
      user_agent: navigator.userAgent,
      notes: timedOut ? "時間切れで自動送信" : null
    };

    const { data, error } = await supabase
      .from("calculation_spatial_test_results")
      .insert(payload)
      .select()
      .single();

    if (error) {
      const extra = error.message && error.message.indexOf("calculation_spatial_test_results") !== -1
        ? "\\n\\nSupabase に schema.sql がまだ適用されていない可能性があります。"
        : "";
      alert("送信に失敗しました。\\n" + error.message + extra);
      state.submitted = false;
      $("submit-btn").disabled = false;
      return;
    }

    const summary = [
      "受験者: " + data.candidate_name,
      "得点: " + score + " / " + questions.length,
      "保存ID: " + String(data.id).slice(0, 8)
    ];
    $("done-meta").textContent = summary.join(" / ");
    show("step-done");
  }

  $("intro-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("name").value.trim();
    if (!name) return;
    state.name = name;
    state.startedAt = Date.now();
    $("candidate-label").textContent = name;
    renderAll();
    updateProgress();
    show("step-test");
    startTimer();
  });

  $("submit-btn").addEventListener("click", () => {
    const preview = questions.map((question) => "Q" + question.number + ": " + formatAnswer(question, state.answers[question.id])).join("\n");
    if (!window.confirm("回答を送信しますか？\n\n" + preview)) return;
    submitAnswers(false);
  });

  window.addEventListener("beforeunload", (event) => {
    if (state.startedAt && !state.submitted) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
})();
