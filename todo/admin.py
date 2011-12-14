#!/usr/bin/env python
# coding: utf-8

from django import forms
from django.contrib import admin
from models import Tag, Todo

class TagAdmin(admin.ModelAdmin):
	list_display = ['name', 'counts']

class TodoAdmin(admin.ModelAdmin):
	list_display = ['content', 'user', 'created', 'done', 'catlog']
	list_filter = ['user', 'catlog', 'done']

admin.site.register(Tag, TagAdmin)
admin.site.register(Todo, TodoAdmin)
