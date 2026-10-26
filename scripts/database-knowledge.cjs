#!/usr/bin/env node
// Offline metadata lookup, integrity checks and snapshot comparison. No connectors.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));

function checkSupplemental(root, manifest) {
  if (manifest.supplemental_files === undefined) return 0;
  assert.ok(manifest.supplemental_files && typeof manifest.supplemental_files === 'object'
    && !Array.isArray(manifest.supplemental_files), 'Invalid supplemental file manifest');
  const realRoot = fs.realpathSync(root);
  const names = new Set(Object.keys(manifest.files));
  for (const [name, digest] of Object.entries(manifest.supplemental_files)) {
    assert.ok(typeof name === 'string' && !path.win32.isAbsolute(name)
      && !path.posix.isAbsolute(name) && !/[:\0]/.test(name), 'Unsafe supplemental path');
    const normalized = name.replace(/\\/g, '/');
    const parts = normalized.split('/');
    assert.ok(parts.every(part => part && part !== '.' && part !== '..'), 'Unsafe supplemental path');
    assert.ok(!names.has(normalized), 'Duplicate supplemental path');
    names.add(normalized);
    assert.ok(typeof digest === 'string' && /^[a-f0-9]{64}$/i.test(digest), 'Invalid supplemental digest');
    const file = path.join(root, ...parts);
    const realFile = fs.realpathSync(file);
    assert.ok(realFile.startsWith(realRoot + path.sep) && fs.statSync(realFile).isFile(),
      'Supplemental file is outside the package');
    assert.equal(hash(realFile), digest.toLowerCase(), 'Supplemental file hash mismatch: ' + normalized);
  }
  return names.size - Object.keys(manifest.files).length;
}

function load(directory) {
  const root = path.resolve(directory);
  const manifest = read(path.join(root, 'manifest.json'));
  assert.equal(manifest.schema_version, 'gk-database-knowledge-v1');
  const required = ['objects.json', 'sources.json', 'aggregates.json', 'views.json', 'curation.json'];
  assert.deepEqual(Object.keys(manifest.files).sort(), required.sort());
  for (const name of required) assert.equal(hash(path.join(root, name)), manifest.files[name], 'Package hash mismatch: ' + name);
  checkSupplemental(root, manifest);
  return { root, manifest, objects: read(path.join(root, 'objects.json')), sources: read(path.join(root, 'sources.json')),
    aggregates: read(path.join(root, 'aggregates.json')), views: read(path.join(root, 'views.json')),
    curation: read(path.join(root, 'curation.json')) };
}

function check(pkg, options = {}) {
  assert.equal(pkg.manifest.status, 'prepared');
  for (const key of ['business_rules_approved', 'current_database_verified', 'live_queries_enabled', 'contains_business_rows']) {
    assert.equal(pkg.manifest[key], false, 'Unsupported authority or live-data claim: ' + key);
  }
  assert.ok(['local_restricted', 'public_dictionary'].includes(pkg.manifest.sharing_scope), 'Unsupported sharing scope');
  if (pkg.manifest.sharing_scope === 'public_dictionary') {
    assert.equal(pkg.manifest.contains_aggregate_statistics, false, 'Public dictionary must exclude business aggregates');
    assert.equal(pkg.aggregates.length, 0, 'Public dictionary must exclude business aggregates');
    assert.ok(!options['--verify-sources'], 'Public dictionary contains evidence digests, not original source files; use check without --verify-sources.');
    for (const source of pkg.sources) {
      for (const key of ['source_path', 'original_source_path', 'sql_path', 'audit_catalog', 'target_host', 'row_count', 'result_rows', 'logged_result_row_count']) {
        assert.ok(!(key in source), 'Public dictionary contains private source metadata: ' + key);
      }
    }
  }
  const sources = new Map();
  for (const source of pkg.sources) {
    assert.ok(!sources.has(source.evidence_ref), 'Duplicate evidence reference');
    sources.set(source.evidence_ref, source);
    if (options['--verify-sources']) {
      assert.equal(hash(source.source_path), source.sha256, 'Source file changed: ' + source.evidence_ref);
      if (source.sql_path) assert.equal(hash(source.sql_path), source.sql_sha256, 'SQL source changed');
    }
  }
  const objects = new Map();
  const fields = new Map();
  const fieldEvidence = new Map();
  for (const object of pkg.objects) {
    assert.ok(!objects.has(object.object_ref), 'Duplicate object reference');
    objects.set(object.object_ref, object);
    for (const ref of object.evidence_refs) assert.ok(sources.has(ref), 'Missing object evidence');
    for (const field of object.fields) {
      assert.ok(!fields.has(field.field_ref), 'Duplicate field reference');
      fields.set(field.field_ref, object.object_ref);
      fieldEvidence.set(field.field_ref, field.observations.map(o => o.evidence_ref));
      assert.ok(field.observations.length > 0, 'Missing field evidence');
      for (const observation of field.observations) assert.ok(sources.has(observation.evidence_ref), 'Missing field source');
      for (const key of ['value', 'values', 'default', 'default_expression', 'connection_string', 'password']) {
        assert.ok(!(key in field), 'Unexpected value-bearing field');
        assert.ok(!(key in field.metadata), 'Unexpected value-bearing metadata');
      }
    }
    for (const key of object.keys) {
      assert.ok(sources.has(key.evidence_ref), 'Missing key evidence');
      for (const name of key.columns) assert.ok(object.fields.some(f => f.name === name), 'Key column not found');
    }
  }
  for (const relation of pkg.curation.relations || []) {
    assert.ok(relation.relation_ref && relation.limitations, 'Incomplete relation');
    assert.equal(relation.business_confirmation, 'pending');
    for (const ref of relation.evidence_refs) assert.ok(sources.has(ref), 'Missing relation evidence');
    for (const pair of relation.field_pairs) {
      assert.ok(fields.has(pair.from) && fields.has(pair.to), 'Missing relation endpoint: ' + relation.relation_ref);
    }
  }
  for (const business of pkg.curation.business_objects || []) {
    assert.equal(business.business_confirmation, 'pending');
    for (const ref of business.object_refs) assert.ok(objects.has(ref), 'Missing business object mapping');
  }
  for (const observation of pkg.curation.implementation_observations || []) {
    for (const ref of observation.evidence_refs) assert.ok(sources.has(ref), 'Missing implementation observation evidence');
  }
  for (const system of Object.keys(pkg.manifest.systems)) {
    const subset = pkg.objects.filter(o => o.system_ref === system);
    assert.equal(pkg.manifest.systems[system].objects, subset.length, 'Object count differs from manifest');
    assert.equal(pkg.manifest.systems[system].fields, subset.reduce((n, o) => n + o.fields.length, 0), 'Field count differs from manifest');
  }
  for (const aggregate of pkg.aggregates) {
    assert.ok(sources.has(aggregate.evidence_ref));
    for (const row of aggregate.rows) for (const value of Object.values(row)) {
      assert.ok(value === null || typeof value === 'number', 'Unexpected nonnumeric aggregate');
    }
  }
  if (options['--references']) {
    assert.ok(options['--process'], 'A process file is required to check references');
    const refs = read(options['--references']);
    const process = read(options['--process']);
    assert.equal(refs.schema_version, 'gk-database-references-v1');
    assert.equal(refs.package_version, pkg.manifest.package_version);
    assert.equal(refs.package_manifest_sha256, hash(path.join(pkg.root, 'manifest.json')));
    assert.equal(refs.process_sha256, hash(options['--process']), 'Process file changed');
    for (const mapping of refs.mappings) {
      const data = process.data_objects.find(x => x.data_ref === mapping.process_data_ref);
      assert.ok(data && data.fields.some(x => x.field_ref === mapping.process_field_ref), 'Process field not found');
      assert.ok(objects.has(mapping.database_object_ref), 'Database object not found');
      assert.ok(objects.get(mapping.database_object_ref).schema !== null, 'Database schema is unresolved');
      assert.equal(fields.get(mapping.database_field_ref), mapping.database_object_ref, 'Database field belongs to another object');
      assert.ok(['pending_confirmation', 'user_confirmed_for_process'].includes(mapping.mapping_status));
      assert.ok(mapping.evidence_refs.length > 0);
      for (const ref of mapping.evidence_refs) assert.ok(sources.has(ref));
      assert.ok(mapping.evidence_refs.some(ref => fieldEvidence.get(mapping.database_field_ref).includes(ref)), 'Mapping evidence does not include the selected field source');
      if (mapping.mapping_status === 'user_confirmed_for_process') {
        assert.ok(typeof mapping.confirmation_record === 'string' && mapping.confirmation_record.trim(), 'A confirmed mapping needs its confirmation record');
      }
    }
  }
  return { valid: true, package_version: pkg.manifest.package_version, systems: pkg.manifest.systems,
    objects: objects.size, fields: fields.size, evidence: sources.size,
    relations: (pkg.curation.relations || []).length,
    supplemental_files_verified: Object.keys(pkg.manifest.supplemental_files || {}).length,
    source_files_verified: Boolean(options['--verify-sources']),
    business_review: 'not_assessed', current_database_verified: false };
}

function query(pkg, options) {
  const terms = String(options['--query'] || '').toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const limit = Number(options['--limit'] || 10);
  assert.ok(Number.isInteger(limit) && limit >= 1 && limit <= 100, 'Limit must be 1..100');
  const kind = options['--kind'] || 'object';
  assert.ok(['object', 'field', 'relation', 'business'].includes(kind), 'Unsupported query kind');
  const match = value => terms.every(term => JSON.stringify(value).toLocaleLowerCase().includes(term));
  const eligible = o => !options['--system'] || o.system_ref === options['--system'];
  let candidates;
  if (kind === 'object') {
    candidates = pkg.objects.filter(eligible).filter(o => !options['--object'] || o.object_ref === options['--object'])
      .filter(o => match([o.name, o.database, o.search_labels, o.fields.map(f => [f.name, f.semantic_annotation])]))
      .map(({ fields, observations, ...o }) => ({ ...o, field_count: fields.length }));
  } else if (kind === 'field') {
    candidates = pkg.objects.filter(eligible).filter(o => !options['--object'] || o.object_ref === options['--object'])
      .flatMap(o => o.fields.filter(f => f.metadata_class !== 'credential_related_structure')
        .filter(f => match([o.name, o.database, o.search_labels, f.name, f.semantic_annotation]))
        .filter(f => terms.length === 0 || terms.some(term => JSON.stringify([f.name, f.semantic_annotation]).toLocaleLowerCase().includes(term)))
        .map(f => ({ system_ref: o.system_ref, object_ref: o.object_ref, object_name: o.name, ...f })));
    candidates.sort((a, b) => Number(Boolean(b.semantic_annotation)) - Number(Boolean(a.semantic_annotation)));
  } else if (kind === 'relation') {
    candidates = (pkg.curation.relations || []).filter(r => !options['--system'] || r.system_refs.includes(options['--system'])).filter(match);
  } else {
    candidates = (pkg.curation.business_objects || []).filter(b => !options['--system'] || b.system_refs.includes(options['--system'])).filter(match);
  }
  const evidenceRefs = [...new Set(candidates.slice(0, limit).flatMap(x => x.evidence_refs || x.observations?.map(o => o.evidence_ref)
    || (x.object_refs || []).flatMap(ref => pkg.objects.find(o => o.object_ref === ref)?.evidence_refs || [])))];
  return { package_version: pkg.manifest.package_version, package_manifest_sha256: hash(path.join(pkg.root, 'manifest.json')),
    query_kind: kind, matched: candidates.length, returned: Math.min(limit, candidates.length),
    truncated: candidates.length > limit, results: candidates.slice(0, limit),
    evidence_refs: evidenceRefs,
    sources: pkg.sources.filter(s => evidenceRefs.includes(s.evidence_ref)),
    usage_note: '历史结构和检索候选；按来源时间、适用范围及业务确认使用，不代表当前数据库或正式业务规则。' };
}

function compare(previous, current) {
  const signature = o => JSON.stringify({ kind: o.object_kind, keys: o.keys.map(({ evidence_ref, ...k }) => k),
    fields: o.fields.map(f => ({ name: f.name, metadata: Object.fromEntries(Object.entries(f.metadata).filter(([k]) => k !== 'cache_column_node_id')), conflicts: f.conflicts })) });
  const before = new Map(previous.objects.map(o => [o.object_ref, signature(o)]));
  const after = new Map(current.objects.map(o => [o.object_ref, signature(o)]));
  return { previous: previous.manifest.package_version, current: current.manifest.package_version,
    added: [...after.keys()].filter(k => !before.has(k)), removed: [...before.keys()].filter(k => !after.has(k)),
    changed: [...after.keys()].filter(k => before.has(k) && before.get(k) !== after.get(k)),
    note: '只比较已采集范围的结构；缺项可能来自采集范围变化，不能自动认定数据库已删除对象。' };
}

function main(argv) {
  const [command, ...args] = argv;
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    assert.ok(['--package', '--query', '--system', '--object', '--kind', '--limit', '--previous', '--references', '--process', '--verify-sources'].includes(key), 'Unknown option');
    if (key === '--verify-sources') options[key] = true;
    else { assert.ok(args[i + 1] && !args[i + 1].startsWith('--'), 'Missing option value'); options[key] = args[++i]; }
  }
  assert.ok(options['--package'], '用法：node scripts/database-knowledge.cjs query|check|diff --package <知识包目录> [选项]');
  const pkg = load(options['--package']);
  check(pkg);
  if (command === 'check') return check(pkg, options);
  if (command === 'query') return query(pkg, options);
  assert.equal(command, 'diff', 'Unsupported command');
  assert.ok(options['--previous']);
  const previous = load(options['--previous']);
  check(previous);
  return compare(previous, pkg);
}

if (require.main === module) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(JSON.stringify({ valid: false, error: error.message })); process.exitCode = 1; }
}
module.exports = { load, check, query, compare, main, hash };
