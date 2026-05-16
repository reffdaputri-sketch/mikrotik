const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Kita handle sendiri supaya QR muncul dengan betul
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrcode.generate(qr, {small: true});
            console.log('\n--- SILA IMBAS KOD QR DI ATAS DENGAN WHATSAPP ANDA ---\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi tertutup kerana ', lastDisconnect.error, ', reconnecting:', shouldReconnect);
            
            // Reconnect jika bukan sebab logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log('Anda telah Log Out dari WhatsApp. Sila padam folder auth_info_baileys dan imbas QR semula.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ BERJAYA! WhatsApp sedia untuk digunakan.\n');
        }
    });
}

connectToWhatsApp();

// API Endpoint untuk hantar mesej
app.post('/send', async (req, res) => {
    try {
        let { target, message } = req.body;

        if (!target || !message) {
            return res.status(400).json({ error: 'Sila berikan target (nombor WA) dan message' });
        }

        // Formatkan nombor telefon kepada format @s.whatsapp.net
        // Jika bermula dengan 0, tukar kepada kod negara (cth: 60 untuk Malaysia, 62 untuk Indonesia)
        let formattedNumber = target.replace(/\D/g, ''); 
        
        // Asumsi nombor bermula dengan kod negara. Jika belum, tambah manual di sini jika perlu.
        // Contoh jika target '0123456789' dihantar dari NuxBill, kita harus tahu kod negaranya.
        // Sebaiknya NuxBill sudah sedia hantar dalam format '60123456789' atau '628123456789'
        
        const id = formattedNumber + '@s.whatsapp.net';

        const sentMsg = await sock.sendMessage(id, { text: message });
        
        res.json({ success: true, message: 'Mesej berjaya dihantar', details: sentMsg });

    } catch (error) {
        console.error('Ralat menghantar mesej:', error);
        res.status(500).json({ error: 'Gagal menghantar mesej', details: error.toString() });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 WA Gateway API sedang berjalan di port ${PORT}`);
});
