#!/usr/bin/env node
// Offline only. Validation reads but never changes the user's JSON. The explicit
// --emit-template and --promote operations create new files, refusing overwrite.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { TextDecoder } = require('node:util');
const root = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const MAX_BYTES = 10 * 1024 * 1024;
function checkIntegrity() {
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'technical/snapshot.json'), 'utf8'));
  for (const item of snapshot.files) {
    const file = path.resolve(root, item.path);
    if (!file.startsWith(root + path.sep) || hash(fs.readFileSync(file)) !== item.sha256) {
      throw new Error(`技术快照文件缺失、越界或摘要不一致：${item.path}`);
    }
  }
  return snapshot;
}
function validateDocument(document, options = {}) {
  const snapshot = checkIntegrity();
  const version = document && document.schema_version;
  let validation;
  if (!snapshot.supported_schema_versions.includes(version)) {
    validation = { valid: false, errors: [{ path: '/schema_version', keyword: 'supportedVersion', error_id: 'UNSUPPORTED_SCHEMA_VERSION', message: '仅支持严格V8及受支持V7；其他旧格式须在3001中核对迁移。' }] };
  } else {
    const schemas = require('../technical/compiled-schemas.cjs');
    const semantics = require('../technical/semantic-validator.cjs');
    validation = version === 'process-governance-v8'
      ? semantics.validateProcessGovernanceV8(document, { schemaValidator: schemas.validateV8 })
      : semantics.validateProcessGovernanceV7(document, { schemaValidator: schemas.validateV7 });
  }
  const digest = snapshot.schema_digests[version] || null;
  if (options.expectDigest && options.expectDigest.toLowerCase() !== digest) {
    validation.errors = [...validation.errors, {
      path: '/schema_version', keyword: 'schemaDigest', error_id: 'SCHEMA_DIGEST_MISMATCH',
      message: digest ? '结构摘要与指定目标不一致。' : '当前版本没有可核对的结构摘要。',
      params: { expected: options.expectDigest.toLowerCase(), actual: digest }
    }];
    validation.valid = false;
  }
  return {
    package_version: snapshot.package_version,
    technical_snapshot_version: snapshot.package_version,
    schema_version: version || null,
    schema_digest: digest,
    ...(options.expectDigest ? { expected_schema_digest: options.expectDigest.toLowerCase(), digest_match: options.expectDigest.toLowerCase() === digest } : {}),
    validation_profile: 'strict',
    valid: validation.valid,
    error_count: validation.errors.length,
    errors: validation.errors,
    business_review: 'not_assessed',
    target_3000_readiness: 'not_checked'
  };
}
function readDocument(file) {
  const size = fs.statSync(file).size;
  if (size > MAX_BYTES) throw new Error('JSON文件超过10MiB，不读取或修改源文件。');
  const bytes = fs.readFileSync(file);
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { document: JSON.parse(text), sha256: hash(bytes) };
}
function emitTemplate(file) {
  checkIntegrity();
  const template = JSON.parse(fs.readFileSync(path.join(root, 'templates/process-v8.blank.json'), 'utf8'));
  template.export_meta.package_ref = `package_${crypto.randomBytes(8).toString('hex')}`;
  template.export_meta.exported_at = new Date().toISOString();
  template.process.process_ref = `process_${crypto.randomBytes(8).toString('hex')}`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(template, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
}
function promoteDocument(sourceFile, targetFile) {
  if (path.resolve(sourceFile) === path.resolve(targetFile)) throw new Error('源文件与输出路径不能相同，不覆盖原稿。');
  if (fs.existsSync(targetFile)) throw new Error('输出路径已存在，不覆盖已有文件。');
  const input = readDocument(sourceFile);
  if (input.document?.schema_version !== 'process-governance-v7') throw new Error('--promote只接受process-governance-v7源文件，不猜测或转换其他版本。');
  const promoted = JSON.parse(JSON.stringify(input.document));
  promoted.schema_version = 'process-governance-v8';
  // Keep the real migration archive, identities, values and array order intact.
  const result = validateDocument(promoted);
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, JSON.stringify(promoted, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  return { source_file: sourceFile, source_sha256: input.sha256, file: targetFile,
    source_schema_version: 'process-governance-v7', conversion: 'version_marker_only',
    migration_completed: false, ...result };
}
function parseArgs(args) {
  const options = { asJson: false, mode: 'validate', file: null, expectDigest: null };
  const seen = new Set();
  const value = index => {
    if (!args[index] || args[index].startsWith('--')) throw new Error('参数缺少有效值。使用 --help 查看用法。');
    return args[index];
  };
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token.startsWith('--')) {
      if (seen.has(token)) throw new Error('参数重复。使用 --help 查看用法。');
      seen.add(token);
    }
    if (token === '--json') options.asJson = true;
    else if (token === '--expect-digest') {
      options.expectDigest = value(++index);
      if (!/^[a-f0-9]{64}$/i.test(options.expectDigest)) throw new Error('目标结构摘要必须为64位SHA-256十六进制值。');
    } else if (token === '--emit-template' || token === '--promote') {
      if (options.mode !== 'validate') throw new Error('一次只能执行一个操作。');
      options.mode = token.slice(2);
      options.target = value(++index);
      if (token === '--promote') { options.source = options.target; options.target = value(++index); }
    } else if (token.startsWith('--') || options.file) throw new Error('参数错误。使用 --help 查看用法。');
    else options.file = token;
  }
  if (options.mode === 'validate' ? !options.file : options.file || options.expectDigest || (options.mode === 'emit-template' && options.asJson)) {
    throw new Error('参数组合错误。使用 --help 查看用法。');
  }
  return options;
}
function main(args) {
  let asJson = args.includes('--json');
  const fail = message => {
    const error = { valid: false, technical_error: 'INPUT_OR_SNAPSHOT_ERROR', message };
    (asJson ? process.stdout : process.stderr).write(asJson ? JSON.stringify(error, null, 2) + '\n' : message + '\n');
    return 2;
  };
  try {
    if (args.length === 1 && args[0] === '--help') {
      console.log('离线校验：node scripts/validate-process.cjs <JSON文件> [--expect-digest <SHA-256>] [--json]\n新建骨架：node scripts/validate-process.cjs --emit-template <新的JSON路径>\nV7版本标识转换：node scripts/validate-process.cjs --promote <V7源文件> <新V8文件> [--json]\n检查快照：node scripts/validate-process.cjs --check-snapshot\n转换只改顶层版本，拒绝覆盖并保留真实归档；不表示迁移完成。\n退出码：0通过，1校验未通过，2输入或技术快照错误。转换稿校验未通过时仍另存，并明确返回1。');
      return 0;
    }
    if (args.length === 1 && args[0] === '--check-snapshot') {
      const snapshot = checkIntegrity();
      console.log(JSON.stringify({ valid: true, package_version: snapshot.package_version, checked_files: snapshot.files.length, schema_digests: snapshot.schema_digests }, null, 2));
      return 0;
    }
    const options = parseArgs(args);
    if (options.mode === 'emit-template') {
      const target = path.resolve(options.target);
      emitTemplate(target);
      console.log(`已创建V8空白骨架：${target}\n技术标识已重新生成；空白内容不代表业务完整或审核通过。`);
      return 0;
    }
    if (options.mode === 'promote') {
      const result = promoteDocument(path.resolve(options.source), path.resolve(options.target));
      if (asJson) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(`已另存V8版本标识转换稿：${result.file}\n技术校验：${result.valid ? '通过' : '未通过'}\n源文件SHA-256：${result.source_sha256}`);
        for (const error of result.errors) console.log(`${error.path} | ${error.rule_code || error.keyword} | ${error.message}`);
        console.log('仅转换顶层版本标识；真实来源归档、稳定标识及顺序保留。3001规范化、差异核对、下载和业务核对仍需人工完成。');
      }
      return result.valid ? 0 : 1;
    }
    const file = path.resolve(options.file);
    const input = readDocument(file);
    const result = { file, source_sha256: input.sha256, ...validateDocument(input.document, options) };
    if (asJson) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`结果：${result.valid ? '技术校验通过' : '技术校验未通过'}\n版本：${result.schema_version}\n结构摘要：${result.schema_digest}\n原文件SHA-256：${result.source_sha256}`);
      for (const error of result.errors) console.log(`${error.path} | ${error.rule_code || error.keyword} | ${error.message}`);
      console.log('业务事实、角色授权、目标3000状态和正式审核未由本检查认定。');
    }
    return result.valid ? 0 : 1;
  } catch (error) { return fail(error.message); }
}
module.exports = { validateDocument, readDocument, checkIntegrity, emitTemplate, promoteDocument };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
