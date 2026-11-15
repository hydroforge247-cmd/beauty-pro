// Menu and specials as published by Beauty Pro on Fresha and Facebook (checked 15 Nov 2026).
export type Item = { name: string; price: string; time?: string };
export type Group = { id: string; title: string; blurb: string; items: Item[] };

export const MENU: Group[] = [
  { id: "nails", title: "Nails", blurb: "Acrylic, gel, polygel and toes, with free add-ons on full sets.", items: [
    { name: "Acrylic nails", price: "from R300", time: "2h 15" },
    { name: "Acrylic nails with tips", price: "R370", time: "2h" },
    { name: "Sculpture nails", price: "R450", time: "2h" },
    { name: "Polygel nails", price: "from R299", time: "2h" },
    { name: "Overlay, acrylic or gel", price: "from R250", time: "2h" },
    { name: "Toes, gel", price: "R150", time: "1h" },
    { name: "Manicure", price: "R125", time: "1h" },
    { name: "Pedicure", price: "R200", time: "1h" },
  ]},
  { id: "lashes", title: "Lashes and brows", blurb: "Extensions, fills, lamination and brow hair extensions.", items: [
    { name: "Classic lashes", price: "R400", time: "2h" },
    { name: "Volume lashes", price: "R450", time: "2h" },
    { name: "Hybrid lashes", price: "R500", time: "2h" },
    { name: "Lash fills", price: "from R110" },
    { name: "Brow lamination and tint", price: "R399", time: "1h" },
    { name: "Brow hair extensions", price: "R599", time: "1h 30" },
  ]},
  { id: "pmu", title: "Permanent makeup", blurb: "Ombre brows, liner and lips that last.", items: [
    { name: "Ombre powder brows", price: "R899", time: "2h" },
    { name: "Top and bottom eyeliner", price: "R899" },
    { name: "Brow and eyeliner combo", price: "R1,600" },
    { name: "Full powder lips", price: "R799", time: "2h 30" },
    { name: "Lip neutralisation", price: "R899", time: "2h" },
  ]},
  { id: "skin", title: "Face and skin", blurb: "HIFU lifts, plasma, mesotherapy and facials.", items: [
    { name: "HIFU eye lift", price: "R699", time: "1h" },
    { name: "HIFU full face and neck", price: "R1,599", time: "1h" },
    { name: "Dermabrasion", price: "R499" },
    { name: "Algae peel", price: "R650" },
    { name: "Mesotherapy", price: "R1,799", time: "3h" },
    { name: "Fibroblast plasma, full face", price: "R2,999", time: "2h" },
    { name: "RF facial", price: "R249", time: "45m" },
  ]},
  { id: "feet", title: "Feet and massage", blurb: "Slow down: detox, paraffin and proper massage.", items: [
    { name: "Ionic foot detox", price: "R299", time: "45m" },
    { name: "Paraffin wax", price: "R299", time: "1h" },
    { name: "Pedicure with foot massage", price: "R350" },
    { name: "Hot stone massage", price: "R399", time: "45m" },
    { name: "Deep tissue full body", price: "R399", time: "1h" },
    { name: "Couples full body oil massage", price: "R499", time: "45m" },
  ]},
  { id: "body", title: "Body", blurb: "Fat freeze, lymph drainage and cupping lifts.", items: [
    { name: "Fat freeze, 1 cup", price: "R899", time: "1h" },
    { name: "Fat freeze, double chin", price: "R1,199", time: "1h" },
    { name: "Lymph drainage", price: "R399", time: "45m" },
    { name: "Lymph drainage, 5 sessions", price: "R1,799" },
    { name: "Laser teeth whitening", price: "R499", time: "1h" },
  ]},
  { id: "wax", title: "Waxing", blurb: "Quick, clean and done right.", items: [
    { name: "Lip wax", price: "R50" },
    { name: "Underarms", price: "R100" },
    { name: "Bikini", price: "R180" },
    { name: "Hollywood", price: "R250" },
    { name: "Full leg", price: "R250" },
  ]},
];

export const SPECIALS: Item[] = [
  { name: "Nails, gel toes and classic lashes", price: "R699" },
  { name: "HIFU full face", price: "R999" },
  { name: "Black diamond laser", price: "R499" },
  { name: "Top and bottom eyeliner", price: "R699" },
  { name: "Mesotherapy", price: "R1,299" },
  { name: "Fibroblast plasma, full face", price: "R1,999" },
  { name: "Fat freeze, 6 cups", price: "R1,999" },
  { name: "Ombre brows, bring a friend", price: "2 for R1,300" },
];

export const TRAINING: Item[] = [
  { name: "Gel and acrylic nails", price: "R4,999" },
  { name: "Microblading", price: "R4,499" },
  { name: "Tape-in hair extensions", price: "R3,499" },
  { name: "Lipo laser, RF and cavitation", price: "R2,999" },
];
