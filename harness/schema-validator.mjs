function typeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === expected;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isDateTime(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T/.test(value)
    && !Number.isNaN(new Date(value).getTime());
}

function inspect(value, schema, path, errors) {
  if (typeof schema === 'boolean') {
    if (!schema) errors.push(`${path} is rejected by a false schema`);
    return;
  }
  if (!schema || typeof schema !== 'object') return;

  if (schema.const !== undefined && stableStringify(value) !== stableStringify(schema.const)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.enum)
      && !schema.enum.some((candidate) => stableStringify(candidate) === stableStringify(value))) {
    errors.push(`${path} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`);
  }

  if (schema.type !== undefined) {
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!expectedTypes.some((expected) => typeMatches(value, expected))) {
      errors.push(`${path} must be ${expectedTypes.join(' or ')}`);
      return;
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path} must have length >= ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${path} must have length <= ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path} does not match ${schema.pattern}`);
    }
    if (schema.format === 'date-time' && !isDateTime(value)) {
      errors.push(`${path} must be an ISO date-time`);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path} must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path} must be <= ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} item(s)`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path} must contain at most ${schema.maxItems} item(s)`);
    }
    if (schema.uniqueItems === true) {
      const serialized = value.map(stableStringify);
      if (new Set(serialized).size !== serialized.length) errors.push(`${path} must contain unique items`);
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => inspect(item, schema.items, `${path}[${index}]`, errors));
    }
    if (schema.contains !== undefined) {
      const matched = value.some((item, index) => validateAgainstSchema(item, schema.contains, { path: `${path}[${index}]` }).ok);
      if (!matched) errors.push(`${path} must contain an item matching the contains schema`);
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}.${required} is required`);
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) inspect(value[key], childSchema, `${path}.${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
      }
    }
  }

  for (const child of schema.allOf ?? []) inspect(value, child, path, errors);
  if (schema.if !== undefined) {
    const condition = validateAgainstSchema(value, schema.if, { path });
    if (condition.ok && schema.then !== undefined) inspect(value, schema.then, path, errors);
    if (!condition.ok && schema.else !== undefined) inspect(value, schema.else, path, errors);
  }
}

/**
 * Validate the JSON Schema keyword subset used by this repository.
 * This is not a general-purpose Draft 2020-12 implementation.
 */
export function validateAgainstSchema(value, schema, options = {}) {
  const errors = [];
  inspect(value, schema, options.path ?? '$', errors);
  return { ok: errors.length === 0, errors };
}
