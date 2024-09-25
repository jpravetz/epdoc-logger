import { Integer } from '@epdoc/typeutil';

/**
 * Returns the plural form of a word based on the given count.
 * @param {string} singular - The singular form of the word.
 * @param {Integer} n - The count of items.
 * @param {string} [plural] - The plural form of the word (optional).
 * @returns {string} The plural form of the word.
 */
export function plural(singular: string, n: Integer, plural?: string) {
  if (n === 1) {
    return singular;
  }
  return plural ? plural : singular + 's';
}

/** LLM generated function to count and remove tabs at the beginning of a string */
export function countTabsAtBeginningOfString(str: string): Integer {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

const rightPadAndTruncate = (str: string, length: Integer, char = ' ') => {
  return str.length > length ? str.slice(0, length - 1) : str + char.repeat(length - str.length);
};
