import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create operator
  const operator = await db.operator.upsert({
    where: { id: 'op-default' },
    update: {},
    create: {
      id: 'op-default',
      name: 'TripFlow Tours',
      nameEn: 'TripFlow Tours',
      email: 'admin@tripflow.app',
      phone: '+66-2-000-0000',
      lineId: 'tripflow_tours',
    },
  })
  console.log('✓ Operator:', operator.name)

  // ─────────────────────────────────────────────────────────────
  // ADMIN STAFF — set ADMIN_EMAIL in .env to auto-grant access
  // ─────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    let adminUser = await db.user.findUnique({ where: { email: adminEmail } })
    if (!adminUser) {
      adminUser = await db.user.create({
        data: { email: adminEmail, name: 'Admin', systemRole: 'SUPER_ADMIN' },
      })
    } else {
      await db.user.update({ where: { id: adminUser.id }, data: { systemRole: 'SUPER_ADMIN' } })
    }
    await db.operatorStaff.upsert({
      where: { operatorId_userId: { operatorId: operator.id, userId: adminUser.id } },
      update: {},
      create: { operatorId: operator.id, userId: adminUser.id, role: 'OWNER' },
    })
    console.log('✓ Admin staff:', adminEmail)
  } else {
    console.log('⚠ ADMIN_EMAIL not set — skip admin staff seed')
  }

  // ─────────────────────────────────────────────────────────────
  // CHINA TOUR
  // ─────────────────────────────────────────────────────────────
  const chinaTour = await db.tour.upsert({
    where: { tourCode: 'CN2026-04' },
    update: {},
    create: {
      operatorId: operator.id,
      title: 'ทัวร์จีน ปักกิ่ง-กำแพงเมืองจีน 6 วัน 5 คืน',
      titleEn: 'Beijing Great Wall China Tour 6D5N',
      countries: ['CN'],
      primaryCountry: 'CN',
      cities: ['ปักกิ่ง', 'Beijing'],
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-15'),
      timezone: 'Asia/Shanghai',
      isChina: true,
      tourCode: 'CN2026-04',
      status: 'PUBLISHED',
      maxMembers: 30,
      currency: 'THB',
      destCurrency: 'CNY',
      description: 'ทัวร์กลุ่มปักกิ่ง เยี่ยมชมกำแพงเมืองจีน พระราชวังต้องห้าม จัตุรัสเทียนอันเหมิน',
    },
  })
  console.log('✓ China Tour:', chinaTour.title)

  const chinaDaysData = [
    { dayNumber: 1, date: new Date('2026-04-10'), title: 'วันที่ 1 — ออกเดินทางจากกรุงเทพฯ', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: false, mealLunch: false, mealDinner: true },
    { dayNumber: 2, date: new Date('2026-04-11'), title: 'วันที่ 2 — จัตุรัสเทียนอันเหมิน + พระราชวังต้องห้าม', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: true, mealLunch: true, mealDinner: true },
    { dayNumber: 3, date: new Date('2026-04-12'), title: 'วันที่ 3 — กำแพงเมืองจีน (บาดาหลิ่ง)', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: true, mealLunch: true, mealDinner: true },
    { dayNumber: 4, date: new Date('2026-04-13'), title: 'วันที่ 4 — วัดสวรรค์ + ย่านหวังฝูจิ่ง', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: true, mealLunch: true, mealDinner: false },
    { dayNumber: 5, date: new Date('2026-04-14'), title: 'วันที่ 5 — Summer Palace + ถนนเหล่าซื่อมู่เตอร์', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: true, mealLunch: true, mealDinner: true },
    { dayNumber: 6, date: new Date('2026-04-15'), title: 'วันที่ 6 — เดินทางกลับกรุงเทพฯ', country: 'CN', city: 'ปักกิ่ง', mealBreakfast: true, mealLunch: false, mealDinner: false },
  ]

  for (const dayData of chinaDaysData) {
    const day = await db.tourDay.upsert({
      where: { id: `day-china-${dayData.dayNumber}` },
      update: dayData,
      create: { id: `day-china-${dayData.dayNumber}`, tourId: chinaTour.id, ...dayData },
    })

    if (dayData.dayNumber === 2) {
      await db.activity.upsert({ where: { id: 'act-tiananmen' }, update: {}, create: { id: 'act-tiananmen', tourDayId: day.id, order: 0, time: '09:00', title: 'จัตุรัสเทียนอันเหมิน', titleEn: 'Tiananmen Square', titleLocal: '天安门广场', category: 'SIGHTSEEING', latitude: 39.9055, longitude: 116.3976, tips: 'ต้องแสดงพาสปอร์ตเพื่อเข้าพื้นที่' } })
      await db.activity.upsert({ where: { id: 'act-forbidden' }, update: {}, create: { id: 'act-forbidden', tourDayId: day.id, order: 1, time: '10:30', title: 'พระราชวังต้องห้าม', titleEn: 'Forbidden City', titleLocal: '故宫博物院', category: 'SIGHTSEEING', latitude: 39.9169, longitude: 116.3907, tips: 'ต้องจองตั๋วออนไลน์ล่วงหน้า' } })
      await db.activity.upsert({ where: { id: 'act-duck' }, update: {}, create: { id: 'act-duck', tourDayId: day.id, order: 2, time: '12:30', title: 'รับประทานอาหารกลางวัน — เป็ดปักกิ่ง', titleEn: 'Lunch — Peking Duck', titleLocal: '北京烤鸭', category: 'FOOD', latitude: 39.9128, longitude: 116.3944 } })
    }
    if (dayData.dayNumber === 3) {
      await db.activity.upsert({ where: { id: 'act-wall' }, update: {}, create: { id: 'act-wall', tourDayId: day.id, order: 0, time: '08:30', title: 'กำแพงเมืองจีน บาดาหลิ่ง', titleEn: 'Great Wall — Badaling', titleLocal: '八达岭长城', category: 'SIGHTSEEING', latitude: 40.3544, longitude: 116.0199, durationMins: 180, tips: 'สวมรองเท้าที่สะดวก ลาดชันมาก' } })
      await db.activity.upsert({ where: { id: 'act-wall-lunch' }, update: {}, create: { id: 'act-wall-lunch', tourDayId: day.id, order: 1, time: '12:00', title: 'อาหารกลางวันร้านอาหารท้องถิ่น', category: 'FOOD', latitude: 40.35, longitude: 116.02 } })
    }

    if (dayData.dayNumber >= 1 && dayData.dayNumber <= 5) {
      await db.accommodation.upsert({
        where: { tourDayId: day.id },
        update: {},
        create: {
          tourDayId: day.id,
          name: 'Holiday Inn Beijing Central Plaza',
          nameLocal: '北京中环假日酒店',
          address: 'No. 26 Zhuanghui Road, Chaoyang District, Beijing',
          addressLocal: '北京市朝阳区庄惠路26号',
          country: 'CN',
          city: 'Beijing',
          phone: '+86-10-8595-8888',
          checkIn: '14:00',
          checkOut: '12:00',
          wifiName: 'HolidayInn_Guest',
          wifiPassword: '88888888',
          breakfastInfo: 'อาหารเช้าบุฟเฟ่ต์ ชั้น 2 เวลา 06:30-10:00',
        },
      })
    }
  }

  // Transports for China day 1
  await db.transport.upsert({
    where: { id: 'tr-cn-bkk-pek' },
    update: {},
    create: {
      id: 'tr-cn-bkk-pek',
      tourDayId: 'day-china-1',
      order: 0,
      type: 'FLIGHT',
      from: 'สนามบินสุวรรณภูมิ',
      fromEn: 'Suvarnabhumi Airport',
      fromLocal: '素万那普机场',
      fromCode: 'BKK',
      to: 'สนามบินนานาชาติปักกิ่ง',
      toEn: 'Beijing Capital International Airport',
      toLocal: '北京首都国际机场',
      toCode: 'PEK',
      departTime: '09:30',
      arriveTime: '14:55',
      duration: '5h 25m',
      flightNo: 'TG614',
      airline: 'Thai Airways',
      terminal: 'T2',
    },
  })

  await db.importantContact.upsert({ where: { id: 'contact-guide-cn' }, update: {}, create: { id: 'contact-guide-cn', tourId: chinaTour.id, name: 'คุณหลี่ หมิง (ไกด์จีน)', nameLocal: '李明', phone: '+86-138-0000-1234', wechat: 'liming_guide', type: 'LOCAL_GUIDE', notes: 'ไกด์ท้องถิ่นปักกิ่ง พูดภาษาไทยได้บ้าง' } })
  await db.importantContact.upsert({ where: { id: 'contact-thai-guide' }, update: {}, create: { id: 'contact-thai-guide', tourId: chinaTour.id, name: 'ป้าสมใจ (ไกด์ไทย)', phone: '+66-89-000-0001', wechat: 'somjai_thai', line: 'somjai_th', type: 'THAI_GUIDE', notes: 'หัวหน้าทัวร์ไทย โทรได้ตลอด 24 ชั่วโมง' } })

  const cnPhrases = [
    { id: 'ph-cn-1', category: 'EMERGENCY', thai: 'ช่วยด้วย!', english: 'Help!', local: '救命!', localPinyin: 'Jiùmìng!' },
    { id: 'ph-cn-2', category: 'DIRECTIONS', thai: 'ห้องน้ำอยู่ที่ไหน', english: 'Where is the toilet?', local: '厕所在哪里？', localPinyin: 'Cèsuǒ zài nǎlǐ?' },
    { id: 'ph-cn-3', category: 'FOOD', thai: 'ฉันกินเผ็ดไม่ได้', english: 'No spicy food', local: '我不能吃辣', localPinyin: 'Wǒ bù néng chī là' },
    { id: 'ph-cn-4', category: 'FOOD', thai: 'ไม่กินหมู', english: 'No pork', local: '我不吃猪肉', localPinyin: 'Wǒ bù chī zhūròu' },
    { id: 'ph-cn-5', category: 'FOOD', thai: 'อร่อยมาก!', english: 'Very delicious!', local: '非常好吃！', localPinyin: 'Fēicháng hǎochī!' },
    { id: 'ph-cn-6', category: 'SHOPPING', thai: 'ลดราคาได้ไหม', english: 'Can you lower the price?', local: '可以便宜一点吗？', localPinyin: 'Kěyǐ piányí yīdiǎn ma?' },
    { id: 'ph-cn-7', category: 'SHOPPING', thai: 'ราคาเท่าไร', english: 'How much?', local: '多少钱？', localPinyin: 'Duōshǎo qián?' },
    { id: 'ph-cn-8', category: 'TRANSPORT', thai: 'ไปที่นี่', english: 'Go here', local: '去这里', localPinyin: 'Qù zhèlǐ' },
    { id: 'ph-cn-9', category: 'HOTEL', thai: 'เช็คอิน', english: 'Check in', local: '我要办理入住', localPinyin: 'Wǒ yào bànlǐ rùzhù' },
    { id: 'ph-cn-10', category: 'HOTEL', thai: 'เช็คเอาท์', english: 'Check out', local: '我要办理退房', localPinyin: 'Wǒ yào bànlǐ tuìfáng' },
    { id: 'ph-cn-11', category: 'COURTESY', thai: 'ขอบคุณ', english: 'Thank you', local: '谢谢', localPinyin: 'Xièxiè' },
    { id: 'ph-cn-12', category: 'COURTESY', thai: 'สวัสดี', english: 'Hello', local: '你好', localPinyin: 'Nǐ hǎo' },
    { id: 'ph-cn-13', category: 'NUMBERS', thai: 'หนึ่ง/สอง/สาม', english: 'One/Two/Three', local: '一/二/三', localPinyin: 'Yī / Èr / Sān' },
    { id: 'ph-cn-14', category: 'NUMBERS', thai: 'สิบ', english: 'Ten', local: '十', localPinyin: 'Shí' },
    { id: 'ph-cn-15', category: 'NUMBERS', thai: 'ร้อย', english: 'Hundred', local: '百', localPinyin: 'Bǎi' },
  ]
  for (const [i, p] of cnPhrases.entries()) {
    await db.usefulPhrase.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, tourId: chinaTour.id, category: p.category as any, thai: p.thai, english: p.english, local: p.local, localPinyin: p.localPinyin, order: i } })
  }

  const cnChecklist = await db.checklist.upsert({ where: { id: 'cl-china-prep' }, update: {}, create: { id: 'cl-china-prep', tourId: chinaTour.id, title: 'เตรียมเดินทางจีน', emoji: '🇨🇳', type: 'DEPARTURE', order: 0 } })
  const cnItems = ['พาสปอร์ต (อายุ > 6 เดือน)', 'วีซ่าจีน', 'ประกันเดินทาง', 'แลกเงินหยวน (CNY)', 'ดาวน์โหลดแผนที่ออฟไลน์', 'แจ้งธนาคารก่อนเดินทาง', 'ซื้อซิมการ์ดจีน / พ็อกเก็ตไวไฟ', 'เตรียมยาประจำตัว', 'ถ่ายรูปใบหน้าหน้าพาสปอร์ต']
  for (const [i, label] of cnItems.entries()) {
    await db.checklistItem.upsert({ where: { id: `cli-china-${i}` }, update: {}, create: { id: `cli-china-${i}`, checklistId: cnChecklist.id, label, order: i, isImportant: i < 3 } })
  }

  await db.emergencyInfo.upsert({
    where: { tourId: chinaTour.id },
    update: {},
    create: {
      tourId: chinaTour.id,
      emergencyNumbers: { CN: { police: '110', ambulance: '120', fire: '119', tourist: '12301' } },
      embassyContacts: { Beijing: '+86-10-6532-4985', Shanghai: '+86-21-6288-2088' },
      thaiEmbassyPhone: '+86-10-6532-4985',
      thaiEmbassyAddress: 'No. 40 Guanghua Road, Chaoyang District, Beijing',
      chinaVisaHotline: '12301',
    },
  })
  console.log('✓ China tour complete')

  // ─────────────────────────────────────────────────────────────
  // JAPAN TOUR — โตเกียว-ฟูจิ-เกียวโต-โอซาก้า 7 วัน 5 คืน
  // ─────────────────────────────────────────────────────────────
  const japanTour = await db.tour.upsert({
    where: { tourCode: 'JP2026-04' },
    update: {},
    create: {
      operatorId: operator.id,
      title: 'ทัวร์ญี่ปุ่น โตเกียว-ฟูจิ-เกียวโต-โอซาก้า 7 วัน 5 คืน',
      titleEn: 'Japan Tokyo-Fuji-Kyoto-Osaka Tour 7D5N',
      countries: ['JP'],
      primaryCountry: 'JP',
      cities: ['โตเกียว', 'ฟูจิ', 'เกียวโต', 'โอซาก้า'],
      startDate: new Date('2026-04-18'),
      endDate: new Date('2026-04-24'),
      timezone: 'Asia/Tokyo',
      isChina: false,
      tourCode: 'JP2026-04',
      status: 'PUBLISHED',
      maxMembers: 25,
      currency: 'THB',
      destCurrency: 'JPY',
      description: 'ทัวร์กลุ่มญี่ปุ่น ชมซากุระ นั่งชินคันเซน เยี่ยมชมวัดเกียวโต ช้อปปิ้งโอซาก้า',
    },
  })
  console.log('✓ Japan Tour:', japanTour.title)

  const japanDaysData = [
    {
      id: 'day-jp-1',
      dayNumber: 1,
      date: new Date('2026-04-18'),
      title: 'วันที่ 1 — บินถึงโตเกียว ชินจูกุ',
      country: 'JP',
      city: 'โตเกียว',
      summary: 'เดินทางถึงสนามบินนาริตะ เช็คอินโรงแรม เดินเล่นย่านชินจูกุ ลองราเมน',
      mealBreakfast: false,
      mealLunch: false,
      mealDinner: true,
    },
    {
      id: 'day-jp-2',
      dayNumber: 2,
      date: new Date('2026-04-19'),
      title: 'วันที่ 2 — โตเกียว: อาซากุสะ + ชิบุย่า + อากิฮาบาระ',
      country: 'JP',
      city: 'โตเกียว',
      summary: 'เยี่ยมวัดเซ็นโซจิ ข้ามถนนชิบุย่า ช้อปปิ้งอากิฮาบาระ ขึ้น Tokyo Skytree',
      mealBreakfast: true,
      mealLunch: true,
      mealDinner: true,
    },
    {
      id: 'day-jp-3',
      dayNumber: 3,
      date: new Date('2026-04-20'),
      title: 'วันที่ 3 — ภูเขาไฟฟูจิ + ทะเลสาบคาวากุจิโกะ',
      country: 'JP',
      city: 'ฟูจิ',
      summary: 'นั่งรถบัสไปพื้นที่ฟูจิ ชมภูเขาไฟฟูจิจากชั้น 5 เที่ยวทะเลสาบ Kawaguchiko',
      mealBreakfast: true,
      mealLunch: true,
      mealDinner: true,
    },
    {
      id: 'day-jp-4',
      dayNumber: 4,
      date: new Date('2026-04-21'),
      title: 'วันที่ 4 — ชินคันเซนสู่เกียวโต + วัดคินคาคุจิ',
      country: 'JP',
      city: 'เกียวโต',
      summary: 'นั่งชินคันเซนจากโตเกียวสู่เกียวโต ชมวัดทองคำ Kinkaku-ji ถนน Nishiki Market',
      mealBreakfast: true,
      mealLunch: true,
      mealDinner: false,
    },
    {
      id: 'day-jp-5',
      dayNumber: 5,
      date: new Date('2026-04-22'),
      title: 'วันที่ 5 — เกียวโต: อาราชิยามะ + ฟูชิมิ อินาริ',
      country: 'JP',
      city: 'เกียวโต',
      summary: 'ป่าไผ่อาราชิยามะ ศาลเจ้าฟูชิมิอินาริ (โทริ 1,000 ต้น) ตลาด Nishiki',
      mealBreakfast: true,
      mealLunch: true,
      mealDinner: true,
    },
    {
      id: 'day-jp-6',
      dayNumber: 6,
      date: new Date('2026-04-23'),
      title: 'วันที่ 6 — โอซาก้า: ปราสาท + โดตงโบริ',
      country: 'JP',
      city: 'โอซาก้า',
      summary: 'นั่งรถไฟไปโอซาก้า ชมปราสาทโอซาก้า กินทาโกยากิ เดินถนนโดตงโบริ',
      mealBreakfast: true,
      mealLunch: true,
      mealDinner: false,
    },
    {
      id: 'day-jp-7',
      dayNumber: 7,
      date: new Date('2026-04-24'),
      title: 'วันที่ 7 — เดินทางกลับกรุงเทพฯ',
      country: 'JP',
      city: 'โอซาก้า',
      summary: 'ช้อปปิ้งเช้า เดินทางสนามบินคันไซ บินกลับกรุงเทพฯ',
      mealBreakfast: true,
      mealLunch: false,
      mealDinner: false,
    },
  ]

  for (const dayData of japanDaysData) {
    const { id: dayId, ...rest } = dayData
    await db.tourDay.upsert({
      where: { id: dayId },
      update: rest,
      create: { id: dayId, tourId: japanTour.id, ...rest },
    })
  }

  // Activities — Day 1
  await db.activity.upsert({ where: { id: 'jp-act-1-1' }, update: {}, create: { id: 'jp-act-1-1', tourDayId: 'day-jp-1', order: 0, time: '14:30', title: 'รับสัมภาระ เช็คอินโรงแรม', category: 'ACCOMMODATION', latitude: 35.6896, longitude: 139.6921, locationName: 'โรงแรมในชินจูกุ' } })
  await db.activity.upsert({ where: { id: 'jp-act-1-2' }, update: {}, create: { id: 'jp-act-1-2', tourDayId: 'day-jp-1', order: 1, time: '18:00', title: 'เดินเล่นย่านชินจูกุ', titleEn: 'Shinjuku Night Walk', titleLocal: '新宿', category: 'NIGHTLIFE', latitude: 35.6896, longitude: 139.6921, tips: 'ย่านสว่างไสวสวยงาม ระวังสิ่งของมีค่า' } })
  await db.activity.upsert({ where: { id: 'jp-act-1-3' }, update: {}, create: { id: 'jp-act-1-3', tourDayId: 'day-jp-1', order: 2, time: '19:30', title: 'อาหารเย็น — ราเมนอิจิรัง', titleEn: 'Dinner — Ichiran Ramen', titleLocal: '一蘭ラーメン', category: 'FOOD', latitude: 35.6913, longitude: 139.6994, tips: 'นั่งตามลำพัง ต้องกรอกใบสั่งอาหาร มีภาษาไทย' } })

  // Activities — Day 2
  await db.activity.upsert({ where: { id: 'jp-act-2-1' }, update: {}, create: { id: 'jp-act-2-1', tourDayId: 'day-jp-2', order: 0, time: '08:30', title: 'วัดเซ็นโซจิ อาซากุสะ', titleEn: 'Senso-ji Temple Asakusa', titleLocal: '浅草寺', category: 'TEMPLE', latitude: 35.7148, longitude: 139.7967, durationMins: 90, tips: 'สวมชุดสุภาพ ตลาดนาคามิเซ ขายของที่ระลึก', entryType: 'Free' } })
  await db.activity.upsert({ where: { id: 'jp-act-2-2' }, update: {}, create: { id: 'jp-act-2-2', tourDayId: 'day-jp-2', order: 1, time: '10:30', title: 'Tokyo Skytree', titleLocal: '東京スカイツリー', category: 'SIGHTSEEING', latitude: 35.7101, longitude: 139.8107, durationMins: 60, cost: 2100, costCurrency: 'JPY', costTHB: 530, entryType: 'Paid', tips: 'จองออนไลน์ล่วงหน้าลดคิว' } })
  await db.activity.upsert({ where: { id: 'jp-act-2-3' }, update: {}, create: { id: 'jp-act-2-3', tourDayId: 'day-jp-2', order: 2, time: '12:30', title: 'อาหารกลางวัน — ซูชิตลาดปลา', category: 'FOOD', latitude: 35.6654, longitude: 139.7707 } })
  await db.activity.upsert({ where: { id: 'jp-act-2-4' }, update: {}, create: { id: 'jp-act-2-4', tourDayId: 'day-jp-2', order: 3, time: '14:30', title: 'ข้ามถนนชิบุย่า', titleEn: 'Shibuya Crossing', titleLocal: '渋谷スクランブル交差点', category: 'SIGHTSEEING', latitude: 35.6595, longitude: 139.7004, durationMins: 30, entryType: 'Free', tips: 'แยกที่คนพลุกพล่านที่สุดในโลก ถ่ายรูปสวย' } })
  await db.activity.upsert({ where: { id: 'jp-act-2-5' }, update: {}, create: { id: 'jp-act-2-5', tourDayId: 'day-jp-2', order: 4, time: '16:00', title: 'ช้อปปิ้งอากิฮาบาระ', titleEn: 'Akihabara Shopping', titleLocal: '秋葉原', category: 'SHOPPING', latitude: 35.6984, longitude: 139.7731, tips: 'ย่านอิเล็กทรอนิกส์และอนิเมะ ราคาดีกว่าไทยมาก' } })

  // Activities — Day 3 (Fuji)
  await db.activity.upsert({ where: { id: 'jp-act-3-1' }, update: {}, create: { id: 'jp-act-3-1', tourDayId: 'day-jp-3', order: 0, time: '07:30', title: 'นั่งรถบัสจากโตเกียวไปฟูจิ', category: 'TRANSPORT', latitude: 35.3606, longitude: 138.7274, durationMins: 120 } })
  await db.activity.upsert({ where: { id: 'jp-act-3-2' }, update: {}, create: { id: 'jp-act-3-2', tourDayId: 'day-jp-3', order: 1, time: '10:00', title: 'ภูเขาไฟฟูจิ ชั้น 5', titleEn: 'Mt. Fuji 5th Station', titleLocal: '富士山五合目', category: 'NATURE', latitude: 35.3606, longitude: 138.7274, durationMins: 90, tips: 'อากาศเย็น สวมเสื้อกันหนาว ถ่ายรูปสวยมาก' } })
  await db.activity.upsert({ where: { id: 'jp-act-3-3' }, update: {}, create: { id: 'jp-act-3-3', tourDayId: 'day-jp-3', order: 2, time: '12:00', title: 'อาหารกลางวันริมทะเลสาบ Kawaguchiko', titleLocal: '河口湖', category: 'FOOD', latitude: 35.5116, longitude: 138.7573 } })
  await db.activity.upsert({ where: { id: 'jp-act-3-4' }, update: {}, create: { id: 'jp-act-3-4', tourDayId: 'day-jp-3', order: 3, time: '14:00', title: 'ล่องเรือทะเลสาบ Kawaguchiko', titleLocal: '河口湖遊覧船', category: 'NATURE', latitude: 35.5116, longitude: 138.7573, durationMins: 60, cost: 1000, costCurrency: 'JPY', costTHB: 250 } })

  // Activities — Day 4 (Kyoto)
  await db.activity.upsert({ where: { id: 'jp-act-4-1' }, update: {}, create: { id: 'jp-act-4-1', tourDayId: 'day-jp-4', order: 0, time: '07:00', title: 'นั่งชินคันเซน Nozomi โตเกียว → เกียวโต', titleEn: 'Shinkansen Nozomi Tokyo → Kyoto', titleLocal: '新幹線のぞみ', category: 'TRANSPORT', durationMins: 140, tips: 'นั่งฝั่ง D/E เพื่อชม Mt. Fuji ระหว่างทาง ใช้ JR Pass' } })
  await db.activity.upsert({ where: { id: 'jp-act-4-2' }, update: {}, create: { id: 'jp-act-4-2', tourDayId: 'day-jp-4', order: 1, time: '10:00', title: 'เช็คอินโรงแรมเกียวโต', category: 'ACCOMMODATION', latitude: 35.0116, longitude: 135.7681 } })
  await db.activity.upsert({ where: { id: 'jp-act-4-3' }, update: {}, create: { id: 'jp-act-4-3', tourDayId: 'day-jp-4', order: 2, time: '11:00', title: 'วัดทองคำ คินคาคุจิ', titleEn: 'Kinkaku-ji Golden Pavilion', titleLocal: '金閣寺', category: 'TEMPLE', latitude: 35.0394, longitude: 135.7292, durationMins: 60, cost: 500, costCurrency: 'JPY', costTHB: 125, entryType: 'Paid', tips: 'ยอดนิยม คนแน่น ไปช่วงเช้าดีกว่า' } })
  await db.activity.upsert({ where: { id: 'jp-act-4-4' }, update: {}, create: { id: 'jp-act-4-4', tourDayId: 'day-jp-4', order: 3, time: '13:00', title: 'อาหารกลางวัน — บุฟเฟ่ต์มื้อกลางวันญี่ปุ่น', category: 'FOOD', latitude: 35.0116, longitude: 135.7681 } })
  await db.activity.upsert({ where: { id: 'jp-act-4-5' }, update: {}, create: { id: 'jp-act-4-5', tourDayId: 'day-jp-4', order: 4, time: '15:00', title: 'ตลาดนิชิกิ — ครัวเกียวโต', titleEn: 'Nishiki Market', titleLocal: '錦市場', category: 'SHOPPING', latitude: 35.005, longitude: 135.765, tips: 'ลองชิมสตรีทฟู้ดต่างๆ ทาโกยากิ มันจู ปลาย่าง' } })

  // Activities — Day 5 (Arashiyama)
  await db.activity.upsert({ where: { id: 'jp-act-5-1' }, update: {}, create: { id: 'jp-act-5-1', tourDayId: 'day-jp-5', order: 0, time: '08:00', title: 'ป่าไผ่อาราชิยามะ', titleEn: 'Arashiyama Bamboo Grove', titleLocal: '嵐山竹林', category: 'NATURE', latitude: 35.0094, longitude: 135.6728, durationMins: 60, entryType: 'Free', tips: 'ไปแต่เช้าก่อน 9 โมง คนน้อยถ่ายรูปสวย' } })
  await db.activity.upsert({ where: { id: 'jp-act-5-2' }, update: {}, create: { id: 'jp-act-5-2', tourDayId: 'day-jp-5', order: 1, time: '09:30', title: 'วัดเทนริวจิ', titleEn: 'Tenryu-ji Temple', titleLocal: '天龍寺', category: 'TEMPLE', latitude: 35.0171, longitude: 135.6733, cost: 500, costCurrency: 'JPY', costTHB: 125, entryType: 'Paid' } })
  await db.activity.upsert({ where: { id: 'jp-act-5-3' }, update: {}, create: { id: 'jp-act-5-3', tourDayId: 'day-jp-5', order: 2, time: '12:00', title: 'อาหารกลางวัน — โต้ฟุเกียวโต', category: 'FOOD', latitude: 35.009, longitude: 135.673 } })
  await db.activity.upsert({ where: { id: 'jp-act-5-4' }, update: {}, create: { id: 'jp-act-5-4', tourDayId: 'day-jp-5', order: 3, time: '14:00', title: 'ศาลเจ้าฟูชิมิ อินาริ', titleEn: 'Fushimi Inari Shrine', titleLocal: '伏見稲荷大社', category: 'TEMPLE', latitude: 34.9671, longitude: 135.7727, durationMins: 90, entryType: 'Free', tips: 'โทริสีส้มสวยงาม เดินขึ้นไปสูงได้ 2-3 ชั่วโมง' } })
  await db.activity.upsert({ where: { id: 'jp-act-5-5' }, update: {}, create: { id: 'jp-act-5-5', tourDayId: 'day-jp-5', order: 4, time: '18:00', title: 'อาหารเย็น — ชาบูชาบูเกียวโต', category: 'FOOD', latitude: 35.0116, longitude: 135.7681 } })

  // Activities — Day 6 (Osaka)
  await db.activity.upsert({ where: { id: 'jp-act-6-1' }, update: {}, create: { id: 'jp-act-6-1', tourDayId: 'day-jp-6', order: 0, time: '08:30', title: 'นั่งรถไฟ Haruka เกียวโต → โอซาก้า', titleLocal: '特急はるか', category: 'TRANSPORT', durationMins: 30 } })
  await db.activity.upsert({ where: { id: 'jp-act-6-2' }, update: {}, create: { id: 'jp-act-6-2', tourDayId: 'day-jp-6', order: 1, time: '10:00', title: 'ปราสาทโอซาก้า', titleEn: 'Osaka Castle', titleLocal: '大阪城', category: 'SIGHTSEEING', latitude: 34.6873, longitude: 135.5262, durationMins: 90, cost: 600, costCurrency: 'JPY', costTHB: 150, entryType: 'Paid' } })
  await db.activity.upsert({ where: { id: 'jp-act-6-3' }, update: {}, create: { id: 'jp-act-6-3', tourDayId: 'day-jp-6', order: 2, time: '12:30', title: 'อาหารกลางวัน — ทาโกยากิ + โอโคโนมิยากิ', category: 'FOOD', latitude: 34.6687, longitude: 135.501, tips: 'อาหารโอซาก้าขึ้นชื่อ ลองทั้งสองอย่าง' } })
  await db.activity.upsert({ where: { id: 'jp-act-6-4' }, update: {}, create: { id: 'jp-act-6-4', tourDayId: 'day-jp-6', order: 3, time: '15:00', title: 'ถนนโดตงโบริ', titleEn: 'Dotonbori', titleLocal: 'どうとんぼり', category: 'SHOPPING', latitude: 34.6687, longitude: 135.501, durationMins: 120, tips: 'กลกูลิโกะ ป้ายไฟสวย ช้อปปิ้งดีที่สุดในโอซาก้า' } })
  await db.activity.upsert({ where: { id: 'jp-act-6-5' }, update: {}, create: { id: 'jp-act-6-5', tourDayId: 'day-jp-6', order: 4, time: '19:00', title: 'ย่าน Shinsaibashi ช้อปปิ้งยามค่ำ', titleLocal: '心斎橋', category: 'SHOPPING', latitude: 34.6726, longitude: 135.5022 } })

  // Activities — Day 7
  await db.activity.upsert({ where: { id: 'jp-act-7-1' }, update: {}, create: { id: 'jp-act-7-1', tourDayId: 'day-jp-7', order: 0, time: '08:00', title: 'ช้อปปิ้งสุดท้าย Shinsaibashi', category: 'SHOPPING', latitude: 34.6726, longitude: 135.5022 } })
  await db.activity.upsert({ where: { id: 'jp-act-7-2' }, update: {}, create: { id: 'jp-act-7-2', tourDayId: 'day-jp-7', order: 1, time: '12:00', title: 'เดินทางไปสนามบินคันไซ', titleEn: 'Kansai International Airport', titleLocal: '関西国際空港', category: 'TRANSPORT', latitude: 34.4347, longitude: 135.244 } })
  await db.activity.upsert({ where: { id: 'jp-act-7-3' }, update: {}, create: { id: 'jp-act-7-3', tourDayId: 'day-jp-7', order: 2, time: '15:30', title: 'บินกลับกรุงเทพฯ TG623', category: 'TRANSPORT', tips: 'ถ่ายรูปซีนสุดท้าย ซื้อขนมฝากที่ร้านดิวตี้ฟรี' } })

  // Transports (itinerary-level)
  await db.transport.upsert({ where: { id: 'tr-jp-bkk-nrt' }, update: {}, create: { id: 'tr-jp-bkk-nrt', tourDayId: 'day-jp-1', order: 0, type: 'FLIGHT', from: 'สนามบินสุวรรณภูมิ', fromEn: 'Suvarnabhumi Airport', fromCode: 'BKK', to: 'สนามบินนาริตะ โตเกียว', toEn: 'Tokyo Narita Airport', toLocal: '成田国際空港', toCode: 'NRT', departTime: '08:05', arriveTime: '15:35', duration: '6h 30m', flightNo: 'TG676', airline: 'Thai Airways', terminal: 'T1' } })
  await db.transport.upsert({ where: { id: 'tr-jp-shinkansen' }, update: {}, create: { id: 'tr-jp-shinkansen', tourDayId: 'day-jp-4', order: 0, type: 'HIGHSPEED_TRAIN', from: 'สถานีโตเกียว', fromEn: 'Tokyo Station', fromLocal: '東京駅', to: 'สถานีเกียวโต', toEn: 'Kyoto Station', toLocal: '京都駅', departTime: '07:00', arriveTime: '09:19', duration: '2h 19m', lineName: 'ชินคันเซน Nozomi 1', lineNameLocal: '新幹線のぞみ1号', lineColor: '#0066CC', passRequired: 'JR Pass', notes: 'ใช้ JR Pass ได้ จองที่นั่งล่วงหน้าที่เคาน์เตอร์ JR' } })
  await db.transport.upsert({ where: { id: 'tr-jp-kix-bkk' }, update: {}, create: { id: 'tr-jp-kix-bkk', tourDayId: 'day-jp-7', order: 1, type: 'FLIGHT', from: 'สนามบินคันไซ โอซาก้า', fromEn: 'Kansai International Airport', fromLocal: '関西国際空港', fromCode: 'KIX', to: 'สนามบินสุวรรณภูมิ', toEn: 'Suvarnabhumi Airport', toCode: 'BKK', departTime: '15:30', arriveTime: '19:15', duration: '6h 45m', flightNo: 'TG623', airline: 'Thai Airways', terminal: 'T1' } })

  // Accommodations
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-1' }, update: {}, create: { tourDayId: 'day-jp-1', name: 'Shinjuku Washington Hotel', nameLocal: '新宿ワシントンホテル', address: '3-2-9 Nishi-Shinjuku, Shinjuku-ku, Tokyo', country: 'JP', city: 'Tokyo', phone: '+81-3-3343-3111', checkIn: '14:00', checkOut: '11:00', wifiName: 'WashingtonHotel_Free', wifiPassword: 'tokyo2026', breakfastInfo: 'อาหารเช้า ชั้น B1F เวลา 07:00-10:00' } })
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-2' }, update: {}, create: { tourDayId: 'day-jp-2', name: 'Shinjuku Washington Hotel', nameLocal: '新宿ワシントンホテル', address: '3-2-9 Nishi-Shinjuku, Shinjuku-ku, Tokyo', country: 'JP', city: 'Tokyo', phone: '+81-3-3343-3111', checkIn: '14:00', checkOut: '11:00', wifiName: 'WashingtonHotel_Free', wifiPassword: 'tokyo2026' } })
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-3' }, update: {}, create: { tourDayId: 'day-jp-3', name: 'Fuji Lake Hotel', nameLocal: '富士レークホテル', address: 'Funatsu, Fujikawaguchiko, Yamanashi', country: 'JP', city: 'Kawaguchiko', phone: '+81-555-72-2209', checkIn: '15:00', checkOut: '10:00', wifiName: 'FujiLakeHotel', wifiPassword: 'fuji@2026' } })
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-4' }, update: {}, create: { tourDayId: 'day-jp-4', name: 'Kyoto Tower Hotel', nameLocal: '京都タワーホテル', address: 'Karasuma-dori Shichijo, Shimogyo-ku, Kyoto', country: 'JP', city: 'Kyoto', phone: '+81-75-361-3211', checkIn: '14:00', checkOut: '11:00', wifiName: 'KyotoTower_Guest', wifiPassword: 'kyoto2026' } })
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-5' }, update: {}, create: { tourDayId: 'day-jp-5', name: 'Kyoto Tower Hotel', nameLocal: '京都タワーホテル', address: 'Karasuma-dori Shichijo, Shimogyo-ku, Kyoto', country: 'JP', city: 'Kyoto', phone: '+81-75-361-3211', checkIn: '14:00', checkOut: '11:00', wifiName: 'KyotoTower_Guest', wifiPassword: 'kyoto2026' } })
  await db.accommodation.upsert({ where: { tourDayId: 'day-jp-6' }, update: {}, create: { tourDayId: 'day-jp-6', name: 'Cross Hotel Osaka', nameLocal: 'クロスホテル大阪', address: '2-5-15 Shinsaibashisuji, Chuo-ku, Osaka', country: 'JP', city: 'Osaka', phone: '+81-6-6213-8281', checkIn: '14:00', checkOut: '11:00', wifiName: 'CrossHotel_Free', wifiPassword: 'osaka2026' } })

  // Contacts
  await db.importantContact.upsert({ where: { id: 'jp-contact-thai-guide' }, update: {}, create: { id: 'jp-contact-thai-guide', tourId: japanTour.id, name: 'คุณนิชา (ไกด์ไทยญี่ปุ่น)', phone: '+66-89-111-2222', line: 'nicha_japan', type: 'THAI_GUIDE', notes: 'พูดภาษาญี่ปุ่นและไทย โทรได้ตลอด 24 ชั่วโมง' } })
  await db.importantContact.upsert({ where: { id: 'jp-contact-local' }, update: {}, create: { id: 'jp-contact-local', tourId: japanTour.id, name: 'Mr. Tanaka (Local Guide)', nameLocal: '田中さん', phone: '+81-90-0000-5555', whatsapp: '819000005555', type: 'LOCAL_GUIDE', notes: 'ไกด์ท้องถิ่น พูดภาษาอังกฤษดี' } })
  await db.importantContact.upsert({ where: { id: 'jp-contact-hotel-tokyo' }, update: {}, create: { id: 'jp-contact-hotel-tokyo', tourId: japanTour.id, name: 'Shinjuku Washington Hotel', phone: '+81-3-3343-3111', type: 'HOTEL' } })

  // Useful Phrases — Japanese
  const jpPhrases = [
    { id: 'ph-jp-1',  category: 'EMERGENCY',  thai: 'ช่วยด้วย!',               english: 'Help!',                      local: '助けてください!',           localPinyin: 'Tasukete kudasai!' },
    { id: 'ph-jp-2',  category: 'EMERGENCY',  thai: 'โทรเรียกตำรวจ',           english: 'Call police',                local: '警察を呼んでください',       localPinyin: 'Keisatsu wo yonde kudasai' },
    { id: 'ph-jp-3',  category: 'DIRECTIONS', thai: 'ห้องน้ำอยู่ที่ไหน',       english: 'Where is the toilet?',       local: 'トイレはどこですか？',       localPinyin: 'Toire wa doko desu ka?' },
    { id: 'ph-jp-4',  category: 'DIRECTIONS', thai: 'สถานีรถไฟอยู่ที่ไหน',     english: 'Where is the station?',      local: '駅はどこですか？',           localPinyin: 'Eki wa doko desu ka?' },
    { id: 'ph-jp-5',  category: 'FOOD',       thai: 'ฉันแพ้กุ้ง',              english: 'I\'m allergic to shrimp',    local: 'エビアレルギーです',         localPinyin: 'Ebi arerugi desu' },
    { id: 'ph-jp-6',  category: 'FOOD',       thai: 'ไม่เอาเนื้อหมู',          english: 'No pork please',             local: '豚肉は食べられません',       localPinyin: 'Butaniku wa taberaremasen' },
    { id: 'ph-jp-7',  category: 'FOOD',       thai: 'อร่อยมาก!',               english: 'Very delicious!',            local: 'とても美味しい！',           localPinyin: 'Totemo oishii!' },
    { id: 'ph-jp-8',  category: 'SHOPPING',   thai: 'ราคาเท่าไร',              english: 'How much?',                  local: 'いくらですか？',             localPinyin: 'Ikura desu ka?' },
    { id: 'ph-jp-9',  category: 'SHOPPING',   thai: 'มีส่วนลดไหม',            english: 'Any discount?',              local: '割引はありますか？',         localPinyin: 'Waribiki wa arimasu ka?' },
    { id: 'ph-jp-10', category: 'SHOPPING',   thai: 'ขอถุงด้วย',               english: 'A bag please',               local: '袋をください',               localPinyin: 'Fukuro wo kudasai' },
    { id: 'ph-jp-11', category: 'TRANSPORT',  thai: 'ไปสถานีนี้',              english: 'Go to this station',         local: 'この駅に行きたいです',       localPinyin: 'Kono eki ni ikitai desu' },
    { id: 'ph-jp-12', category: 'TRANSPORT',  thai: 'ขึ้นรถไฟสายไหน',         english: 'Which train line?',          local: '何番線ですか？',             localPinyin: 'Nanbansan desu ka?' },
    { id: 'ph-jp-13', category: 'HOTEL',      thai: 'เช็คอิน',                 english: 'Check in',                   local: 'チェックインをお願いします', localPinyin: 'Chekku-in wo onegai shimasu' },
    { id: 'ph-jp-14', category: 'HOTEL',      thai: 'ขอผ้าขนหนูเพิ่ม',        english: 'Extra towel please',         local: 'タオルをもう一枚ください',   localPinyin: 'Taoru wo mou ichimai kudasai' },
    { id: 'ph-jp-15', category: 'COURTESY',   thai: 'ขอบคุณ',                  english: 'Thank you',                  local: 'ありがとうございます',       localPinyin: 'Arigatou gozaimasu' },
    { id: 'ph-jp-16', category: 'COURTESY',   thai: 'ขอโทษ',                   english: 'Excuse me / Sorry',          local: 'すみません',                 localPinyin: 'Sumimasen' },
    { id: 'ph-jp-17', category: 'COURTESY',   thai: 'สวัสดี',                  english: 'Hello',                      local: 'こんにちは',                 localPinyin: 'Konnichiwa' },
    { id: 'ph-jp-18', category: 'NUMBERS',    thai: 'หนึ่ง/สอง/สาม',          english: 'One/Two/Three',              local: '一/二/三',                   localPinyin: 'Ichi / Ni / San' },
    { id: 'ph-jp-19', category: 'NUMBERS',    thai: 'สิบ / ร้อย / พัน',       english: 'Ten/Hundred/Thousand',       local: '十/百/千',                   localPinyin: 'Juu / Hyaku / Sen' },
    { id: 'ph-jp-20', category: 'NUMBERS',    thai: 'หนึ่งหมื่น',             english: 'Ten thousand',               local: '一万',                       localPinyin: 'Ichiman' },
  ]
  for (const [i, p] of jpPhrases.entries()) {
    await db.usefulPhrase.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, tourId: japanTour.id, category: p.category as any, thai: p.thai, english: p.english, local: p.local, localPinyin: p.localPinyin, order: i } })
  }

  // Checklists
  const jpChecklist = await db.checklist.upsert({ where: { id: 'cl-jp-prep' }, update: {}, create: { id: 'cl-jp-prep', tourId: japanTour.id, title: 'เตรียมเดินทางญี่ปุ่น', emoji: '🇯🇵', type: 'DEPARTURE', order: 0 } })
  const jpChecklistItems = ['พาสปอร์ต (อายุ > 6 เดือน)', 'ไม่ต้องทำวีซ่า (ฟรีวีซ่า)', 'ประกันเดินทาง', 'แลกเงินเยน (JPY)', 'ซื้อ JR Pass ก่อนเดินทาง', 'ดาวน์โหลดแอป Google Maps ออฟไลน์', 'ซื้อซิมการ์ดญี่ปุ่น / Pocket WiFi', 'เตรียมยาประจำตัว', 'เช็คน้ำหนักกระเป๋า (max 23kg)', 'แจ้งธนาคารก่อนเดินทาง']
  for (const [i, label] of jpChecklistItems.entries()) {
    await db.checklistItem.upsert({ where: { id: `cli-jp-${i}` }, update: {}, create: { id: `cli-jp-${i}`, checklistId: jpChecklist.id, label, order: i, isImportant: i < 3 } })
  }

  const jpPackingList = await db.checklist.upsert({ where: { id: 'cl-jp-packing' }, update: {}, create: { id: 'cl-jp-packing', tourId: japanTour.id, title: 'สิ่งของที่ต้องพก', emoji: '🎒', type: 'PACKING', order: 1 } })
  const jpPackingItems = ['เสื้อกันหนาว (เมษาเย็น ~15°C)', 'รองเท้าสบาย (เดินมาก!)', 'ร่ม / เสื้อกันฝน', 'ปลั๊กแปลง (Type A)', 'ครีมกันแดด', 'กระเป๋าใบเล็กสำหรับช้อปปิ้ง', 'ยาลดไข้ / ยาท้องเสีย', 'เสื้อผ้าอย่างน้อย 5 ชุด']
  for (const [i, label] of jpPackingItems.entries()) {
    await db.checklistItem.upsert({ where: { id: `cli-jp-pack-${i}` }, update: {}, create: { id: `cli-jp-pack-${i}`, checklistId: jpPackingList.id, label, order: i, isImportant: i < 2 } })
  }

  // Emergency Info
  await db.emergencyInfo.upsert({
    where: { tourId: japanTour.id },
    update: {},
    create: {
      tourId: japanTour.id,
      emergencyNumbers: {
        JP: { police: '110', ambulance: '119', fire: '119', tourist: '03-3501-0110' },
      },
      embassyContacts: {
        Tokyo: '+81-3-3222-4101',
      },
      thaiEmbassyPhone: '+81-3-3222-4101',
      thaiEmbassyAddress: '14-6, Kami-Osaki 3-chome, Shinagawa-ku, Tokyo 141-0021',
      insuranceCompany: 'Allianz Travel',
      insurancePhone: '+66-2-305-7000',
      nearestHospital: 'St. Luke\'s International Hospital, Tokyo (+81-3-5550-7166)',
    },
  })

  // Flight Info
  await db.flightInfo.upsert({
    where: { id: 'flight-jp-out' },
    update: {},
    create: {
      id: 'flight-jp-out',
      tourId: japanTour.id,
      flightNo: 'TG676',
      airline: 'Thai Airways',
      airlineIata: 'TG',
      fromAirport: 'Suvarnabhumi',
      fromIata: 'BKK',
      toAirport: 'Tokyo Narita',
      toIata: 'NRT',
      departAt: new Date('2026-04-18T01:05:00Z'),
      arriveAt: new Date('2026-04-18T08:35:00Z'),
      departTz: 'Asia/Bangkok',
      arriveTz: 'Asia/Tokyo',
      terminal: 'T1',
    },
  })
  await db.flightInfo.upsert({
    where: { id: 'flight-jp-return' },
    update: {},
    create: {
      id: 'flight-jp-return',
      tourId: japanTour.id,
      flightNo: 'TG623',
      airline: 'Thai Airways',
      airlineIata: 'TG',
      fromAirport: 'Kansai International',
      fromIata: 'KIX',
      toAirport: 'Suvarnabhumi',
      toIata: 'BKK',
      departAt: new Date('2026-04-24T08:30:00Z'),
      arriveAt: new Date('2026-04-24T12:15:00Z'),
      departTz: 'Asia/Tokyo',
      arriveTz: 'Asia/Bangkok',
      terminal: 'T1',
    },
  })

  console.log('✓ Japan tour complete')

  // ─────────────────────────────────────────────────────────────
  // DOCUMENTS — China Tour
  // ─────────────────────────────────────────────────────────────
  const chinaDocs = [
    {
      id: 'doc-cn-1',
      title: 'ตั๋วเครื่องบิน TG614',
      titleEn: 'TG614 Bangkok → Beijing',
      type: 'FLIGHT_TICKET' as const,
      qrData: 'BCBP:TG614/BKK/PEK/2026-04-10/SOMSAK JAIDEE',
      description: 'Thai Airways TG614 • BKK → PEK • 10 เม.ย. 2569 • 00:55',
    },
    {
      id: 'doc-cn-2',
      title: 'เวาเชอร์โรงแรม Holiday Inn',
      titleEn: 'Holiday Inn Beijing Booking',
      type: 'HOTEL_VOUCHER' as const,
      qrData: 'HOTEL:HOLIDAYINN-BEIJING/CN2026-04/CONF-88812345',
      description: 'Holiday Inn Express Beijing • 10-15 เม.ย. • Conf# 88812345',
    },
    {
      id: 'doc-cn-3',
      title: 'ตั๋วพระราชวังต้องห้าม',
      titleEn: 'Forbidden City Entrance',
      type: 'TOUR_VOUCHER' as const,
      qrData: 'TICKET:FORBIDDEN-CITY/2026-04-11/09:00/GROUP-30',
      description: 'เข้าชม 11 เม.ย. • เวลา 09:00 • กลุ่ม 30 คน',
    },
    {
      id: 'doc-cn-4',
      title: 'ตั๋วกำแพงเมืองจีน (บาดาลิ่ง)',
      titleEn: 'Great Wall Badaling Ticket',
      type: 'TOUR_VOUCHER' as const,
      qrData: 'TICKET:GREAT-WALL-BADALING/2026-04-12/10:00/GROUP-30',
      description: 'เข้าชม 12 เม.ย. • เวลา 10:00 • ประตู A',
    },
    {
      id: 'doc-cn-5',
      title: 'China Health Kit',
      titleEn: 'China Health Declaration QR',
      type: 'CHINA_HEALTH_KIT' as const,
      qrData: 'HEALTH:CHK/SOMSAK-JAIDEE/PASSPORT-AA1234567/2026-04-10',
      description: 'แสดงเมื่อผ่านด่านตรวจคนเข้าเมือง',
    },
    {
      id: 'doc-cn-6',
      title: 'ประกันเดินทาง AXA',
      titleEn: 'AXA Travel Insurance',
      type: 'INSURANCE' as const,
      qrData: 'AXA-TRAVEL/POL-TH2026-98765/+66-2-118-8111',
      description: 'กรมธรรม์ POL-TH2026-98765 • แจ้งเคลม +66-2-118-8111',
    },
  ]

  for (const doc of chinaDocs) {
    await db.tourDocument.upsert({
      where: { id: doc.id },
      update: {},
      create: { ...doc, tourId: chinaTour.id },
    })
  }
  console.log('✓ China tour documents')

  // ─────────────────────────────────────────────────────────────
  // DOCUMENTS — Japan Tour
  // ─────────────────────────────────────────────────────────────
  const japanDocs = [
    {
      id: 'doc-jp-1',
      title: 'ตั๋วเครื่องบิน TG676',
      titleEn: 'TG676 Bangkok → Tokyo',
      type: 'FLIGHT_TICKET' as const,
      qrData: 'BCBP:TG676/BKK/NRT/2026-04-18/SOMSAK JAIDEE',
      description: 'Thai Airways TG676 • BKK → NRT • 18 เม.ย. 2569 • 08:40',
    },
    {
      id: 'doc-jp-2',
      title: 'Visit Japan Web QR',
      titleEn: 'Visit Japan Web — Immigration',
      type: 'VISIT_JAPAN_WEB' as const,
      qrData: 'VJW:JP-IMM/SOMSAK-JAIDEE/TH/2026-04-18',
      description: 'แสดงที่ด่านตรวจคนเข้าเมืองญี่ปุ่น (ทดแทนกรอกบัตรขาเข้า)',
    },
    {
      id: 'doc-jp-3',
      title: 'JR Pass — 7 วัน',
      titleEn: 'JR Pass 7-Day Ordinary',
      type: 'TOUR_VOUCHER' as const,
      qrData: 'JRPASS:7DAY/ORD/SOMSAK-JAIDEE/2026-04-19/2026-04-25',
      description: 'เริ่มใช้ 19 เม.ย. • หมดอายุ 25 เม.ย. • แลกที่เคาน์เตอร์ JR',
    },
    {
      id: 'doc-jp-4',
      title: 'ตั๋ว Universal Studios Japan',
      titleEn: 'Universal Studios Japan 1-Day',
      type: 'TOUR_VOUCHER' as const,
      qrData: 'USJ:1DAY/2026-04-23/SOMSAK-JAIDEE/GATE-MAIN',
      description: 'วันที่ 23 เม.ย. • 1 วัน Studio Pass • ประตูหลัก',
    },
    {
      id: 'doc-jp-5',
      title: 'เวาเชอร์โรงแรม Shinjuku',
      titleEn: 'Keio Plaza Hotel Tokyo Booking',
      type: 'HOTEL_VOUCHER' as const,
      qrData: 'HOTEL:KEIO-PLAZA-TOKYO/JP2026-04/CONF-KP556789',
      description: 'Keio Plaza Hotel • 18-21 เม.ย. • Conf# KP556789',
    },
    {
      id: 'doc-jp-6',
      title: 'ประกันเดินทาง AXA',
      titleEn: 'AXA Travel Insurance',
      type: 'INSURANCE' as const,
      qrData: 'AXA-TRAVEL/POL-TH2026-98766/+66-2-118-8111',
      description: 'กรมธรรม์ POL-TH2026-98766 • แจ้งเคลม +66-2-118-8111',
    },
  ]

  for (const doc of japanDocs) {
    await db.tourDocument.upsert({
      where: { id: doc.id },
      update: {},
      create: { ...doc, tourId: japanTour.id },
    })
  }
  console.log('✓ Japan tour documents')

  console.log('\n✅ Seed complete!')
  console.log(`\nChina Tour ID: ${chinaTour.id}`)
  console.log(`Japan Tour ID: ${japanTour.id}`)
  console.log('\nTest URLs:')
  console.log('  http://localhost:3000/tour/' + chinaTour.id + '/today')
  console.log('  http://localhost:3000/tour/' + japanTour.id + '/today')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
