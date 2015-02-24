db = DAL("sqlite://storage.sqlite")

db.define_table('browsers',
	Field('hash'),
	Field('useragent'),
	Field('java_version'),
	Field('flash_version'),
	Field('adobe_version'),
	Field('last_seen', 'datetime'),
)

db.define_table('submissions',
	Field('title'),
	Field('code'),
	Field('state'),
	Field('submitted', 'datetime'),
	Field('started', 'datetime'),
	Field('completed', 'datetime'),
	Field('md5'),
	Field('analysis_time', 'integer'),
	Field('format'),
	Field('browser_id', 'reference browsers'),
)

db.define_table('alerts',
	Field('submission_id', 'reference submissions'),
	Field('alert'),
)

db.define_table('dom_changes',
	Field('submission_id', 'reference submissions'),
	Field('type'),
	Field('html')
)

db.define_table('evals',
	Field('submission_id', 'reference submissions'),
	Field('code')
)

db.define_table('writes',
	Field('submission_id', 'reference submissions'),
	Field('code')
)

db.define_table('scripts',
	Field('submission_id', 'reference submissions'),
	Field('code')
)

db.define_table('errors',
	Field('submission_id', 'reference submissions'),
	Field('code')
)

db.define_table('vars',
	Field('submission_id', 'reference submissions'),
	Field('name'),
	Field('value'),
)
