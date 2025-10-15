const Validate = {
  isNumber: (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(value) && typeof value === 'number' && isFinite(value);
  },

  isString: (value: any): boolean => {
    if (value === null || value === undefined || value === '' || value.length === 0) return false;
    return typeof value === 'string' || value instanceof String;
  },

  isUrl: (value: string): boolean => {
    if (!value || value === '' || value.length === 0) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  isEmail: (value: string): boolean => {
    if (!value || value === '' || value.length === 0) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isBoolean: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    return typeof value === 'boolean';
  },

  isArray: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    return Array.isArray(value);
  },

  isObject: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    return typeof value === 'object' && !Array.isArray(value);
  },

  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value === '' || value.length === 0 || value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  isDate: (value: any): boolean => {
    if (!value) return false;
    try {
      const date = value instanceof Date ? value : new Date(value);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  },

  isPositive: (value: number): boolean => {
    if (value === null || value === undefined) return false;
    return value > 0;
  },
  isEnum: (value: any, enumValues: any[]): boolean => {
    if (value === null || value === undefined || value === '' || value.length === 0) return false;
    return enumValues.includes(value);
  }
};

export default Validate;