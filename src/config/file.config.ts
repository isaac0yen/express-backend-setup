import path from "path";
import fs from "fs";

// File paths configuration
const FILE_PATHS = {
  templates: {
    verifyEmail: 'templates/verify-email.html',
  },
} as const;

// Cache for file contents to avoid repeated reads
const fileCache = new Map<string, string>();

// Get the project root directory (assuming this file is in src/config/)
const basePath = path.resolve(__dirname, '../');

/**
 * Read a file by direct path (relative to project root)
 */
function readByPath(relativePath: string): string {
  const cacheKey = relativePath;

  // Return cached version if available
  if (fileCache.has(cacheKey)) {
    return fileCache.get(cacheKey)!;
  }

  try {
    const fullPath = path.resolve(basePath, relativePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Cache the content
    fileCache.set(cacheKey, content);

    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file: ${relativePath}. ${errorMessage}`);
  }
}

/**
 * Read a file by its configured path key
 */
function readFile<T extends keyof typeof FILE_PATHS>(
  category: T,
  fileName: keyof typeof FILE_PATHS[T]
): string {
  const categoryPaths = FILE_PATHS[category];

  if (typeof categoryPaths !== 'object' || categoryPaths === null) {
    throw new Error(`Invalid category: ${String(category)}`);
  }

  const filePath = categoryPaths[fileName];

  if (typeof filePath !== 'string') {
    throw new Error(`File not found in configuration: ${String(category)}.${String(fileName)}`);
  }

  return readByPath(filePath);
}

/**
 * Parse JSON content safely
 */
function parseJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${errorMessage}`);
  }
}

/**
 * Check if a file exists
 */
function fileExists(relativePath: string): boolean {
  try {
    const fullPath = path.resolve(basePath, relativePath);
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
}

/**
 * Validate that a value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validate that a value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Simple API object
const file = {
  // Template helpers
  template: {
    verifyEmail: () => readFile('templates', 'verifyEmail'),
  },

  // Generic read functions
  read: readFile,
  readByPath,

  // Utility functions
  clearCache: () => fileCache.clear(),
  fileExists,
  parseJson,

  // Validation helpers
  isArray,
  isObject,
} as const;

export default file;