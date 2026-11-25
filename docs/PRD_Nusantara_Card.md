# Product Requirements Document (PRD)

## Nusantara Card

**Versi:** 2.0 — revisi konsep battle card  
**Status:** Draft aturan untuk divalidasi melalui purwarupa  
**Jenis produk:** Game kartu digital bertema budaya dan sejarah Indonesia  
**Platform MVP:** Web responsif; dapat dikembangkan ke Android/iOS  
**Mode MVP:** Pemain melawan bot  
**Target pengguna:** Pemain umum, termasuk Gen Z dan Gen Alpha  
**Kategori lomba utama:** Pembelajaran dan Edukasi Digital Berbasis Budaya  
**Kategori pendukung:** Solusi Digital untuk Industri Budaya

---

## 1. Ringkasan Produk

**Nusantara Card** adalah game battle card digital yang mengangkat tokoh dan konteks sejarah kerajaan Majapahit dan Pajajaran. Pemain menyusun deck berisi kartu **Karakter** dan **Instrumen**, lalu bertarung menggunakan karakter di board. Instrumen memiliki efek berbeda terhadap karakter tertentu dan hanya diketahui pemilik sampai dimainkan.

Setiap pemain memulai dengan lima karakter di board dan karakter lain sebagai cadangan. Pemain menyerang maksimal satu kali pada gilirannya. Attack karakter penyerang dibandingkan dengan Defence target. Hasilnya dapat menggugurkan target, menghasilkan seri, atau memicu serangan balik otomatis. Pemain kalah ketika seluruh karakter miliknya gugur.

MVP menggunakan lawan bot. Informasi dan visual kartu berfokus pada Majapahit dan Pajajaran, dengan asal kerajaan, konteks, sumber, dan kredit yang dicantumkan pada detail kartu. Materi awal dapat memakai rujukan sejarah yang tersedia; proses kurasi sistem tidak menggantikan pemeriksaan manusia sebelum konten dipublikasikan.

---

## 2. Visi dan Nilai Produk

> Membuat sejarah dan budaya Indonesia lebih interaktif melalui game kartu strategi yang mengajak pemain mengenali tokoh, peran, benda, dan hubungan budaya di balik setiap kartu.

Nusantara Card menggunakan format duel kartu yang mudah dipahami, tetapi setiap kartu tetap perlu memiliki konteks sejarah. Budaya bukan sekadar dekorasi visual atau atribut tempur: detail kartu, kombinasi efek, dan informasi pendamping harus membantu pemain memahami latar yang diangkat.

---

## 3. Tujuan dan Ukuran Keberhasilan

### Tujuan

1. Membuat purwarupa game kartu yang bisa dimainkan dan didemokan.
2. Membuat pemain baru memahami aturan inti melalui tutorial.
3. Menjadikan karakter, peran, instrumen, dan latar sejarah sebagai bagian dari identitas serta strategi kartu.
4. Menyediakan detail budaya yang memiliki sumber, konteks, dan kredit.
5. Menyiapkan cara pengembangan konten dan aset yang dapat ditinjau sebelum dipakai secara komersial.

### Ukuran keberhasilan MVP

| Ukuran | Target awal untuk uji purwarupa |
|---|---:|
| Pemain uji menyelesaikan tutorial tanpa bantuan | ≥80% |
| Pemain uji memahami kondisi menang/kalah | ≥80% |
| Median waktu duel melawan bot | 5–8 menit |
| Pemain uji dapat menyebutkan satu informasi dari kartu setelah bermain | ≥70% |
| Kartu demo memiliki sumber, status verifikasi, dan kredit/aset | 100% |
| Bug blocker yang diketahui saat demo | 0 |

Angka tersebut adalah target uji, bukan hasil yang sudah dicapai. Jumlah responden, perangkat, dan hasil uji perlu dicatat saat pengujian dilakukan.

---

## 4. Pengguna Sasaran

### Pemain umum

Pemain yang menginginkan game strategi singkat, mudah dipelajari, memiliki koleksi kartu, dan dapat dimainkan di ponsel atau browser. Pemain tidak diwajibkan memiliki pengetahuan sejarah sebelumnya.

### Pemain muda

Gen Z dan Gen Alpha yang tertarik pada permainan kompetitif, visual karakter, misi, progres, dan koleksi. Antarmuka harus mudah dipahami tanpa mengasumsikan pemain sudah mengenal istilah sejarah.

### Pengguna edukasi sekunder

Guru, fasilitator, komunitas belajar, museum, atau keluarga yang dapat menggunakan kartu dan detailnya sebagai titik awal untuk membahas sejarah.

---

## 5. Ruang Lingkup Budaya dan Kurasi

### Tema MVP

- Kerajaan Majapahit.
- Kerajaan Pajajaran.
- Materi sejarah Jawa yang relevan dari wilayah barat, tengah, dan timur sebagai konteks pendukung, selama hubungan dengan kartu dinyatakan jelas.
- Fokus awal tetap pada Majapahit dan Pajajaran agar cakupan MVP tidak terlalu luas.

### Pembedaan konteks sejarah

Setiap kartu harus menyebutkan kerajaan atau latar yang dikaitkan dengannya. Tokoh Majapahit tidak boleh diberi gelar, atribut, instrumen, pakaian, atau lokasi Pajajaran tanpa alasan historis yang dicatat. Jika sebuah detail belum dapat dipastikan, kartu harus menandainya sebagai **interpretasi visual** atau **belum terverifikasi**, bukan fakta.

### Kurasi

Untuk purwarupa, materi dapat disusun oleh tim menggunakan sumber sejarah yang dicatat pada setiap kartu. Sistem boleh membantu menata metadata, memeriksa kelengkapan, atau memberi tanda untuk ditinjau, tetapi tidak boleh dianggap sebagai satu-satunya pemberi persetujuan fakta. Sebelum rilis publik atau komersial, konten perlu diperiksa oleh orang yang kompeten terhadap sumber dan konteksnya.

### Sensitivitas dan atribusi

- Hindari klaim sensasional yang tidak didukung sumber.
- Jangan memasukkan materi yang sakral, terbatas, atau memiliki batas penggunaan tanpa izin dan arahan yang sesuai.
- Cantumkan kredit kontributor, sumber, dan batas pemakaian aset.
- Sediakan mekanisme koreksi dan penarikan kartu.

---

## 6. Prinsip Produk

1. **Gameplay mudah dipahami:** tutorial mengajarkan istilah dan tindakan melalui permainan.
2. **Kartu berakar pada konteks:** detail karakter dan instrumen punya asal atau alasan desain yang dicatat.
3. **Perbedaan kerajaan terlihat:** kartu diberi penanda kerajaan/latar yang konsisten.
4. **Fairness:** pembelian tidak memberi keunggulan kompetitif langsung.
5. **Aman untuk pemain muda:** MVP tidak menyediakan chat bebas atau komunikasi terbuka antarpemain.
6. **Transparansi aset:** asal, lisensi, dan kredit visual/audio dilacak.
7. **Konten dapat dikoreksi:** informasi dan aset dapat diperbarui atau ditarik tanpa menghapus riwayat perubahan.

---

## 7. Kartu dan Deck

### Dua jenis kartu

1. **Karakter** — kartu yang berada di board, memiliki Attack, Defence, kerajaan/latar, dan golongan/peran.
2. **Instrumen** — kartu efek sekali pakai yang disimpan di tangan secara rahasia sampai dimainkan. Instrumen dapat mengubah Attack/Defence atau memberi efek serangan/pertahanan.

### Golongan/peran karakter

Golongan awal yang akan digunakan sebagai kategori gameplay:

- Pemimpin
- Prajurit
- Pemuka
- Perajin
- Utusan

Golongan adalah kategori mekanik dan label naratif untuk rancangan kartu. Nama dan penerapannya pada tokoh sejarah tertentu harus diverifikasi agar tidak disajikan sebagai klasifikasi sosial yang pasti jika sumber tidak mendukungnya.

### Susunan deck

- Setiap pemain menyusun deck sendiri.
- Deck memiliki **maksimal 20 kartu total**.
- Deck wajib memiliki **minimal 10 kartu Karakter** dan maksimal 10 kartu Karakter.
- Deck boleh memiliki 0–10 kartu Instrumen, dengan batas total 20 kartu.
- Contoh deck yang valid: 10 Karakter + 5 Instrumen = 15 kartu.
- Contoh deck maksimum: 10 Karakter + 10 Instrumen = 20 kartu.
- Deck MVP tidak menerapkan batas salinan per kartu sampai jumlah dan desain kartu final ditetapkan.
- Sistem memvalidasi jumlah dan komposisi deck sebelum pertandingan.

### Data wajib kartu Karakter

- ID dan nama kartu.
- Kerajaan/latar: Majapahit, Pajajaran, atau konteks pendukung yang dinyatakan jelas.
- Golongan/peran.
- Nilai Attack dan Defence awal.
- Teks efek jika ada.
- Ringkasan konteks sejarah dan sumber.
- Status fakta: terverifikasi, interpretasi visual, atau perlu pemeriksaan.
- Aset ilustrasi, pembuat/pemegang hak, lisensi, kredit, dan status izin.

### Data wajib kartu Instrumen

- ID dan nama kartu.
- Kerajaan/latar atau konteks yang relevan.
- Biaya atau syarat penggunaan jika kelak ditetapkan.
- Efek dan durasi yang jelas.
- Jenis kelamin/peran/karakter yang menjadi sasaran bila ada syarat target.
- Ringkasan konteks, sumber, dan status verifikasi.
- Aset ilustrasi/audio, pembuat/pemegang hak, lisensi, kredit, dan status izin.

**Catatan desain:** rancangan gender kartu Karakter dan syarat Instrumen terhadap gender masih perlu diputuskan pada tahap desain set kartu. Jika digunakan, kategori awal dapat ditulis sebagai **laki-laki** dan **perempuan** dengan cara yang konsisten dan relevan terhadap sumber serta mekanik.

---

## 8. Aturan Permainan MVP

Aturan berikut menggabungkan keputusan yang telah ditetapkan dan beberapa default untuk membuat purwarupa dapat dimainkan. Nilai angka serta timing efek perlu diuji dan diseimbangkan.

### 8.1 Tujuan dan kondisi menang

- Setiap pemain berusaha mengalahkan seluruh karakter lawan.
- Pemain kalah ketika seluruh karakter miliknya gugur, baik yang berada di board maupun yang masih menjadi cadangan di deck Karakter.
- Pemain menang ketika lawannya tidak memiliki karakter aktif atau cadangan yang dapat dimainkan.
- Pemain dapat menyerah melalui tindakan konfirmasi; lawan menang.

### 8.2 Persiapan pertandingan

1. Kedua pemain menggunakan deck valid masing-masing.
2. Deck Karakter dan Instrumen dikocok terpisah.
3. Setiap pemain mengambil acak **5 Karakter** dari deck Karakter dan menempatkannya tertutup atau terbuka di board sesuai keputusan UI final. Lima karakter tersebut menjadi karakter awal.
4. Karakter Karakter yang tersisa menjadi deck cadangan. Pemain tidak mengetahui urutan kartu karakter cadangan.
5. Deck Instrumen dikocok terpisah dan tangan Instrumen dimulai sesuai aturan pembuka yang ditetapkan untuk purwarupa.
6. Pemain awal dipilih acak.

**Catatan komposisi:** karena minimal deck adalah 10 Karakter, jumlah karakter awal selalu lima dan jumlah cadangan minimal lima.

### 8.3 Board

- Board setiap pemain memiliki maksimal **5 slot karakter**.
- Hanya kartu Karakter yang ditempatkan di board.
- Kartu Instrumen tidak diletakkan terbuka di board; kartu di tangan bersifat rahasia dari lawan.
- Jika karakter di board gugur dan masih ada karakter cadangan, satu karakter otomatis ditarik secara acak dari deck Karakter dan ditempatkan di slot kosong.
- Pemain tidak memilih karakter pengganti; identitas kartu berikutnya tidak diketahui sampai ditarik.
- Jika tidak ada karakter cadangan, slot tetap kosong. Pemain kalah ketika tidak memiliki karakter aktif maupun cadangan.

### 8.4 Tangan Instrumen dan pengambilan kartu

- Pada awal giliran aktif pemain, pemain menarik **1 Instrumen** dari deck Instrumen.
- Maksimum tangan adalah **6 kartu Instrumen**.
- Jika pengambilan membuat jumlah tangan melebihi 6, pemain wajib memilih dan membuang 1 Instrumen sehingga tangan kembali menjadi 6.
- Lawan tidak dapat melihat isi tangan Instrumen sampai sebuah kartu dimainkan.
- Jika deck Instrumen habis, tumpukan buang dikocok dan menjadi deck Instrumen baru.
- Jika deck dan tumpukan buang sama-sama kosong, pemain tidak menarik Instrumen pada giliran tersebut.

### 8.5 Giliran, serangan, dan pertahanan

Giliran pemain aktif berjalan sebagai berikut:

1. **Awal giliran:** tarik satu Instrumen dan selesaikan aturan batas tangan.
2. **Pilihan Instrumen:** pemain aktif boleh memainkan Instrumen yang legal atau menyimpannya.
3. **Pilihan serangan:** pemain aktif boleh memilih satu karakter miliknya untuk menyerang satu karakter lawan, atau memilih tidak menyerang.
4. **Jendela bertahan:** pemain bertahan boleh memainkan Instrumen yang legal atau tidak menggunakan Instrumen.
5. **Resolusi:** bandingkan nilai Attack dan Defence serta selesaikan serangan balik bila berlaku.
6. **Akhir giliran:** efek Instrumen sementara yang berlaku pada giliran tersebut berakhir; Instrumen sekali pakai yang dimainkan masuk ke tumpukan buang.
7. Giliran berpindah ke pemain lain.

- Pemain hanya boleh melakukan **maksimal satu serangan pada satu giliran aktif**.
- Instrumen boleh digunakan oleh pemain aktif saat menyiapkan serangan, dan oleh pemain bertahan pada jendela bertahan.
- Efek Instrumen yang menyebut durasi satu giliran berakhir pada akhir giliran aktif yang sedang diselesaikan. Efek pertahanan harus bertahan cukup lama untuk menyelesaikan serangan yang memicunya.
- Satu serangan memiliki maksimal satu kartu Instrumen dari penyerang dan satu kartu Instrumen dari pihak bertahan pada purwarupa awal. Batas ini adalah aturan keseimbangan awal dan dapat diubah lewat uji bermain.

### 8.6 Resolusi serangan

Misalkan karakter A menyerang karakter B:

1. Terapkan efek Instrumen legal yang dimainkan untuk serangan tersebut.
2. Bandingkan **Attack A** dengan **Defence B**.
3. Jika Attack A lebih tinggi dari Defence B, karakter B gugur.
4. Jika Attack A sama dengan Defence B, hasilnya seri: tidak ada karakter yang gugur.
5. Jika Attack A lebih rendah dari Defence B, serangan gagal dan karakter B melakukan **serangan balik otomatis** kepada A.
6. Untuk serangan balik, bandingkan **Attack B** dengan **Defence A** setelah efek yang relevan diterapkan:
   - Attack B lebih tinggi: karakter A gugur.
   - Attack B sama dengan Defence A: seri, tidak ada karakter yang gugur.
   - Attack B lebih rendah: serangan balik gagal, tidak ada karakter yang gugur.
7. Setelah karakter gugur, karakter itu masuk ke **Graveyard**. Jika pemiliknya masih memiliki karakter cadangan, sistem otomatis menarik dan menempatkan satu karakter baru di board.
8. Efek yang sudah diselesaikan tidak diulang kecuali teks kartu secara eksplisit menyatakan demikian.

### 8.7 Instrumen

- Instrumen adalah kartu sekali pakai.
- Efeknya dapat menaikkan/menurunkan Attack atau Defence, memberi efek serangan, memberi efek pertahanan, atau memberi efek khusus sesuai teks kartu.
- Efek hanya berlaku untuk karakter dan jendela waktu yang disebutkan.
- Instrumen dapat memiliki syarat target, termasuk kerajaan, golongan, karakter, atau jenis kelamin, jika hubungan tersebut dirancang dan diverifikasi.
- Setelah efek selesai, Instrumen masuk tumpukan buang.
- Tidak ada efek yang bertahan permanen kecuali ditulis eksplisit pada kartu; aturan umum MVP menyatakan efek sementara berakhir di akhir giliran.
- Teks kartu tidak boleh bertentangan dengan kondisi menang atau menghapus seluruh deck karakter lawan secara langsung pada set awal.

### 8.8 Graveyard dan penggantian karakter

- Karakter yang gugur dipindahkan ke Graveyard dan tidak kembali ke board pada pertandingan yang sama kecuali kartu secara eksplisit mengatur sebaliknya.
- Penggantian karakter dilakukan otomatis dari deck cadangan setelah karakter gugur.
- Bila dua karakter gugur akibat efek resolusi yang sama, kedua kartu masuk Graveyard terlebih dahulu, lalu setiap pemain mengisi slot kosong secara berurutan selama masih memiliki cadangan.
- Bila seorang pemain kehilangan seluruh karakter dan tidak memiliki cadangan, pertandingan selesai.

### 8.9 Urutan efek dan situasi khusus

- Teks efek spesifik kartu mengalahkan aturan umum selama efek tersebut tidak melanggar kondisi menang.
- Efek yang dimainkan pemain aktif diselesaikan dahulu, lalu efek pemain bertahan, kecuali teks kartu mengatur urutan lain.
- Jika beberapa efek pada pihak yang sama aktif bersamaan, pemilik kartu memilih urutan penyelesaian.
- Nilai Attack dan Defence tidak dapat turun di bawah 0.
- Perubahan nilai hanya berlaku selama durasi efek dan kemudian kembali ke nilai dasar.
- Jika target menjadi tidak valid sebelum efek diselesaikan, efek target tersebut tidak berjalan; kartu tetap masuk tumpukan buang kecuali teks kartu menyatakan lain.
- Pemain tidak dapat menyerang karakter yang tidak berada di board.

---

## 9. Mekanik yang Masih Menunggu Desain Set Kartu

Hal berikut tidak menghalangi penulisan PRD, tetapi harus ditetapkan saat mendesain kartu dan sebelum uji keseimbangan:

1. Nilai Attack/Defence dasar tiap karakter.
2. Daftar karakter dan instrumen dalam set awal.
3. Apakah deck boleh memiliki beberapa salinan kartu yang sama; batas salinan final.
4. Apakah kartu Karakter memiliki efek khusus selain Attack/Defence dan golongan.
5. Daftar gender karakter dan aturan penggunaannya pada efek Instrumen.
6. Biaya atau syarat memainkan Instrumen, jika diperlukan untuk keseimbangan.
7. Aturan pembuka tangan Instrumen: apakah pemain memulai dengan 0 atau sejumlah kartu tertentu.
8. Apakah karakter yang baru ditarik boleh langsung menjadi target serangan balik pada resolusi yang sama. Default MVP: tidak; penggantian dilakukan setelah resolusi serangan selesai.
9. Apakah kedua pemain boleh memainkan Instrumen lebih dari satu kali pada satu pertukaran serangan. Default MVP: maksimal satu per pihak per serangan.

Setiap usulan kartu dan angka akan ditinjau bersama pengguna sebelum menjadi set final.

---

## 10. Kebutuhan Fungsional

### Deck dan koleksi

- **FR-01:** Pemain dapat melihat koleksi kartu Karakter dan Instrumen.
- **FR-02:** Pemain dapat membuat deck sendiri hingga 20 kartu.
- **FR-03:** Sistem menolak deck dengan kurang dari 10 atau lebih dari 10 Karakter, lebih dari 10 Instrumen, atau lebih dari 20 kartu total.
- **FR-04:** Contoh deck 10 Karakter + 5 Instrumen dapat disimpan dan digunakan.
- **FR-05:** Deck Karakter dan Instrumen dikocok dan dikelola secara terpisah.

### Pertandingan

- **FR-06:** Pemain dapat memainkan tutorial dan pertandingan melawan bot.
- **FR-07:** Sistem memilih lima karakter awal secara acak dari deck Karakter.
- **FR-08:** Sistem menyimpan karakter sisanya sebagai cadangan tersembunyi.
- **FR-09:** Sistem otomatis mengganti karakter yang gugur dengan karakter cadangan acak.
- **FR-10:** Sistem membatasi serangan maksimal satu kali per giliran aktif.
- **FR-11:** Sistem menyediakan jendela penggunaan Instrumen untuk penyerang dan pihak bertahan.
- **FR-12:** Sistem menghitung serangan utama, seri, serangan balik, gugur, dan kemenangan sesuai aturan.
- **FR-13:** Tangan Instrumen tidak ditampilkan kepada lawan.
- **FR-14:** Sistem menarik satu Instrumen tiap awal giliran, menerapkan batas tangan 6, dan mengocok ulang tumpukan buang jika deck Instrumen habis.
- **FR-15:** Sistem menampilkan log pertempuran agar perubahan Attack/Defence dan hasil duel dapat dipahami.

### Budaya dan aset

- **FR-16:** Halaman detail kartu menampilkan kerajaan/latar, golongan, ringkasan konteks, sumber, dan status verifikasi.
- **FR-17:** Halaman aset internal mencatat pembuat/pemegang hak, lisensi, izin, kredit, dan status penggunaan.
- **FR-18:** Pemain dapat melaporkan informasi kartu yang perlu dikoreksi.
- **FR-19:** Admin dapat menandai, memperbarui, menyembunyikan, atau menarik kartu.

### Pengalaman pengguna

- **FR-20:** Tutorial menjelaskan board, giliran, instrumen tersembunyi, menyerang, bertahan, seri, serangan balik, Graveyard, dan kondisi menang.
- **FR-21:** Efek kartu dapat dibaca sebelum dimainkan dan sebelum tindakan dikonfirmasi.
- **FR-22:** Pemain dapat menonaktifkan musik, suara, animasi, dan getaran.
- **FR-23:** Antarmuka responsif untuk layar ponsel dan desktop.

---

## 11. Kebutuhan Nonfungsional

- **NFR-01 Kinerja:** tindakan lokal dan perubahan state tampil responsif pada perangkat uji sasaran.
- **NFR-02 Ketepatan aturan:** mesin permainan menjadi sumber kebenaran untuk legalitas tindakan, urutan efek, stat, dan hasil pertandingan.
- **NFR-03 Koneksi:** tutorial dan bot sebaiknya dapat dimainkan dengan koneksi terbatas setelah aset inti termuat.
- **NFR-04 Privasi:** kumpulkan data sesedikit mungkin; MVP tidak memerlukan chat atau data lokasi.
- **NFR-05 Keamanan:** bila mode online ditambahkan, validasi state dilakukan di server dan bukan hanya pada klien.
- **NFR-06 Aksesibilitas:** teks efek mudah dibaca; informasi tidak disampaikan melalui warna saja; tersedia pengaturan gerak dan suara.
- **NFR-07 Audit konten:** perubahan informasi kartu, status lisensi, dan sumber dapat dilacak.

---

## 12. Monetisasi dan Keberlanjutan

### Konsep awal yang diusulkan

Pemain dapat membeli **deck awal** menggunakan payment gateway dalam lingkungan **dummy/sandbox** untuk demo. Untuk purwarupa lomba:

- Pembayaran harus jelas berstatus simulasi dan tidak memproses uang sungguhan.
- Deck yang dibeli/didapat berisi kartu dengan daftar isi yang diketahui; tidak menggunakan mekanik acak berbayar.
- Deck berbayar tidak boleh memberi keunggulan kompetitif yang tidak dapat dicapai pemain lain melalui progres yang wajar.
- Pembelian tidak diaktifkan untuk transaksi nyata sebelum model bisnis, harga, hak konten, dan pembagian manfaat ditinjau.

Potensi lanjutan: deck tematik, paket edukasi, lisensi untuk sekolah/museum, atau kemitraan dengan komunitas. Setiap penggunaan aset komersial harus memiliki izin dan kredit yang sesuai.

---

## 13. Rencana Aset Visual dan Audio

Setiap batch pembuatan kartu harus mengelola aset dengan asal-usul dan hak penggunaan yang jelas.

### Pilihan sumber aset

1. **Dibuat sendiri atau dibuat khusus:** ilustrasi dan audio dipesan/dibuat untuk game; simpan nama kreator, perjanjian, hak penggunaan, dan kredit.
2. **Aset berlisensi:** gunakan aset dengan lisensi yang mengizinkan penggunaan game dan, bila direncanakan, penggunaan komersial. Simpan URL/sumber, salinan lisensi, atribusi, dan batas penggunaan.
3. **Kontribusi mitra/komunitas:** simpan pemberi aset, izin tertulis, batas penggunaan, kredit yang diminta, dan kompensasi/perjanjian bila ada.
4. **Aset sementara untuk mockup:** labeli jelas sebagai placeholder; jangan dipakai pada rilis atau demo publik tanpa izin yang sesuai.

### Metadata aset wajib

- Asset ID dan kartu terkait.
- Jenis aset: ilustrasi, ikon, tekstur, audio, atau efek suara.
- Pembuat dan pemegang hak.
- Asal/sumber dan tanggal diperoleh.
- Lisensi atau izin penggunaan.
- Apakah penggunaan komersial diperbolehkan.
- Teks kredit yang harus ditampilkan.
- Status: placeholder, perlu izin, disetujui, atau ditarik.

### Arah visual awal

Ilustrasi dapat memakai gaya fantasi historis yang terinspirasi periode, tetapi detail kostum dan benda spesifik harus diberi label apakah berbasis sumber atau interpretasi. Hindari menyajikan hasil generatif sebagai rekonstruksi sejarah yang pasti. Rencana batch kartu akan menentukan kartu mana yang membutuhkan riset referensi dan aset audio.

---

## 14. Arsitektur Produk Awal

- **Klien:** web responsif menggunakan React/Next.js atau Flutter Web.
- **Mesin aturan:** modul terpisah untuk state deck, board, giliran, penggunaan Instrumen, serangan, serangan balik, Graveyard, dan kondisi menang.
- **Bot:** AI sederhana yang memilih tindakan legal berdasarkan Attack/Defence, Instrumen di tangan, dan risiko kehilangan karakter.
- **Backend:** katalog kartu, progres, penyimpanan deck, dan konfigurasi konten.
- **Database:** kartu, sumber, aset, lisensi, deck, pertandingan, dan log perubahan.
- **Admin:** alat sederhana untuk mengelola kartu serta status verifikasi dan aset.
- **Payment demo:** integrasi gateway dummy/sandbox saja sampai fitur transaksi nyata disetujui dan diuji.

---

## 15. Tahap Pengembangan

### Tahap 1 — Konfirmasi aturan dan set awal

- Finalisasi komposisi deck dan alur pertandingan.
- Susun daftar awal karakter/instrumen untuk tema Majapahit dan Pajajaran.
- Tetapkan daftar sumber dan status setiap informasi.
- Tetapkan arah aset dan catatan izin.

### Tahap 2 — Prototipe mekanik

- Buat mesin aturan dengan kartu placeholder.
- Implementasikan deck, board, draw, batas tangan, satu serangan, jendela bertahan, counterattack, Graveyard, dan kondisi menang.
- Uji semua hasil serangan termasuk nilai lebih tinggi, sama, dan lebih rendah.

### Tahap 3 — MVP yang dapat dimainkan

- Tambahkan bot, tutorial, UI kartu, detail budaya, log pertempuran, dan deck builder.
- Isi set awal dengan kartu yang informasinya memiliki sumber.
- Gunakan aset yang dibuat sendiri/berlisensi/disetujui; aset placeholder diberi label.

### Tahap 4 — Uji dan demo lomba

- Uji dengan pemain yang belum pernah melihat aturan.
- Catat durasi, salah paham, deck yang dominan, serta bug.
- Tampilkan demo pertandingan dan satu detail kartu beserta sumber/kreditnya.
- Tampilkan rencana keberlanjutan dan payment dummy sebagai simulasi, bukan pembayaran nyata.

---

## 16. Kriteria Penerimaan MVP

MVP siap untuk demo jika:

1. Pemain dapat menyusun deck valid dengan 10 Karakter dan sampai 10 Instrumen, maksimal 20 kartu total.
2. Sistem mengocok deck Karakter dan Instrumen secara terpisah.
3. Lima karakter awal dipilih acak; urutan karakter cadangan tidak terlihat pemain.
4. Kartu Instrumen pemain tidak terlihat oleh bot/pemain lawan sampai digunakan.
5. Sistem menarik Instrumen di awal giliran dan menerapkan batas tangan enam kartu.
6. Setiap pemain hanya dapat menyerang satu kali per giliran aktif.
7. Pemain aktif dan pemain bertahan dapat memakai Instrumen pada jendela masing-masing.
8. Serangan lebih tinggi menggugurkan target; nilai sama menghasilkan seri; serangan lebih rendah memicu serangan balik otomatis.
9. Serangan balik dihitung dengan membandingkan Attack karakter yang membalas terhadap Defence penyerang.
10. Karakter gugur masuk Graveyard dan otomatis diganti karakter cadangan jika tersedia.
11. Kalah terjadi ketika seluruh karakter seorang pemain gugur.
12. Tumpukan buang Instrumen dikocok kembali saat deck Instrumen habis.
13. Efek sementara Instrumen berakhir sesuai durasi dan tidak tertinggal ke giliran berikutnya.
14. Kartu demo memiliki latar, sumber, status verifikasi, dan metadata aset/kredit.
15. Mode bot dapat dimainkan hingga ada pemenang; tutorial dapat dibuka ulang.
16. Tidak ada bug blocker yang diketahui dalam alur demo.

---

## 17. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Materi sejarah salah atau tercampur antar kerajaan/periode | Cantumkan latar dan sumber per kartu; tandai interpretasi; minta pemeriksaan sebelum publikasi luas |
| Kartu gender/peran menjadi stereotip atau tidak berdasar | Jadikan syarat efek sebagai pilihan desain yang ditinjau, bukan klaim sejarah; uji apakah mekanik tetap menyenangkan tanpa syarat gender |
| Attack lebih rendah memicu counterattack yang terasa menghukum | Uji nilai dasar, efek pertahanan, dan durasi; tunjukkan hasil perhitungan dengan jelas |
| Tangan Instrumen tersembunyi menciptakan kebingungan | Jelaskan jendela respons dan tampilkan log setelah efek dipakai |
| Variasi deck terlalu sedikit pada set awal | Uji jumlah Instrumen, komposisi deck, dan duplikasi kartu sebelum menambah set |
| Aset visual/audio tidak memiliki izin jelas | Lacak metadata, lisensi, kredit, dan batas komersial sebelum aset dipakai publik |
| Pembelian memberi efek pay-to-win atau menimbulkan kebingungan | Gunakan gateway dummy/sandbox untuk demo; deck berisi daftar kartu transparan dan tidak memberi keunggulan eksklusif |
| Bot terlalu mudah atau sulit | Mulai dengan strategi legal sederhana, ukur hasil playtest, lalu sesuaikan |
| Perluasan tema terlalu cepat | Batasi MVP pada Majapahit dan Pajajaran; tambahkan wilayah/tema setelah kurasi dan mekanik stabil |

---

## 18. Pertanyaan Terbuka untuk Tahap Desain Kartu

Keputusan berikut dapat dibuat saat menyusun batch kartu, tidak menghalangi PRD ini:

1. Nilai Attack dan Defence dasar per karakter.
2. Daftar 10 karakter awal dan pembagian latar Majapahit/Pajajaran.
3. Daftar 10 Instrumen awal dan efek spesifiknya.
4. Penerapan jenis kelamin karakter sebagai syarat efek atau hanya metadata.
5. Batas salinan kartu yang sama dalam satu deck.
6. Jumlah awal Instrumen di tangan sebelum giliran pertama.
7. Batas tepat Instrumen per pihak dalam satu pertukaran serangan; default purwarupa satu per pihak.
8. Pilihan gaya visual final dan pembagian aset buatan sendiri, berlisensi, kontribusi mitra, serta placeholder.

---

## 19. Ringkasan Pitch Lomba

**Nusantara Card** adalah game battle card digital bertema Majapahit dan Pajajaran. Pemain merancang deck Karakter dan Instrumen, menempatkan lima karakter acak di board, lalu menggunakan strategi serangan, pertahanan, dan serangan balik untuk mengalahkan seluruh karakter lawan. Instrumen disimpan sebagai kartu rahasia dan memiliki efek sementara. Setiap kartu menyertakan latar, sumber, dan informasi asetnya. MVP berfokus pada duel melawan bot dan menyiapkan jalur pengembangan konten serta aset yang lebih bertanggung jawab.
