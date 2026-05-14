const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function simulateWebhook(orderId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log(`🚀 Memulai simulasi pembayaran untuk Order ID: ${orderId}...`);

  // 1. Ambil data order
  const { data: order, error: orderErr } = await supabase
    .from('payment_orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (orderErr || !order) {
    console.error('❌ Order tidak ditemukan di database!');
    return;
  }

  // 2. Simulasi hit webhook lokal
  // Karena kita mau ngetes logika PPPoE-nya, kita panggil API kita sendiri
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Kita kirim data persis kayak yang dikirim toyyibPay
  const payload = new URLSearchParams();
  payload.append('status', '1'); // 1 = Success
  payload.append('billcode', 'test_bill');
  payload.append('order_id', orderId);
  payload.append('msg', 'ok');
  payload.append('transaction_id', 'TEST-TRX-123');

  console.log(`📡 Mengirim sinyal "LUNAS" ke sistem...`);
  
  try {
    const response = await fetch(`${baseUrl}/api/webhook/toyyibpay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    });

    if (response.ok) {
      console.log('✅ BERHASIL! Sistem sudah mencatat pembayaran LUNAS.');
      console.log('👉 Sekarang cek Winbox atau Terminal Agent kamu.');
    } else {
      const text = await response.text();
      console.error('❌ Gagal simulasi:', text);
    }
  } catch (err) {
    console.error('❌ Error koneksi ke server:', err.message);
  }
}

const orderId = process.argv[2];
if (!orderId) {
  console.log('Usage: node scratch/test-pppoe-webhook.js NB-XXXXX');
} else {
  simulateWebhook(orderId);
}
