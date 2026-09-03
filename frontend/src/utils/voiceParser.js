import { MATERIAL_KEYWORDS, LABOUR_KEYWORDS, EQUIPMENT_KEYWORDS, ACTIVITY_KEYWORDS, FLOOR_KEYWORDS } from './voiceConstants';

const _l = (s) => (s || '').toLowerCase().trim();

const _num = (s) => {
  const raw = (s || '').replace(/[,]/g, '').trim();
  const n = Number(raw);
  return isNaN(n) ? null : n;
};

const DIGIT_MAP = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14',
  fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
  twenty: '20', thirty: '30', forty: '40', fifty: '50',
  sixty: '60', seventy: '70', eighty: '80', ninety: '90',
  hundred: '100', thousand: '1000',
};

function spokenToDigits(text) {
  if (!text) return '';
  let t = text.toLowerCase().trim();

  const compound = t.match(/^(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)$/);
  if (compound) {
    const tens = DIGIT_MAP[compound[1]];
    const ones = DIGIT_MAP[compound[2]];
    if (tens && ones) return String(Number(tens) + Number(ones));
  }
  if (DIGIT_MAP[t] !== undefined) return DIGIT_MAP[t];
  return t;
}

function extractNumber(text) {
  if (!text) return null;

  const digitMatch = text.match(/(\d[\d,]*\.?\d*)/);
  if (digitMatch) return _num(digitMatch[1]);

  const wordMatch = text.match(
    /([\w]+(?:\s+[\w]+)*)/i
  );
  if (wordMatch) {
    const asDigit = spokenToDigits(wordMatch[1]);
    const n = _num(asDigit);
    if (n !== null) return n;
  }
  return null;
}

function extractItem(raw, keywordList) {
  const lower = _l(raw);
  for (const kw of keywordList) {
    if (lower.includes(_l(kw))) return kw;
  }
  return null;
}

function extractBrand(raw) {
  if (!raw) return null;
  const lower = _l(raw);
  const brands = [
    'tata', 'jindal', 'sail', 'jspl', 'ambuja', 'ultratech', 'birla', 'dalmia',
    'acc', 'lapindo', 'asia', 'kajaria', 'somany', 'hindware', 'johnson',
    'cera', 'jaquar', 'havells', 'polycab', 'finolex', '.anchor', 'gm',
    'schneider', 'philips', 'wipro', 'syska', 'crompton', 'bajaj', 'orient',
    'premier', 'century', 'greenply', 'royal touch', 'europanel',
    'asian paints', 'berger', 'nippon', 'dulux', 'kansai',
    'saint gobain', 'asahi', 'goldplus', 'tata tiscon',
  ];
  for (const b of brands) {
    if (lower.includes(b)) return b;
  }
  return null;
}

function extractUnit(raw) {
  if (!raw) return null;
  const lower = _l(raw);
  const units = [
    'kg', 'kgs', 'kilogram', 'kilograms',
    'quintal', 'quintals', 'ton', 'tons', 'tonne', 'tonnes',
    'bag', 'bags', 'cement bag', 'cement bags',
    'piece', 'pieces', 'pc', 'pcs',
    'bag', 'unit', 'units',
    'ft', 'feet', 'foot',
    'inch', 'inches',
    'sqft', 'sq ft', 'square feet',
    'cum', 'm3', 'cubic meter', 'cubic meters',
    'litre', 'litres', 'liter', 'liters', 'ltr', 'ltrs',
    'meter', 'meters', 'metre', 'metres', 'mtr', 'mtrs',
    'load', 'loads',
    'trip', 'trips',
    'barrel', 'barrels',
    'roll', 'rolls',
    'bundle', 'bundles',
    'crate', 'crates',
    'pipe', 'pipes',
    'rod', 'rods',
    'no', 'nos', 'number', 'numbers',
  ];
  for (const u of units) {
    if (lower.includes(u)) return u;
  }
  return null;
}

function extractAmountAndQuantity(raw) {
  if (!raw) return { amount: null, quantity: null, unitPrice: null };
  const lower = _l(raw);

  const rateMatch = lower.match(/(\d[\d,]*\.?\d*)\s*(?:pieces?|pcs?|bags?|units?|kg|kgs?|metres?|meters?|feet|ft|rolls?|loads?|trips?)\s*(?:at|@|for|per)\s*(?:rs\.?|inr|rupees)?\s*(\d[\d,]*\.?\d*)/);
  if (rateMatch) {
    return {
      quantity: _num(rateMatch[1]),
      unitPrice: _num(rateMatch[2]),
      amount: _num(rateMatch[1]) * _num(rateMatch[2]),
    };
  }

  const amountMatch = lower.match(/(?:amount|total|cost|price|rate|value|bill)\s*(?:is|:)?\s*(?:rs\.?|inr|rupees)?\s*(\d[\d,]*\.?\d*)/);
  if (amountMatch) {
    return { amount: _num(amountMatch[1]), quantity: null, unitPrice: null };
  }

  const standalone = raw.match(/(\d[\d,]*\.?\d*)/);
  if (standalone) {
    const val = _num(standalone[1]);

    const after = lower.slice(lower.indexOf(standalone[1]) + standalone[1].length).trim();
    const unitWords = ['bags', 'bag', 'kg', 'kgs', 'pieces', 'pcs', 'units', 'metres', 'meters', 'feet', 'ft', 'loads', 'trips', 'rolls'];
    if (unitWords.some(uw => after.startsWith(uw))) {
      return { quantity: val, amount: null, unitPrice: null };
    }
    return { amount: val, quantity: null, unitPrice: null };
  }

  return { amount: null, quantity: null, unitPrice: null };
}

function extractLabourDetails(raw, transcript) {
  if (!raw) return {};
  const lower = _l(raw) + ' ' + _l(transcript);
  const result = {};

  const workerMatch = lower.match(/(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s*(?:workers?|labourers?|masons?|carpenters?|painters?|plumbers?|electricians?|helpers?|fitters?|welders?|bar benders?|tilers?|mazdoors?|maistries?|supervisors?|contractors?)/);
  if (workerMatch) {
    result.workerCount = extractNumber(workerMatch[1]);
  }

  const hoursMatch = lower.match(/(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s*(?:hours?|hrs?)/);
  if (hoursMatch) {
    result.hoursWorked = extractNumber(hoursMatch[1]);
  }

  const advanceMatch = lower.match(/advance\s*(?:rs\.?|inr|rupees)?\s*(\d[\d,]*\.?\d*)/);
  if (advanceMatch) {
    result.advanceAmount = _num(advanceMatch[1]);
  }

  const wageMatch = lower.match(/(?:daily\s*wage|rate|per\s*day|wages?)\s*(?:is|:)?\s*(?:rs\.?|inr|rupees)?\s*(\d[\d,]*\.?\d*)/);
  if (wageMatch) {
    result.dailyWage = _num(wageMatch[1]);
  }

  return result;
}

function extractEquipmentDetails(raw, transcript) {
  if (!raw) return {};
  const lower = _l(raw) + ' ' + _l(transcript);
  const result = {};

  const operatorMatch = lower.match(/operator\s+(\w+(?:\s+\w+)?)/);
  if (operatorMatch) {
    result.operatorName = operatorMatch[1].trim();
  }

  const hoursMatch = lower.match(/(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)\s*(?:hours?|hrs?)/);
  if (hoursMatch) {
    result.hoursUsed = extractNumber(hoursMatch[1]);
  }

  const fuelMatch = lower.match(/(?:fuel|diesel|petrol|fuel\s*cost)\s*(?:is|:)?\s*(?:rs\.?|inr|rupees)?\s*(\d[\d,]*\.?\d*)/);
  if (fuelMatch) {
    result.fuelCost = _num(fuelMatch[1]);
  }

  return result;
}

export function parseTranscript(rawTranscript, projectContext = null) {
  const transcript = (rawTranscript || '').trim();
  const lower = _l(transcript);
  const result = {
    entryType: 'material',
    items: [],
    projectName: projectContext?.projectName || null,
    floor: null,
    phase: null,
    activity: null,
    amount: null,
    quantity: null,
    unitPrice: null,
    workerCount: null,
    hoursWorked: null,
    dailyWage: null,
    advanceAmount: null,
    operatorName: null,
    hoursUsed: null,
    fuelCost: null,
    brand: null,
    unit: null,
    gstApplicable: false,
    gstPercentage: null,
    paymentMode: null,
    notes: null,
    rawTranscript: transcript,
  };

  const materialScore = MATERIAL_KEYWORDS.filter(kw => lower.includes(_l(kw))).length;
  const labourScore = LABOUR_KEYWORDS.filter(kw => lower.includes(_l(kw))).length;
  const equipmentScore = EQUIPMENT_KEYWORDS.filter(kw => lower.includes(_l(kw))).length;

  if (labourScore > 0 && labourScore >= materialScore && labourScore >= equipmentScore) {
    result.entryType = 'labour';
  } else if (equipmentScore > 0 && equipmentScore > materialScore) {
    result.entryType = 'equipment';
  } else {
    result.entryType = 'material';
  }

  for (const kw of FLOOR_KEYWORDS) {
    const fl = _l(kw);
    const idx = lower.indexOf(fl);
    if (idx !== -1) {

      const afterFloor = transcript.slice(idx + fl.length).trim();
      const floorNum = extractNumber(afterFloor);
      if (floorNum !== null) {
        result.floor = String(floorNum);
        break;
      }
    }
  }

  const ordinals = { first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10' };
  for (const [word, num] of Object.entries(ordinals)) {
    if (lower.includes(word + ' floor')) {
      result.floor = num;
      break;
    }
  }

  for (const kw of ACTIVITY_KEYWORDS) {
    const fl = _l(kw);
    if (lower.includes(fl)) {
      result.activity = kw;
      break;
    }
  }

  const gstMatch = lower.match(/(?:gst|goods?\s*and\s*services?\s*tax)\s*(?:applicable|included|yes|on)?\s*(?:at)?\s*(\d{1,2})\s*%?/);
  if (gstMatch) {
    result.gstApplicable = true;
    result.gstPercentage = _num(gstMatch[1]);
  } else if (lower.includes('gst')) {
    result.gstApplicable = true;
    result.gstPercentage = result.gstPercentage || 18;
  }

  const paymentModes = ['cash', 'upi', 'bank transfer', 'neft', 'rtgs', 'cheque', 'check', 'credit', 'debit card', 'online'];
  for (const pm of paymentModes) {
    if (lower.includes(pm)) {
      result.paymentMode = pm;
      break;
    }
  }

  const itemKeywords = result.entryType === 'material'
    ? MATERIAL_KEYWORDS
    : result.entryType === 'labour'
    ? LABOUR_KEYWORDS
    : EQUIPMENT_KEYWORDS;

  const item = extractItem(transcript, itemKeywords);
  if (item) {
    result.items.push(item);
  }

  result.brand = extractBrand(transcript);

  result.unit = extractUnit(transcript);

  const { amount, quantity, unitPrice } = extractAmountAndQuantity(transcript);
  result.amount = amount;
  result.quantity = quantity;
  result.unitPrice = unitPrice;

  if (result.entryType === 'labour') {
    const labour = extractLabourDetails(transcript, transcript);
    Object.assign(result, labour);

    if (!result.amount && result.workerCount && result.hoursWorked && result.dailyWage) {
      result.amount = result.workerCount * result.hoursWorked * result.dailyWage;
    }
  } else if (result.entryType === 'equipment') {
    const eq = extractEquipmentDetails(transcript, transcript);
    Object.assign(result, eq);
  }

  result.notes = transcript;

  return result;
}

export function computeAmount(parsed) {
  if (!parsed) return 0;

  if (parsed.amount) return parsed.amount;

  if (parsed.entryType === 'material' && parsed.quantity && parsed.unitPrice) {
    return parsed.quantity * parsed.unitPrice;
  }

  if (parsed.entryType === 'labour') {
    if (parsed.workerCount && parsed.hoursWorked && parsed.dailyWage) {
      return parsed.workerCount * parsed.hoursWorked * parsed.dailyWage;
    }
    if (parsed.workerCount && parsed.dailyWage) {
      return parsed.workerCount * parsed.dailyWage;
    }
  }

  if (parsed.entryType === 'equipment') {
    if (parsed.quantity && parsed.unitPrice) return parsed.quantity * parsed.unitPrice;
    if (parsed.hoursUsed && parsed.unitPrice) return parsed.hoursUsed * parsed.unitPrice;
  }

  return 0;
}
