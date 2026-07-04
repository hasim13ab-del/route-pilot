export interface Locality {
  name: string;
  type: 'District' | 'Subdivision' | 'Town' | 'Village' | 'Area';
  district: string;
  state: 'Assam' | 'Nagaland';
  pinCodes?: string[];
  aliases?: string[];
}

export const LOCALITY_DB: Locality[] = [
  // ASSAM - HOJAI DISTRICT
  { name: 'Hojai', type: 'District', district: 'Hojai', state: 'Assam', pinCodes: ['782435'] },
  { name: 'Doboka', type: 'Town', district: 'Hojai', state: 'Assam', pinCodes: ['782440'], aliases: ['Dabaka', 'Dubaka'] },
  { name: 'Lanka', type: 'Town', district: 'Hojai', state: 'Assam', pinCodes: ['782446'] },
  { name: 'Jamunamukh', type: 'Town', district: 'Hojai', state: 'Assam', pinCodes: ['782428'] },
  { name: 'Niz Doboka', type: 'Village', district: 'Hojai', state: 'Assam', pinCodes: ['782440'] },
  { name: 'Hindu Block', type: 'Area', district: 'Hojai', state: 'Assam', aliases: ['Hndu Blok', 'Hindu Blok', 'HinduBlok'] },
  { name: 'Paschim Solmarijan', type: 'Area', district: 'Hojai', state: 'Assam', aliases: ['Solmarijan', 'Pachim Solmarijan'] },
  { name: 'Islampur', type: 'Area', district: 'Hojai', state: 'Assam' },
  { name: 'Kodoba', type: 'Area', district: 'Hojai', state: 'Assam' },
  { name: 'Siddha Ashram', type: 'Area', district: 'Hojai', state: 'Assam' },
  { name: 'Rajbari Road', type: 'Area', district: 'Hojai', state: 'Assam' },
  { name: 'Longlibosti', type: 'Village', district: 'Hojai', state: 'Assam' },
  { name: 'Nahargoan', type: 'Village', district: 'Hojai', state: 'Assam', aliases: ['Nahargaon'] },
  { name: 'Nilbagan', type: 'Town', district: 'Hojai', state: 'Assam', pinCodes: ['782445'] },
  { name: 'Murajhar', type: 'Town', district: 'Hojai', state: 'Assam', pinCodes: ['782439'] },

  // ASSAM - NAGAON DISTRICT
  { name: 'Nagaon', type: 'District', district: 'Nagaon', state: 'Assam', pinCodes: ['782001'] },
  { name: 'Raha', type: 'Town', district: 'Nagaon', state: 'Assam', pinCodes: ['782103'] },
  { name: 'Kaliabor', type: 'Subdivision', district: 'Nagaon', state: 'Assam', pinCodes: ['782137'] },
  { name: 'Samaguri', type: 'Town', district: 'Nagaon', state: 'Assam', pinCodes: ['782140'] },
  { name: 'Kampur', type: 'Town', district: 'Nagaon', state: 'Assam', pinCodes: ['782426'] },

  // ASSAM - KAMRUP METRO (GUWAHATI)
  { name: 'Guwahati', type: 'District', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781001'] },
  { name: 'Dispur', type: 'Area', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781006'] },
  { name: 'Paltan Bazar', type: 'Area', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781008'] },
  { name: 'Maligaon', type: 'Area', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781011'] },
  { name: 'Beltola', type: 'Area', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781028'] },
  { name: 'Hatigaon', type: 'Area', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781038'] },

  // NAGALAND - DIMAPUR DISTRICT
  { name: 'Dimapur', type: 'District', district: 'Dimapur', state: 'Nagaland', pinCodes: ['797112'] },
  { name: 'Purana Bazar', type: 'Area', district: 'Dimapur', state: 'Nagaland', pinCodes: ['797112'], aliases: ['Purana Bazar B'] },
  { name: 'Diphupar', type: 'Area', district: 'Dimapur', state: 'Nagaland', pinCodes: ['797115'] },
  { name: 'Burma Camp', type: 'Area', district: 'Dimapur', state: 'Nagaland', pinCodes: ['797112'] },
  { name: 'Duncan Basti', type: 'Area', district: 'Dimapur', state: 'Nagaland', pinCodes: ['797113'] },

  // NAGALAND - KOHIMA DISTRICT
  { name: 'Kohima', type: 'District', district: 'Kohima', state: 'Nagaland', pinCodes: ['797001'] },
  { name: 'Jotsoma', type: 'Village', district: 'Kohima', state: 'Nagaland' },
  { name: 'BOC', type: 'Area', district: 'Kohima', state: 'Nagaland' },

  // NAGALAND - CHÜMOUKEDIMA
  { name: 'Chümoukedima', type: 'District', district: 'Chümoukedima', state: 'Nagaland', pinCodes: ['797103'], aliases: ['Chumukedima', 'Chumoukedima Town'] },
  { name: 'Seithekema', type: 'Village', district: 'Chümoukedima', state: 'Nagaland' },
];
