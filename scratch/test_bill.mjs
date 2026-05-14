
async function testCreateBill() {
  const formData = new URLSearchParams()
  formData.append('userSecretKey', 'wjommfrv-9yc5-t769-4cqp-til8i6kd5pda')
  formData.append('categoryCode', 'c4bqcskj')
  formData.append('billName', 'TEST BILL NUXBILL')
  formData.append('billDescription', 'Testing integration')
  formData.append('billPriceSetting', '1')
  formData.append('billPayorInfo', '1')
  formData.append('billAmount', '100') // RM 1.00
  formData.append('billReturnUrl', 'http://localhost:3000/beli/status')
  formData.append('billCallbackUrl', 'http://localhost:3000/api/webhook/toyyibpay')
  formData.append('billExternalReferenceNo', 'TEST-' + Date.now())
  formData.append('billTo', 'Customer Test')
  formData.append('billEmail', 'test@nuxbill.local')
  formData.append('billPhone', '0123456789')

  const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
    method: 'POST',
    body: formData
  })

  const text = await response.text()
  console.log('RAW RESPONSE FROM TOYYIBPAY:', text)
}

testCreateBill()
