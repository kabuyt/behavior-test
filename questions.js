// 行動選択テスト 問題データ（日越併記）＋行動傾向コメント
// score は内部集計用。管理画面では点数・段階評価を表示しない。
// ※候補者には結果コメントを表示しない。管理者のみ閲覧。

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
        analysis: 'いつも通り行動しようとする傾向がある。天候や交通状況によって予定が変わる可能性を、事前に考えられるとよい。'
      },
      {
        id: 2,
        ja: 'まだ寝ている友達に雨が降っていることを教えてあげる。',
        vi: 'Thông báo cho những bạn còn đang ngủ về việc trời mưa.',
        score: 0,
        analysis: '周囲を気にかける姿勢がある。一方で、自分の出社準備や会社への連絡を同時に考えられるか確認したい。'
      },
      {
        id: 3,
        ja: 'もし遅れてしまったら、会社の人にちゃんと理由を説明する。',
        vi: 'Nếu trễ làm thì sẽ giải thích lý do đầy đủ cho người của công ty.',
        score: 2,
        analysis: '理由を説明しようとする意識がある。遅れる可能性がある時点で、早めに共有する発想につなげられるとよい。'
      },
      {
        id: 4,
        ja: '会社の人へ連絡してから会社へ行く。',
        vi: 'Liên lạc với người của công ty rồi đi làm.',
        score: 3,
        analysis: '遅れる可能性を事前に共有しようとしている。状況の変化を早めに伝える意識が見られる。'
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
        analysis: '自分で解決しようとする責任感が見られる。作業上のミスは一人で判断せず、周囲に共有する意識も確認したい。'
      },
      {
        id: 2,
        ja: '叱られてしまうが、会社の人に報告する。',
        vi: 'Thông báo cho người của công ty mặc dù sẽ bị khiển trách.',
        score: 3,
        analysis: '叱られる可能性があっても報告しようとしている。ミスを共有することの大切さを理解している傾向が見られる。'
      },
      {
        id: 3,
        ja: '1つのミスは問題ないので、気にせず次の仕事を進める。',
        vi: 'Chỉ 1 lỗi thì không có vấn đề gì nên sẽ bỏ qua và tiếp tục công việc.',
        score: 0,
        analysis: '小さなミスをそのままにしてしまう傾向が見られる。ミスの大小にかかわらず、確認や報告が必要な場面を理解できるとよい。'
      },
      {
        id: 4,
        ja: '前に友達も同じミスをして報告せず、大きなトラブルにならなかったので問題ない。',
        vi: 'Trước đó đồng nghiệp cũng mắc lỗi tương tự nhưng không báo cáo và không xảy ra rắc rối gì lớn nên không báo cáo cũng không sao.',
        score: 0,
        analysis: '過去の例を参考にして判断する傾向がある。状況が似ていても、必要な報告や確認は省略しない意識を確認したい。'
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
        analysis: '相手の反応に左右されず、挨拶を続けようとしている。礼儀を大切にする姿勢が見られる。'
      },
      {
        id: 2,
        ja: '今日はもう挨拶せず、翌日以降挨拶をする。',
        vi: 'Hôm nay không chào nữa nhưng ngày tiếp theo trở đi sẽ lại chào.',
        score: 2,
        analysis: 'その場では距離を置き、翌日以降は通常通り接しようとしている。無理に反応せず様子を見る傾向がある。'
      },
      {
        id: 3,
        ja: 'どうして挨拶を返してくれないのか、Aさんへ聞きに行く。',
        vi: 'Đến hỏi trực tiếp anh A tại sao không chào lại.',
        score: 1,
        analysis: '理由を確認しようとする積極性がある。聞き方やタイミングによって相手の受け止め方が変わる点を意識できるとよい。'
      },
      {
        id: 4,
        ja: '明日からAさんには挨拶しない。',
        vi: 'Từ ngày mai sẽ không chào anh A.',
        score: 0,
        analysis: '相手の反応を受けて距離を置きやすい傾向が見られる。職場では一度の出来事で関係を決めつけない姿勢も確認したい。'
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
        analysis: '後で補う意識はある。共同生活では、使う前に持ち主や周囲へ確認する習慣につなげられるとよい。'
      },
      {
        id: 2,
        ja: '誰の名前も書いていないので自由に食べる。',
        vi: 'Tại vì không có ghi tên nên ăn thoải mái.',
        score: 0,
        analysis: '名前がない物を自由に使ってよいと考える傾向が見られる。共同生活では、持ち主が分からない物の扱い方を確認したい。'
      },
      {
        id: 3,
        ja: '食べる前に友達に確認する。',
        vi: 'Trước khi ăn sẽ hỏi bạn bè.',
        score: 3,
        analysis: '食べる前に確認しようとしている。判断に迷う場面で、周囲に確認する意識が見られる。'
      },
      {
        id: 4,
        ja: '私の大好物なので友達から私に対してのプレゼントなので食べる。',
        vi: 'Vì là món bản thân rất thích nên chắc là quà của bạn bè cho mình nên sẽ ăn.',
        score: 0,
        analysis: '自分に都合のよい解釈をしやすい傾向が見られる。事実を確認してから行動する意識を確認したい。'
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
        analysis: '移動時間に対して出発時刻が遅めになっている。必要な所要時間を逆算する習慣を確認したい。'
      },
      {
        id: 2,
        ja: '10:45',
        vi: '10:45',
        score: 2,
        analysis: '必要時間は計算できているが、余裕時間は少ない。交通状況や準備時間も含めて考えられるとよい。'
      },
      {
        id: 3,
        ja: '10:40',
        vi: '10:40',
        score: 3,
        analysis: '必要時間に加えて少し余裕を持って行動しようとしている。時間を逆算して考える意識が見られる。'
      },
      {
        id: 4,
        ja: '10:30',
        vi: '10:30',
        score: 2,
        analysis: 'かなり余裕を持って行動しようとしている。早めに動く傾向があり、待ち時間とのバランスも確認したい。'
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
        analysis: '我慢して待とうとする傾向がある。共同生活では、自分の困りごとを穏やかに共有できるか確認したい。'
      },
      {
        id: 2,
        ja: '1番目の友達の為に、そのまま使わせてあげる。',
        vi: 'Chắc bạn số 1 có việc gì đó nên cứ để bạn sử dụng.',
        score: 1,
        analysis: '相手を思いやる姿勢がある。決められた順番や時間について、自分の希望も伝えられるか確認したい。'
      },
      {
        id: 3,
        ja: '1番目の友達に話し、早く終えてもらう。',
        vi: 'Nói chuyện với bạn số 1, yêu cầu tắm nhanh hơn.',
        score: 3,
        analysis: '当事者に直接、穏やかに伝えようとしている。自己主張と相手への配慮のバランスが取れている。'
      },
      {
        id: 4,
        ja: '3番目の友達に相談する。',
        vi: 'Thảo luận với bạn số 3.',
        score: 0,
        analysis: '相談しようとする姿勢がある。状況に応じて、誰にどのように相談するかを考えながら行動できるとよい。'
      }
    ]
  }
];
