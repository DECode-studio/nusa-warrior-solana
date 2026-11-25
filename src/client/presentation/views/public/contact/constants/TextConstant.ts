export interface ContactFaqItem {
  readonly id: string;
  readonly questionId: string;
  readonly questionEn: string;
  readonly answerId: string;
  readonly answerEn: string;
}

export const CONTACT_FAQ_ITEMS: readonly ContactFaqItem[] = [
  {
    id: "faq-epigraphy",
    questionId: "Bagaimana proses kurasi sejarah pada 60 kartu Nusa Warriors?",
    questionEn: "How are the 60 historical cards in Nusa Warriors curated?",
    answerId:
      "Setiap tokoh Majapahit dan Pajajaran serta instrumen musik kuno (Waditra) dikurasi berdasarkan rujukan prasasti primer (seperti Prasasti Kudadu, Batutulis, Kawali) dan naskah sezaman (Nagarakretagama, Pararaton, Sanghyang Siksakandang Karesian).",
    answerEn:
      "Every Majapahit and Pajajaran figure and traditional musical instrument is curated from primary inscriptions (Kudadu, Batutulis, Kawali) and classical manuscripts (Nagarakretagama, Pararaton).",
  },
  {
    id: "faq-fairplay",
    questionId: "Apakah Nusa Warriors menggunakan sistem gacha atau lootbox?",
    questionEn: "Does Nusa Warriors use gacha or randomized lootboxes?",
    answerId:
      "Tidak. Nusa Warriors memegang prinsip 100% Fair-Play dan deterministik. Seluruh isi Starter Pack di Marketplace bersifat transparan dan dapat disusun bebas melalui Deck Builder di Panel Ksatria.",
    answerEn:
      "No. Nusa Warriors enforces 100% deterministic Fair-Play. Every Starter Pack in the Marketplace lists its exact card contents transparently, and custom decks can be built freely in the Warrior Console.",
  },
  {
    id: "faq-battle",
    questionId: "Bagaimana cara memulai pertandingan di Battle Arena?",
    questionEn: "How do I start a match in the Battle Arena?",
    answerId:
      "Masuk ke Panel Ksatria (/user/dashboard), pilih menu Battle Arena untuk membuka Battle Lobby, tentukan Deck (10 Karakter + hingga 10 Waditra) serta tingkat kesulitan Bot, lalu klik tombol 'Start Battle'.",
    answerEn:
      "Open the Warrior Console (/user/dashboard), navigate to Battle Arena to enter the Battle Lobby, choose your Deck and Bot difficulty, and click 'Start Battle' to launch the 2-Row battlefield.",
  },
  {
    id: "faq-correction",
    questionId: "Bagaimana jika pendidik atau sejarawan ingin mengusulkan koreksi data kartu?",
    questionEn: "How can educators or historians suggest historical corrections?",
    answerId:
      "Anda dapat membuka halaman Katalog 60 Kartu, memilih kartu terkait, dan mengirimkan rujukan prasasti pembanding atau menghubungi tim kurator langsung melalui saluran email resmi di halaman ini.",
    answerEn:
      "You can inspect any card in the 60-Card Catalog to submit a primary source reference or reach our curatorial team directly via the official studio contact channels listed on this page.",
  },
] as const;

export const CONTACT_TEXT_CONSTANT = {
  HERO_BADGE: "contact.heroBadge",
  HERO_TITLE: "contact.heroTitle",
  HERO_DESCRIPTION: "contact.heroDescription",
  HERO_CTA_WARRIOR: "contact.heroCtaWarrior",
  HERO_CTA_CATALOG: "contact.heroCtaCatalog",

  CHANNEL_EMAIL_TITLE: "contact.channelEmailTitle",
  CHANNEL_EMAIL_DESC: "contact.channelEmailDesc",
  CHANNEL_PHONE_TITLE: "contact.channelPhoneTitle",
  CHANNEL_PHONE_DESC: "contact.channelPhoneDesc",
  CHANNEL_LOCATION_TITLE: "contact.channelLocationTitle",
  CHANNEL_LOCATION_SUB: "contact.channelLocationSub",
  CHANNEL_HOURS_TITLE: "contact.channelHoursTitle",
  CHANNEL_HOURS_DESC: "contact.channelHoursDesc",
  CHANNEL_HOURS_SLA: "contact.channelHoursSla",

  FAQ_BADGE: "contact.faqBadge",
  FAQ_TITLE: "contact.faqTitle",
} as const;
