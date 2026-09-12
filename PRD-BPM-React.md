# PRD — TÜV NORD Indonesia Business Process Map (React + Tailwind)

**Versi:** 1.0 · **Tanggal:** 12 September 2026 · **Status:** Draft untuk dibangun
**Pemilik produk:** Digital Transformation, PT TÜV NORD Indonesia
**Basis:** Prototipe HTML `TUVNI_Business_Process_Map_L0_L1.html` (Level 0 Rev.02 + Level 1 Rev.01) dan Struktur Organisasi No. 001/TNI/HRD/IX/2026

---

## 1. Ringkasan

Aplikasi web satu halaman untuk menampilkan peta proses bisnis TÜV NORD Indonesia dalam dua tingkat kedalaman yang saling terhubung:

- **Level 0** — satu peta besar berisi seluruh proses perusahaan: pihak eksternal, kelompok strategi, governance, core business process (value chain + 4 lajur profit center), dan corporate support. Setiap tahapan bisa diklik untuk melihat unit yang terlibat beserta peran RASCI-nya.
- **Level 1** — 20 swimlane end-to-end (M1–M4, G1–G3, C1–C5, S1–S5) berisi langkah bernomor, pelaksana, keputusan, dan output.

Nilai utama produk ada pada **tautan dua arah antar level**: dari satu langkah di Level 0 pengguna bisa melompat ke langkah persisnya di swimlane Level 1, dan sebaliknya, tanpa kehilangan konteks.

Prototipe HTML sudah membuktikan logika dan datanya. Pekerjaan ini adalah porting ke React + Tailwind agar bisa dipelihara, dideploy, dan nantinya diperluas (versioning proses, komentar reviewer, ekspor).

## 2. Masalah yang dipecahkan

| Masalah hari ini | Dampak |
|---|---|
| Peta proses tersebar di PDF, FigJam, dan slide, tidak sinkron dengan struktur organisasi terbaru | Saat asesmen KAN atau audit internal, tidak ada satu sumber rujukan |
| Tugas dan tanggung jawab hanya berupa narasi di dokumen terpisah | Sulit menjawab "siapa yang bertanggung jawab atas langkah ini" |
| Keterkaitan antar unit tidak terlihat | Handoff antar departemen menjadi titik kegagalan yang berulang |
| Peta statis tidak bisa dirinci | Level 0 terlalu kasar untuk kerja harian, dokumen SOP terlalu detail untuk manajemen |

## 3. Pengguna dan skenario

| Pengguna | Skenario utama |
|---|---|
| Direksi dan HoD | Membuka Level 0 di layar rapat, mengklik satu tahapan untuk melihat unit yang terlibat |
| Pemilik proses | Membuka swimlane Level 1 miliknya, memvalidasi urutan langkah dan pelaksana |
| Corporate Management System | Menelusuri titik kontrol akreditasi: contract review, tinjauan independen, CAPA |
| Karyawan baru | Memahami posisi pekerjaannya dalam alur perusahaan |
| Auditor internal dan asesor | Menelusuri satu proses dari pemicu sampai rekaman output |

**Perangkat:** mayoritas desktop (1440–1920px) dan layar rapat (1920px+). Mobile dipakai untuk membaca sekilas, bukan menelaah peta besar.

## 4. Ruang lingkup

**Termasuk (v1)**
- Rendering Level 0 dan Level 1 dari data statis
- Mode fokus RASCI di Level 0
- Matriks keterlibatan (5 tab) dan katalog tugas & tanggung jawab
- Navigasi dua arah antar level dengan konteks asal
- Deep link ke tahapan, unit, dan proses
- Cetak / simpan PDF A3 landscape
- Responsif sampai mobile, aksesibel keyboard, hormati `prefers-reduced-motion`

**Tidak termasuk (v1)**
- Autentikasi dan otorisasi
- Editor proses berbasis UI, komentar, atau approval workflow
- Backend, database, dan API — data berupa file statis di repo
- Ekspor ke Visio, BPMN XML, atau Excel
- Multi-bahasa; UI dan konten dalam bahasa Indonesia

**Kandidat v2**
Mode reviewer (komentar per langkah), riwayat revisi, ekspor XLSX matriks RASCI, Level 2 (prosedur detail per langkah), integrasi ke DevDocs Hub.

## 5. Tech stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | React 19 + Vite + TypeScript strict | SPA statis, tidak perlu SSR; build cepat |
| Styling | Tailwind CSS v4 | Sudah jadi standar internal; token via `@theme` |
| Routing | React Router v7 (`createBrowserRouter`) | Deep link ke `/level-0`, `/level-1/:processId` |
| Animasi | `motion` (Framer Motion 12) | Butuh layout animation dan orkestrasi, bukan sekadar hover |
| State | React state + Context tipis; Zustand bila terasa perlu | Volume state kecil dan lokal |
| Ikon | lucide-react | Konsisten dengan stack internal |
| Data | File JSON + TypeScript types di `src/data` | Tanpa backend; bisa di-diff di Git |
| Deploy | Static hosting internal | Output `vite build` berupa file statis |

**Catatan:** Next.js sengaja tidak dipakai. Tidak ada kebutuhan SSR, SEO, atau route API, dan seluruh interaksinya di sisi klien. Jika nanti perlu digabung ke portal internal berbasis Next.js, komponennya bisa dipindah karena tidak ada dependensi khusus Vite.

## 6. Model data

Data hasil ekstraksi prototipe tersedia di `data/` (lihat lampiran). **Jangan mengetik ulang isinya** — sudah tervalidasi terhadap struktur organisasi.

### 6.1 Level 0

```ts
type RasciRole = "A" | "R" | "S" | "C" | "I";
type UnitCategory = "gov" | "strat" | "qgov" | "vc" | "pc" | "sup" | "ext";

interface Unit {                    // l0-units.json — 31 entri, key = unit id
  name: string;
  cat: UnitCategory;
  org: string;                      // induk organisasi
  role: string;                     // satu kalimat peran
  tag?: string;                     // label kecil: SID, F&A, HC, GS, CSS, NBUD
  sub?: string;                     // subjudul untuk pihak eksternal
  committee?: boolean;              // digambar bergaris putus-putus
  std?: string;                     // profit center: ISO/IEC 17021-1, dst.
  bu?: string;
  sys?: string[];
  depts?: string[];                 // id departemen
  steps?: string[];                 // profit center: 6 langkah lajur
  tasks?: string[];
  outputs?: string[];
  links?: string[];
  gives?: string[];                 // hanya cat "ext"
  receives?: string[];              // hanya cat "ext"
}

interface Department {              // l0-departments.json — 30 entri
  n: string;                        // nama lengkap
  s?: string;                       // nama pendek untuk chip
  pc: "cs" | "lab" | "is" | "pct";
}

interface UnitGroup {               // l0-unit-groups.json — kelompok berperan sama
  n: string; sub: string; ids: string[];
}

// l0-stage-involvement.json
// vc[stageId]  -> [unitOrGroupId, RasciRole, deskripsiPeran, perluKonfirmasi?][]
// pc[pcId][i]  -> daftar yang sama untuk langkah ke-i+1 lajur profit center
type Involvement = [string, RasciRole, string, boolean?];
```

`l0-layout.json` memuat urutan kotak di peta: `TOP_L`, `TOP_R`, `BOTTOM`, `VC`, `VC_LINKS`, `PCS`, `EXT_L`, `EXT_R`, label kategori `CATS`, dan `RANK` (urutan baris matriks).

**Stage id:** tahapan value chain memakai id unit `vc_*`; langkah profit center memakai pola `${pcId}_${n}`, misalnya `lab_2`.

### 6.2 Level 1

```ts
interface Lane {                    // l1-lanes.json
  n: string;                        // nama pelaksana
  t?: string;                       // induk organisasi
  ext?: 1;                          // pihak eksternal, header berwarna cobalt
}

interface Step {
  k: string;                        // key unik dalam proses
  l: string;                        // lane id
  c: number;                        // kolom (0-based) — posisi horizontal
  y?: "s" | "d" | "e";              // start | decision | end; kosong = aktivitas
  t: string;                        // judul langkah
  d?: string;                       // uraian
  o?: string;                       // output / rekaman
  n?: (string | [string, string])[];// langkah berikut, opsional dengan label cabang
}

interface Process {                 // l1-processes.json — 20 proses
  id: string;                       // M1, G2, C4.2, S3, ...
  g: "M" | "G" | "C" | "S";
  name: string; l0: string; owner: string; purpose: string;
  kpi: string[]; sys: string[]; ref: string; rel: string[];
  lanes: string[];                  // urutan lajur dari atas
  steps: Step[];
  num: Record<string, string>;      // key -> nomor langkah, mis. "C4.2-02"
  note?: string;
}
```

**Aturan:** `num` sudah ada di JSON tetapi harus dihitung ulang saat load (`useMemo`) supaya tetap benar jika ada langkah baru. Penomoran melewati node `s` dan `e`.

### 6.3 Tautan antar level (`crosslinks.json`)

| Key | Isi |
|---|---|
| `VC2L1` / `L12VC` | tahapan value chain ↔ proses Level 1 (`vc_del` → C4.1–C4.4) |
| `PC2L1` / `L12PC` | profit center ↔ proses (`lab` → C4.2) |
| `STEP2L1` | `STEP2L1[pcId][i]` = daftar step key Level 1 yang merinci langkah lajur ke-i+1 |
| `OWN` / `TAGS` | unit Level 0 → proses yang dimilikinya / kode yang tampil di kotak peta |
| `P2L0` | proses Level 1 → unit Level 0 pemiliknya |
| `LANE2L0` | lane Level 1 → unit (`u`) atau departemen (`d`) Level 0 |
| `DEPT2LANES` | departemen Level 0 → lane Level 1 tempat ia bekerja |

Turunan yang dihitung saat runtime, bukan disimpan:
- `stepToL0`: kebalikan `STEP2L1`, dipakai kolom "Di Level 0"
- `unitToProcesses(unitId)`: `{ owned, involved }` untuk bagian Level 1 di panel samping

## 7. Arsitektur aplikasi

```
src/
  main.tsx  router.tsx  App.tsx
  data/                     # JSON + index.ts (import, validasi, turunan)
  lib/
    layout-l0.ts            # posisi grid peta Level 0
    layout-l1.ts            # posisi node swimlane + orthogonal routing
    crosslinks.ts           # helper tautan dua arah
    motion.ts               # durasi, easing, varian bersama
  components/
    shell/       AppShell, LevelTabs, Toolbar, ZoomControl
    level0/      ProcessMap, GovernanceStrip, BandGroup, ValueChain,
                 ProfitCenterLane, ExternalColumn, MapLegend,
                 InvolvementMatrix, ResponsibilityCatalog
    level1/      ProcessArchitecture, ProcessSidebar, ProcessPage,
                 Swimlane, SwimlaneNode, SwimlaneEdge, StepTable
    shared/      DetailDrawer, RasciBadge, CrossLevelLink, PrintLayout
  hooks/         useDetailPanel, useStageFocus, useCrossLevelNav,
                 useZoomToFit, useReducedMotion
  routes/        Level0Page, Level1Page, Level1ProcessPage
```

### 7.1 Routing

| Route | Isi |
|---|---|
| `/` | redirect ke `/level-0` |
| `/level-0` | peta Level 0 |
| `/level-0?stage=lab_2` | peta + panel tahapan terbuka |
| `/level-0?unit=cms` / `?dept=lab_chem` | peta + panel unit atau departemen |
| `/level-1` | halaman arsitektur proses |
| `/level-1/:processId` | halaman proses, mis. `/level-1/C4.2` |
| `/level-1/:processId?steps=b,c,d&from=stage:lab_2` | proses dengan langkah tersorot dan banner asal |

Parameter query adalah sumber kebenaran untuk state panel, sorotan, dan konteks asal. Setiap state yang bisa dibagikan harus tercermin di URL.

### 7.2 State

| State | Tempat |
|---|---|
| Level aktif, proses aktif, panel, sorotan, konteks asal | URL (React Router `useSearchParams`) |
| Zoom peta, posisi scroll, tab matriks aktif | state komponen lokal |
| `prefers-reduced-motion` | hook global |

Tidak ada state global lain. Data statis diimpor langsung.

## 8. Spesifikasi layar

### 8.1 Shell

Header sticky: judul, tab **Level 0 / Level 1**, dan toolbar yang berubah sesuai level aktif (Level 0: zoom, matriks, katalog, cetak; Level 1: pilih proses, arsitektur, cetak). Tinggi header diekspos sebagai CSS variable untuk perhitungan sticky di dalamnya.

### 8.2 Level 0 — peta proses

Kanvas lebar tetap 2040px dengan scroll horizontal dan zoom 20–150% (default: muat layar). Susunan dari atas:

1. **Governance strip** — Board of Commissioners ⋯ Managing Directors (garis koordinasi putus-putus), bercabang ke dua pita.
2. **Dua pita atas** — Strategy, Product Development & Transformation (5 kotak) dan Performance Monitoring, Quality Control & Governance (3 kotak). Di bawah setiap kotak ada label alur dengan panah ke bawah.
3. **Core Business Process** (blok navy):
   - Value chain 5 tahapan dengan panah kuning berlabel dan loop umpan balik di bawahnya.
   - 4 lajur profit center. Setiap lajur: kotak profit center (nama, standar ISO, BU, sistem), 6 langkah bernomor, dan chip departemen.
4. **Pita bawah** — Corporate & Business Support (8 kotak) dengan label alur berpanah ke atas.
5. **Kolom eksternal** kiri (input) dan kanan (output), masing-masing dengan panah horizontal.
6. **Legenda** — bentuk, warna, jenis garis, badge RASCI, dan arti kode `L1 ·`.

Setiap kotak menampilkan kode Level 1 terkait bila ada (`L1 · G1, G2`); setiap langkah lajur menampilkan rentang nomor Level 1 (`C4.2-02–04`).

### 8.3 Level 0 — mode fokus tahapan

Saat sebuah tahapan diklik:
- Kotak yang tidak terlibat turun ke `opacity: 0.2`; label alur, kolom eksternal, dan panah value chain ikut meredup.
- Tahapan terpilih diberi outline kuning.
- Setiap unit yang terlibat mendapat badge RASCI di pojok kanan atas, chip departemen mendapat badge di depan namanya.
- Panel samping terbuka dan peta menyusut agar tidak tertutup (viewport ≥1100px).

### 8.4 Panel detail (drawer)

Satu komponen, tiga isi berbeda:

**Tahapan** — navigasi Sebelumnya/Berikutnya (juga panah keyboard), ringkasan jumlah unit per peran, daftar unit dikelompokkan A → R → S → C → I dengan uraian peran, lalu bagian **Detail di Level 1** (daftar nomor langkah + tombol buka swimlane).

**Unit** — peran, standar/BU/sistem, tugas dan tanggung jawab, alur proses inti (profit center), output, departemen, peran di tahapan core process, interaksi utama, dan bagian **Proses di Level 1** (pemilik proses / terlibat sebagai pelaksana).

**Departemen** — induk profit center, daftar tahapan tempat ia terlibat beserta perannya, dan tautan ke swimlane Level 1.

Jika panel dibuka sebagai lompatan dari Level 1, baris pertama panel adalah tombol "‹ Kembali ke Level 1: {kode} {nama}".

### 8.5 Matriks keterlibatan

5 tab: Value chain, Certification, Laboratory, Inspection, PCT. Baris = unit (dikelompokkan Profit center / Direksi, Business Partner & governance), kolom = tahapan, sel = badge RASCI dengan tooltip berisi uraian peran. Klik sel atau judul kolom membuka tahapan tersebut di peta. Header kolom dan kolom pertama sticky saat scroll.

### 8.6 Katalog tugas & tanggung jawab

Tabel penuh: unit (dengan induk organisasi, standar, departemen, sistem, kode Level 1), peran dalam proses, daftar tugas, dan output utama. Dikelompokkan mengikuti kategori Level 0.

### 8.7 Level 1 — arsitektur proses

Halaman ringkas berisi peta blok keempat kelompok proses (M, G, C, S) dengan C ditampilkan sebagai rantai C1 → C2 → C3 → C4.1–C4.4 → C5, plus tabel daftar 20 proses.

### 8.8 Level 1 — halaman proses

- Sidebar kiri putih berisi 20 proses yang dikelompokkan; proses aktif ditandai. Di bawah 900px berubah menjadi dropdown di toolbar.
- Header: kode berwarna kelompok, breadcrumb `Level 0 › {pita} › {unit}`, judul, tujuan, dan tombol **Posisi di Level 0**.
- Kartu info: pemilik proses, pemicu, hasil akhir, KPI, sistem, acuan, unit terlibat, proses terkait (tombol antar proses).
- **Swimlane** — SVG, satu baris per lane (tinggi 112px), header lane navy (cobalt untuk pihak eksternal, lebar 184px, sticky saat scroll horizontal), grid kolom 160px. Bentuk: kapsul untuk pemicu dan hasil akhir, persegi cyan untuk aktivitas, belah ketupat kuning untuk keputusan. Panah orthogonal; alur balik digambar merah putus-putus dan diberi label cabang.
- Tabel uraian langkah: nomor, aktivitas, pelaksana, uraian, output/rekaman, dan kolom **Di Level 0** berisi tautan balik.
- Klik node menyorot barisnya di tabel dan sebaliknya.

## 9. Navigasi dua arah

| Dari | Aksi | Hasil |
|---|---|---|
| Langkah lajur Level 0 | Tombol di panel | Buka `/level-1/C4.2?steps=c,d,e&from=stage:lab_2`, langkah tersorot, banner asal muncul, scroll ke node pertama |
| Tahapan value chain | Tombol di panel | Buka proses terkait (C4 memberi 4 pilihan) |
| Unit atau departemen Level 0 | Tombol di panel | Buka proses terkait dengan seluruh langkah di lane-nya tersorot |
| Header proses Level 1 | Tombol "Posisi di Level 0" | Buka `/level-0?stage=…` atau `?unit=…` |
| Kolom "Di Level 0" | Tautan per baris | Buka langkah lajur atau unit yang sesuai |
| Banner kuning di Level 1 | "‹ Kembali ke Level 0" | Kembali ke tahapan asal |
| Panel Level 0 hasil lompatan | "‹ Kembali ke Level 1" | Kembali ke proses asal |

**Aturan:** konteks asal disimpan satu tingkat saja (`from`), bukan tumpukan riwayat. Tombol Back browser tetap berfungsi karena semua state ada di URL.

## 10. Motion

Prinsip: gerakan menjawab aksi pengguna dan menjelaskan apa yang berubah. Tidak ada animasi masuk berantai saat halaman dibuka.

| Interaksi | Spesifikasi |
|---|---|
| Ganti level | Cross-fade 220ms `easeOut`; level baru `opacity 0→1`, `y 8→0`. Level lama keluar 140ms. Gunakan `AnimatePresence mode="wait"` |
| Panel buka/tutup | Slide `x: 100%→0` 260ms `[0.32, 0.72, 0, 1]`; overlay fade 180ms; peta menyusut dengan transisi `margin-right` durasi sama |
| Ganti isi panel (tahapan lain) | Isi lama fade-out 100ms, isi baru fade-in 160ms dengan `y 6→0`; header panel tetap diam |
| Mode fokus menyala | `opacity` unit tak terlibat turun ke 0.2 dalam 200ms; badge RASCI muncul `scale 0.6→1` dengan stagger 20ms, maksimal total 300ms |
| Mode fokus mati | Semua kembali ke 1 dalam 160ms, badge langsung hilang tanpa animasi keluar |
| Navigasi tahapan (Prev/Next) | Sorotan berpindah dengan `layoutId` pada outline kuning sehingga outline bergeser, bukan lompat |
| Lompat ke Level 1 | Setelah level bertukar, banner asal `height 0→auto` + fade 200ms; node tersorot mendapat pulse ring 2 kali (600ms) lalu tetap ber-outline |
| Scroll ke node atau baris | `scrollTo({ behavior: "smooth" })`, hanya jika target berada di luar viewport |
| Tab matriks | Indikator garis bawah menggunakan `layoutId`; isi tab cross-fade 150ms |
| Hover kotak dan node | `background-color` 120ms; tanpa translate atau shadow |
| Zoom peta | Transisi `transform` 200ms saat tombol ditekan; tanpa transisi saat resize window |

**Reduced motion:** bila `prefers-reduced-motion: reduce`, semua durasi menjadi 0 kecuali cross-fade opacity yang dipertahankan 100ms, dan `scrollTo` memakai `behavior: "auto"`. Sediakan satu hook `useMotionConfig()` yang mengembalikan durasi terkalibrasi supaya tidak ada angka durasi yang ditulis langsung di komponen.

**Performa:** hanya animasikan `opacity` dan `transform`. Peta Level 0 memuat ratusan elemen; pakai satu transisi CSS pada kelas induk `.focus-mode` daripada meng-animasikan setiap kotak lewat JavaScript.

## 11. Design tokens

```css
@theme {
  --color-cobalt: #001ED2;      /* primer TÜV NORD — aksi, tautan, aksen aktif */
  --color-navy: #06043B;        /* blok proses, header lane */
  --color-cyan: #6FE3E1;        /* kotak unit dan aktivitas */
  --color-yellow: #FBE94A;      /* pita kategori, keputusan, sorotan */
  --color-teal: #3A9A9C;        /* garis input, dukungan, output */
  --color-orange: #FF7A00;      /* badge Accountable, pulse sorotan */
  --color-ink: #12123A;
  --color-paper: #F5F6F8;
  --color-line: #D9DCE3;
  --color-muted: #5B6075;
}
```

**Warna RASCI:** A oranye, R cobalt, S teal, C kuning (teks navy), I abu-abu.

**Tipografi:** satu keluarga, Inter, dengan rentang berat 400/500/650/800. Skala: 11px badge, 12.5px label, 13px tabel, 14.5px isi, 17–24px judul. Hindari huruf kapital semua untuk label.

**Aturan tampilan:** sidebar dan panel berlatar putih, bukan navy. Sudut kotak siku, bukan membulat — mengikuti gaya peta cetak. Bayangan hanya pada panel yang mengambang. Kepadatan tinggi: peta ini memang padat data, jangan diberi jarak seperti dasbor marketing.

## 12. Aksesibilitas

- Semua kotak peta dan node swimlane adalah `<button>` dengan `aria-label` berisi nama dan konteks; fokus keyboard terlihat (`outline: 3px solid cobalt`).
- Panel adalah `role="dialog"` dengan `aria-modal="false"`, fokus pindah ke tombol tutup saat dibuka dan kembali ke pemicu saat ditutup. Escape menutup.
- Panah kiri/kanan menavigasi tahapan saat panel terbuka.
- Peran RASCI tidak boleh hanya dibedakan warna: badge selalu memuat huruf, dan tooltip memuat nama peran lengkap.
- Tabel memakai `<th scope>` yang benar; matriks memberi `aria-label` pada setiap sel berisi "unit — tahapan — peran".
- Kontras minimum 4.5:1 untuk teks; teks di atas cyan memakai navy, di atas navy memakai putih.

## 13. Responsif

| Lebar | Perilaku |
|---|---|
| ≥1400px | Peta muat layar, panel berdampingan tanpa menutupi peta |
| 1100–1399px | Peta menyusut saat panel terbuka |
| 900–1099px | Panel menutupi sebagian peta (overlay) |
| <900px | Header tidak sticky; sidebar Level 1 menjadi dropdown; kartu info satu kolom; peta dan swimlane discroll horizontal; panel selebar layar penuh |

## 14. Cetak

Dua mode: **cetak halaman ini** dan **cetak semua proses**. Format A3 landscape, `print-color-adjust: exact`. Peta Level 0 diskalakan agar muat satu halaman; setiap proses Level 1 dimulai di halaman baru dengan header, kartu info, swimlane, dan tabel langkah. Elemen navigasi, tombol, banner, dan sidebar disembunyikan. `<thead>` diulang antar halaman.

## 15. Non-fungsional

- Bundel awal < 300KB gzip; data JSON di-import statis (total ~140KB, gzip ~30KB).
- Interaksi klik → sorotan muncul < 100ms pada laptop kelas menengah.
- Tanpa layout shift saat panel dibuka: gunakan transisi lebar pada kontainer, bukan `position` yang berubah.
- Tidak ada permintaan jaringan setelah load pertama.

## 16. Milestone dan kriteria penerimaan

### M0 — Fondasi
Vite + React + TS strict + Tailwind v4 + React Router + motion. Token warna, tipografi, dan AppShell dengan tab level.
- **Given** aplikasi dijalankan, **when** membuka `/`, **then** ada redirect ke `/level-0` dan tab Level 0 aktif.
- **Given** tab Level 1 diklik, **when** transisi selesai, **then** URL menjadi `/level-1` dan toolbar berganti.

### M1 — Data layer
Import JSON, deklarasi tipe, hitung `num`, bangun indeks turunan (`stepToL0`, `unitToProcesses`, involvement per unit).
- **Given** data dimuat, **when** validasi dijalankan, **then** setiap `step.n` menunjuk step yang ada, setiap `step.l` ada di `process.lanes`, dan tidak ada dua step pada `lane+column` yang sama.
- **Given** proses C4.2, **when** `num` dihitung, **then** langkah pertama bernomor `C4.2-01` dan node start/end tidak bernomor.

### M2 — Peta Level 0
Seluruh blok peta, zoom, legenda, tanpa interaksi panel.
- **Given** viewport 1440px, **when** halaman dimuat, **then** peta otomatis muat layar dan persentase zoom tampil.
- **Given** kotak Corporate Management System, **when** dirender, **then** kotak menampilkan tag `SID` dan kode `L1 · G1, G2`.

### M3 — Panel detail dan mode fokus
Panel tiga varian, mode fokus, badge RASCI, navigasi tahapan.
- **Given** langkah `lab_2` diklik, **when** panel terbuka, **then** URL menjadi `?stage=lab_2`, 7 unit tampil dikelompokkan per peran, dan unit tak terlibat meredup.
- **Given** panel terbuka, **when** tombol panah kanan ditekan, **then** panel berpindah ke `lab_3` dan sorotan bergeser.
- **Given** `prefers-reduced-motion` aktif, **when** panel dibuka, **then** tidak ada gerakan slide.

### M4 — Matriks dan katalog
- **Given** tab Laboratory, **when** dirender, **then** kolom berjumlah 6 dan baris dikelompokkan dua kategori.
- **Given** sel berisi badge, **when** diklik, **then** peta terbuka pada tahapan tersebut.

### M5 — Level 1
Arsitektur proses, sidebar, halaman proses, renderer swimlane, tabel langkah.
- **Given** proses C4.1, **when** dirender, **then** 5 lane tampil, 13 langkah bernomor, dan alur balik digambar merah putus-putus.
- **Given** node diklik, **when** sorotan aktif, **then** baris tabelnya ikut tersorot dan ter-scroll ke tengah.
- **Given** viewport 400px, **when** halaman dimuat, **then** sidebar berubah menjadi dropdown dan swimlane bisa discroll.

### M6 — Tautan dua arah
- **Given** panel tahapan `lab_2`, **when** tombol swimlane diklik, **then** URL menjadi `/level-1/C4.2?steps=c,d,e&from=stage:lab_2`, tiga langkah tersorot, dan banner asal tampil.
- **Given** banner asal, **when** "Kembali ke Level 0" diklik, **then** peta terbuka kembali pada `lab_2` dengan panel berisi tombol kembali ke C4.2.
- **Given** URL `/level-1/C4.3` dibuka langsung, **when** halaman dimuat, **then** Level 1 aktif pada proses tersebut tanpa banner.

### M7 — Cetak, aksesibilitas, dan penghalusan
- **Given** cetak semua proses, **when** PDF dihasilkan, **then** setiap proses mulai di halaman baru dan warna tercetak.
- **Given** navigasi keyboard saja, **when** menelusuri peta, **then** setiap kotak bisa difokuskan dan Enter membuka panel.
- **Given** audit Lighthouse, **when** dijalankan, **then** skor Accessibility ≥ 95.

## 17. Hal yang perlu divalidasi pemilik proses

Ini catatan konten, bukan pekerjaan teknis, tetapi harus tetap terlihat di UI:

- Seluruh pembagian RASCI dan urutan langkah Level 1 masih draft.
- Peran berlabel "perlu dikonfirmasi": Lab Operation Support, Medan RO, Semarang RO, dan Procurement untuk pengadaan auditor eksternal. Flag ini ada di data (elemen keempat pada `Involvement`) dan harus dirender sebagai badge oranye.
- BRDM belum dipetakan ke tahapan mana pun; panelnya menampilkan pesan khusus.
- Sistem pendukung C4.3 dan C4.4 masih "Belum dipetakan".
- Setiap halaman proses dan panel tahapan menampilkan catatan bahwa isinya draft.

## Lampiran — berkas data

| Berkas | Isi |
|---|---|
| `l0-units.json` | 31 unit Level 0 |
| `l0-departments.json` | 30 departemen profit center |
| `l0-unit-groups.json` | 6 kelompok unit berperan sama |
| `l0-stage-involvement.json` | RASCI untuk 5 tahapan value chain + 24 langkah profit center |
| `l0-layout.json` | urutan kotak, label alur, kategori, urutan baris matriks |
| `l1-processes.json` | 20 proses beserta langkah dan metadatanya |
| `l1-lanes.json` | 50 definisi lane |
| `l1-groups.json` | 4 kelompok proses |
| `crosslinks.json` | seluruh pemetaan antar level |
