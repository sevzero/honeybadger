import datetime
import collections
import time
import hashlib
from payload_builder import Payload
import json
from threading import Thread
util = local_import('util')

VERSION = "v1.6"
AUTHOR = 'Russell Hole'
CONTACT = 'russell.hole+honeybadger@gmail.com'
WEBSITE = 'https://sevzero.github.io/honeybadger'

PRODUCTION = False
PROCESS_TIME = 10

def index():
	if PRODUCTION:
		return redirect(URL('submit'))
	return dict()

def submit():
	msg = ''
	if request.vars.sample:
		browser = request.vars.browser if request.vars.browser != '0' else None
		try:
			analysis_time = request.vars.analysis_time or 10
		except ValueError:
			return redirect(URL('submit'))
		if not request.vars.format in ['auto', 'js', 'html']:
			return redirect(URL('submit'))
		md5 = hashlib.md5(request.vars.sample).hexdigest()
		submission_id = db.submissions.insert(title=request.vars.title,
											  code=request.vars.sample,
											  state="queued",
											  submitted=datetime.datetime.now(),
											  md5=md5,
											  ip=request.client,
											  analysis_time=analysis_time,
											  format=request.vars.format,
											  browser_id=browser,
											  )
		return redirect(URL('wait', args=[md5,submission_id]))
	browsers = db(db.browsers.last_seen > datetime.datetime.now() - datetime.timedelta(minutes = 1)).select(db.browsers.ALL)
	return dict(browsers=browsers, util=util)

def wait():
	if not request.args:
		return redirect(URL('submit'))
	md5 = request.args[0]
	submission_id = request.args[1]
	return dict(submission_id=submission_id,md5=md5)

def history():
	response.title = 'Honeybadger - History'
	results = db(db.submissions.browser_id==db.browsers.id).select(db.submissions.ALL, db.browsers.ALL, orderby=~db.submissions.submitted, limitby=(0, 25))
	return dict(results=results, util=util)

def poll():
	if not request.vars:
		return dict(process_time=PROCESS_TIME)
	browser_hash = hashlib.md5(':'.join((request.vars.useragent,
							  request.vars.flash_version,
							  request.vars.java_version,
							  request.vars.adobe_version
							  ))).hexdigest()

	browser_id = db(db.browsers.hash==browser_hash).select(db.browsers.id).first()
	if not browser_id:
		browser_id = db.browsers.insert(hash=browser_hash,
							useragent=request.vars.useragent,
							flash_version=request.vars.flash_version,
							java_version=request.vars.java_version,
							adobe_version=request.vars.adobe_version,
							)
	db(db.browsers.id==browser_id).update(last_seen=datetime.datetime.now())
	return dict(process_time=PROCESS_TIME)

def analyse():
	def timeout(submission):
		time.sleep(5)
		db(db.submissions.id==result.id).update(completed=datetime.datetime.now(), state='completed')
	
	if not request.args:
		redirect(URL('poll'))
	response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
	response.headers['Pragma'] = "no-cache"
	result = db(db.submissions.id==request.args[0]).select(db.submissions.ALL).first()
	honeybadger_js = open('/'.join((request.folder, 'static', 'js', 'honeybadger.js'))).read()
	payload = Payload(result['id'], result['code'], PROCESS_TIME, result['format'], honeybadger_js)
	return payload.code

def done():
	db(db.submissions.id==request.args[0]).update(completed=datetime.datetime.now(), state='completed')
	return "ok"

def report():
	row = db(db.submissions.id==request.vars.submission_id).select(db.submissions.state).first()
	if row.state != 'processing':
		return
	if not request.vars.submission_id:
		return None
	submission_id = request.vars.submission_id
	if request.vars.type == 'alert':
		msg = request.vars.msg.replace(' ','+').decode('base64').split('^')
		db.alerts.insert(submission_id=submission_id, type=msg[0], value=''.join(msg[1:]))
	if request.vars.type == 'redirect':
		db.alerts.insert(submission_id=submission_id, type='Redirects', value=request.vars.msg)
		return 'Redirect Logged'
	return None

def checkforjobs():
	browser_hash = hashlib.md5(':'.join((request.vars.useragent,
							  request.vars.flash_version,
							  request.vars.java_version,
							  request.vars.adobe_version
							  ))).hexdigest()

	browser_id = db(db.browsers.hash==browser_hash).select(db.browsers.id).first()
	if not browser_id:
		browser_id = db.browsers.insert(hash=browser_hash,
							useragent=request.vars.useragent,
							flash_version=request.vars.flash_version,
							java_version=request.vars.java_version,
							adobe_version=request.vars.adobe_version,
							)
	db(db.browsers.id==browser_id).update(last_seen=datetime.datetime.now())
	job = db((db.submissions.state=='queued') & ((db.submissions.browser_id==browser_id) | (db.submissions.browser_id==None))).select(db.submissions.id, db.submissions.browser_id).first()
	if not job:
		return "cake"
	db(db.submissions.id==job['id']).update(started=datetime.datetime.now(), state='processing', browser_id=browser_id)
	return job['id']

def result():
	if not len(request.args) == 2:
		return redirect(URL('history'))
	submission = db((db.submissions.md5==request.args[0]) & (db.submissions.id==request.args[1]) & (db.submissions.browser_id==db.browsers.id)).select(db.submissions.ALL,db.browsers.ALL).first()
	messages = submission.submissions.alerts.select()
	tempdict = {}
	for m in messages:
		if m.type not in tempdict:
			tempdict[m.type] = []
		tempdict[m.type].append(m.value)
	messages = collections.OrderedDict(sorted(tempdict.items()))
	alerts = []
	variables = []
	if 'Alerts' in messages:
		alerts = messages['Alerts']
		del(messages['Alerts'])
	if 'Variables' in messages:
		variables = messages['Variables']
		del(messages['Variables'])
	identification = util.identify(messages);
	response.title = 'Honeybadger analysis - ' + (submission.submissions.title if submission.submissions.title else 'no title')
	response.meta.keywords = "javascript, analysis" + ', exploit kit, ' + identification if identification else ''
	response.meta.description = "Analysis of javascript sample (%s). Honeybadger is an automated JavaScript analysis engine designed to identify malicious indicators in obfuscated code." % submission.submissions.title

	return dict(submission=submission, messages=messages, alerts=set(alerts), variables=variables, identification=identification)

def about():
	return dict(version=VERSION, author=AUTHOR, contact=CONTACT, website=WEBSITE)

def check():
	if not request.args:
		return "ERROR: Please supply a submission id"
	submission_id = request.args[0]
	state = db(db.submissions.id==submission_id).select(db.submissions.state).first()['state']
	return state
