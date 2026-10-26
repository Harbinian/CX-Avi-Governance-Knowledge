#!/usr/bin/env python3
"""Build a local metadata package from explicitly selected offline evidence."""
import argparse
import collections
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
from urllib.parse import quote
import xml.etree.ElementTree as ET
import zipfile


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def object_ref(system, database, schema, name):
    return 'gkdb:' + ':'.join(quote(x if x is not None else '~unresolved-schema', safe='') for x in [system, database, schema, name])


def field_ref(obj_ref, name):
    return obj_ref + ':field:' + quote(name, safe='')


def metadata_class(name):
    if re.search(r'password|passwd|pwd|secret|token|salt|smsvcode|口令|密码|密钥|验证码', name, re.I):
        return 'credential_related_structure'
    if re.search(r'手机|身份证|邮箱|联系电话|email|mobile|phone', name, re.I):
        return 'personal_data_related_structure'
    return 'structure_only'


class Builder:
    def __init__(self, config):
        self.config = config
        self.objects = {}
        self.evidence = {}
        self.aggregates = []
        self.views = []

    def evidence_entry(self, ref, kind, path, **extra):
        if ref in self.evidence:
            raise ValueError('Duplicate evidence reference: ' + ref)
        self.evidence[ref] = dict(evidence_ref=ref, evidence_kind=kind,
            source_path=str(Path(path).resolve()), sha256=digest(path), **extra)

    def add_object(self, system, database, schema, name, kind, evidence, locator, fields, keys=None):
        ref = object_ref(system, database, schema, name)
        obj = self.objects.setdefault(ref, dict(object_ref=ref, system_ref=system,
            database=database, schema=schema, name=name, object_kind=kind,
            schema_resolution='captured' if schema is not None else 'not_captured',
            semantic_status='not_business_confirmed', evidence_refs=[], observations=[],
            fields=[], keys=[]))
        if obj['object_kind'] == 'unspecified':
            obj['object_kind'] = kind
        elif kind != 'unspecified' and obj['object_kind'] != kind:
            raise ValueError('Conflicting object kinds: ' + ref)
        if evidence not in obj['evidence_refs']:
            obj['evidence_refs'].append(evidence)
        obj['observations'].append(dict(evidence_ref=evidence, locator=locator))
        by_name = {f['name']: f for f in obj['fields']}
        for name, meta in fields:
            fld = by_name.get(name)
            if fld is None:
                fld = dict(field_ref=field_ref(ref, name), name=name,
                    metadata_class=metadata_class(name), semantic_status='not_business_confirmed',
                    observations=[])
                obj['fields'].append(fld)
                by_name[name] = fld
            fld['observations'].append(dict(evidence_ref=evidence, metadata=meta))
        for key in keys or []:
            obj['keys'].append(dict(key, evidence_ref=evidence))

    def xml_source(self, source):
        path = Path(source['path'])
        ev = source['evidence_ref']
        self.evidence_entry(ev, 'cached_structure', path,
            file_modified_at=dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc).isoformat(),
            current_database_verified=False, time_basis='cache timestamps have no declared timezone')
        root = ET.parse(path).getroot()
        elements = list(root.iter())
        children = collections.defaultdict(list)
        for e in elements:
            children[e.get('parent')].append(e)
        for target in source['targets']:
            matches = [e for e in elements if e.tag == 'database' and e.get('name') == target['database']]
            if len(matches) != 1:
                raise ValueError('Database selection must be unique: ' + target['database'])
            schemas = [e for e in children[matches[0].get('id')]
                       if e.tag == 'schema' and e.get('name') == target['schema']]
            if len(schemas) != 1:
                raise ValueError('Schema selection must be unique')
            schema = schemas[0]
            self.evidence[ev].setdefault('scopes', []).append(dict(target,
                database_node_id=matches[0].get('id'), schema_node_id=schema.get('id'),
                cache_introspection_timestamp=schema.findtext('IntrospectionTimestamp'),
                cache_local_introspection_timestamp=schema.findtext('LastIntrospectionLocalTimestamp')))
            for obj in children[schema.get('id')]:
                if obj.tag not in ['table', 'view']:
                    continue
                if target.get('object_names') and obj.get('name') not in target['object_names']:
                    continue
                fields, keys = [], []
                indexes = {x.get('name'): x for x in children[obj.get('id')] if x.tag == 'index'}
                for e in children[obj.get('id')]:
                    if e.tag == 'column':
                        # Defaults, grants, connection settings and row values are not exported.
                        fields.append((e.get('name'), dict(
                            stored_type=e.findtext('StoredType'),
                            ordinal=int(e.findtext('Position')) if e.findtext('Position') else None,
                            not_null_marked=e.findtext('NotNull') == '1', cache_column_node_id=e.get('id'))))
                    elif e.tag == 'key':
                        idx = indexes.get(e.findtext('UnderlyingIndexName'))
                        names = e.findtext('ColNames') or (idx.findtext('ColNames') if idx is not None else '')
                        keys.append(dict(name=e.get('name'), primary=e.findtext('Primary') == '1',
                            columns=names.splitlines() if names else []))
                self.add_object(target['system_ref'], target['database'], target['schema'],
                    obj.get('name'), obj.tag, ev, dict(cache_object_node_id=obj.get('id')), fields, keys)

    def query_source(self, source):
        log_path = Path(source['path'])
        self.evidence_entry(source['evidence_ref'], 'query_log', log_path,
            current_database_verified=False, parameter_values_recorded=False)
        records = [json.loads(x) for x in log_path.read_text(encoding='utf-8-sig').splitlines() if x.strip()]
        scripts = collections.defaultdict(list)
        for p in Path(source['sql_directory']).glob('*.sql'):
            scripts[digest(p)].append(p)
        for selection in source['queries']:
            found = [x for x in records if x['query_id'] == selection['query_id']]
            if len(found) != 1:
                raise ValueError('Query ID must resolve exactly once: ' + selection['query_id'])
            record = found[0]
            sql_paths = scripts.get(record['sql_sha256'].lower(), [])
            if len(sql_paths) != 1:
                raise ValueError('Query SQL digest does not resolve uniquely: ' + record['query_id'])
            sql = sql_paths[0].read_text(encoding='utf-8-sig')
            result_path = Path(record['result_file'])
            if not result_path.is_absolute():
                result_path = Path(source['result_root']) / result_path
            rows = read_json(result_path)
            if not isinstance(rows, list) or len(rows) != record['row_count']:
                raise ValueError('Result row count differs from log: ' + record['query_id'])
            ev = selection['evidence_ref']
            self.evidence_entry(ev, 'historical_query_result', result_path,
                parent_evidence_ref=source['evidence_ref'], query_id=record['query_id'],
                database=record['database'], recorded_at=record['started_at'], row_count=len(rows),
                sql_path=str(sql_paths[0].resolve()), sql_sha256=record['sql_sha256'].lower(),
                sql_digest_verified=True, parameter_names=record['parameter_names'],
                parameter_values_recorded=False, current_database_verified=False)
            if selection['role'] == 'aggregate':
                allowed = set(selection['columns'])
                if any(set(row) != allowed for row in rows):
                    raise ValueError('Aggregate columns differ from allowlist')
                if any(not isinstance(value, (int, float, type(None))) or isinstance(value, bool)
                       for row in rows for value in row.values()):
                    raise ValueError('Aggregate evidence must contain numeric values only')
                self.aggregates.append(dict(evidence_ref=ev, query_id=record['query_id'], rows=rows,
                    scope_status='parameter_values_not_recorded', current_database_verified=False))
                continue
            schema = selection['schema']
            if schema is not None:
                patterns = [r"SCHEMA_NAME\s*\(\s*o\.schema_id\s*\)\s*=\s*N?'" + re.escape(schema) + "'",
                            r"o\.schema_id\s*=\s*SCHEMA_ID\s*\(\s*N?'" + re.escape(schema) + r"'\s*\)"]
                if not any(re.search(pattern, sql, re.I) for pattern in patterns):
                    raise ValueError('Metadata query schema filter not verified: ' + record['query_id'])
            self.evidence[ev]['schema_resolution'] = 'captured' if schema is not None else 'not_captured'
            groups = collections.defaultdict(list)
            for row in rows:
                if not {'object_name', 'column_name', 'data_type'} <= row.keys():
                    raise ValueError('Unsupported metadata result')
                groups[row['object_name']].append(row)
            for name, group in groups.items():
                kind = {'USER_TABLE': 'table', 'VIEW': 'view'}.get(group[0].get('object_type'), 'unspecified')
                if kind == 'unspecified' and re.search(r'FROM\s+sys\.tables\b', sql, re.I):
                    kind = 'table'
                fields = []
                for row in group:
                    meta = dict(sql_type=row['data_type'])
                    for old, new in [('column_id', 'ordinal'), ('max_length', 'max_length_bytes'),
                                     ('precision', 'precision'), ('scale', 'scale'),
                                     ('is_nullable', 'nullable'), ('collation_name', 'collation')]:
                        if old in row:
                            meta[new] = row[old]
                    fields.append((row['column_name'], meta))
                self.add_object(source['database_systems'][record['database']], record['database'],
                    schema, name, kind, ev, dict(query_id=record['query_id'], object_name=name), fields)

    def view_source(self, source):
        path = Path(source['path'])
        with zipfile.ZipFile(path) as archive:
            names = archive.namelist()
            for selection in source['views']:
                metas = [n for n in names if n.startswith('/view/') and n.endswith('.meta') and
                         archive.read(n).decode('utf-8-sig').splitlines()[0] == '#n:' + selection['name']]
                if len(metas) != 1:
                    raise ValueError('Cached view name is not unique: ' + selection['name'])
                member = metas[0][:-5] + '.sql'
                raw = archive.read(member)
                text = raw.decode('utf-8-sig')
                if not re.match(r'\s*create\s+view\b', text, re.I):
                    raise ValueError('Selected definition is not a view')
                self.evidence_entry(selection['evidence_ref'], 'cached_view_definition', path,
                    archive_member=member, archive_member_sha256=hashlib.sha256(raw).hexdigest(),
                    database=source['database'], schema=source['schema'], object_name=selection['name'],
                    current_database_verified=False)
                self.views.append(dict(evidence_ref=selection['evidence_ref'], name=selection['name'],
                    sql_definition=text, interpretation_status='implementation_evidence_only'))

    def finish(self, output):
        for source in self.config['sources']:
            {'datagrip_xml': self.xml_source, 'query_log': self.query_source,
             'datagrip_views': self.view_source}[source['kind']](source)
        objects = sorted(self.objects.values(), key=lambda x: x['object_ref'])
        for obj in objects:
            for fld in obj['fields']:
                values = collections.defaultdict(list)
                for obs in fld['observations']:
                    for key, value in obs['metadata'].items():
                        if value not in values[key]:
                            values[key].append(value)
                fld['metadata'] = {k: v[0] if len(v) == 1 else None for k, v in values.items()}
                fld['conflicts'] = {k: v for k, v in values.items() if len(v) > 1}
            obj['fields'].sort(key=lambda f: (f['metadata'].get('ordinal') or 10**9, f['name']))
        curation = read_json(self.config['curation_path'])
        for ref, labels in curation.get('object_labels', {}).items():
            if ref not in self.objects:
                raise ValueError('Curated object does not exist: ' + ref)
            self.objects[ref]['search_labels'] = labels
        for ref, semantics in curation.get('field_semantics', {}).items():
            matches = [f for obj in objects for f in obj['fields'] if f['field_ref'] == ref]
            if len(matches) != 1:
                raise ValueError('Curated field does not exist: ' + ref)
            matches[0]['semantic_annotation'] = semantics
        files = {}
        for name, content in [('objects.json', objects), ('sources.json', list(self.evidence.values())),
                              ('aggregates.json', self.aggregates), ('views.json', self.views),
                              ('curation.json', curation)]:
            write_json(output / name, content)
            files[name] = digest(output / name)
        counts = {s: dict(objects=len([o for o in objects if o['system_ref'] == s]),
                        fields=sum(len(o['fields']) for o in objects if o['system_ref'] == s))
                  for s in sorted({o['system_ref'] for o in objects})}
        manifest = dict(schema_version='gk-database-knowledge-v1',
            package_version=self.config['package_version'], status='prepared',
            created_at=dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).isoformat(),
            sharing_scope='local_restricted', business_rules_approved=False,
            current_database_verified=False, live_queries_enabled=False,
            contains_business_rows=False, contains_aggregate_statistics=bool(self.aggregates),
            contents='metadata and explicitly allowlisted numeric aggregates; no individual business records',
            baseline=self.config.get('baseline'), systems=counts, files=files,
            source_config_sha256=self.config['_config_sha256'],
            maintenance_note='No network, database drivers or connection configuration are used.')
        write_json(output / 'manifest.json', manifest)
        return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    output = Path(args.output).resolve()
    if output.exists():
        raise ValueError('Output already exists; use a new package directory')
    # Generated internal evidence must not enter the shared repository by accident.
    private = (Path(__file__).resolve().parent.parent / 'private').resolve()
    if not output.is_relative_to(private):
        raise ValueError('Output must be inside this repository private directory')
    config = read_json(args.config)
    config['_config_sha256'] = digest(args.config)
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.database-package-', dir=output.parent))
    try:
        manifest = Builder(config).finish(staging)
        staging.rename(output)
    except BaseException:
        shutil.rmtree(staging)
        raise
    print(json.dumps(dict(valid=True, package_version=manifest['package_version'],
                         systems=manifest['systems'], output=str(output)), ensure_ascii=False))


if __name__ == '__main__':
    main()
