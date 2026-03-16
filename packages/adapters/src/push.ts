import type { TourRegion, PushRegistration } from '@tripflow/types'

export interface PushAdapter {
  registerDevice(deviceInfo: { token: string }, region: TourRegion): Promise<PushRegistration>
  send(
    userId: string,
    title: string,
    body: string,
    region: TourRegion,
    data?: Record<string, string>
  ): Promise<void>
  sendToMultiple(
    userIds: string[],
    title: string,
    body: string,
    region: TourRegion,
    data?: Record<string, string>
  ): Promise<void>
}

/**
 * Firebase Cloud Messaging adapter — Global tours only
 * NOT accessible inside mainland China (FCM is blocked)
 */
export class FCMAdapter implements PushAdapter {
  private projectId: string
  private clientEmail: string
  private privateKey: string

  constructor(projectId: string, clientEmail: string, privateKey: string) {
    this.projectId = projectId
    this.clientEmail = clientEmail
    this.privateKey = privateKey
  }

  async registerDevice(_deviceInfo: { token: string }, _region: TourRegion): Promise<PushRegistration> {
    // FCM token registration is handled client-side via firebase SDK
    // This is a no-op for registration, token is stored on the user record
    return { fcmToken: _deviceInfo.token }
  }

  async send(
    _userId: string,
    title: string,
    body: string,
    _region: TourRegion,
    data?: Record<string, string>
  ): Promise<void> {
    // In production, use firebase-admin SDK
    // Implemented via /api/notifications endpoint which uses admin SDK
    const accessToken = await this.getAccessToken()

    await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          notification: { title, body },
          data: data ?? {},
        },
      }),
    })
  }

  async sendToMultiple(
    userIds: string[],
    title: string,
    body: string,
    region: TourRegion,
    data?: Record<string, string>
  ): Promise<void> {
    await Promise.all(userIds.map((id) => this.send(id, title, body, region, data)))
  }

  private async getAccessToken(): Promise<string> {
    // Use Google OAuth2 to get FCM access token
    // In production, use google-auth-library
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }

    // Simplified — in production use google-auth-library
    const _headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
    const _payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

    // TODO: Sign with private key and exchange for access token
    return 'access_token_placeholder'
  }
}

/**
 * JPush (极光推送) adapter — China tours only
 * REST API: api.jpush.cn — accessible inside China
 */
export class JPushAdapter implements PushAdapter {
  private appKey: string
  private masterSecret: string
  private baseUrl = 'https://api.jpush.cn/v3'

  constructor(appKey: string, masterSecret: string) {
    this.appKey = appKey
    this.masterSecret = masterSecret
  }

  get authHeader(): string {
    const credentials = Buffer.from(`${this.appKey}:${this.masterSecret}`).toString('base64')
    return `Basic ${credentials}`
  }

  async registerDevice(_deviceInfo: { token: string }, _region: TourRegion): Promise<PushRegistration> {
    // JPush device registration is handled client-side via JPush SDK
    return { jpushId: _deviceInfo.token }
  }

  async send(
    userId: string,
    title: string,
    body: string,
    _region: TourRegion,
    data?: Record<string, string>
  ): Promise<void> {
    const payload = {
      platform: 'all',
      audience: { alias: [userId] },
      notification: {
        android: { alert: body, title, extras: data ?? {} },
        ios: { alert: body, extras: data ?? {} },
      },
      message: {
        msg_content: body,
        title,
        extras: data ?? {},
      },
    }

    const res = await fetch(`${this.baseUrl}/push`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`JPush error: ${res.status} ${error}`)
    }
  }

  async sendToMultiple(
    userIds: string[],
    title: string,
    body: string,
    _region: TourRegion,
    data?: Record<string, string>
  ): Promise<void> {
    // JPush supports sending to multiple aliases in one call
    const payload = {
      platform: 'all',
      audience: { alias: userIds },
      notification: {
        android: { alert: body, title, extras: data ?? {} },
        ios: { alert: body, extras: data ?? {} },
      },
    }

    const res = await fetch(`${this.baseUrl}/push`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`JPush batch error: ${res.status} ${error}`)
    }
  }
}

/**
 * Factory: returns the correct push adapter based on tour region
 */
export function createPushAdapter(region: TourRegion): PushAdapter {
  if (region === 'CHINA') {
    const appKey = process.env['JPUSH_APP_KEY']
    const masterSecret = process.env['JPUSH_MASTER_SECRET']
    if (!appKey || !masterSecret) throw new Error('JPUSH_APP_KEY and JPUSH_MASTER_SECRET are required for China tours')
    return new JPushAdapter(appKey, masterSecret)
  }
  const projectId = process.env['FIREBASE_ADMIN_PROJECT_ID']
  const clientEmail = process.env['FIREBASE_ADMIN_CLIENT_EMAIL']
  const privateKey = process.env['FIREBASE_ADMIN_PRIVATE_KEY']
  if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase Admin credentials are required for global tours')
  return new FCMAdapter(projectId, clientEmail, privateKey)
}
