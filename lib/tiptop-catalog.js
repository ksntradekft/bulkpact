// KSN Trade preview catalogue. Names/categories are checked against tiptopbg.com (2026-09-18).
// SOURCE is a manufacturer reference, NOT proof of Hungarian availability or image usage rights.
// photoSlug is set ONLY when the exact manufacturer's product URL was individually verified.
const ORIGIN='https://www.tiptopbg.com';
const groups=[
  {id:'petifur',name:'Peti fours és XXL',source:'/category/petufuri',art:'/images/sweet.svg',products:[
    ['XXL Cocolina', '70 g'],['XXL Vanillina','70 g'],['XXL Marmalina','70 g'],
    ['Peti fours mix',null,'petifuri-miks-tip-top'],['Peti fours mini mix','300 g'],
    ['Peti fours Nº 1',null,'tip-top-petifuri-nomer-1'],['Peti fours Nº 2'],['Peti fours Nº 9'],
    ['Peti fours Nº 10',null,'tip-top-petifuri-10'],['Peti fours Nº 12'],['Peti fours Nº 15',null,'tip-top-petifuri-15'],
    ['Peti fours Nº 16',null,'tip-top-petifuri-16'],['Peti fours Nº 18',null,'tip-top-petifuri-18'],
    ['Peti fours Nº 21'],['Peti fours Nº 60']
  ]},
  {id:'sutemenyek',name:'Sütemények és kekszek',source:'/category/sladkarski-produkrti',art:'/images/biscuits.svg',products:[
    ['Whoopie Pie kakaó','65 g','whoopie-pie'],['Whoopie Pie vanília','65 g','tip-top-whoopie-pie-vaniliya'],
    ['Whoopie Pie áfonya','65 g','tip-top-whoopie-pie-borovinka'],['Whoopie Pie red velvet','65 g','tip-top-whoopie-pie-cherveno-kadife'],
    ['Whoopie Pie matcha','65 g'],['Chiamagos levélkeksz','85 g'],['Kendermagos levélkeksz','85 g'],
    ['Mákos levélkeksz','85 g'],['Mézes sütemény',null,'medenki-tip-top'],
    ['Fehér bevonatos mézes sütemény',null,'medenki-s-byal-kuvertyur-tip-top'],
    ['Kakaócseppes mézes sütemény','50 g'],['Fehér cseppes mézes sütemény','50 g'],
    ['Selene lekváros'],['Selene fehér szórás'],['Selene kakaós szórás'],
    ['Hold keksz'],['Filé keksz'],['Bio Chocolate Chips','200 g'],
    ['Tejcsokoládés chips mandulával','200 g'],['Étcsokoládés chips mogyoróval','200 g']
  ]},
  {id:'szirupos',name:'Baklava és szirupos édességek',source:'/category/siropirani-izdeliya',art:'/images/sweet.svg',products:[
    ['Mini baklava','500 g'],['Mini tulumba','500 g'],['Mini kadaif','600 g'],['Mini saralia','600 g'],
    ['Szirupos sütemény mix','500 g'],['Tulumba','10 × 100 g'],['Kadaif','9 × 100 g'],
    ['Saralia','9 × 100 g'],['Saralia Jotem','1 kg']
  ]},
  {id:'tisztitoszerek',name:'Tisztítószerek és mosogatószerek',source:'/category/pochistvashti-produkti',art:'/images/salty.svg',products:[
    ['Univerzális padlótisztító, rózsa',null,'universalen-preparat-tip-top-za-pochisvane-na-pod-roza'],
    ['Univerzális padlótisztító, trópusi'],['Univerzális padlótisztító, gyümölcsös'],
    ['Univerzális zsíroldó, citrom'],['Sütő- és grilltisztító, citrom',null,'preparat-tip-top-za-pochistvane-na-furni-i-barbekyu-limon'],
    ['Univerzális felülettisztító spray, gyümölcsös'],['Bútortisztító spray, méz és tej'],
    ['Parketta- és laminálttisztító, méz és tej'],['Mosogatószer Power, alma'],['Mosogatószer Power, citrom'],
    ['Mosogatószer balzsam, narancs'],['Mosogatószer balzsam, kókusz'],['Fürdőszobai tisztító, alma'],
    ['Üvegtisztító, trópusi',null,'preparat-tip-top-za-stakla-ogledala-i-gladki-povarhnosti-tropic'],
    ['Üvegtisztító, rózsa'],['Üvegtisztító, aloe vera']
  ]},
  {id:'auto',name:'Autóápolás',source:'/category/avtomobilni-produkti',art:'/images/salty.svg',products:[
    ['Felnitisztító, használatra kész',null,'preparat-tip-top-za-pochistvane-na-djanti-gotov-za-upotreba'],
    ['Felnitisztító koncentrát'],['Gumiápoló, használatra kész'],['Gumiápoló koncentrát'],
    ['Folyékony viasz'],['Aktív hab'],['Aktív hab, pink'],['Aktív hab, green'],['Aktív hab, blue'],
    ['Rovareltávolító'],['Téli szélvédőmosó -20 °C'],['Téli szélvédőmosó koncentrát -60 °C'],
    ['Nyári szélvédőmosó'],['Szélvédő-jégoldó']
  ]},
  {id:'higienia',name:'Higiénia és folyékony szappan',source:'/category/kozmetika-i-dezinfekciya',art:'/images/sweet.svg',products:[
    ['Gyöngyházfényű folyékony szappan, rózsa'],['Gyöngyházfényű folyékony szappan, aloe vera'],
    ['Krémes folyékony szappan, méz és tej'],['Krémes folyékony szappan, olíva'],
    ['Krémes folyékony szappan, kókusz'],['CheapY folyékony szappan, aloe vera'],
    ['CheapY folyékony szappan, gyümölcsös'],['Survivor szúnyog- és kullancsriasztó']
  ]}
];
export const categories=groups.map(({id,name,source,art})=>({id,name,source:ORIGIN+source,art}));
export const catalogue=groups.flatMap(group=>group.products.map(([name,pack,photoSlug],index)=>({
  id:`${group.id}-${index+1}`,name:`Tip Top ${name}`,pack:pack||null,category:group.id,
  categoryName:group.name,source:ORIGIN+(photoSlug?'/product/'+photoSlug:group.source),
  photoSlug:photoSlug||null,illustration:group.art,published:false,priceHuf:null,stock:null
})));
export const featuredProducts=[...catalogue.filter(p=>p.photoSlug)].slice(0,8);
