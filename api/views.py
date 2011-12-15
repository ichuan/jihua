# coding: utf-8

# python 代码调用 api 代码的参数必须为 api(method='GET', get={'query': 'test'}, post, user=user)
# get 为 request.GET, post 为 json_decode 后的 request.raw_post_data

import re
from django.http import HttpResponse, HttpRequest
from todo.models import Todo, Tag, User
from utils import json_encode, json_decode, now, date_range

PAGESIZE = 100
re_tags = ur'(#|＃)([^\1]+)\1'

def json_return(obj='', status=200):
	'''
	api 的 http 返回结果
	'''
	return HttpResponse(json_encode(obj), mimetype='application/json', status=status)

def api(func):
	def inner(*a, **b):
		raw = False
		method, get, post, user = None, None, None, None
		if len(a) > 0 and isinstance(a[0], HttpRequest):
			req = a[0]
			method = req.method
			get = req.GET
			user = req.user

			if not req.user.is_authenticated():
				return json_return(status=401)

			if not method in ('GET', 'POST', 'PUT', 'DELETE'):
				return json_return(status=501)

			if 'CONTENT_TYPE' in req.META and 'application/json' in req.META['CONTENT_TYPE']:
				try:
					post = json_decode(req.raw_post_data)
				except:
					return json_return(status=400)
		else:
			raw = True
			try:
				method, get, post, user = b.pop('method', None), b.pop('get', {}), b.pop('post', {}), b.pop('user')
			except:
				return -1
		try:
			ret = func(method, get, post, user, **b)
			return ret if raw else json_return(ret)
		except:
			return -1 if raw else json_return(status=500)
	return inner

@api
def test(method, get, post, user):
	return {
		'method': method,
		'GET': get,
		'POST': post,
		'user': user.username,
	}

@api
def todos(method, get, post, user):
	'''计划'''
	if 'page' in get:
		try:
			page = int(get['page'])
			assert page > 0
		except:
			pass
	else:
		page = 1

	qs = Todo.todos.filter(user=user)
	if 'range' in get:
		r = get['range']
		if r == 'undone':
			qs = qs.filter(done=False)
		else:
			dates = date_range(r)
			if not type(dates) is tuple:
				return []
			qs = qs.filter(created__range=dates)
	elif 'tag' in get:
		t = get['tag'].strip()
		if t:
			qs = Todo.objects.filter(tags__name=t, user=user)
		else:
			return []
	elif 'query' in get:
		t = get['query'].strip()
		if t:
			qs = Todo.objects.filter(content__contains=t, user=user)
		else:
			return []
	else:
		return []
	start = (page - 1) * PAGESIZE
	end = start + PAGESIZE
	return [i.to_dict() for i in qs[start:end]]

@api
def tags(method, get, post, user):
	'''所有标签'''
	return [i.to_dict() for i in Tag.objects.filter(user=user)]

@api
def activities(method, get, post, user):
	'''活动清单'''
	return [i.to_dict() for i in Todo.activities.filter(user=user)]

@api
def create_todo(method, get, post, user):
	'''创建todo'''
	assert method == 'POST'
	content = post['content'].strip()
	return _create_todo(content, user, 'T')

@api
def single_todo(method, get, post, user, id):
	'''todo 修改/删除'''
	id = int(id)
	assert method in ('PUT', 'DELETE')
	todo = Todo.todos.get(pk=id, user=user)
	if method == 'PUT':
		_modify_todo(todo, post['content'].strip(), user, bool(post['done']))
	elif method == 'DELETE':
		_delete_todo(todo)

@api
def todo_to_activity(method, get, post, user, id):
	'''todo 转 activity'''
	id = int(id)
	assert method == 'PUT'
	Todo.todos.filter(id=id, user=user).update(done=False, catlog='A')

@api
def create_activity(method, get, post, user):
	'''创建activity'''
	assert method == 'POST'
	content = post['content'].strip()
	return _create_todo(content, user, 'A')

@api
def single_activity(method, get, post, user, id):
	'''activity 修改/删除'''
	id = int(id)
	assert method in ('PUT', 'DELETE')
	todo = Todo.activities.get(pk=id, user=user)
	if method == 'PUT':
		_modify_todo(todo, post['content'].strip(), user, bool(post['done']))
	elif method == 'DELETE':
		_delete_todo(todo)

@api
def activity_to_todo(method, get, post, user, id):
	'''activity 转 todo'''
	id = int(id)
	assert method == 'PUT'
	Todo.activities.filter(id=id, user=user).update(done=False, catlog='T', created=now())

@api
def invalid_api(method, get, post, user):
	return 'Invalid API'

def _create_todo(content, user, catlog):
	assert content
	manager = Todo.todos if catlog == 'T' else Todo.activities
	todo = manager.create(content=content, user=user, catlog=catlog)
	existing_tagids = []
	tags = []
	for i in set(i[1] for i in re.findall(re_tags, content)):
		obj, created = Tag.objects.get_or_create(user=user, name=i)
		tags.append(obj)
		if not created:
			existing_tagids.append(obj.id)
	if tags:
		todo.tags.add(*tags)
	if existing_tagids:
		Tag.objects.incr_count(existing_tagids)
	return todo.to_dict()

def _modify_todo(todo, content, user, done):
	assert content
	old_tags = set(i[1] for i in re.findall(re_tags, todo.content))
	new_tags = set(i[1] for i in re.findall(re_tags, content))

	todo.content = content
	todo.done = done
	todo.save()

	existing_tagids = []
	tags = []
	for i in (new_tags - old_tags):
		obj, created = Tag.objects.get_or_create(user=user, name=i)
		tags.append(obj)
		if not created:
			existing_tagids.append(obj.id)
	if tags:
		todo.tags.add(*tags)
	if existing_tagids:
		Tag.objects.incr_count(existing_tagids)

	tags_to_decr = old_tags - new_tags
	if tags_to_decr:
		tags = Tag.objects.filter(user=user, name__in=tags_to_decr)
		ids = [i.id for i in tags]
		todo.tags.remove(*tags)
		Tag.objects.decr_count(ids)

def _delete_todo(todo):
	tag_ids = [i.id for i in todo.tags.all()]
	todo.delete()
	if tag_ids:
		Tag.objects.decr_count(tag_ids)
