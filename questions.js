// 行動選択テスト 問題データ（日越併記）＋スコアリング＋行動分析
// 最良=3点 / 次善=2点 / 消極的=1点 / NG=0点
// ※候補者には得点も分析も表示しない。管理者のみ閲覧。

const QUESTIONS = [
  {
    n: 1,
    ja: 'あなたは今日、仕事へ行きます。朝起きたら、外は大雨で道は混んでいそうです。あなたはどうしますか？',
    vi: 'Ngày hôm nay bạn đi làm. Buổi sáng thức dậy, bạn thấy ngoài trời đang mưa lớn và có vẻ đường rất đông xe. Bạn sẽ làm thế nào?',
    choices: [
      {
        id: 1,
        ja: 'いつもどおり支度し、会社へ行く。',
        vi: 'Sửa soạn như thường ngày và đi làm.',
        score: 1,
        analysis: '真面目だが状況判断が弱い。遅刻リスクに気づいていない、または気づいても事前連絡しない傾向。受動的。'
      },
      {
        id: 2,
        ja: 'まだ寝ている友達に雨が降っていることを教えてあげる。',
        vi: 'Thông báo cho những bạn còn đang ngủ về việc trời mưa.',
        score: 0,
        analysis: '優先順位の判断に課題。自分の出社準備・会社への対応より他人の心配が先行している。職場では自分の職務責任が最優先。'
      },
      {
        id: 3,
        ja: 'もし遅れてしまったら、会社の人にちゃんと理由を説明する。',
        vi: 'Nếu trễ làm thì sẽ giải thích lý do đầy đủ cho người của công ty.',
        score: 2,
        analysis: '事後報告の意識はあるが、事前連絡（＝予防）の発想がない。遅れてからの対応では信頼は回復しづらい。'
      },
      {
        id: 4,
        ja: '会社の人へ連絡してから会社へ行く。',
        vi: 'Liên lạc với người của công ty rồi đi làm.',
        score: 3,
        analysis: '【最良】リスクを事前に共有できる「報・連・相」の基本が身についている。主体的で信頼されやすいタイプ。'
      }
    ]
  },
  {
    n: 2,
    ja: '仕事中、ミスをしました。あなたはどうしますか？',
    vi: 'Bạn đã gây ra lỗi trong công việc. Bạn sẽ làm như thế nào?',
    choices: [
      {
        id: 1,
        ja: '頑張って自分でミスを直し、問題を解決する。',
        vi: 'Cố gắng tự mình sửa chữa và giải quyết vấn đề.',
        score: 1,
        analysis: '責任感はあるが、独断で処理するのは危険。食品製造など安全品質に関わる現場では「隠蔽」と同視されるリスクあり。'
      },
      {
        id: 2,
        ja: '叱られてしまうが、会社の人に報告する。',
        vi: 'Thông báo cho người của công ty mặc dù sẽ bị khiển trách.',
        score: 3,
        analysis: '【最良】叱られる恐れより誠実さを優先できる。職場で最も重視される資質。安全・品質管理にも適性あり。'
      },
      {
        id: 3,
        ja: '1つのミスは問題ないので、気にせず次の仕事を進める。',
        vi: 'Chỉ 1 lỗi thì không có vấn đề gì nên sẽ bỏ qua và tiếp tục công việc.',
        score: 0,
        analysis: '【要注意】問題意識の欠如。小さなミスを放置する習慣は重大事故の温床。採用には慎重な判断が必要。'
      },
      {
        id: 4,
        ja: '前に友達も同じミスをして報告せず、大きなトラブルにならなかったので問題ない。',
        vi: 'Trước đó đồng nghiệp cũng mắc lỗi tương tự nhưng không báo cáo và không xảy ra rắc rối gì lớn nên không báo cáo cũng không sao.',
        score: 0,
        analysis: '【要注意】ルール違反を他人の前例で正当化する思考パターン。職場規律とコンプライアンス面で重大な懸念。'
      }
    ]
  },
  {
    n: 3,
    ja: '朝、会社で会ったAさんに挨拶をしましたが、挨拶を返してもらえませんでした。あなたはどうしますか？',
    vi: 'Buổi sáng, bạn đã gặp anh A ở công ty và đã chào, tuy nhiên anh A không chào lại. Bạn sẽ làm như thế nào?',
    choices: [
      {
        id: 1,
        ja: '次に会ったときも、毎回挨拶を続ける。',
        vi: 'Những lần gặp tiếp theo đều tiếp tục chào.',
        score: 3,
        analysis: '【最良】相手の反応に振り回されず、礼儀を貫ける。精神的に安定しており、人間関係の摩擦に強い。'
      },
      {
        id: 2,
        ja: '今日はもう挨拶せず、翌日以降挨拶をする。',
        vi: 'Hôm nay không chào nữa nhưng ngày tiếp theo trở đi sẽ lại chào.',
        score: 2,
        analysis: '一時的に距離を置くが、関係を断つわけではない柔軟さ。やや消極的だが常識の範囲内。'
      },
      {
        id: 3,
        ja: 'どうして挨拶を返してくれないのか、Aさんへ聞きに行く。',
        vi: 'Đến hỏi trực tiếp anh A tại sao không chào lại.',
        score: 1,
        analysis: '積極性はあるが、直接的に問い詰めるとトラブルに発展しやすい。入社直後の新人行動としては不向き。'
      },
      {
        id: 4,
        ja: '明日からAさんには挨拶しない。',
        vi: 'Từ ngày mai sẽ không chào anh A.',
        score: 0,
        analysis: '【要注意】感情で人間関係を断つ傾向。チームワークや協調性に重大な懸念。'
      }
    ]
  },
  {
    n: 4,
    ja: '寮のルールでは自分の食べ物に名前を書いたラベルを貼るルールです。ある日、誰の名前も無い自分の大好きな食べ物が冷蔵庫にありました。あなたはどうしますか？',
    vi: 'Nội quy của ký túc xá là phải dán nhãn có ghi tên lên đồ ăn của bản thân. Vào một ngày, bạn phát hiện có món đồ ăn bản thân ưa thích mà không có ghi tên ở trong tủ lạnh. Bạn sẽ thế nào?',
    choices: [
      {
        id: 1,
        ja: '食べてから、もし友達の物だったらあとで同じ物を買う。',
        vi: 'Sẽ lấy ăn. Nếu đó là đồ của bạn bè thì sẽ mua lại đồ ăn giống như vậy.',
        score: 1,
        analysis: '補填の意識はあるが「まず確認」の原則から外れる。共同生活では事後の弁償より事前の合意が重要。'
      },
      {
        id: 2,
        ja: '誰の名前も書いていないので自由に食べる。',
        vi: 'Tại vì không có ghi tên nên ăn thoải mái.',
        score: 0,
        analysis: '【要注意】所有物への配慮欠如。寮内トラブル（＝生活不適応）や社内での私物・備品トラブルのリスク。'
      },
      {
        id: 3,
        ja: '食べる前に友達に確認する。',
        vi: 'Trước khi ăn sẽ hỏi bạn bè.',
        score: 3,
        analysis: '【最良】「判断に迷ったらまず確認」の基本。共同生活適性が高く、職場でも指示確認がきちんとできるタイプ。'
      },
      {
        id: 4,
        ja: '私の大好物なので友達から私に対してのプレゼントなので食べる。',
        vi: 'Vì là món bản thân rất thích nên chắc là quà của bạn bè cho mình nên sẽ ăn.',
        score: 0,
        analysis: '【要注意】自己都合で解釈を歪める思考。倫理観・現実認識に懸念あり。'
      }
    ]
  },
  {
    n: 5,
    ja: 'あなたの家から駅まで歩いて15分です。11時発の電車に乗る為に、あなたは何時に家を出ますか？',
    vi: 'Từ nhà bạn đến ga mất khoảng 15 phút. Để kịp chuyến tàu khởi hành lúc 11 giờ, Bạn sẽ ra khỏi nhà lúc mấy giờ?',
    choices: [
      {
        id: 1,
        ja: '10:50',
        vi: '10:50',
        score: 0,
        analysis: '【要注意】物理的に間に合わない（10分しかない）。時間計算または時間管理の基礎に重大な欠損。日本の職場では致命的。'
      },
      {
        id: 2,
        ja: '10:45',
        vi: '10:45',
        score: 2,
        analysis: '計算は正確だが余裕ゼロ。信号・トラブルで即遅刻する。日本式「5分前行動」の感覚がまだ身についていない。'
      },
      {
        id: 3,
        ja: '10:40',
        vi: '10:40',
        score: 3,
        analysis: '【最良】5分の余裕を持つ日本式の時間感覚。遅刻を避ける合理的判断ができる。'
      },
      {
        id: 4,
        ja: '10:30',
        vi: '10:30',
        score: 2,
        analysis: '早すぎるが遅刻よりは良い。慎重派。時間管理への不安感が強いタイプ。'
      }
    ]
  },
  {
    n: 6,
    ja: '寮のお風呂を交代で使っています。あなたの順番は3人中2番目です。1番目の人はあなたの時間になってもまだ使っています。どうしますか？',
    vi: 'Mọi người sẽ thay phiên dùng phòng tắm trong ký túc xá. Trong 3 người, thứ tự của bạn là số 2. Người số 1 dùng phòng tắm lấn qua giờ của bạn thì bạn sẽ làm như thế nào?',
    choices: [
      {
        id: 1,
        ja: '何も気にせず、我慢する。',
        vi: 'Ráng ngồi chờ mà không nghĩ gì.',
        score: 1,
        analysis: '我慢強いが、問題を言語化・共有しない。不満が溜まってある日爆発するタイプ。'
      },
      {
        id: 2,
        ja: '1番目の友達の為に、そのまま使わせてあげる。',
        vi: 'Chắc bạn số 1 có việc gì đó nên cứ để bạn sử dụng.',
        score: 1,
        analysis: '優しいが自己主張が弱い。ルール破りを黙認する傾向は、職場の規律維持の面でも注意。'
      },
      {
        id: 3,
        ja: '1番目の友達に話し、早く終えてもらう。',
        vi: 'Nói chuyện với bạn số 1, yêu cầu tắm nhanh hơn.',
        score: 3,
        analysis: '【最良】当事者に直接かつ穏便に伝えられる。自己主張と配慮の両立。現場のコミュニケーション適性が高い。'
      },
      {
        id: 4,
        ja: '3番目の友達に相談する。',
        vi: 'Thảo luận với bạn số 3.',
        score: 0,
        analysis: '【要注意】当事者を飛ばして第三者に話す＝陰口・派閥化の兆候。職場の人間関係を複雑化させやすい。'
      }
    ]
  }
];

// 総合グレード
function calcGrade(score) {
  if (score >= 15) return { grade: 'A', label: '非常に優秀', comment: '報連相・時間管理・対人姿勢すべて高水準。強く推薦。' };
  if (score >= 11) return { grade: 'B', label: '良好',       comment: '基本的な職場適応力あり。教育で十分伸びる。推薦。' };
  if (score >= 7)  return { grade: 'C', label: '要確認',     comment: '判断の弱い項目あり。面談で具体事例を追加確認推奨。' };
  return             { grade: 'D', label: '要注意',     comment: '規律・倫理観に複数の懸念。採用は慎重に判断。' };
}
