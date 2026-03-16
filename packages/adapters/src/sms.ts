/**
 * SMS adapter — Aliyun SMS for Thai +66 numbers
 */

export interface SmsAdapter {
  send(to: string, templateCode: string, params: Record<string, string>): Promise<void>
  sendFlightAlert(to: string, flightNo: string, message: string): Promise<void>
}

export class AliyunSmsAdapter implements SmsAdapter {
  private accessKey: string
  private accessSecret: string
  private signName: string
  private endpoint = 'https://dysmsapi.aliyuncs.com'

  constructor(accessKey: string, accessSecret: string, signName: string) {
    this.accessKey = accessKey
    this.accessSecret = accessSecret
    this.signName = signName
  }

  async send(to: string, templateCode: string, params: Record<string, string>): Promise<void> {
    const queryParams: Record<string, string> = {
      Action: 'SendSms',
      Version: '2017-05-25',
      RegionId: 'ap-southeast-1',
      PhoneNumbers: to,
      SignName: this.signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify(params),
      Format: 'JSON',
      AccessKeyId: this.accessKey,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: Math.random().toString(36).slice(2),
      Timestamp: new Date().toISOString(),
    }

    // Build signature (simplified — use aliyun SDK in production)
    const sortedParams = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k] ?? '')}`)
      .join('&')

    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`

    // HMAC-SHA1 signing (use crypto module)
    const { createHmac } = await import('crypto')
    const signature = createHmac('sha1', `${this.accessSecret}&`)
      .update(stringToSign)
      .digest('base64')

    const url = `${this.endpoint}?${sortedParams}&Signature=${encodeURIComponent(signature)}`

    const res = await fetch(url)
    const data = await res.json() as { Code: string; Message: string }

    if (data.Code !== 'OK') {
      throw new Error(`Aliyun SMS error: ${data.Code} - ${data.Message}`)
    }
  }

  async sendFlightAlert(to: string, flightNo: string, message: string): Promise<void> {
    const templateCode = process.env['ALIYUN_SMS_TEMPLATE_OTP'] ?? ''
    await this.send(to, templateCode, { flightNo, message })
  }
}

export function createSmsAdapter(): SmsAdapter {
  const accessKey = process.env['ALIYUN_SMS_ACCESS_KEY']
  const accessSecret = process.env['ALIYUN_SMS_ACCESS_SECRET']
  const signName = process.env['ALIYUN_SMS_SIGN_NAME'] ?? 'TripFlow'

  if (!accessKey || !accessSecret) throw new Error('Aliyun SMS credentials are required')
  return new AliyunSmsAdapter(accessKey, accessSecret, signName)
}
