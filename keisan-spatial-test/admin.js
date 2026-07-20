(function () {
  const { questions, scoreAnswers, isCorrect, formatAnswer, formatExpected } = window.TEST_APP;
  const $ = (id) => document.getElementById(id);

  let allResults = [];
  let current = null;
  let selectedIds = new Set();

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
  $("bulk-pdf-btn").addEventListener("click", downloadSelectedAsPdf);
  $("select-all").addEventListener("change", toggleSelectAll);

  async function loadResults() {
    const { data, error } = await supabase
      .from("calculation_spatial_test_results")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      const extra = error.message && error.message.indexOf("calculation_spatial_test_results") !== -1
        ? "\n\nSupabase に schema.sql が未適用の可能性があります。"
        : "";
      alert("読込に失敗しました。\n" + error.message + extra);
      return;
    }

    allResults = (data || []).map((item) => {
      const answers = item.answers || {};
      const score = Number.isFinite(item.score) ? item.score : scoreAnswers(answers);
      return Object.assign({}, item, { score, max_score: item.max_score || questions.length });
    });

    selectedIds = new Set([...selectedIds].filter((id) => allResults.some((item) => item.id === id)));
    if (current && !allResults.some((item) => item.id === current.id)) current = null;

    renderSummary();
    renderList();
    renderStats();
    renderDetail();
    updateSelectionUi();
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
    const rows = filteredResults(keyword);

    $("results-body").innerHTML = rows.map((item) => `
      <tr>
        <td><input type="checkbox" class="row-check" data-id="${item.id}" ${selectedIds.has(item.id) ? "checked" : ""}></td>
        <td>${formatDate(item.submitted_at)}</td>
        <td>${escapeHtml(item.candidate_name)}</td>
        <td><strong>${item.score} / ${item.max_score}</strong></td>
        <td>${formatDuration(item.duration_seconds)}</td>
        <td><button class="link-btn" data-detail-id="${item.id}">詳細</button></td>
      </tr>
    `).join("") || "<tr><td colspan=\"6\" class=\"muted center\">結果がありません。</td></tr>";

    document.querySelectorAll(".row-check").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedIds.add(checkbox.dataset.id);
        else selectedIds.delete(checkbox.dataset.id);
        updateSelectionUi();
      });
    });

    document.querySelectorAll("[data-detail-id]").forEach((button) => {
      button.addEventListener("click", () => {
        current = allResults.find((item) => item.id === button.dataset.detailId) || null;
        renderDetail();
      });
    });

    syncSelectAllState(rows);
  }

  function renderDetail() {
    if (!current) {
      $("detail-body").innerHTML = "<p class=\"muted\">左の一覧から受験者を選択してください。</p>";
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
          <h3>${escapeHtml(question.title || buildOperatorTitle(question))}</h3>
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
            <span>${escapeHtml(question.title || buildOperatorTitle(question))}</span>
          </div>
          <div class="stat-bar">
            <span class="stat-fill" style="width:${rate}%"></span>
          </div>
          <div class="stat-meta">${correctCount} / ${answered.length} (${rate}%)</div>
        </article>
      `;
    }).join("");
  }

  function toggleSelectAll() {
    const rows = filteredResults($("search").value.trim().toLowerCase());
    if ($("select-all").checked) {
      rows.forEach((item) => selectedIds.add(item.id));
    } else {
      rows.forEach((item) => selectedIds.delete(item.id));
    }
    renderList();
    updateSelectionUi();
  }

  function updateSelectionUi() {
    $("selected-meta").textContent = selectedIds.size + "人選択中";
    $("bulk-pdf-btn").disabled = selectedIds.size === 0;
  }

  function syncSelectAllState(rows) {
    const total = rows.length;
    const selected = rows.filter((item) => selectedIds.has(item.id)).length;
    $("select-all").checked = total > 0 && selected === total;
  }

  function filteredResults(keyword) {
    return allResults.filter((item) => !keyword || String(item.candidate_name || "").toLowerCase().includes(keyword));
  }

  function downloadSelectedAsPdf() {
    const selected = allResults.filter((item) => selectedIds.has(item.id));
    if (!selected.length) {
      alert("PDFに出力する受験者を選択してください。");
      return;
    }

    const container = document.createElement("div");
    container.className = "pdf-report";
    container.innerHTML = buildPdfMarkup(selected);
    document.body.appendChild(container);

    const button = $("bulk-pdf-btn");
    const original = button.textContent;
    button.disabled = true;
    button.textContent = "PDF作成中...";

    html2pdf().set({
      margin: [8, 8, 8, 8],
      filename: buildMergedPdfFileName(selected),
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    }).from(container).save().then(() => {
      container.remove();
      button.disabled = false;
      button.textContent = original;
      updateSelectionUi();
    }).catch((error) => {
      container.remove();
      button.disabled = false;
      button.textContent = original;
      updateSelectionUi();
      alert("PDF出力に失敗しました。\n" + error.message);
    });
  }

  function buildPdfMarkup(items) {
    return items.map((item, index) => `
      <section class="pdf-person ${index < items.length - 1 ? "page-break" : ""}">
        <header class="pdf-person-head">
          <div>
            <h1>計算・空間認識テスト 結果</h1>
            <p class="pdf-name">${escapeHtml(item.candidate_name)}</p>
            <p class="pdf-meta">受験日時: ${formatDate(item.submitted_at)} / 所要時間: ${formatDuration(item.duration_seconds)}</p>
          </div>
          <div class="pdf-score">${item.score} / ${item.max_score}</div>
        </header>
        <table class="pdf-table">
          <thead>
            <tr>
              <th>Q</th>
              <th>回答</th>
              <th>正答</th>
              <th>判定</th>
            </tr>
          </thead>
          <tbody>
            ${questions.map((question) => {
              const answer = item.answers ? item.answers[question.id] : undefined;
              const correct = isCorrect(question, answer);
              return `
                <tr>
                  <td>Q${question.number}</td>
                  <td>${escapeHtml(formatAnswer(question, answer))}</td>
                  <td>${escapeHtml(formatExpected(question))}</td>
                  <td>${correct ? "正解" : "不正解"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </section>
    `).join("");
  }

  function buildMergedPdfFileName(items) {
    const date = new Date().toISOString().slice(0, 10);
    return "計算・空間認識テスト_選択結果_" + items.length + "名_" + date + ".pdf";
  }

  function buildOperatorTitle(question) {
    return question.expression.join(" ? ") + " = " + question.target;
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
