export const STORY_PUBLIC_SCENE_BACKGROUNDS = [
  "balairung-majapahit.webp", "balairung-pakuan.webp", "balairung-sunda-kalapa.webp", "balairung-trowulan.webp",
  "batutulis.webp", "cakrawala-nusantara.webp", "dermaga-madura.webp", "dermaga-sunda-kalapa.webp",
  "gerbang-bubat.webp", "gerbang-kalapa.webp", "gerbang-keta.webp", "gerbang-pakuan.webp", "gerbang-penyatuan.webp",
  "gerbang-sadeng.webp", "hutan-tarik.webp", "jalan-kalapa.webp", "jalan-menuju-kalapa.webp", "jalan-pakuan.webp",
  "jalan-pesisir.webp", "jalan-tuban.webp", "jalur-hutan-timur.webp", "jalur-menuju-bubat.webp", "jalur-pegunungan.webp",
  "jalur-pesisir-sunda.webp", "jalur-sungai-brantas.webp", "kabuyutan-sunda.webp", "lapangan-bubat.webp", "laut-nusantara.webp",
  "muara-ciliwung.webp", "muara-sunda-kalapa.webp", "pasar-pakuan.webp", "pasar-trowulan.webp", "pelabuhan-tuban.webp",
  "pelataran-pakuan.webp", "perkemahan-tarik.webp", "pertapaan-kamalasana.webp", "pos-perbatasan.webp", "puri-trowulan.webp",
  "ruang-arsip-pakuan.webp", "ruang-naskah-pakuan.webp", "serambi-istana.webp",
].map((fileName) => ({ fileName, url: `/story-mode/scenes/${fileName}` }));

export const STORY_PUBLIC_SOUNDTRACKS = [
  { title: "Amukti Palapa", url: "/story-mode/audio/amukti-palapa.mp3" },
  { title: "Epic Nusantara", url: "/story-mode/audio/epic-nusantara.mp3" },
  { title: "Gamelan Melody", url: "/story-mode/audio/gamelan-melody.wav" },
  { title: "Seruling Sunda", url: "/story-mode/audio/seruling-sunda.wav" },
  { title: "Sundanese Gamelan Flute", url: "/story-mode/audio/sundanese-gamelan-flute.mp3" },
  { title: "The Glory of Majapahit", url: "/story-mode/audio/the-glory-of-majapahit.mp3" },
];
