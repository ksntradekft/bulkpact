export type MonetizationAudience = 'BUYER' | 'MANUFACTURER' | 'WHOLESALER';
export type BillingPeriod = 'FREE' | 'MONTHLY' | 'YEARLY' | 'ONE_TIME' | 'PER_ORDER' | 'PERCENTAGE' | 'CUSTOM';

export type PlanEntitlements = {
  aiTranslation?: boolean;
  responseSla?: string;
  successFeePct?: number;
  activeGroupOrders?: number | null;
  groupOrderFeePct?: number;
  featuredProfile?: boolean;
  analytics?: 'basic' | 'advanced' | 'enterprise';
  monthlyBoostCredits?: number;
  monthlyLeadCredits?: number;
  verificationDiscountPct?: number;
  exportTools?: boolean;
  teamSeats?: number | null;
};

export type MonetizationPlan = {
  code: string; audience: MonetizationAudience; nameHu: string; nameEn: string;
  priceMonthly: number | null; priceYearly: number | null; currency: 'EUR'; featured?: boolean;
  descriptionHu: string; descriptionEn: string; featuresHu: string[]; featuresEn: string[];
  entitlements: PlanEntitlements;
};

export type MonetizationAddOn = {
  code: string; audiences: MonetizationAudience[]; nameHu: string; nameEn: string;
  descriptionHu: string; descriptionEn: string; price: number | null; pricePct?: number;
  currency: 'EUR'; period: BillingPeriod; unitHu?: string; unitEn?: string;
  entitlementKey?: string; creditType?: 'BOOST' | 'LEAD'; creditAmount?: number;
};

export const MONETIZATION_PLANS: MonetizationPlan[] = [
  { code:'BUYER_FREE', audience:'BUYER', nameHu:'Free', nameEn:'Free', priceMonthly:0, priceYearly:0, currency:'EUR',
    descriptionHu:'Belépés az aktív közös beszerzésekhez.', descriptionEn:'Access to active Group Orders.',
    featuresHu:['Group Orderek böngészése','Mennyiség lefoglalása','MOQ és határidő követése','Alap értesítések','1 felhasználó'],
    featuresEn:['Browse Group Orders','Reserve quantities','Track MOQ and deadlines','Basic notifications','1 user'],
    entitlements:{aiTranslation:false,responseSla:'standard',successFeePct:6,exportTools:false,teamSeats:1}},
  { code:'BUYER_BUSINESS', audience:'BUYER', nameHu:'Business', nameEn:'Business', priceMonthly:29, priceYearly:290, currency:'EUR', featured:true,
    descriptionHu:'Aktív kiskereskedőknek és HoReCa vevőknek.', descriptionEn:'For active retailers and HoReCa buyers.',
    featuresHu:['Minden Free funkció','Landed-cost nézet','Korábbi hozzáférés kiemelt dealekhez','Buyer demand jelzés','2 felhasználó','5% standard tranzakciós díj'],
    featuresEn:['Everything in Free','Landed-cost view','Earlier access to selected deals','Buyer demand signals','2 users','5% standard transaction fee'],
    entitlements:{aiTranslation:true,responseSla:'48h',successFeePct:5,exportTools:true,teamSeats:2}},
  { code:'BUYER_PRO', audience:'BUYER', nameHu:'Pro Buying', nameEn:'Pro Buying', priceMonthly:79, priceYearly:790, currency:'EUR',
    descriptionHu:'Rendszeres, nagyobb volumenű B2B beszerzőknek.', descriptionEn:'For frequent, higher-volume B2B buyers.',
    featuresHu:['Minden Business funkció','Prioritásos allocation','Haladó vásárlási riportok','Demand intelligence','Exportálható adatok','5 felhasználó','3,5% standard tranzakciós díj'],
    featuresEn:['Everything in Business','Priority allocation','Advanced purchasing reports','Demand intelligence','Exportable data','5 users','3.5% standard transaction fee'],
    entitlements:{aiTranslation:true,responseSla:'24h',successFeePct:3.5,exportTools:true,teamSeats:5}},
  { code:'BUYER_ENTERPRISE', audience:'BUYER', nameHu:'Enterprise', nameEn:'Enterprise', priceMonthly:null, priceYearly:null, currency:'EUR',
    descriptionHu:'Egyedi díjstruktúra, több telephely és volumenalapú megállapodás.', descriptionEn:'Custom fees, multi-location access and volume-based commercial terms.',
    featuresHu:['Korlátlan felhasználó','Egyedi tranzakciós díj','Dedikált account manager','Egyedi riport/API','Több telephely kezelése'],
    featuresEn:['Unlimited users','Custom transaction fee','Dedicated account manager','Custom reporting/API','Multi-location management'],
    entitlements:{aiTranslation:true,responseSla:'custom',successFeePct:2.5,exportTools:true,teamSeats:null}},

  { code:'MFG_STARTER', audience:'MANUFACTURER', nameHu:'Supplier Starter', nameEn:'Supplier Starter', priceMonthly:0, priceYearly:0, currency:'EUR',
    descriptionHu:'Egy aktív Group Orderrel kipróbálható beszállítói csomag.', descriptionEn:'Test BulkPact with one active Group Order.',
    featuresHu:['1 aktív Group Order','Beszállítói profil','Alap fill-rate statisztika','5% Group Order platformdíj'],
    featuresEn:['1 active Group Order','Supplier profile','Basic fill-rate analytics','5% Group Order platform fee'],
    entitlements:{activeGroupOrders:1,groupOrderFeePct:5,featuredProfile:false,analytics:'basic',monthlyBoostCredits:0,monthlyLeadCredits:0,verificationDiscountPct:0,teamSeats:1}},
  { code:'MFG_BASIC', audience:'MANUFACTURER', nameHu:'Supplier Basic', nameEn:'Supplier Basic', priceMonthly:39, priceYearly:390, currency:'EUR', featured:true,
    descriptionHu:'Rendszeresen nagy MOQ-s ajánlatokat indító beszállítóknak.', descriptionEn:'For suppliers launching regular high-MOQ deals.',
    featuresHu:['5 aktív Group Order','Verification kedvezmény','Alap analitika','1 boost kredit / hó','4% Group Order platformdíj','2 felhasználó'],
    featuresEn:['5 active Group Orders','Verification discount','Basic analytics','1 boost credit / month','4% Group Order platform fee','2 users'],
    entitlements:{activeGroupOrders:5,groupOrderFeePct:4,featuredProfile:false,analytics:'basic',monthlyBoostCredits:1,monthlyLeadCredits:5,verificationDiscountPct:25,teamSeats:2}},
  { code:'MFG_PRO', audience:'MANUFACTURER', nameHu:'Supplier Pro', nameEn:'Supplier Pro', priceMonthly:99, priceYearly:990, currency:'EUR',
    descriptionHu:'Exportorientált beszállítóknak több kampánnyal és keresleti insighttal.', descriptionEn:'For export-oriented suppliers needing more campaigns and demand insight.',
    featuresHu:['20 aktív Group Order','Kiemelt beszállítói profil','3 boost kredit / hó','Buyer demand insight','Haladó analitika','2,5% Group Order platformdíj','5 felhasználó'],
    featuresEn:['20 active Group Orders','Featured supplier profile','3 boost credits / month','Buyer demand insights','Advanced analytics','2.5% Group Order platform fee','5 users'],
    entitlements:{activeGroupOrders:20,groupOrderFeePct:2.5,featuredProfile:true,analytics:'advanced',monthlyBoostCredits:3,monthlyLeadCredits:20,verificationDiscountPct:50,teamSeats:5}},
  { code:'MFG_PREMIUM', audience:'MANUFACTURER', nameHu:'Supplier Premium', nameEn:'Supplier Premium', priceMonthly:199, priceYearly:1990, currency:'EUR',
    descriptionHu:'Nagy volumenű partnereknek korlátlan kampánnyal és prémium láthatósággal.', descriptionEn:'For high-volume partners with unlimited campaigns and premium visibility.',
    featuresHu:['Korlátlan Group Order','Premium kiemelés','10 boost kredit / hó','Prioritásos buyer demand insight','Enterprise analitika','1,5% Group Order platformdíj','10 felhasználó'],
    featuresEn:['Unlimited Group Orders','Premium placement','10 boost credits / month','Priority buyer-demand insights','Enterprise analytics','1.5% Group Order platform fee','10 users'],
    entitlements:{activeGroupOrders:null,groupOrderFeePct:1.5,featuredProfile:true,analytics:'enterprise',monthlyBoostCredits:10,monthlyLeadCredits:50,verificationDiscountPct:100,teamSeats:10}},

  { code:'WHS_STARTER', audience:'WHOLESALER', nameHu:'Wholesale Starter', nameEn:'Wholesale Starter', priceMonthly:0, priceYearly:0, currency:'EUR',
    descriptionHu:'Nagykereskedőknek és importőröknek egy aktív közös beszerzéssel.', descriptionEn:'For wholesalers and importers with one active pooled deal.',
    featuresHu:['1 aktív Group Order','Alap telítettségi statisztika','5% Group Order platformdíj'], featuresEn:['1 active Group Order','Basic fill-rate analytics','5% Group Order platform fee'],
    entitlements:{activeGroupOrders:1,groupOrderFeePct:5,featuredProfile:false,analytics:'basic',teamSeats:1}},
  { code:'WHS_BASIC', audience:'WHOLESALER', nameHu:'Wholesale Basic', nameEn:'Wholesale Basic', priceMonthly:49, priceYearly:490, currency:'EUR', featured:true,
    descriptionHu:'Rendszeres stocklot és kamionos ajánlatokhoz.', descriptionEn:'For regular stocklot and truckload deals.',
    featuresHu:['8 aktív Group Order','1 boost kredit / hó','Buyer demand insight','4% Group Order platformdíj','2 felhasználó'], featuresEn:['8 active Group Orders','1 boost credit / month','Buyer demand insights','4% Group Order platform fee','2 users'],
    entitlements:{activeGroupOrders:8,groupOrderFeePct:4,featuredProfile:false,analytics:'basic',monthlyBoostCredits:1,monthlyLeadCredits:10,teamSeats:2}},
  { code:'WHS_PRO', audience:'WHOLESALER', nameHu:'Wholesale Pro', nameEn:'Wholesale Pro', priceMonthly:129, priceYearly:1290, currency:'EUR',
    descriptionHu:'Több országot kiszolgáló nagykereskedőknek.', descriptionEn:'For wholesalers serving multiple markets.',
    featuresHu:['30 aktív Group Order','Kiemelt profil','5 boost kredit / hó','Haladó demand analytics','2,5% Group Order platformdíj','5 felhasználó'], featuresEn:['30 active Group Orders','Featured profile','5 boost credits / month','Advanced demand analytics','2.5% Group Order platform fee','5 users'],
    entitlements:{activeGroupOrders:30,groupOrderFeePct:2.5,featuredProfile:true,analytics:'advanced',monthlyBoostCredits:5,monthlyLeadCredits:30,teamSeats:5}},
  { code:'WHS_ENTERPRISE', audience:'WHOLESALER', nameHu:'Wholesale Enterprise', nameEn:'Wholesale Enterprise', priceMonthly:299, priceYearly:2990, currency:'EUR',
    descriptionHu:'Nagy volumenű, többpiacos beszerzési hálózatoknak.', descriptionEn:'For high-volume, multi-market wholesale networks.',
    featuresHu:['Korlátlan Group Order','Prémium láthatóság','10 boost kredit / hó','Enterprise analytics','Egyedi logisztikai workflow','1,5% Group Order platformdíj'], featuresEn:['Unlimited Group Orders','Premium visibility','10 boost credits / month','Enterprise analytics','Custom logistics workflow','1.5% Group Order platform fee'],
    entitlements:{activeGroupOrders:null,groupOrderFeePct:1.5,featuredProfile:true,analytics:'enterprise',monthlyBoostCredits:10,monthlyLeadCredits:80,teamSeats:10}},
];

export const MONETIZATION_ADDONS: MonetizationAddOn[] = [
  {code:'GROUP_ORDER_BOOST_7D',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Group Order boost 7 napra',nameEn:'Group Order boost for 7 days',descriptionHu:'Kiemelt kampány a publikus és buyer felületeken.',descriptionEn:'Featured campaign across public and buyer surfaces.',price:39,currency:'EUR',period:'ONE_TIME',entitlementKey:'GROUP_ORDER_BOOST',creditType:'BOOST',creditAmount:1},
  {code:'CATEGORY_SPONSOR_MONTH',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Kategória szponzoráció',nameEn:'Category sponsorship',descriptionHu:'Szponzorált pozíció egy kiválasztott B2B termékkategóriában.',descriptionEn:'Sponsored position in a selected B2B product category.',price:299,currency:'EUR',period:'MONTHLY',entitlementKey:'CATEGORY_SPONSOR'},
  {code:'LEAD_PACK_10',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'10 buyer demand kredit',nameEn:'10 buyer-demand credits',descriptionHu:'Extra hozzáférés aggregált buyer demand lehetőségekhez.',descriptionEn:'Additional access to aggregated buyer-demand opportunities.',price:49,currency:'EUR',period:'ONE_TIME',creditType:'LEAD',creditAmount:10},
  {code:'MARKET_INTELLIGENCE_REPORT',audiences:['BUYER','MANUFACTURER','WHOLESALER'],nameHu:'B2B keresleti riport',nameEn:'B2B demand intelligence report',descriptionHu:'Aggregált keresleti, kategória- és volumenriport egy kiválasztott piacról.',descriptionEn:'Aggregated demand, category and volume report for a selected market.',price:89,currency:'EUR',period:'ONE_TIME',entitlementKey:'MARKET_INTELLIGENCE_REPORT'},
  {code:'LOGISTICS_QUOTE_COORDINATION',audiences:['BUYER','MANUFACTURER','WHOLESALER'],nameHu:'Fuvarajánlat koordináció',nameEn:'Logistics quote coordination',descriptionHu:'Fuvarigény strukturálása és ajánlatkérési koordináció egy Group Orderhez.',descriptionEn:'Freight requirement structuring and quote coordination for one Group Order.',price:35,currency:'EUR',period:'ONE_TIME',entitlementKey:'LOGISTICS_QUOTE_COORDINATION'},
  {code:'GROUP_ORDER_SETUP_SERVICE',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Group Order kampány setup',nameEn:'Managed Group Order setup',descriptionHu:'A BulkPact csapata beállítja a fix árat, MOQ-t, határidőt és buyer kommunikációt.',descriptionEn:'BulkPact structures the fixed price, MOQ, deadline and buyer-facing campaign content.',price:79,currency:'EUR',period:'ONE_TIME',entitlementKey:'GROUP_ORDER_SETUP_SERVICE'},
  {code:'BUYER_INTENT_INSIGHTS_MONTH',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Buyer demand insight 30 napra',nameEn:'Buyer-demand insights for 30 days',descriptionHu:'Kibővített keresleti és érdeklődési statisztikák releváns buyer aktivitásból.',descriptionEn:'Extended demand and intent analytics based on relevant buyer activity.',price:59,currency:'EUR',period:'MONTHLY',entitlementKey:'BUYER_INTENT_INSIGHTS'},
  {code:'DATA_EXPORT_MONTH',audiences:['BUYER','MANUFACTURER','WHOLESALER'],nameHu:'Haladó export / riport',nameEn:'Advanced export / reporting',descriptionHu:'CSV/riport export és historikus Group Order KPI-k.',descriptionEn:'CSV/report exports and historical Group Order KPIs.',price:39,currency:'EUR',period:'MONTHLY',entitlementKey:'ADVANCED_EXPORT'},
  {code:'EXPRESS_VERIFICATION',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Express verification',nameEn:'Express verification',descriptionHu:'Prioritásos beszállítói ellenőrzési sor.',descriptionEn:'Priority supplier verification queue.',price:179,currency:'EUR',period:'ONE_TIME',entitlementKey:'EXPRESS_VERIFICATION'},
  {code:'API_DATA_ACCESS_MONTH',audiences:['BUYER','MANUFACTURER','WHOLESALER'],nameHu:'API / adat-hozzáférés',nameEn:'API / data access',descriptionHu:'Strukturált Group Order és riportadatok integrációs célra.',descriptionEn:'Structured Group Order and reporting data for integrations.',price:149,currency:'EUR',period:'MONTHLY',entitlementKey:'API_DATA_ACCESS'},
  {code:'GROUP_ORDER_TRANSACTION_FEE',audiences:['MANUFACTURER','WHOLESALER'],nameHu:'Group Order tranzakciós díj',nameEn:'Group Order transaction fee',descriptionHu:'A sikeresen teljesült közös beszerzés értékére számított platformdíj.',descriptionEn:'Platform fee calculated on successfully completed Group Order GMV.',price:null,pricePct:4,currency:'EUR',period:'PERCENTAGE'},
  {code:'SUCCESS_FEE',audiences:['BUYER','MANUFACTURER','WHOLESALER'],nameHu:'Tranzakciós díj',nameEn:'Transaction fee',descriptionHu:'A lezárt rendelés GMV-jére számított, csomagtól függő díj.',descriptionEn:'Plan-dependent fee calculated on completed-order GMV.',price:null,pricePct:5,currency:'EUR',period:'PERCENTAGE'},
];

export function plansForAudience(audience: MonetizationAudience) { return MONETIZATION_PLANS.filter(p=>p.audience===audience); }
export function addonsForAudience(audience: MonetizationAudience) { return MONETIZATION_ADDONS.filter(a=>a.audiences.includes(audience)); }
export function getPlan(code:string|null|undefined) { return MONETIZATION_PLANS.find(p=>p.code===code)||null; }
export function normalizePlanCode(raw:string|null|undefined,audience:MonetizationAudience):string{
  const value=String(raw||'').toUpperCase(); if(getPlan(value)?.audience===audience)return value;
  if(audience==='BUYER'){if(value==='PRO')return'BUYER_PRO';if(value==='ENTERPRISE')return'BUYER_ENTERPRISE';if(value==='VERIFIED')return'BUYER_BUSINESS';return'BUYER_FREE';}
  if(audience==='WHOLESALER'){if(value==='PRO')return'WHS_PRO';if(value==='ENTERPRISE')return'WHS_ENTERPRISE';if(value==='VERIFIED')return'WHS_BASIC';return value.startsWith('MFG_')?value:'WHS_STARTER';}
  if(value==='PRO')return'MFG_PRO';if(value==='ENTERPRISE')return'MFG_PREMIUM';if(value==='VERIFIED')return'MFG_BASIC';return value.startsWith('WHS_')?value:'MFG_STARTER';
}
export function formatPlanPrice(plan:MonetizationPlan,yearly=false,locale:'hu'|'en'='hu'){
  const value=yearly?plan.priceYearly:plan.priceMonthly;if(value==null)return locale==='en'?'Custom':'Egyedi';if(value===0)return locale==='en'?'Free':'Ingyenes';return `${new Intl.NumberFormat(locale==='en'?'en-GB':'hu-HU').format(value)} €${yearly?(locale==='en'?'/year':'/év'):(locale==='en'?'/month':'/hó')}`;
}
