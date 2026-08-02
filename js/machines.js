/**
 * レジスタンスマシン定義（画像内ラベルに準拠）
 * 画像元: 24KYODO-MACHINE resistance_1〜15
 */
window.MACHINE_CATALOG = [
  {
    id: "resistance_13",
    name: "チェストプレス",
    img: "assets/machines/resistance_13.jpg",
    parts: ["chest"],
  },
  {
    id: "resistance_3",
    name: "ペックフライ/リアデルト",
    img: "assets/machines/resistance_3.jpg",
    parts: ["chest", "shoulders"],
  },
  {
    id: "resistance_4",
    name: "ラットプルダウン",
    img: "assets/machines/resistance_4.jpg",
    parts: ["back"],
  },
  {
    id: "resistance_14",
    name: "ローロー",
    img: "assets/machines/resistance_14.jpg",
    parts: ["back"],
  },
  {
    id: "resistance_7",
    name: "バックエクステンション",
    img: "assets/machines/resistance_7.jpg",
    parts: ["back"],
  },
  {
    id: "resistance_15",
    name: "アブドミナル",
    img: "assets/machines/resistance_15.jpg",
    parts: ["abs"],
  },
  {
    id: "resistance_12",
    name: "ロータリートルソー",
    img: "assets/machines/resistance_12.jpg",
    parts: ["abs"],
  },
  {
    id: "resistance_6",
    name: "シットアップベンチ",
    img: "assets/machines/resistance_6.jpg",
    parts: ["abs"],
  },
  {
    id: "resistance_1",
    name: "レッグプレス",
    img: "assets/machines/resistance_1.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_8",
    name: "レッグエクステンション",
    img: "assets/machines/resistance_8.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_9",
    name: "レッグカール",
    img: "assets/machines/resistance_9.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_5",
    name: "グルート",
    img: "assets/machines/resistance_5.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_10",
    name: "ヒップアブダクション",
    img: "assets/machines/resistance_10.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_11",
    name: "ヒップアダクション",
    img: "assets/machines/resistance_11.jpg",
    parts: ["legs"],
  },
  {
    id: "resistance_2",
    name: "ショルダープレス",
    img: "assets/machines/resistance_2.jpg",
    parts: ["shoulders"],
  },
];

window.BODY_PARTS = [
  { id: "chest", label: "胸", i18n: "parts.chest" },
  { id: "back", label: "背中", i18n: "parts.back" },
  { id: "abs", label: "お腹", i18n: "parts.abs" },
  { id: "legs", label: "下半身", i18n: "parts.legs" },
  { id: "shoulders", label: "肩", i18n: "parts.shoulders" },
];

window.MAX_MACHINES = 3;
