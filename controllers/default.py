import datetime
import time
import hashlib
from payload_builder import Payload
import json
import util
from threading import Thread

VERSION = "v1.2"
AUTHOR = 'Russell Hole'
CONTACT = 'russell.hole+honeybadger@gmail.com'
WEBSITE = 'https://github.com/sevzero/honeybadger'

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
	payload = Payload(result['id'], result['code'], result['analysis_time'], result['format'], honeybadger_js)
	#Thread(target=timeout, args=(result,)).start()
	return payload.code

def done():
	db(db.submissions.id==request.args[0]).update(completed=datetime.datetime.now(), state='completed')
	return "ok"

def report():
	if not request.vars.submission_id:
		return None
	submission_id = request.vars.submission_id
	if request.vars.type == 'eval':
		db.evals.insert(submission_id=submission_id, code=request.vars.msg)
	if request.vars.type == 'write':
		db.writes.insert(submission_id=submission_id, code=request.vars.msg)
	if request.vars.type == 'dom':
		tag, html = [request.vars.msg.split(':')[0], ':'.join(request.vars.msg.split(':')[1:])]
		db.dom_changes.insert(submission_id=submission_id, type=tag, html=html)
	if request.vars.type == 'error':
		db.errors.insert(submission_id=submission_id, error=request.vars.msg)
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
	evals = [i['code'] for i in db(db.evals.submission_id==request.args[0]).select(db.evals.ALL)]
	writes = [i['code'] for i in db(db.writes.submission_id==request.args[0]).select(db.writes.ALL)]
	result = db(db.dom_changes.submission_id==request.args[0]).select(db.dom_changes.ALL)
	errors = [i['error'] for i in db(db.errors.submission_id==request.args[0]).select(db.errors.ALL)]
	dom_changes = {}
	scripts=objects=iframes = []
	for row in result:
		print row
		tag = row['type']
		if not tag in dom_changes:
			dom_changes[tag] = []
		dom_changes[tag].append(row['html'])
	if 'SCRIPT' in dom_changes:
		scripts = dom_changes['SCRIPT']
		del(dom_changes['SCRIPT'])
	if 'IFRAME' in dom_changes:
		iframes = dom_changes['IFRAME']
		del(dom_changes['IFRAME'])
	if 'OBJECT' in dom_changes:
		objects = dom_changes['OBJECT']
		del(dom_changes['OBJECT'])
	if 'APPLET' in dom_changes:
		objects = dom_changes['APPLET']
		del(dom_changes['APPLET'])
	return dict(submission=submission, result=(('scripts',scripts),('evals',evals),('writes',writes),('iframes',iframes),('objects',objects),('errors',errors)))

def about():
	return dict(version=VERSION, author=AUTHOR, contact=CONTACT, website=WEBSITE)

def check():
	if not request.args:
		return "ERROR: Please supply a submission id"
	submission_id = request.args[0]
	state = db(db.submissions.id==submission_id).select(db.submissions.state).first()['state']
	return state
