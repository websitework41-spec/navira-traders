import { NextRequest, NextResponse } from 'next/server';
import { sanitizeText } from '@/lib/security';

// Comprehensive local knowledge & recommendation engine
function getSmartAssistantResponse(query: string): string {
  const q = query.toLowerCase();

  // 1. Specific phone models
  if (q.includes('s24') || (q.includes('samsung') && (q.includes('ultra') || q.includes('flagship')))) {
    return `🌟 [**Samsung Galaxy S24 Ultra**](/product/samsung-galaxy-s24-ultra):
- **Price**: Rs. 316,999 (Discounted from Rs. 469,999 — Save Rs. 153,000!)
- **Display**: 6.8" Dynamic AMOLED 2X, 120Hz, 2600 nits peak brightness
- **Processor**: Snapdragon 8 Gen 3 for Galaxy (4nm)
- **Cameras**: 200MP Quad-Telephoto (5x optical, 100x Space Zoom) + 12MP Selfie
- **Battery & Charging**: 5000 mAh with 45W Fast Charging
- **Assurances**: 100% PTA Approved (DIRBS compliant) with 1-Year Official Samsung Pakistan Warranty and Open-Parcel COD!
👉 [View Samsung Galaxy S24 Ultra Specs & Deals](/product/samsung-galaxy-s24-ultra)`;
  }

  if (q.includes('iphone') || q.includes('apple')) {
    return `🍏 **Apple iPhone Series on Nawira Traders**:
1. [**Apple iPhone 15**](/product/apple-iphone-15): Starting from Rs. 264,999
2. [**Apple iPhone 16**](/product/apple-iphone-16): Starting from Rs. 338,999
3. [**Apple iPhone 17 Pro**](/product/apple-iphone-17-pro): Starting from Rs. 434,999
- **Assurances**: 100% PTA Customs Tax Cleared with lifetime SIM validity. Mercantile & FutureTech official warranty. Open-Parcel inspection before paying!
👉 [Browse All Apple iPhones](/product/apple-iphone-16)`;
  }

  if (q.includes('redmi') || q.includes('xiaomi')) {
    return `⚡ **Top Xiaomi & Redmi Picks**:
1. [**Xiaomi Redmi 14C**](/product/xiaomi-redmi-14c): Rs. 29,999 (120Hz display, 50MP AI camera)
2. [**Xiaomi Redmi 15C**](/product/xiaomi-redmi-15c): Rs. 42,999 (Helio G81-Ultra, 120Hz)
3. [**Xiaomi Redmi 10C**](/product/xiaomi-redmi-10c): Rs. 47,499 (128GB In-Stock, Snapdragon 680, 5000mAh)
4. [**Xiaomi Redmi Note 15 Pro Plus**](/product/xiaomi-redmi-note-15-pro-plus): Rs. 109,999 (200MP OIS, 6500mAh)
- **Warranty**: 1-Year Official Xiaomi / Airlink Pakistan Warranty.`;
  }

  if (q.includes('infinix') || q.includes('hot 60') || q.includes('note 40')) {
    return `🔥 **Top Infinix Models**:
1. [**Infinix Hot 50**](/product/infinix-hot-50): Rs. 33,999 (120Hz display, Helio G100, 5000mAh)
2. [**Infinix Hot 60i**](/product/infinix-hot-60i): Rs. 31,999 (Smooth display, big battery)
3. [**Infinix Note 40**](/product/infinix-note-40): Rs. 57,999 (All-Round FastCharge 2.0, AMOLED)
- **Warranty**: 1-Year Official Carlcare Warranty nationwide with Open-Parcel delivery.`;
  }

  // 2. Budget brackets
  if (q.includes('25') || q.includes('25k') || q.includes('under 25000') || q.includes('under 25,000') || q.includes('under 25')) {
    return `💰 **Best Phones Under Rs. 25,000**:
1. [**OnePlus Nord N100**](/product/oneplus-nord-n100): Rs. 23,999 (90Hz display, 5000mAh, 18W fast charging)
2. [**Huawei Y6s**](/product/huawei-y6s-2019): Rs. 18,699
3. [**Google Pixel**](/product/google-pixel): Rs. 17,499
All models are 100% PTA Approved with Open-Parcel Delivery!`;
  }

  if (q.includes('30') || q.includes('30k') || q.includes('under 30000') || q.includes('under 30,000')) {
    return `💰 **Best Phones Under Rs. 30,000**:
1. [**Xiaomi Redmi 14C**](/product/xiaomi-redmi-14c): Rs. 29,999 (6.88" 120Hz display, 50MP AI camera)
2. [**Huawei Y7p**](/product/huawei-y7p): Rs. 25,799
3. [**Huawei Y8p**](/product/huawei-y8p): Rs. 28,000`;
  }

  if (q.includes('35') || q.includes('35k') || q.includes('under 35000') || q.includes('under 35,000')) {
    return `💰 **Best Phones Under Rs. 35,000**:
1. [**Xiaomi Redmi 14C**](/product/xiaomi-redmi-14c): Rs. 29,999 (120Hz screen, 50MP camera)
2. [**Infinix Hot 60i**](/product/infinix-hot-60i): Rs. 31,999
3. [**Infinix Hot 50**](/product/infinix-hot-50): Rs. 33,999 (Helio G100)
4. [**Samsung Galaxy A07**](/product/samsung-galaxy-a07): Rs. 34,999 (5000mAh battery)`;
  }

  if (q.includes('40') || q.includes('40k') || q.includes('under 40000') || q.includes('under 40,000')) {
    return `💰 **Best Phones Under Rs. 40,000**:
1. [**Samsung Galaxy A07**](/product/samsung-galaxy-a07): Rs. 34,999 (5000mAh, 50MP Dual Camera, 6.7" Display)
2. [**Infinix Hot 50**](/product/infinix-hot-50): Rs. 33,999 (120Hz FHD+, Helio G100, 5000mAh)
3. [**Infinix Hot 60i**](/product/infinix-hot-60i): Rs. 31,999 (Smooth display, long battery life)
4. [**Xiaomi Redmi 14C**](/product/xiaomi-redmi-14c): Rs. 29,999 (6.88" 120Hz display, 50MP AI camera)
5. [**Oppo A54s**](/product/oppo-a54s): Rs. 35,999 (5000mAh, AI Triple Camera)
6. [**Sony Xperia L4**](/product/sony-xperia-l4): Rs. 36,999 (Triple Camera, 21:9 CinemaWide)
All models include 1-Year Official Brand Warranty and Open-Parcel Doorstep Inspection!`;
  }

  if (q.includes('50') || q.includes('50k') || q.includes('under 50000') || q.includes('under 50,000')) {
    return `💰 **Best Phones Under Rs. 50,000**:
1. [**Tecno Spark 40**](/product/tecno-spark-40): Rs. 49,999 (50MP AI Camera, 5000mAh)
2. [**Xiaomi Redmi 10C**](/product/xiaomi-redmi-10c): Rs. 47,499 (Snapdragon 680, 50MP camera)
3. [**Xiaomi Redmi 15C**](/product/xiaomi-redmi-15c): Rs. 42,999 (120Hz, 50MP AI Dual Camera)
4. [**Sony Xperia L4**](/product/sony-xperia-l4): Rs. 36,999
5. [**Samsung Galaxy A07**](/product/samsung-galaxy-a07): Rs. 34,999`;
  }

  if (q.includes('60') || q.includes('60k') || q.includes('under 60000') || q.includes('under 60,000')) {
    return `💰 **Best Mid-Range Phones Under Rs. 60,000**:
1. [**Infinix Note 40**](/product/infinix-note-40): Rs. 57,999 (120Hz AMOLED, 45W Multi-Speed FastCharge)
2. [**Realme C75x**](/product/realme-c75x): Rs. 54,499 (Helio G81 Ultra, 6000mAh battery)
3. [**OnePlus Nord CE 2 Lite 5G**](/product/oneplus-nord-ce-2-lite-5g): Rs. 56,000 (Snapdragon 695 5G)
4. [**Tecno Spark 40**](/product/tecno-spark-40): Rs. 49,999
5. [**Honor X6c**](/product/honor-x6c): Rs. 44,999`;
  }

  if (q.includes('100') || q.includes('100k') || q.includes('under 100000') || q.includes('under 100,000') || q.includes('1 lac') || q.includes('1 lakh')) {
    return `💰 **Best Phones Under Rs. 100,000**:
1. [**Samsung Galaxy A17 5G**](/product/samsung-galaxy-a17-5g): Rs. 96,299 (5G, Super AMOLED, Knox Security)
2. [**Tecno Camon 30 Pro 5G**](/product/tecno-camon-50-ultra-5g): Rs. 93,499 (Dimensity 8200, 50MP Sony IMX890 OIS)
3. [**Motorola Moto One 5G Ace**](/product/motorola-moto-one-5g-ace): Rs. 91,999
4. [**Huawei Nova 9**](/product/huawei-nova-9): Rs. 98,999 (120Hz curved OLED, 66W SuperCharge)
5. [**OnePlus 9RT**](/product/oneplus-9rt): Rs. 98,999`;
  }

  if (q.includes('flagship') || q.includes('150k') || q.includes('150000') || q.includes('high end')) {
    return `👑 **Premium Flagship Mobiles (150K+)**:
1. [**Samsung Galaxy S24 Ultra**](/product/samsung-galaxy-s24-ultra): Rs. 316,999 (Titanium, 200MP, S-Pen, Galaxy AI)
2. [**Apple iPhone 16**](/product/apple-iphone-16): Rs. 338,999 (A18 Bionic, Camera Control)
3. [**Samsung Galaxy Z Fold 6**](/product/samsung-galaxy-z-fold-6): Rs. 469,999 (Dual Dynamic AMOLED 2X, Foldable)
4. [**Vivo X300 Pro**](/product/vivo-x300-pro): Rs. 316,999 (ZEISS optics, 6510mAh battery)
5. [**Xiaomi 14**](/product/xiaomi-14): Starting from Rs. 157,999`;
  }

  if (q.includes('button') || q.includes('keypad') || q.includes('nokia') || q.includes('itel')) {
    return `📱 **Keypad & Feature Phones (22 Verified Models)**:
1. [**Nokia 105 Classic**](/product/nokia-105-classic): Starting Rs. 3,249 (1-week battery, FM radio)
2. [**Nokia 110**](/product/nokia-110-2023): Rs. 4,999 (Rear camera, MP3 player)
3. [**Nokia 5310 XpressMusic**](/product/nokia-5310-2020): Rs. 10,499 (Dual front-facing speakers)
4. [**Nokia 8210 4G**](/product/nokia-3210-4g): Rs. 12,449 (VoLTE HD calling)
5. [**Itel It2165 Eco**](/product/itel-it2165-eco): Rs. 2,149 (Most affordable PTA phone)
6. [**Itel Power 450**](/product/itel-power-450): Rs. 3,599 (Big 2500mAh power bank battery)
7. [**Itel Muzik 300**](/product/itel-muzik-300): Rs. 3,399
All 22 keypad phones have lifetime PTA DIRBS approval and Open-Parcel delivery!`;
  }

  // 3. Trust Assurances & Store Policies
  if (q.includes('open parcel') || q.includes('open-parcel') || q.includes('check before payment') || q.includes('rider') || q.includes('unboxing')) {
    return `📦 **Open-Parcel Cash on Delivery (COD)**:
Nawira Traders offers 100% Open-Parcel Delivery across Pakistan:
1. **Rider Arrival**: Courier rider delivers flyer to your doorstep.
2. **Open Flyer**: You are legally authorized to open the courier flyer in the rider's presence.
3. **Inspect Seal**: Verify brand, model, color, and make sure retail box factory seals are intact.
4. **Pay Cash**: Pay cash only after you are 100% satisfied.
5. **Zero Risk**: If the box is damaged or incorrect, reject it on the spot at Rs. 0 cost!`;
  }

  if (q.includes('pta') || q.includes('dirbs') || q.includes('approved') || q.includes('verify') || q.includes('tax')) {
    return `✅ **100% Official PTA-Approved Guarantee**:
Every phone on Nawira Traders is legally imported with customs taxes paid in full.
**How to verify DIRBS**:
1. Dial **\`*#06#\`** on the phone keypad to get the 15-digit IMEI.
2. SMS the IMEI to **8484** (PTA DIRBS shortcode).
3. Or verify online at **dirbs.pta.gov.pk**.
Your status will confirm: *"IMEI is Compliant (PTA Approved)"*. Never worry about SIM blockage!`;
  }

  if (q.includes('installment') || q.includes('emi') || q.includes('markup') || q.includes('bank') || q.includes('card') || q.includes('credit')) {
    return `💳 **0% Markup Easy Monthly Installments (EMI)**:
Enjoy 0% interest installments through partner credit cards:
- **Eligible Banks**: Meezan Bank (Islamic 0%), Bank Alfalah (3, 6, 12 mos), Faysal Bank, and Silkbank.
- **Tenures**: 3, 6, or 12 months.
- **Process**: Direct online checkout is disabled for installments. Open our Installment Manual popup or contact our WhatsApp helpline at +92 313 5221200 to verify and apply.`;
  }

  if (q.includes('warranty') || q.includes('repair') || q.includes('service center') || q.includes('claim')) {
    return `🛡️ **1-Year Official Brand Warranty**:
All our mobile phones carry official manufacturer warranties claimable at authorized service centers nationwide:
- **Samsung**: Official Samsung Care Centers.
- **Apple**: Mercantile & FutureTech Authorized Centers.
- **Xiaomi / Redmi / Poco**: Airlink & Smart Zone Hubs.
- **Tecno & Infinix**: Carlcare Centers nationwide.
- **Vivo & Oppo**: Official Brand Service Centers.
- **Nokia & Itel**: Authorized nationwide centers.
Your Nawira Traders tax invoice serves as valid official proof of purchase.`;
  }

  if (q.includes('return') || q.includes('replace') || q.includes('guarantee') || q.includes('defect')) {
    return `🔄 **7-Day Replacement Guarantee**:
If your device arrives with an out-of-the-box hardware defect:
1. Contact our WhatsApp helpline at **+92 301 8543131** within 7 days.
2. Provide your order tracking code (e.g. NWT-XXXXXX).
3. Handset must be in original condition with box and accessories.
4. An immediate replacement handset will be dispatched at zero additional charge!`;
  }

  if (q.includes('delivery') || q.includes('shipping') || q.includes('time') || q.includes('days') || q.includes('cod')) {
    return `🚚 **Fast Nationwide Delivery**:
- **Lahore, Karachi, Islamabad, Rawalpindi**: 24 to 48 hours.
- **Other Cities**: 2 to 4 working days via TCS Express, Leopards, Trax & PostEx.
- **Free Delivery**: All orders above Rs. 2,000 enjoy 100% Free Shipping with Open-Parcel inspection!`;
  }

  if (q.includes('contact') || q.includes('call') || q.includes('whatsapp') || q.includes('number') || q.includes('support') || q.includes('helpline')) {
    return `📞 **Official Customer Support**:
We are available Mon-Sat (9:00 AM - 10:00 PM PKT):
- **Phone Helpline**: [+92 301 8543131](tel:+923018543131)
- **Direct WhatsApp**: [Chat on WhatsApp (+92 301 8543131)](https://wa.me/923018543131)
- **Email**: support@nawiratraders.com
- **Nationwide Coverage**: Express delivery across 150+ Pakistani cities with Open-Parcel inspection!`;
  }

  if (q.includes('track') || q.includes('order status') || q.includes('where is my order')) {
    return `📦 **Track Your Nawira Traders Order**:
To track your order, click the **"Track Order"** link in the top bar or enter your Order ID (format: \`HPS-XXXXXX\` or \`VPK-XXXXXX\`).
You can also message our WhatsApp helpline at **+92 301 8543131** with your name and city for an instant courier dispatch update!`;
  }

  if (q.includes('5g') || q.includes('gaming')) {
    return `🚀 **Best 5G & Gaming Smartphones**:
1. **Samsung Galaxy S24 Ultra**: Snapdragon 8 Gen 3, Vapor Chamber cooling
2. **Tecno Camon 30 Pro 5G**: Rs. 93,499 (Dimensity 8200 Ultimate 5G)
3. **OnePlus Nord CE 2 5G**: Rs. 109,999 (90Hz fluid AMOLED, 65W charging)
4. **Samsung Galaxy A56 / A57 5G**: Rs. 130,999 - Rs. 147,999 (Super AMOLED 120Hz)
All devices feature high-speed 5G cellular antennas with 100% PTA clearance.`;
  }

  if (q.includes('amoled') || q.includes('120hz') || q.includes('display')) {
    return `📱 **120Hz AMOLED Display Phones**:
Over 100 models in our catalog feature ultra-smooth 120Hz AMOLED screens:
- **Samsung Galaxy S24 Ultra / S23 Ultra** (Dynamic AMOLED 2X 120Hz)
- **Infinix Note 40** (120Hz AMOLED at just Rs. 57,999!)
- **Xiaomi Redmi Note 15 Pro Plus** (1.5K CrystalRes AMOLED 120Hz)
- **Huawei Nova 9** (Curved 120Hz OLED)
Use our catalog display filter to explore all 120Hz AMOLED models!`;
  }

  // Default friendly assistant response
  return `👋 Welcome to **Nawira Traders**!
I'm **NawiraBot**, your AI shopping specialist. Here is how I can help you:
- 📱 **Phone Recommendations**: Tell me your budget (e.g. *"Best phone under 40k"* or *"Keypad phone"*).
- 📦 **Open-Parcel COD**: How you can inspect before paying the courier rider.
- ✅ **PTA DIRBS Approval**: Verification instructions via SMS 8484.
- 💳 **0% EMI Installments**: Banks and tenures supported.
- 🛡️ **Brand Warranties**: Official nationwide service centers.
- 📞 **Helpline**: WhatsApp support available at **+92 301 8543131**.

What phone or policy can I help you with today?`;
}

const SYSTEM_PROMPT = `You are "NawiraBot", the official AI shopping and support assistant for Nawira Traders (nawiratraders.com) - Pakistan's premier PTA-Approved Mobile Marketplace.
Respond concisely, politely, and professionally in English using bold text and bullet points. Always emphasize 100% PTA approval, Open-Parcel delivery, and official brand warranties. If the user wants human support, direct them to WhatsApp +92 301 8543131.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessage = body?.message || '';

    // Sanitize user input
    const cleanMessage = sanitizeText(rawMessage, 500);

    if (!cleanMessage) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || '';

    // If API key is missing or not a standard Google Studio key (e.g. internal token),
    // immediately return our fast, comprehensive smart knowledge engine without waiting.
    if (!apiKey || !apiKey.startsWith('AIzaSy')) {
      const smartReply = getSmartAssistantResponse(cleanMessage);
      return NextResponse.json({ reply: smartReply }, { status: 200 });
    }

    // Otherwise, call Gemini with strict 2500ms timeout
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: cleanMessage }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
        }),
        signal: AbortSignal.timeout(2500),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText && generatedText.trim()) {
          return NextResponse.json({ reply: generatedText.trim() });
        }
      }
    } catch {
      // Fallback seamlessly to smart local response
    }

    const fallbackReply = getSmartAssistantResponse(cleanMessage);
    return NextResponse.json({ reply: fallbackReply }, { status: 200 });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { reply: getSmartAssistantResponse('') },
      { status: 200 }
    );
  }
}
