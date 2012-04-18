#!/usr/bin/env python
# coding: utf-8

# 数据库信息
DATABASES = {
	'default': {
		'ENGINE': 'django.db.backends.mysql', # mysql 可以改成 'postgresql_psycopg2', 'postgresql', 'sqlite3' or 'oracle'.
		'NAME': 'jihua',					  # 数据库名
		'USER': 'root',					  # sqlite3 不使用此配置
		'PASSWORD': 'root',				  # sqlite3 不使用此配置
		'HOST': '',
		'PORT': '',
	}
}

# 管理员邮箱
ADMINS = (
	('yc', 'iyanchuan@gmail.com'),
)

# google 统计的 id
GA_ID = 'UA-0-1'

# reCAPTCHA
# 去 http://www.google.com/recaptcha/whyrecaptcha 申请 KEY
# 如果需要关闭验证码功能，请将下面两个变量置空
CAPTCHA_PUBLIC_KEY = 'CAPTCHA_PUBLIC_KEY'
CAPTCHA_PRIVATE_KEY = 'CAPTCHA_PRIVATE_KEY'

# LDAP 认证需要设置的参数；开启 LDAP 认证需要取消 AUTHENTICATION_BACKENDS 中的注释
# ubuntu 下需要 apt-get install libldap2-dev libsasl2-dev，然后安装 python-ldap
LDAP_SERVER_URI = 'ldap://ldap.test.com'
LDAP_USER_DN_TEMPLATE = 'uid=%s,ou=users,dc=example,dc=com'
AUTHENTICATION_BACKENDS = (
	#'ldap_backend.LDAPBackend',
	'django.contrib.auth.backends.ModelBackend',
)
