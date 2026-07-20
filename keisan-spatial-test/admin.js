(function () {
  const { questions, scoreAnswers, isCorrect, formatAnswer, formatExpected } = window.TEST_APP;
  const $ = (id) => document.getElementById(id);
  let allResults = [];
  let current = null;

  $("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("admin-pw").value !== ADMIN_PASSWORD) {
      alert("パスワードが違います。");
      return;
    }
    $("login-gate").classList.remove("active");
    $("admin-main").classList.add("active");
    loadResults();
  });

  $("reload-btn").addEventListener("click", loadResults);
  $("search").addEventListener("input", renderList);
  $("csv-btn").addEventListener("click", exportCSV);
  $("pdf-btn").addEventListener("click", downloadPDF);

  async function loadResults() {
    const { data, error } = await supabase
      .from("calculation_spatial_test_results")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      const extra = error.message && error.message.indexOf("calculation_spatial_test_results") !== -1
        ? "\n\nSupabase に schema.sql が未適用です。先にテーブルを作成してください。"
        : "";
      alert("読込に失敗しました。\n" + error.message + extra);
      return;
    }

    allResults = (data || []).map((item) => {
      const answers = item.answers || {};
      const score = Number.isFinite(item.score) ? item.score : scoreAnswers(answers);
      return Object.assign({}, item, { score, max_score: item.max_score || questions.length });
    });
    renderSummary();
    renderList();
    renderStats();
  }

  function renderSummary() {
    const total = allResults.length;
    const average = total ? (allResults.reduce((sum, item) => sum + item.score, 0) / total).toFixed(1) : "0";
    const best = total ? Math.max.apply(null, allResults.map((item) => item.score)) : 0;
    $("sum-total").textContent = String(total);
    $("sum-average").textContent = average + " / " + questions.length;
    $("sum-best").textContent = best + " / " + questions.length;
  }

  function renderList() {
    const keyword = $("search").value.trim().toLowerCase();
    const rows = allResults.filter((item) => !keyword || String(item.candidate_name || "").toLowerCase().includes(keyword));
    $("results-body").innerHTML = rows.map((item) => `
      <tr>
        <td>${formatDate(item.submitted_at)}</td>
        <td>${escapeHtml(item.candidate_name)}</td>
        <td><strong>${item.score} / ${item.max_score}</strong></td>
        <td>${formatDuration(item.duration_seconds)}</td>
        <td><button class="link-btn" data-detail-id="${item.id}">詳細</button></td>
      </tr>
    `).join("") || "<tr><td colspan=\"5\" class=\"muted center\">結果がありません。</td></tr>";

    document.querySelectorAll("[data-detail-id]").forEach((button) => {
      button.addEventListener("click", () => {
        current = allResults.find((item) => item.id === button.dataset.detailId) || null;
        renderDetail();
      });
    });
  }

  function renderDetail() {
    if (!current) {
      $("detail-body").innerHTML = "<p class=\"muted\">左の一覧から受験者を選択してください。</p>";
      $("pdf-btn").disabled = true;
      return;
    }

    const answerCards = questions.map((question) => {
      const answer = current.answers ? current.answers[question.id] : undefined;
      const correct = isCorrect(question, answer);
      return `
        <article class="answer-card ${correct ? "correct" : "incorrect"}">
          <div class="answer-top">
            <strong>Q${question.number}</strong>
            <span class="status-chip ${correct ? "ok" : "ng"}">${correct ? "正解" : "不正解"}</span>
          </div>
          <h3>${escapeHtml(question.title || question.expression.join(" ? ") + " = " + question.target)}</h3>
          <p><strong>回答:</strong> ${escapeHtml(formatAnswer(question, answer))}</p>
          <p><strong>正答:</strong> ${escapeHtml(formatExpected(question))}</p>
        </article>
      `;
    }).join("");

    $("detail-body").innerHTML = `
      <article class="report-sheet">
        <div class="detail-head">
          <div>
            <h3>${escapeHtml(current.candidate_name)}</h3>
            <p>${formatDate(current.submitted_at)} / ${current.score}点 / ${formatDuration(current.duration_seconds)}</p>
          </div>
          <div class="score-badge">${current.score} / ${current.max_score}</div>
        </div>
        <div class="answer-grid">${answerCards}</div>
      </article>
    `;
    $("pdf-btn").disabled = false;
  }

  function downloadPDF() {
    if (!current) {
      alert("先に受験者の詳細を開いてください。");
      return;
    }

    const report = document.querySelector("#detail-body .report-sheet");
    if (!report) {
      alert("PDFにする内容が見つかりません。");
      return;
    }

    const button = $("pdf-btn");
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "PDF作成中...";

    const filename = buildPdfFileName(current);
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    }).from(report).save().then(() => {
      button.disabled = false;
      button.textContent = original;
    }).catch((error) => {
      alert("PDF出力に失敗しました。\n" + error.message);
      button.disabled = false;
      button.textContent = original;
    });
  }

  function renderStats() {
    $("stats-body").innerHTML = questions.map((question) => {
      const answered = allResults.filter((item) => item.answers && item.answers[question.id] !== undefined);
      const correctCount = answered.filter((item) => isCorrect(question, item.answers[question.id])).length;
      const rate = answered.length ? Math.round((correctCount / answered.length) * 100) : 0;
      return `
        <article class="stat-row">
          <div>
            <strong>Q${question.number}</strong>
            <span>${escapeHtml(question.title || question.expression.join(" ? ") + " = " + question.target)}</span>
          </div>
          <div class="stat-bar">
            <span class="stat-fill" style="width:${rate}%"></span>
          </div>
          <div class="stat-meta">${correctCount} / ${answered.length} (${rate}%)</div>
        </article>
      `;
    }).join("");
  }

  function exportCSV() {
    if (!allResults.length) {
      alert("出力できる結果がありません。");
      return;
    }

    const header = ["submitted_at", "candidate_name", "score", "max_score", "duration_seconds"].concat(questions.map((question) => question.id));
    const rows = allResults.map((item) => {
      const values = [item.submitted_at, item.candidate_name, item.score, item.max_score, item.duration_seconds];
      for (const question of questions) {
        const answer = item.answers ? item.answers[question.id] : "";
        values.push(Array.isArray(answer) ? answer.join(" ") : answer);
      }
      return values;
    });

    const csv = [header].concat(rows).map((row) => row.map((cell) => "\"" + String(cell ?? "").replace(/"/g, "\"\"") + "\"").join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "calculation-spatial-results.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return date.getFullYear() + "/" + pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function formatDuration(value) {
    if (value == null) return "-";
    const minute = Math.floor(Number(value) / 60);
    const second = Number(value) % 60;
    return minute + "分" + second + "秒";
  }

  function buildPdfFileName(item) {
    const date = item.submitted_at ? item.submitted_at.slice(0, 10) : "result";
    const name = String(item.candidate_name || "candidate").replace(/[\\/:*?\"<>|]/g, "_");
    return "計算・空間認識テスト_" + name + "_" + date + ".pdf";
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }
})();
