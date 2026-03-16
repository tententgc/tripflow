import type { TourRegion, LatLng, POIResult } from '@tripflow/types'
import { wgs84ToGcj02, gcj02ToWgs84 } from '@tripflow/utils'

export interface MapsAdapter {
  searchNearby(keyword: string, lat: number, lon: number, region: TourRegion): Promise<POIResult[]>
  geocode(address: string, region: TourRegion): Promise<LatLng | null>
  reverseGeocode(lat: number, lon: number, region: TourRegion): Promise<string | null>
}

/**
 * Amap (高德地图) adapter — China only
 * Uses Amap REST API: restapi.amap.com
 * Accessible from within mainland China
 */
export class AmapAdapter implements MapsAdapter {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchNearby(keyword: string, lat: number, lon: number, _region: TourRegion): Promise<POIResult[]> {
    // Convert WGS-84 to GCJ-02 for Amap
    const [gcjLat, gcjLon] = wgs84ToGcj02(lat, lon)
    const location = `${gcjLon},${gcjLat}`

    const url = new URL('https://restapi.amap.com/v3/place/around')
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('keywords', keyword)
    url.searchParams.set('location', location)
    url.searchParams.set('radius', '2000')
    url.searchParams.set('offset', '20')
    url.searchParams.set('page', '1')
    url.searchParams.set('extensions', 'base')
    url.searchParams.set('output', 'json')

    const res = await fetch(url.toString())
    const data = await res.json() as AmapSearchResponse

    if (data.status !== '1' || !data.pois) return []

    return data.pois.map((poi) => {
      const [pLon, pLat] = poi.location.split(',').map(Number) as [number, number]
      // Convert back from GCJ-02 to WGS-84 for storage
      const [wgsLat, wgsLon] = gcj02ToWgs84(pLat, pLon)
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        lat: wgsLat,
        lon: wgsLon,
        category: poi.type,
        phone: poi.tel,
      }
    })
  }

  async geocode(address: string, _region: TourRegion): Promise<LatLng | null> {
    const url = new URL('https://restapi.amap.com/v3/geocode/geo')
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('address', address)
    url.searchParams.set('output', 'json')

    const res = await fetch(url.toString())
    const data = await res.json() as AmapGeocodeResponse

    if (data.status !== '1' || !data.geocodes?.[0]) return null

    const [gcjLon, gcjLat] = data.geocodes[0].location.split(',').map(Number) as [number, number]
    const [wgsLat, wgsLon] = gcj02ToWgs84(gcjLat, gcjLon)
    return { lat: wgsLat, lon: wgsLon }
  }

  async reverseGeocode(lat: number, lon: number, _region: TourRegion): Promise<string | null> {
    const [gcjLat, gcjLon] = wgs84ToGcj02(lat, lon)
    const location = `${gcjLon},${gcjLat}`

    const url = new URL('https://restapi.amap.com/v3/geocode/regeo')
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('location', location)
    url.searchParams.set('output', 'json')

    const res = await fetch(url.toString())
    const data = await res.json() as AmapRegeoResponse

    if (data.status !== '1') return null
    return data.regeocode?.formatted_address ?? null
  }
}

/**
 * Mapbox adapter — Global (non-China) only
 * Uses Mapbox Geocoding API
 */
export class MapboxAdapter implements MapsAdapter {
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async searchNearby(keyword: string, lat: number, lon: number, _region: TourRegion): Promise<POIResult[]> {
    const proximity = `${lon},${lat}`
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(keyword)}.json`)
    url.searchParams.set('access_token', this.token)
    url.searchParams.set('proximity', proximity)
    url.searchParams.set('limit', '10')
    url.searchParams.set('types', 'poi')

    const res = await fetch(url.toString())
    const data = await res.json() as MapboxSearchResponse

    return (data.features ?? []).map((f) => ({
      id: f.id,
      name: f.text,
      address: f.place_name,
      lat: f.center[1] as number,
      lon: f.center[0] as number,
      category: f.properties?.category,
    }))
  }

  async geocode(address: string, _region: TourRegion): Promise<LatLng | null> {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`)
    url.searchParams.set('access_token', this.token)
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString())
    const data = await res.json() as MapboxSearchResponse

    const feature = data.features?.[0]
    if (!feature) return null
    return { lat: feature.center[1] as number, lon: feature.center[0] as number }
  }

  async reverseGeocode(lat: number, lon: number, _region: TourRegion): Promise<string | null> {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json`)
    url.searchParams.set('access_token', this.token)
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString())
    const data = await res.json() as MapboxSearchResponse

    return data.features?.[0]?.place_name ?? null
  }
}

/**
 * Factory: returns the correct maps adapter based on tour region
 */
export function createMapsAdapter(region: TourRegion): MapsAdapter {
  if (region === 'CHINA') {
    const key = process.env['AMAP_SERVER_KEY']
    if (!key) throw new Error('AMAP_SERVER_KEY is required for China tours')
    return new AmapAdapter(key)
  }
  const token = process.env['NEXT_PUBLIC_MAPBOX_TOKEN']
  if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is required for global tours')
  return new MapboxAdapter(token)
}

// Type definitions for API responses
interface AmapSearchResponse {
  status: string
  pois?: Array<{ id: string; name: string; location: string; address: string; type: string; tel?: string }>
}

interface AmapGeocodeResponse {
  status: string
  geocodes?: Array<{ location: string }>
}

interface AmapRegeoResponse {
  status: string
  regeocode?: { formatted_address: string }
}

interface MapboxSearchResponse {
  features?: Array<{
    id: string
    text: string
    place_name: string
    center: number[]
    properties?: { category?: string }
  }>
}
