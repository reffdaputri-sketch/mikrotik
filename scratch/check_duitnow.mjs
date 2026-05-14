
async function checkDuitNow() {
  const formData = new URLSearchParams()
  formData.append('userSecretKey', 'wjommfrv-9yc5-t769-4cqp-til8i6kd5pda')

  const response = await fetch('https://toyyibpay.com/index.php/api/checkDuitNowQRStatus', {
    method: 'POST',
    body: formData
  })

  const data = await response.json()
  console.log('RESULT DUITNOW STATUS:', data)
}

checkDuitNow()
