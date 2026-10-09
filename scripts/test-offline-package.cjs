#!/usr/bin/env node
// Uses only synthetic fixtures and owned system-temporary directories. Optional
// --source parity loads pure Infomat validators; no listeners or databases.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const api = require('./validate-process.cjs');
const argv = process.argv.slice(2);
const options = {};
for (let index = 0; index < argv.length; index += 2) {
  if (!['--source', '--report'].includes(argv[index]) || !argv[index + 1]) throw new Error('用法：node scripts/test-offline-package.cjs [--source <Infomat目录>] [--report <新报告路径>]');
  options[argv[index]] = path.resolve(argv[index + 1]);
}
const example = JSON.parse(fs.readFileSync(path.join(root, 'examples/demo-process-v8.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const results = [];
function check(name, fn) {
  fn();
  results.push({ name, passed: true });
}
let sourceService = null;
let sourceMdm = null;
if (options['--source']) {
  sourceService = require(path.join(options['--source'], 'apps/structured-output-service/server.js'));
  sourceMdm = require(path.join(options['--source'], 'apps/mdm-platform/server/processV7PreviewReview.js'));
}
const departments = [{ id: 1, name: '物资保障部' }, { id: 2, name: '质量安环部' }];
function normalized(errors) {
  return errors.map(({ path: errorPath, keyword, message, error_id, rule_code, params }) => ({ path: errorPath, keyword, message, error_id, rule_code, params }));
}
function fixture(name, mutate, valid) {
  check(name, () => {
    const document = clone(example);
    mutate(document);
    const before = JSON.stringify(document);
    const result = api.validateDocument(document);
    assert.equal(result.valid, valid);
    assert.equal(JSON.stringify(document), before, '校验必须保留输入及数组顺序');
    assert.equal(result.business_review, 'not_assessed');
    if (sourceService) {
      const source = sourceService.processGovernanceValidationResult(document);
      assert.equal(result.valid, source.valid, '3001结果不同');
      assert.deepEqual(normalized(result.errors), normalized(source.errors), '3001错误定位不同');
      const projected = sourceMdm.validateAndProjectV7(document, departments);
      assert.equal(projected.errors.length === 0, result.valid, '3000纯校验结果不同');
      if (!result.valid) assert.deepEqual(normalized(result.errors), normalized(projected.errors), '3000错误定位不同');
    }
  });
}
fixture('native_v8_example', () => {}, true);
fixture('strict_v7_without_decision_data', d => {
  d.schema_version = 'process-governance-v7';
  d.migration.source_schema_version = 'process-governance-v7';
  d.data_objects[1].behavior_links = d.data_objects[1].behavior_links.filter(link => link.behavior_ref !== 'behavior_demo_decision');
}, true);
fixture('v7_decision_use_rejected', d => { d.schema_version = 'process-governance-v7'; d.migration.source_schema_version = 'process-governance-v7'; }, false);
fixture('decision_update_rejected', d => {
  const link = d.data_objects[1].behavior_links.find(x => x.behavior_ref === 'behavior_demo_decision');
  link.operation = 'update'; link.updated_field_refs = ['field_demo_result'];
}, false);
fixture('decision_create_rejected', d => { d.data_objects[1].behavior_links[1].operation = 'create'; }, false);
fixture('parallel_control_data_rejected', d => { d.behaviors[2].node_type = 'parallel_split'; }, false);
fixture('form_decision_operation_rejected', d => { d.forms[0].behavior_links[0].behavior_ref = 'behavior_demo_decision'; }, false);
fixture('dangling_flow_endpoint_rejected', d => { d.flow_relations[0].to_behavior_ref = 'behavior_missing'; }, false);
fixture('self_loop_rejected', d => { d.flow_relations[0].to_behavior_ref = d.flow_relations[0].from_behavior_ref; }, false);
fixture('duplicate_stable_id_rejected', d => { d.behaviors[1].behavior_ref = d.behaviors[0].behavior_ref; }, false);
fixture('cross_object_update_field_rejected', d => { d.data_objects[0].behavior_links[1].updated_field_refs = ['field_demo_result']; }, false);
fixture('dangling_form_field_rejected', d => { d.forms[0].areas[0].items[0].data_field_ref = 'field_missing'; }, false);
fixture('form_field_type_mismatch_rejected', d => { d.forms[0].areas[0].items[0].item_type = '数值'; }, false);
fixture('invalid_operation_enum_rejected', d => { d.data_objects[0].behavior_links[0].operation = 'approve'; }, false);
fixture('extra_interview_property_rejected', d => { d.interview_answers = []; }, false);
fixture('missing_required_behavior_property_rejected', d => { delete d.behaviors[0].actor_assignment_mode; }, false);
if (sourceMdm) check('active_3000_departments_are_a_separate_gate', () => {
  assert.equal(api.validateDocument(example).valid, true);
  const result = sourceMdm.validateAndProjectV7(example, [{ id: 3, name: '演示中的另一部门' }]);
  assert.ok(result.errors.some(error => error.field === 'process.owning_department'));
});
check('unsupported_schema_not_guessed', () => {
  const d = clone(example); d.schema_version = 'process-governance-v99';
  const result = api.validateDocument(d);
  assert.equal(result.valid, false);
  assert.equal(result.schema_digest, null);
});

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'governance-package-'));
const cli = path.join(root, 'scripts/validate-process.cjs');
function run(args, entry = cli) {
  return spawnSync(process.execPath, [entry, ...args], { cwd: temporaryRoot, encoding: 'utf8', windowsHide: true, env: { ...process.env, NODE_PATH: '' } });
}
try {
  const input = path.join(temporaryRoot, 'source.json');
  fs.writeFileSync(input, JSON.stringify(example));
  const originalHash = hash(input);
  check('cli_read_only_and_repeatable', () => {
    const first = run([input, '--json']); const second = run([input, '--json']);
    assert.equal(first.status, 0); assert.equal(second.status, 0);
    assert.equal(hash(input), originalHash);
    assert.deepEqual(JSON.parse(first.stdout), JSON.parse(second.stdout));
  });
  check('invalid_cli_document_is_not_overwritten', () => {
    const file = path.join(temporaryRoot, 'broken-reference.json');
    const d = clone(example); d.flow_relations[0].to_behavior_ref = 'behavior_missing';
    fs.writeFileSync(file, JSON.stringify(d)); const before = hash(file);
    assert.equal(run([file, '--json']).status, 1);
    assert.equal(hash(file), before);
  });
  check('expected_digest_accepts_matching_v8', () => {
    const digest = api.checkIntegrity().schema_digests['process-governance-v8'];
    const result = run([input, '--expect-digest', digest.toUpperCase(), '--json']);
    assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).digest_match, true);
    assert.equal(hash(input), originalHash);
  });
  check('expected_digest_rejects_v7_digest_for_v8', () => {
    const digest = api.checkIntegrity().schema_digests['process-governance-v7'];
    const result = run([input, '--expect-digest', digest, '--json']);
    assert.equal(result.status, 1);
    const body = JSON.parse(result.stdout);
    assert.equal(body.digest_match, false);
    assert.ok(body.errors.some(error => error.error_id === 'SCHEMA_DIGEST_MISMATCH'));
    assert.equal(body.error_count, body.errors.length);
    assert.equal(hash(input), originalHash);
  });
  check('expected_digest_rejects_unavailable_version', () => {
    const d = clone(example); d.schema_version = 'process-governance-v99';
    const result = api.validateDocument(d, { expectDigest: api.checkIntegrity().schema_digests['process-governance-v8'] });
    assert.equal(result.valid, false);
    assert.equal(result.digest_match, false);
    assert.ok(result.errors.some(error => error.error_id === 'SCHEMA_DIGEST_MISMATCH'));
  });
  check('invalid_option_combinations_have_no_side_effects', () => {
    const target = path.join(temporaryRoot, 'not-created.json');
    for (const args of [[input, '--expect-digest'], [input, '--expect-digest', 'bad'], ['--emit-template', target, '--expect-digest', '0'.repeat(64)], ['--promote', input], [input, '--json', '--json']]) {
      assert.equal(run(args).status, 2);
    }
    assert.equal(fs.existsSync(target), false);
    assert.equal(hash(input), originalHash);
  });
  check('v7_promotion_changes_only_top_level_version', () => {
    const source = path.join(temporaryRoot, 'legacy-v7.json');
    const target = path.join(temporaryRoot, 'promoted-v8.json');
    const d = clone(example); d.schema_version = 'process-governance-v7';
    d.migration.source_schema_version = 'process-governance-v6';
    d.migration.source_process_ref = 'legacy_demo';
    d.behaviors.reverse();
    fs.writeFileSync(source, JSON.stringify(d)); const before = hash(source);
    const result = run(['--promote', source, target, '--json']);
    assert.equal(result.status, 0);
    const converted = JSON.parse(fs.readFileSync(target, 'utf8'));
    assert.deepEqual(converted, { ...d, schema_version: 'process-governance-v8' });
    const body = JSON.parse(result.stdout);
    assert.equal(body.migration_completed, false);
    assert.equal(body.business_review, 'not_assessed');
    assert.equal(body.source_sha256, before);
    assert.equal(hash(source), before);
    const targetHash = hash(target);
    assert.equal(run(['--promote', source, target]).status, 2);
    assert.equal(hash(target), targetHash);
    assert.equal(run(['--promote', source, source]).status, 2);
    assert.equal(hash(source), before);
  });
  check('promotion_rejects_other_versions_without_writing', () => {
    const target = path.join(temporaryRoot, 'rejected-promotion.json');
    assert.equal(run(['--promote', input, target]).status, 2);
    assert.equal(fs.existsSync(target), false);
    assert.equal(hash(input), originalHash);
  });
  check('invalid_promoted_document_remains_explicitly_invalid', () => {
    const source = path.join(temporaryRoot, 'invalid-v7.json');
    const target = path.join(temporaryRoot, 'invalid-promoted-v8.json');
    const d = clone(example); d.schema_version = 'process-governance-v7';
    d.flow_relations[0].to_behavior_ref = 'behavior_missing';
    fs.writeFileSync(source, JSON.stringify(d)); const before = hash(source);
    const result = run(['--promote', source, target, '--json']);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).valid, false);
    assert.deepEqual(JSON.parse(fs.readFileSync(target, 'utf8')), { ...d, schema_version: 'process-governance-v8' });
    assert.equal(hash(source), before);
  });
  if (sourceService) check('template_is_current_source_structure', () => {
    const generated = sourceService.createEmptyProcessGovernanceDocument();
    const copied = JSON.parse(fs.readFileSync(path.join(root, 'templates/process-v8.blank.json'), 'utf8'));
    for (const d of [generated, copied]) { d.export_meta.package_ref = ''; d.export_meta.exported_at = ''; d.process.process_ref = ''; }
    assert.deepEqual(copied, generated);
  });
  check('new_templates_use_new_identity', () => {
    const left = path.join(temporaryRoot, 'new-a.json'); const right = path.join(temporaryRoot, 'new-b.json');
    assert.equal(run(['--emit-template', left]).status, 0);
    assert.equal(run(['--emit-template', right]).status, 0);
    const a = JSON.parse(fs.readFileSync(left, 'utf8')); const b = JSON.parse(fs.readFileSync(right, 'utf8'));
    assert.notEqual(a.process.process_ref, b.process.process_ref);
    assert.notEqual(a.export_meta.package_ref, b.export_meta.package_ref);
    assert.equal(a.schema_version, 'process-governance-v8');
    const original = hash(left);
    assert.equal(run(['--emit-template', left]).status, 2);
    assert.equal(hash(left), original);
  });
  check('malformed_json_rejected_unchanged', () => {
    const file = path.join(temporaryRoot, 'invalid.json'); fs.writeFileSync(file, '{bad'); const before = hash(file);
    assert.equal(run([file, '--json']).status, 2); assert.equal(hash(file), before);
  });
  check('invalid_utf8_rejected', () => {
    const file = path.join(temporaryRoot, 'encoding.json'); fs.writeFileSync(file, Buffer.from([0xff, 0xfe, 0x7b, 0x00]));
    assert.equal(run([file, '--json']).status, 2);
  });
  check('oversized_input_rejected', () => {
    const file = path.join(temporaryRoot, 'oversized.json'); fs.writeFileSync(file, Buffer.alloc(10 * 1024 * 1024 + 1, 32));
    assert.equal(run([file, '--json']).status, 2);
  });
  const relocated = path.join(temporaryRoot, 'relocated-package');
  for (const name of ['scripts', 'technical', 'templates', 'examples']) fs.cpSync(path.join(root, name), path.join(relocated, name), { recursive: true });
  const relocatedCli = path.join(relocated, 'scripts/validate-process.cjs');
  check('relocated_package_needs_no_infomat_or_npm', () => {
    assert.equal(run([input, '--json'], relocatedCli).status, 0);
    assert.equal(run(['--check-snapshot'], relocatedCli).status, 0);
  });
  check('tampered_snapshot_fails_closed', () => {
    fs.appendFileSync(path.join(relocated, 'technical/semantic-validator.cjs'), '\n// changed\n');
    const result = run([input, '--json'], relocatedCli);
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).technical_error, 'INPUT_OR_SNAPSHOT_ERROR');
    assert.equal(hash(input), originalHash);
  });
} finally {
  const resolvedTemporary = fs.realpathSync(temporaryRoot);
  const resolvedSystemTemporary = fs.realpathSync(os.tmpdir());
  assert.ok(resolvedTemporary.startsWith(resolvedSystemTemporary + path.sep));
  fs.rmSync(resolvedTemporary, { recursive: true, force: true });
}
const snapshot = api.checkIntegrity();
const report = {
  completed_at: new Date().toISOString(), node_version: process.version,
  authoring_package_version: JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).authoring_package.version,
  technical_snapshot_version: snapshot.package_version,
  package_version: snapshot.package_version, schema_digests: snapshot.schema_digests,
  source_parity_checked: Boolean(sourceService), source_validators: sourceService ? ['3001_pure_validation', '3000_pure_validation_projection_with_synthetic_departments'] : [],
  passed: results.length, failed: 0, checks: results,
  business_acceptance: 'not_performed', real_colleague_ai_conversation: 'not_performed', live_3000_upload: 'not_performed'
};
if (options['--report']) {
  fs.mkdirSync(path.dirname(options['--report']), { recursive: true });
  fs.writeFileSync(options['--report'], JSON.stringify(report, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
}
console.log(JSON.stringify({ passed: report.passed, failed: report.failed, source_parity_checked: report.source_parity_checked, report: options['--report'] || null }, null, 2));
