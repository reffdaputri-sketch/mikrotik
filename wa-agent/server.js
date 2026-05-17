require('dotenv').config(); // Muat fail .env untuk token keselamatan
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode'); // Untuk generate QR sebagai image
const pino = require('pino');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Middleware untuk menyemak Token/API Key keselamatan
function authorize(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Gunakan token dari .env, atau lalai sekiranya tiada
    const secureToken = process.env.WA_GATEWAY_TOKEN || 'purnamawifi_wa_secure_key_8b99d45e7f12a3d0';
    
    if (!token || token !== secureToken) {
        console.warn(`[SECURITY WARNING] Percubaan akses haram dari IP: ${req.ip}`);
        return res.status(401).json({ error: 'Tidak dibenarkan (Unauthorized): Token tidak sah' });
    }
    next();
}

let sock = null;
let isConnected = false;
let currentQR = null; // Simpan QR string terkini
let connectedPhone = null; // Simpan info nomor yg tersambung

const AUTH_DIR = 'auth_info_baileys';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;

        if (qr) {
            currentQR = qr; // Simpan QR untuk endpoint /qr
            isConnected = false;
            console.log('\n[WA] QR Code baru diterima. Buka Admin Panel untuk imbas.\n');
            // Juga tampilkan di terminal sebagai backup
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            connectedPhone = null;
            currentQR = null;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            // Jangan reconnect jika loggedOut (401), conflict (440) atau bad session (403/411)
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                    statusCode !== 401 && 
                                    statusCode !== 403 && 
                                    statusCode !== 440;

            console.log(`[WA] Koneksi tertutup. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

            if (shouldReconnect) {
                console.log('[WA] Cuba semula dalam 3 saat...');
                setTimeout(() => connectToWhatsApp(), 3000);
            } else {
                console.log('[WA] Padam sesi bermasalah / Log Keluar dan mulakan sesi bersih...');
                // Padam folder auth
                if (fs.existsSync(AUTH_DIR)) {
                    try {
                        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                        console.log('[WA] Folder sesi auth_info_baileys telah dibersihkan sepenuhnya.');
                    } catch (e) {
                        console.error('[WA] Gagal padam folder sesi:', e.message);
                    }
                }
                // Mula semula untuk jana QR baru
                setTimeout(() => connectToWhatsApp(), 2000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            currentQR = null; // Buang QR selepas berjaya
            connectedPhone = sock.user?.id || null;
            console.log(`\n✅ WhatsApp berjaya disambungkan! (${connectedPhone})\n`);
        } else if (connection === 'connecting') {
            console.log('[WA] Menyambung ke WhatsApp...');
        }
    });
}

connectToWhatsApp();

// ─── GET /status ─────────────────────────────────────────────────
app.get('/status', authorize, (req, res) => {
    res.json({
        connected: isConnected,
        phone: connectedPhone,
        hasQR: !!currentQR,
        message: isConnected
            ? `WhatsApp tersambung (${connectedPhone})`
            : currentQR ? 'Menunggu imbasan QR Code' : 'Tidak tersambung'
    });
});

// ─── GET /qr ─────────────────────────────────────────────────────
// Return QR code sebagai base64 PNG image
app.get('/qr', authorize, async (req, res) => {
    if (isConnected) {
        return res.status(200).json({ connected: true, message: 'Sudah tersambung, tiada QR diperlukan' });
    }

    if (!currentQR) {
        return res.status(404).json({ error: 'QR belum tersedia. Sila tunggu atau restart agent.' });
    }

    try {
        // Generate QR sebagai data URL (base64 PNG)
        const qrDataURL = await QRCode.toDataURL(currentQR, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        res.json({ qr: qrDataURL, connected: false });
    } catch (err) {
        res.status(500).json({ error: 'Gagal menjana QR Code' });
    }
});

// ─── POST /disconnect ─────────────────────────────────────────────
// Log out dan padam sesi (untuk sambung semula dengan nombor lain)
app.post('/disconnect', authorize, async (req, res) => {
    try {
        console.log('[WA] Permintaan putus sambungan diterima...');
        
        if (sock) {
            // Cabut semua listeners untuk elak double-trigger atau loop reconnect
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            
            try {
                if (isConnected) {
                    await sock.logout();
                } else {
                    sock.end();
                }
            } catch (e) {
                console.log('[WA] Socket ditutup secara paksa:', e.message);
                sock.end();
            }
            sock = null;
        }

        isConnected = false;
        currentQR = null;
        connectedPhone = null;

        // Tunggu 1 saat untuk Windows lepaskan kunci fail (file locks) sebelum padam
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Padam folder auth secara total
        if (fs.existsSync(AUTH_DIR)) {
            try {
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                console.log('[WA] Folder sesi auth_info_baileys berjaya dibersihkan secara total.');
            } catch (err) {
                console.error('[WA] Gagal memadam folder sesi (kemungkinan fail dikunci):', err.message);
                // Cuba padam lagi sekali jika gagal
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    console.log('[WA] Sesi berjaya dipadam pada cubaan kedua.');
                } catch (err2) {
                    console.error('[WA] Cubaan kedua juga gagal:', err2.message);
                }
            }
        }

        // Sambung semula untuk jana QR baru
        setTimeout(() => connectToWhatsApp(), 1000);

        res.json({ success: true, message: 'Berjaya log keluar. Sesi telah dibersihkan secara total.' });
    } catch (err) {
        console.error('[WA] Ralat disconnect:', err.message);
        res.status(500).json({ error: 'Gagal membersihkan sesi', details: err.message });
    }
});

// ─── POST /send ───────────────────────────────────────────────────
app.post('/send', authorize, async (req, res) => {
    try {
        const { target, message } = req.body;

        if (!target || !message) {
            return res.status(400).json({ error: 'Sila berikan target (nombor WA) dan message' });
        }

        if (!isConnected || !sock) {
            return res.status(503).json({ error: 'WhatsApp tidak tersambung. Sila imbas QR dari Admin Panel.' });
        }

        const formattedNumber = target.replace(/\D/g, '') + '@s.whatsapp.net';
        console.log(`[WA] Menghantar mesej ke ${formattedNumber}`);

        const sentMsg = await sock.sendMessage(formattedNumber, { text: message });

        console.log(`[WA] Berjaya dihantar ke ${formattedNumber}`);
        res.json({ success: true, message: 'Mesej berjaya dihantar', details: sentMsg });

    } catch (error) {
        console.error('[WA] Ralat menghantar:', error.message || error);
        res.status(500).json({ error: 'Gagal menghantar mesej', details: error.message || error.toString() });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 WA Gateway API berjalan di port ${PORT}`);
    console.log(`   Status     : GET  http://localhost:${PORT}/status`);
    console.log(`   QR Code    : GET  http://localhost:${PORT}/qr`);
    console.log(`   Kirim      : POST http://localhost:${PORT}/send`);
    console.log(`   Disconnect : POST http://localhost:${PORT}/disconnect\n`);
});
