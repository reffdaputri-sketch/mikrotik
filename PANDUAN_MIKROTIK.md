# 📑 PANDUAN PENGATURAN MIKROTIK (NUXBILL SYSTEM)

Ikuti langkah-langkah ini di **Winbox** kamu untuk menghubungkan Router dengan sistem NuxBill Cloud.

---

### 1. Aktifkan Service API (Wajib)
Langkah ini agar si **Local Agent** bisa "ngobrol" dengan router kamu.
1. Buka Winbox -> Menu **IP** -> **Services**.
2. Cari service bernama **`api`**.
3. Klik kanan lalu pilih **Enable** (ikon centang biru).
4. Pastikan port-nya adalah **`8728`**.
5. *(Opsional - Keamanan)*: Klik 2x pada `api`, isi kolom **Available From** dengan IP lokal komputer yang menjalankan Agent (misal: `192.168.88.250`).

---

### 2. Buat User Khusus Agent
Jangan pakai user `admin` bawaan demi keamanan.
1. Buka Menu **System** -> **Users**.
2. Klik tombol **[+] (Add)**.
3. **Name**: `nuxbill_agent`
4. **Group**: `full` (atau `write` jika ingin lebih terbatas).
5. **Password**: Buat password yang kuat (misal: `AgentNux@2024!`).
6. Klik **OK**.

---

### 3. Persiapan Hotspot (Captive Portal)
Agar sistem voucher bisa jalan, Hotspot Server harus terpasang.
1. Buka Menu **IP** -> **Hotspot**.
2. Klik tombol **Hotspot Setup**.
3. Pilih Interface WiFi kamu (misal: `bridge-local` atau `wlan1`).
4. Ikuti langkahnya (Next-Next saja) sampai selesai.
5. **DNS Name**: Isi dengan nama unik (misal: `wifi.net` atau `login.id`). Ini yang bakal muncul di browser user.

---

### 4. Sinkronisasi Profile Bandwidth
Nama profil di MikroTik **HARUS SAMA** dengan nama profil di Web Admin NuxBill.
1. Di Menu Hotspot, pilih tab **User Profiles**.
2. Pastikan ada profil dengan nama yang kamu buat di Web Admin (misal: `5mbps`).
3. Set **Rate Limit (rx/tx)** sesuai kecepatan (misal: `5M/5M`).

---

### 5. Hubungkan ke Dashboard Admin NuxBill
Setelah setting di Winbox selesai, masukkan datanya ke Web Admin:
1. Login ke Admin NuxBill -> Menu **Router MikroTik**.
2. Klik **Tambah Router**.
3. **IP Address**: Isi IP lokal router kamu (Contoh: `192.168.88.1`).
4. **Username**: `nuxbill_agent` (sesuai langkah 2).
5. **Password**: `AgentNux@2024!` (sesuai langkah 2).
6. **Port**: `8728`.

---

### 💡 TIPS TAMBAHAN
* **Tes Koneksi**: Setelah tambah router di web, coba buat 1 voucher di dashboard. Kalau Local Agent kamu muncul tulisan `✅ Command done`, berarti koneksi sudah 100% SUKSES!
* **Template Login**: Jika ingin tampilan halaman login WiFi yang modern, kamu bisa ganti file di folder `flash/hotspot` di MikroTik kamu dengan template HTML dari saya nanti.

---
*Dibuat khusus untuk NuxBill Next System* 🚀👊🏽
