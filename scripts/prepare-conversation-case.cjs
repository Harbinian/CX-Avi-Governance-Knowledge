#!/usr/bin/env node
// Prepare synthetic inputs and a separate review record; never call a model API.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const suitePath = 'verification/conversation-inputs.json';
const rubricPath = 'verification/conversation-rubric.json';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inside = (base, file) => file.startsWith(base + path.sep);

function fixturePath(base, source) {
  assert.equal(typeof source, 'string');
  assert.ok(/^verification\/conversation-fixtures\/[a-z0-9-]+\.(md|json)$/.test(source), '夹具必须来自本用例目录');
  const directory = fs.realpathSync(path.join(base, 'verification/conversation-fixtures'));
  const file = fs.realpathSync(path.resolve(base, source));
  assert.ok(inside(directory, file), '夹具路径越界');
  assert.ok(fs.statSync(file).isFile(), '夹具不是文件');
  return file;
}

function loadSuite(base = root) {
  const suite = JSON.parse(fs.readFileSync(path.join(base, suitePath), 'utf8'));
  const rubric = JSON.parse(fs.readFileSync(path.join(base, rubricPath), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
  assert.equal(suite.schema_version, 1);
  assert.equal(suite.package_version, manifest.authoring_package.version);
  assert.equal(suite.synthetic, true);
  assert.equal(suite.status, 'prepared');
  assert.equal(rubric.schema_version, 1);
  assert.equal(rubric.suite_id, suite.suite_id);
  assert.equal(rubric.reviewer_only, true);
  assert.ok(Array.isArray(rubric.common_required) && rubric.common_required.length);
  assert.ok(rubric.common_required.every(value => typeof value === 'string' && value.trim()));
  assert.ok(typeof suite.common_instruction === 'string' && suite.common_instruction.trim());
  assert.ok(Array.isArray(suite.cases) && suite.cases.length);
  assert.equal(new Set(suite.coverage).size, suite.coverage.length);
  const ids = new Set();
  const coverage = new Set();
  for (const item of suite.cases) {
    assert.match(item.id, /^C\d{2}$/);
    assert.ok(!ids.has(item.id), '重复用例号');
    ids.add(item.id);
    assert.ok(suite.coverage.includes(item.coverage), '未登记覆盖类别');
    coverage.add(item.coverage);
    assert.ok(typeof item.title === 'string' && item.title.trim());
    const targets = new Set();
    for (const fixture of item.fixtures) {
      fixturePath(base, fixture.source);
      assert.match(fixture.target, /^[a-z0-9-]+\.(md|json)$/);
      assert.ok(!targets.has(fixture.target), '重复夹具目标');
      targets.add(fixture.target);
    }
    assert.ok(item.turns.length);
    item.turns.forEach((turn, index) => {
      assert.equal(turn.turn, index + 1);
      assert.equal(turn.send_when, index === 0 ? 'start' : 'after_question');
      assert.ok(typeof turn.message === 'string' && turn.message.trim());
    });
    const criteria = rubric.cases.filter(row => row.id === item.id);
    assert.equal(criteria.length, 1, '缺少或重复评审标准');
    for (const key of ['required', 'critical_failures', 'evidence_required']) {
      assert.ok(Array.isArray(criteria[0][key]) && criteria[0][key].length);
      assert.ok(criteria[0][key].every(value => typeof value === 'string' && value.trim()));
    }
  }
  assert.equal(rubric.cases.length, ids.size, '评审标准包含多余用例');
  assert.deepEqual([...coverage].sort(), [...suite.coverage].sort(), '覆盖类别缺少用例');
  return { suite, rubric };
}

function assertOutputAllowed(output, base) {
  const absolute = path.resolve(output);
  const physicalBase = fs.realpathSync(base);
  let ancestor = path.dirname(absolute);
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const physicalAncestor = fs.realpathSync(ancestor);
  const physicalTarget = path.resolve(physicalAncestor, path.relative(ancestor, absolute));
  const scratch = path.join(physicalBase, 'scratch');
  assert.ok(physicalTarget !== physicalBase &&
    (!inside(physicalBase, physicalTarget) || inside(scratch, physicalTarget)),
  '库内输出仅允许scratch下的新任务目录');
  assert.ok(!fs.existsSync(absolute), '输出目录已存在，拒绝覆盖');
  return absolute;
}

function prepareCase(id, output, base = root) {
  const { suite, rubric } = loadSuite(base);
  const item = suite.cases.find(row => row.id === id);
  assert.ok(item, `未知用例：${id}`);
  const destination = assertOutputAllowed(output, base);
  const fixtureFiles = item.fixtures.map(fixture => {
    const bytes = fs.readFileSync(fixturePath(base, fixture.source));
    return { ...fixture, bytes, sha256: hash(bytes) };
  });
  // A slash command must be the first text, before headings or explanatory prose.
  const turns = item.turns.map(turn => `${turn.turn === 1 ? '/gk-single-process-authoring\n\n' : ''}# 第${turn.turn}轮（${turn.send_when}）\n\n${turn.turn === 1 ? suite.common_instruction + '\n\n本次task目录是当前用例目录的task/；将文中的task/替换为实际绝对路径。\n\n' : ''}${turn.message}\n`);
  const review = {
    schema_version: 1, suite_id: suite.suite_id, case_id: id,
    package_version: suite.package_version, prepared_at: new Date().toISOString(),
    status: 'not_run', client_version: null, api_model: null, model_version: null,
    reasoning_effort: null, repository_head: null, worktree_status: null,
    executed_at: null, reviewer: null, actual_skill_paths: [], evidence: [],
    fixture_sha256: fixtureFiles.map(({ source, target, sha256 }) => ({ source, target, sha256 })),
    input_sha256: turns.map((content, index) => ({ turn: index + 1, sha256: hash(content) })),
    suite_sha256: hash(fs.readFileSync(path.join(base, suitePath))),
    rubric_sha256: hash(fs.readFileSync(path.join(base, rubricPath))),
    criteria: { common_required: rubric.common_required, ...rubric.cases.find(row => row.id === id) },
    observations: [], failed_criteria: [], limitations: [],
  };
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.mkdirSync(destination); // Exclusive directory claim, even if another process raced us.
  const task = path.join(destination, 'task');
  fs.mkdirSync(task);
  for (const file of fixtureFiles) fs.writeFileSync(path.join(task, file.target), file.bytes, { flag: 'wx' });
  turns.forEach((content, index) => fs.writeFileSync(path.join(task, `turn-${index + 1}.md`), content, { flag: 'wx' }));
  fs.writeFileSync(path.join(destination, 'review.json'), JSON.stringify(review, null, 2) + '\n', { flag: 'wx' });
  return { case_id: id, output: destination, turns: turns.length, fixtures: fixtureFiles.length, model_execution: 'not_run' };
}

function main(args) {
  if (args.length === 1 && args[0] === '--check') {
    const { suite } = loadSuite();
    console.log(JSON.stringify({ valid: true, cases: suite.cases.length, coverage: suite.coverage.length, model_execution: 'not_run' }, null, 2));
    return;
  }
  if (args.length === 1 && args[0] === '--list') {
    for (const item of loadSuite().suite.cases) console.log(`${item.id}\t${item.title}`);
    return;
  }
  if (args.length === 4 && args[0] === '--case' && args[2] === '--output') {
    console.log(JSON.stringify(prepareCase(args[1], args[3]), null, 2));
    return;
  }
  throw new Error('用法：node scripts/prepare-conversation-case.cjs --check | --list | --case C01 --output <不存在的新任务目录>');
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
module.exports = { loadSuite, prepareCase };
