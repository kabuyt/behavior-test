(function () {
  const operatorChoices = [
    { value: "+", label: "+" },
    { value: "-", label: "-" },
    { value: "x", label: "×" },
    { value: "/", label: "÷" }
  ];

  const questions = [
    { id: "calc1", section: "arithmetic", number: 1, title: "25 + 48 =", type: "text", answerType: "number", correct: "73" },
    { id: "calc2", section: "arithmetic", number: 2, title: "100 - 37 =", type: "text", answerType: "number", correct: "63" },
    { id: "calc3", section: "arithmetic", number: 3, title: "12 × 8 =", type: "text", answerType: "number", correct: "96" },
    { id: "calc4", section: "arithmetic", number: 4, title: "84 ÷ 7 =", type: "text", answerType: "number", correct: "12" },
    { id: "calc5", section: "arithmetic", number: 5, title: "1時間30分 + 45分 =", type: "text", answerType: "time", correct: "135" },

    { id: "op1", section: "operators", number: 6, type: "operators", expression: ["24", "6", "9"], target: "13", correct: ["/", "+"] },
    { id: "op2", section: "operators", number: 7, type: "operators", expression: ["7", "8", "12"], target: "68", correct: ["x", "+"] },
    { id: "op3", section: "operators", number: 8, type: "operators", expression: ["45", "15", "7"], target: "10", correct: ["/", "+"] },
    { id: "op4", section: "operators", number: 9, type: "operators", expression: ["18", "14", "23"], target: "9", correct: ["+", "-"] },
    { id: "op5", section: "operators", number: 10, type: "operators", expression: ["48", "8", "2"], target: "3", correct: ["/", "/"] },

    {
      id: "sp1",
      section: "spatial",
      number: 11,
      type: "choice",
      title: "次に入る図形は？",
      promptHtml: "<div class=\"shape-sequence\"><span>□</span><span>○</span><span>△</span><span>□</span><span>○</span><span>△</span><span>□</span></div>",
      choices: [
        { value: "1", label: "1. □" },
        { value: "2", label: "2. ○" },
        { value: "3", label: "3. △" }
      ],
      correct: "2"
    },
    {
      id: "sp2",
      section: "spatial",
      number: 12,
      type: "choice",
      title: "展開図を組み立てたらどの図形になる？",
      promptImage: "assets/q2.png",
      choices: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" }
      ],
      correct: "3"
    },
    {
      id: "sp3",
      section: "spatial",
      number: 13,
      type: "choice",
      title: "展開図を組み立てたらどの図形になりますか？",
      promptImage: "assets/q3.png",
      choices: [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" }
      ],
      correct: "4"
    }
  ];

  function normalizeNumber(value) {
    return String(value || "").replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 65248)).replace(/\s+/g, "");
  }

  function normalizeTime(value) {
    const raw = normalizeNumber(value).toLowerCase();
    if (!raw) return "";
    const compact = raw
      .replace(/hours?/g, "時間")
      .replace(/hour/g, "時間")
      .replace(/minutes?/g, "分")
      .replace(/minute/g, "分");

    const colon = compact.match(/^(\d+):(\d{1,2})$/);
    if (colon) {
      return String(Number(colon[1]) * 60 + Number(colon[2]));
    }

    const hm = compact.match(/(\d+)時間(\d+)分?/);
    if (hm) {
      return String(Number(hm[1]) * 60 + Number(hm[2]));
    }

    const min = compact.match(/^(\d+)分?$/);
    if (min) {
      return String(Number(min[1]));
    }

    return compact;
  }

  function normalizeAnswer(question, answer) {
    if (question.type === "text") {
      if (question.answerType === "time") return normalizeTime(answer);
      return normalizeNumber(answer);
    }

    if (question.type === "operators") {
      const left = answer && answer[0] ? answer[0] : "";
      const right = answer && answer[1] ? answer[1] : "";
      return [left, right];
    }

    return String(answer || "");
  }

  function isAnswered(question, answer) {
    if (question.type === "operators") {
      return Array.isArray(answer) && answer[0] && answer[1];
    }
    return normalizeAnswer(question, answer) !== "";
  }

  function isCorrect(question, answer) {
    const normalized = normalizeAnswer(question, answer);
    if (question.type === "operators") {
      return normalized[0] === question.correct[0] && normalized[1] === question.correct[1];
    }
    return normalized === question.correct;
  }

  function displayOperator(value) {
    if (value === "/") return "÷";
    if (value === "x") return "×";
    return value;
  }

  function formatExpected(question) {
    if (question.type === "operators") {
      return question.expression[0] + " " + displayOperator(question.correct[0]) + " " + question.expression[1] + " " + displayOperator(question.correct[1]) + " " + question.expression[2] + " = " + question.target;
    }
    if (question.id === "calc5") {
      return "2時間15分";
    }
    return question.correct;
  }

  function formatAnswer(question, answer) {
    if (!isAnswered(question, answer)) return "未回答";
    if (question.type === "operators") {
      return question.expression[0] + " " + displayOperator(answer[0]) + " " + question.expression[1] + " " + displayOperator(answer[1]) + " " + question.expression[2] + " = " + question.target;
    }
    if (question.id === "calc5") {
      const normalized = normalizeAnswer(question, answer);
      const minutes = Number(normalized);
      if (Number.isFinite(minutes)) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        return hour + "時間" + minute + "分";
      }
    }
    return Array.isArray(answer) ? answer.join(", ") : String(answer);
  }

  function scoreAnswers(answers) {
    let score = 0;
    for (const question of questions) {
      if (isCorrect(question, answers[question.id])) score += 1;
    }
    return score;
  }

  window.TEST_APP = {
    title: "計算・空間認識テスト",
    durationSec: 20 * 60,
    questions,
    operatorChoices,
    normalizeAnswer,
    isAnswered,
    isCorrect,
    scoreAnswers,
    formatExpected,
    formatAnswer
  };
})();
