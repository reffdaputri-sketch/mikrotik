import crypto from 'crypto'

export const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  isProduction: process.env.DUITKU_IS_PRODUCTION === 'true',
  url: process.env.DUITKU_IS_PRODUCTION === 'true' 
    ? 'https://passport.duitku.com/webapi' 
    : 'https://sandbox.duitku.com/webapi'
}

export function generateDuitkuSignature(orderId: string, amount: number) {
  const { merchantCode, apiKey } = DUITKU_CONFIG
  const raw = merchantCode + orderId + amount + apiKey
  return crypto.createHash('md5').update(raw).digest('hex')
}

export function verifyDuitkuCallback(params: {
  merchantCode: string
  amount: string
  merchantOrderId: string
  signature: string
}) {
  const { apiKey } = DUITKU_CONFIG
  const raw = params.merchantCode + params.amount + params.merchantOrderId + apiKey
  const expected = crypto.createHash('md5').update(raw).digest('hex')
  return expected === params.signature
}

export async function createDuitkuTransaction(params: {
  orderId: string,
  amount: number,
  productDetails: string,
  customerName: string,
  customerEmail: string,
  phoneNumber: string,
  callbackUrl: string,
  returnUrl: string
}) {
  const signature = generateDuitkuSignature(params.orderId, params.amount)
  
  const payload = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    paymentAmount: params.amount,
    merchantOrderId: params.orderId,
    productDetails: params.productDetails,
    additionalParam: '',
    merchantUserInfo: '',
    customerVaName: params.customerName,
    email: params.customerEmail,
    phoneNumber: params.phoneNumber,
    itemDetails: [
      {
        name: params.productDetails,
        price: params.amount,
        quantity: 1
      }
    ],
    callbackUrl: params.callbackUrl,
    returnUrl: params.returnUrl,
    signature: signature,
    expiryPeriod: 180 // 3 jam
  }

  const res = await fetch(`${DUITKU_CONFIG.url}/api/merchant/v2/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return await res.json()
}
