export const TOYYIBPAY_CONFIG = {
  userSecretKey: process.env.TOYYIBPAY_USER_SECRET_KEY || '',
  categoryCode: process.env.TOYYIBPAY_CATEGORY_CODE || '',
  isProduction: process.env.TOYYIBPAY_IS_PRODUCTION === 'true',
  apiUrl: process.env.TOYYIBPAY_IS_PRODUCTION === 'true'
    ? 'https://toyyibpay.com/index.php/api'
    : 'https://dev.toyyibpay.com/index.php/api',
  paymentUrl: process.env.TOYYIBPAY_IS_PRODUCTION === 'true'
    ? 'https://toyyibpay.com'
    : 'https://dev.toyyibpay.com'
}

export async function createToyyibpayBill(params: {
  billName: string,
  billDescription: string,
  billAmount: number, // In RM (e.g. 10.50)
  billTo: string,
  billEmail: string,
  billPhone: string,
  externalReferenceNo: string,
  returnUrl: string,
  callbackUrl: string
}) {
  const formData = new URLSearchParams()
  formData.append('userSecretKey', TOYYIBPAY_CONFIG.userSecretKey)
  formData.append('categoryCode', TOYYIBPAY_CONFIG.categoryCode)
  formData.append('billName', params.billName.slice(0, 30))
  formData.append('billDescription', params.billDescription)
  formData.append('billPriceSetting', '1') // Fixed price
  formData.append('billPayorInfo', '1') // Fixed info
  // toyyibPay expects amount in RM (e.g. 10.00)
  formData.append('billAmount', params.billAmount.toFixed(2))
  formData.append('billReturnUrl', params.returnUrl)
  formData.append('billCallbackUrl', params.callbackUrl)
  formData.append('billExternalReferenceNo', params.externalReferenceNo)
  formData.append('billTo', params.billTo)
  formData.append('billEmail', params.billEmail)
  formData.append('billPhone', params.billPhone)
  // formData.append('billPaymentChannel', '0') // Kita cuba buang ni supaya ToyyibPay pilih auto

  const response = await fetch(`${TOYYIBPAY_CONFIG.apiUrl}/createBill`, {
    method: 'POST',
    body: formData
  })

  const text = await response.text()
  let data: any
  try {
    data = JSON.parse(text)
  } catch (e) {
    console.error('TOYYIBPAY RAW ERROR:', text)
    return {
      success: false,
      error: text // Ini akan berisi [KEY-DID-NOT-MATCH] dll
    }
  }
  
  // toyyibPay returns an array with BillCode
  if (Array.isArray(data) && data[0]?.BillCode) {
    return {
      success: true,
      billCode: data[0].BillCode,
      paymentUrl: `${TOYYIBPAY_CONFIG.paymentUrl}/${data[0].BillCode}`
    }
  }

  return {
    success: false,
    error: typeof data === 'object' ? JSON.stringify(data) : data
  }
}

export async function verifyToyyibpayTransaction(billCode: string, billpaymentStatus: string) {
  const formData = new URLSearchParams()
  formData.append('userSecretKey', TOYYIBPAY_CONFIG.userSecretKey)
  formData.append('billCode', billCode)
  formData.append('billpaymentStatus', billpaymentStatus) // '1' = success

  try {
    const response = await fetch(`${TOYYIBPAY_CONFIG.apiUrl}/getBillTransactions`, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    // ToyyibPay mengembalikan array transaksi. Kalau statusnya '1', berarti lunas beneran.
    if (Array.isArray(data) && data.length > 0) {
      const validTransaction = data.find(tx => tx.billpaymentStatus === '1')
      return {
        isPaid: !!validTransaction,
        data: validTransaction
      }
    }
    
    return { isPaid: false, data: null }
  } catch (err) {
    console.error('Error verifying ToyyibPay transaction:', err)
    return { isPaid: false, data: null }
  }
}
