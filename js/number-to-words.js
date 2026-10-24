/**
 * Number to Words & Currency Formatter
 * Supports Indian Numbering System (Lakhs, Crores) and International System (Millions, Billions).
 */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertUnderThousand(num) {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ONES[num % 10] : '') + ' ';
  } else if (num > 0) {
    str += ONES[num] + ' ';
  }
  return str.trim();
}

/**
 * Converts number to words using Indian numbering system (Crores, Lakhs, Thousands, Hundreds)
 */
export function numberToWordsIndian(num) {
  if (isNaN(num) || num === null || num === undefined) return '';
  num = Math.round(Number(num) * 100) / 100;
  if (num === 0) return 'Zero';

  const isNegative = num < 0;
  num = Math.abs(num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let n = integerPart;
  let words = '';

  if (n >= 10000000) {
    const crore = Math.floor(n / 10000000);
    words += convertUnderThousand(crore) + ' Crore ';
    n %= 10000000;
  }

  if (n >= 100000) {
    const lakh = Math.floor(n / 100000);
    words += convertUnderThousand(lakh) + ' Lakh ';
    n %= 100000;
  }

  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += convertUnderThousand(thousand) + ' Thousand ';
    n %= 1000;
  }

  if (n > 0) {
    words += convertUnderThousand(n) + ' ';
  }

  words = words.trim();

  let result = (isNegative ? 'Minus ' : '') + words;

  if (decimalPart > 0) {
    result += ' and ' + convertUnderThousand(decimalPart) + ' Paise';
  }

  return result.replace(/\s+/g, ' ').trim() + ' Only';
}

/**
 * Converts number to words using Western numbering system (Billions, Millions, Thousands)
 */
export function numberToWordsInternational(num) {
  if (isNaN(num) || num === null || num === undefined) return '';
  num = Math.round(Number(num) * 100) / 100;
  if (num === 0) return 'Zero';

  const isNegative = num < 0;
  num = Math.abs(num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let n = integerPart;
  let words = '';

  if (n >= 1000000000) {
    const billion = Math.floor(n / 1000000000);
    words += convertUnderThousand(billion) + ' Billion ';
    n %= 1000000000;
  }

  if (n >= 1000000) {
    const million = Math.floor(n / 1000000);
    words += convertUnderThousand(million) + ' Million ';
    n %= 1000000;
  }

  if (n >= 1000) {
    const thousand = Math.floor(n / 1000);
    words += convertUnderThousand(thousand) + ' Thousand ';
    n %= 1000;
  }

  if (n > 0) {
    words += convertUnderThousand(n) + ' ';
  }

  words = words.trim();
  let result = (isNegative ? 'Minus ' : '') + words;

  if (decimalPart > 0) {
    result += ' and ' + convertUnderThousand(decimalPart) + ' Cents';
  }

  return result.replace(/\s+/g, ' ').trim() + ' Only';
}

/**
 * Converts amount to words given a currency code (INR, USD, EUR, GBP, AED, etc.)
 */
export function amountInWords(amount, currency = 'INR') {
  if (currency === 'INR') {
    return 'Rupees ' + numberToWordsIndian(amount);
  }
  const prefix = {
    USD: 'US Dollars ',
    EUR: 'Euros ',
    GBP: 'Pounds Sterling ',
    AED: 'UAE Dirhams ',
    CAD: 'Canadian Dollars ',
    AUD: 'Australian Dollars ',
    SGD: 'Singapore Dollars '
  }[currency] || `${currency} `;

  return prefix + numberToWordsInternational(amount);
}

/**
 * Formats a number in Indian Comma notation (e.g. 12,34,567.89) or standard notation
 */
export function formatCurrencyNumber(amount, currency = 'INR', decimals = 2) {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Currency Symbols Map
 */
export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  CAD: 'CA$',
  AUD: 'AU$',
  SGD: 'SG$'
};

export function getCurrencySymbol(currency = 'INR') {
  return CURRENCY_SYMBOLS[currency] || (currency + ' ');
}
