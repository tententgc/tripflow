import type { TranslationResult } from '@tripflow/types'

export interface TranslateAdapter {
  translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult>
  translateBatch(texts: string[], targetLang: string, sourceLang?: string): Promise<TranslationResult[]>
}

/**
 * DeepL translation adapter — Operator side only (used in Thailand)
 * NOT needed for traveler features — this is for content creation
 */
export class DeepLAdapter implements TranslateAdapter {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    // Free tier uses api-free.deepl.com, paid uses api.deepl.com
    this.baseUrl = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2'
  }

  async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
    const body: Record<string, string | string[]> = {
      text: [text],
      target_lang: targetLang.toUpperCase(),
    }
    if (sourceLang) body['source_lang'] = sourceLang.toUpperCase()

    const res = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`DeepL error: ${res.status}`)

    const data = await res.json() as DeepLResponse
    const translation = data.translations[0]
    if (!translation) throw new Error('No translation returned')

    return {
      text: translation.text,
      detectedLang: translation.detected_source_language,
    }
  }

  async translateBatch(texts: string[], targetLang: string, sourceLang?: string): Promise<TranslationResult[]> {
    const body: Record<string, string | string[]> = {
      text: texts,
      target_lang: targetLang.toUpperCase(),
    }
    if (sourceLang) body['source_lang'] = sourceLang.toUpperCase()

    const res = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`DeepL batch error: ${res.status}`)

    const data = await res.json() as DeepLResponse
    return data.translations.map((t) => ({
      text: t.text,
      detectedLang: t.detected_source_language,
    }))
  }
}

export function createTranslateAdapter(): TranslateAdapter {
  const apiKey = process.env['DEEPL_API_KEY']
  if (!apiKey) throw new Error('DEEPL_API_KEY is required')
  return new DeepLAdapter(apiKey)
}

interface DeepLResponse {
  translations: Array<{ text: string; detected_source_language: string }>
}
