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
	Field('ip'),
	Field('analysis_time', 'integer'),
	Field('format'),
	Field('browser_id', 'reference browsers'),
)

db.define_table('alerts',
	Field('submission_id', 'reference submissions'),
	Field('type'),
	Field('value')
)
