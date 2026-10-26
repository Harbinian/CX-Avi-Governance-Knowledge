#!/usr/bin/env python3
"""Exercise offline evidence boundaries using synthetic, owned temporary files."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location('dbbuilder', ROOT / 'scripts/build-database-knowledge.py')
MOD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MOD)
RESULTS = []


def passed(name):
    RESULTS.append(name)


def run(args, valid=True):
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, encoding='utf-8')
    if (result.returncode == 0) != valid:
        raise AssertionError(result.stdout + result.stderr)
    return json.loads(result.stdout if valid else result.stderr)


def rejects(fn, name):
    try:
        fn()
    except (ValueError, KeyError):
        passed(name)
        return
    raise AssertionError('Expected rejection: ' + name)


private = ROOT / 'private'
private.mkdir(exist_ok=True)
assert private.resolve().is_relative_to(ROOT.resolve())
with tempfile.TemporaryDirectory(prefix='database-knowledge-test-', dir=private) as temp:
    base = Path(temp).resolve()
    assert base.is_relative_to(private.resolve())
    xml = base / 'model.xml'
    xml.write_text('''<model>
<database id="1" name="Demo"/><database id="2" name="Other"/>
<schema id="3" parent="1" name="dbo"/><schema id="4" parent="2" name="dbo"/>
<table id="5" parent="3" name="Records"/><table id="6" parent="4" name="Records"/>
<column id="7" parent="5" name="Code"><Position>1</Position><StoredType>nvarchar(20 char)|0s</StoredType><NotNull>1</NotNull><DefaultExpression>SYNTHETIC_SECRET_VALUE_DO_NOT_EXPORT</DefaultExpression></column>
<column id="8" parent="5" name="Password"><Position>2</Position><StoredType>nvarchar(20 char)|0s</StoredType></column>
<column id="9" parent="6" name="WrongDatabase"><Position>1</Position><StoredType>int</StoredType></column>
</model>''', encoding='utf-8')
    curation = base / 'curation.json'
    MOD.write_json(curation, dict(business_objects=[],relations=[],object_labels={},field_semantics={}))
    config = dict(package_version='synthetic-1',curation_path=str(curation),_config_sha256='synthetic',
        sources=[dict(kind='datagrip_xml',evidence_ref='EV-CACHE',path=str(xml),
        targets=[dict(system_ref='demo',database='Demo',schema='dbo')])])
    pack = base / 'package';pack.mkdir()
    MOD.Builder(config).finish(pack)
    objects = MOD.read_json(pack / 'objects.json')
    assert len(objects)==1 and [f['name'] for f in objects[0]['fields']]==['Code','Password']
    passed('exact_database_and_schema_scope')
    assert 'SYNTHETIC_SECRET_VALUE_DO_NOT_EXPORT' not in (pack/'objects.json').read_text(encoding='utf-8')
    assert objects[0]['fields'][1]['metadata']['not_null_marked'] is False
    assert 'nullable' not in objects[0]['fields'][1]['metadata']
    passed('defaults_excluded_and_cache_nullability_preserved')
    cli = [ 'node',str(ROOT/'scripts/database-knowledge.cjs') ]
    assert run(cli+['check','--package',str(pack),'--verify-sources'])['valid']
    fields=run(cli+['query','--package',str(pack),'--kind','field'])
    assert fields['matched']==1 and fields['results'][0]['name']=='Code'
    passed('credential_structure_hidden_in_field_search')
    assert run(cli+['query','--package',str(pack),'--kind','field','--query','Records'])['matched']==0
    passed('object_context_alone_does_not_match_every_field')

    sql_dir=base/'sql';sql_dir.mkdir();sql=sql_dir/'query.sql'
    sql.write_text("SELECT o.name AS object_name, c.name AS column_name FROM sys.objects o WHERE o.schema_id = SCHEMA_ID(N'dbo')",encoding='utf-8')
    result=base/'metadata.json'
    MOD.write_json(result,[dict(object_name='Items',object_type='USER_TABLE',column_name='Name',data_type='nvarchar',max_length=40,is_nullable=False)])
    log=base/'queries.jsonl'
    entry=dict(query_id='Q1',database='Demo',started_at='2026-01-01T00:00:00+08:00',row_count=1,
               sql_sha256=MOD.digest(sql).upper(),parameter_names=['@Scope'],result_file='metadata.json')
    log.write_text(json.dumps(entry)+'\n',encoding='utf-8')
    source=dict(kind='query_log',evidence_ref='EV-LOG',path=str(log),sql_directory=str(sql_dir),result_root=str(base),
                database_systems={'Demo':'demo'},queries=[dict(query_id='Q1',evidence_ref='EV-Q1',role='metadata',schema='dbo')])
    b=MOD.Builder(config);b.query_source(source)
    item=next(iter(b.objects.values()))
    assert item['fields'][0]['observations'][0]['metadata']['max_length_bytes']==40
    assert b.evidence['EV-Q1']['parameter_values_recorded'] is False
    passed('sql_digest_relative_result_path_bytes_and_scope_gaps')
    broken=copy.deepcopy(entry);broken['sql_sha256']='0'*64
    log.write_text(json.dumps(broken)+'\n',encoding='utf-8')
    rejects(lambda:MOD.Builder(config).query_source(source),'changed_sql_digest_rejected')
    broken=copy.deepcopy(entry);broken['row_count']=2
    log.write_text(json.dumps(broken)+'\n',encoding='utf-8')
    rejects(lambda:MOD.Builder(config).query_source(source),'result_count_mismatch_rejected')
    log.write_text(json.dumps(entry)+'\n',encoding='utf-8')
    no_schema=copy.deepcopy(source);no_schema['queries'][0]['schema']=None
    b=MOD.Builder(config);b.query_source(no_schema)
    assert next(iter(b.objects.values()))['schema'] is None
    assert '~unresolved-schema' in next(iter(b.objects))
    passed('missing_schema_kept_unresolved')
    aggregates=copy.deepcopy(source);aggregates['queries']=[dict(query_id='Q1',evidence_ref='EV-Q1',role='aggregate',columns=['object_name','object_type','column_name','data_type','max_length','is_nullable'])]
    rejects(lambda:MOD.Builder(config).query_source(aggregates),'nonnumeric_aggregate_rejected')

    process=MOD.read_json(ROOT/'examples/demo-process-v8.json')
    data=process['data_objects'][0];field=data['fields'][0]
    item=next(i for f in process['forms'] for a in f['areas'] for i in a['items']
              if i['business_data_ref']==data['data_ref'] and i['data_field_ref']==field['field_ref'])
    item['value_usage_mode']='external_source';item['value_origin_mode']='depends_on_data'
    item['source_links']=[dict(source_link_ref='source_link_database_demo',source_type='external_system',
        source_data_ref=None,source_system_name='虚构系统',source_data_name='虚构记录',source_role='provides_value')]
    process_file=base/'process.json';MOD.write_json(process_file,process)
    assert run(['node',str(ROOT/'scripts/validate-process.cjs'),str(process_file),'--json'])['valid']
    passed('external_source_remains_native_v8')
    refs=dict(schema_version='gk-database-references-v1',package_version='synthetic-1',
        package_manifest_sha256=MOD.digest(pack/'manifest.json'),process_sha256=MOD.digest(process_file),
        mappings=[dict(process_data_ref=data['data_ref'],process_field_ref=field['field_ref'],
            database_object_ref=objects[0]['object_ref'],database_field_ref=objects[0]['fields'][0]['field_ref'],
            evidence_refs=['EV-CACHE'],mapping_status='pending_confirmation',confirmation_record=None)])
    refs_file=base/'references.json';MOD.write_json(refs_file,refs)
    check_args=cli+['check','--package',str(pack),'--references',str(refs_file),'--process',str(process_file)]
    assert run(check_args)['valid'];passed('process_to_database_field_reference_resolves')
    bad=copy.deepcopy(refs);bad['mappings'][0]['mapping_status']='user_confirmed_for_process'
    MOD.write_json(refs_file,bad);assert run(check_args,False)['valid'] is False
    passed('confirmation_without_record_rejected')
    bad=copy.deepcopy(refs);bad['mappings'][0]['database_field_ref']='gkdb:wrong'
    MOD.write_json(refs_file,bad);assert run(check_args,False)['valid'] is False
    passed('wrong_database_field_rejected')
    bad=copy.deepcopy(refs);bad['process_sha256']='0'*64
    MOD.write_json(refs_file,bad);assert run(check_args,False)['valid'] is False
    passed('changed_process_identity_rejected')
    unresolved_config=copy.deepcopy(config);unresolved_config['package_version']='synthetic-unresolved'
    unresolved_config['sources']=[no_schema]
    unresolved_pack=base/'unresolved';unresolved_pack.mkdir();MOD.Builder(unresolved_config).finish(unresolved_pack)
    unresolved_object=MOD.read_json(unresolved_pack/'objects.json')[0]
    bad=copy.deepcopy(refs);bad['package_version']='synthetic-unresolved';bad['package_manifest_sha256']=MOD.digest(unresolved_pack/'manifest.json')
    bad['mappings'][0]['database_object_ref']=unresolved_object['object_ref']
    bad['mappings'][0]['database_field_ref']=unresolved_object['fields'][0]['field_ref']
    bad['mappings'][0]['evidence_refs']=['EV-Q1'];MOD.write_json(refs_file,bad)
    assert run(cli+['check','--package',str(unresolved_pack),'--references',str(refs_file),'--process',str(process_file)],False)['valid'] is False
    passed('unresolved_schema_cannot_be_used_as_exact_mapping')
    config_file=base/'config.json';MOD.write_json(config_file,config)
    result_run=subprocess.run([sys.executable,str(ROOT/'scripts/build-database-knowledge.py'),'--config',str(config_file),'--output',str(pack)],capture_output=True,text=True,encoding='utf-8')
    assert result_run.returncode!=0 and 'already exists' in result_run.stderr
    passed('immutable_output_directory_enforced')
    original_manifest=MOD.read_json(pack/'manifest.json')
    notes=pack/'notes';notes.mkdir();note=notes/'reference.md'
    note.write_text('Synthetic reference only.\n',encoding='utf-8')
    supplemental=copy.deepcopy(original_manifest)
    supplemental['supplemental_files']={'notes\\reference.md':MOD.digest(note)}
    MOD.write_json(pack/'manifest.json',supplemental)
    assert run(cli+['check','--package',str(pack)])['supplemental_files_verified']==1
    passed('supplemental_nested_windows_paths_verified')
    note.write_text('Changed synthetic reference.\n',encoding='utf-8')
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('modified_supplemental_file_rejected')
    note.unlink()
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('missing_supplemental_file_rejected')
    note.write_text('Synthetic reference only.\n',encoding='utf-8')
    supplemental['supplemental_files']={'../model.xml':MOD.digest(xml)}
    MOD.write_json(pack/'manifest.json',supplemental)
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('supplemental_parent_path_rejected')
    supplemental['supplemental_files']={str(xml):MOD.digest(xml)}
    MOD.write_json(pack/'manifest.json',supplemental)
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('supplemental_absolute_path_rejected')
    supplemental['supplemental_files']={'notes/reference.md':MOD.digest(note),'notes\\reference.md':MOD.digest(note)}
    MOD.write_json(pack/'manifest.json',supplemental)
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('supplemental_separator_alias_duplicate_rejected')
    MOD.write_json(pack/'manifest.json',original_manifest)
    moved_xml=base/'original-source-unavailable.xml'
    xml.rename(moved_xml)
    assert run(cli+['check','--package',str(pack)])['valid']
    assert run(cli+['check','--package',str(pack),'--verify-sources'],False)['valid'] is False
    moved_xml.rename(xml)
    passed('recipient_check_without_original_sources_is_distinct')
    (pack/'objects.json').write_text('[]',encoding='utf-8')
    assert run(cli+['check','--package',str(pack)],False)['valid'] is False
    passed('modified_catalog_digest_rejected')

print(json.dumps(dict(valid=True,cases=len(RESULTS),checks=RESULTS,
                     synthetic_only=True,live_database_connections=0),ensure_ascii=False,indent=2))
