/**
 * モックデータ（すべて架空のサンプルです）。
 * Supabase 接続後は supabase/seed.sql 等に置き換える想定。
 */
import type { Attachment, ConsultRequest, Entry, EntryType, Lab, LabJoinCode, Member, Theme } from "@/types/db";
import { placeholderImage } from "./placeholder";

/** 現在時刻からの相対日時を ISO 文字列で返す（草グラフが常に埋まるように） */
function ago(days: number, hour = 14, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function img(name: string, hue: number, variant: "micro" | "spectrum" | "photo"): Attachment {
  const url = placeholderImage(name, hue, variant);
  return { kind: "image", url, thumbnail_url: url, name };
}

/* ------------------------------------------------------------------ */
/* labs                                                                */
/* ------------------------------------------------------------------ */

export const mockLabs: Lab[] = [
  {
    id: "lab-01",
    slug: "toto-nanocarbon",
    name: "ナノカーボン材料研究室",
    university: "東都大学 工学部",
    description:
      "【サンプル】単層カーボンナノチューブ（SWCNT）の構造選別と、薄膜デバイスへの応用を研究しています。ゲルクロマトグラフィーによるカイラリティ分離が主なテーマです。",
    is_public: true,
    tags: ["CNT", "分離", "精製", "デバイス応用", "実験"],
  },
  {
    id: "lab-02",
    slug: "kansai-nanotheory",
    name: "ナノ物性理論研究室",
    university: "関西工科大学 理学部",
    description:
      "【サンプル】第一原理計算と多体摂動論を用いて、CNTや二次元材料の光学特性・励起子物性を理論的に調べています。実験グループとの共同研究を歓迎します。",
    is_public: true,
    tags: ["CNT", "二次元材料", "計算・シミュレーション", "理論"],
  },
  {
    id: "lab-03",
    slug: "hokuto-2d",
    name: "二次元材料研究室",
    university: "北杜大学 先端理工学研究科",
    description:
      "【サンプル】CVD法によるグラフェン・hBNの大面積合成と、積層ヘテロ構造デバイスの作製を行っています。",
    is_public: true,
    tags: ["グラフェン", "二次元材料", "合成", "デバイス応用", "実験"],
  },
  {
    id: "lab-04",
    slug: "minato-dispersion",
    name: "ナノ分散工学研究室",
    university: "港湾大学 工学部",
    description:
      "【サンプル】ナノ材料を液中に均一に分散させるための界面化学を研究しています。CNT・グラフェンの水系分散と、その評価手法の標準化に取り組んでいます。",
    is_public: true,
    tags: ["CNT", "グラフェン", "分散", "評価・分析", "実験"],
  },
  {
    id: "lab-05",
    slug: "chubu-fullerene",
    name: "フラーレン化学研究室",
    university: "中部理科大学 理学部",
    description:
      "【サンプル】金属内包フラーレンの合成・精製と、有機エレクトロニクスへの応用を目指した化学修飾を行っています。",
    is_public: true,
    tags: ["フラーレン", "合成", "精製", "実験"],
  },
  {
    id: "lab-06",
    slug: "kyushu-nanodevice",
    name: "ナノデバイス研究室",
    university: "九州先端大学 情報電子工学部",
    description:
      "【サンプル】CNT薄膜を用いたフレキシブルエレクトロニクスとセンサデバイスを開発しています。印刷プロセスでのデバイス作製が得意です。",
    is_public: true,
    tags: ["CNT", "デバイス応用", "評価・分析", "実験"],
  },
  {
    id: "lab-07",
    slug: "tohoku-compmat",
    name: "計算材料科学研究室",
    university: "東北学院工科大学 工学研究科",
    description:
      "【サンプル】遷移金属ダイカルコゲナイドなどの二次元材料における欠陥・界面の電子状態を、大規模計算で予測しています。",
    is_public: true,
    tags: ["二次元材料", "グラフェン", "計算・シミュレーション", "理論"],
  },
  {
    id: "lab-08",
    slug: "sakuragaoka-growth",
    name: "CNT成長機構研究室",
    university: "桜ヶ丘大学 理工学部",
    description:
      "【サンプル】触媒ナノ粒子からCNTがどのように成長するのかを、その場観察と分子動力学シミュレーションの両面から明らかにしようとしています。",
    is_public: true,
    tags: ["CNT", "合成", "評価・分析", "計算・シミュレーション", "実験", "理論"],
  },
  {
    id: "lab-09",
    slug: "setouchi-nanobio",
    name: "ナノバイオ材料研究室",
    university: "瀬戸内大学 生命工学部",
    description:
      "【サンプル】ナノ材料の生体適合性評価と、バイオイメージングへの応用を研究しています。CNTの近赤外蛍光を利用したイメージングが中心です。",
    is_public: true,
    tags: ["CNT", "その他ナノ材料", "分散", "評価・分析", "実験"],
  },
  {
    id: "lab-10",
    slug: "hakone-nanometrology",
    name: "ナノ計測研究室",
    university: "箱根工業大学 工学部",
    description:
      "【サンプル】ラマン分光・PL分光を中心に、ナノカーボン材料の構造を定量的に評価する手法を開発しています。",
    is_public: true,
    tags: ["CNT", "グラフェン", "評価・分析", "実験"],
  },
];

/* ------------------------------------------------------------------ */
/* members（実名は持たない。外部表示は学年のみ）                        */
/* ------------------------------------------------------------------ */

export const mockMembers: Member[] = [
  // lab-01（ログインユーザーの所属）
  { id: "mem-0101", lab_id: "lab-01", grade: "M2", role: "admin" },
  { id: "mem-0102", lab_id: "lab-01", grade: "D1", role: "member" },
  { id: "mem-0103", lab_id: "lab-01", grade: "B4", role: "member" },
  { id: "mem-0104", lab_id: "lab-01", grade: "教員", role: "member" },
  { id: "mem-0201", lab_id: "lab-02", grade: "D2", role: "admin" },
  { id: "mem-0202", lab_id: "lab-02", grade: "M1", role: "member" },
  { id: "mem-0301", lab_id: "lab-03", grade: "M2", role: "admin" },
  { id: "mem-0302", lab_id: "lab-03", grade: "D1", role: "member" },
  { id: "mem-0401", lab_id: "lab-04", grade: "M1", role: "admin" },
  { id: "mem-0402", lab_id: "lab-04", grade: "B4", role: "member" },
  { id: "mem-0501", lab_id: "lab-05", grade: "D3", role: "admin" },
  { id: "mem-0601", lab_id: "lab-06", grade: "M2", role: "admin" },
  { id: "mem-0602", lab_id: "lab-06", grade: "M1", role: "member" },
  { id: "mem-0701", lab_id: "lab-07", grade: "PD", role: "admin" },
  { id: "mem-0801", lab_id: "lab-08", grade: "D1", role: "admin" },
  { id: "mem-0802", lab_id: "lab-08", grade: "M2", role: "member" },
  { id: "mem-0901", lab_id: "lab-09", grade: "M1", role: "admin" },
  { id: "mem-1001", lab_id: "lab-10", grade: "B4", role: "member" },
  { id: "mem-1002", lab_id: "lab-10", grade: "D2", role: "admin" },
];

/** デモでログインするメンバー（東都大学 ナノカーボン材料研究室 / M2 / 代表者） */
export const DEMO_MEMBER_ID = "mem-0101";

/* ------------------------------------------------------------------ */
/* themes                                                              */
/* ------------------------------------------------------------------ */

export const mockThemes: Theme[] = [
  {
    id: "th-0101",
    lab_id: "lab-01",
    owner_id: "mem-0101",
    title: "ゲルカラムによる単層CNTのカイラリティ分離",
    summary:
      "アガロースゲルカラムを用いて、HiPco法の単層CNTから特定カイラリティ（(6,5)、(7,6)など）を高純度で取り出す条件を探索しています。\n\n## 目的\n・単一カイラリティ純度 90% 以上を、1回の分離で再現性よく得る\n・界面活性剤（SDS / SC）の混合比と温度の最適条件を見つける\n\n## 現在の課題\n・ロット間で分離の再現性が低い\n・遠心後の上澄み回収量がばらつく",
    tags: ["CNT", "分離", "精製", "実験"],
    visibility: "public",
  },
  {
    id: "th-0102",
    lab_id: "lab-01",
    owner_id: "mem-0101",
    title: "半導体CNT薄膜トランジスタの作製と評価",
    summary:
      "分離した半導体型CNTをスピンコートで薄膜化し、トップゲート型トランジスタを作製しています。移動度とオンオフ比の両立が目標です。",
    tags: ["CNT", "デバイス応用", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0103",
    lab_id: "lab-01",
    owner_id: "mem-0102",
    title: "CNT分散液の長期保存安定性",
    summary: "分離後のCNT分散液を数か月保存したときの凝集と吸収スペクトル変化を追跡しています。",
    tags: ["CNT", "分散", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0201",
    lab_id: "lab-02",
    owner_id: "mem-0201",
    title: "単層CNTの励起子エネルギーの第一原理計算",
    summary:
      "GW+BSE法で、直径0.7〜1.2nmの単層CNTの励起子エネルギーと誘電遮蔽の効果を計算しています。実験のPLマップと比較できる形で結果を整理するのが目標です。",
    tags: ["CNT", "計算・シミュレーション", "理論"],
    visibility: "public",
  },
  {
    id: "th-0202",
    lab_id: "lab-02",
    owner_id: "mem-0202",
    title: "hBN上の二次元材料における誘電遮蔽",
    summary: "基板による誘電遮蔽が二次元半導体のバンドギャップに与える影響をモデル化しています。",
    tags: ["二次元材料", "計算・シミュレーション", "理論"],
    visibility: "public",
  },
  {
    id: "th-0301",
    lab_id: "lab-03",
    owner_id: "mem-0301",
    title: "CVDグラフェンの湿式転写プロセスの改善",
    summary:
      "銅箔上に成長したグラフェンを、PMMAを用いてSiO2/Si基板へ転写する工程で、しわ・破れ・残渣を減らす条件を検討しています。",
    tags: ["グラフェン", "合成", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0302",
    lab_id: "lab-03",
    owner_id: "mem-0302",
    title: "hBN/グラフェン積層ヘテロ構造デバイス",
    summary: "ドライ転写でhBN/グラフェン/hBNの積層構造を作製し、高移動度デバイスを目指しています。",
    tags: ["グラフェン", "二次元材料", "デバイス応用", "実験"],
    visibility: "public",
  },
  {
    id: "th-0401",
    lab_id: "lab-04",
    owner_id: "mem-0401",
    title: "界面活性剤によるCNT水分散の安定性評価",
    summary:
      "SDS・SDBS・コール酸ナトリウムなど複数の界面活性剤で単層CNTを水に分散し、超音波条件と分散安定性の関係を吸光度で評価しています。",
    tags: ["CNT", "分散", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0501",
    lab_id: "lab-05",
    owner_id: "mem-0501",
    title: "金属内包フラーレンのHPLC精製の効率化",
    summary: "アーク放電で得た煤から、Gd内包フラーレンを多段HPLCで効率よく精製する手順を確立しようとしています。",
    tags: ["フラーレン", "合成", "精製", "実験"],
    visibility: "public",
  },
  {
    id: "th-0601",
    lab_id: "lab-06",
    owner_id: "mem-0601",
    title: "CNT透明導電膜のフレキシブル化",
    summary: "PET基板上にCNT透明導電膜を形成し、曲げ試験後のシート抵抗変化を抑える方法を検討しています。",
    tags: ["CNT", "デバイス応用", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0602",
    lab_id: "lab-06",
    owner_id: "mem-0602",
    title: "CNT-FETを用いたNO2ガスセンサ",
    summary: "印刷で作製したCNT-FETをガスセンサとして使い、ppbレベルのNO2検出を目指しています。",
    tags: ["CNT", "デバイス応用", "実験"],
    visibility: "public",
  },
  {
    id: "th-0701",
    lab_id: "lab-07",
    owner_id: "mem-0701",
    title: "単層MoS2の点欠陥の電子状態計算",
    summary: "硫黄空孔などの点欠陥がMoS2のバンド構造と光学遷移に与える影響を、スーパーセル計算で調べています。",
    tags: ["二次元材料", "計算・シミュレーション", "理論"],
    visibility: "public",
  },
  {
    id: "th-0801",
    lab_id: "lab-08",
    owner_id: "mem-0801",
    title: "触媒ナノ粒子からのCNT成長のその場観察",
    summary: "環境制御型TEMでCo触媒からのCNT成長を観察し、成長開始のタイミングと触媒の形状変化を追っています。",
    tags: ["CNT", "合成", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-0802",
    lab_id: "lab-08",
    owner_id: "mem-0802",
    title: "反応分子動力学によるCNT核生成シミュレーション",
    summary: "ReaxFFを用いて、金属触媒表面での炭素原子の析出とキャップ形成を再現する計算を行っています。",
    tags: ["CNT", "合成", "計算・シミュレーション", "理論"],
    visibility: "public",
  },
  {
    id: "th-0901",
    lab_id: "lab-09",
    owner_id: "mem-0901",
    title: "近赤外イメージング用CNT分散体の作製",
    summary: "DNAやPEG脂質でCNTを被覆し、生体内で安定かつ明るく光る分散体を作ることを目指しています。",
    tags: ["CNT", "その他ナノ材料", "分散", "評価・分析", "実験"],
    visibility: "public",
  },
  {
    id: "th-1001",
    lab_id: "lab-10",
    owner_id: "mem-1002",
    title: "ラマンRBMによるCNT直径分布の定量",
    summary: "複数の励起波長でRBMを測定し、共鳴条件を補正して直径分布を定量化する手法を検討しています。",
    tags: ["CNT", "評価・分析", "実験"],
    visibility: "public",
  },
];

/* ------------------------------------------------------------------ */
/* entries                                                             */
/* ------------------------------------------------------------------ */

/** 元データの種類。相談に出した記録（trouble）だけが公開され、それ以外はすべて非公開のメモになる */
type SeedType = "progress" | "trouble" | "achievement" | "memo";
type EntrySeed = [id: string, themeId: string, authorId: string, type: SeedType, body: string, daysAgo: number, isPublic: boolean, attachments?: Attachment[]];

const entrySeeds: EntrySeed[] = [
  // th-0101 ゲルカラム分離（ログインユーザー）
  ["en-0101", "th-0101", "mem-0101", "trouble", "SDS濃度を1.6%→1.8%に上げたら、(6,5)のピークが減って(7,5)が多く吸着されるようになった。濃度を上げると吸着が弱くなるはずなのに逆の傾向で、原因がわからない。同じような経験のある方がいたら相談したいです。", 1, true, [img("吸収スペクトル比較（SDS 1.6% / 1.8%）", 211, "spectrum")]],
  ["en-0102", "th-0101", "mem-0101", "progress", "カラム温度を18℃に固定して3回分離。溶出液の吸収スペクトルを測定。(6,5)純度は 72%、75%、70%。前回より若干ばらつきが小さくなった。", 3, false, [img("溶出液の写真", 176, "photo")]],
  ["en-0103", "th-0101", "mem-0101", "achievement", "(6,5)の単一カイラリティ純度 91% を初めて達成！ ポイントは、超音波分散後の遠心を 210,000g × 1h に変えたこと。上澄みの回収は上から70%まで。", 9, true, [img("PLマップ（分離後）", 146, "spectrum")]],
  ["en-0104", "th-0101", "mem-0101", "memo", "ゲルは毎回新しいものを使う方が再現性が高い。再利用は3回まで。洗浄は1% SDSで5カラム体積。", 12, false],
  ["en-0105", "th-0101", "mem-0101", "trouble", "遠心後の上澄みの回収量が毎回ばらつく（2.1〜3.4 mL）。ピペットで上から取っているが、境界がわかりにくい。みなさんどうやって回収していますか？", 20, true],
  ["en-0106", "th-0101", "mem-0101", "progress", "HiPco新ロットで分散液を作製。1% SC、チップ型超音波 30W×1h。吸収スペクトルのバックグラウンドが前ロットより高い。", 27, false, [img("吸収スペクトル（新ロット）", 211, "spectrum")]],
  // th-0102 CNT-TFT（概要のみ公開）
  ["en-0111", "th-0102", "mem-0101", "progress", "半導体CNT分散液をAPTES処理基板にスピンコート。AFMで密度を確認、約 20本/μm²。", 5, false, [img("AFM像", 30, "micro")]],
  ["en-0112", "th-0102", "mem-0101", "trouble", "オンオフ比が10³程度で頭打ち。金属型CNTの残留か、ネットワーク密度が高すぎるのか切り分けたい。", 8, true],
  ["en-0113", "th-0102", "mem-0101", "achievement", "トップゲート型で移動度 18 cm²/Vs、オンオフ比 10⁵ を確認。", 15, true],
  // th-0103（非公開、別メンバー）
  ["en-0121", "th-0103", "mem-0102", "progress", "保存2か月目の吸収スペクトルを測定。S11ピーク強度が約8%低下。", 4, false],

  // th-0201 励起子計算
  ["en-0201", "th-0201", "mem-0201", "achievement", "(6,5)のE11励起子エネルギーが実験値と 30 meV 以内で一致。誘電遮蔽を環境誘電率 ε=2.5 として取り込んだのが効いた。", 6, true, [img("計算と実験の比較プロット", 262, "spectrum")]],
  ["en-0202", "th-0201", "mem-0201", "trouble", "直径1.1nm以上になるとk点数の収束が非常に遅く、計算時間が現実的でない。効率的な収束判定の方法をご存じの方、アドバイスいただけると嬉しいです。", 14, true],
  ["en-0203", "th-0201", "mem-0201", "progress", "(7,5)、(8,3)の計算を開始。スーパーセルは 1 単位胞、k点 1×1×64。", 18, false],
  ["en-0204", "th-0201", "mem-0201", "memo", "実験側との比較では、溶媒・界面活性剤による遮蔽の違いに注意。論文ごとに条件がバラバラ。", 22, true],

  // th-0301 グラフェン転写
  ["en-0301", "th-0301", "mem-0301", "trouble", "PMMA除去後にどうしても残渣が残る。アセトン 60℃ 一晩でもダメ。アニールを試すべきか、PMMAの分子量を変えるべきか迷っています。", 2, true, [img("光学顕微鏡像（残渣あり）", 40, "micro")]],
  ["en-0302", "th-0301", "mem-0301", "progress", "銅エッチング液を過硫酸アンモニウム 0.1M に変更。エッチング時間は約 3h。", 7, false],
  ["en-0303", "th-0301", "mem-0301", "achievement", "転写後のしわが大幅に減少。基板を親水化処理（UVオゾン 10min）したのが効いた。ラマンのD/G比も 0.05 以下。", 16, true, [img("ラマンマッピング（D/G比）", 146, "micro")]],

  // th-0401 分散安定性
  ["en-0401", "th-0401", "mem-0401", "achievement", "SDBS 1% で 4 週間後も吸光度の低下が 5% 以内。比較した界面活性剤の中で最も安定。", 5, true, [img("吸光度の経時変化グラフ", 211, "spectrum")]],
  ["en-0402", "th-0401", "mem-0401", "trouble", "バス型超音波だと分散度が日によって大きく変わる。水温管理の方法を統一したいが、皆さん氷浴？循環水？", 11, true],
  ["en-0403", "th-0401", "mem-0402", "memo", "超音波装置は午後になると水温が上がっていることが多い。測定は午前中に。", 13, true],

  // th-0501 フラーレン
  ["en-0501", "th-0501", "mem-0501", "progress", "Buckyprep カラムで 1 段目の分離。目的フラクションの収量は煤 1g あたり約 0.8 mg。", 3, false],
  ["en-0502", "th-0501", "mem-0501", "trouble", "2 段目の分離で、目的ピークと隣のピークが重なる。溶媒をトルエンからクロロベンゼンに変える以外に手はありますか？", 9, true, [img("HPLCクロマトグラム", 28, "spectrum")]],
  ["en-0503", "th-0501", "mem-0501", "achievement", "リサイクルHPLCで純度 99% 以上の Gd@C82 を 2 mg 単離。", 24, true],

  // th-0601 透明導電膜
  ["en-0601", "th-0601", "mem-0601", "trouble", "曲げ半径 2mm で 1000 回曲げるとシート抵抗が 1.6 倍に。オーバーコートの材料を探しています。", 4, true],
  ["en-0602", "th-0601", "mem-0601", "achievement", "硝酸ドープで 120 Ω/sq @ 透過率 85% を達成。", 17, true, [img("透過率スペクトル", 211, "spectrum")]],

  // th-0602 ガスセンサ
  ["en-0611", "th-0602", "mem-0602", "progress", "NO2 100ppb で応答を確認。回復に 20 分以上かかる。", 6, true],
  ["en-0612", "th-0602", "mem-0602", "trouble", "UV照射で回復を早めたいが、デバイスが劣化しないか心配。波長の選び方について知見があれば教えてください。", 10, true],

  // th-0701 MoS2
  ["en-0701", "th-0701", "mem-0701", "achievement", "硫黄空孔によるギャップ内準位の位置が STS の実験結果と整合。", 8, true],
  ["en-0702", "th-0701", "mem-0701", "trouble", "スピン軌道相互作用を入れると収束しない。混合パラメータの調整のコツがあれば知りたいです。", 19, true],

  // th-0801 その場観察
  ["en-0801", "th-0801", "mem-0801", "progress", "Co触媒、700℃、C2H2 で観察。成長開始までのインキュベーション時間は約 40 s。", 2, true, [img("ETEM像（成長開始直前）", 30, "micro")]],
  ["en-0802", "th-0801", "mem-0801", "trouble", "電子線照射の影響で、観察視野内だけ成長が止まる気がする。照射量の目安について議論したいです。", 12, true],

  // th-0901 ナノバイオ
  ["en-0901", "th-0901", "mem-0901", "trouble", "DNA被覆CNTが血清中で凝集してしまう。PEG化を検討中だが、蛍光強度が落ちないか不安。", 3, true],
  ["en-0902", "th-0901", "mem-0901", "achievement", "PEG脂質被覆で、マウス血清中 24h 後も凝集なし。近赤外蛍光強度も 80% 維持。", 21, true, [img("近赤外蛍光イメージ", 262, "photo")]],

  // th-1001 ラマン
  ["en-1001", "th-1001", "mem-1002", "progress", "532 / 633 / 785 nm の 3 波長で RBM を測定。共鳴補正の係数を検討中。", 5, true, [img("RBMスペクトル（3波長）", 211, "spectrum")]],
  ["en-1002", "th-1001", "mem-1001", "trouble", "785nm 励起でバックグラウンドの蛍光が大きく、RBM のフィッティングが不安定。前処理でおすすめの方法はありますか？", 9, true],
  ["en-1003", "th-1001", "mem-1002", "achievement", "TEM で求めた直径分布と、補正後のラマン推定値の平均直径が 0.03 nm 以内で一致。", 25, true],

];

const handwrittenEntries: Entry[] = entrySeeds.map(([id, theme_id, author_id, type, body, daysAgo, , attachments]) => ({
  id,
  theme_id,
  author_id,
  type: type === "trouble" ? "trouble" : "memo",
  body,
  attachments: attachments ?? [],
  is_public: type === "trouble",
  created_at: ago(daysAgo, 10 + (daysAgo % 8), (daysAgo * 7) % 60),
}));

/**
 * 草グラフ（contribution graph）が自然に見えるよう、ログインユーザーの過去約1年分の
 * 短い進捗・メモを決定的な疑似乱数で生成する。
 */
function generateHistory(): Entry[] {
  const notes: [EntryType, string][] = [
    ["memo", "分散液を調製。1% SC、超音波 1h。"],
    ["memo", "ゲルカラムで分離。溶出液の吸収スペクトルを測定。"],
    ["memo", "PL マップを測定。励起 500–800 nm。"],
    ["memo", "遠心機のローターは R-1 を予約すること。"],
    ["memo", "AFM でネットワーク密度を確認。"],
    ["memo", "SDS の新しいロットに切り替え。"],
    ["memo", "デバイスの I-V 特性を測定。"],
  ];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const out: Entry[] = [];
  for (let day = 30; day < 340; day++) {
    const weekday = (new Date().getDay() - (day % 7) + 7) % 7;
    const busy = weekday === 0 || weekday === 6 ? 0.12 : 0.55;
    if (rand() > busy) continue;
    const count = rand() > 0.8 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const [type, body] = notes[Math.floor(rand() * notes.length)];
      out.push({
        id: `en-gen-${day}-${i}`,
        theme_id: rand() > 0.35 ? "th-0101" : "th-0102",
        author_id: DEMO_MEMBER_ID,
        type,
        body,
        attachments: [],
        is_public: false,
        created_at: ago(day, 9 + i * 5),
      });
    }
  }
  return out;
}

export const mockEntries: Entry[] = [...handwrittenEntries, ...generateHistory()];

/* ------------------------------------------------------------------ */
/* consult_requests                                                    */
/* ------------------------------------------------------------------ */

export const mockConsultRequests: ConsultRequest[] = [
  {
    id: "cr-01",
    theme_id: "th-0101",
    entry_id: "en-0101",
    from_name: "サンプル 太郎",
    from_affiliation: "ナノ分散工学研究室（港湾大学）D1",
    from_email: "sample1@example.com",
    message:
      "SDS濃度の件、こちらでも似た現象を見たことがあります。SDSとSCの比率によってゲルへの吸着順序が入れ替わるという報告があり、温度も効いてくると思います。よければ条件を共有させてください。",
    created_at: ago(0, 9, 12),
  },
  {
    id: "cr-02",
    theme_id: "th-0101",
    entry_id: "en-0105",
    from_name: "サンプル 花子",
    from_affiliation: "ナノ計測研究室（箱根工業大学）M2",
    from_email: "sample2@example.com",
    message:
      "上澄みの回収は、ニードルを底から差し込んで下から抜く「ボトムアップ回収」にしたら安定しました。回収率の比較データもあるのでお送りできます。",
    created_at: ago(18, 16, 40),
  },
  {
    id: "cr-03",
    theme_id: "th-0102",
    entry_id: null,
    from_name: "サンプル 次郎",
    from_affiliation: "ナノデバイス研究室（九州先端大学）教員",
    from_email: "sample3@example.com",
    message: "CNT-TFT のテーマ、印刷プロセスとの組み合わせで共同研究できないかと思いご連絡しました。一度オンラインでお話しできませんか。",
    created_at: ago(6, 11, 5),
  },
];

/* ------------------------------------------------------------------ */
/* lab_join_codes（参加コード。代表者だけが見られる）                   */
/* ------------------------------------------------------------------ */

export const mockJoinCodes: LabJoinCode[] = mockLabs.map((lab, i) => ({
  lab_id: lab.id,
  // 例: lab-01 → "NANO2401"。デモでは「NANO-2403」（北杜大学 二次元材料研究室）などで参加を試せる
  code: `NANO24${String(i + 1).padStart(2, "0")}`,
}));
