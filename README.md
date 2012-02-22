介绍
----

一个做日常计划的工具网站，使用 `backbone.js` 和 `django` 开发。演示：[jihua.in][1]。以下摘自 [jihua.in 的帮助页面][2]：

> 这是一个帮助你记录、管理日常计划的小工具。计划不易做得太长远，所以我们只专注于做最近几天的计划，尤其是今日计划。我们的目标是做一个简单好用的工作计划表。

详细的设计参见 `doc/design.mm` 思维导图。

依赖
----

1. recaptcha-client: `http://pypi.python.org/pypi/recaptcha-client`
2. django >= 1.3
3. python2.7 以下需要 ordereddict: `http://pypi.python.org/pypi/ordereddict`
4. 如果需要压缩 js 和 css，需要 java 环境和 yui 压缩器：`http://yui.zenfs.com/releases/yuicompressor/yuicompressor-2.4.7.zip` 详见 `bin/min.sh`

安装步骤
--------

1. 创建数据库，例如 mysql 数据库：`$ mysql -u root -proot -e 'create database jihua'`
2. 拷贝 `local_settings.default.py` 为 `local_settings.py`，修改里面的数据库配置。还有其他配置可以改
3. 执行 `python manage.py syncdb` 同步数据库
4. 执行 `python manage.py runserver 0.0.0.0:8000` 启动临时服务器
5. 浏览器访问 `http://localhost:8000`，后台地址是 `http://localhost:8000/admin/`，口令在第 `3` 步时创建
6. 在后台的`sites`里更改默认的`example.com`为你自己的域名（找回密码时发邮件需要此设置）

贡献代码
-------

目前有些非紧急的功能有待实现（时区设置，数据导出，etc），欢迎 fork 此项目，然后贡献代码。

API 文档
---------
[API 文档1.0][3]

[1]: https://jihua.in/
[2]: https://jihua.in/help/
[3]: https://github.com/ichuan/jihua/wiki/API%E6%96%87%E6%A1%A31.0

