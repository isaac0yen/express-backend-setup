
export const strings = {
  capitalizeLetters: (str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  },
  replacePlaceholders: (str: string, replacements: Record<string, string>): string => {
    return str.replace(/\[(.*?)\]/g, (match, key) => {
      return replacements.hasOwnProperty(key) ? replacements[key] : match;
    });
  }
};
