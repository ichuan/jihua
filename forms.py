#!/usr/bin/env python
# coding: utf-8
# yc@2011/11/24

from django import forms
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class SignUpForm(UserCreationForm):
	'''
	在 UserCreationForm 基础上加入了 email
	'''
	email = forms.EmailField()

	def clean_email(self):
		email = self.cleaned_data["email"]
		try:
			User.objects.get(email=email)
		except User.DoesNotExist:
			return email
		raise forms.ValidationError(_(u'此邮件地址已被其他人使用'))

	def save(self, commit=True):
		user = super(SignUpForm, self).save(commit=False)
		user.email = self.cleaned_data['email']
		if commit:
			user.save()
		return user
