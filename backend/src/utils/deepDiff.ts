/**
 * Deep Diff Utility for Audit Logging
 * Compares two objects recursively and returns detailed changes
 */

export interface DiffEntry {
  from: any;
  to: any;
}

export type DiffResult = Record<string, DiffEntry>;

/**
 * Deep compare two values and produce a diff object with { from, to } entries.
 * Handles nested objects, arrays, BigInt, Date, Decimal, null/undefined.
 */
export const deepDiff = (oldData: any, newData: any, prefix = ''): DiffResult => {
  const diff: DiffResult = {};

  if (!oldData || !newData) return diff;

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    // Skip internal/meta fields and DB-only fields that shouldn't appear in diffs
    if ([
      'password_hash', 'password', 'two_factor_otp', 'two_factor_expires',
      'id', 'created_at', 'updated_at', 'product_id'
    ].includes(key)) continue;

    const oldVal = normalizeValue(oldData[key]);
    const newVal = normalizeValue(newData[key]);

    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Both undefined/null → skip
    if (oldVal === undefined && newVal === undefined) continue;
    if (oldVal === null && newVal === null) continue;

    // One side missing
    if (oldVal === undefined || oldVal === null) {
      if (newVal !== undefined && newVal !== null) {
        diff[fullKey] = { from: null, to: newVal };
      }
      continue;
    }
    if (newVal === undefined || newVal === null) {
      diff[fullKey] = { from: oldVal, to: null };
      continue;
    }

    // Arrays
    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : (oldVal !== undefined ? [oldVal] : []);
      const newArr = Array.isArray(newVal) ? newVal : (newVal !== undefined ? [newVal] : []);
      
      if (JSON.stringify(oldArr) === JSON.stringify(newArr)) continue;

      // Match by ID if it's an array of objects with IDs
      const hasIds = oldArr.some((i: any) => i && typeof i === 'object' && 'id' in i) || 
                     newArr.some((i: any) => i && typeof i === 'object' && 'id' in i);

      if (hasIds) {
        // Diff by ID
        const oldMap = new Map(oldArr.filter((i: any) => i && i.id).map((i: any) => [String(i.id), i]));
        const newMap = new Map(newArr.filter((i: any) => i && i.id).map((i: any) => [String(i.id), i]));
        
        for (const [id, oldItem] of oldMap) {
          const newItem = newMap.get(id);
          if (!newItem) {
            diff[`${fullKey}[id=${id}]`] = { from: oldItem, to: null };
          } else {
            const itemDiff = deepDiff(oldItem, newItem, `${fullKey}[id=${id}]`);
            Object.assign(diff, itemDiff);
          }
        }
        for (const [id, newItem] of newMap) {
          if (!oldMap.has(id)) {
            diff[`${fullKey}[id=${id}]`] = { from: null, to: newItem };
          }
        }
      } else {
        // Diff by index
        const maxLen = Math.max(oldArr.length, newArr.length);
        for (let i = 0; i < maxLen; i++) {
          const oldItem = oldArr[i];
          const newItem = newArr[i];
          if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
            if (typeof oldItem === 'object' && typeof newItem === 'object' && oldItem !== null && newItem !== null) {
              const itemDiff = deepDiff(oldItem, newItem, `${fullKey}[${i}]`);
              Object.assign(diff, itemDiff);
            } else {
              diff[`${fullKey}[${i}]`] = { from: oldItem ?? null, to: newItem ?? null };
            }
          }
        }
      }
      continue;
    }

    // Nested objects
    if (typeof oldVal === 'object' && typeof newVal === 'object') {
      const nestedDiff = deepDiff(oldVal, newVal, fullKey);
      Object.assign(diff, nestedDiff);
      continue;
    }

    // Primitive comparison (strict)
    if (String(oldVal) !== String(newVal)) {
      diff[fullKey] = { from: oldVal, to: newVal };
    }
  }

  return diff;
};

/**
 * Normalize values for consistent comparison
 */
function normalizeValue(val: any): any {
  if (val === undefined || val === null) return val;
  if (typeof val === 'bigint') return val.toString();
  if (val instanceof Date) return val.toISOString();
  // Prisma Decimal
  if (typeof val === 'object' && typeof val.toNumber === 'function') return val.toNumber();
  if (typeof val === 'object' && typeof val.toString === 'function' && val.constructor?.name === 'Decimal') {
    return Number(val.toString());
  }
  return val;
}

/**
 * Create a snapshot of entity data before deletion (for forensics)
 */
export const createDeleteSnapshot = (entity: any): Record<string, any> => {
  const snapshot: Record<string, any> = {};

  for (const [key, value] of Object.entries(entity)) {
    if (['password_hash', 'password', 'two_factor_otp', 'two_factor_expires'].includes(key)) continue;
    snapshot[key] = normalizeValue(value);
  }

  return snapshot;
};
