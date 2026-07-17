const SCHEMA_VERSION = '1.0.0';
const MODES = new Set(['auto', 'direct', 'research', 'governed-write']);
const RISK_LEVELS = new Set(['low', 'medium', 'high']);
const ACTIONS = new Set(['read', 'search', 'write', 'execute']);
const OUTPUT_FORMATS = new Set(['text', 'markdown', 'json', 'change-proposal']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(value) {
  return Array.isArray(value)
    && value.every(isNonEmptyString)
    && new Set(value).size === value.length;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('clock must return a Date, timestamp, or ISO date string');
  }
  return date.toISOString();
}

function readClock(clock) {
  return toIso(clock());
}

/**
 * Validate the critical Task Envelope contract without third-party packages.
 * This is intentionally stricter than a shape-only smoke check for write routes.
 */
export function validateTask(task) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(task)) {
    return {
      ok: false,
      errors: ['task must be a plain object'],
      warnings,
    };
  }

  if (task.schema_version !== SCHEMA_VERSION) {
    errors.push(`schema_version must be ${SCHEMA_VERSION}`);
  }

  for (const field of ['task_id', 'trace_id', 'title', 'objective']) {
    if (!isNonEmptyString(task[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!MODES.has(task.mode)) {
    errors.push('mode must be auto, direct, research, or governed-write');
  }

  if (!RISK_LEVELS.has(task.risk_level)) {
    errors.push('risk_level must be low, medium, or high');
  }

  if (!isPlainObject(task.input)) {
    errors.push('input must be an object');
  }

  if (!Array.isArray(task.requested_actions) || task.requested_actions.length === 0) {
    errors.push('requested_actions must be a non-empty array');
  } else {
    const invalidActions = task.requested_actions.filter((action) => !ACTIONS.has(action));
    if (invalidActions.length > 0) {
      errors.push(`unsupported requested_actions: ${invalidActions.join(', ')}`);
    }
    if (new Set(task.requested_actions).size !== task.requested_actions.length) {
      errors.push('requested_actions must not contain duplicates');
    }
  }

  if (!Array.isArray(task.acceptance_criteria)
      || task.acceptance_criteria.length === 0
      || !task.acceptance_criteria.every(isNonEmptyString)) {
    errors.push('acceptance_criteria must contain at least one non-empty string');
  }

  if (task.constraints !== undefined && !uniqueStrings(task.constraints)) {
    errors.push('constraints must be an array of unique non-empty strings');
  }

  if (!isPlainObject(task.output_contract)) {
    errors.push('output_contract must be an object');
  } else {
    if (!OUTPUT_FORMATS.has(task.output_contract.format)) {
      errors.push('output_contract.format is unsupported');
    }
    if (!isNonEmptyString(task.output_contract.language)) {
      errors.push('output_contract.language must be a non-empty string');
    }
  }

  if (task.evidence_policy !== undefined) {
    if (!isPlainObject(task.evidence_policy)) {
      errors.push('evidence_policy must be an object');
    } else {
      if (!Number.isInteger(task.evidence_policy.min_sources)
          || task.evidence_policy.min_sources < 0
          || task.evidence_policy.min_sources > 20) {
        errors.push('evidence_policy.min_sources must be an integer from 0 to 20');
      }
      if (typeof task.evidence_policy.allow_unverified !== 'boolean') {
        errors.push('evidence_policy.allow_unverified must be boolean');
      }
      if (task.evidence_policy.require_primary !== undefined
          && typeof task.evidence_policy.require_primary !== 'boolean') {
        errors.push('evidence_policy.require_primary must be boolean when provided');
      }
    }
  }

  const actions = new Set(Array.isArray(task.requested_actions) ? task.requested_actions : []);
  const requestsWrite = actions.has('write');
  const requestsExecute = actions.has('execute');
  const requestsResearch = actions.has('search')
    || (task.evidence_policy?.min_sources ?? 0) > 0;

  const requestsMutation = requestsWrite || requestsExecute;

  if (requestsMutation) {
    if (!isPlainObject(task.write_gate)) {
      errors.push('write or execute requests require write_gate');
    } else {
      if (!uniqueStrings(task.write_gate.target_paths)
          || task.write_gate.target_paths.length === 0) {
        errors.push('write_gate.target_paths must contain unique non-empty paths');
      }
      if (!['pending', 'approved', 'rejected'].includes(task.write_gate.approval_state)) {
        errors.push('write_gate.approval_state must be pending, approved, or rejected');
      }
      if (task.write_gate.approval_state === 'approved'
          && !isNonEmptyString(task.write_gate.approval_ref)) {
        errors.push('approved write or execute requests require write_gate.approval_ref');
      }
    }
    if (!['auto', 'governed-write'].includes(task.mode)) {
      errors.push('tasks requesting write or execute must use auto or governed-write mode');
    }
    if (task.output_contract?.format !== 'change-proposal') {
      errors.push('tasks requesting write or execute must use change-proposal output format');
    }
  }

  if (task.mode === 'direct') {
    if (requestsResearch || requestsWrite || requestsExecute) {
      errors.push('direct mode cannot request search, write, execute, or external evidence');
    }
    if (task.risk_level !== 'low') {
      errors.push('direct mode is only valid for low-risk tasks');
    }
  }

  if (task.mode === 'research' && (requestsWrite || requestsExecute)) {
    errors.push('research mode cannot request write or execute');
  }

  if (task.mode === 'governed-write' && !requestsWrite && !requestsExecute) {
    warnings.push('governed-write has no write or execute action; the heavier route may be unnecessary');
  }

  if (task.risk_level === 'high' && task.mode === 'auto' && !requestsWrite && !requestsExecute) {
    warnings.push('high-risk auto task will be routed through reviewer');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Choose the lightest route that satisfies evidence and mutation requirements.
 */
export function routeTask(task) {
  const validation = validateTask(task);
  if (!validation.ok) {
    const error = new TypeError(`invalid task: ${validation.errors.join('; ')}`);
    error.name = 'TaskValidationError';
    error.errors = validation.errors;
    throw error;
  }

  const actions = new Set(task.requested_actions);
  const needsMutationGate = actions.has('write') || actions.has('execute');
  const needsEvidence = actions.has('search')
    || (task.evidence_policy?.min_sources ?? 0) > 0
    || task.risk_level === 'high';

  let mode = task.mode;
  if (mode === 'auto') {
    if (needsMutationGate) mode = 'governed-write';
    else if (needsEvidence) mode = 'research';
    else mode = 'direct';
  }

  if (mode === 'governed-write') {
    return {
      mode,
      roles: ['router', 'worker', 'writer', 'reviewer'],
      reason: 'The task requests a persistent or executable change, so it requires a scoped proposal and approval gate.',
      requires_approval: true,
    };
  }

  if (mode === 'research') {
    return {
      mode,
      roles: ['router', 'worker', 'reviewer'],
      reason: 'The task requires external evidence, multiple sources, or independent review.',
      requires_approval: false,
    };
  }

  return {
    mode: 'direct',
    roles: ['router', 'worker'],
    reason: 'All required material is supplied, risk is low, and no external evidence or mutation is requested.',
    requires_approval: false,
  };
}

function normalizeOutput(candidate) {
  if (!isPlainObject(candidate)) {
    return { kind: 'json', content: candidate ?? null };
  }
  if (['text', 'markdown', 'json', 'change-proposal'].includes(candidate.kind)
      && Object.hasOwn(candidate, 'content')) {
    return candidate;
  }
  return { kind: 'json', content: candidate };
}

function normalizeVerdict(candidate) {
  if (!isPlainObject(candidate)) {
    return { status: 'not-required', notes: [] };
  }
  const status = ['not-required', 'passed', 'failed', 'needs-human'].includes(candidate.status)
    ? candidate.status
    : 'failed';
  const notes = Array.isArray(candidate.notes)
    ? candidate.notes.filter(isNonEmptyString)
    : [];
  return { status, notes };
}

/**
 * Execute a routed task entirely in memory.
 *
 * The caller must supply an adapter with execute({ role, task, route, context }).
 * No filesystem or network module is used by this core.
 */
export async function runTask(task, options = {}) {
  const validation = validateTask(task);
  if (!validation.ok) {
    const error = new TypeError(`invalid task: ${validation.errors.join('; ')}`);
    error.name = 'TaskValidationError';
    error.errors = validation.errors;
    throw error;
  }

  const { adapter, onEvent } = options;
  if (!adapter || typeof adapter.execute !== 'function') {
    throw new TypeError('runTask requires an adapter with an async execute(request) function');
  }
  if (adapter.appliesChanges !== false) {
    throw new TypeError('runTask only accepts proposal/read adapters declaring appliesChanges=false');
  }
  if (onEvent !== undefined && typeof onEvent !== 'function') {
    throw new TypeError('onEvent must be a function when provided');
  }

  const clock = options.clock ?? (() => new Date());
  const route = routeTask(task);
  const startedAt = readClock(clock);
  const events = [];
  const evidenceItems = [];
  const nodeResults = [];
  let adapterCalls = 0;
  let output = { kind: 'json', content: null };
  let verdict = { status: 'not-required', notes: [] };

  const emit = async ({ phase, role, type, status, message, data }) => {
    const event = {
      seq: events.length + 1,
      at: readClock(clock),
      phase,
      role,
      type,
      status,
      message,
      ...(data === undefined ? {} : { data }),
    };
    events.push(event);
    if (onEvent) await onEvent(event);
  };

  await emit({
    phase: 'validate',
    role: 'system',
    type: 'validation',
    status: 'completed',
    message: 'Task envelope passed validation.',
    data: { warnings: validation.warnings },
  });
  await emit({
    phase: 'route',
    role: 'router',
    type: 'routing',
    status: 'completed',
    message: route.reason,
    data: { mode: route.mode, roles: route.roles },
  });

  try {
    for (const role of route.roles) {
      await emit({
        phase: role,
        role,
        type: 'node-start',
        status: 'started',
        message: `${role} started.`,
      });

      const response = await adapter.execute({
        role,
        task,
        route,
        context: {
          allowedEffects: role === 'writer'
            ? ['propose-change']
            : role === 'reviewer'
              ? ['review']
              : role === 'worker'
                ? task.requested_actions.filter((action) => !['write', 'execute'].includes(action))
                : [],
          nodeResults: structuredClone(nodeResults),
          evidenceLedger: {
            schema_version: SCHEMA_VERSION,
            trace_id: task.trace_id,
            task_id: task.task_id,
            items: structuredClone(evidenceItems),
          },
        },
      });
      adapterCalls += 1;

      if (!isPlainObject(response)) {
        throw new TypeError(`${role} adapter response must be an object`);
      }

      if (Array.isArray(response.evidence)) {
        for (const item of response.evidence) {
          if (isPlainObject(item)) evidenceItems.push(structuredClone(item));
        }
      }

      if (Object.hasOwn(response, 'output')) {
        output = normalizeOutput(response.output);
      }
      if (Object.hasOwn(response, 'proposal')) {
        output = { kind: 'change-proposal', content: structuredClone(response.proposal) };
      }
      if (Object.hasOwn(response, 'verdict')) {
        verdict = normalizeVerdict(response.verdict);
      }

      nodeResults.push({ role, response: structuredClone(response) });
      await emit({
        phase: role,
        role,
        type: 'node-result',
        status: 'completed',
        message: `${role} completed.`,
        data: { response_kind: response.kind ?? 'unspecified' },
      });
    }
  } catch (error) {
    verdict = {
      status: 'failed',
      notes: [error instanceof Error ? error.message : String(error)],
    };
    await emit({
      phase: 'run',
      role: 'system',
      type: 'error',
      status: 'failed',
      message: verdict.notes[0],
    });
  }

  const expectedOutputKind = task.output_contract.format;
  if (verdict.status !== 'failed' && output.kind !== expectedOutputKind) {
    verdict = {
      status: 'failed',
      notes: [`Output contract mismatch: expected ${expectedOutputKind}, received ${output.kind}.`],
    };
    await emit({
      phase: 'validate-output',
      role: 'system',
      type: 'error',
      status: 'failed',
      message: verdict.notes[0],
    });
  }

  let status = verdict.status === 'failed' ? 'failed' : 'completed';
  if (route.mode === 'governed-write' && status !== 'failed') {
    status = 'needs-approval';
    if (verdict.status === 'not-required' || verdict.status === 'passed') {
      verdict = {
        status: 'needs-human',
        notes: [...verdict.notes, 'The in-memory core produced a proposal but cannot apply it.'],
      };
    }
    await emit({
      phase: 'approval',
      role: 'system',
      type: 'gate',
      status: 'blocked',
      message: 'Persistent mutation is blocked; only a change proposal was produced.',
      data: { approval_state: task.write_gate?.approval_state ?? 'missing' },
    });
  }

  const finishedAt = readClock(clock);
  const durationMs = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  const warnings = [...validation.warnings];
  if (adapter.isMock === true) {
    warnings.push('Mock adapter validates pipeline behavior only; it does not validate model or factual quality.');
  }

  const result = {
    schema_version: SCHEMA_VERSION,
    task_id: task.task_id,
    trace_id: task.trace_id,
    status,
    route,
    output,
    review: verdict,
    metrics: {
      adapter_calls: adapterCalls,
      duration_ms: durationMs,
    },
    warnings,
  };

  const trace = {
    schema_version: SCHEMA_VERSION,
    trace_id: task.trace_id,
    task_id: task.task_id,
    started_at: startedAt,
    finished_at: finishedAt,
    events,
  };

  const evidenceLedger = {
    schema_version: SCHEMA_VERSION,
    trace_id: task.trace_id,
    task_id: task.task_id,
    items: evidenceItems,
  };

  return {
    route,
    verdict,
    trace,
    result,
    evidenceLedger,
  };
}
