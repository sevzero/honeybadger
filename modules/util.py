#!/usr/bin/env python
# coding: utf8
from gluon import *
import re

def identifyBrowser(useragent):
	return {'os': _getOs(useragent), 'browser': _getBrowser(useragent)}

def _getOs(useragent):
	if 'Windows' in useragent:
		if 'Windows NT 5.1' in useragent or 'Windows XP' in useragent:
			return 'WindowsXP'
		if 'Windows NT 6.0' in useragent:
			return 'WindowsVista'
		if 'Windows NT 6.1' in useragent:
			return 'Windows7'
		if 'Windows NT 6.2' in useragent:
			return 'Windows8'
		return 'Windows'
	if 'Android' in useragent:
		return 'Android'
	if 'Linux' in useragent:
		return 'Linux'
	return 'Unknown'

def _getBrowser(useragent):
	if 'MSIE 6' in useragent:
		return 'IE6'
	if 'MSIE 7' in useragent:
		return 'IE7'
	if 'MSIE 8' in useragent:
		return 'IE8'
	if 'MSIE 9' in useragent:
		return 'IE9'
	if 'MSIE 10' in useragent:
		return 'IE10'
	if 'Opera' in useragent or 'OPR/' in useragent:
		return 'Opera'
	if 'Firefox' in useragent:
		return 'Firefox'
	if 'Chrome' in useragent:
		return 'Chrome'
	return 'Unknown'
