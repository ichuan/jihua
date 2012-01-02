#!/usr/bin/env python
# coding: utf-8
# yc@2011/11/21

import re
from datetime import datetime, timedelta
from django.utils.simplejson import JSONEncoder, dumps, loads

class MyJSONEncoder(JSONEncoder):
	'''支持序列化 datetime 类型和 ObjectId 类型的 json writter 以及 OrderedDict 类型'''
	def default(self, obj):
		ty = type(obj)
		if ty is datetime:
			return obj.strftime('%Y-%m-%d %H:%M:%S')
		else:
			return JSONEncoder.default(self, obj)

def date_range(s):
	'''从字串计算出时间范围，返回两个类似 '2011-10-10 11:22:33' 的字串'''
	if s in ('today', 'yesterday', 'week', 'lastweek', 'month'):
		n = now()
		if s == 'today':
			start = end = str(n.date())
		elif s == 'yesterday':
			start = end = str((n - timedelta(days=1)).date())
		elif s == 'week':
			start = str((n - timedelta(days=n.weekday() - 0)).date())
			end = str((n + timedelta(days=6 - n.weekday())).date())
		elif s == 'lastweek':
			start = str((n - timedelta(days=n.weekday() + 7)).date())
			end = str((n - timedelta(days=n.weekday() + 1)).date())
		elif s == 'month':
			start = '%s-%s-01' % (n.year, n.month)
			end = str(n.date())
		return plus_time(start, end)
	else:
		obj = re.match(r'^(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})$', s)
		if obj:
			start, end = obj.groups()
			if end > start:
				return plus_time(start, end)
	return False

def plus_time(i, j):
	return (i + ' 00:00:00', j + ' 23:59:59')

json_encode = lambda i:dumps(i, cls=MyJSONEncoder)
json_decode = lambda i:loads(i)
now = lambda :datetime.now()
