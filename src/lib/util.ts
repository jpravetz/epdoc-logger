import { Integer } from '@epdoc/typeutil';

export function StringEx(str: string) {
  return new StringUtil(str);
}

export class StringUtil {
  private _str: string;
  constructor(str: string) {
    this._str = str;
  }

  /**
   * Returns the plural form of a word based on the given count.
   * @param {string} singular - The singular form of the word.
   * @param {Integer} n - The count of items.
   * @param {string} [plural] - The plural form of the word (optional).
   * @returns {string} The plural form of the word.
   */
  plural(n: Integer, plural?: string) {
    if (n === 1) {
      return this._str;
    }
    return plural ? plural : this._str + 's';
  }

  /** LLM generated function to count and remove tabs at the beginning of a string */
  countTabsAtBeginningOfString(): Integer {
    let count = 0;
    for (let i = 0; i < this._str.length; i++) {
      if (this._str[i] === '\t') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  rightPadAndTruncate(length: Integer, char = ' '): string {
    return this._str.length > length
      ? this._str.slice(0, length - 1)
      : this._str + char.repeat(length - this._str.length);
  }
}
