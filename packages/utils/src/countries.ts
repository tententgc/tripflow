export interface CountryInfo {
  iso2: string
  nameEn: string
  nameTh: string
  emoji: string
  currency: string
  timezone: string
  emergency: {
    police: string
    ambulance: string
    fire: string
    tourist?: string
  }
  thaiEmbassy?: {
    city: string
    phone: string
    address?: string
  }
}

export const COUNTRIES: Record<string, CountryInfo> = {
  CN: {
    iso2: 'CN',
    nameEn: 'China',
    nameTh: 'จีน',
    emoji: '🇨🇳',
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
    emergency: {
      police: '110',
      ambulance: '120',
      fire: '119',
      tourist: '12301',
    },
    thaiEmbassy: {
      city: 'Beijing',
      phone: '+86-10-6532-4985',
      address: 'No.40, Guanghua Road, Chaoyang District, Beijing',
    },
  },
  JP: {
    iso2: 'JP',
    nameEn: 'Japan',
    nameTh: 'ญี่ปุ่น',
    emoji: '🇯🇵',
    currency: 'JPY',
    timezone: 'Asia/Tokyo',
    emergency: {
      police: '110',
      ambulance: '119',
      fire: '119',
      tourist: '03-3501-0110',
    },
    thaiEmbassy: {
      city: 'Tokyo',
      phone: '+81-3-3222-4101',
    },
  },
  KR: {
    iso2: 'KR',
    nameEn: 'South Korea',
    nameTh: 'เกาหลีใต้',
    emoji: '🇰🇷',
    currency: 'KRW',
    timezone: 'Asia/Seoul',
    emergency: {
      police: '112',
      ambulance: '119',
      fire: '119',
      tourist: '1330',
    },
    thaiEmbassy: {
      city: 'Seoul',
      phone: '+82-2-794-0950',
    },
  },
  TH: {
    iso2: 'TH',
    nameEn: 'Thailand',
    nameTh: 'ไทย',
    emoji: '🇹🇭',
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    emergency: {
      police: '191',
      ambulance: '1669',
      fire: '199',
      tourist: '1155',
    },
  },
  SG: {
    iso2: 'SG',
    nameEn: 'Singapore',
    nameTh: 'สิงคโปร์',
    emoji: '🇸🇬',
    currency: 'SGD',
    timezone: 'Asia/Singapore',
    emergency: {
      police: '999',
      ambulance: '995',
      fire: '995',
    },
    thaiEmbassy: {
      city: 'Singapore',
      phone: '+65-6737-2158',
    },
  },
  FR: {
    iso2: 'FR',
    nameEn: 'France',
    nameTh: 'ฝรั่งเศส',
    emoji: '🇫🇷',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    emergency: {
      police: '17',
      ambulance: '15',
      fire: '18',
      tourist: '112',
    },
    thaiEmbassy: {
      city: 'Paris',
      phone: '+33-1-5698-6000',
    },
  },
  IT: {
    iso2: 'IT',
    nameEn: 'Italy',
    nameTh: 'อิตาลี',
    emoji: '🇮🇹',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    emergency: {
      police: '113',
      ambulance: '118',
      fire: '115',
      tourist: '112',
    },
    thaiEmbassy: {
      city: 'Rome',
      phone: '+39-06-8623-5421',
    },
  },
  GB: {
    iso2: 'GB',
    nameEn: 'United Kingdom',
    nameTh: 'สหราชอาณาจักร',
    emoji: '🇬🇧',
    currency: 'GBP',
    timezone: 'Europe/London',
    emergency: {
      police: '999',
      ambulance: '999',
      fire: '999',
      tourist: '112',
    },
    thaiEmbassy: {
      city: 'London',
      phone: '+44-20-7589-2944',
    },
  },
  DE: {
    iso2: 'DE',
    nameEn: 'Germany',
    nameTh: 'เยอรมนี',
    emoji: '🇩🇪',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    emergency: {
      police: '110',
      ambulance: '112',
      fire: '112',
    },
    thaiEmbassy: {
      city: 'Berlin',
      phone: '+49-30-794-810',
    },
  },
  AU: {
    iso2: 'AU',
    nameEn: 'Australia',
    nameTh: 'ออสเตรเลีย',
    emoji: '🇦🇺',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    emergency: {
      police: '000',
      ambulance: '000',
      fire: '000',
    },
    thaiEmbassy: {
      city: 'Canberra',
      phone: '+61-2-6206-0100',
    },
  },
  US: {
    iso2: 'US',
    nameEn: 'United States',
    nameTh: 'สหรัฐอเมริกา',
    emoji: '🇺🇸',
    currency: 'USD',
    timezone: 'America/New_York',
    emergency: {
      police: '911',
      ambulance: '911',
      fire: '911',
    },
    thaiEmbassy: {
      city: 'Washington D.C.',
      phone: '+1-202-944-3600',
    },
  },
  MY: {
    iso2: 'MY',
    nameEn: 'Malaysia',
    nameTh: 'มาเลเซีย',
    emoji: '🇲🇾',
    currency: 'MYR',
    timezone: 'Asia/Kuala_Lumpur',
    emergency: {
      police: '999',
      ambulance: '999',
      fire: '994',
    },
    thaiEmbassy: {
      city: 'Kuala Lumpur',
      phone: '+60-3-2148-8222',
    },
  },
  HK: {
    iso2: 'HK',
    nameEn: 'Hong Kong',
    nameTh: 'ฮ่องกง',
    emoji: '🇭🇰',
    currency: 'HKD',
    timezone: 'Asia/Hong_Kong',
    emergency: {
      police: '999',
      ambulance: '999',
      fire: '999',
    },
    thaiEmbassy: {
      city: 'Hong Kong',
      phone: '+852-2521-6481',
    },
  },
  TW: {
    iso2: 'TW',
    nameEn: 'Taiwan',
    nameTh: 'ไต้หวัน',
    emoji: '🇹🇼',
    currency: 'TWD',
    timezone: 'Asia/Taipei',
    emergency: {
      police: '110',
      ambulance: '119',
      fire: '119',
      tourist: '0800-011-765',
    },
    thaiEmbassy: {
      city: 'Taipei',
      phone: '+886-2-2581-1979',
    },
  },
  VN: {
    iso2: 'VN',
    nameEn: 'Vietnam',
    nameTh: 'เวียดนาม',
    emoji: '🇻🇳',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    emergency: {
      police: '113',
      ambulance: '115',
      fire: '114',
      tourist: '1800-599-952',
    },
    thaiEmbassy: {
      city: 'Hanoi',
      phone: '+84-24-3823-5092',
    },
  },
}

export const CHINA_EMERGENCY = {
  police: '110',
  ambulance: '120',
  fire: '119',
  tourist: '12301',
  roadside: '122',
  thaiEmbassyBeijing: '+86-10-6532-4985',
  thaiConsulateShanghai: '+86-21-6288-2088',
  thaiConsulateGuangzhou: '+86-20-8385-8988',
  thaiConsulateChengdu: '+86-28-6618-0109',
  thaiConsulateKunming: '+86-871-6316-8916',
  thaiConsulateXiamen: '+86-592-5112-313',
  thaiConsulateQingdao: '+86-532-8389-7000',
} as const

export function getCountryInfo(iso2: string): CountryInfo | undefined {
  return COUNTRIES[iso2.toUpperCase()]
}

export function getCountryNameTh(iso2: string): string {
  return COUNTRIES[iso2.toUpperCase()]?.nameTh ?? iso2
}

export function getCountryEmoji(iso2: string): string {
  return COUNTRIES[iso2.toUpperCase()]?.emoji ?? '🌍'
}
