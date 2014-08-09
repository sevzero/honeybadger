#!/usr/bin/env python
# coding: utf8
from gluon import *
import re

class Payload:
	def __init__(self, submission_id, code, analysis_time, code_format, honeybadger_js):
		html_bootstrap_js = '''<meta http-equiv="refresh" content="%s;url=%s" />
		<script type="text/javascript">
			honeybadger_submission_id = "%d"
			honeybadger_reporting_url = "%s"
			%s
		</script>''' % (analysis_time, URL('done', args=[submission_id]), submission_id, URL('report'), honeybadger_js)
		if code_format == 'html' and '<head' in code:
			self.code = re.sub('< *head[^>]*>', '<head>' + html_bootstrap_js, code)
			return
		if (not '<script' in code and not '<html' in code) or code_format == 'js':
			self.code = '<html><head>' + html_bootstrap_js + '</head><body><script>'+code+'</script></body></html>'
			return
		if code.startswith('<script'):
			self.code = '<html><head>' + html_bootstrap_js + '</head><body>'+code+'</body></html>'
			return
		if '<head' in code:
			self.code = re.sub('< *head[^>]*>', '<head>' + html_bootstrap_js, code)
			return
		if '<html' in code:
			self.code = re.sub('< *html[^>]*>', '<html><head>' + html_bootstrap_js + '</head>', code)
			return
		self.code = code
