import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeTask, runTask, validateTask } from '../harness/core.mjs';
import { createMockAdapter } from '../harness/adapters/mock.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const casesPath = path.join(root, '20-Agent-Harness', '04-训练集', 'seed-cases.jsonl');
const firstLine = fs.readFileSync(casesPath, 'utf8').split(/\r?\n/).find((line) => line.trim());

if (!firstLine) throw new Error('seed-cases.jsonl 没有可运行案例');

const testCase = JSON.parse(firstLine);
const validation = validateTask(testCase.task);
if (!validation.ok) throw new Error(validation.errors.join('\n'));

const selectedRoute = routeTask(testCase.task);
const run = await runTask(testCase.task, {
  adapter: createMockAdapter({ seed: testCase.case_id }),
});

console.log(JSON.stringify({
  case_id: testCase.case_id,
  validation,
  selected_route: selectedRoute,
  result: run.result,
  trace_events: run.trace.events.map(({ seq, phase, role, status }) => ({ seq, phase, role, status })),
}, null, 2));
console.log('注意：这是只读 Mock 演示，没有调用真实模型、网络或文件写入。');
