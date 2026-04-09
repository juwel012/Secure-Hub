export const getCardBrand = (number: string) => {
  if (number.startsWith('4')) return 'Visa';
  if (number.match(/^5[1-5]/)) return 'MasterCard';
  if (number.match(/^3[47]/)) return 'Amex';
  if (number.startsWith('6')) return 'Discover';
  return 'Unknown';
};

export const luhnCheck = (num: string) => {
  let sum = 0;
  let shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};
