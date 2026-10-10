#!/usr/bin/env node
// Read-only consistency checks for the shared package, including hidden skills.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { checkIntegrity } = require('./validate-process.cjs');
const { loadSuite } = require('./prepare-conversation-case.cjs');
const root = path.resolve(__dirname, '..');
const snapshot = checkIntegrity();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.authoring_package.technical_snapshot_version, snapshot.package_version);
assert.equal(manifest.authoring_package.primary_schema_version, snapshot.primary_schema_version);
assert.deepEqual(manifest.authoring_package.supported_schema_versions, snapshot.supported_schema_versions);
assert.equal(manifest.status, 'draft');
assert.equal(manifest.release_version, null);
assert.equal(manifest.authoring_package.business_rules_approved, false);
for (const key of ['entrypoint', 'session_rules', 'authoring_skill', 'compatibility_skill', 'interview_skill', 'claude_code_skill_entrypoints', 'claude_code_primary_skill', 'claude_code_interview_skill', 'reading_boundaries', 'claude_deepseek_workflow', 'conversation_inputs', 'conversation_rubric', 'conversation_preparer', 'authoring_source_snapshot', 'technical_snapshot', 'offline_validator', 'handoff_workflow', 'verification_record']) {
  assert.ok(fs.existsSync(path.join(root, manifest.authoring_package[key])), `缺少manifest入口：${key}`);
}
const sourceSnapshot = JSON.parse(fs.readFileSync(path.join(root, manifest.authoring_package.authoring_source_snapshot), 'utf8'));
for (const item of sourceSnapshot.files) {
  const file = path.resolve(root, item.snapshot_path);
  assert.ok(file.startsWith(root + path.sep), '来源快照路径越界');
  const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(actual, item.sha256, `来源快照摘要不一致：${item.snapshot_path}`);
}
let markdownFiles = 0;
let localLinks = 0;
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'private', 'scratch', 'backups', 'dist'].includes(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { walk(file); continue; }
    if (!item.name.endsWith('.md')) continue;
    markdownFiles += 1;
    const content = fs.readFileSync(file, 'utf8');
    for (const link of content.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
      const target = link[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(target))), `链接目标缺失：${path.relative(root, file)} → ${target}`);
      localLinks += 1;
    }
  }
}
walk(root);
const skills = ['single-process-authoring', 'grill-me', 'process-authoring'];
for (const name of skills) {
  const content = fs.readFileSync(path.join(root, '.agents/skills', name, 'SKILL.md'), 'utf8');
  assert.ok(content.startsWith('---\n'));
  assert.ok(content.includes(`name: ${name}\n`));
  const description = content.match(/^description: .+/m);
  assert.ok(description);
  // The entry routes to the canonical body; the method is maintained only there.
  const entry = fs.readFileSync(path.join(root, '.claude/skills', name, 'SKILL.md'), 'utf8');
  assert.ok(entry.startsWith('---\n'), `.claude/skills/${name} 缺少frontmatter`);
  assert.ok(entry.includes(`name: ${name}\n`), `.claude/skills/${name} name不一致`);
  assert.ok(entry.includes(description[0] + '\n'), `.claude/skills/${name} description与主技能不一致，需同步`);
  assert.ok(entry.includes(`../../../.agents/skills/${name}/SKILL.md`), `.claude/skills/${name} 缺少同包正文路由`);
}
const prefixedEntries = { 'gk-single-process-authoring': 'single-process-authoring', 'gk-grill-me': 'grill-me' };
for (const [entryName, methodName] of Object.entries(prefixedEntries)) {
  const entry = fs.readFileSync(path.join(root, '.claude/skills', entryName, 'SKILL.md'), 'utf8');
  const method = fs.readFileSync(path.join(root, '.agents/skills', methodName, 'SKILL.md'), 'utf8');
  assert.ok(entry.startsWith('---\n') && entry.includes(`name: ${entryName}\n`));
  assert.ok(entry.includes(method.match(/^description: .+/m)[0] + '\n'), `${entryName} description不一致`);
  assert.ok(entry.includes(`../../../.agents/skills/${methodName}/SKILL.md`), `${entryName} 缺少方法路由`);
}
const { suite } = loadSuite(root);
console.log(JSON.stringify({ valid: true, authoring_package_version: manifest.authoring_package.version, technical_snapshot_version: snapshot.package_version, markdown_files: markdownFiles, local_links: localLinks, technical_files: snapshot.files.length, source_skill_files: sourceSnapshot.files.length, skills, claude_entries: [...skills, ...Object.keys(prefixedEntries)], conversation_cases: suite.cases.length, conversation_model_execution: manifest.authoring_package.conversation_verification_status }, null, 2));
