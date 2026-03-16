import type { FlightStatus } from '@tripflow/types'
import { isChineseAirline } from '@tripflow/utils'

export interface FlightAdapter {
  getStatus(flightNo: string, date: string, airlineIata?: string): Promise<FlightStatus>
}

/**
 * AviationStack adapter — International flights
 * Better for: TG, QR, EK, CX, SQ etc.
 */
export class AviationStackAdapter implements FlightAdapter {
  private apiKey: string
  private baseUrl = 'http://api.aviationstack.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getStatus(flightNo: string, date: string, _airlineIata?: string): Promise<FlightStatus> {
    const url = new URL(`${this.baseUrl}/flights`)
    url.searchParams.set('access_key', this.apiKey)
    url.searchParams.set('flight_iata', flightNo)
    url.searchParams.set('flight_date', date)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`AviationStack error: ${res.status}`)

    const data = await res.json() as AviationStackResponse
    const flight = data.data?.[0]

    if (!flight) {
      return {
        flightNo,
        status: 'UNKNOWN',
        departureScheduled: '',
        arrivalScheduled: '',
      }
    }

    const statusMap: Record<string, FlightStatus['status']> = {
      scheduled: 'ON_TIME',
      active: 'DEPARTED',
      landed: 'LANDED',
      cancelled: 'CANCELLED',
      incident: 'UNKNOWN',
      diverted: 'UNKNOWN',
    }

    return {
      flightNo,
      status: statusMap[flight.flight_status] ?? 'UNKNOWN',
      departureScheduled: flight.departure.scheduled ?? '',
      arrivalScheduled: flight.arrival.scheduled ?? '',
      ...(flight.departure.actual != null && { departureActual: flight.departure.actual }),
      ...(flight.arrival.actual != null && { arrivalActual: flight.arrival.actual }),
      ...(flight.departure.gate != null && { gate: flight.departure.gate }),
      ...(flight.departure.terminal != null && { terminal: flight.departure.terminal }),
      ...(flight.departure.delay != null && { delayMinutes: flight.departure.delay }),
    }
  }
}

/**
 * VariFlight (航班管家) adapter — Chinese airlines only
 * Better data for: CA (Air China), MU (China Eastern), CZ (China Southern), 3U (Sichuan)
 */
export class VariFlightAdapter implements FlightAdapter {
  private apiKey: string
  private baseUrl = 'https://opendata.variflight.com/api'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getStatus(flightNo: string, date: string, _airlineIata?: string): Promise<FlightStatus> {
    const appid = this.apiKey
    const time = Math.floor(Date.now() / 1000).toString()

    const url = new URL(`${this.baseUrl}/flight/oneway`)
    url.searchParams.set('appid', appid)
    url.searchParams.set('time', time)
    url.searchParams.set('FlightNo', flightNo)
    url.searchParams.set('date', date)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`VariFlight error: ${res.status}`)

    const data = await res.json() as VariFlightResponse
    const flight = data.data?.FlightList?.[0]

    if (!flight) {
      return {
        flightNo,
        status: 'UNKNOWN',
        departureScheduled: '',
        arrivalScheduled: '',
      }
    }

    // VariFlight status codes: 0=unknown, 1=scheduled, 2=departed, 3=landed, 4=cancelled, 5=delayed
    const statusMap: Record<number, FlightStatus['status']> = {
      0: 'UNKNOWN',
      1: 'ON_TIME',
      2: 'DEPARTED',
      3: 'LANDED',
      4: 'CANCELLED',
      5: 'DELAYED',
    }

    return {
      flightNo,
      status: statusMap[flight.FlightStatus] ?? 'UNKNOWN',
      departureScheduled: flight.DepartureTime ?? '',
      arrivalScheduled: flight.ArrivalTime ?? '',
      ...(flight.ActualDepartureTime != null && { departureActual: flight.ActualDepartureTime }),
      ...(flight.ActualArrivalTime != null && { arrivalActual: flight.ActualArrivalTime }),
      ...(flight.DepartureGate != null && { gate: flight.DepartureGate }),
      ...(flight.DepartureTerminal != null && { terminal: flight.DepartureTerminal }),
      ...(flight.DelayTime != null && { delayMinutes: flight.DelayTime }),
    }
  }
}

/**
 * Smart flight adapter — auto-selects VariFlight for Chinese airlines, AviationStack for others
 */
export class SmartFlightAdapter implements FlightAdapter {
  private aviationStack: AviationStackAdapter
  private variFlight: VariFlightAdapter

  constructor(aviationStackKey: string, variFlightKey: string) {
    this.aviationStack = new AviationStackAdapter(aviationStackKey)
    this.variFlight = new VariFlightAdapter(variFlightKey)
  }

  async getStatus(flightNo: string, date: string, airlineIata?: string): Promise<FlightStatus> {
    const iata = airlineIata ?? flightNo.slice(0, 2)
    if (isChineseAirline(iata)) {
      return this.variFlight.getStatus(flightNo, date, airlineIata)
    }
    return this.aviationStack.getStatus(flightNo, date, airlineIata)
  }
}

/**
 * Factory: creates smart flight adapter
 */
export function createFlightAdapter(): FlightAdapter {
  const aviationKey = process.env['AVIATIONSTACK_API_KEY']
  const variKey = process.env['VARIFLIGHT_API_KEY']

  if (aviationKey && variKey) {
    return new SmartFlightAdapter(aviationKey, variKey)
  }
  if (aviationKey) {
    return new AviationStackAdapter(aviationKey)
  }
  if (variKey) {
    return new VariFlightAdapter(variKey)
  }
  throw new Error('At least one flight API key (AVIATIONSTACK_API_KEY or VARIFLIGHT_API_KEY) is required')
}

// Type definitions
interface AviationStackResponse {
  data?: Array<{
    flight_status: string
    departure: { scheduled?: string; actual?: string; gate?: string; terminal?: string; delay?: number }
    arrival: { scheduled?: string; actual?: string }
  }>
}

interface VariFlightResponse {
  data?: {
    FlightList?: Array<{
      FlightStatus: number
      DepartureTime?: string
      ActualDepartureTime?: string
      ArrivalTime?: string
      ActualArrivalTime?: string
      DepartureGate?: string
      DepartureTerminal?: string
      DelayTime?: number
    }>
  }
}
