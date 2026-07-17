import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const decoder = new TextDecoder('utf-8', { fatal: true });

const errors = [];
const warnings = [];
const stats = {
  files: 0,
  markdown: 0,
  json: 0,
  jsonlRecords: 0,
  checkedLinks: 0,
};
let permissionsPolicy = null;
let routesPolicy = null;
let packageManifest = null;

const requiredPaths = [
  'README.md',
  'AGENTS.md',
  'SCHEMA.md',
  'index.md',
  'log.md',
  'policies/permissions.json',
  'policies/routes.json',
  '00-开始这里/10分钟首跑.md',
  '20-Agent-Harness/README.md',
  '20-Agent-Harness/04-训练集/seed-cases.jsonl',
  '30-系统工具库/README-系统工具库怎么用.md',
  '40-Wiki知识库/README-Wiki知识库怎么用.md',
  '50-创意库/README.md',
  '60-Hermes运维/README.md',
  '60-Hermes运维/02-Skills/已启用/agent-foundry-vault/SKILL.md',
  '60-Hermes运维/bundles/agent-foundry.example.yaml',
  '70-协同桥接/README.md',
  'raw/README-raw只读说明.md',
  'harness/core.mjs',
  'harness/schema-validator.mjs',
  'harness/adapters/mock.mjs',
  'scripts/harness-smoke.mjs',
  'scripts/show-first-seed.mjs',
];

const ignoredDirectories = new Set(['.git', 'node_modules', '.trash']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relative(file) {
  return toPosix(path.relative(root, file));
}

function walk(directory) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolute));
    else found.push(absolute);
  }
  return found;
}

function readUtf8(file) {
  try {
    return decoder.decode(fs.readFileSync(file));
  } catch (error) {
    errors.push(`${relative(file)} 不是有效 UTF-8：${error.message}`);
    return '';
  }
}

function parseJson(file, text) {
  try {
    stats.json += 1;
    return JSON.parse(text);
  } catch (error) {
    errors.push(`${relative(file)} JSON 解析失败：${error.message}`);
    return null;
  }
}

function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]+`/g, '');
}

function resolveMarkdownTarget(sourceFile, rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
  if (/^(?:https?:|mailto:|obsidian:|data:)/i.test(target) || target.startsWith('#')) return true;
  target = target.split('#')[0].split('?')[0];
  if (!target) return true;
  try {
    target = decodeURIComponent(target);
  } catch {
    warnings.push(`${relative(sourceFile)} 含无法解码的链接：${rawTarget}`);
  }
  return fs.existsSync(path.resolve(path.dirname(sourceFile), target));
}

function withoutExtension(file) {
  return toPosix(path.relative(root, file)).replace(/\.[^.\/]+$/, '');
}

function parseFrontmatterList(frontmatter, field) {
  const inline = frontmatter.match(new RegExp(`^${field}:\\s*\\[([^\\]]*)\\]\\s*$`, 'm'));
  if (inline) {
    return inline[1]
      .split(',')
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  const block = frontmatter.match(new RegExp(`^${field}:\\s*\\r?\\n((?:[ \\t]+-\\s*[^\\r\\n]+\\r?\\n?)*)`, 'm'));
  if (!block) return [];
  return [...block[1].matchAll(/^[ \t]+-\s*(.+?)\s*$/gm)]
    .map((match) => match[1].replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

for (const required of requiredPaths) {
  if (!fs.existsSync(path.join(root, ...required.split('/')))) {
    errors.push(`缺少必需路径：${required}`);
  }
}

const productReadme = readUtf8(path.join(root, 'README.md'));
if (!/^# Agent Foundry Vault智能体工坊\r?\n/.test(productReadme)) {
  errors.push('README.md 主标题未使用正式名称 Agent Foundry Vault智能体工坊');
}
if (!productReadme.includes('Obsidian × LLMWiki × Hermes 的 Agent 训练、知识与运维中枢')) {
  errors.push('README.md 缺少正式副标题');
}

const files = walk(root);
stats.files = files.length;

const markdownFiles = files.filter((file) => path.extname(file).toLowerCase() === '.md');
stats.markdown = markdownFiles.length;
const markdownSet = new Set(markdownFiles.map(withoutExtension));
const stemMap = new Map();

for (const file of markdownFiles) {
  const stem = path.basename(file, '.md');
  const list = stemMap.get(stem) ?? [];
  list.push(file);
  stemMap.set(stem, list);
}

const jsonlIds = new Set();
const allowedStatuses = new Set(['draft', 'candidate', 'active', 'deprecated', 'archived']);
const schemaText = readUtf8(path.join(root, 'SCHEMA.md'));
const taxonomySection = schemaText.match(/<!-- llmwiki-tag-taxonomy:start -->([\s\S]*?)<!-- llmwiki-tag-taxonomy:end -->/);
const taxonomyTags = new Set(
  taxonomySection ? [...taxonomySection[1].matchAll(/`([^`]+)`/g)].map((match) => match[1]) : [],
);
if (taxonomyTags.size === 0) errors.push('SCHEMA.md 缺少可解析的 LLMWiki Tag Taxonomy');
const indexText = readUtf8(path.join(root, 'index.md'));

for (const file of files) {
  const rel = relative(file);
  const text = readUtf8(file);
  if (text.includes('\uFFFD')) errors.push(`${rel} 含 Unicode 替换字符 U+FFFD`);

  const extension = path.extname(file).toLowerCase();
  if (extension === '.json') {
    const parsed = parseJson(file, text);
    if (rel === 'policies/permissions.json') permissionsPolicy = parsed;
    if (rel === 'policies/routes.json') routesPolicy = parsed;
    if (rel === 'package.json') packageManifest = parsed;
  }

  if (extension === '.jsonl') {
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      let record;
      try {
        record = JSON.parse(line);
        stats.jsonlRecords += 1;
      } catch (error) {
        errors.push(`${rel}:${index + 1} JSONL 解析失败：${error.message}`);
        return;
      }
      const recordId = record.case_id ?? record.id;
      if (typeof recordId !== 'string' || recordId.length === 0) {
        errors.push(`${rel}:${index + 1} 缺少非空 case_id/id`);
      } else if (jsonlIds.has(recordId)) {
        errors.push(`${rel}:${index + 1} case_id/id 重复：${recordId}`);
      } else {
        jsonlIds.add(recordId);
      }
    });
  }

  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
    errors.push(`${rel} 疑似包含私钥`);
  }
  if (/\bsk-[A-Za-z0-9_-]{20,}\b/.test(text)) {
    errors.push(`${rel} 疑似包含 API Key`);
  }
}

if (packageManifest?.name !== 'agent-foundry-vault') {
  errors.push('package.json name 必须为 agent-foundry-vault');
}

if (routesPolicy) {
  const expectedRoles = {
    direct: ['router', 'worker'],
    research: ['router', 'worker', 'reviewer'],
    'governed-write': ['router', 'worker', 'writer', 'reviewer'],
  };
  for (const [name, roles] of Object.entries(expectedRoles)) {
    const actual = routesPolicy.routes?.[name]?.roles;
    if (JSON.stringify(actual) !== JSON.stringify(roles)) {
      errors.push(`routes.json 的 ${name} roles 与运行器不一致`);
    }
  }
}

if (permissionsPolicy) {
  if (permissionsPolicy.match_precedence !== 'most-specific-path-wins') {
    errors.push('permissions.json 必须声明 most-specific-path-wins，避免重叠规则被宽泛路径放宽');
  }
  const zone = (target) => permissionsPolicy.zones?.find((item) => item.path === target);
  const rawZone = zone('raw/**');
  if (!rawZone
      || !rawZone.capabilities?.includes('read')
      || !rawZone.capabilities?.includes('create')
      || rawZone.capabilities?.some((item) => ['update', 'overwrite', 'delete'].includes(item))) {
    errors.push('permissions.json 必须允许 raw 新建快照，同时禁止更新、覆盖和删除旧快照');
  }
  const indexZone = zone('index.md');
  if (!indexZone?.capabilities?.includes('propose-write')) {
    errors.push('permissions.json 缺少 index.md 的受控写入提案权限');
  }
  const logZone = zone('log.md');
  if (!logZone?.capabilities?.includes('append')) {
    errors.push('permissions.json 缺少 log.md 的只追加权限');
  }
}

for (const file of markdownFiles) {
  const rel = relative(file);
  const text = readUtf8(file);
  const isTemplate = rel.startsWith('templates/');
  const searchable = stripCode(text);
  const anyFrontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (anyFrontmatter) {
    const statusMatch = anyFrontmatter[1].match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/m);
    if (statusMatch && !allowedStatuses.has(statusMatch[1].trim())) {
      errors.push(`${rel} 使用非标准 status：${statusMatch[1].trim()}`);
    }
  }

  for (const match of searchable.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
    stats.checkedLinks += 1;
    if (!resolveMarkdownTarget(file, match[1])) {
      errors.push(`${rel} 的 Markdown 链接不存在：${match[1]}`);
    }
  }

  if (!isTemplate) {
    for (const match of searchable.matchAll(/!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
      stats.checkedLinks += 1;
      const target = match[1].trim().replace(/\\/g, '/').replace(/\.md$/i, '');
      if (!target || /[{}<>]/.test(target)) continue;

      let exists = false;
      if (target.includes('/')) {
        const fromRoot = target.replace(/^\.\//, '');
        const fromSource = toPosix(path.relative(root, path.resolve(path.dirname(file), target)));
        exists = markdownSet.has(fromRoot) || markdownSet.has(fromSource);
      } else {
        const candidates = stemMap.get(target) ?? [];
        exists = candidates.length > 0;
        if (candidates.length > 1) {
          warnings.push(`${rel} 使用歧义 wikilink [[${target}]]；请写完整路径`);
        }
      }

      if (!exists) errors.push(`${rel} 的 wikilink 不存在：[[${target}]]`);
    }
  }

  const isWikiPage = /^(concepts|entities|comparisons|queries)\//.test(rel);
  const isWikiTemplate = /^templates\/模板-(概念卡|实体卡|对比卡|查询卡)\.md$/.test(rel);
  if (isWikiPage || isWikiTemplate) {
    const frontmatter = anyFrontmatter;
    if (!frontmatter) {
      errors.push(`${rel} 是 Wiki 页或模板但缺少 Frontmatter`);
    } else {
      for (const field of ['title', 'type', 'status', 'created', 'updated', 'tags', 'knowledge_class', 'sources']) {
        if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) {
          errors.push(`${rel} 缺少正式 Wiki 字段：${field}`);
        }
      }
      const tags = parseFrontmatterList(frontmatter[1], 'tags');
      if (tags.length === 0) errors.push(`${rel} 至少需要一个 taxonomy tag`);
      for (const tag of tags) {
        if (!taxonomyTags.has(tag)) errors.push(`${rel} 使用未登记的 Wiki tag：${tag}`);
      }
      const status = frontmatter[1].match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
      const knowledgeClass = frontmatter[1].match(/^knowledge_class:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
      const sources = parseFrontmatterList(frontmatter[1], 'sources');
      if (isWikiPage && status === 'active' && knowledgeClass === 'factual' && sources.length === 0) {
        errors.push(`${rel} 是 active factual 页，但 sources 为空`);
      }
    }
    if (isWikiPage) {
      const relWithoutExtension = rel.replace(/\.md$/i, '');
      if (!indexText.includes(rel) && !indexText.includes(relWithoutExtension)) {
        errors.push(`${rel} 未列入 index.md`);
      }
    }
  }
}

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /^\.env(?:\.|$)/.test(entry.name) && entry.name !== '.env.example') {
    errors.push(`Vault 根目录出现真实环境文件：${entry.name}`);
  }
}

const rawReadme = path.join(root, 'raw', 'README-raw只读说明.md');
if (fs.existsSync(rawReadme)) {
  const rawText = readUtf8(rawReadme);
  if (!/只读|不可修改|immutable/i.test(rawText)) {
    errors.push('raw 说明未明确不可修改');
  }
}

console.log(`Agent Foundry Vault verify: ${errors.length === 0 ? 'PASS' : 'FAIL'}`);
console.log(`files=${stats.files} markdown=${stats.markdown} json=${stats.json} jsonl_records=${stats.jsonlRecords} links=${stats.checkedLinks}`);

if (warnings.length > 0) {
  console.log(`warnings=${warnings.length}`);
  for (const warning of warnings) console.log(`WARN  ${warning}`);
}

if (errors.length > 0) {
  console.error(`errors=${errors.length}`);
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
}
