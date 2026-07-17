import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const kindArg = args.find((arg) => arg.startsWith('--kind='));
const kind = kindArg ? kindArg.slice('--kind='.length) : '待整理';
const title = args.find((arg) => !arg.startsWith('--'));

if (!title) {
  console.error('用法：node scripts/new-inbox-note.mjs "标题" [--kind=待整理|闪念] [--apply]');
  process.exit(1);
}

if (!['待整理', '闪念'].includes(kind)) {
  console.error('kind 只允许“待整理”或“闪念”。');
  process.exit(1);
}

const now = new Date();
const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
const localTime = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'), String(now.getSeconds()).padStart(2, '0')].join('');
const safeTitle = title
  .trim()
  .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
  .replace(/[. ]+$/g, '')
  .slice(0, 80);

if (!safeTitle) {
  console.error('标题清理后为空，请换一个标题。');
  process.exit(1);
}

const filename = `${localDate}-${localTime}-${safeTitle}.md`;
const relativeTarget = path.join('10-收件箱', kind, filename);
const target = path.resolve(root, relativeTarget);
const allowedRoot = path.resolve(root, '10-收件箱', kind);

if (path.dirname(target) !== allowedRoot) {
  console.error('目标路径越过允许的收件箱目录。');
  process.exit(1);
}

const noteType = kind === '闪念' ? 'idea' : 'inbox';
const content = `---\ntype: ${noteType}\nstatus: draft\ncreated: ${localDate}\ntags:\n  - inbox\nsource:\n---\n\n# ${safeTitle}\n\n## 先记下来\n\n\n## 下一步\n\n- [ ] 保留在收件箱\n- [ ] 整理进系统工具库\n- [ ] 整理进 Wiki\n- [ ] 整理进创意库\n`;

console.log(`mode=${apply ? 'apply' : 'dry-run'}`);
console.log(`target=${path.relative(root, target)}`);
console.log('--- preview ---');
console.log(content);

if (!apply) {
  console.log('未写入。确认后追加 --apply。');
  process.exit(0);
}

if (fs.existsSync(target)) {
  console.error('目标文件已存在，已停止，未覆盖。');
  process.exit(1);
}

fs.mkdirSync(allowedRoot, { recursive: true });
fs.writeFileSync(target, content, { encoding: 'utf8', flag: 'wx' });
console.log('已创建。下一步在 Obsidian 中打开并填写正文。');
