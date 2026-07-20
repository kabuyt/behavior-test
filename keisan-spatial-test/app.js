(function () {
  const state = {
    name: "",
    answers: {},
    startedAt: null,
    submitted: false,
    timerId: null
  };

  const { questions, operatorChoices, isAnswered } = window.TEST_APP;
  const $ = (id) => document.getElementById(id);

  function show(id) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
    $(id).classList.add("active");
  }

  function renderQuestion(question) {
    if (question.type === "text" && question.answerType === "time") {
      return `
        <article class="question" data-question-id="${question.id}">
          <div class="question-badge">Q${question.number}</div>
          <div class="question-body">
            <h3>${question.title}</h3>
            <p class="vi-text question-help">Chọn giờ và phút trong danh sách bên dưới. Vui lòng trả lời theo dạng giờ và phút.</p>
            <div class="time-select-row">
              <select data-kind="time-hour" data-question-id="${question.id}">
                <option value="">Giờ</option>
                ${buildNumberOptions(0, 5)}
              </select>
              <span class="time-unit">時間 / Giờ</span>
              <select data-kind="time-minute" data-question-id="${question.id}">
                <option value="">Phút</option>
                ${buildNumberOptions(0, 59)}
              </select>
              <span class="time-unit">分 / Phút</span>
            </div>
          </div>
        </article>
      `;
    }

    if (question.type === "text") {
      return `
        <article class="question" data-question-id="${question.id}">
          <div class="question-badge">Q${question.number}</div>
          <div class="question-body">
            <h3>${question.title}</h3>
            <p class="vi-text question-help">Nhập đáp án vào ô bên dưới.</p>
            <input class="answer-input" type="text" data-kind="text" data-question-id="${question.id}" placeholder="ここに入力 / Nhập đáp án">
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
            <p class="vi-text question-help">Chọn dấu tính đúng cho mỗi ô trống.</p>
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
          <p class="vi-text question-help">Hãy quan sát hình và chọn 1 đáp án đúng.</p>
          <div class="prompt-wrap">${prompt}</div>
          <div class="choice-row">${choices}</div>
        </div>
      </article>
    `;
  }

  function buildNumberOptions(min, max) {
    const parts = [];
    for (let value = min; value <= max; value += 1) {
      parts.push(`<option value="${value}">${value}</option>`);
    }
    return parts.join("");
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

    document.querySelectorAll("[data-kind='time-hour'], [data-kind='time-minute']").forEach((select) => {
      select.addEventListener("change", () => {
        const questionId = select.dataset.questionId;
        const existing = parseTimeAnswer(state.answers[questionId]);
        const hour = select.dataset.kind === "time-hour" ? select.value : existing.hour;
        const minute = select.dataset.kind === "time-minute" ? select.value : existing.minute;
        state.answers[questionId] = hour !== "" && minute !== "" ? `${hour}:${minute}` : "";
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

  function parseTimeAnswer(value) {
    if (!value || String(value).indexOf(":") === -1) return { hour: "", minute: "" };
    const parts = String(value).split(":");
    return { hour: parts[0] || "", minute: parts[1] || "" };
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

    const payload = {
      candidate_name: state.name,
      score: window.TEST_APP.scoreAnswers(state.answers),
      max_score: questions.length,
      answers: state.answers,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
      user_agent: navigator.userAgent,
      notes: timedOut ? "時間切れで自動送信" : null
    };

    const { error } = await supabase
      .from("calculation_spatial_test_results")
      .insert(payload);

    if (error) {
      const extra = error.message && error.message.indexOf("calculation_spatial_test_results") !== -1
        ? "\\n\\nSupabase に schema.sql がまだ適用されていない可能性があります。\\nCó thể schema.sql chưa được áp dụng trên Supabase."
        : "";
      alert("送信に失敗しました。\\nGửi bài thất bại.\\n" + error.message + extra);
      state.submitted = false;
      $("submit-btn").disabled = false;
      return;
    }

    $("done-meta").textContent = "結果は担当者が確認します。 / Kết quả sẽ được người phụ trách kiểm tra.";
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
    if (!window.confirm("回答を送信しますか？ / Bạn có muốn gửi bài không?")) return;
    submitAnswers(false);
  });

  window.addEventListener("beforeunload", (event) => {
    if (state.startedAt && !state.submitted) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
})();
