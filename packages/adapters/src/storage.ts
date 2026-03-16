/**
 * Storage adapter with Cloudflare R2 + CDN proxy
 * Cloudflare CDN provides better China connectivity than direct Supabase Storage (AWS)
 */

export interface StorageAdapter {
  upload(path: string, file: Buffer | Blob, contentType: string): Promise<string>
  getUrl(path: string): string
  delete(path: string): Promise<void>
}

/**
 * Cloudflare R2 storage adapter
 * Files stored in R2, served via Cloudflare Worker at media.tripflow.app
 * Much better performance for travelers in China than Supabase Storage direct
 */
export class CloudflareR2Adapter implements StorageAdapter {
  private accountId: string
  private accessKey: string
  private secretKey: string
  private bucket: string
  private cdnUrl: string

  constructor(config: {
    accountId: string
    accessKey: string
    secretKey: string
    bucket: string
    cdnUrl: string
  }) {
    this.accountId = config.accountId
    this.accessKey = config.accessKey
    this.secretKey = config.secretKey
    this.bucket = config.bucket
    this.cdnUrl = config.cdnUrl
  }

  async upload(path: string, file: Buffer | Blob, contentType: string): Promise<string> {
    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${path}`

    const body = file instanceof Blob ? await file.arrayBuffer() : file

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': await this.getAuthHeader('PUT', path, contentType),
      },
      body,
    })

    if (!res.ok) throw new Error(`R2 upload error: ${res.status}`)
    return this.getUrl(path)
  }

  getUrl(path: string): string {
    return `${this.cdnUrl}/${path}`
  }

  async delete(path: string): Promise<void> {
    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${path}`

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': await this.getAuthHeader('DELETE', path, ''),
      },
    })

    if (!res.ok) throw new Error(`R2 delete error: ${res.status}`)
  }

  private async getAuthHeader(_method: string, _path: string, _contentType: string): Promise<string> {
    // AWS Signature V4 for R2 — implement full signing in production
    // Use @aws-sdk/client-s3 or aws4 package
    return `AWS4-HMAC-SHA256 Credential=${this.accessKey}/...`
  }
}

export function createStorageAdapter(): StorageAdapter {
  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID']
  const accessKey = process.env['CLOUDFLARE_R2_ACCESS_KEY']
  const secretKey = process.env['CLOUDFLARE_R2_SECRET_KEY']
  const bucket = process.env['CLOUDFLARE_R2_BUCKET'] ?? 'tripflow-media'
  const cdnUrl = process.env['NEXT_PUBLIC_MEDIA_CDN'] ?? 'https://media.tripflow.app'

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('Cloudflare R2 credentials are required')
  }

  return new CloudflareR2Adapter({ accountId, accessKey, secretKey, bucket, cdnUrl })
}
