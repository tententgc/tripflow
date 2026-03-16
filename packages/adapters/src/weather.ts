import type { TourRegion, WeatherForecast } from '@tripflow/types'

export interface WeatherAdapter {
  getForecast(lat: number, lon: number, region: TourRegion): Promise<WeatherForecast>
  getCurrentWeather(lat: number, lon: number, region: TourRegion): Promise<WeatherForecast['current']>
}

/**
 * Caiyun Weather (彩云天气) adapter — China only
 * API: api.caiyunapp.com — accessible inside China
 */
export class CaiyunAdapter implements WeatherAdapter {
  private token: string
  private baseUrl = 'https://api.caiyunapp.com/v2.6'

  constructor(token: string) {
    this.token = token
  }

  async getForecast(lat: number, lon: number, _region: TourRegion): Promise<WeatherForecast> {
    const url = `${this.baseUrl}/${this.token}/${lon},${lat}/weather?alert=true&dailysteps=7&hourlysteps=24&unit=metric:v2`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Caiyun weather API error: ${res.status}`)

    const data = await res.json() as CaiyunResponse

    const realtime = data.result.realtime
    const daily = data.result.daily

    return {
      current: {
        temp: realtime.temperature,
        feelsLike: realtime.apparent_temperature,
        humidity: realtime.humidity * 100,
        description: this.getSkyconDescription(realtime.skycon),
        icon: this.getSkyconIcon(realtime.skycon),
        windSpeed: realtime.wind.speed,
      },
      daily: daily.temperature.map((t, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0] as string,
        tempMin: t.min,
        tempMax: t.max,
        description: this.getSkyconDescription(daily.skycon[i]?.value ?? 'CLEAR_DAY'),
        icon: this.getSkyconIcon(daily.skycon[i]?.value ?? 'CLEAR_DAY'),
        precipitation: daily.precipitation[i]?.max ?? 0,
      })),
    }
  }

  async getCurrentWeather(lat: number, lon: number, region: TourRegion): Promise<WeatherForecast['current']> {
    const forecast = await this.getForecast(lat, lon, region)
    return forecast.current
  }

  private getSkyconDescription(skycon: string): string {
    const descriptions: Record<string, string> = {
      CLEAR_DAY: 'ท้องฟ้าแจ่มใส',
      CLEAR_NIGHT: 'ท้องฟ้าแจ่มใส (กลางคืน)',
      PARTLY_CLOUDY_DAY: 'มีเมฆบางส่วน',
      PARTLY_CLOUDY_NIGHT: 'มีเมฆบางส่วน (กลางคืน)',
      CLOUDY: 'เมฆมาก',
      LIGHT_HAZE: 'หมอกควันเบา',
      MODERATE_HAZE: 'หมอกควันปานกลาง',
      HEAVY_HAZE: 'หมอกควันหนัก',
      LIGHT_RAIN: 'ฝนเบา',
      MODERATE_RAIN: 'ฝนปานกลาง',
      HEAVY_RAIN: 'ฝนหนัก',
      STORM_RAIN: 'ฝนพายุ',
      FOG: 'หมอก',
      LIGHT_SNOW: 'หิมะเบา',
      MODERATE_SNOW: 'หิมะปานกลาง',
      HEAVY_SNOW: 'หิมะหนัก',
      STORM_SNOW: 'พายุหิมะ',
      DUST: 'พายุฝุ่น',
      SAND: 'พายุทราย',
      WIND: 'ลมแรง',
    }
    return descriptions[skycon] ?? skycon
  }

  private getSkyconIcon(skycon: string): string {
    const icons: Record<string, string> = {
      CLEAR_DAY: '01d',
      CLEAR_NIGHT: '01n',
      PARTLY_CLOUDY_DAY: '02d',
      PARTLY_CLOUDY_NIGHT: '02n',
      CLOUDY: '04d',
      LIGHT_HAZE: '50d',
      MODERATE_HAZE: '50d',
      HEAVY_HAZE: '50d',
      LIGHT_RAIN: '10d',
      MODERATE_RAIN: '10d',
      HEAVY_RAIN: '09d',
      STORM_RAIN: '11d',
      FOG: '50d',
      LIGHT_SNOW: '13d',
      MODERATE_SNOW: '13d',
      HEAVY_SNOW: '13d',
      STORM_SNOW: '13d',
      DUST: '50d',
      SAND: '50d',
      WIND: '50d',
    }
    return icons[skycon] ?? '01d'
  }
}

/**
 * OpenWeatherMap adapter — Global (non-China) only
 */
export class OpenWeatherAdapter implements WeatherAdapter {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/3.0/onecall'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getForecast(lat: number, lon: number, _region: TourRegion): Promise<WeatherForecast> {
    const url = new URL(this.baseUrl)
    url.searchParams.set('lat', lat.toString())
    url.searchParams.set('lon', lon.toString())
    url.searchParams.set('appid', this.apiKey)
    url.searchParams.set('units', 'metric')
    url.searchParams.set('lang', 'th')
    url.searchParams.set('exclude', 'minutely,hourly,alerts')

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`OpenWeather API error: ${res.status}`)

    const data = await res.json() as OpenWeatherResponse

    return {
      current: {
        temp: data.current.temp,
        feelsLike: data.current.feels_like,
        humidity: data.current.humidity,
        description: data.current.weather[0]?.description ?? '',
        icon: data.current.weather[0]?.icon ?? '01d',
        windSpeed: data.current.wind_speed,
      },
      daily: (data.daily ?? []).slice(0, 7).map((d) => ({
        date: new Date(d.dt * 1000).toISOString().split('T')[0] as string,
        tempMin: d.temp.min,
        tempMax: d.temp.max,
        description: d.weather[0]?.description ?? '',
        icon: d.weather[0]?.icon ?? '01d',
        precipitation: d.rain ?? 0,
      })),
    }
  }

  async getCurrentWeather(lat: number, lon: number, region: TourRegion): Promise<WeatherForecast['current']> {
    const forecast = await this.getForecast(lat, lon, region)
    return forecast.current
  }
}

/**
 * Factory: returns the correct weather adapter based on tour region
 */
export function createWeatherAdapter(region: TourRegion): WeatherAdapter {
  if (region === 'CHINA') {
    const token = process.env['CAIYUN_WEATHER_TOKEN']
    if (!token) throw new Error('CAIYUN_WEATHER_TOKEN is required for China tours')
    return new CaiyunAdapter(token)
  }
  const apiKey = process.env['OPENWEATHER_API_KEY']
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY is required for global tours')
  return new OpenWeatherAdapter(apiKey)
}

// Type definitions
interface CaiyunResponse {
  result: {
    realtime: {
      temperature: number
      apparent_temperature: number
      humidity: number
      skycon: string
      wind: { speed: number; direction: number }
    }
    daily: {
      temperature: Array<{ min: number; max: number }>
      skycon: Array<{ value: string; date: string }>
      precipitation: Array<{ max: number }>
    }
  }
}

interface OpenWeatherResponse {
  current: {
    temp: number
    feels_like: number
    humidity: number
    wind_speed: number
    weather: Array<{ description: string; icon: string }>
  }
  daily?: Array<{
    dt: number
    temp: { min: number; max: number }
    weather: Array<{ description: string; icon: string }>
    rain?: number
  }>
}
