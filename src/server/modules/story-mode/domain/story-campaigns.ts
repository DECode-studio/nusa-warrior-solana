import { ALL_CARDS_CATALOG, type CatalogCardSeed } from "@/core/constants/cards-catalog";
import type { StoryCampaign, StoryDialogueLine, StoryMission } from "./story-catalog";
import { localizeStoryLocation, localizeStorySpeaker, STORY_TRANSLATIONS } from "./story-translations";

type Kingdom = StoryCampaign["kingdom"];
type MissionContent = Omit<StoryMission, "storyDeck">;
export const AMUKTI_PALAPA_SOUNDTRACK_URL = "/story-mode/audio/amukti-palapa.mp3";
export const LEGACY_STORY_SOUNDTRACK_URL = AMUKTI_PALAPA_SOUNDTRACK_URL;

const MAJAPAHIT_STORY_INSTRUMENTS = ["padahi", "kendang", "bonang", "saron", "gong-ageng", "rebab", "kempul", "kenong"];
const PAJAJARAN_STORY_INSTRUMENTS = ["suling-sunda", "calung", "terompet-penca", "terebang", "kendang", "rebab", "cempres", "dogdog-lojor"];

const STORY_PLAYER_DECKS: Record<string, string[]> = {
  "majapahit-royal-council": ["raden-wijaya", "arya-wiraja", "ranggalawe", "prajurit-majapahit"],
  "majapahit-rangga-lawe": ["raden-wijaya", "ranggalawe", "arya-wiraja", "lembu-sora"],
  "majapahit-sadeng-keta": ["tribhuwana-wijayatunggadewi", "gajah-mada", "nambi", "prajurit-majapahit"],
  "majapahit-palapa-oath": ["tribhuwana-wijayatunggadewi", "gajah-mada", "prajurit-majapahit"],
  "majapahit-pasunda-bubat": ["hayam-wuruk", "gajah-mada", "prajurit-majapahit"],
  "majapahit-nagarakretagama": ["hayam-wuruk", "mpu-prapanca", "mpu-tantular", "prajurit-majapahit"],
  "majapahit-amukti-palapa": ["gajah-mada", "hayam-wuruk", "mpu-prapanca", "prajurit-majapahit"],
  "pajajaran-bujangga-maniks-journey": ["bujangga-manik", "sri-baduga-maharaja", "prajurit-pajajaran"],
  "pajajaran-pakuan-whispers": ["sri-baduga-maharaja", "surawisesa", "prajurit-pajajaran"],
  "pajajaran-sunda-portuguese-treaty": ["surawisesa", "bujangga-manik", "prajurit-pajajaran"],
  "pajajaran-border-accord": ["surawisesa", "sri-baduga-maharaja", "prajurit-pajajaran"],
  "pajajaran-batutulis-memory": ["surawisesa", "sri-baduga-maharaja", "prajurit-pajajaran"],
  "pajajaran-fractured-court": ["ragamulya", "bujangga-manik", "prajurit-pajajaran"],
  "pajajaran-pakuan-finale": ["ragamulya", "bujangga-manik", "prabu-maharaja-linggabuana", "prajurit-pajajaran"],
};

const STORY_OPPONENT_DECKS: Record<string, StoryMission["opponentDeck"]> = {
  "majapahit-royal-council": { characterSlugs: ["jayakatwang", "prajurit-daha"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "majapahit-rangga-lawe": { characterSlugs: ["ranggalawe", "prajurit-majapahit"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "majapahit-sadeng-keta": { characterSlugs: ["panglima-sadeng", "panglima-keta", "prajurit-daha"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "majapahit-palapa-oath": { characterSlugs: ["panglima-majapahit", "prajurit-majapahit"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "majapahit-pasunda-bubat": { characterSlugs: ["prabu-maharaja-linggabuana", "dyah-pitaloka", "prajurit-pajajaran"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "majapahit-nagarakretagama": { characterSlugs: ["penjaga-naskah-istana", "prajurit-majapahit"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "majapahit-amukti-palapa": { characterSlugs: ["bayang-bayang-sumpah", "panglima-majapahit", "prajurit-majapahit"], instrumentSlugs: MAJAPAHIT_STORY_INSTRUMENTS },
  "pajajaran-bujangga-maniks-journey": { characterSlugs: ["prajurit-pajajaran"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-pakuan-whispers": { characterSlugs: ["prajurit-pajajaran"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-sunda-portuguese-treaty": { characterSlugs: ["henrique-leme", "prajurit-portugis"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-border-accord": { characterSlugs: ["faletehan", "maulana-hasanuddin", "prajurit-demak-cirebon", "prajurit-banten"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-batutulis-memory": { characterSlugs: ["prajurit-pajajaran"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-fractured-court": { characterSlugs: ["prajurit-pajajaran", "prajurit-banten", "prajurit-demak-cirebon"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
  "pajajaran-pakuan-finale": { characterSlugs: ["maulana-yusuf", "prajurit-banten"], instrumentSlugs: PAJAJARAN_STORY_INSTRUMENTS },
};

const STORY_CHARACTER_DECK_SIZE = 10;

function isGenericTroop(slug: string): boolean {
  return slug.startsWith("prajurit-");
}

function ensureTroopCount(slugs: string[], target: number, fallbackSlug: string): string[] {
  const result = [...slugs];
  const existingTroops = result.filter(isGenericTroop);
  let cursor = 0;
  while (result.filter(isGenericTroop).length < target) {
    result.push(existingTroops[cursor % existingTroops.length] ?? fallbackSlug);
    cursor += 1;
  }
  return result;
}

function fillDeckWithTroops(slugs: string[], fallbackSlug: string): string[] {
  const nonTroopCount = slugs.filter((slug) => !isGenericTroop(slug)).length;
  const troopTarget = Math.max(slugs.filter(isGenericTroop).length, STORY_CHARACTER_DECK_SIZE - nonTroopCount);
  return ensureTroopCount(slugs, troopTarget, fallbackSlug);
}

function scene(speaker: string, text: string, location: string, characterCardSlug?: string): StoryDialogueLine {
  return { speaker, text, location, characterCardSlug: characterCardSlug ?? null };
}

function storyDeck(kingdom: Kingdom, missionId: string): StoryMission["storyDeck"] {
  const curatedCharacters = STORY_PLAYER_DECKS[missionId] ?? [];
  const characters = curatedCharacters
    .map((slug) => ALL_CARDS_CATALOG.find((card) => card.slug === slug))
    .filter((card): card is CatalogCardSeed => card !== undefined && card.cardType === "CHARACTER" && card.kingdom === kingdom);
  const fallbackCharacters = ALL_CARDS_CATALOG
    .filter((card) => card.cardType === "CHARACTER" && card.kingdom === kingdom)
    .slice(0, 10);
  const instrumentSlugs = kingdom === "MAJAPAHIT" ? MAJAPAHIT_STORY_INSTRUMENTS : PAJAJARAN_STORY_INSTRUMENTS;
  const instruments = instrumentSlugs
    .map((slug) => ALL_CARDS_CATALOG.find((card) => card.slug === slug))
    .filter((card): card is CatalogCardSeed => card !== undefined && card.cardType === "INSTRUMENT");
  const troopSlug = kingdom === "MAJAPAHIT" ? "prajurit-majapahit" : "prajurit-pajajaran";
  const charactersWithTroops = fillDeckWithTroops(
    (characters.length > 0 ? characters : fallbackCharacters).map((card) => card.slug),
    troopSlug,
  );
  return {
    characterSlugs: charactersWithTroops,
    instrumentSlugs: instruments.map((card) => card.slug),
  };
}

function mission(kingdom: Kingdom, content: MissionContent): StoryMission {
  const opponentDeck = STORY_OPPONENT_DECKS[content.id];
  const opponentTroopSlug = opponentDeck?.characterSlugs.find(isGenericTroop) ?? (kingdom === "MAJAPAHIT" ? "prajurit-daha" : "prajurit-pajajaran");
  return {
    ...content,
    storyDeck: storyDeck(kingdom, content.id),
    opponentDeck: opponentDeck
      ? { ...opponentDeck, characterSlugs: fillDeckWithTroops(opponentDeck.characterSlugs, opponentTroopSlug) }
      : undefined,
  };
}

const majapahitMissions: readonly StoryMission[] = [
  mission("MAJAPAHIT", {
    id: "majapahit-royal-council", chapter: 1, kind: "STORY", title: "Tanah yang Belum Bernama",
    soundtrackUrl: "/story-mode/audio/the-glory-of-majapahit.mp3",
    intro: "Singhasari telah runtuh. Raden Wijaya bertahan hidup dengan kecerdikan, sekutu, dan keberanian untuk menunggu saat yang tepat. Di hutan Tarik, sebuah kerajaan baru masih berupa tanah yang harus diperjuangkan.",
    historicalNote: "Landasan: Raden Wijaya mendirikan Majapahit setelah konflik 1292–1293; rincian dialog dan tokoh pendamping adalah dramatisasi. https://hasp.ub.uni-heidelberg.de/catalog/view/366/517/81624",
    dialogue: [
      scene("Narator", "Malam menyembunyikan jalan keluar dari Singhasari. Asap masih menutup cakrawala ketika Raden Wijaya dan rombongan kecilnya menyeberangi sungai menuju Madura.", "Jalur Sungai Brantas"),
      scene("Raden Wijaya", "Kita kehilangan istana, bukan ingatan. Selama masih ada yang mau berjalan bersama kita, kerajaan belum berakhir.", "Jalur Sungai Brantas", "raden-wijaya"),
      scene("Utusan Madura", "Wiraraja menawarkan perlindungan dan jalan kembali. Namun ia meminta janji: bila takhta direbut, Madura tak boleh dilupakan.", "Dermaga Madura"),
      scene("Narator", "Ketika pasukan Daha mendekat, bantuan dari seberang laut tiba dengan tujuan mereka sendiri. Di meja perundingan, sekutu dan ancaman memakai panji yang sama.", "Perkemahan Tarik"),
      scene("Raden Wijaya", "Aku akan menerima bantuan untuk menjatuhkan Jayakatwang. Setelah itu, tanah ini harus menentukan nasibnya sendiri.", "Perkemahan Tarik", "raden-wijaya"),
      scene("Narator", "Pohon maja tumbuh di tanah yang pahit. Para pengungsi mendirikan rumah pertama; mereka menamai tempat itu Majapahit, tetapi belum tahu berapa banyak yang harus dikorbankan agar nama itu bertahan.", "Hutan Tarik"),
      scene("Raden Wijaya", "Besok kita menghadapi Daha. Hari ini, pastikan setiap orang tahu: mereka berjuang untuk rumah yang kelak menjadi milik bersama.", "Hutan Tarik", "raden-wijaya"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Pilih cara mempersatukan para pengungsi dan sekutu sebelum menghadapi pasukan Daha.",
    opponentTitle: "Jayakatwang",
    choices: [
      { id: "tarik-oath", label: "Ikat sekutu dengan janji setara", consequence: "Madura dan para pengikut Wijaya menuntut agar janji itu ditepati setelah kemenangan." },
      { id: "tarik-command", label: "Satukan pasukan di bawah satu komando", consequence: "Pasukan bergerak lebih cepat, tetapi para sekutu akan mengawasi siapa yang memperoleh kehormatan." },
    ],
    replayPointBase: 30,
    ending: "Daha jatuh dan pasukan Yuan meninggalkan Jawa setelah Wijaya berbalik melawan mereka. Kemenangan membuka pintu Majapahit; kini janji kepada para sekutu harus diuji.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-rangga-lawe", chapter: 2, kind: "BATTLE", title: "Sumpah di Tuban",
    soundtrackUrl: "/story-mode/audio/gamelan-melody.wav",
    intro: "Tahun-tahun pertama kerajaan membawa pertanyaan yang tak dijawab oleh kemenangan: siapa yang akan didengar ketika kawan seperjuangan merasa jasanya dilupakan? Kisah Rangga Lawe dalam tradisi Pararaton menjadi bara bagi bab ini.",
    historicalNote: "Landasan: pemberontakan Rangga Lawe dikenal melalui tradisi Pararaton; kronik Jawa memiliki lapisan legenda dan sejarah, sehingga adegan sidang dan percakapan di sini fiktif. https://www.tandfonline.com/doi/abs/10.1080/13639811.2020.1701325",
    dialogue: [
      scene("Narator", "Pelabuhan Tuban ramai oleh kapal dan kabar. Di antara tumpukan lada, seorang utusan membawa keluhan yang telah berubah menjadi tantangan.", "Pelabuhan Tuban"),
      scene("Rangga Lawe", "Aku menyerahkan tenaga dan nama demi takhta ini. Kini orang-orang yang datang belakangan berdiri lebih dekat dengan raja.", "Pelabuhan Tuban", "ranggalawe"),
      scene("Raden Wijaya", "Aku tidak akan menghapus jasamu. Tetapi kerajaan tak dapat dibangun dari daftar utang yang terus ditagih.", "Balairung Majapahit", "raden-wijaya"),
      scene("Narator", "Para panglima memandangmu. Bila tuntutan Rangga Lawe ditolak, pasukan mungkin terbelah. Bila semua tuntutan diterima, setiap kesetiaan akan meminta harga.", "Balairung Majapahit"),
      scene("Rangga Lawe", "Jangan jawab sebagai raja saja. Jawablah sebagai orang yang pernah membutuhkan bantuan.", "Balairung Majapahit", "ranggalawe"),
      scene("Narator", "Perundingan gagal menahan amarah. Debu naik dari jalan Tuban; dua barisan yang pernah berjuang bersama kini bersiap saling menguji.", "Jalan Tuban"),
      scene("Raden Wijaya", "Jangan biarkan kemenangan membuat kita lupa bagaimana kerajaan ini lahir. Hadapi dia, tetapi jangan hina orang-orang yang mengikutinya.", "Jalan Tuban", "raden-wijaya"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Hadapi Rangga Lawe dan pertahankan kerajaan tanpa menghapus jasa para sekutunya.",
    opponentTitle: "Rangga Lawe",
    choices: [
      { id: "rangga-hear", label: "Dengarkan tuntutannya di hadapan semua", consequence: "Para panglima tahu keluhan mereka dapat dibawa ke balairung, meski jawaban raja belum tentu memuaskan." },
      { id: "rangga-order", label: "Pulihkan ketertiban lebih dahulu", consequence: "Jalan kembali aman, tetapi keluarga Tuban akan menunggu bukti bahwa ketertiban juga berarti keadilan." },
    ],
    replayPointBase: 35,
    ending: "Pemberontakan dipadamkan, tetapi kemenangan tidak mengembalikan kepercayaan dengan sendirinya. Di istana, generasi baru akan mewarisi kerajaan yang masih belajar memerintah.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-sadeng-keta", chapter: 3, kind: "BATTLE", title: "Dua Gerbang di Timur",
    soundtrackUrl: "/story-mode/audio/epic-nusantara.mp3",
    intro: "Tahun 1331. Di bawah pemerintahan Tribhuwana, kabar tentang Sadeng dan Keta menguji kemampuan kerajaan menggerakkan pasukan tanpa kehilangan wibawa di wilayah yang jauh dari pusat.",
    historicalNote: "Landasan: Nagarakretagama Pupuh 49 menyebut Sadeng dan Keta serta tanggung jawab Mada. Persediaan perang dan keputusan pemain adalah dramatisasi. https://direktorimajapahit.id/yad/berkas/buku/Kakawin%20Nagarakertagama%20-Terjemahan%20Bahasa%20Indonesia.pdf",
    dialogue: [
      scene("Narator", "Peta basah terbentang di hadapan ratu. Dua tanda merah berjauhan; para panglima berdebat tentang jalan, persediaan, dan siapa yang akan memimpin.", "Balairung Majapahit"),
      scene("Tribhuwana Wijayatunggadewi", "Kerajaan tidak tampak kuat karena peta dipenuhi warna. Ia kuat bila rakyat di ujung peta percaya bahwa istana akan datang saat mereka memanggil.", "Balairung Majapahit", "tribhuwana-wijayatunggadewi"),
      scene("Gajah Mada", "Sadeng dan Keta tidak dapat diperlakukan sebagai tanda di atas lontar. Kita harus mengetahui siapa yang bertahan di sana dan mengapa.", "Balairung Majapahit", "gajah-mada"),
      scene("Narator", "Jalan ke timur berlumpur. Seorang pembawa bekal tertinggal; ia mengatakan lumbung setempat telah dikosongkan sebelum pasukan tiba.", "Jalur Hutan Timur"),
      scene("Tribhuwana Wijayatunggadewi", "Jangan jadikan kebutuhan perang sebagai alasan mengambil makanan rakyat. Cari jalur lain, atau kemenangan kita akan meninggalkan kelaparan.", "Jalur Hutan Timur", "tribhuwana-wijayatunggadewi"),
      scene("Gajah Mada", "Aku akan membuka jalan. Namun laporan yang kita kirim ke istana harus menyebut harga yang dibayar, bukan hanya nama tempat yang ditaklukkan.", "Gerbang Sadeng", "gajah-mada"),
      scene("Narator", "Genderang menjawab kabut. Ketika gerbang terakhir terbuka, kabar kemenangan berlari pulang lebih cepat daripada pasukan yang lelah.", "Gerbang Keta"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Menangkan pertempuran di gerbang timur sambil menjaga dukungan penduduk setempat.",
    opponentTitle: "Panglima Sadeng dan Keta",
    choices: [
      { id: "sadeng-provision", label: "Amankan jalur persediaan dahulu", consequence: "Pasukan bergerak lebih lambat, tetapi penduduk tidak kehilangan lumbung mereka." },
      { id: "sadeng-advance", label: "Dorong pasukan menuju gerbang", consequence: "Serangan memperoleh momentum, tetapi istana akan menerima pertanyaan tentang harga kemenangan." },
    ],
    replayPointBase: 40,
    ending: "Kakawin Nagarakretagama menyebut Sadeng dan Keta sebagai bagian dari masa ketika Mada memikul tanggung jawab besar. Kemenangan itu mengangkat namanya, sekaligus membawanya lebih dekat pada sumpah yang akan mengguncang istana.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-palapa-oath", chapter: 4, kind: "BATTLE", title: "Sumpah yang Menggetarkan",
    soundtrackUrl: "/story-mode/audio/the-glory-of-majapahit.mp3",
    intro: "Setelah keberhasilan di timur, Gajah Mada berdiri di hadapan para pejabat. Sumpah Palapa dikenang melalui Pararaton; bab ini menempatkannya sebagai janji politik yang memecah ruang sidang, bukan kalimat ajaib yang menyelesaikan semua persoalan.",
    historicalNote: "Landasan: sumpah dikenal melalui Pararaton; Nagarakretagama bukan sumber utama untuk teks sumpah. Tanggal dan percakapan di balairung tidak dipastikan di sini. Dialog seluruhnya dramatisasi.",
    dialogue: [
      scene("Narator", "Balairung dipenuhi kain basah dan debu perjalanan. Para pejabat menunggu pembagian penghargaan, tetapi Gajah Mada melangkah ke tengah tanpa meminta apa pun.", "Balairung Agung"),
      scene("Gajah Mada", "Aku belum akan menikmati palapa sebelum cita-cita besar ini terwujud. Biarlah sumpah ini mengikatku lebih dahulu daripada mengikat orang lain.", "Balairung Agung", "gajah-mada"),
      scene("Narator", "Tawa terdengar di sisi ruangan. Ada yang menganggapnya mustahil; ada yang takut bahwa kata-kata itu kelak menjadi alasan untuk mengorbankan terlalu banyak.", "Balairung Agung"),
      scene("Tribhuwana Wijayatunggadewi", "Sumpah dapat menyalakan keberanian. Tetapi siapa yang akan menjaga agar tekad seorang pejabat tidak berubah menjadi beban seluruh rakyat?", "Balairung Agung", "tribhuwana-wijayatunggadewi"),
      scene("Gajah Mada", "Jika sumpah ini hanya milikku, ia akan berakhir bersamaku. Aku ingin setiap wilayah punya alasan untuk ikut membangun masa depan.", "Serambi Istana", "gajah-mada"),
      scene("Narator", "Di luar, para prajurit mengulang kata-kata yang mereka dengar. Di pasar, para pedagang bertanya apakah persatuan berarti jalan lebih aman atau upeti lebih besar.", "Pasar Trowulan"),
      scene("Tribhuwana Wijayatunggadewi", "Buktikan sumpah itu dengan keputusan yang membuat orang ingin tinggal di dalamnya, bukan dengan membuat mereka takut untuk pergi.", "Balairung Agung", "tribhuwana-wijayatunggadewi"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Teguhkan sumpah dan buktikan bahwa tekad dapat berjalan seiring dengan keadilan.",
    opponentTitle: "Panglima Penantang",
    choices: [
      { id: "palapa-voice", label: "Jawab keraguan dengan ketegasan", consequence: "Para prajurit mengingat keberanianmu, sementara para pejabat menunggu batas yang akan kau tetapkan." },
      { id: "palapa-council", label: "Ajak para wilayah merumuskan tujuan bersama", consequence: "Perjalanan menuju persatuan lebih lambat, tetapi para utusan merasa masa depan mereka ikut dibicarakan." },
    ],
    replayPointBase: 40,
    ending: "Sumpah menyebar dari balairung hingga ke pelabuhan. Namun kata-kata yang terdengar sama dapat berarti berbeda bagi orang yang hidup jauh dari takhta.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-pasunda-bubat", chapter: 5, kind: "BATTLE", title: "Bubat: Dua Istana, Dua Ingatan",
    soundtrackUrl: "/story-mode/audio/gamelan-melody.wav",
    intro: "Kisah Bubat sampai kepada kita melalui tradisi naskah yang berbeda. Bab ini sengaja menampilkan ketegangan diplomasi dari dua sisi dan menjaga ruang bagi ketidakpastian sejarah.",
    historicalNote: "Landasan: Bubat disebut dalam tradisi Pararaton dan naskah Sunda kemudian, namun tidak diulas dalam Nagarakretagama (1365). Sumber berbeda dalam genre dan sudut pandang; adegan ini tidak menetapkan satu versi sebagai fakta final. https://hasp.ub.uni-heidelberg.de/catalog/view/366/517/81624 | https://direktorimajapahit.id/yad/berkas/buku/Kakawin%20Nagarakertagama%20-Terjemahan%20Bahasa%20Indonesia.pdf",
    dialogue: [
      scene("Narator", "Rombongan Sunda tiba di lapangan Bubat membawa panji dan harapan pernikahan. Di Trowulan, para pejabat memperdebatkan tata upacara; satu kata tentang kedudukan berubah menjadi jarak yang tak terlihat.", "Lapangan Bubat"),
      scene("Utusan Sunda", "Kami datang sebagai keluarga yang hendak menyambut keluarga. Jangan sambut kami sebagai wilayah yang menyerahkan diri.", "Lapangan Bubat"),
      scene("Hayam Wuruk", "Aku mengundang mereka karena ingin menyatukan dua rumah, bukan menguji siapa yang lebih tinggi.", "Puri Trowulan", "hayam-wuruk"),
      scene("Gajah Mada", "Jika kita mengalah dalam tata upacara, para sekutu dapat membaca itu sebagai kelemahan. Jika kita memaksa, mereka akan pulang membawa luka.", "Puri Trowulan", "gajah-mada"),
      scene("Narator", "Di antara kedua istana terbentang tanah lapang. Sebuah surat terlambat; utusan yang membawanya jatuh dari kuda sebelum sempat melewati gerbang.", "Jalur Menuju Bubat"),
      scene("Hayam Wuruk", "Hentikan genderang. Jangan biarkan orang lain memutuskan atas nama kehormatanku.", "Gerbang Bubat", "hayam-wuruk"),
      scene("Narator", "Perintah itu tiba ketika barisan telah bergerak. Sejarah kelak mengingat hari ini melalui cerita yang berbeda-beda; bagi mereka yang berdiri di lapangan, yang terdengar hanya nama-nama yang dipanggil dan tak menjawab.", "Lapangan Bubat"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Hadapi krisis di Bubat dan tentukan apakah kehormatan masih bisa diselamatkan melalui perundingan.",
    opponentTitle: "Prabu Maharaja Linggabuana",
    choices: [
      { id: "bubat-parley", label: "Buka jalan untuk perundingan terakhir", consequence: "Beberapa orang memilih mundur dari barisan; yang lain menilai kehormatan telah terluka terlalu dalam." },
      { id: "bubat-stand", label: "Pertahankan tata istana", consequence: "Balairung tetap tampak tegak, tetapi kabar tentang keputusan itu akan hidup lebih lama daripada upacaranya." },
    ],
    replayPointBase: 45,
    ending: "Bubat meninggalkan luka dalam ingatan Jawa dan Sunda. Sumber-sumber tidak menyajikan satu kisah yang seragam; kemenangan dalam pertempuran tak menghapus kegagalan diplomasi.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-nagarakretagama", chapter: 6, kind: "BATTLE", title: "Negeri dalam Sebuah Kakawin",
    soundtrackUrl: "/story-mode/audio/gamelan-melody.wav",
    intro: "Tahun 1365. Prapanca menyusun Deśawarṇana, yang kemudian dikenal luas sebagai Nagarakretagama. Di balik pujian istana, seorang penyalin muda bertanya: siapa yang tak tercatat dalam kisah tentang kejayaan?",
    historicalNote: "Landasan: Nagarakretagama/Deśawarṇana diselesaikan pada 1365 dan merupakan pujasastra. Penyalin muda dan dialog adalah fiksi editorial. https://direktorimajapahit.id/yad/berkas/buku/Kakawin%20Nagarakertagama%20-Terjemahan%20Bahasa%20Indonesia.pdf",
    dialogue: [
      scene("Narator", "Hujan tipis jatuh di halaman biara. Mpu Prapanca merapikan lembar lontar; setiap nama tempat membawa bunyi roda, doa, pasar, dan perjalanan jauh.", "Pertapaan Kamalasana"),
      scene("Mpu Prapanca", "Aku menulis negeri ini sebagaimana terlihat dari perjalanan dan ingatan. Namun tak ada kakawin yang dapat memuat setiap suara.", "Pertapaan Kamalasana"),
      scene("Penyalin Muda", "Jika yang menyakitkan tak ditulis, apakah ia berhenti menjadi bagian dari negeri ini?", "Pertapaan Kamalasana"),
      scene("Narator", "Lontar-lontar itu menyebut kota, gunung, tempat suci, dan perjalanan raja. Di sebuah pasar, seorang ibu menunggu anaknya pulang dari tugas yang tak pernah ia pilih.", "Pasar Trowulan"),
      scene("Hayam Wuruk", "Pujian dapat menguatkan negeri, tetapi penguasa harus mendengar juga hal-hal yang tak dinyanyikan di balairung.", "Puri Trowulan", "hayam-wuruk"),
      scene("Mpu Prapanca", "Biarkan pembaca mengingat bahwa sebuah negeri lebih luas daripada pagar istananya. Nama-nama yang terlewat tetap hidup di dalam orang yang membawanya.", "Pertapaan Kamalasana"),
      scene("Narator", "Lontar terakhir digulung. Di ufuk, layar-layar bergerak pulang; satu kursi di balairung tetap kosong, dan sumpah Gajah Mada memasuki babak yang tak lagi dapat ia saksikan.", "Cakrawala Nusantara"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Lindungi naskah dan pilih bagaimana kisah kejayaan memberi ruang bagi suara yang terlupakan.",
    opponentTitle: "Penjaga Naskah Istana",
    choices: [
      { id: "kakawin-archive", label: "Simpan catatan yang tak masuk pujian", consequence: "Para penyalin menjaga kisah yang lebih beragam, meski tidak semua orang di istana menyukainya." },
      { id: "kakawin-harmony", label: "Utamakan kisah yang mempersatukan", consequence: "Naskah lebih mudah diterima istana, tetapi pembaca harus mencari suara lain di luar halaman resminya." },
    ],
    replayPointBase: 50,
    ending: "Kakawin selesai pada 1365, setelah masa Gajah Mada. Pujian istana menggambarkan dunia yang luas; diamnya sebuah naskah juga mengingatkan kita untuk bertanya siapa yang tidak ikut berbicara.",
  }),
  mission("MAJAPAHIT", {
    id: "majapahit-amukti-palapa", chapter: 7, kind: "FINAL_BOSS", title: "Amukti Palapa",
    intro: "Malam terakhir menyatukan semua jejak: hutan Tarik, jalan Tuban, gerbang timur, balairung, dan lapangan Bubat. Ini adalah ending sinematik yang membayangkan sumpah sebagai warisan yang harus dipertanggungjawabkan.",
    historicalNote: "Ending simbolis dan Bayang-Bayang Sumpah adalah fiksi fantasi. Kakawin Nagarakretagama menyebut wafatnya Gajah Mada dan ditulis pada 1365; sumpah Palapa bersumber pada tradisi Pararaton.",
    soundtrackUrl: AMUKTI_PALAPA_SOUNDTRACK_URL,
    dialogue: [
      scene("Narator", "Layar menghitam. Suara air sungai berubah menjadi bunyi ombak, lalu genderang. Di hadapanmu berdiri bayangan dari semua janji yang pernah dibuat atas nama kerajaan.", "Cakrawala Nusantara"),
      scene("Gajah Mada", "Aku mengucapkan sumpah untuk negeri yang ingin kubangun. Aku tak pernah dapat memastikan bagaimana setiap orang akan mengingatnya.", "Gerbang Penyatuan", "gajah-mada"),
      scene("Narator", "Bayangan itu menjelma menjadi panglima tanpa wajah. Di perisainya terpahat nama orang-orang yang pernah diminta berkorban demi kata persatuan.", "Gerbang Penyatuan"),
      scene("Hayam Wuruk", "Jangan bertanya hanya apakah kita telah menang. Tanyakan juga siapa yang merasa memiliki masa depan setelah kemenangan itu.", "Balairung Trowulan", "hayam-wuruk"),
      scene("Gajah Mada", "Jika sumpah ini masih hidup, biarlah ia hidup sebagai tanggung jawab. Bukan rantai yang memaksa, bukan pula pujian yang melupakan luka.", "Cakrawala Nusantara", "gajah-mada"),
      scene("Narator", "Genderang berhenti. Panji-panji di cakrawala tidak lagi berdiri dalam satu barisan; beberapa mendekat, beberapa menjaga jarak, tetapi semua terlihat di bawah matahari yang sama.", "Laut Nusantara"),
      scene("Narator", "Cahaya menembus layar. Amukti Palapa tidak berakhir sebagai penaklukan yang sempurna, melainkan pertanyaan yang diwariskan: apa arti persatuan bila setiap suara tidak ikut menjaganya?", "Cakrawala Nusantara"),
    ],
    choiceAfterSceneIndex: null,
    objective: "Kalahkan Bayang-Bayang Sumpah dan tuntaskan perjalanan Majapahit.",
    opponentTitle: "Bayang-Bayang Sumpah",
    choices: [], replayPointBase: 60,
    endingTitle: "Amukti Palapa: Sumpah yang Menjadi Cakrawala",
    ending: "Fajar membentang di atas laut. Gajah Mada telah tiada, namun sumpahnya terus diceritakan. Kini kau memahami bahwa warisan terbesar bukanlah peta yang dikuasai, melainkan masa depan yang bersedia dijaga bersama.",
  }),
];

const pajajaranMissions: readonly StoryMission[] = [
  mission("PAJAJARAN", {
    id: "pajajaran-bujangga-maniks-journey", chapter: 1, kind: "STORY", title: "Jalan yang Dicatat Bujangga",
    soundtrackUrl: "/story-mode/audio/sundanese-gamelan-flute.mp3",
    intro: "Sebuah kisah perjalanan Sunda Kuna membuka kampanye. Bujangga Manik, seorang pangeran yang memilih jalan pengembaraan, melintasi banyak tempat di Jawa dan Bali; catatannya menjadi peta bagi generasi yang hidup setelahnya.",
    historicalNote: "Landasan: naskah Sunda Kuna Bujangga Manik menceritakan perjalanan seorang pangeran/pertapa melalui Jawa dan Bali; dialog dan pilihan pemain adalah dramatisasi. https://balaibahasajabar.kemendikdasmen.go.id/1293-2/ | https://katalog.kairaga.com/detail?id=126",
    dialogue: [
      scene("Narator", "Pagi menyibak kabut di Pakuan. Bujangga Manik meninggalkan gerbang tanpa iring-iringan kerajaan; ia membawa bekal sederhana dan rasa ingin tahu yang lebih berat dari pedang.", "Gerbang Pakuan", "bujangga-manik"),
      scene("Bujangga Manik", "Dari istana, dunia tampak seperti batas-batas di peta. Aku ingin berjalan sampai nama tempat memiliki suara dan wajah.", "Jalan Pakuan", "bujangga-manik"),
      scene("Narator", "Jalan menanjak melewati hutan, sungai, dan kampung. Setiap persinggahan mengajarkan bahwa kerajaan tersusun dari kehidupan yang tak selalu terlihat dari balairung.", "Jalur Pegunungan"),
      scene("Penjaga Kabuyutan", "Catat tempat ini dengan hati-hati. Jalan yang kau lewati juga menghubungkan orang-orang yang tak pernah bertemu rajanya.", "Kabuyutan Sunda"),
      scene("Bujangga Manik", "Aku akan menulis apa yang kulihat, bukan hanya nama yang ingin didengar istana.", "Kabuyutan Sunda", "bujangga-manik"),
      scene("Narator", "Perjalanan membawanya melintasi tanah Jawa dan sampai ke Bali. Ketika ia kembali, peta di dalam pikirannya jauh lebih luas daripada dinding Pakuan.", "Jalur Pesisir"),
      scene("Bujangga Manik", "Kelak, bila jalan berubah dan panji berganti, seseorang masih dapat menemukan tempat pulang lewat nama-nama ini.", "Jalan Pakuan", "bujangga-manik"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Bantu Bujangga Manik memilih apa yang harus dicatat agar jalan dan masyarakatnya tak terlupakan.",
    opponentTitle: "Penjaga Jalan Pegunungan",
    choices: [
      { id: "manik-place", label: "Catat nama tempat dan rute", consequence: "Para pengelana masa depan dapat mengikuti jejak, meski alasan orang-orang tinggal di sana belum seluruhnya tertulis." },
      { id: "manik-people", label: "Catat kisah orang yang ditemui", consequence: "Suara penduduk menjadi pusat naskah, sementara beberapa jalan hanya bisa ditemukan melalui ingatan mereka." },
    ],
    replayPointBase: 30,
    ending: "Catatan perjalanan itu akan menjadi salah satu jendela paling rinci ke dunia Sunda Kuna. Cerita beralih ke Pakuan beberapa tahun kemudian, ketika warisan kerajaan mulai dipertaruhkan.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-pakuan-whispers", chapter: 2, kind: "STORY", title: "Rahasia di Pakuan",
    soundtrackUrl: "/story-mode/audio/seruling-sunda.wav",
    intro: "Menjelang akhir masa Sri Baduga Maharaja, kabar dari pelabuhan dan perbatasan tiba bersamaan. Seorang juru tulis menemukan lembar yang tidak tercatat; isinya bukan ramalan, melainkan laporan yang sengaja tak pernah sampai ke pusat.",
    historicalNote: "Landasan: Sri Baduga dan sejarah Sunda dikenal melalui prasasti serta naskah Sunda Kuna. Laporan rahasia dan juru tulis adalah fiksi; jangan menyajikan konflik ini sebagai peristiwa tercatat. https://katalog.kairaga.com/detail?id=7",
    dialogue: [
      scene("Narator", "Kabut pagi menggantung di jalan Pakuan. Juru tulis istana membawa lembar dari gudang arsip, dengan bekas air hujan dan segel yang telah dipatahkan.", "Ruang Arsip Pakuan"),
      scene("Juru Tulis Pakuan", "Laporan ini menyebut pelabuhan yang mulai gelisah. Tetapi catatan resmi berkata semuanya tenang.", "Ruang Arsip Pakuan"),
      scene("Sri Baduga Maharaja", "Kabar buruk bukan pengkhianatan. Menyembunyikannya dari rakyat dan istana dapat menjadi pengkhianatan.", "Balairung Pakuan", "sri-baduga-maharaja"),
      scene("Narator", "Para pejabat meminta agar nama pembawa laporan dirahasiakan. Para pedagang menuntut jawaban sebelum kapal berikutnya berangkat.", "Pasar Pakuan"),
      scene("Sri Baduga Maharaja", "Kau harus memilih: lindungi orang yang membawa kabar, atau pastikan setiap baris laporan dapat dibuktikan.", "Balairung Pakuan", "sri-baduga-maharaja"),
      scene("Juru Tulis Pakuan", "Ada satu nama yang berulang pada setiap salinan: Sunda Kalapa. Jika kita menunggu sampai kabar itu pasti, mungkin pelabuhan telah memilih jalannya sendiri.", "Gerbang Pakuan"),
      scene("Narator", "Di kejauhan, layar-layar memenuhi muara. Pakuan harus memutuskan bagaimana berbicara kepada dunia yang datang melalui laut.", "Jalan Menuju Kalapa"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Pilih cara mengungkap laporan pelabuhan tanpa memecah kepercayaan di Pakuan.",
    opponentTitle: "Penjaga Arsip Istana",
    choices: [
      { id: "pakuan-protect", label: "Lindungi pembawa kabar", consequence: "Rakyat melihat istana berpihak pada orang yang berani bicara, tetapi bukti masih harus diuji." },
      { id: "pakuan-verify", label: "Periksa setiap salinan lebih dahulu", consequence: "Keputusan bertumpu pada bukti, namun para pedagang menunggu lebih lama untuk mendapat jawaban." },
    ],
    replayPointBase: 35,
    ending: "Laporan itu mengubah cara Pakuan memandang pelabuhannya. Tidak lama lagi, sebuah perjanjian akan membawa kekuatan asing ke Sunda Kalapa.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-sunda-portuguese-treaty", chapter: 3, kind: "BATTLE", title: "Padrao di Muara Ciliwung",
    soundtrackUrl: "/story-mode/audio/sundanese-gamelan-flute.mp3",
    intro: "Tahun 1522, perwakilan Portugis dan Kerajaan Sunda menyepakati hubungan dagang dan pembangunan benteng di Sunda Kalapa. Diplomasi ini membuka peluang sekaligus menghadirkan ancaman baru di pelabuhan.",
    historicalNote: "Landasan: Museum Nasional mencatat hubungan dagang Sunda–Portugis pada 1522 dan rencana pos berbenteng di Kalapa; konflik dan percakapan di sini didramatisasi. https://www.museumnasional.or.id/1899/",
    dialogue: [
      scene("Narator", "Kapal asing menurunkan layar di muara. Di tepi sungai, batu peringatan menunggu dipasang; bagi satu pihak ia tanda persahabatan, bagi pihak lain tanda bahwa keseimbangan telah berubah.", "Muara Sunda Kalapa"),
      scene("Surawisesa", "Kita mencari sekutu untuk menjaga pelabuhan. Tetapi jangan menyerahkan keputusan tentang pelabuhan kepada sekutu itu.", "Balairung Sunda Kalapa", "surawisesa"),
      scene("Utusan Portugis", "Kami datang membawa perjanjian dan kepentingan dagang. Keduanya berjalan bersama, sekalipun kata-kata di atas kertas terdengar lebih halus.", "Dermaga Sunda Kalapa"),
      scene("Narator", "Para saudagar bertanya apakah benteng akan melindungi kapal mereka atau mengubah siapa yang mengendalikan muara. Awak kapal mengawasi dari geladak.", "Dermaga Sunda Kalapa"),
      scene("Surawisesa", "Sebuah perjanjian bukan akhir dari kewaspadaan. Pastikan setiap janji memiliki batas dan setiap pihak tahu apa yang dipertaruhkan.", "Balairung Sunda Kalapa", "surawisesa"),
      scene("Narator", "Tanda perjanjian berdiri menghadap arus. Di hulu, para utusan membawa kabar itu ke Pakuan; di hilir, kapal-kapal lain telah berlayar membawa berita ke kerajaan tetangga.", "Muara Ciliwung"),
      scene("Surawisesa", "Jika muara ini jatuh, Pakuan kehilangan lebih dari perdagangan. Ia kehilangan jalan untuk mendengar dunia.", "Muara Sunda Kalapa", "surawisesa"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Pertahankan ruang diplomasi Sunda sambil menghadapi tekanan di pelabuhan.",
    opponentTitle: "Panglima Penjaga Muara",
    choices: [
      { id: "port-terms", label: "Perketat batas perjanjian", consequence: "Kendali Sunda atas pelabuhan ditegaskan, tetapi sekutu dagang menuntut jaminan baru." },
      { id: "port-alliance", label: "Terima perlindungan bersama", consequence: "Kapal memperoleh perlindungan, namun semakin banyak pihak merasa berhak menentukan nasib muara." },
    ],
    replayPointBase: 40,
    ending: "Padrao berdiri sebagai tanda sebuah perjanjian yang tak sempat menjadi benteng seperti direncanakan. Lima tahun kemudian, Sunda Kalapa berpindah tangan.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-border-accord", chapter: 4, kind: "BATTLE", title: "Ketika Kalapa Berubah Nama",
    soundtrackUrl: "/story-mode/audio/epic-nusantara.mp3",
    intro: "Tahun 1527, Sunda Kalapa jatuh ke tangan pasukan yang dipimpin Fatahillah menurut tradisi sejarah yang lazim dikutip. Di tengah perebutan pelabuhan, orang-orang biasa harus memilih jalan pulang yang masih terbuka.",
    historicalNote: "Landasan: Museum Nasional menyebut perjanjian 1522 tidak terlaksana setelah Sunda Kalapa dikuasai Fatahillah pada 1527. Dialog evakuasi dan tokoh Pengawal Kalapa adalah fiksi. https://www.museumnasional.or.id/1899/",
    dialogue: [
      scene("Narator", "Asap terlihat dari arah muara. Di pos jalan, seorang pengawal membawa dua pesan: satu meminta pasukan bertahan, satu lagi meminta warga segera meninggalkan tepi sungai.", "Jalan Kalapa"),
      scene("Surawisesa", "Jangan biarkan kita hanya memilih antara pelabuhan dan rakyat. Cari jalan yang menyelamatkan sebanyak mungkin orang.", "Pos Perbatasan", "surawisesa"),
      scene("Pengawal Kalapa", "Kapal-kapal telah pergi. Ada keluarga yang belum menemukan anaknya, dan arsip pelabuhan masih tersimpan di rumah syahbandar.", "Gerbang Kalapa"),
      scene("Narator", "Pasukan lawan bergerak memasuki kota. Waktu cukup untuk satu tindakan: membuka jalur evakuasi, mengamankan arsip, atau mengumpulkan penjaga untuk bertahan.", "Gerbang Kalapa"),
      scene("Surawisesa", "Kota dapat direbut. Jangan biarkan mereka yang tinggal di dalamnya menjadi korban yang tidak disebut dalam laporan perang.", "Jalan Pesisir", "surawisesa"),
      scene("Narator", "Panji di gerbang berganti. Di belakang barisan, seorang anak membawa salinan peta sungai yang basah; ia tak tahu apakah jalan pulang masih menuju kota yang sama.", "Muara Sunda Kalapa"),
      scene("Pengawal Kalapa", "Kalapa tak lagi dapat kita jaga seperti kemarin. Tapi orang-orangnya masih punya masa depan jika kita berhasil membawa mereka keluar.", "Jalur Pegunungan"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Hadapi perebutan Kalapa dan tentukan apa yang harus diselamatkan lebih dahulu.",
    opponentTitle: "Faletehan",
    choices: [
      { id: "kalapa-evacuate", label: "Buka jalur bagi warga", consequence: "Lebih banyak keluarga dapat pergi, sementara catatan pelabuhan berisiko tertinggal." },
      { id: "kalapa-records", label: "Selamatkan peta dan arsip", consequence: "Jalur dan nama tempat dapat diwariskan, tetapi sebagian warga harus mencari jalan sendiri." },
    ],
    replayPointBase: 40,
    ending: "Sunda Kalapa berpindah tangan. Kabar tentang kota yang hilang menempuh jalan darat menuju Pakuan, tempat Surawisesa kelak mengabadikan nama ayahnya di atas batu.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-batutulis-memory", chapter: 5, kind: "BATTLE", title: "Batu yang Mengingat",
    soundtrackUrl: "/story-mode/audio/seruling-sunda.wav",
    intro: "Bacaan yang lazim menempatkan prasasti Batutulis sekitar 1533 dan mengaitkannya dengan Surawisesa yang mengenang Sri Baduga Maharaja. Pembacaan angka tahunnya diperdebatkan. Di tengah perubahan politik, batu menjadi saksi tentang siapa yang ingin diingat dan bagaimana sebuah negeri mewariskan masa lalunya.",
    historicalNote: "Landasan: Batutulis menyebut Sri Baduga Maharaja sebagai raja terdahulu; pembacaan tahun 1455 Saka/1533–1534 M dan kronologi Sunda masih diperdebatkan. Dialog Surawisesa dan Juru Pahat adalah dramatisasi. https://doi.org/10.4000/archipel.2365 | https://dharmalekha.info/texts/INSIDENKBatutulis",
    dialogue: [
      scene("Narator", "Pahat menyentuh batu di selatan Pakuan. Setiap ketukan terdengar seperti jawaban atas tahun-tahun yang berlalu sejak pelabuhan berubah tangan.", "Batutulis"),
      scene("Surawisesa", "Ayahku membangun pemerintahan yang dikenang rakyat. Aku ingin batu ini menyebut namanya tanpa mengubahnya menjadi kisah yang tak boleh dipertanyakan.", "Batutulis", "surawisesa"),
      scene("Juru Pahat", "Batu dapat bertahan lebih lama daripada suara. Tetapi siapa yang memutuskan kata mana yang pantas diukir?", "Batutulis"),
      scene("Narator", "Pejabat istana meminta prasasti memuat kejayaan. Para pengungsi dari Kalapa meminta agar kehilangan mereka tidak dianggap kecil.", "Pelataran Pakuan"),
      scene("Surawisesa", "Kenangan yang hanya memuji akan rapuh. Kenangan yang memberi tempat bagi luka dapat menjadi pelajaran bagi pewaris takhta.", "Batutulis", "surawisesa"),
      scene("Narator", "Di bawah pohon, seorang anak membaca nama Sri Baduga perlahan. Ia belum mengenal semua peristiwa, tetapi mengerti bahwa orang dewasa sedang mencoba menjaga sesuatu.", "Pelataran Pakuan"),
      scene("Surawisesa", "Ukir namanya. Lalu biarkan generasi berikutnya bertanya apa yang harus mereka lakukan dengan warisan itu.", "Batutulis", "surawisesa"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Lindungi prasasti dan tentukan bagaimana Pakuan mengingat rajanya.",
    opponentTitle: "Panglima Penentang Prasasti",
    choices: [
      { id: "batutulis-legacy", label: "Utamakan jasa Sri Baduga", consequence: "Prasasti menguatkan kebanggaan rakyat, sementara luka akibat kehilangan pelabuhan tetap menunggu pengakuan." },
      { id: "batutulis-truth", label: "Catat warisan beserta tanggung jawabnya", consequence: "Tulisan menjadi pengingat bahwa kejayaan membawa kewajiban untuk melindungi rakyat." },
    ],
    replayPointBase: 45,
    ending: "Batutulis menjadi penanda penting bagi ingatan Pakuan. Namun prasasti tidak dapat menghentikan perubahan yang terus bergerak dari pesisir ke pedalaman.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-fractured-court", chapter: 6, kind: "BATTLE", title: "Panji di Persimpangan",
    soundtrackUrl: "/story-mode/audio/epic-nusantara.mp3",
    intro: "Beberapa dasawarsa berlalu. Tekanan dari luar dan perselisihan di dalam membuat wilayah Sunda berhadapan dengan masa depan yang tak lagi ditentukan satu pusat saja. Bab ini memakai tokoh dan konflik fiktif untuk mewakili perubahan panjang itu.",
    historicalNote: "Konflik, surat, dan pertemuan merupakan komposit fiktif. Kerajaan Sunda mengalami perubahan politik dan pembagian wilayah; hindari menyajikan adegan ini sebagai kronik peristiwa spesifik. https://scholar.unpad.ac.id/en/publications/reorganization-of-region-and-traditional-political-structure-in-p-2/",
    dialogue: [
      scene("Narator", "Peta Pakuan penuh garis yang ditarik ulang. Utusan datang dari wilayah-wilayah dengan kebutuhan berbeda; sebagian meminta pasukan, sebagian meminta ruang untuk mengatur urusan sendiri.", "Balairung Pakuan"),
      scene("Bujangga Manik", "Aku pernah berjalan melewati banyak negeri. Jalan tetap menghubungkan orang, bahkan saat para penguasa tak lagi sepakat tentang batas.", "Kabuyutan Sunda", "bujangga-manik"),
      scene("Surawisesa", "Sebuah kerajaan bukan satu suara. Bila pusat hanya memerintah, wilayah akan belajar hidup tanpa mendengarnya.", "Balairung Pakuan", "surawisesa"),
      scene("Narator", "Di gerbang, seorang utusan menunggu jawaban. Ia membawa dua surat: satu berisi ancaman, satu lagi tawaran kerja sama yang dapat mengubah kesetiaan wilayahnya.", "Gerbang Pakuan"),
      scene("Bujangga Manik", "Dengarkan apa yang diminta, bukan hanya siapa yang mengirimnya. Kadang-kadang isi surat lebih jujur daripada cap di atasnya.", "Gerbang Pakuan", "bujangga-manik"),
      scene("Narator", "Di kejauhan, kabut menutup jalan menuju kota. Para penjaga mengangkat panji, tetapi kali ini tak semua panji menghadap arah yang sama.", "Jalur Pegunungan"),
      scene("Surawisesa", "Kirim jawaban yang masih bisa dibawa pulang oleh utusan itu. Kita harus bertahan tanpa membuat setiap tetangga merasa telah kehilangan pilihan.", "Balairung Pakuan", "surawisesa"),
    ],
    choiceAfterSceneIndex: 3,
    objective: "Pertahankan hubungan antara Pakuan dan wilayah-wilayahnya di tengah tekanan yang meningkat.",
    opponentTitle: "Panglima Panji Perbatasan",
    choices: [
      { id: "pakuan-accord", label: "Tawarkan persekutuan setara", consequence: "Beberapa wilayah bertahan sebagai sekutu, namun Pakuan harus berbagi wewenang dan mendengar keberatan mereka." },
      { id: "pakuan-command", label: "Kumpulkan kekuatan di pusat", consequence: "Pertahanan Pakuan menguat, tetapi wilayah yang jauh semakin meragukan apakah pusat memahami mereka." },
    ],
    replayPointBase: 45,
    ending: "Satu per satu jalur berubah. Kabar terakhir menyebut bahwa pasukan Banten bergerak menuju Pakuan; kota harus memilih apa yang paling penting untuk dibawa ke masa depan.",
  }),
  mission("PAJAJARAN", {
    id: "pajajaran-pakuan-finale", chapter: 7, kind: "FINAL_BOSS", title: "Fajar Terakhir Pakuan",
    soundtrackUrl: "/story-mode/audio/sundanese-gamelan-flute.mp3",
    intro: "Tahun 1579, pasukan Banten menyerang Pakuan dan kerajaan Sunda berakhir sebagai kekuatan politik terpusat. Final boss menempatkan pemain di tengah hari terakhir kota, saat menyelamatkan manusia dan warisan sama pentingnya dengan bertahan.",
    historicalNote: "Landasan: kajian Universitas Padjadjaran menempatkan akhir Kerajaan Sunda setelah serangan Banten pada 1579. Adegan hari terakhir, perintah Ragamulya, dan evakuasi adalah dramatisasi, bukan rekonstruksi rinci. https://scholar.unpad.ac.id/en/publications/reorganization-of-region-and-traditional-political-structure-in-p-2/",
    dialogue: [
      scene("Narator", "Kabut pagi pecah oleh suara dari gerbang. Di dalam Pakuan, keluarga-keluarga berkumpul di persimpangan; satu jalan menuju hutan, satu ke balairung, satu lagi ke tempat penyimpanan lontar.", "Gerbang Pakuan"),
      scene("Ragamulya", "Jangan biarkan siapa pun percaya bahwa hilangnya takhta berarti hilangnya seluruh orang Sunda.", "Balairung Pakuan", "ragamulya"),
      scene("Bujangga Manik", "Nama tempat hidup selama seseorang masih dapat menyebutnya. Bawa naskah, tetapi pastikan orang-orang yang akan membacanya ikut selamat.", "Ruang Naskah Pakuan", "bujangga-manik"),
      scene("Narator", "Panglima lawan menerobos gerbang luar. Para penjaga meminta perintah terakhir: mempertahankan istana, membuka jalur keluar, atau mengamankan naskah yang mencatat jalan-jalan Sunda.", "Gerbang Pakuan"),
      scene("Ragamulya", "Aku akan menghadapi pasukan di sini. Kau tentukan apa yang harus tetap hidup ketika matahari terbenam.", "Balairung Pakuan", "ragamulya"),
      scene("Narator", "Pertempuran mengguncang dinding. Di kejauhan, para pengungsi bergerak menuju wilayah-wilayah yang kelak meneruskan adat dan pemerintahan Sunda dalam bentuk baru.", "Jalur Pegunungan"),
      scene("Bujangga Manik", "Kerajaan dapat kehilangan ibu kota. Kisah sebuah negeri hanya hilang bila tak seorang pun lagi berani membawanya pulang.", "Jalan Pakuan", "bujangga-manik"),
    ],
    choiceAfterSceneIndex: null,
    objective: "Hadapi serangan terakhir dan tentukan warisan Pakuan yang akan dibawa melewati fajar.",
    opponentTitle: "Maulana Yusuf",
    choices: [], replayPointBase: 60,
    endingTitle: "Pakuan Jatuh, Jejaknya Menyala",
    ending: "Gerbang Pakuan terdiam. Kerajaan Sunda tidak lagi berdiri sebagai satu pusat kekuasaan, tetapi jalan, bahasa, ingatan, dan masyarakatnya terus hidup. Di balik kabut, seorang anak membuka kembali catatan Bujangga Manik dan menemukan jalan pulang.",
  }),
];

const BASE_STORY_CAMPAIGNS: readonly StoryCampaign[] = [
  {
    kingdom: "MAJAPAHIT",
    title: "Mahkota di Ujung Sumpah",
    subtitle: "Dari hutan Tarik hingga Amukti Palapa: persatuan harus diperjuangkan dan dipertanggungjawabkan.",
    accent: "#e9a83b",
    missions: majapahitMissions,
  },
  {
    kingdom: "PAJAJARAN",
    title: "Jejak Kabut Pakuan",
    subtitle: "Ikuti jalan, perjanjian, dan ingatan yang membawa Pakuan melewati perubahan zaman.",
    accent: "#66b39a",
    missions: pajajaranMissions,
  },
];

export const STORY_CAMPAIGNS: readonly StoryCampaign[] = BASE_STORY_CAMPAIGNS.map((campaign) => {
  const campaignCopy = STORY_TRANSLATIONS[campaign.kingdom];
  return {
    ...campaign,
    translations: {
      ...campaignCopy.campaign,
      ...campaign.translations,
    },
    missions: campaign.missions.map((mission) => {
      const copy = campaignCopy.missions[mission.id];
      if (!copy) return mission;
      return {
        ...mission,
        translations: {
          title: copy.title,
          intro: copy.intro,
          objective: copy.objective,
          opponentTitle: copy.opponentTitle,
          endingTitle: copy.endingTitle,
          ending: copy.ending,
          ...mission.translations,
        },
        dialogue: mission.dialogue.map((line, index) => {
          const speakerCopy = localizeStorySpeaker(line.speaker);
          const locationCopy = line.location ? localizeStoryLocation(line.location) : undefined;
          return {
            ...line,
            translations: {
              ...line.translations,
              ...(copy.scenes[index]
                ? { text: { ...copy.scenes[index], ...line.translations?.text } }
                : {}),
              ...(speakerCopy
                ? { speaker: { ...speakerCopy, ...line.translations?.speaker } }
                : {}),
              ...(locationCopy
                ? { location: { ...locationCopy, ...line.translations?.location } }
                : {}),
            },
          };
        }),
        choices: mission.choices.map((choice, index) => {
          const choiceCopy = copy.choices[index];
          return choiceCopy
            ? {
                ...choice,
                translations: {
                  label: { ...choiceCopy.label, ...choice.translations?.label },
                  consequence: { ...choiceCopy.consequence, ...choice.translations?.consequence },
                },
              }
            : choice;
        }),
      };
    }),
  };
});

const LOCATION_BACKGROUNDS: Record<string, string> = {
  "Jalur Sungai Brantas": "/story-mode/scenes/jalur-sungai-brantas.webp",
  "Dermaga Madura": "/story-mode/scenes/dermaga-madura.webp",
  "Perkemahan Tarik": "/story-mode/scenes/perkemahan-tarik.webp",
  "Hutan Tarik": "/story-mode/scenes/hutan-tarik.webp",
  "Pelabuhan Tuban": "/story-mode/scenes/pelabuhan-tuban.webp",
  "Balairung Majapahit": "/story-mode/scenes/balairung-majapahit.webp",
  "Jalan Tuban": "/story-mode/scenes/jalan-tuban.webp",
  "Jalur Hutan Timur": "/story-mode/scenes/jalur-hutan-timur.webp",
  "Gerbang Sadeng": "/story-mode/scenes/gerbang-sadeng.webp",
  "Gerbang Keta": "/story-mode/scenes/gerbang-keta.webp",
  "Balairung Agung": "/story-mode/scenes/balairung-majapahit.webp",
  "Serambi Istana": "/story-mode/scenes/serambi-istana.webp",
  "Pasar Trowulan": "/story-mode/scenes/pasar-trowulan.webp",
  "Lapangan Bubat": "/story-mode/scenes/lapangan-bubat.webp",
  "Puri Trowulan": "/story-mode/scenes/puri-trowulan.webp",
  "Jalur Menuju Bubat": "/story-mode/scenes/jalur-menuju-bubat.webp",
  "Gerbang Bubat": "/story-mode/scenes/gerbang-bubat.webp",
  "Pertapaan Kamalasana": "/story-mode/scenes/pertapaan-kamalasana.webp",
  "Cakrawala Nusantara": "/story-mode/scenes/cakrawala-nusantara.webp",
  "Gerbang Penyatuan": "/story-mode/scenes/gerbang-penyatuan.webp",
  "Balairung Trowulan": "/story-mode/scenes/balairung-trowulan.webp",
  "Laut Nusantara": "/story-mode/scenes/laut-nusantara.webp",
  "Gerbang Pakuan": "/story-mode/scenes/gerbang-pakuan.webp",
  "Jalan Pakuan": "/story-mode/scenes/jalan-pakuan.webp",
  "Jalur Pegunungan": "/story-mode/scenes/jalur-pegunungan.webp",
  "Kabuyutan Sunda": "/story-mode/scenes/kabuyutan-sunda.webp",
  "Jalur Pesisir": "/story-mode/scenes/jalur-pesisir-sunda.webp",
  "Ruang Arsip Pakuan": "/story-mode/scenes/ruang-arsip-pakuan.webp",
  "Balairung Pakuan": "/story-mode/scenes/balairung-pakuan.webp",
  "Pasar Pakuan": "/story-mode/scenes/pasar-pakuan.webp",
  "Jalan Menuju Kalapa": "/story-mode/scenes/jalan-menuju-kalapa.webp",
  "Muara Sunda Kalapa": "/story-mode/scenes/muara-sunda-kalapa.webp",
  "Balairung Sunda Kalapa": "/story-mode/scenes/balairung-sunda-kalapa.webp",
  "Dermaga Sunda Kalapa": "/story-mode/scenes/dermaga-sunda-kalapa.webp",
  "Muara Ciliwung": "/story-mode/scenes/muara-ciliwung.webp",
  "Jalan Kalapa": "/story-mode/scenes/jalan-kalapa.webp",
  "Pos Perbatasan": "/story-mode/scenes/pos-perbatasan.webp",
  "Gerbang Kalapa": "/story-mode/scenes/gerbang-kalapa.webp",
  "Jalan Pesisir": "/story-mode/scenes/jalan-pesisir.webp",
  "Batutulis": "/story-mode/scenes/batutulis.webp",
  "Pelataran Pakuan": "/story-mode/scenes/pelataran-pakuan.webp",
  "Ruang Naskah Pakuan": "/story-mode/scenes/ruang-naskah-pakuan.webp",
};

export function getStorySceneBackground(location?: string | null): string | null {
  return LOCATION_BACKGROUNDS[location ?? ""] ?? null;
}

export function withStorySceneAssets(campaign: StoryCampaign): StoryCampaign {
  return {
    ...campaign,
    missions: campaign.missions.map((content) => ({
      ...content,
      dialogue: content.dialogue.map((line) => ({
        ...line,
        backgroundUrl: line.backgroundUrl ?? LOCATION_BACKGROUNDS[line.location ?? ""] ?? null,
        backgroundAssetId: line.backgroundAssetId ?? null,
        soundEffectAssetId: line.soundEffectAssetId ?? null,
      })),
    })),
  };
}

export const DEFAULT_STORY_CAMPAIGNS: readonly StoryCampaign[] = STORY_CAMPAIGNS.map(withStorySceneAssets);

export function ensureStoryCampaignTroopCompositions(campaign: StoryCampaign): StoryCampaign {
  const defaultCampaign = DEFAULT_STORY_CAMPAIGNS.find((item) => item.kingdom === campaign.kingdom);
  if (!defaultCampaign) return campaign;

  const defaultMissions = new Map(defaultCampaign.missions.map((item) => [item.id, item]));
  let changed = false;
  const missions = campaign.missions.map((item) => {
    const defaults = defaultMissions.get(item.id);
    if (!defaults) return item;

    const playerFallback = defaults.storyDeck.characterSlugs.find(isGenericTroop)
      ?? (campaign.kingdom === "MAJAPAHIT" ? "prajurit-majapahit" : "prajurit-pajajaran");
    const storyCharacters = fillDeckWithTroops(item.storyDeck.characterSlugs, playerFallback);

    let opponentDeck = item.opponentDeck;
    if (opponentDeck) {
      const opponentFallback = defaults.opponentDeck?.characterSlugs.find(isGenericTroop)
        ?? (campaign.kingdom === "MAJAPAHIT" ? "prajurit-daha" : "prajurit-pajajaran");
      opponentDeck = {
        ...opponentDeck,
        characterSlugs: fillDeckWithTroops(opponentDeck.characterSlugs, opponentFallback),
      };
    }

    if (
      storyCharacters.length === item.storyDeck.characterSlugs.length
      && storyCharacters.every((slug, index) => slug === item.storyDeck.characterSlugs[index])
      && JSON.stringify(opponentDeck) === JSON.stringify(item.opponentDeck)
    ) return item;

    changed = true;
    return { ...item, storyDeck: { ...item.storyDeck, characterSlugs: storyCharacters }, opponentDeck };
  });

  return changed ? { ...campaign, missions } : campaign;
}

export const DEFAULT_STORY_CONTENT_VERSION = 10;
