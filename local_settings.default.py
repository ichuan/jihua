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
CAPTCHA_PUBLIC_KEY = 'CAPTCHA_PUBLIC_KEY'
CAPTCHA_PRIVATE_KEY = 'CAPTCHA_PRIVATE_KEY'
