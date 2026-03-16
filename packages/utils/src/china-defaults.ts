import type { PhraseCategory } from '@tripflow/types'

export interface DefaultPhrase {
  category: PhraseCategory
  thai: string
  english: string
  local: string
  localPinyin?: string
  order: number
}

export const CHINA_DEFAULT_PHRASES: DefaultPhrase[] = [
  // Emergency
  { category: 'EMERGENCY', thai: 'ช่วยด้วย!', english: 'Help!', local: '救命!', localPinyin: 'Jiùmìng!', order: 0 },
  { category: 'EMERGENCY', thai: 'โทรหาตำรวจ', english: 'Call the police', local: '叫警察', localPinyin: 'Jiào jǐngchá', order: 1 },
  { category: 'EMERGENCY', thai: 'โทรรถพยาบาล', english: 'Call an ambulance', local: '叫救护车', localPinyin: 'Jiào jiùhù chē', order: 2 },
  // Directions
  { category: 'DIRECTIONS', thai: 'ห้องน้ำอยู่ที่ไหน', english: 'Where is the toilet?', local: '厕所在哪里？', localPinyin: 'Cèsuǒ zài nǎlǐ?', order: 0 },
  { category: 'DIRECTIONS', thai: 'รถไฟใต้ดินอยู่ที่ไหน', english: 'Where is the subway?', local: '地铁在哪里？', localPinyin: 'Dìtiě zài nǎlǐ?', order: 1 },
  { category: 'DIRECTIONS', thai: 'ไปที่นี่', english: 'Go here', local: '去这里', localPinyin: 'Qù zhèlǐ', order: 2 },
  { category: 'DIRECTIONS', thai: 'อยู่ไกลไหม', english: 'Is it far?', local: '远吗？', localPinyin: 'Yuǎn ma?', order: 3 },
  // Food
  { category: 'FOOD', thai: 'ฉันกินเผ็ดไม่ได้', english: 'I cannot eat spicy food', local: '我不能吃辣', localPinyin: 'Wǒ bù néng chī là', order: 0 },
  { category: 'FOOD', thai: 'ฉันไม่กินหมู', english: 'I do not eat pork', local: '我不吃猪肉', localPinyin: 'Wǒ bù chī zhūròu', order: 1 },
  { category: 'FOOD', thai: 'ฉันไม่กินเนื้อวัว', english: 'I do not eat beef', local: '我不吃牛肉', localPinyin: 'Wǒ bù chī niúròu', order: 2 },
  { category: 'FOOD', thai: 'อร่อยมาก!', english: 'Very delicious!', local: '非常好吃！', localPinyin: 'Fēicháng hǎochī!', order: 3 },
  { category: 'FOOD', thai: 'ขอเมนูหน่อย', english: 'Menu please', local: '菜单，谢谢', localPinyin: 'Càidān, xièxiè', order: 4 },
  { category: 'FOOD', thai: 'คิดเงินด้วย', english: 'Check please', local: '买单，谢谢', localPinyin: 'Mǎidān, xièxiè', order: 5 },
  // Shopping
  { category: 'SHOPPING', thai: 'ลดราคาได้ไหม', english: 'Can you lower the price?', local: '可以便宜一点吗？', localPinyin: 'Kěyǐ piányí yīdiǎn ma?', order: 0 },
  { category: 'SHOPPING', thai: 'ราคาเท่าไร', english: 'How much is this?', local: '多少钱？', localPinyin: 'Duōshǎo qián?', order: 1 },
  { category: 'SHOPPING', thai: 'แพงเกินไป', english: 'Too expensive', local: '太贵了', localPinyin: 'Tài guì le', order: 2 },
  { category: 'SHOPPING', thai: 'ฉันเอาอันนี้', english: 'I will take this one', local: '我要这个', localPinyin: 'Wǒ yào zhège', order: 3 },
  // Transport
  { category: 'TRANSPORT', thai: 'ไปสถานีรถไฟ', english: 'Go to train station', local: '去火车站', localPinyin: 'Qù huǒchē zhàn', order: 0 },
  { category: 'TRANSPORT', thai: 'ไปสนามบิน', english: 'Go to airport', local: '去机场', localPinyin: 'Qù jīchǎng', order: 1 },
  { category: 'TRANSPORT', thai: 'หยุดที่นี่', english: 'Stop here', local: '在这里停', localPinyin: 'Zài zhèlǐ tíng', order: 2 },
  // Hotel
  { category: 'HOTEL', thai: 'เช็คอิน', english: 'Check in', local: '我要办理入住', localPinyin: 'Wǒ yào bànlǐ rùzhù', order: 0 },
  { category: 'HOTEL', thai: 'เช็คเอาท์', english: 'Check out', local: '我要退房', localPinyin: 'Wǒ yào tuì fáng', order: 1 },
  { category: 'HOTEL', thai: 'รหัส WiFi คืออะไร', english: 'What is the WiFi password?', local: 'WiFi密码是什么？', localPinyin: 'WiFi mìmǎ shì shénme?', order: 2 },
  // Courtesy
  { category: 'COURTESY', thai: 'สวัสดี', english: 'Hello', local: '你好', localPinyin: 'Nǐ hǎo', order: 0 },
  { category: 'COURTESY', thai: 'ขอบคุณ', english: 'Thank you', local: '谢谢', localPinyin: 'Xièxiè', order: 1 },
  { category: 'COURTESY', thai: 'ขอโทษ', english: 'Excuse me / Sorry', local: '对不起', localPinyin: 'Duìbùqǐ', order: 2 },
  { category: 'COURTESY', thai: 'ไม่เป็นไร', english: 'No problem', local: '没关系', localPinyin: 'Méi guānxi', order: 3 },
  // Numbers
  { category: 'NUMBERS', thai: 'หนึ่ง', english: 'One', local: '一 (1)', localPinyin: 'Yī', order: 0 },
  { category: 'NUMBERS', thai: 'สอง', english: 'Two', local: '二 (2)', localPinyin: 'Èr', order: 1 },
  { category: 'NUMBERS', thai: 'สาม', english: 'Three', local: '三 (3)', localPinyin: 'Sān', order: 2 },
  { category: 'NUMBERS', thai: 'สิบ', english: 'Ten', local: '十 (10)', localPinyin: 'Shí', order: 3 },
  { category: 'NUMBERS', thai: 'ร้อย', english: 'Hundred', local: '百 (100)', localPinyin: 'Bǎi', order: 4 },
  { category: 'NUMBERS', thai: 'พัน', english: 'Thousand', local: '千 (1000)', localPinyin: 'Qiān', order: 5 },
]

export const CHINA_PAYMENT_WARNING = {
  titleTh: 'การชำระเงินในจีน',
  contentTh: `WeChat Pay และ Alipay ต้องใช้บัญชีธนาคารจีน
ท่านอาจชำระได้ด้วย:
• บัตรเครดิต Visa/Mastercard (ร้านใหญ่รับ)
• เงินสด CNY (แนะนำสำหรับตลาด)
• UnionPay card (ธนาคารไทยบางแห่งออกได้)
• บัตรท่องเที่ยว WeChat Pay (ลงทะเบียนด้วยพาสปอร์ตได้แล้ว!)`,
  tipTh: 'แนะนำถือเงินสดหยวน 2,000-3,000 หยวนต่อวัน',
}

export const CHINA_CHECKLIST_ITEMS = [
  { label: 'วีซ่าจีน', labelEn: 'China Visa', isImportant: true },
  { label: 'ประกันเดินทาง', labelEn: 'Travel Insurance', isImportant: true },
  { label: 'แลกเงินหยวน (CNY)', labelEn: 'Exchange CNY', isImportant: true },
  { label: 'ดาวน์โหลดแผนที่ออฟไลน์', labelEn: 'Download offline maps', isImportant: false },
  { label: 'แจ้งธนาคารก่อนเดินทาง', labelEn: 'Notify bank before travel', isImportant: false },
  { label: 'ซื้อซิมการ์ดจีนหรือพ็อกเก็ตไวไฟ', labelEn: 'Buy China SIM or pocket WiFi', isImportant: false },
  { label: 'เตรียมยา', labelEn: 'Prepare medicine', isImportant: false },
]
