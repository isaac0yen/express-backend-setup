import { DateTime } from 'luxon';

const Validate = {
  isNumber: (value: unknown): boolean => {
    if (value === null || value === undefined || value === '') return false;
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  },

  isString: (value: unknown): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string' && value.length === 0) return false;
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

  isBoolean: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    return typeof value === 'boolean';
  },

  isArray: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    return Array.isArray(value);
  },

  isObject: (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    return typeof value === 'object' && !Array.isArray(value);
  },

  isEmpty: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value === '' || value.length === 0 || value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  isDate: (value: unknown): boolean => {
    if (!value) return false;
    try {
      const dateTime = value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(value as string);
      return dateTime.isValid;
    } catch {
      return false;
    }
  },

  isPositive: (value: number): boolean => {
    if (value === null || value === undefined) return false;
    return value > 0;
  },
  isEnum: (value: unknown, enumValues: unknown[]): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'string' && value.length === 0) return false;
    return enumValues.includes(value);
  }
};

export default Validate;