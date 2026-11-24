/**
 * books-data.js - 朗読小説作品データ（誤読ゼロ・センテンス完全同期仕様）
 */

const AUDIO_BOOKS = [
  {
    id: 'meros',
    title: '走れメロス',
    author: '太宰 治',
    genre: '熱い友情・名作',
    icon: '🏃',
    sentences: [
      { text: 'メロスは激怒した。', audio: 'audio/books_sentence/meros_0.mp3' },
      { text: '必ず、かの邪智暴虐（じゃちぼうぎゃく）の王を除かなければならぬと決意した。', audio: 'audio/books_sentence/meros_1.mp3' },
      { text: 'メロスには政治がわからぬ。メロスは、村の牧人（ぼくじん）である。', audio: 'audio/books_sentence/meros_2.mp3' },
      { text: '笛を吹き、羊と遊んで暮して来た。', audio: 'audio/books_sentence/meros_3.mp3' },
      { text: 'けれども邪悪に対しては、人一倍に敏感であった。', audio: 'audio/books_sentence/meros_4.mp3' },
      { text: 'きょう未明メロスは村を出発し、野を越え山越え、十里（じゅうり）はなれた此のシラクスの市にやって来た。', audio: 'audio/books_sentence/meros_5.mp3' },
      { text: 'メロスには父も、母も無い。女房も無い。十六の内気な妹と二人暮しだ。', audio: 'audio/books_sentence/meros_6.mp3' },
      { text: '妹は、近々、一人の素朴な牧人を、婿に迎えることになっていた。結婚式も間近なのである。', audio: 'audio/books_sentence/meros_7.mp3' },
      { text: 'メロスは、それゆえ、花嫁の衣裳やら祝宴の御馳走（ごちそう）やらを買いに、はるばる市にやって来たのだ。', audio: 'audio/books_sentence/meros_8.mp3' }
    ]
  },
  {
    id: 'zenigata',
    title: '銭形平次捕物控',
    author: '野村 胡堂',
    genre: '痛快・時代小説',
    icon: '🪙',
    sentences: [
      { text: '神田明神下（かんだみょうじんした）の長屋に、銭形平次という岡っ引きが住んでおりました。', audio: 'audio/books_sentence/zenigata_0.mp3' },
      { text: '投げ銭の名人で、困った人を見捨ててはおけない、情に厚い男でございます。', audio: 'audio/books_sentence/zenigata_1.mp3' },
      { text: 'ある春の暮れ方、平次が縁側で煙草をくゆらせていると、手下の八五郎（はちごろう）が息せき切って飛び込んできました。', audio: 'audio/books_sentence/zenigata_2.mp3' },
      { text: '「親分！大変だ！呉服屋の大店（おおだな）に、神出鬼没の怪盗が現れたんでさあ！」', audio: 'audio/books_sentence/zenigata_3.mp3' },
      { text: '平次はニヤリと笑い、十手（じって）を懐に差し込むと立ち上がりました。', audio: 'audio/books_sentence/zenigata_4.mp3' },
      { text: '「よし八、行くぜ。悪党の鼻先を明かしてやろうじゃないか。」', audio: 'audio/books_sentence/zenigata_5.mp3' }
    ]
  },
  {
    id: 'chumon',
    title: '注文の多い料理店',
    author: '宮沢 賢治',
    genre: 'ワクワク名作童話',
    icon: '🍽️',
    sentences: [
      { text: '二人の若い紳士が、すっかりイギリスの兵隊のかたちをして、山奥を歩いておりました。', audio: 'audio/books_sentence/chumon_0.mp3' },
      { text: 'ぴかぴかする鉄砲をかついで、白熊のような大きな犬を二匹（にひき）つれておりました。', audio: 'audio/books_sentence/chumon_1.mp3' },
      { text: 'ぜんたい、ここはどこということもない深い山奥でした。', audio: 'audio/books_sentence/chumon_2.mp3' },
      { text: '二人は道に迷ってしまい、お腹が空いて困っていました。', audio: 'audio/books_sentence/chumon_3.mp3' },
      { text: 'そのときふと後ろを見ますと、立派な西洋造りの家が一軒建っていました。', audio: 'audio/books_sentence/chumon_4.mp3' },
      { text: 'そして玄関には、「西洋料理店 山猫軒（やまねこけん）」という札が出ていました。', audio: 'audio/books_sentence/chumon_5.mp3' },
      { text: '「どうだ、入ろうじゃないか。」二人は大喜びで、扉を開けて中へ入っていきました。', audio: 'audio/books_sentence/chumon_6.mp3' }
    ]
  },
  {
    id: 'kumo',
    title: '蜘蛛の糸',
    author: '芥川 龍之介',
    genre: '情景豊かな短編',
    icon: '🕸️',
    sentences: [
      { text: 'ある日の事でございます。', audio: 'audio/books_sentence/kumo_0.mp3' },
      { text: '御釈迦様（おしゃかさま）は極楽の蓮池（はすいけ）のふちを、独りでぶらぶら御歩きになっていらっしゃいました。', audio: 'audio/books_sentence/kumo_1.mp3' },
      { text: '池の中に咲いている蓮（はす）の花は、みんな玉のようにまっ白で、良い香りが絶え間なく溢れております。', audio: 'audio/books_sentence/kumo_2.mp3' },
      { text: '極楽はちょうど朝なのでございましょう。', audio: 'audio/books_sentence/kumo_3.mp3' },
      { text: '御釈迦様はやがて池のほとりに御たたずみになって、水の下をごらんになりました。', audio: 'audio/books_sentence/kumo_4.mp3' },
      { text: 'この極楽の蓮池の下は、ちょうど地獄の底に当たっております。', audio: 'audio/books_sentence/kumo_5.mp3' },
      { text: 'そこには、数え切れないほどの罪人たちが、苦しんでおりました。', audio: 'audio/books_sentence/kumo_6.mp3' }
    ]
  },
  {
    id: 'botchan',
    title: '坊っちゃん',
    author: '夏目 漱石',
    genre: 'ユーモア名作',
    icon: '🎓',
    sentences: [
      { text: '親譲（おやゆず）りの無鉄砲（むてっぽう）で小供の時から損ばかりしている。', audio: 'audio/books_sentence/botchan_0.mp3' },
      { text: '小学校に居る時分、学校の二階から飛び降りて一週間ほど腰を抜かした事がある。', audio: 'audio/books_sentence/botchan_1.mp3' },
      { text: 'なぜそんな無闇（むやみ）をしたと聞く人があるかも知れぬ。別段深い理由でもない。', audio: 'audio/books_sentence/botchan_2.mp3' },
      { text: '新築の二階から首を出していたら、同級生の一人が冗談に、いくら威張ってもそこから飛び降りる事は出来まいと囃（はや）したからである。', audio: 'audio/books_sentence/botchan_3.mp3' },
      { text: '小使（こづかい）に負ぶさって帰って来た時、おやじが大きな眼をして、二階ぐらいから飛び降りて腰を抜かす奴があるかと叱った。', audio: 'audio/books_sentence/botchan_4.mp3' }
    ]
  }
];

window.AUDIO_BOOKS = AUDIO_BOOKS;
