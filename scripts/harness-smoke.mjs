import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeTask, runTask, validateTask } from '../harness/core.mjs';
import { createMockAdapter } from '../harness/adapters/mock.mjs';
import { validateAgainstSchema } from '../harness/schema-validator.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const casesPath = path.join(root, '20-Agent-Harness', '04-训练集', 'seed-cases.jsonl');
const schemaDir = path.join(root, '20-Agent-Harness', '01-协议');
const failures = [];

const schemas = Object.fromEntries(
  ['task-envelope', 'result', 'trace', 'evidence-ledger'].map((name) => [
    name,
    JSON.parse(fs.readFileSync(path.join(schemaDir, `${name}.schema.json`), 'utf8')),
  ]),
);

function fail(caseId, message) {
  failures.push(`${caseId}: ${message}`);
}

function loadCases() {
  const lines = fs.readFileSync(casesPath, 'utf8').split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`seed-cases.jsonl:${index + 1} 解析失败：${error.message}`);
    }
  });
}

const cases = loadCases();
const seen = new Set();

const executeWithoutGate = structuredClone(cases[0].task);
executeWithoutGate.task_id = 'guard-execute-without-gate';
executeWithoutGate.trace_id = 'guard-execute-without-gate';
executeWithoutGate.requested_actions = ['execute'];
executeWithoutGate.output_contract = { format: 'text', language: 'zh-CN' };
if (validateTask(executeWithoutGate).ok) {
  fail('guard-execute-without-gate', 'execute 缺少 write_gate 时不应通过校验');
}

const taskWithExtraProperty = structuredClone(cases[0].task);
taskWithExtraProperty.unexpected_property = true;
if (validateAgainstSchema(taskWithExtraProperty, schemas['task-envelope']).ok) {
  fail('guard-schema-additional-properties', 'Task Schema 应拒绝未声明字段');
}

let unsafeAdapterCalls = 0;
try {
  await runTask(cases[0].task, {
    adapter: {
      appliesChanges: true,
      async execute() {
        unsafeAdapterCalls += 1;
        return {};
      },
    },
  });
  fail('guard-side-effect-adapter', '可能实施变更的 adapter 不应被最小内核接受');
} catch (error) {
  if (!String(error?.message).includes('appliesChanges=false')) {
    fail('guard-side-effect-adapter', `前置拒绝返回了意外错误：${error?.message}`);
  }
}
if (unsafeAdapterCalls !== 0) {
  fail('guard-side-effect-adapter', '危险 adapter 在被拒绝前已经得到调用');
}

for (const testCase of cases) {
  const caseId = testCase.case_id ?? '(missing-case-id)';
  if (seen.has(caseId)) fail(caseId, 'case_id 重复');
  seen.add(caseId);

  const validation = validateTask(testCase.task);
  if (!validation.ok) {
    fail(caseId, `任务信封不合法：${validation.errors.join('; ')}`);
    continue;
  }
  const schemaValidation = validateAgainstSchema(testCase.task, schemas['task-envelope']);
  if (!schemaValidation.ok) {
    fail(caseId, `Task JSON Schema 不通过：${schemaValidation.errors.join('; ')}`);
    continue;
  }

  const routed = routeTask(testCase.task);
  if (routed.mode !== testCase.expected?.route) {
    fail(caseId, `期望路由 ${testCase.expected?.route}，实际 ${routed.mode}`);
  }

  const expectedRoles = testCase.expected?.roles ?? [];
  if (JSON.stringify(routed.roles) !== JSON.stringify(expectedRoles)) {
    fail(caseId, `角色链不符：${JSON.stringify(routed.roles)}`);
  }

  const adapter = createMockAdapter({ seed: caseId });
  if (adapter.appliesChanges !== false) fail(caseId, 'Mock Adapter 不应实施变更');
  if (adapter.writesToDisk !== false) fail(caseId, 'Mock Adapter 不应写盘');

  let output;
  try {
    output = await runTask(testCase.task, { adapter });
  } catch (error) {
    fail(caseId, `runTask 抛错：${error.stack ?? error.message}`);
    continue;
  }

  for (const key of testCase.must_include ?? []) {
    if (!(key in output)) fail(caseId, `返回值缺少 ${key}`);
  }

  if (output.route?.mode !== testCase.expected?.route) {
    fail(caseId, `运行结果路由不符：${output.route?.mode}`);
  }

  for (const [label, value, schema] of [
    ['result', output.result, schemas.result],
    ['trace', output.trace, schemas.trace],
    ['evidenceLedger', output.evidenceLedger, schemas['evidence-ledger']],
  ]) {
    const checked = validateAgainstSchema(value, schema);
    if (!checked.ok) fail(caseId, `${label} JSON Schema 不通过：${checked.errors.join('; ')}`);
  }

  if (output.result?.status !== testCase.expected?.status) {
    fail(caseId, `期望状态 ${testCase.expected?.status}，实际 ${output.result?.status}`);
  }

  const minEvidence = testCase.expected?.min_evidence ?? 0;
  const evidenceCount = output.evidenceLedger?.items?.length ?? 0;
  if (evidenceCount < minEvidence) {
    fail(caseId, `证据少于 ${minEvidence}，实际 ${evidenceCount}`);
  }

  if (testCase.expected?.output_kind && output.result?.output?.kind !== testCase.expected.output_kind) {
    fail(caseId, `期望输出 kind=${testCase.expected.output_kind}，实际 ${output.result?.output?.kind}`);
  }

  if (testCase.expected?.status === 'needs-approval' && output.verdict?.status !== 'needs-human') {
    fail(caseId, `写回路线必须停在 needs-human，实际 ${output.verdict?.status}`);
  }

  console.log(`PASS ${caseId} route=${output.route.mode} status=${output.result.status} evidence=${evidenceCount}`);
}

if (failures.length > 0) {
  console.error(`Harness smoke: FAIL (${failures.length})`);
  for (const failure of failures) console.error(`ERROR ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Harness smoke: PASS (${cases.length}/${cases.length})`);
  console.log('注意：Mock 只证明协议和路由接通，不证明真实模型、来源或运行时质量。');
}
