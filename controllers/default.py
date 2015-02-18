import datetime
import time
import hashlib
from payload_builder import Payload
import json
import util
from threading import Thread

VERSION = "v1.4"
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
		submission_id = db.submissions.insert(title=request.vars.title,
											  code=request.vars.sample,
											  state="queued",
											  submitted=datetime.datetime.now(),
											  md5=hashlib.md5(request.vars.sample).hexdigest(),
											  analysis_time=analysis_time,
											  format=request.vars.format,
											  browser_id=browser,
											  )

		return redirect(URL('wait', args=[submission_id]))
	browsers = db(db.browsers.last_seen > datetime.datetime.now() - datetime.timedelta(minutes = 1)).select(db.browsers.ALL)
	return dict(browsers=browsers, util=util)

def wait():
	if not request.args:
		return redirect(URL('submit'))
	submission_id = request.args[0]
	return dict(submission_id=submission_id)

def history():
	results = db(db.submissions.browser_id==db.browsers.id).select(db.submissions.ALL, db.browsers.ALL)
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
	#Thread(target=timeout, args=(result,)).start()
	return payload.code

def done():
	db(db.submissions.id==request.args[0]).update(completed=datetime.datetime.now(), state='completed')
	return "ok"

def report():
	if not request.vars.submission_id:
		return None
	submission_id = request.vars.submission_id
	msg = request.vars.msg.replace(' ','+').decode('base64')
	if request.vars.type == 'eval':
		db.evals.insert(submission_id=submission_id, code=msg)
	if request.vars.type == 'write':
		db.writes.insert(submission_id=submission_id, code=msg)
	if request.vars.type == 'dom':
		tag, html = [msg.split(':')[0], ':'.join(msg.split(':')[1:])]
		db.dom_changes.insert(submission_id=submission_id, type=tag, html=html)
	if request.vars.type == 'error':
		db.errors.insert(submission_id=submission_id, code=msg)
	if request.vars.type == 'var':
		name,value = msg.split(':')
		value = value.replace(' ','+').decode('base64')
		db.vars.insert(submission_id=submission_id, name=name, value=value)
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
	if not request.args:
		return redirect(URL('submit'))
	submission = db(db.submissions.id==request.args[0]).select(db.submissions.ALL,db.browsers.ALL).first()
	dom_changes = submission.submissions.dom_changes.select()
	changes = {}
	for change in dom_changes:
		if not change.type in changes:
			changes[change.type] = []
		changes[change.type].append(change.html)
	general = {
				'Writes' : submission.submissions.writes.select(),
				'evals' : submission.submissions.evals.select(),
				'Errors' : submission.submissions.errors.select(),
	}
	vars = []
	for var in submission.submissions.vars.select():
		vars.append((var.name,var.value))
	return dict(submission=submission, general=general, dom_changes=changes,variables=vars)

def about():
	return dict(version=VERSION, author=AUTHOR, contact=CONTACT, website=WEBSITE)

def check():
	if not request.args:
		return "ERROR: Please supply a submission id"
	submission_id = request.args[0]
	state = db(db.submissions.id==submission_id).select(db.submissions.state).first()['state']
	return state
