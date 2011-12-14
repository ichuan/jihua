#!/usr/bin/env python
# coding: utf-8

import base64
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.conf import settings
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.views.decorators.csrf import csrf_protect
from django.utils.translation import ugettext_lazy as _
from django.utils.html import escapejs
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from recaptcha.client import captcha
from utils import *
from forms import SignUpForm
import api.views as api
from todo.models import Todo
try:
	from collections import OrderedDict
except:
	from ordereddict import OrderedDict

def index(req):
	'''首页'''
	if not req.user.is_authenticated():
		return render_to_response('public.html', {}, context_instance=RequestContext(req))

	todos = api.todos(user=req.user, get={'range': 'today'})
	activities = api.activities(user=req.user)

	return render_to_response('index.html', {
		'search': True,
		'todos': base64.b64encode(json_encode(todos)),
		'activities': base64.b64encode(json_encode(activities)),
	}, context_instance=RequestContext(req))

def signup(req):
	'''注册'''
	if req.user.is_authenticated():
		return HttpResponseRedirect('/')
	captcha_ok = True
	if req.method == 'POST':
		form = SignUpForm(req.POST)
		if form.is_valid():
			# check reCAPTCHA
			challenge, response = req.POST.get('recaptcha_challenge_field', ''), req.POST.get('recaptcha_response_field', '')
			if challenge and response:
				ret = captcha.submit(challenge, response, settings.CAPTCHA_PRIVATE_KEY, req.META['REMOTE_ADDR'])
				if ret.is_valid:
					user = form.save()
					# hack for not using authenticate()
					user.backend = 'django.contrib.auth.backends.ModelBackend'
					login(req, user)
					return HttpResponseRedirect('/')
			captcha_ok = False
	else:
		form = SignUpForm()
	return render_to_response('signup.html', {
		'form': form,
		'captcha_ok': captcha_ok,
	}, context_instance=RequestContext(req))

def signout(req):
	logout(req)
	return HttpResponseRedirect('/')

@login_required
def tools(req):
	dates = date_range('week')
	todos = Todo.todos.filter(created__range=dates, user=req.user, done=True)
	ret = OrderedDict()
	weekdays = [_(u'周一'), _(u'周二'), _(u'周三'), _(u'周四'), _(u'周五'), _(u'周六'), _(u'周日')]
	for i in sorted(todos, key=lambda i:i.created):
		key = weekdays[i.created.weekday()]
		if not key in ret:
			ret[key] = []
		ret[key].append(i)
	mon, sun = week_boundary(now())

	return render_to_response('tools.html', {
		'todos': ret,
		'ranges': '%s ~ %s' % (str(mon.date()).replace('-', '/'), str(sun.date()).replace('-', '/')),
	}, context_instance=RequestContext(req))
