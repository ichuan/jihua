# coding: utf-8

from django.conf import settings
from django.utils.translation import ugettext_lazy as _
from django.conf.urls.defaults import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^$', 'jihua.views.index'),
    (r'^signup/$', 'jihua.views.signup'),
    (r'^signin/$', 'django.contrib.auth.views.login', {'template_name': 'signin.html'}),
    (r'^signout/$', 'jihua.views.signout'),
    (r'^help/$', 'django.views.generic.simple.direct_to_template', {'template': 'help.html'}),
    (r'^changelog/$', 'django.views.generic.simple.direct_to_template', {'template': 'changelog.html'}),
    (r'^tools/$', 'jihua.views.tools'),
    (r'^report/$', 'jihua.views.report'),
    (r'^change_passwd/$', 'django.contrib.auth.views.password_change', {
		'template_name': 'change_passwd.html',
		'post_change_redirect': '/',
	}),
    (r'^reset_passwd/$', 'django.contrib.auth.views.password_reset', {
		'template_name': 'reset_passwd.html',
		'email_template_name': 'reset_passwd_email.html',
		'post_reset_redirect': '/reset_done/',
		'from_email': 'noreply@jihua.in',
	}),
    (r'^reset_confirm/(?P<uidb36>[0-9A-Za-z]{1,13})-(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$', \
		'django.contrib.auth.views.password_reset_confirm', {
			'template_name': 'reset_confirm.html',
			'post_reset_redirect': '/signin/',
		}
	),
    (r'^reset_done/$', 'django.views.generic.simple.direct_to_template', {'template': 'message.html', 'extra_context': {
		'msg': _(u'我们已将一封包含恢复密码步骤的邮件发到了您的邮箱，请查收'),
	}}),

    url(r'^api/', include('jihua.api.urls')),
    url(r'^admin/', include(admin.site.urls)),

	(r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT,}), # TODO 用nginx配置代替
)
