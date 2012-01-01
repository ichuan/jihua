# coding: utf-8

from django.db import models
from django.db.models import F
from django.contrib.auth.models import User

class TodoManager(models.Manager):
	def get_query_set(self):
		return super(TodoManager, self).get_query_set().filter(catlog='T')

class ActivityManager(models.Manager):
	def get_query_set(self):
		return super(ActivityManager, self).get_query_set().filter(catlog='A')

class TagManager(models.Manager):
	def incr_count(self, ids):
		self.filter(id__in=ids).update(counts=F('counts') + 1)

	def decr_count(self, ids, delete_isolate=True):
		self.filter(id__in=ids).update(counts=F('counts') - 1)
		if delete_isolate:
			self.filter(id__in=ids, counts__lte=0).delete()

	def decr_count_by_name(self, names, user, delete_isolate=True):
		self.filter(user=user, name__in=names).update(counts=F('counts') - 1)
		if delete_isolate:
			self.filter(user=user, counts__lte=0).delete()

class Tag(models.Model):
	'''Tag'''
	name = models.CharField(max_length=255, db_index=True, verbose_name=u'名称')
	user = models.ForeignKey(User, verbose_name=u'用户')
	counts = models.IntegerField(default=1, editable=False, verbose_name=u'计划数')
	objects = TagManager()

	def __unicode__(self):
		return u'%s (%d)' % (self.name, self.counts)

	def to_dict(self):
		return {
			'id': self.id,
			'name': self.name,
			'counts': self.counts,
		}

	class Meta:
		verbose_name_plural = verbose_name = u'标签'

class Todo(models.Model):
	'''TODO or Activity'''
	CATLOG_CHOICES = (
		('T', 'Todo'),
		('A', 'Activity'),
	)
	content = models.CharField(max_length=512, verbose_name=u'内容')
	user = models.ForeignKey(User, verbose_name=u'用户')
	done = models.BooleanField(default=False, verbose_name=u'是否完成')
	catlog = models.CharField(max_length=1, choices=CATLOG_CHOICES, verbose_name=u'分类')
	created = models.DateTimeField(auto_now_add=True, verbose_name=u'添加/修改日期', editable=False, db_index=True)
	tags = models.ManyToManyField(Tag, verbose_name=u'标签')

	todos = TodoManager()
	activities = ActivityManager()
	objects = models.Manager()

	def __unicode__(self):
		return self.content

	def to_dict(self):
		return {
			'id': self.id,
			'content': self.content,
			'done': self.done,
			'catlog': self.catlog,
			'created': self.created,
		}

	class Meta:
		ordering = ['-id']
		verbose_name_plural = verbose_name = u'计划'
