#!/usr/bin/env python
# coding: utf-8
# yc@2011/11/23

from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('api.views',
	# Example
	(r'^test/$', 'test'),

	(r'^todos/$', 'todos'),
	(r'^tags/$', 'tags'),
	(r'^activities/$', 'activities'),

	(r'^todo/$', 'create_todo'),
	(r'^todo/(?P<id>\d+)/$', 'single_todo'),
	(r'^todo/(?P<id>\d+)/activity/$', 'todo_to_activity'),

	(r'^activity/$', 'create_activity'),
	(r'^activity/(?P<id>\d+)/$', 'single_activity'),
	(r'^activity/(?P<id>\d+)/todo/$', 'activity_to_todo'),

	(r'^(.+)$', 'invalid_api'),
)
