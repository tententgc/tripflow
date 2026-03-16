// Re-export all types from database
export type {
  Operator,
  OperatorStaff,
  User,
  Tour,
  TourMember,
  TourDay,
  Activity,
  Transport,
  FlightInfo,
  Accommodation,
  UsefulPhrase,
  Checklist,
  ChecklistItem,
  ChecklistCheck,
  DayChecklistItem,
  Expense,
  ExpenseParticipant,
  ImportantContact,
  EmergencyInfo,
  TourDocument,
  Notification,
  ChatMessage,
  SystemRole,
  StaffRole,
  MemberRole,
  PlanTier,
  TourStatus,
  ActivityCategory,
  TransportType,
  ChecklistType,
  ContactType,
  DocumentType,
  ExpenseCategory,
  PhraseCategory,
  NotificationType,
  ChatRole,
} from '@tripflow/database'

export type TourRegion = 'CHINA' | 'GLOBAL'

export interface LatLng {
  lat: number
  lon: number
}

export interface MapOptions {
  zoom?: number
  showTraffic?: boolean
}

export interface MapInstance {
  setCenter(lat: number, lon: number): void
  addMarker(lat: number, lon: number, options: MarkerOptions): void
  destroy(): void
}

export interface MarkerOptions {
  title?: string
  color?: string
  icon?: string
}

export interface POIResult {
  id: string
  name: string
  nameLocal?: string
  address?: string
  lat: number
  lon: number
  category?: string
  rating?: number
  phone?: string
}

export interface WeatherForecast {
  current: {
    temp: number
    feelsLike: number
    humidity: number
    description: string
    icon: string
    windSpeed: number
  }
  daily: Array<{
    date: string
    tempMin: number
    tempMax: number
    description: string
    icon: string
    precipitation: number
  }>
}

export interface FlightStatus {
  flightNo: string
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'DEPARTED' | 'LANDED' | 'UNKNOWN'
  departureScheduled: string
  departureActual?: string
  arrivalScheduled: string
  arrivalActual?: string
  gate?: string
  terminal?: string
  delayMinutes?: number
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface PushRegistration {
  fcmToken?: string
  jpushId?: string
}

export interface ExchangeRate {
  base: string
  rates: Record<string, number>
  lastUpdated: Date
}

export interface TranslationResult {
  text: string
  detectedLang?: string
}
