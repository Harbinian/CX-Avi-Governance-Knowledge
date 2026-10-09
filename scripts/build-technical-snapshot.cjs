#!/usr/bin/env node
// Maintainer-only: read an explicitly selected Infomat checkout and regenerate
// this package's technical snapshot. No service, database, Git or network writes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--source') {
  console.error('用法：node scripts/build-technical-snapshot.cjs --source <明确指定的Infomat目录>');
  process.exit(2);
}
const sourceRoot = path.resolve(args[1]);
if (sourceRoot === root) throw new Error('来源目录必须是明确指定的Infomat工作副本。');
const servicePath = path.join(sourceRoot, 'apps/structured-output-service/server.js');
const sourceRequire = createRequire(servicePath);
const Ajv2020 = sourceRequire('ajv/dist/2020');
const standalone = sourceRequire('ajv/dist/standalone');
const ajvPackagePath = sourceRequire.resolve('ajv/package.json');
const ajvRoot = path.dirname(ajvPackagePath);
const ajvVersion = JSON.parse(fs.readFileSync(ajvPackagePath, 'utf8')).version;
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false, code: { source: true } });
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const files = [];
const sources = [];
function write(relative, bytes, sourceRelative = null) {
  const destination = path.join(root, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  files.push({ path: relative, sha256: digest(fs.readFileSync(destination)) });
  if (sourceRelative) sources.push({ path: sourceRelative, sha256: digest(bytes), package_path: relative });
}
const schemas = new Map();
for (const version of [1, 2, 7, 8]) {
  const relative = `docs/contracts/process-governance-v${version}.schema.json`;
  const bytes = fs.readFileSync(path.join(sourceRoot, relative));
  const schema = JSON.parse(bytes.toString('utf8'));
  schemas.set(version, schema);
  write(`technical/contracts/process-governance-v${version}.schema.json`, bytes, relative);
  ajv.addSchema(schema);
}

// Standalone Ajv output may refer to its small runtime helpers. Preserve upstream
// helper code and licenses, changing only package import paths for portability.
const copiedRuntime = new Set();
function copyRuntime(name) {
  if (!/^ajv\/dist\/runtime\/[a-zA-Z0-9_-]+$/.test(name)) throw new Error(`不支持的生成依赖：${name}`);
  if (copiedRuntime.has(name)) return;
  copiedRuntime.add(name);
  const fileName = path.posix.basename(name) + '.js';
  let code = fs.readFileSync(sourceRequire.resolve(name), 'utf8');
  code = code.replace(/require\(["']fast-deep-equal["']\)/g, () => {
    const dependencyPath = sourceRequire.resolve('fast-deep-equal');
    const dependencyRoot = path.dirname(sourceRequire.resolve('fast-deep-equal/package.json'));
    if (!files.some(file => file.path === 'technical/runtime/fast-deep-equal.cjs')) {
      write('technical/runtime/fast-deep-equal.cjs', fs.readFileSync(dependencyPath));
      write('technical/licenses/fast-deep-equal.txt', fs.readFileSync(path.join(dependencyRoot, 'LICENSE')));
    }
    return 'require("./fast-deep-equal.cjs")';
  });
  code = code.replace(/require\(["'](ajv\/dist\/runtime\/[^"']+)["']\)/g, (_, dependency) => {
    copyRuntime(dependency);
    return `require("./${path.posix.basename(dependency)}.js")`;
  });
  for (const match of code.matchAll(/require\(["']([^"']+)["']\)/g)) {
    if (!/^\.\/[a-zA-Z0-9_-]+\.(?:cjs|js)$/.test(match[1])) throw new Error(`运行辅助模块需要未打包依赖：${match[1]}`);
  }
  write(`technical/runtime/${fileName}`, code);
}
let compiled = standalone(ajv, {
  validateV7: schemas.get(7).$id,
  validateV8: schemas.get(8).$id
});
compiled = compiled.replace(/require\(["'](ajv\/dist\/runtime\/[^"']+)["']\)/g, (_, name) => {
  copyRuntime(name);
  return `require("./runtime/${path.posix.basename(name)}.js")`;
});
for (const match of compiled.matchAll(/require\(["']([^"']+)["']\)/g)) {
  if (!match[1].startsWith('./runtime/')) throw new Error(`结构校验器需要未打包依赖：${match[1]}`);
}
write('technical/compiled-schemas.cjs', compiled);
write('technical/licenses/ajv.txt', fs.readFileSync(path.join(ajvRoot, 'LICENSE')));
const semanticRelative = 'scripts/process-governance/v7-validator.js';
write('technical/semantic-validator.cjs', fs.readFileSync(path.join(sourceRoot, semanticRelative)), semanticRelative);

// Requiring the source module does not listen: it exports the actual blank
// template factory. No source configuration or business material is read here.
const service = sourceRequire(servicePath);
const template = service.createEmptyProcessGovernanceDocument();
write('templates/process-v8.blank.json', JSON.stringify(template, null, 2) + '\n');
const exampleRelative = '.agents/skills/single-process-authoring/assets/minimal-v8-example.json';
write('examples/demo-process-v8.json', fs.readFileSync(path.join(sourceRoot, exampleRelative)), exampleRelative);
function git(args) {
  try {
    return execFileSync('git', args, { cwd: sourceRoot, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}
const snapshot = {
  package_version: '2026-10-08.1',
  generated_at: new Date().toISOString(),
  primary_schema_version: 'process-governance-v8',
  supported_schema_versions: ['process-governance-v8', 'process-governance-v7'],
  validation_profile: 'strict',
  source_repository: 'Infomat',
  source_head: git(['rev-parse', 'HEAD']),
  source_worktree_dirty: Boolean(git(['status', '--porcelain'])),
  source_rules_commit: git(['log', '-1', '--format=%H', '--', 'docs/contracts', 'scripts/process-governance']),
  source_service_entry_sha256: digest(fs.readFileSync(servicePath)),
  source_mdm_format_entry_sha256: digest(fs.readFileSync(path.join(sourceRoot, 'apps/mdm-platform/server/processNativeFormats.js'))),
  schema_digests: Object.fromEntries([7, 8].map(version => [
    `process-governance-v${version}`,
    digest(fs.readFileSync(path.join(root, `technical/contracts/process-governance-v${version}.schema.json`)))
  ])),
  ajv_version: ajvVersion,
  build_options: { allErrors: true, strict: false, validateFormats: false, code: { source: true } },
  source_files: sources,
  files,
  limits: ['offline_technical_checks_only', 'active_departments_not_checked', 'permissions_not_checked', 'business_facts_not_approved', 'formal_runtime_not_verified']
};
if (snapshot.schema_digests['process-governance-v8'] !== service.PROCESS_GOVERNANCE_SCHEMA_DIGEST) {
  throw new Error('来源3001结构摘要不一致，不能完成快照。');
}
fs.writeFileSync(path.join(root, 'technical/snapshot.json'), JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ package_version: snapshot.package_version, file_count: files.length, schema_digests: snapshot.schema_digests, ajv_version: ajvVersion }, null, 2));
