// jihua.js
// yc@2011/11/21

!function($){
	var API_ROOT = '/api',
		E = {},
		tpls = {
			activity: '<div class="op"><div class="arrow"></div><div title="编辑" class="edit"></div><div title="删除" class="del"></div><div title="放入今日计划" class="a2t"></div><div title="添加于 <%= created %>" class="timestamp" data-timestamp="<%= timestamp %>"></div></div><div class="activity"><%= content %></div>',
			todo: '<div class="op"><div class="arrow"></div><div title="编辑" class="edit"></div><div title="删除" class="del"></div><div title="放回活动清单" class="t2a"></div><div title="添加于 <%= created %>" class="timestamp" data-timestamp="<%= timestamp %>"></div></div><div class="checkbox">&#x2713;</div><div class="todo"><%= content %></div>',
			today: '<div class="clearfix"><input class="span-new" id="new-todo" placeholder="输入计划，回车保存"><button id="submit-todo" data-loading-text="添加中..." class="btn primary">添加</button></div><ul class="todos"></ul>',
			activities: '<div class="clearfix"><input class="span-new" id="new-activity" placeholder="输入活动，回车保存"><button id="submit-activity" data-loading-text="添加中..." class="btn primary">添加</button></div><ul class="activities"></ul>',
			tab_item: '<li><a class="plus" href="#!/<%- name %>">搜索结果</a></li>',
			common: '<div class="clearfix"><h4><%- title %></h4></div><ul class="todos"></ul>',
			loading: '<div class="loading more"></div>',
			modal: '<div class="modal-header"><a href="#" class="close">&times;</a><h3><%= title %></h3></div><div class="modal-body"><%= body %></div><div class="modal-footer"><a href="#" class="btn ok <%= btn1_class %>"><%= btn1 %></a><a href="#" class="btn cancel <%= btn2_class %>"><%= btn2 %></a></div>'
		},
		tagColorClass = function(tag){
			var ret = 0;
			for (var i = 0, j = tag.length; i < j; i++)
				ret += tag.charCodeAt(i);
			return 'cl' + (ret % 30);
		},
		gotoPage = function(page){
			page && (page = '!/' + page);
			Backbone.history.navigate(page, true);
		},
		pad0 = function(num, len){
			var a = '' + num;
			if (a.length >= len)
				return a;
			for (var i = 0, j = len - a.length; i < j; i++)
				a = '0' + a;
			return a;
		},
		PAGESIZE = 100;

	// parse string like: 2011-11-11 22:11:22
	Date.fromString = function(date_str){
		var res = /(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/.exec(date_str);
		if (!res)
			return false;
		var year = parseInt(res[1], 10),
			month = parseInt(res[2], 10) - 1,
			day = parseInt(res[3], 10),
			hour = parseInt(res[4], 10),
			minute = parseInt(res[5], 10),
			second = parseInt(res[6], 10);
		return new Date(year, month, day, hour, minute, second);
	};

	window.humanizeDate = function(d2){
		var d1 = now(), d2 = Date.fromString(d2), sep = (d1 - d2) / 1000, tts = todayts(), days = parseInt((tts - d2) / 86400000, 10);
		if (d2 >= tts){
			if (sep > 3600)
				return '' + parseInt(sep / 3600, 10) + ' 小时前';
			else if (sep > 1800)
				return '半小时前';
			else if (sep > 60)
				return '' + parseInt(sep / 60, 10) + ' 分钟前';
			else
				return '刚刚';
		} else if (days >= 0 && days < 7) {
			if (days == 0)
				return '昨天 ' + pad0(d2.getHours(), 2) + ':' + pad0(d2.getMinutes(), 2);
			else if (days == 1)
				return '前天 ' + pad0(d2.getHours(), 2) + ':' + pad0(d2.getMinutes(), 2);
			else
				return '' + (days + 1) + ' 天前';
		} else{
			return d2.getFullYear() + '/' + (d2.getMonth() + 1) + '/' + d2.getDate() + ' ' + pad0(d2.getHours(), 2) + ':' + pad0(d2.getMinutes(), 2) + ':' + pad0(d2.getSeconds(), 2);
		}
	};

	_.extend(E, Backbone.Events);

	var Todo = Backbone.Model.extend({
		defaults: {
			'catlog': 'T',
			'done': false
		},
		validate: function(attrs){
			if (attrs.content !== undefined && !$.trim(attrs.content))
				return 'error';
		},
		url: function(){
			var model = this.get('catlog') == 'T' ? 'todo' : 'activity';
			var url = API_ROOT + '/' + model + '/';
			if (!this.isNew())
				return url + this.id + '/';
			return url;
		},
		convert: function(callback){
			return Backbone.sync.call(this, 'update', this, {
				url: this.url() + (this.get('catlog') == 'T' ? 'activity' : 'todo') + '/',
				complete: callback
			});
		}
	});

	var Activity = Todo.extend({
		defaults: {
			'catlog': 'A',
			'done': false
		}
	});

	var Tag = Backbone.Model.extend({});

	var Activities = Backbone.Collection.extend({
		model: Activity,
		url: API_ROOT + '/activities/',
		comparator: function(activity){
			return activity.get('id');
		}
	});

	var Todos = Activities.extend({
		model: Todo,
		url: API_ROOT + '/todos/',
		comparator: function(todo){
			// undone first, id desc
			var plus = todo.get('done') ? 999999999 : 0;
			return plus - parseInt(todo.get('id'), 10);
		}
	});

	var Tags = Backbone.Collection.extend({
		model: Tag,
		url: API_ROOT + '/tags/'
	});

	var ActivityRow = Backbone.View.extend({
		tagName: 'li',
		template: _.template(tpls.activity),
		events: {
			'hover': 'hover',
			'hover .op': 'hoverOp',
			'click .edit': 'edit',
			'click .del': 'del',
			'click .a2t': 'convert',
			'click .label': 'showTag'
		},
		initialize: function(){
			_.bindAll(this, 'render', 'remove');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
			$(this.el).attr('data-aid', this.model.id);
			this.render();
		},
		hover: function(event){
			var el = $(this.el), func = event.type == 'mouseenter' ? 'addClass' : 'removeClass';
			el[func]('hover');
			$('.selected').removeClass('selected');
		},
		hoverOp: function(event){
			var el = $(this.el).find('.op'), func = event.type == 'mouseenter' ? 'addClass' : 'removeClass';
			el[func]('hover');
		},
		edit: function(){
			var model = this.model, popup = new EditModalView;
			popup.val(model.get('content'));
			popup.setCallback(function(){
				popup.loading();
				var ret = model.save({content: popup.val()}, {complete: function(xhr, status){
					popup.reset();
					if (status == 'success')
						popup.hide();	
					else
						popup.error();
				}});
				if (ret === false){
					popup.reset();
					popup.error();
				}
			}).fire();
			return false;
		},
		del: function(){
			var model = this.model, popup = new DelModalView;;
			popup.setCallback(function(){
				popup.loading();
				model.destroy({success: function(){
					popup.hide();
				}});
			}).fire();
			return false;
		},
		showTag: function(e){
			var tag = $(e.target).text();
			gotoPage('tag/' + tag);
		},
		convert: function(){
			var el = $(this.el), model = this.model, that = this, isTodo = model.get('catlog') == 'T',
				toClass = isTodo ? Activity : Todo, fireEvent = isTodo ? 'newActivity' : 'newTodo';
			el.addClass('moving');
			model.convert(function(xhr, status){
				el.removeClass('moving');
				if (status == 'success'){
					var m = new toClass(model.attributes);
					m.set({catlog: isTodo ? 'A' : 'T', done: false})
					that.remove();
					E.trigger(fireEvent, m);
					if (fireEvent === 'newTodo')
						E.trigger('removeActivity', model);
				}
			});
			return false;
		},
		htmlContent: function(text){
			text || (text = this.model.get('content'));
			return text.replace(/&/g, '&amp;')
					   .replace(/</g, '&lt;')
					   .replace(/>/g, '&gt;')
					   .replace(/(#|＃)([^\1]+?)\1/g, function(hash){
				var t = hash.substr(1, hash.length - 2);
				return '<span class="label ' + tagColorClass(t) + '">' + t + '</span>';
			});
		},
		render: function(){
			$(this.el).html(this.template({
				created: humanizeDate(this.model.get('created')),
				timestamp: this.model.get('created'),
				content: this.htmlContent()
			})).find('.op [title]').twipsy({animate: false});
			return this;
		}
	});

	var TodoRow = ActivityRow.extend({
		template: _.template(tpls.todo),
		events: {
			'hover': 'hover',
			'hover .op': 'hoverOp',
			'click .edit': 'edit',
			'click .del': 'del',
			'click .t2a': 'convert',
			'click .label': 'showTag',
			'click .checkbox': 'check'
		},
		check: function(){
			var el = $(this.el), m = this.model, done = !!!m.get('done');
			if (el.hasClass('moving'))
				return;
			m.set({done: done});
			el.addClass('moving');
			m.save(null, {
				success: function(){
					el.removeClass('moving');
				}
			});
		},
		render: function(){
			var el = $(this.el)[this.model.get('done') ? 'addClass' : 'removeClass']('done');
			el.html(this.template({
				created: humanizeDate(this.model.get('created')),
				timestamp: this.model.get('created'),
				content: this.htmlContent()
			})).find('.op [title]').twipsy({animate: false});
			return this;
		}
	});

	var TodayView = Backbone.View.extend({
		template: tpls.today,
		events: {
			'click #submit-todo': 'doSubmit',
			'keydown #new-todo': 'testReturn',
			'blur #new-todo': 'clearState'
		},
		initialize: function(){
			this.page = 1;
			var container = $('#main .todo-data:eq(0)');
			container.append(this.el).append(tpls.loading);
			_.bindAll(this, 'addTodo', 'render', 'nextPage');
			E.bind('newTodo', this.addTodo);
			E.bind('scrollEnd', this.nextPage);
			this.todos = new Todos;
			this.todos.bind('add', this.addTodo);
			this.todos.bind('reset', this.render);
			if (window.initTodos){
				if (window.initTodos.length < PAGESIZE)
					this.disablePaging();
				this.todos.reset(window.initTodos);
				window.initTodos = null;
			} else {
				container.addClass('loading');
				var me = this;
				this.todos.fetch({
					success: function(coll, resp){
						if (resp.length < PAGESIZE)
							me.disablePaging();
						container.removeClass('loading');
					},
					data: {range: 'today'}
				});
			}
		},
		disablePaging: function(){
			E.unbind('scrollEnd', this.nextPage);
			$(this.el).next().remove();
		},
		clearState: function(){
			this.$('#new-todo').removeClass('inputerror');
		},
		testReturn: function(e){
			if (e.keyCode == 13)
				this.doSubmit();
			else if (e.keyCode == 27)
				this.$('#new-todo').blur();
		},
		doSubmit: function(){
			var input = this.$('#new-todo'), btn = this.$('#submit-todo');
			input.attr('disabled', 'disabled');
			btn.button('loading');
			var todo = new Todo;
			todo.save({content: input.val()}, {
				success: function(model){
					input.attr('disabled', false).removeClass('inputerror').val('');
					btn.button('reset');
					E.trigger('newTodo', model);
				},
				error: function(){
					btn.button('reset');
					input.attr('disabled', false).addClass('inputerror');
				}
			});
		},
		addTodo: function(todo){
			var ul = this.$('.todos'), row = new TodoRow({model: todo}), more = $(this.el).next();
			ul[more.hasClass('ing') ? 'append' : 'prepend'](row.el);
		},
		remove: function(){
			E.unbind('newTodo', this.addTodo);
			this.disablePaging();
			return Backbone.View.prototype.remove.call(this);
		},
		nextPage: function(){
			var more = $(this.el).next();
			if (more.hasClass('ing'))
				return;
			more.addClass('ing');
			this.page += 1;
			var me = this;
			this.todos.fetch({
				success: function(coll, resp){
					if (resp.length < PAGESIZE)
						me.disablePaging();
					more.removeClass('ing');
				},
				data: {range: 'today', page: this.page},
				add: true
			});
		},
		render: function(){
			var ul = $(this.el).html(this.template).find('.todos');
			this.todos.each(function(todo){
				var row = new TodoRow({model: todo});
				ul.append(row.el);
			});
		}
	});

	var CommonView = Backbone.View.extend({
		tagName: 'ul',
		className: 'todos',
		initialize: function(){
			this.page = 1;
			var container = $('#main .todo-data:eq(0)');
			container.append(this.el).append(tpls.loading);
			_.bindAll(this, 'render', 'nextPage', 'addItem');
			E.bind('scrollEnd', this.nextPage);
			this.todos = new Todos;
			this.todos.bind('add', this.addItem);
			this.todos.bind('reset', this.render);
			container.addClass('loading');
			var params = this.options.params, me = this;
			this.todos.fetch({
				success: function(coll, resp){
					if (resp.length < PAGESIZE)
						me.disablePaging();
					container.removeClass('loading');
				},
				data: params
			});
		},
		addItem: function(todo){
			var cls = todo.get('catlog') == 'T' ? TodoRow : ActivityRow;
			var row = new cls({model: todo});
			this.ul.append(row.el);
		},
		remove: function(){
			this.disablePaging();
			return Backbone.View.prototype.remove.call(this);
		},
		disablePaging: function(){
			E.unbind('scrollEnd', this.nextPage);
			$(this.el).next().remove();
		},
		nextPage: function(){
			var more = $(this.el).next();
			if (more.hasClass('ing'))
				return;
			more.addClass('ing');
			this.page += 1;
			var params = this.options.params, me = this;
			params.page = this.page;
			this.todos.fetch({
				success: function(coll, resp){
					if (resp.length < PAGESIZE)
						me.disablePaging();
					more.removeClass('ing');
				},
				data: params,
				add: true
			});
		},
		render: function(){
			this.ul = $(this.el);
			this.todos.each(this.addItem);
		}
	});

	var TitledCommonView = CommonView.extend({
		tagName: 'div',
		template: _.template(tpls.common),
		render: function(){
			this.ul = $(this.el).append(this.template({title: this.options.title})).find('.todos');
			this.todos.each(this.addItem);
		}
	});

	var ActivityView = Backbone.View.extend({
		tagName: 'div',
		className: 'todo-data',
		template: tpls.activities,
		events: {
			'click #submit-activity': 'doSubmit',
			'keydown #new-activity': 'testReturn',
			'blur #new-activity': 'clearState'
		},
		clearState: function(){
			this.$('#new-activity').removeClass('inputerror');
		},
		testReturn: function(e){
			if (e.keyCode == 13)
				this.doSubmit();
			else if (e.keyCode == 27)
				this.$('#new-activity').blur();
		},
		doSubmit: function(){
			var input = this.$('#new-activity'), btn = this.$('#submit-activity');
			input.attr('disabled', 'disabled');
			btn.button('loading');
			var todo = new Activity;
			todo.save({content: this.$('#new-activity').val()}, {
				success: function(model){
					input.attr('disabled', false).removeClass('inputerror').val('');
					btn.button('reset');
					E.trigger('newActivity', model);
				},
				error: function(){
					btn.button('reset');
					input.attr('disabled', false).addClass('inputerror');
				}
			});
		},
		initialize: function(){
			_.bindAll(this, 'addActivity', 'removeActivity', 'render');
			$('#main .row > div:eq(1)').append(this.el);
			E.bind('newActivity', this.addActivity);
			E.bind('removeActivity', this.removeActivity);
			this.activities = new Activities;
			this.activities.bind('add', this.addActivity);
			this.activities.bind('reset', this.render);
			if (window.initActivities){
				this.activities.reset(window.initActivities);
				window.initActivities = null;
			} else
				this.activities.fetch();
		},
		removeActivity: function(activity){
			this.$('.activities [data-aid=' + activity.id + ']').remove();
		},
		addActivity: function(activity){
			var ul = this.$('.activities'), row = new ActivityRow({model: activity});
			ul.prepend(row.el);
		},
		remove: function(){
			E.unbind('newActivity', this.addActivity);
			E.unbind('removeActivity', this.removeActivity);
			return Backbone.View.prototype.remove.call(this);
		},
		render: function(){
			var ul = $(this.el).html(this.template).find('.activities');
			this.activities.each(function(activity){
				var row = new ActivityRow({model: activity});
				ul.append(row.el);
			});
		}
	});

	var LeftTabView = Backbone.View.extend({
		template: _.template(tpls.tab_item),
		events: {
			'click a': 'switchPage'
		},
		switchPage: function(e){
			e.preventDefault();
			var href = $(e.target).attr('href'), dest = href.substr(3);
			if (dest === 'history')
				return;
			else if (dest === 'range'){
				var popup = new DateRangeModalView;
				popup.setCallback(function(){
					popup.reset();
					var from = popup.from().val(), to = popup.to().val();
					if (!/^\d{4}-\d{2}-\d{2}$/.test(from)){
						popup.from().addClass('inputerror');
						return false;
					}
					if (!/^\d{4}-\d{2}-\d{2}$/.test(to)){
						popup.to().addClass('inputerror');
						return false;
					}
					if (from >= to){
						popup.from().addClass('inputerror');
						popup.to().addClass('inputerror');
						return false;
					}
					popup.hide();
					gotoPage('range/' + from + '/' + to);
				}).fire();
			} else
				gotoPage(dest);
		},
		active: function(page){
			this.$('.active').removeClass('active');
			var to_active = this.$('[href="#!/' + page + '"]');
			if (to_active.length > 0)
				to_active.parent('li').addClass('active');
			else {
				var plus = this.$('.plus');
				if (plus.length == 0)
					$(this.el).append(this.template({name: page}));
				else
					plus.attr('href', '#!/' + page);
				(plus.length ? plus : this.$('.plus')).parent().addClass('active');
			}
		}
	});

	var ModalView = Backbone.View.extend({
		className: 'modal hide',
		template: _.template(tpls.modal),
		events: {
			'click .cancel': 'hide',
			'click .ok': 'ok'
		},
		btn1_class: 'primary',
		btn2_class: 'secondary',
		title: '',
		body: '',
		btn1: '确定',
		btn2: '取消',
		initialize: function(){
			_.bindAll(this, 'remove');
			$(document.body).append(this.el);
			$(this.el).bind('shown', function(){
				$(this).find('input:eq(0)').focus();
			}).bind('hide', this.remove);
			this.render();
		},
		hide: function(){
			$(this.el).modal('hide');
			return false;
		},
		ok: function(){
			this.options.callback();
			return false;
		},
		testReturn: function(e){
			if (e.keyCode == 13){
				this.ok();
				return false;
			}
		},
		render: function(){
			$(this.el).html(this.template({
				title: this.title,
				body: this.body,
				btn1: this.btn1,
				btn2: this.btn2,
				btn1_class: this.btn1_class,
				btn2_class: this.btn2_class
			})).modal({
				backdrop: true,
				keyboard: true,
			});
		},
		fire: function(){
			$(this.el).modal('show');
		}, 
		setCallback: function(cb){
			this.options.callback = cb;
			return this;
		},
		loading: function(){
			this.$('.ok').button('loading');
		},
		reset: function(){
			this.$('input').removeClass('inputerror');
			this.$('.ok').button('reset');
		},
		error: function(){
			this.$('input').addClass('inputerror');
		}
	});

	var EditModalView = ModalView.extend({
		title: '修改',
		body: '<input class="span9" />',
		btn1: '保存',
		val: function(str){
			if (str !== undefined)
				return this.$('input').val(str);
			return $.trim(this.$('input').val());
		}
	});

	var DelModalView = ModalView.extend({
		title: '删除',
		btn1_class: 'danger',
		body: '确实要删除吗？'
	});

	var DateRangeModalView = ModalView.extend({
		title: '选择时间范围',
		body: '从 <input class="span2 from" /> 到 <input class="span2 to" />',
		from: function(){
			return this.$('.from');
		},
		to: function(){
			return this.$('.to');
		},
		fire: function(){
			$(this.el).modal('show');
			this.$('input').datepicker({
				showAnim: ''
			}).blur();
		}
	});

	var TagRow = Backbone.View.extend({
		tagName: 'div',
		className: 'label',
		initialize: function(){
			var name = this.model.get('name'), counts = this.model.get('counts');
			$(this.el).text(name).attr('title', counts + ' ' + '条记录').addClass(tagColorClass(name)).twipsy({animate: false});
		}
	});

	var TagsView = Backbone.View.extend({
		tagName: 'div',
		className: 'tags',
		events: {
			'click .label': 'showTag'
		},
		initialize: function(){
			var container = $('#main .todo-data:eq(0)');
			container.append(this.el);
			_.bindAll(this, 'render');
			this.tags = new Tags;
			this.tags.bind('reset', this.render);
			container.addClass('loading');
			this.tags.fetch({
				success: function(){
					container.removeClass('loading');
				}
			});
		},
		showTag: function(e){
			var span = $(e.target).twipsy('hide');
			var tag = span.text();
			gotoPage('tag/' + tag);
		},
		render: function(){
			if (!this.tags.length)
				return;
			var ul = $(this.el), fontMin = 14, fontMax = 44;
			var minCounts = this.tags.min(function(m){ return m.get('counts'); }).get('counts'),
				maxCounts = this.tags.max(function(m){ return m.get('counts'); }).get('counts'),
				spread = maxCounts - minCounts;
			if (spread <= 0)
				spread = 1;
			fontSpread = fontMax - fontMin;
			if (fontSpread <= 0)
				fontSpread = 1;
			fontStep = fontSpread / spread;
			this.tags.each(function(tag){
				var row = new TagRow({model: tag}), el = $(row.el),
					size = Math.ceil(fontMin + (tag.get('counts') - minCounts) * fontStep);
				el.attr('style', 'font-size:' + size + 'px;line-height:' + size + 'px;');
				ul.append(row.el);
			});
		}
	});

	var Jihua = Backbone.Router.extend({
		routes: {
			'': 'main',
			'!/today': 'today',
			'!/yesterday': 'yesterday',
			'!/undone': 'undone',
			'!/tags': 'tags',
			'!/tag/*tag': 'tag',
			'!/search/*query': 'search',
			'!/this/:unit': 'range',
			'!/last/week': 'lastweek',
			'!/range/:from/:to': 'range'
		},
		initialize: function(initTodos, initActivities){
			$('#splash').remove();
			this.tab = new LeftTabView({el: $('#left-tab')});
			this.rv = new ActivityView;
			this.autoHeight()
				.autoNextPage()
				.hotkeys()
				.misc();
		},
		main: function(){
			gotoPage('today');
		},
		misc: function(){
			$.fn.button.defaults.loadingText = '请稍候...';
			$.ajaxSetup({cache: false});
			$(document).ajaxSend(function(b, c){
				c.setRequestHeader("X-CSRFToken", /csrftoken=([^;\s]+)/.exec(document.cookie)[1]);
			});
			$('#search').keydown(function(e){
				if (e.keyCode == 13){
					gotoPage('search/' + $('#search').val());
					return false;
				} else if (e.keyCode == 27)
					$('#search').blur();
			}).parent().submit(function(){
				return false;
			});
			$.datepicker.setDefaults({
				closeText: '关闭',
				prevText: '&#x3c;上月',
				nextText: '下月&#x3e;',
				currentText: '今天',
				monthNames: ['一月','二月','三月','四月','五月','六月',
				'七月','八月','九月','十月','十一月','十二月'],
				monthNamesShort: ['一','二','三','四','五','六',
				'七','八','九','十','十一','十二'],
				dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
				dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
				dayNamesMin: ['日','一','二','三','四','五','六'],
				weekHeader: '周',
				dateFormat: 'yy-mm-dd',
				firstDay: 1,
				isRTL: false,
				showMonthAfterYear: true,
				yearSuffix: '年'
			});
			// auto refresh timestamp every minute
			setInterval(function(){
				$('.timestamp').each(function(){
					var el = $(this), ts = el.data('timestamp');
					if (ts)
						el.attr('data-original-title', '添加于 ' + humanizeDate(ts));
				});
			}, 60000);
		},
		autoNextPage: function(){
			var app = this;
			$('.todo-data:eq(0)').scroll(_.debounce(function(){
				var el = $(this)[0];
				if (el.offsetHeight + el.scrollTop >= el.scrollHeight)
					E.trigger('scrollEnd');
			}, 300));
			return this;
		},
		autoHeight: function(){
			var reheight = function(){
				$('.todo-data').height($(window).height() - 162);
			};
			reheight();
			$(window).resize(_.debounce(reheight, 300));
			return this;
		},
		hotkeys: function(){
			var focusMap = {
				84: '#new-todo',
				89: '#new-activity',
				81: '#search'
			}, triggerMap = {
				69: '.edit',
				68: '.del',
				39: '.t2a',
				37: '.a2t',
				13: '.checkbox'
			};
			$(window).keydown(function(e){
				var el = e.target, modal = $('.modal');
				if (modal.length > 0 && e.keyCode == 13){ // return
					modal.find('.ok').trigger('click');
					return false;
				}
				if ('INPUT,TEXTAREA'.indexOf(el.tagName) != -1 || modal.length > 0 || e.ctrlKey || e.shiftKey || e.altKey)
					return;
				switch (e.keyCode) {
					case 84: // t
					case 89: // y
					case 81: // q
						$(focusMap[e.keyCode]).focus();
						break;
					case 74: // j
					case 75: // k
					case 72: // h
					case 76: // l
						var cur = $('.selected'), key = e.keyCode, isRight = cur.parent().is('.activities');
						if (key == 74 || key == 75)
							next = cur[key == 74 ? 'next' : 'prev']();
						else {
							if ((isRight && key == 76) || (!isRight && key == 72))
								return;
							next = $(key == 72 ? '.todos li:eq(0)' : '.activities li:eq(0)');
						}
						if (cur.length == 0)
							$('.todos > li,.activities > li').eq(0).addClass('selected');
						else if (next.length != 0) {
							next.addClass('selected');
							cur.removeClass('selected');
						}
						break;
					case 27: // esc
						$('.selected').removeClass('selected');
						break;
					case 69: // e
					case 68: // d
					case 39: // e
					case 37: // d
					case 13: // return
						var cur = $('.selected');
						if (cur.hasClass('moving'))
							return;
						$(triggerMap[e.keyCode], cur).trigger('click');
						break;
					default:
						return;
				}
				return false;
			});
			return this;
		},
		today: function(){
			this.lv && this.lv.remove(); // left view
			this.tab.active('today');
			this.lv = new TodayView;
		},
		yesterday: function(){
			this.lv && this.lv.remove();
			this.tab.active('yesterday');
			this.lv = new CommonView({params: {range: 'yesterday'}});
		},
		undone: function(){
			this.lv && this.lv.remove();
			this.tab.active('undone');
			this.lv = new CommonView({params: {range: 'undone'}});
		},
		tags: function(){
			this.lv && this.lv.remove();
			this.tab.active('tags');
			this.lv = new TagsView;
		},
		tag: function(name){
			this.lv && this.lv.remove();
			this.tab.active('tag/' + name);
			this.lv = new CommonView({params: {tag: name}});
		},
		search: function(query){
			if (!$.trim(query))
				return;
			this.lv && this.lv.remove();
			this.tab.active('search/' + query);
			this.lv = new TitledCommonView({
				params: {query: query},
				title: '包含 "' + query + '" 的计划条目' 
			});
		},
		lastweek: function(){
			this.range('lastweek');
		},
		range: function(r1, r2){
			var date = /\d{4}-\d{2}-\d{2}/;
			if (r2 === undefined && 'week,month,lastweek'.indexOf(r1) != -1){
				range = r1;
				title = (r1 == 'week' ? '本周' : (r1 == 'month' ? '本月' : '上周')) + '的计划';
			} else if (date.test(r1) && date.test(r2)){
				range = r1 + ',' + r2;
				title = (r1 + ' ~ ' + r2 + ' 的计划').replace(/-/g, '/');
			} else
				return;
			this.lv && this.lv.remove();
			this.tab.active('history');
			this.lv = new TitledCommonView({
				params: {range: range},
				title: title
			});
		}
	});
	window.Jihua = Jihua;
}(jQuery);
