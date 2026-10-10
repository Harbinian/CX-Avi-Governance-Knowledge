#!/usr/bin/env node
// Functional tests for local case preparation, not tests of a language model.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { loadSuite, prepareCase } = require('./prepare-conversation-case.cjs');
const { validateDocument } = require('./validate-process.cjs');
const root = path.resolve(__dirname, '..');
const run = path.join(root, 'scratch/conversation-preparation-tests', crypto.randomUUID());
fs.mkdirSync(run, { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const { suite } = loadSuite();
const sourceFiles = [...new Set(suite.cases.flatMap(item => item.fixtures.map(row => row.source)))];
const initialHashes = sourceFiles.map(file => hash(fs.readFileSync(path.join(root, file))));

test('all_cases_copy_exact_inputs_and_start_unexecuted', () => {
  for (const item of suite.cases) {
    const output = path.join(run, item.id);
    const result = prepareCase(item.id, output);
    assert.equal(result.model_execution, 'not_run');
    const review = JSON.parse(fs.readFileSync(path.join(output, 'review.json'), 'utf8'));
    assert.equal(review.status, 'not_run');
    assert.equal(review.api_model, null);
    assert.deepEqual(review.evidence, []);
    assert.ok(!fs.existsSync(path.join(output, 'task/review.json')));
    assert.ok(!fs.existsSync(path.join(output, 'task/conversation-rubric.json')));
    for (const fixture of item.fixtures) {
      const actual = fs.readFileSync(path.join(output, 'task', fixture.target));
      assert.deepEqual(actual, fs.readFileSync(path.join(root, fixture.source)));
      assert.equal(review.fixture_sha256.find(row => row.target === fixture.target).sha256, hash(actual));
    }
    for (const turn of item.turns) {
      const text = fs.readFileSync(path.join(output, 'task', `turn-${turn.turn}.md`), 'utf8');
      if (turn.turn === 1) assert.ok(text.startsWith('/gk-single-process-authoring\n'), '原生调用必须位于输入开头');
      assert.ok(text.includes(turn.message));
      assert.ok(!text.includes('critical_failures'));
      if (turn.turn === 1 && item.turns.length > 1) assert.ok(!text.includes(item.turns[1].message));
    }
  }
});
test('existing_output_refused_and_bytes_preserved', () => {
  const output = path.join(run, suite.cases[0].id);
  const original = fs.readFileSync(path.join(output, 'review.json'));
  assert.throws(() => prepareCase(suite.cases[0].id, output), /拒绝覆盖/);
  assert.deepEqual(fs.readFileSync(path.join(output, 'review.json')), original);
});
test('unknown_case_does_not_create_output', () => {
  const output = path.join(run, 'unknown');
  assert.throws(() => prepareCase('C99', output), /未知用例/);
  assert.ok(!fs.existsSync(output));
});
test('shared_repository_output_refused', () => {
  const output = path.join(root, 'rules', `unwanted-${path.basename(run)}`);
  assert.throws(() => prepareCase('C01', output), /库内输出/);
  assert.ok(!fs.existsSync(output));
});

const relocated = path.join(run, 'relocated');
fs.mkdirSync(path.join(relocated, 'verification/conversation-fixtures'), { recursive: true });
for (const file of ['manifest.json', 'verification/conversation-inputs.json', 'verification/conversation-rubric.json', ...sourceFiles]) {
  fs.copyFileSync(path.join(root, file), path.join(relocated, file), fs.constants.COPYFILE_EXCL);
}
test('relocated_case_pack_independent_of_original_paths', () => {
  assert.equal(loadSuite(relocated).suite.cases.length, suite.cases.length);
  const output = path.join(run, 'relocated-output');
  prepareCase('C04', output, relocated);
  assert.ok(fs.existsSync(path.join(output, 'task/turn-2.md')));
});
test('fixture_traversal_and_missing_rubric_rejected', () => {
  const file = path.join(relocated, 'verification/conversation-inputs.json');
  const original = fs.readFileSync(file);
  const broken = JSON.parse(original);
  broken.cases[0].fixtures = [{ source: '../manifest.json', target: 'leak.json' }];
  fs.writeFileSync(file, JSON.stringify(broken));
  assert.throws(() => loadSuite(relocated), /夹具必须/);
  fs.writeFileSync(file, original);
  const rubricPath = path.join(relocated, 'verification/conversation-rubric.json');
  const rubric = JSON.parse(fs.readFileSync(rubricPath, 'utf8'));
  rubric.cases.pop();
  fs.writeFileSync(rubricPath, JSON.stringify(rubric));
  assert.throws(() => loadSuite(relocated), /评审标准/);
});
test('valid_and_factually_wrong_fixtures_both_pass_technical_only', () => {
  for (const file of ['process-v8.json', 'wrong-draft.json']) {
    const result = validateDocument(JSON.parse(fs.readFileSync(path.join(root, 'verification/conversation-fixtures', file), 'utf8')));
    assert.equal(result.valid, true);
    assert.equal(result.business_review, 'not_assessed');
  }
  assert.throws(() => JSON.parse(fs.readFileSync(path.join(root, 'verification/conversation-fixtures/invalid-process.json'), 'utf8')));
});
test('cli_check_and_invalid_arguments_report_without_model_execution', () => {
  const script = path.join(root, 'scripts/prepare-conversation-case.cjs');
  const checked = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr);
  assert.equal(JSON.parse(checked.stdout).model_execution, 'not_run');
  const invalid = spawnSync(process.execPath, [script, '--unknown'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
});
test('source_fixtures_unchanged', () => {
  assert.deepEqual(sourceFiles.map(file => hash(fs.readFileSync(path.join(root, file)))), initialHashes);
});
const report = { purpose: 'conversation_preparation_functional_tests', model_execution: 'not_run', cases_prepared: suite.cases.length, passed: results.filter(row => row.passed).length, failed: results.filter(row => !row.passed).length, results, evidence_directory: run };
fs.writeFileSync(path.join(run, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
