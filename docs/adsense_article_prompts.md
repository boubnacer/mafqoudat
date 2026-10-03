# AdSense Article Generation Prompts (IDs 17 to 30)
## Complete, Ready-to-Paste Prompts for Claude 3.5 Sonnet / GPT-4o / Gemini Pro

Each prompt below is 100% self-contained, pre-configured with the exact Article ID, slug, category, real-world administrative agencies, strict AdSense compliance rules (1,000+ words, no em-dashes, no robotic clichés), and the exact multilingual JSON output schema ready to insert into `client/src/data/blogPosts.json`.

---

## Prompt 17: International Flights & Airline Lost Baggage

```markdown
You are a senior aviation consumer rights journalist, civic tech editor, and international travel legal specialist writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on recovering lost luggage on international flights.

### ARTICLE CONFIGURATION:
- ID: 17
- SLUG: lost-luggage-international-flights-airline-guide
- CATEGORY: international
- TAGS: ["flights", "luggage", "travel", "compensation"]
- TARGET REGION: International / Global Air Travel
- EXACT TITLE: Lost Luggage on International Flights: Complete Recovery Guide, PIR Reports & Airline Compensation
- KEY REAL-WORLD ENTITIES TO INCLUDE: WorldTracer system, PIR (Property Irregularity Report) form, Montreal Convention liability limits (SDR / Special Drawing Rights), airline baggage service desks, 21-day declaration deadline for permanently lost bags, baggage claim tag numbers.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words. Do NOT generate thin summaries.
2. NO ROBOTIC AI TELLS:
   - Absolutely NO em-dashes (—). Use colons, parentheses, or clean commas.
   - NO generic clichés: Never start with "In today's fast-paced world...", "Losing an item is a nightmare...", or "Picture this...". Start immediately with the first action to take at the carousel.
   - NO empty conclusions: Do NOT say "In conclusion, Mafqoudat is here for you...". End with a practical "Next Steps Emergency Action Checklist".
3. REAL PROCEDURAL CONTEXT: Explain the exact step-by-step procedure of filing a Property Irregularity Report (PIR) before leaving customs, tracking through WorldTracer with the 10-character reference (e.g., CMNMS12345), and claiming interim necessity reimbursements.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callout boxes for critical deadlines and warnings.
   - Use **bold** for key forms, deadlines, and terminology.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Immediate Actions at the Baggage Carousel (Before Exiting Customs)
   - ## 2. Filing the Property Irregularity Report (PIR) & WorldTracer Tracking
   - ## 3. Passenger Rights & Compensation Under the Montreal Convention
   - ## 4. How to Safely Search & Post Online Without Leaking Flight Information
   - ## 5. Delayed vs. Permanently Lost Luggage: Timelines and Claim Escalation
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver the article in 3 languages: English, French, and Arabic (formal Modern Standard Arabic / Fusha).

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching this schema:
{
  "id": 17,
  "slug": "lost-luggage-international-flights-airline-guide",
  "date": "2026-10-03",
  "readTime": "8 min",
  "image": "/blog-images/lost-luggage-international-flights-airline-guide.png",
  "authorKey": "mafqoudatTeam",
  "categoryKey": "international",
  "tagKeys": ["flights", "luggage", "travel", "compensation"],
  "i18n": {
    "en": {
      "title": "Lost Luggage on International Flights: Complete Recovery Guide, PIR Reports & Airline Compensation",
      "excerpt": "A step-by-step international guide on recovering lost or delayed baggage at airports, filing a Property Irregularity Report (PIR), and claiming airline compensation.",
      "content": "Full 1000+ words Markdown content with ## headings, lists, and callouts..."
    },
    "fr": {
      "title": "Bagages Perdus sur Vols Internationaux : Guide de Récupération, Rapport PIR et Indemnisation",
      "excerpt": "Guide complet pour retrouver vos bagages égarés à l'aéroport, remplir le constat d'irrégularité (PIR) et faire valoir vos droits d'indemnisation.",
      "content": "Full 1000+ words Markdown content in French..."
    },
    "ar": {
      "title": "فقدان الأمتعة في الرحلات الجوية الدولية: دليل الاسترداد الشامل، تقرير PIR والتعويضات",
      "excerpt": "دليل عملي شامل لاستعادة الحقائب المفقودة أو المتأخرة في المطارات الدولية، تقديم تقرير PIR ومطالبة شركات الطيران بالتعويض القانوني.",
      "content": "Full 1000+ words Markdown content in Arabic..."
    }
  }
}
```

---

## Prompt 18: Anti-Loss Smart Technology (AirTags, SmartTags & Google Find Hub)

```markdown
You are a consumer technology editor, digital privacy engineer, and hardware specialist writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on deploying Bluetooth trackers and smart tracking networks to protect valuables against loss and theft.

### ARTICLE CONFIGURATION:
- ID: 18
- SLUG: smart-tracking-airtags-smarttags-prevent-loss
- CATEGORY: technology
- TAGS: ["airtag", "technology", "smarttags", "prevention"]
- TARGET REGION: Global / Universal
- EXACT TITLE: Next-Gen Anti-Loss Technology: Apple AirTags, Samsung SmartTags & Google Find My Device Network
- KEY REAL-WORLD ENTITIES TO INCLUDE: Apple Find My network, Samsung SmartThings Find, Google Find My Device crowdsourced network, Ultra-Wideband (UWB) precision finding, separation alerts, CR2032 battery lifespan, airline regulatory approval (FAA/EASA battery rules), anti-stalking safety alerts.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words. Do NOT generate thin summaries.
2. NO ROBOTIC AI TELLS:
   - Absolutely NO em-dashes (—). Use colons, parentheses, or clean commas.
   - NO generic clichés: Do not start with "In this fast-evolving digital world...". Start directly with how modern crowdsourced Bluetooth mesh networks fundamentally changed lost property recovery.
   - NO empty conclusions: End with a practical "Valuables Protection Setup Checklist".
3. REAL TECHNICAL & PRACTICAL DEPTH: Compare Apple, Samsung, and Google networks objectively. Detail how to conceal trackers in wallets, luggage, bicycles, and car interiors. Explain the exact legal precautions when tracking stolen vs. misplaced property.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callout boxes for critical security and battery warnings.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. How Modern Crowdsourced Tracking Networks Actually Work
   - ## 2. Platform Comparison: Apple Find My vs. Samsung SmartThings vs. Google Find My Device
   - ## 3. Best Practices for Placing Trackers in Wallets, Keys, Bags & Vehicles
   - ## 4. Crucial Security: Anti-Stalking Alerts, Privacy Controls & Battery Maintenance
   - ## 5. What to Do When Your Tracker Detects a Moving Item (Safety & Law Enforcement)
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver the article in 3 languages: English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 18, slug "smart-tracking-airtags-smarttags-prevent-loss", categoryKey "technology", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 19: Shipping Found Items Internationally & Customs Clearance

```markdown
You are an international trade, customs logistics, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how to safely ship found belongings across international borders back to their rightful owners.

### ARTICLE CONFIGURATION:
- ID: 19
- SLUG: shipping-found-items-internationally-customs-guide
- CATEGORY: international
- TAGS: ["shipping", "customs", "international", "safety"]
- TARGET REGION: International / Diaspora (Morocco, Maghreb, Gulf, Europe, Worldwide)
- EXACT TITLE: How to Return and Ship Found Items Internationally: Customs Declarations, Couriers & Security
- KEY REAL-WORLD ENTITIES TO INCLUDE: International commercial invoice, CN22 / CN23 customs declaration forms, HS Tariff codes for "Returned Personal Effects", prohibited airmail items (lithium-ion batteries in uncertified packaging), courier options (DHL Express, FedEx, Aramex, Poste Maroc / Barid Al Maghrib), insurance coverage, escrow fraud prevention.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words. Do NOT generate thin summaries.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL LOGISTICAL DEPTH: Explain why declaring an item as a "Gift" causes unexpected customs duties for the owner, and how declaring "Returned Used Personal Property / Effets Personnels Usagés" prevents illegal tariffs. Detail packaging rules for electronics with lithium batteries.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for customs duty traps.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Verifying Ownership Before Agreeing to International Shipping
   - ## 2. Customs Declarations: Filling CN22/CN23 to Avoid Unfair Import Duties
   - ## 3. Carrier Selection & Packaging Rules for Electronics and Documents
   - ## 4. Who Pays for Shipping? Safe Reimbursement and Avoiding Payment Scams
   - ## 5. Tracking, Package Insurance & Proof of Delivery Protocols
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 19, slug "shipping-found-items-internationally-customs-guide", categoryKey "international", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 20: Lost Bank Cards While Traveling Abroad

```markdown
You are a banking compliance specialist, financial cyber-security analyst, and travel safety editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on emergency protocols when bank credit or debit cards are lost or stolen while traveling abroad.

### ARTICLE CONFIGURATION:
- ID: 20
- SLUG: lost-stolen-bank-cards-traveling-abroad
- CATEGORY: safety
- TAGS: ["banking", "cards", "safety", "travel"]
- TARGET REGION: International / Travelers across Arab world and Europe
- EXACT TITLE: Lost or Stolen Bank Cards While Traveling Abroad: Emergency Blocking, Replacement & Protection
- KEY REAL-WORLD ENTITIES TO INCLUDE: Visa Global Customer Care, Mastercard Global Service, mobile banking instant card freeze, ATM skimming detection, police loss report (*dépôt de plainte / محضر شرطة*) for insurance, emergency emergency cash wire (Western Union / MoneyGram), chargeback dispute windows.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL FINANCIAL DEPTH: Explain the difference between temporary freeze (*gel temporaire*) and permanent cancellation (*opposition définitive*). Provide step-by-step instructions on emergency cash disbursement without a physical card.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for time-sensitive fraud windows (e.g. first 24 hours).
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Immediate Actions: App Freeze vs. Bank Phone Opposition
   - ## 2. Obtaining Emergency Cash and Replacement Cards in a Foreign Country
   - ## 3. Filing an Official Police Report for Bank Fraud and Travel Insurance
   - ## 4. How to Spot ATM Skimming, Card Trapping, and Rogue Contactless Transactions
   - ## 5. Digital Wallets (Apple Pay, Google Wallet) as Backup Lifelines
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 20, slug "lost-stolen-bank-cards-traveling-abroad", categoryKey "safety", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 21: Found an Unlocked Smartphone (Ethical Return & Privacy)

```markdown
You are a digital privacy expert, cybersecurity investigator, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide for individuals who find a lost smartphone on how to ethically and safely return it without invading the owner's privacy or risking accusations of theft.

### ARTICLE CONFIGURATION:
- ID: 21
- SLUG: found-smartphone-ethical-return-privacy-guide
- CATEGORY: electronics
- TAGS: ["phone", "privacy", "ethics", "safety"]
- TARGET REGION: Global / Universal
- EXACT TITLE: Found an Unlocked Smartphone: How to Contact the Owner Safely Without Breaching Privacy
- KEY REAL-WORLD ENTITIES TO INCLUDE: Apple Medical ID, Android Emergency Information, lock screen voice assistants (Siri / Google Assistant: "Call Mom", "Call Home"), keeping the device charged and connected to cellular/Wi-Fi for tracking, avoiding browsing photos or private chats, IMEI number check on SIM tray, handing over to police or transit authorities if uncontactable.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL ETHICAL & LEGAL CLARITY: Explain legal boundary between finding a device and criminal invasion of privacy or theft by conversion. Detail how to communicate with callers when the lost phone rings.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for privacy and data protection boundaries.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. First Golden Rule: Keep It Powered On and Connected
   - ## 2. How to Access Emergency Medical ID and ICE Contacts on iOS and Android
   - ## 3. Using Voice Commands to Reach Family Without Unlocking Private Apps
   - ## 4. Legal and Ethical Boundaries: Privacy Rights and Anti-Extortion Rules
   - ## 5. Arranging a Safe Public Handover or Official Transit Depot Surrender
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 21, slug "found-smartphone-ethical-return-privacy-guide", categoryKey "electronics", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 22: Lost Belongings During Umrah or Hajj (Makkah & Madinah)

```markdown
You are an investigative civic journalist, Islamic heritage consultant, and pilgrim logistics specialist writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how pilgrims can recover lost personal belongings, documents, and money in Makkah (Masjid al-Haram) and Madinah (Masjid an-Nabawi) during Umrah or Hajj.

### ARTICLE CONFIGURATION:
- ID: 22
- SLUG: lost-items-umrah-hajj-makkah-madinah-guide
- CATEGORY: guides
- TAGS: ["umrah", "hajj", "makkah", "saudi"]
- TARGET REGION: Saudi Arabia / Worldwide Pilgrims (KSA, North Africa, Egypt, Gulf, Global Muslims)
- EXACT TITLE: Lost Belongings During Umrah or Hajj in Makkah & Madinah: Official Haramain Recovery Guide
- KEY REAL-WORLD ENTITIES TO INCLUDE: General Authority for the Care of the Two Holy Mosques (Haramain Lost & Found Centers / مكاتب المفقودات بالحرم المكي والنبوي), Bab King Abdulaziz lost center, Bab as-Salam lost center in Madinah, Nusuk app (منصة نسك), Ministry of Hajj & Umrah unified helpline (1966), Pilgrim Guide Offices (Tawafa / مكاتب الطوافة), Islamic rulings on found items in the Haram sanctuary (*Luqatah in Haram*).

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL LOCAL & RELIGIOUS ACCURACY: Clarify the special religious status of *Luqatah* in the Haram sanctuary (where taking found items for personal ownership is strictly forbidden in Shariah; finders must deposit them at official Haramain lost offices). Give exact physical locations of the lost property centers in Makkah and Madinah.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for sanctuary sacred rules and deadlines.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Haramain Sanctuary Lost Property Offices: Locations and Working Hours
   - ## 2. Islamic Jurisprudence on Found Property in Makkah and Madinah (Luqatah)
   - ## 3. Recovering Lost Passports and Umrah Visas: Ministry of Hajj Protocols
   - ## 4. Hotel Security, Pilgrim Shuttle Buses & Grand Mosque Courtyard Sweeps
   - ## 5. Preventing Loss in Massive Crowds: Identification Bracelets & Smart Tips
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 22, slug "lost-items-umrah-hajj-makkah-madinah-guide", categoryKey "guides", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 23: Lost Iqama or Passport in Saudi Arabia

```markdown
You are a Saudi labor law consultant, administrative procedures specialist, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on official government procedures when a resident or citizen loses their Iqama (Muqeem residence card), Passport, or National ID in the Kingdom of Saudi Arabia.

### ARTICLE CONFIGURATION:
- ID: 23
- SLUG: lost-iqama-residence-permit-passport-saudi-arabia
- CATEGORY: documents
- TAGS: ["iqama", "saudi", "passport", "documents"]
- TARGET REGION: Saudi Arabia (Citizens & Expatriate Residents)
- EXACT TITLE: What to Do If You Lose Your Iqama or Passport in Saudi Arabia: Absher & Jawazat Guide
- KEY REAL-WORLD ENTITIES TO INCLUDE: Absher platform (أبشر أفراد / أعمال), General Directorate of Passports (المديرية العامة للجوازات), loss reporting window (24 hours to avoid statutory fines), digital Iqama on Absher Individuals app / Tawakkalna (توكلنا), police station loss certificate (*Balaagh Faqd*), consular emergency travel document procedures.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL ADMINISTRATIVE PRECISION: Detail the exact clicks in the Absher portal: My Services > Passports > Report Lost Document (*خدماتي > الجوازات > الإبلاغ عن الوثائق المفقودة*). Detail the penalty structure for late loss reporting under Saudi residency regulations.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for government deadlines and statutory fines.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Legal Obligation: The 24-Hour Reporting Window and Statutory Fines
   - ## 2. Step-by-Step Reporting on the Absher Portal (Muqeem and Citizens)
   - ## 3. Replacing a Lost Foreign Passport: Jawazat and Consular Coordination
   - ## 4. Digital ID on Tawakkalna and Absher as an Interim Legal Proof
   - ## 5. Preventing Identity Theft and Commercial Fraud Using Lost IDs
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 23, slug "lost-iqama-residence-permit-passport-saudi-arabia", categoryKey "documents", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 24: Lost Property in Dubai and the UAE (Police, RTA & DXB)

```markdown
You are a Dubai municipal affairs consultant, smart government analyst, and UAE civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on recovering lost items, electronics, and documents in Dubai and the UAE across taxis, metro, hotels, and airports.

### ARTICLE CONFIGURATION:
- ID: 24
- SLUG: lost-property-dubai-uae-police-rta-guide
- CATEGORY: guides
- TAGS: ["dubai", "uae", "rta", "police"]
- TARGET REGION: United Arab Emirates (Dubai & Abu Dhabi)
- EXACT TITLE: Lost Property in Dubai and the UAE: Dubai Police Smart App, RTA Taxis & DXB Airport
- KEY REAL-WORLD ENTITIES TO INCLUDE: Dubai Police Smart App (Lost & Found Certificate / شهادة فقدان), Dubai Police toll-free 901 (non-emergency), RTA (Roads and Transport Authority) call center 800 90 90 for Dubai Taxi / Metro, Dubai International Airport (DXB) Terminal Lost & Found, Smart Police Stations (SPS 24/7).

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL SMART GOV DEPTH: Detail how to generate a digital Lost Item Certificate via the Dubai Police App, how RTA matches taxi trips through Nol card history or credit card receipt timestamps, and the strict legal consequences of keeping found property under UAE Federal Penal Code (theft by finding).
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for official police hotlines and legal requirements.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Immediate Reporting via Dubai Police App & 24/7 Smart Police Stations (SPS)
   - ## 2. Recovering Items Left in Dubai Taxis, Metro, or Trams via RTA (800 90 90)
   - ## 3. Lost Baggage and Belongings at Dubai International Airport (DXB)
   - ## 4. UAE Legal Framework: Finder Responsibilities and Penalties for Unreturned Goods
   - ## 5. Claiming Found Property and Required Verification Proof
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 24, slug "lost-property-dubai-uae-police-rta-guide", categoryKey "guides", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 25: Lost Belongings in Cairo (Metro, Trains & Airport, Egypt)

```markdown
You are an Egyptian administrative affairs specialist, public transit investigative journalist, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how to search for and recover lost items, luggage, and national identity papers across Cairo's major public transit systems, railways, and international airport.

### ARTICLE CONFIGURATION:
- ID: 25
- SLUG: lost-items-cairo-metro-trains-airport-egypt
- CATEGORY: transit
- TAGS: ["cairo", "egypt", "metro", "airport"]
- TARGET REGION: Egypt (Cairo, Giza, Alexandria)
- EXACT TITLE: Lost Belongings in Cairo: Metro Stations, Egyptian Railways & Cairo Airport Recovery Steps
- KEY REAL-WORLD ENTITIES TO INCLUDE: Cairo Metro Central Lost Property Office at Sadat / Anwar Sadat station and Al-Shohadaa station (مكتب مفقودات مترو أنفاق القاهرة), Egyptian National Railways (ENR / Ramses Station lost office / هيئة سكك حديد مصر), Cairo International Airport Baggage Claim (Terminal 1, 2, 3), filing a police report (*Mahdar Faqd / محضر فقد*) at the local police department (*Qism El Shorta*), Civil Registry (*El Segell El Madani*).

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL LOCAL EGYPTIAN CONTEXT: Explain the physical process of visiting the Sadat metro station lost property office, how long items are held before transfer to central government depots, the legal necessity of an official police report (*Mahdar*) before bank card or national ID reissuance.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for official office operating hours and bureaucracy tips.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Cairo Metro Lost Property Bureaus: Sadat Station and Al-Shohadaa
   - ## 2. Egyptian National Railways (ENR): Recovering Items at Ramses Station
   - ## 3. Cairo International Airport: Terminal Baggage Holding & Customs Inspection
   - ## 4. Official Police Report (Mahdar Faqd): Why It Is Mandatory and How to File It
   - ## 5. Replacing Lost Egyptian National IDs (Bataqa) and Driver's Licenses
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 25, slug "lost-items-cairo-metro-trains-airport-egypt", categoryKey "transit", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 26: Lost National ID (CIN), Passport, or License in Morocco

```markdown
You are a Moroccan administrative legal counselor, civil rights investigative journalist, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on the exact, legal step-by-step procedures for replacing a lost or stolen Moroccan National Identity Card (CNIE / Carte Nationale), Passport, or Driver's License (*Permis de conduire*).

### ARTICLE CONFIGURATION:
- ID: 26
- SLUG: lost-cin-national-id-passport-morocco-guide
- CATEGORY: documents
- TAGS: ["cnie", "morocco", "passport", "narsa"]
- TARGET REGION: Morocco & Moroccan Citizens Abroad (MRE)
- EXACT TITLE: Lost Moroccan National ID (CIN), Passport, or Permis: Step-by-Step DGSN & NARSA Guide
- KEY REAL-WORLD ENTITIES TO INCLUDE: DGSN (Direction Générale de la Sûreté Nationale / الشرطة), Gendarmerie Royale (in rural zones), Moqaddem / Caïdat / Arrondissement certification of loss (*Certificat de perte*), NARSA portal (Agence Nationale de la Sécurité Routière / narsa.ma) for driver's license duplicate, passeport.ma fiscal stamps (Timbre fiscal électronique), avoiding identity theft in bank account opening.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL ADMINISTRATIVE MOROCCAN DEPTH: Clarify the distinction between administrative loss (*perte*) and criminal theft (*vol*). Detail the exact documents required at the district police station (*Arrondissement de police*), fees, electronic stamps, and interim receipt (*Récépissé*) validity.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for legal document protection and deadlines.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Declaration of Loss: Visiting the Police District or Gendarmerie Royale
   - ## 2. Replacing the Electronic National Identity Card (CNIE)
   - ## 3. Replacing a Lost Moroccan Passport via Passeport.ma and Provincial Prefectures
   - ## 4. Replacing a Lost Driver's License (Permis de Conduire) on NARSA
   - ## 5. Preventing Identity Fraud: Credit Blacklists and Impersonation Warnings
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 26, slug "lost-cin-national-id-passport-morocco-guide", categoryKey "documents", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 27: Lost Property on Intercity Trains Across North Africa

```markdown
You are a North African railway and intercity transit specialist, consumer advocate, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how passengers can recover items left on regional and high-speed trains and intercity coaches across Morocco, Algeria, and Tunisia.

### ARTICLE CONFIGURATION:
- ID: 27
- SLUG: lost-property-trains-coaches-north-africa-guide
- CATEGORY: transit
- TAGS: ["train", "oncf", "transit", "travel"]
- TARGET REGION: North Africa / Maghreb (Morocco, Algeria, Tunisia)
- EXACT TITLE: Lost Property on Intercity Trains and Long-Distance Coaches Across North Africa (ONCF, SNTF, SNCFT)
- KEY REAL-WORLD ENTITIES TO INCLUDE: ONCF (Morocco / Al Boraq & Atlas trains / Casa-Voyageurs, Rabat-Agdal, Tangier lost depots), SNTF (Société Nationale des Transports Ferroviaires - Algeria / Agha, Oran, Constantine stations), SNCFT (Société Nationale des Chemins de Fer Tunisiens / Tunis Ville), CTM coaches, Supratours, train conductor end-of-line inspections, storage retention limits.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL REGIONAL RAILWAY ACCURACY: Explain the end-of-line inspection protocol (where trains are swept before entering maintenance yards), the exact station master office (*Bureau du Chef de Gare*) procedures, and how long items are kept before public auction or police transfer.
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for train carriage numbers and ticket verification.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Immediate Train Recovery Protocol: Car Number, Train Code & Station Master
   - ## 2. Moroccan Railway Network (ONCF & Al Boraq): Depots and Helplines (2255)
   - ## 3. Algerian Rail (SNTF) and Tunisian Rail (SNCFT): Central Lost Property Offices
   - ## 4. Intercity Long-Distance Coaches (CTM, Supratours): Luggage Hold Claims
   - ## 5. Proving Ownership: Ticket Stubs, Booking SMS, and Item Verification
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 27, slug "lost-property-trains-coaches-north-africa-guide", categoryKey "transit", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 28: Lost Belongings at North African International Airports

```markdown
You are an aviation operations specialist, North African airport logistics analyst, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how travelers can locate and retrieve lost personal items, duty-free bags, electronics, and passports at North Africa's busiest international airport hubs.

### ARTICLE CONFIGURATION:
- ID: 28
- SLUG: lost-items-airports-casablanca-tunis-algiers
- CATEGORY: international
- TAGS: ["airport", "casablanca", "tunis", "algiers"]
- TARGET REGION: North Africa (Morocco, Tunisia, Algeria)
- EXACT TITLE: Recovering Lost Belongings at North African International Airports (Casablanca, Tunis-Carthage, Algiers)
- KEY REAL-WORLD ENTITIES TO INCLUDE: Casablanca Mohammed V Airport (CMN / ONDA - Office National Des Aéroports), Algiers Houari Boumediene Airport (ALG / SGS - Société de Gestion des Services Aéroportuaires d'Alger), Tunis-Carthage Airport (TUN / OACA - Office de l'Aviation Civile et des Aéroports), airport security checkpoints (DGSN / Douane), airline ground handling agents (RAM, Air Algérie, Tunisair).

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL AIRPORT GROUND LOGISTICS: Differentiate between items lost inside the aircraft (handled by airline ground handling) vs. items left at security X-ray scanners or duty-free zones (handled by airport police / civil aviation authorities).
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for customs retention regulations.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. Security Checkpoint vs. In-Flight Loss: Who Holds Your Belongings?
   - ## 2. Casablanca Mohammed V International Airport (CMN): ONDA Lost & Found Bureau
   - ## 3. Algiers Houari Boumediene Airport (ALG): Terminal 1, 2, and West Terminal Procedures
   - ## 4. Tunis-Carthage Airport (TUN): Customs Holding and Baggage Reclamation
   - ## 5. Authorizing a Third Party or Courier to Collect Your Lost Airport Property
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 28, slug "lost-items-airports-casablanca-tunis-algiers", categoryKey "international", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 29: Preventing Lost & Found Extortion Scams Online

```markdown
You are a cybersecurity forensic investigator, financial fraud prevention specialist, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on how people who lose valuable items online can protect themselves from extortion, advance-fee courier scams, and identity theft.

### ARTICLE CONFIGURATION:
- ID: 29
- SLUG: preventing-lost-found-extortion-scams-online
- CATEGORY: safety
- TAGS: ["scams", "safety", "fraud", "security"]
- TARGET REGION: Universal / Global
- EXACT TITLE: How to Detect and Prevent Lost & Found Extortion Scams and Advance-Fee Fraud Online
- KEY REAL-WORLD ENTITIES TO INCLUDE: Advance-fee shipping scam ("I found your laptop, send $50 via wire to ship it"), fake SMS / WhatsApp phishing links pretending to be couriers, verification code theft, spoofed bank transfer receipts, staging safe public meeting points (police stations, bank lobbies), escrow fraud rules.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL CYBERSECURITY & BEHAVIORAL FORENSICS: Detail the psychological pressure tactics scammers use against desperate victims. Provide the exact "Reverse Verification Question" method (e.g., asking for an unposted identifying feature such as a hidden scratch, phone serial suffix, or keychain detail).
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for red flags that warrant immediate communication cutoff.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. The Anatomy of Modern Lost & Found Scams: Advance Fees & Fake Shipping
   - ## 2. The Golden Verification Rule: What NEVER to Disclose in Your Public Listing
   - ## 3. Reverse Verification Questions: How to Trap Fake Claimants Instantly
   - ## 4. Safe Exchange Logistics: Physical Handover Protocol in Public Zones
   - ## 5. What to Do If You Have Been Targeted: Reporting to Cybercrime Authorities
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 29, slug "preventing-lost-found-extortion-scams-online", categoryKey "safety", and complete 1000+ words i18n content for en, fr, and ar.
```

---

## Prompt 30: Lost Dogs & Cats in Urban Neighborhoods

```markdown
You are an animal welfare behavioral specialist, community rescue coordinator, and civic tech editor writing for Mafqoudat (https://www.mafqoudat.com) — a community lost-and-found platform covering North Africa, the Gulf, and international travelers.

Write a comprehensive, authoritative 1,000 to 1,200-word specialized guide on systematic, evidence-based methods for recovering lost domestic pets (dogs and cats) in modern urban cities.

### ARTICLE CONFIGURATION:
- ID: 30
- SLUG: lost-dogs-cats-urban-neighborhood-search-guide
- CATEGORY: community
- TAGS: ["pets", "animals", "community", "recovery"]
- TARGET REGION: Universal / Regional Urban Cities (Casablanca, Dubai, Cairo, Riyadh, Paris, etc.)
- EXACT TITLE: Lost Pets in Urban Cities: Rapid Neighborhood Search Protocols, Vet Alerts & Rescue Networks
- KEY REAL-WORLD ENTITIES TO INCLUDE: Veterinary microchip databases (ISO 11784/11785), physical radius search patterns (lost cat hiding threshold vs. lost dog travel radius), scent station creation at home entrance, animal shelter sweeps, community WhatsApp and Facebook neighborhood group alerts, flyer printing rules.

### STRICT EDITORIAL & ADSENSE COMPLIANCE RULES:
1. WORD COUNT: Exactly 1,000 to 1,300 words.
2. NO ROBOTIC AI TELLS: No em-dashes (—). No generic intros. No empty conclusions.
3. REAL ANIMAL BEHAVIORAL SCIENCE: Explain why indoor cats stay within a 5-house radius in a silent displacement state (usually hiding under cars or stairwells) while dogs follow wind scents and can cover miles. Give exact nocturnal search instructions (flashlight eye-shine detection at 2 AM to 4 AM).
4. IN-ARTICLE FORMATTING:
   - Use ## Section Title for major sections.
   - Use ### Subsection for detailed subsections.
   - Use * bullet points and 1. numbered procedural steps.
   - Use > callouts for time-sensitive search windows.
5. REQUIRED ARTICLE SECTIONS:
   - ## 1. The First 6 Hours: Cat Displacement Behavior vs. Dog Trajectory
   - ## 2. Scent Marking and Home-Base Trapping: Litterbox and Clothing Techniques
   - ## 3. Neighborhood Physical Canvassing: Nocturnal Flashlight Sweeps and Micro-Radii
   - ## 4. Veterinary Clinics, Animal Shelters and Microchip Registration Sweeps
   - ## 5. Designing High-Conversion Physical Flyers and Geo-Targeted Social Posts
   - ## 6. Frequently Asked Questions (FAQ: 4 detailed, practical Q&As)
6. MULTILINGUAL OUTPUT: Deliver in English, French, and Arabic.

### OUTPUT JSON FORMAT:
Return ONLY a valid JSON object matching the standard schema with id 30, slug "lost-dogs-cats-urban-neighborhood-search-guide", categoryKey "community", and complete 1000+ words i18n content for en, fr, and ar.
```
