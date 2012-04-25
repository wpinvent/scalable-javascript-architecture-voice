//jira-login module jira登录
app.register('jira-login', function (sb) {
    var template, xbox, target, cfg = {
        isLoadData: false,
        //判断是否已经载入了数据
        name: '',
        //缓存用户名
        pwd: '' //缓存密码
    };

    template = ['<div id="xboxJiraLogin" class="xbox-jira-form fn-hide">', '<form id="fmJiraLogin" action="/index.php?r=voiceInner/loginJira" method="post">', '<div class="xbox-jira-tip">请用域帐号（邮箱前缀）和域密码登录！</div>', '<div class="fm-item">', '<label for="nameJiraLogin" class="fm-item-label"><span class="fm-required">*</span>用户名：</label>', '<input id="nameJiraLogin" class="ui-input" value="" type="text" />', '<div class="fm-explain"></div>', '</div>', '<div class="fm-item">', '<label for="pwdJiraLogin" class="fm-item-label"><span class="fm-required">*</span>密码：</label>', '<input id="pwdJiraLogin" class="ui-input" value="" type="password" />', '<div class="fm-explain"></div>', '</div>', '<div class="fm-item xbox-jira-save-item">', '<input id="saveJiraLogin" class="xbox-jira-save-chk" type="checkbox" value="save" />', '<label for="saveJiraLogin" class="xbox-jira-save-lb">保存用户名和密码</label>', '</div>', '<div class="fm-item">', '<span class="ui-round-btn"><input id="submitJiraLogin" type="submit" class="ui-round-btn-text" value="登 录" /></span>', '<span class="ui-round-btn"><input id="closeJiraLogin" type="button" class="ui-round-btn-text" value="取 消" /></span>', '</div>', '</form>', '</div>'];

    function chkWhite(el, msg) {
        if (sb.trim(el.value) === '') {
            sb.showError(el, msg);
            return true;
        }
        return false;
    }

    return {
        init: function () {
            document.body.appendChild(sb.create(template.join('')));
            this.bind();

            xbox = sb.domBox({
                id: 'xboxJiraLogin',
                width: 400,
                title: '登录 Alipay JIRA'
            });

            app.Communication.listen({
                type: 'jira-login',
                context: this,
                callback: this.showJiraLogin
            });

        },
        userData: function (name, value) {
            if (window.localStorage) {
                this.userData = function (name, value) {
                    if (value !== undefined) {
                        localStorage.setItem(name, value);
                    } else {
                        return localStorage.getItem(name);
                    }
                }
            } else {
                this.userData = function (name, value) {
                    var ele = document.body;
                    ele.addBehavior("#default#userData");
                    if (value !== undefined) {
                        ele.setAttribute(name, value);
                        ele.save('JIRA_USERDATA');
                    } else {
                        ele.load("JIRA_USERDATA");
                        return ele.getAttribute(name);
                    }
                }
            }
            return this.userData(name, value);
        },
        removeData: function (name) {
            if (window.localStorage) {
                this.removeData = function (name) {
                    localStorage[name] && localStorage.removeItem(name);
                }
            } else {
                this.removeData = function (name) {
                    var ele = document.body;
                    ele.load("JIRA_USERDATA");
                    ele.removeAttribute(name);
                }
            }
            this.removeData(name);
        },
        showJiraLogin: function (msg) {
            sb.preventDefault(msg.ev);
            target = sb.getTarget(msg.ev);
            cfg.li = sb.parent(target, 'li');

            if (!cfg.isLoadData) {
                xbox.show();
            } else {
                app.Communication.notify({
                    type: 'jira-form-show',
                    data: cfg
                });
            }
        },
        bind: function () {
            var txt = {
                user: '请输入用户名',
                pwd: '请输入密码'
            },
                self = this,
                user = sb.get('nameJiraLogin'),
                pwd = sb.get('pwdJiraLogin'),
                save = sb.get('saveJiraLogin'),
                fm = sb.get('fmJiraLogin'),
                btnSubmit = sb.get('submitJiraLogin');

            if (self.userData('save')) {
                save.checked = true;
                user.value = self.userData('user');
                pwd.value = self.userData('pwd');
            }
            sb.focusError([user, pwd]);
            sb.addEvent('closeJiraLogin', 'click', function () {
                xbox.hide();
            }).addEvent(fm, 'submit', function (ev) {
                ev.preventDefault();
                if (!(chkWhite(user, txt.user) || chkWhite(pwd, txt.pwd))) {
                    sb.disableButton(btnSubmit);
                    app.Ajax.alipay({
                        url: sb.attr(fm, 'action'),
                        success: function (res) {
                            xbox.hide();
                            sb.enableButton(btnSubmit);
                            cfg.isLoadData = true;
                            cfg.name = user.value;
                            cfg.pwd = pwd.value;
                            app.Communication.notify({ //传递信息
                                type: 'jira-form-config',
                                data: cfg
                            }).notify({ //生成联动菜单
                                type: 'jira-form-bind',
                                data: res.data
                            }).notify({ //显示jira表单
                                type: 'jira-form-show',
                                data: cfg
                            });

                            if (save.checked && !self.userData('save')) { //保存用户名密码
                                self.userData('save', 'true');
                                self.userData('user', cfg.name);
                                self.userData('pwd', cfg.pwd);
                            } else if (!save.checked) {
                                self.removeData('save');
                                self.removeData('user');
                                self.removeData('pwd');
                            }
                        },
                        failure: function (res) {
                            sb.showError(pwd, res.msg);
                            sb.enableButton(btnSubmit);
                        },
                        data: {
                            user: user.value,
                            pass: pwd.value
                        }
                    });
                }
            });
            sb.enableButton(btnSubmit); //兼容FF bug 
        }
    };
});

//jira-form module jira需求创建
app.register('jira-form', function (sb) {
    var cfg, xbox, template, elem, isNeedFeedback, stars, album, fm, assign, cache;

    template = ['<div id="xboxJiraForm" class="xbox-form fn-hide">', '<form id="fmJiraForm" action="/index.php?r=voiceInner/createJira" method="post">', '<div class="fn-clear">', '<div class="fn-left xbox-form-left">', '<div class="fm-item">', '<label for="pidJira" class="fm-item-label"><span class="fm-required">*</span>项目：</label>', '<select id="pidJira" name="pid" class="ui-select xbox-input-half"></select>', '<div class="fm-explain"></div>', '</div>', '</div>', '<div class="fn-right xbox-form-right">', '<div class="fm-item">', '<label for="issueTypeJira" class="fm-item-label"><span class="fm-required">*</span>问题类型：</label>', '<select id="issueTypeJira" name="issuetype" class="ui-select xbox-input-half"></select>', '<div class="fm-explain"></div>', '</div>', '</div>', '</div>', '<div class="fn-clear">', '<div class="fn-left xbox-form-left">', '<div class="fm-item">', '<label for="reporterJira" class="fm-item-label"><span class="fm-required">*</span>报告人：</label>', '<input id="reporterJira" name="reporter" class="ui-input xbox-input-half" value="" type="text" />', '<div class="fm-explain"></div>', '</div>', '</div>', '<div class="fn-right xbox-form-right">', '<div class="fm-item">', '<label for="priorityJira" class="fm-item-label"><span class="fm-required">*</span>优先级：</label>', '<select id="priorityJira" name="priority" class="ui-select xbox-input-half">', '<option value="1">Blocker</option>', '<option value="2">Critical</option>', '<option value="3" selected="selected">Major</option>', '<option value="4">Minor</option>', '<option value="5">Trivial</option>', '</select>', '<div class="fm-explain"></div>', '</div>', '</div>', '</div>', '<div class="fm-item">', '<label for="summaryAssignee" class="fm-item-label">开发者：</label>', '<div id="assigneeCnt" class="xbox-assign"><img class="xbox-assign-loading" src="/images/ico-loading.gif" alt="loading" /></div>', '</div>', '<div class="fm-item">', '<label for="summaryJira" class="fm-item-label"><span class="fm-required">*</span>概要：</label>', '<input id="summaryJira" name="summary" class="ui-input xbox-input-auto" value="" type="text" />', '<div class="fm-explain">格式为：作为***，我希望***，以达到***的目的。</div>', '</div>', '<div class="fm-item">', '<label for="descriptionJira" class="fm-item-label"><span class="fm-required">*</span>描述：</label>', '<textarea id="descriptionJira" name="description" class="ui-textarea xbox-input-auto"></textarea>', '<div class="fm-explain">内容包括：原始需求、关键点、设计方案、改动点、测试关注点。根据自身需要，选择填写。</div>', '</div>', '<div class="fm-item">', '<label class="fm-item-label">附件：</label>', '<div id="imagesJira"></div>', '</div>', '<div class="fm-item">', '<label for="feedbackJira" class="fm-item-label"><span class="fm-required">*</span>给用户的反馈：</label>', '<textarea id="feedbackJira" name="content" class="ui-textarea xbox-input-auto"></textarea>', '<div class="fm-explain"></div>', '</div>', '<div class="fm-item">', '<span class="ui-round-btn"><input id="createJiraForm" type="submit" class="ui-round-btn-text" value="创 建" /></span>', '<span class="ui-round-btn"><input id="cancelJiraForm" type="button" class="ui-round-btn-text" value="取 消" /></span>', '</div>', '<div id="loadingJiraForm" class="fm-item fn-hide">', '<img src="/images/ico-loading.gif" class="xbox-form-loading" alt="处理中" />正在向Jira传送需求数据,请稍后…', '</div>', '</form>', '</div>'];

    return {
        init: function () {
            document.body.appendChild(sb.create(template.join('')));
            this.bind();
            xbox = sb.domBox({
                id: 'xboxJiraForm',
                title: 'JIRA需求创建',
                width: 620
                //close: '<a href="#" style="position:absolute;top:0;right:0;width:40px;text-align:right;z-index:88;">关闭X</a>'
            });
            app.Communication.listen({
                type: 'jira-form-show',
                context: this,
                callback: this.show
            }).listen({
                type: 'jira-form-bind',
                context: this,
                callback: this.bindProjects
            }).listen({
                type: 'jira-form-config',
                context: this,
                callback: function (data) {
                    cfg = data;
                }
            });
        },
        show: function (data) {
            var str;
            cfg = data;
            elem = data.li;
            cache.summary.el.value = '';
            cache.reporter.el.value = data.name;
            cache.description.el.value = '引用来自 "' + this.getField('voice-person') + ' ' + this.getField('voice-date') + ' 发送在 ' + this.getField('voice-prod') + '" 的建议：' + this.getContent();
            cache.feedback.el.value = '';

            str = this.getImages();
            if (str == '') { //是否包含图片
                sb.addClass(sb.parent(album), 'fn-hide');
            } else {
                sb.removeClass(sb.parent(album), 'fn-hide');
                album.innerHTML = str //建议图片
            }

            this.checkFeedback();

            //sb.first(stars).style.width = '0';
            xbox.show();
        },
        checkFeedback: function () { //检查是否已经反馈过
            isNeedFeedback = sb.attr(elem, 'data-feedback') === '0';
            if (isNeedFeedback) {
                cache.feedback.required = true;
                sb.show(sb.parent(cache.feedback.el));
            } else {
                cache.feedback.required = false;
                sb.hide(sb.parent(cache.feedback.el));
            }
        },
        getImages: function () {
            var html = [],
                arr, url = location.protocol + '//' + location.host + '/index.php?r=attachment/ViewPicture&id='
            annex = sb.query('.voice-annex', elem)[0];

            if (annex) {
                arr = sb.attr(annex, 'data-images').split('|');
                sb.each(arr, function (item, index) {
                    html.push('<input type="checkbox" name="images" id="jiraImage' + index + '" checked="checked" value="' + url + item + '" /><label for="jiraImage' + index + '">图片' + (index + 1) + '</label>');
                });
            }
            return html.join('');
        },
        getField: function (cls) {
            var el = sb.query('.' + cls, elem)[0];
            return el.innerHTML;
        },
        getContent: function () { //获取建议内容
            var ret, cnt = sb.query('.voice-content', elem)[0],
                cntAll = sb.query('.voice-content-all', elem)[0];
            if (cntAll) {
                ret = sb.trim(cntAll.innerHTML).replace(/<(\S*?)[^>]*>/g, '').slice(0, -5);
            } else {
                ret = sb.trim(cnt.innerHTML);
            }
            return ret;
        },
        starPoint: function (el) {
            var left = 0,
                point = 0,
                width = 18;
            sb.addEvent(el, 'mousemove', function (ev) {
                setStars(getPoint(ev));
            }).addEvent(el, 'click', function (ev) {
                point = getPoint(ev);
                cache.point.el.value = point;
            }).addEvent(el, 'mouseout', function () {
                setStars(point);
            });

            function getPoint(ev) {
                if (left == 0) {
                    left = sb.region(el).left;
                }
                return Math.ceil((ev.clientX - left) / width);
            }

            function setStars(n) {
                sb.first(el).style.width = n * width + 'px';
            }
        },
        bindProjects: function (data) { //绑定项目列表
            var scheme = {},
                frag = document.createDocumentFragment(),
                opt, types, type, j, l, html = [];

            //生成projects, 兼容ie，所以不能使用innerHTML
            sb.each(data.projects, function (item) {
                opt = document.createElement('option');
                opt.value = item.id;
                opt.setAttribute('data-scheme', item.scheme);
                opt.innerHTML = item.name;
                frag.appendChild(opt);
            });
            cache.pid.el.appendChild(frag);

            //生成不同scheme的issues
            sb.each(data.schemes, function (item) {
                html = [];
                types = typeof (item.types) == 'string' ? item.types : item.types.join('|'); //当types只有一项时，xml--json会转化为字符串。
                for (j = 0, l = data.types.length; j < l; j++) {
                    type = data.types[j];
                    if (types.indexOf(type.id) > -1) {
                        html.push({
                            value: type.id,
                            text: type.name
                        });
                    }
                }
                scheme[item.id] = html;
            });

            sb.addEvent(cache.pid.el, 'change', changeScheme);

            function changeScheme() {
                frag = document.createDocumentFragment();
                sb.each(scheme[getSchemeId(cache.pid.el)], function (item) {
                    opt = document.createElement('option');
                    opt.value = item.value;
                    opt.innerHTML = item.text;
                    frag.appendChild(opt);
                });
                cache.issueType.el.innerHTML = '';
                cache.issueType.el.appendChild(frag);

                sb.addClass(assign, 'xbox-assign-processing');
                app.Ajax.alipay({
                    url: '/index.php?r=voiceInner/showAssignee',
                    success: function (res) {
                        sb.removeClass(assign, 'xbox-assign-processing');
                        if (res.data.indexOf('</option>') > 0) {
                            assign.innerHTML = getPersons(res.data) + '<a href="#" class="xbox-assign-me">分配给我</a><img class="xbox-assign-loading" src="/images/ico-loading.gif" alt="loading" />';
                        } else {
                            assign.innerHTML = res.data + '<img class="xbox-assign-loading" src="/images/ico-loading.gif" alt="loading" />';
                        }
                    },
                    failure: function (res) {

                    },
                    data: {
                        user: cfg.name,
                        pass: cfg.pwd,
                        pid: cache.pid.el.value,
                        issuetype: cache.issueType.el.value
                    }
                });
            }

            function getPersons(str) { //因为返回的html中可能包含非select的内容
                var end = str.indexOf('</select>');
                return str.slice(0, end + 9);
            }

            function getSchemeId(el) {
                return el.options[el.selectedIndex].getAttribute('data-scheme');
            }
            changeScheme();
        },
        assignMe: function () {
            var a = sb.query('option', assign),
                i, len, opt;
            for (i = 0, len = a.length; i < len; i++) {
                opt = a[i];
                if (opt.className == 'current-user') {
                    opt.selected = true;
                    break;
                }
            }
        },
        bind: function () { //绑定事件
            var self = this,
                loading = sb.get('loadingJiraForm'),
                btnSubmit = sb.get('createJiraForm');

            stars = sb.get('starsPoint');
            album = sb.get('imagesJira');
            fm = sb.get('fmJiraForm');
            assign = sb.get('assigneeCnt');
            cache = {
                pid: {
                    el: sb.get('pidJira'),
                    txt: '请选择项目',
                    required: true
                },
                issueType: {
                    el: sb.get('issueTypeJira'),
                    txt: '请选择类型',
                    required: true
                },
                reporter: {
                    el: sb.get('reporterJira'),
                    txt: '报告人不能为空',
                    required: true
                },
                priority: {
                    el: sb.get('priorityJira'),
                    txt: '请选择优先级',
                    required: true
                },
                summary: {
                    el: sb.get('summaryJira'),
                    txt: '概要不能为空',
                    required: true
                },
                description: {
                    el: sb.get('descriptionJira'),
                    txt: '描述不能为空',
                    required: true
                },
                //assignee: {el: sb.get('assignee'), txt: '', required: false},
                feedback: {
                    el: sb.get('feedbackJira'),
                    txt: '反馈不能为空',
                    required: true
                }
            };

            sb.addEvent('cancelJiraForm', 'click', function () {
                xbox.hide();
            }).addEvent(assign, 'click', function (ev) {
                var el = ev.target;
                if (el.className.indexOf('xbox-assign-me') > -1) {
                    sb.preventDefault(ev);
                    self.assignMe();
                }
            }).addEvent(fm, 'click', function (ev) {
                var target = sb.getTarget(ev),
                    next, parent;
                switch (target.tagName.toLowerCase()) {
                case 'input':
                case 'select':
                case 'textarea':
                    parent = sb.parent(target);
                    next = sb.next(target);
                    if (sb.hasClass(parent, 'fm-error')) {
                        sb.hideError(target);
                        next.innerHTML = sb.attr(next, 'data-explain') || '';
                    }
                    break;
                default:
                    break;
                }

            }).addEvent(fm, 'submit', function (ev) {
                var flag = true,
                    o, el, next, data, developer, images = [];
                ev.preventDefault();

                for (o in cache) {
                    if (cache.hasOwnProperty(o)) {
                        el = cache[o].el;
                        if (cache[o].required && sb.trim(cache[o].el.value) === '') {
                            flag = false;
                            next = sb.next(el);
                            sb.attr(next, 'data-explain', next.innerHTML);
                            sb.showError(el, cache[o].txt);
                            return;
                        }
                    }
                }

                if (flag) {
                    sb.disableButton(btnSubmit);
                    sb.removeClass(loading, 'fn-hide');
                    developer = sb.get('assignee');
                    data = {
                        user: cfg.name,
                        pass: cfg.pwd,
                        voice_id: sb.attr(elem, 'data-suggestId')
                    };
                    for (o in cache) {
                        if (cache.hasOwnProperty(o)) {
                            el = cache[o].el;
                            data[el.name] = el.value;
                        }
                    }

                    if (!isNeedFeedback) { //是否需要反馈
                        delete data[cache.feedback.el.name];
                    }

                    try {
                        data[developer.name] = developer.value; //开发者
                    } catch (e) {
                        app.Log(e);
                    }
                    sb.each(sb.query('input', album), function (input) {
                        input.checked && images.push(input.value);
                    });
                    data.images = images.join('|');

                    app.Ajax.alipay({
                        url: sb.attr(fm, 'action'),
                        success: function (res) {
                            xbox.hide();
                            sb.enableButton(btnSubmit);
                            sb.addClass(loading, 'fn-hide');
                            app.Communication.notify({
                                type: 'tip-show',
                                data: {
                                    title: '转化为需求成功',
                                    msg: res.msg,
                                    cls: 'success'
                                }
                            });
                            //更新建议状态
                            app.Communication.notify({
                                type: 'voice-state-update',
                                data: {
                                    state: 'demand',
                                    suggestId: sb.attr(elem, 'data-suggestId'),
                                    isModify: isNeedFeedback
                                }
                            })
                        },
                        failure: function (res) {
                            sb.enableButton(btnSubmit);
                            sb.addClass(loading, 'fn-hide');
                            app.Communication.notify({
                                type: 'tip-show',
                                data: {
                                    title: '操作失败',
                                    msg: res.msg,
                                    cls: 'error'
                                }
                            });
                        },
                        data: data
                    });

                }
            });
            sb.enableButton(btnSubmit); //FF bug
        }
    };
});

//create-issues module 生成问题点
app.register('create-issues', function (sb) {
    var d = prodIssues,
        nl = 4,
        //默认左侧4列，发建议选择问题点时3列
        nr = 2; //右侧2列
    return {
        init: function () {
            app.Communication.listen({
                type: 'create-issues',
                context: this,
                callback: this.create
            });
        },
        create: function (data) {
            var al = [],
                ar = [],
                cl = nl,
                cr = nr,
                i, j = 0,
                l, rows = 0,
                t1 = 0,
                t2 = 0,
                min = 0,
                html = '';

            if (data.cl) { //修改默认值
                cl = data.cl;
            }

            for (i = 0, l = d.length; i < l; i++) {
                if (d[i].child.length > cr) {
                    al.push(d[i]);
                    rows += Math.ceil(d[i].child.length / cl);
                } else if (d[i].child.length > 0) {
                    ar.push(d[i]);
                }
            }

            //确定min
            if (rows > ar.length) {
                sb.each(al, function (o, index) {
                    t1 += Math.ceil(o.child.length / cl);

                    if (t1 < ar.length || t2 < ar.length) {
                        min = index + 1;
                    }
                    t2 = t1;
                });
            } else {
                min = al.length;
            }

            for (i = 0; i < min; i++) {
                html += '<div class="prodissue-row ' + (i % 2 == 1 ? '' : 'prodissue-row-odd') + '">';
                html += ['<div class="prodissue-left">', app.Template.render(data.template, al[i]), '</div>', '<div class="prodissue-right">'].join('');
                for (l = Math.min(j + Math.ceil(al[i].child.length / cl), ar.length); j < l; j++) {
                    html += app.Template.render(data.template, ar[j]);
                }
                html += '</div></div>';

            }

            if (rows > ar.length) {
                for (; i < al.length; i++) {
                    html += '<div class="prodissue-row ' + (i % 2 == 1 ? '' : 'prodissue-row-odd') + '"><div class="prodissue-single">';
                    html += app.Template.render(data.template, al[i]) + '</div></div>';
                }
            } else {
                for (l = i + Math.ceil((ar.length - j) / cr); i < l; i++) {
                    html += '<div class="prodissue-row ' + (i % 2 == 1 ? '' : 'prodissue-row-odd') + '">';
                    html += ['<div class="prodissue-left">', app.Template.render(data.template, ar[j++]), '</div>', '<div class="prodissue-right">', ar[j] ? app.Template.render(data.template, ar[j++]) : '', '</div></div>'].join('');
                }

            }
            if (data.template == 'prodissue-menu') {
                html = '<div style="padding:0 10px;"><a href="#" class="prodissue-title" data-prodId="all">全部建议</a></div>' + html;
            }
            sb.get(data.el).innerHTML = html;
        }
    };
});

//suggest-issues module 发表建议问题点
app.register('suggest-issues', function (sb) {
    var template, wrapper, cnt, timer, gap, classifyCnt = sb.get('issuesWrapper'),
        result = sb.get('selectedIssues'),
        txtType = sb.get('envelopeType');
    /*
    template = [
		'<div id="tipDes" class="tip-des-wrapper">',
			'<div class="triangle-wrapper">',
				'<span class="triangle triangle-border"></span>',
				'<span class="triangle triangle-back"></span>',
			'</div>',
			'<div id="tipDesCnt" class="tip-des-cnt"></div>',
		'</div>'
	];*/

    app.Template.define('prodissue-nav', [ //定义渲染模板
    '<dl class="prodissue-dl">', '<dt class="prodissue-class">${title}</dt>', '<dd class="prodissue-list" data-prod="${id}">', '#foreach($issue in $child)', '<a href="#" data-problemId="${issue.id}" data-prize="${issue.des}" data-des="${issue.prize}" class="issue prodissue-item">${issue.title}</a>', '#end', '</dd>', '</dl>']);

    return {
        init: function () {
            //document.body.appendChild(sb.create(template.join('')));
            app.Communication.notify({
                type: 'create-issues',
                data: {
                    template: 'prodissue-nav',
                    el: 'prodIssue'
                }
            });
            //wrapper = sb.get('tipDes');
            //cnt = sb.get('tipDesCnt');
            //gap = Math.round(wrapper.offsetWidth / 2),
            sb.Tab({
                id: 'tabIssues'
            });

            this.bind();
        },
        setPosition: function (l, t) {
            clearTimeout(timer);
            wrapper.style.top = t - 4 + 'px';
            wrapper.style.left = l - gap + 'px';
        },
        setHtml: function (html) {
            cnt.innerHTML = html;
        },
        hide: function () {
            timer = setTimeout(function () {
                wrapper.style.top = '-1000px';
            }, 100);
        },
        bind: function () {
            var self = this,
                panel = sb.get('prodIssue');

            sb.each(sb.query('a.issue', classifyCnt), function (el) {
                sb.addEvent(el, 'click', function (ev) {
                    ev.preventDefault();
                    sb.removeClass(classifyCnt, 'fm-error');
                    self.switchIssueType(el);
                });
                /*
				sb.addEvent(el, 'mouseover', function(ev){
					var region = sb.region(el),
						html = el.getAttribute('data-des'),
						l = region.left + Math.round(region.width / 2),
						t = region.top + region.height;
					
					if(!sb.isEmpty(html)){
						self.setHtml(html);
						self.setPosition(l, t);
					}
				}).addEvent(el, 'mouseout', function(ev){
					self.hide();
				});*/
            });

            sb.addEvent('btnAlterIssue', 'click', function (ev) {
                ev.preventDefault();
                sb.removeClass(classifyCnt, 'issues-state-selected');
            });

        },
        switchIssueType: function (el) {
            result.innerHTML = el.innerHTML;
            txtType.value = el.getAttribute('data-problemId');
            sb.attr(txtType, 'data-prod', sb.parent(el).getAttribute('data-prod'));
            sb.addClass(classifyCnt, 'issues-state-selected');
        }
    };
});

//voice-search 搜索建议
app.register('voice-search', function (sb) {
    var self, uid, isLocked = false,
        //安全锁，防止重复提交
        data = { //要提交的查询字段
            product_id: '',
            //产品线
            problem_id: '',
            //问题点
            state: '',
            //状态
            tag: '',
            //标签
            user: '',
            //用户
            key: '',
            //关键字
            date_start: '',
            //开始时间
            date_end: '',
            //结束时间
            uid: '',
            //用来标识本人，和stype联合实现我的收藏、我的建议、我的反馈
            stype: '',
            //myfavorites, myvoice, myfeedback
            page: 1 //页数
        },
        fm = sb.get('fmFilter'),
        alias = {},
        //搜索条件别名
        pages = {},
        //缓存分页
        oldPage = 1,
        totalPage, pageHolder = sb.get('pageHolder'),
        suggestHolder = sb.get('suggestHolder');

    return {
        init: function () {
            var el, p = sb.getParams(location.search.slice(1));
            self = this;

            uid = sb.get('userId').value; //当前小二的userId
            app.Template.define('prodissue-filter', [ //定义问题点渲染模板
            '<dl class="prodissue-dl">', '<dt class="prodissue-class"><a href="#" data-productId="${id}" class="prodissue-title">${title}</a></dt>', '<dd class="prodissue-list">', '#foreach($issue in $child)', '<a href="#" id="filterIssue${issue.id}" data-problemId="${issue.id}" class="prodissue-item">${issue.title}</a>', '#end', '</dd>', '</dl>']);
            app.Template.define('filter-tags', [ //标签模板
            '<a href="#" class="current" data-tag="">全部</a>', '#foreach($tag in $tags)', '<a href="#" data-tag="${tag.id}">${tag.name}</a>', '#end']);

            this.bind();
            this.loadData(); //读取本地数据
            if (p.s) { //判断url参数
                this.switchSearchType(p.s);
            }
            if (p.pid) { //当url中包含问题点id时，搜索当前问题点
                el = sb.get('filterIssue' + p.pid);
                if (el) {
                    //sb.removeClass('issueAll', 'current');
                    //sb.addClass(el, 'current');
                    this.setProblemId(p.pid, el.innerHTML);
                } else {
                    app.Log('问题点' + p.pid + '不存在', 'warn');
                }
            }

            this.handle(); //渲染第一页
            this.implementPage(); //绑定分页
        },
        bind: function () {
            var dates = sb.datePicker({
                from: 'filterDateStart',
                to: 'filterDateEnd',
                maxDate: '0',
                dateFormat: 'yy.mm.dd'
            });

            app.Communication.listen({ //监听刷新建议消息
                type: 'voice-refresh',
                context: this,
                callback: this.handle
            });
            app.Communication.notify({ //生成问题点
                type: 'create-issues',
                data: {
                    template: 'prodissue-filter',
                    el: 'filterIssues'
                }
            });
            app.Communication.notify({ //绑定事件:反馈、忽略、转发等
                type: 'bind-suggest',
                data: {
                    el: suggestHolder
                }
            });
            sb.addEvent(fm, 'submit', function (ev) { //搜索建议
                sb.preventDefault(ev);
                self.setProdLine();
                self.setState();
                self.setTag();
                self.setDate();
                self.setUser();
                self.setKey();
                self.hideFilter();
                self.resetForm();
                self.handle();
                self.saveData();
            });
            sb.addEvent('filterState', 'click', function (ev) { //切换建议状态
                var target = sb.getTarget(ev),
                    selectedState = sb.query('#filterState .current')[0];

                if (target.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    sb.removeClass(selectedState, 'current');
                    selectedState = target;
                    sb.addClass(selectedState, 'current');
                }
            });
            sb.addEvent('filterIssues', 'click', function (ev) { //切换问题点/产品线
                var target = sb.getTarget(ev),
                    selectedProd = sb.query('#filterIssues .current')[0],
                    problemId = sb.attr(target, 'data-problemId');

                if (!selectedProd) {
                    selectedProd = sb.get('issueAll');
                }

                if (target.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    sb.removeClass(selectedProd, 'current');
                    selectedProd = target;
                    sb.addClass(selectedProd, 'current');
                    if (problemId) { //问题点
                        self.getTagsByIssueId(problemId);
                    } else {
                        self.clearTag();
                    }
                }

            });
            sb.addEvent('issueAll', 'click', function (ev) { //切换到全部建议
                var target = sb.getTarget(ev),
                    selectedProd = sb.query('#filterIssues .current')[0];
                sb.preventDefault(ev);
                sb.removeClass(selectedProd, 'current');
                selectedProd = target;
                sb.addClass(selectedProd, 'current');
                self.clearTag();
            });
            sb.addEvent('searchBar', 'click', function (ev) { //删除搜索条件
                var target = sb.getTarget(ev);
                sb.preventDefault(ev);
                if (target.tagName.toLowerCase() === 'em') { //删除搜索条件
                    self.delSearch(sb.attr(sb.parent(target), 'data-key'));
                }
            });
            sb.addEvent('navMenu', 'click', function (ev) { //侧边导航
                var target = sb.getTarget(ev),
                    searchWrapper = sb.get('searchWrapper'),
                    selectedNav = sb.query('#navMenu .current')[0];
                type = sb.attr(target, 'data-event');

                function modStype() {
                    sb.preventDefault(ev);
                    self.handle();
                    sb.removeClass(selectedNav, 'current');
                    selectedNav = target;
                    sb.addClass(selectedNav, 'current');
                }

                sb.removeClass(searchWrapper, 'search-bar-favor'); //显示修改搜索条件按钮
                switch (type) {
                case 'home':
                    //首页
                    self.clearSearchType();
                    modStype();
                    break;
                case 'myfeedback':
                    //我的反馈
                    self.setSearchType(type, '我的反馈');
                    modStype();
                    break;
                case 'myfavorites':
                    //我的收藏
                    self.switchMyfavor();
                    modStype();
                    break;
                case 'myvoice':
                    //我的建议
                    self.setSearchType(type, '我的建议');
                    modStype();
                    break;
                default:
                    break;
                }

            });
            sb.addEvent('filterTag', 'click', function (ev) {
                var target = sb.getTarget(ev),
                    selectedTag = sb.query('#filterTag .current')[0];
                if (target.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    sb.removeClass(selectedTag, 'current');
                    selectedTag = target;
                    sb.addClass(selectedTag, 'current');
                }
            });
            sb.addEvent('searchModify', 'click', function (ev) { //显示搜索条件
                sb.preventDefault(ev);
                self.showFilter();
            });
        },
        loadData: function () { //读取本地数据
            var a = ['product_id', 'problem_id', 'state', 'tag', 'user', 'key'],
                flag = false,
                v;
            sb.each(a, function (p) {
                v = sb.userData('s_' + p);
                if (v) {
                    v = v.split('|');
                    if (v[0]) {
                        data[p] = v[0];
                        alias[p] = v[1];
                        flag = true;
                    }
                }
            });

            if (flag) {
                sb.hide(fm);
            } else {
                sb.show(fm);
            }
        },
        saveData: function () { //保存本地数据
            var a = ['product_id', 'problem_id', 'state', 'tag', 'user', 'key'];
            sb.each(a, function (p) {
                sb.userData('s_' + p, data[p] + '|' + alias[p])
            });
        },
        switchSearchType: function (type) {
            sb.removeClass(sb.query('#navMenu .current')[0], 'current');
            sb.addClass(sb.query('#navMenu a[data-event=' + type + ']')[0], 'current');
            switch (type) {
            case 'myfeedback':
                //我的反馈
                self.setSearchType(type, '我的反馈');
                break;
            case 'myfavorites':
                //我的收藏
                self.switchMyfavor();
                break;
            case 'myvoice':
                //我的建议
                self.setSearchType(type, '我的建议');
                break;
            default:
                self.clearSearchType();
                break;
            }
        },
        switchMyfavor: function () { //我的收藏
            self.hideFilter();
            sb.addClass('searchWrapper', 'search-bar-favor'); //隐藏修改搜索条件按钮
            self.setSearchType('myfavorites', '我的收藏');

            this.delDate(); //清空时间
            this.setSuggestAll(); //清空产品线、问题点
            this.delField('state');
            this.delField('tag');
            this.delField('user');
            this.delField('key');
        },
        handle: function () {
            self.reset(); //重置
            self.search(); //搜索
            self.renderCondition(); //显示搜索条件
        },
        search: function () { //查询建议
            isLocked = true;
            app.Ajax.alipay({
                url: 'index.php?r=voiceInner/search',
                success: function (res) {
                    self.success(res);
                },
                failure: function (res) {
                    self.failure(res);
                },
                data: data
            });
        },
        jumpToPage: function () { //跳转到指定页
            var el;
            if (isLocked) return;
            if (pages['page' + data.page]) { //检查缓存
                sb.addClass(pages['page' + oldPage], 'fn-hide');
                sb.removeClass(pages['page' + data.page], 'fn-hide');
                this.renderPage();
                oldPage = data.page;
            } else {
                this.search();
            }

            el = document.documentElement.scrollTop > 0 ? document.documentElement : document.body;
            sb.animate(el, {
                scrollTop: sb.region('searchBar').top
            }, {
                duration: 800
            });
        },
        success: function (res) {
            isLocked = false;
            totalPage = res.data.totalPage;
            this.renderSuggest(res);
            this.renderPage();
        },
        failure: function (res) {
            isLocked = false;
            suggestHolder.innerHTML = '没有匹配的建议';
            sb.addClass(pageHolder, 'fn-hide');
        },
        showFilter: function () { //显示搜索面板
            sb.slideDown(fm);
        },
        hideFilter: function () { //隐藏搜索面板
            sb.slideUp(fm);
        },
        setSearchType: function (key, value) { //设置搜索类型
            data.stype = key;
            data.uid = uid;
            alias.stype = value;
        },
        clearSearchType: function () { //清除搜索类型
            data.stype = '';
            data.uid = '';
            alias.stype = '';
        },
        setProdLine: function () {
            var el = sb.query('#filterIssues .current')[0],
                problemId, productId;

            if (el) {
                problemId = sb.attr(el, 'data-problemId');
                productId = sb.attr(el, 'data-productId');

                if (problemId) {
                    this.setProblemId(problemId, el.innerHTML);
                } else {
                    this.setProductId(productId, el.innerHTML);
                }
            } else {
                this.setSuggestAll();
            }
        },
        setProductId: function (id, name) { //切换产品线
            data.product_id = id;
            data.problem_id = '';

            alias.product_id = name;
            alias.problem_id = '';
        },
        setProblemId: function (id, name) { //切换问题点
            data.product_id = '';
            data.problem_id = id;

            alias.product_id = '';
            alias.problem_id = name;
        },
        getTagsByIssueId: function (id) { //根据问题点获取标签列表
            app.Ajax.alipay({
                url: 'index.php?r=tag/list',
                success: function (res) {
                    var html = app.Template.render('filter-tags', {
                        tags: res.data
                    });
                    sb.get('filterTag').innerHTML = html;
                },
                failure: function (res) {
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '请求标签错误',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: {
                    id: id
                }
            });
            self.clearTag();
        },
        clearTag: function () { //清空标签
            sb.get('filterTag').innerHTML = '';
            data.tag = alias.tag = '';
        },
        setSuggestAll: function () { //全部建议
            data.product_id = '';
            data.problem_id = '';

            alias.product_id = '';
            alias.problem_id = '';
        },
        setState: function (v, name) { //设置状态
            var el = sb.query('#filterState .current')[0];

            if (el) {
                data.state = sb.attr(el, 'data-state');
                alias.state = sb.isEmpty(sb.attr(el, 'data-state')) ? '' : el.innerHTML;
            }
        },
        setTag: function () { //设置标签
            var el = sb.query('#filterTag .current')[0];

            if (el) {
                data.tag = sb.attr(el, 'data-tag');
                alias.tag = sb.isEmpty(sb.attr(el, 'data-tag')) ? '' : el.innerHTML;
            }
        },
        setUser: function () { //用户
            alias.user = data.user = sb.trim(sb.get('filterUser').value);
        },
        setKey: function () { //关键字
            alias.key = data.key = sb.trim(sb.get('filterKey').value);
        },
        setDate: function () { //日间段
            var reg = /^\d{4}\.\d{2}.\d{2}$/,
                start = sb.trim(sb.get('filterDateStart').value),
                end = sb.trim(sb.get('filterDateEnd').value);

            alias.date_start = data.date_start = reg.test(start) ? start : '';
            alias.date_end = data.date_end = reg.test(end) ? end : '';
        },
        delDate: function () { //删除时间
            alias.date_start = data.date_start = '';
            alias.date_end = data.date_end = '';
        },
        delField: function (key) { //清空
            alias[key] = data[key] = '';
        },
        delState: function () {
            var p = sb.get('filterState');

            sb.removeClass(sb.query('.current', p)[0], 'current');
            sb.addClass(sb.first(p), 'current');
        },
        delTag: function () {
            var p = sb.get('filterTag');
            sb.removeClass(sb.query('.current', p)[0], 'current');
            sb.addClass(sb.first(p), 'current');
        },
        delProd: function (key) {
            sb.removeClass(sb.query('#filterIssues .current')[0], 'current');
            sb.addClass('issueAll', 'current');
        },
        delStype: function () {
            this.clearSearchType();
            sb.removeClass('searchWrapper', 'search-bar-favor');
            sb.each(sb.query('#navMenu a'), function (item, index) {
                if (index > 0) {
                    sb.removeClass(item, 'current');
                } else {
                    sb.addClass(item, 'current');
                }
            });
        },
        delSearch: function (key) { //删除搜索条件
            switch (key) {
            case 'date':
                this.delDate();
                break;
            case 'stype':
                this.delStype();
                break;
            default:
                this.delField(key);
                break;
            }
            this.handle();
        },
        resetForm: function () { //清空搜索项
            this.delProd(); //清空产品线
            this.delTag(); //清空标签
            this.delState(); //清空状态
            fm.reset();
        },
        reset: function () { //重置搜索项
            pages = {};
            data.page = oldPage = 1;
            suggestHolder.innerHTML = '';
        },
        renderCondition: function () { //渲染搜索条件
            var sequence = ['product_id', 'problem_id', 'state', 'tag', 'user', 'key'],
                html = [];

            if (alias.stype) {

                html.push('<a class="search-item" href="#"><span data-key="stype" class="search-item-txt">' + alias.stype + '<em class="search-item-del" title="删除">X</em></span></a>');
            }

            sb.each(sequence, function (name) {
                if (alias[name]) {
                    html.push('<a class="search-item" href="#"><span data-key="' + name + '" class="search-item-txt">' + alias[name] + '<em class="search-item-del" title="删除">X</em></span></a>');
                }
            });
            if (alias.date_start || alias.date_end) {
                html.push(this.formatDate());
            }
            if (html.length === 0) {
                html.push('<a class="search-item" href="#"><span class="search-item-txt">全部建议</span></a>');
            }
            sb.get('searchBar').innerHTML = html.join('');
        },
        formatDate: function () { //生成时间段
            var ret = '<a class="search-item" href="#"><span data-key="date" class="search-item-txt">';
            if (alias.date_start && alias.date_end) {
                ret += alias.date_start + '-' + alias.date_end;
            } else if (alias.date_start) {
                ret += alias.date_start + '-';
            } else {
                ret += '-' + alias.date_end;
            }
            ret += '<em class="search-item-del" title="删除">X</em></span></a>';
            return ret;
        },
        renderSuggest: function (res) { //渲染建议
            var cp = data.page;

            app.Communication.notify({
                type: 'voice-list-render',
                data: {
                    params: res.data,
                    search: data.key,
                    callback: function (html) {
                        var n = sb.create(html);
                        pages['page' + cp] = n;

                        if (oldPage != cp) {
                            sb.addClass(pages['page' + oldPage], 'fn-hide');
                        }
                        oldPage = cp;
                        suggestHolder.appendChild(n);
                    }
                }
            });

        },
        renderPage: function () { //渲染分页
            var half = 3,
                i, html = '',
                cp = parseInt(data.page, 10);

            if (totalPage <= 1) {
                sb.addClass(pageHolder, 'fn-hide');
                return;
            } else {
                sb.removeClass(pageHolder, 'fn-hide');
            }

            if (cp > half + 2) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="1"><span class="ui-round-btn-text">1</span></a><span class="ellipsis">...</span>';
                for (i = cp - half; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            } else {
                for (i = 1; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            html += '<span class="cp" data-page="' + cp + '">' + cp + '</span>';

            if (cp + half + 1 < totalPage) {
                for (i = cp + 1; i <= cp + half; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
                html += '<span class="ellipsis">...</span>';
            } else {
                for (i = cp + 1; i < totalPage; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            if (cp < totalPage) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + totalPage + '"><span class="ui-round-btn-text">' + totalPage + '</span></a>';
            }

            if (totalPage > 1) {
                html += '| 跳至<input type="text" class="txt" /> 页<span class="ui-round-btn ui-round-btn-mini"><input type="submit" class="ui-round-btn-text" value="Go" /></span>';
            }
            pageHolder.innerHTML = html;
        },
        implementPage: function () { //实现分页
            sb.addEvent(pageHolder, 'click', function (ev) {
                var el = sb.parent(sb.getTarget(ev));

                if (el.tagName.toLowerCase() == 'a') {
                    sb.preventDefault(ev);
                    data.page = parseInt(el.getAttribute('data-page'), 10) || 1;
                    self.jumpToPage();
                }
            });
            sb.addEvent(pageHolder, 'submit', function (ev) {
                var page = parseInt(sb.query('.txt', pageHolder)[0].value, 10);
                sb.preventDefault(ev);

                if (page && page <= totalPage) {
                    data.page = page;
                    self.jumpToPage();
                }
            });
        }
    };
});

//voice-event 绑定事件
app.register('voice-event', function (sb) {
    var self;

    return {
        init: function () {
            self = this;
            app.Communication.listen({
                type: 'bind-suggest',
                context: this,
                callback: this.distribution
            });
        },
        distribution: function (msg) {
            sb.addEvent(sb.get(msg.el), 'click', function (ev) {
                var target = sb.getTarget(ev);
                app.Communication.notify({
                    type: sb.attr(target, 'data-event'),
                    data: {
                        ev: ev
                    }
                });
            });
        }
    };
});

//voice-full-text 查看全文、收起全文
app.register('voice-full-text', function (sb) {

    return {
        init: function () {
            app.Communication.listen({
                type: 'voice-fold',
                context: this,
                callback: this.fold
            });
            app.Communication.listen({
                type: 'voice-expand',
                context: this,
                callback: this.expand
            });
        },
        fold: function (msg) { //收起全文
            var target = sb.getTarget(msg.ev),
                all = sb.parent(target),
                part = sb.prev(all);

            sb.show(part);
            sb.hide(all);
        },
        expand: function (msg) { //查看全文
            var target = sb.getTarget(msg.ev),
                part = sb.parent(target),
                all = sb.next(part);

            sb.show(all);
            sb.hide(part);
        }
    }
});

//voice-render 渲染建议，更新建议状态
app.register('voice-list-render', function (sb) {
    var states, key;

    return {
        init: function () {
            if (globalConfig.pageType === 'outer') { //外部端
                states = {
                    untreated: '未处理',
                    save: '已反馈',
                    Ignore: '已反馈',
                    demand: '已反馈'
                };
            } else {
                states = {
                    untreated: '未处理',
                    save: '已反馈',
                    Ignore: '已忽略',
                    demand: '转需求'
                };
            }


            app.Template.define('suggest-me', [ //外部端
            '<ul class="voice-list">', '#foreach($item in $list)', '<li id="suggest${item.suggestId}" class="voice-item" data-suggestId="${item.suggestId}" data-feedback="${item.feedback}">', '<div class="avatar-wrapper">', '#if(${item.anonymity_img})', '<img class="voice-avatar" src="${item.anonymity_img}" />', '#else', '<img class="voice-avatar" src="https://tfsimg.alipay.com/images/partner/images/partner/T1IVXXXb0bXXXXXXXX" />', '#end', '</div>', '<h4 class="voice-title">${item.title}</h4>', '<div class="voice-info">', '#if(${item.images})', '<span class="voice-annex" title="图片" data-images="${item.images}" data-event="voice-images">图片</span>', '#end', '<span class="voice-date">${item.date}</span>', '</div>', '<div class="voice-auth">由 <span class="voice-person">${item.person}</span> 提交到：<span class="voice-prod">${item.problem_name}</span></div>', '#macro(ellipsisCnt ${item.content})', '<div class="voice-meta">', '<span class="state ${item.innerstate}">#macro(showState ${item.innerstate})</span>', '#if(${item.feedback} > 0)', '<a href="#" data-event="feedback-view">反馈(1)</a>', '#end', '</div>', '</li>', '#end', '</ul>']);
            app.Template.define('suggest-list', [ //内部端
            '<ul class="voice-list">', '#foreach($item in $list)', '<li id="suggest${item.suggestId}" class="voice-item" data-productId="${item.product_id}" data-problemId="${item.problem_id}" data-suggestId="${item.suggestId}" data-feedback="${item.feedback}">', '<div class="avatar-wrapper">', '#if(${item.anonymity_img})', '<img class="voice-avatar" src="${item.anonymity_img}" />', '#else', '<img class="voice-avatar" src="https://tfsimg.alipay.com/images/partner/images/partner/T1IVXXXb0bXXXXXXXX" />', '#end', '<div class="person-wrapper">', '<div class="person-bg">', '<ul class="person-info">', '#if(${item.username})', '<li>${item.username}</li>', '#end', '#if(${item.contact})', '<li>${item.contact}</li>', '#end', '</ul>', '</div>', '<span class="person-arrow">arrow</span>', '</div>', '</div>', '<h4 class="voice-title"><a href="${item.url}">#macro(ellipsisTitle ${item.title})</a></h4>', '<div class="voice-info">', '#if(${item.images})', '<span class="voice-annex" title="建议包含图片" data-images="${item.images}" data-event="voice-images">图片</span>', '#end', '<span class="voice-date">${item.date}</span>', '</div>', '#if(${item.isCollect}>0)', '<a href="#" class="voice-favor voice-collected" data-event="voice-favor" title="取消收藏">收藏/取消收藏</a>', '#else', '<a href="#" class="voice-favor" data-event="voice-favor" title="加入收藏">收藏/取消收藏</a>', '#end', '<div class="voice-auth">由 <span class="voice-person">${item.person}</span> 提交到：<span class="voice-prod">${item.problem_name}</span></div>', '#macro(ellipsisCnt ${item.content})', '<div class="voice-meta voice-meta-${item.innerstate}">', '<span class="state ${item.innerstate}">#macro(showState ${item.innerstate})</span>', '#if(${item.feedback} == 0)', '<a href="#" class="feedback" data-event="feedback-view" title="用户将在消息中心收到您的答复">反馈</a>', '#else', '<a href="#" class="feedback" data-event="feedback-view" title="用户将在消息中心收到您的答复">反馈(1)</a>', '#end', '<a href="#" class="ignore" data-event="voice-ignore" title="用户将收到系统自动生成的回复">忽略</a>', '#if(${item.tags} > 0)', '<a href="#" class="tag" data-event="voice-tag" title="为产品的建议进行细分">标签(${item.tags})</a>', '#else', '<a href="#" class="tag" data-event="voice-tag" title="为产品的建议进行细分">标签</a>', '#end', '#if(${item.forward} > 0)', '<a href="#" class="forward" data-event="voice-forward" data-forward="${item.forward}" title="将建议转到其他地方">转发(${item.forward})</a>', '#else', '<a href="#" class="forward" data-event="voice-forward" data-forward="0" title="将建议转到其他地方">转发</a>', '#end', '<a href="#" class="mail fn-hide" data-event="voice-mail" title="通过邮件把建议发送到其他小二">邮件</a>', '<a href="#" class="demand" data-event="jira-login" title="把有价值的建议直接转到需求池">需求</a>', '</div>', '</li>', '#end', '</ul>']);
            app.Communication.listen({
                type: 'voice-state-update',
                context: this,
                callback: this.updateState
            });
            app.Communication.listen({ //渲染内部端建议列表
                type: 'voice-list-render',
                context: this,
                callback: this.render
            });
            app.Communication.listen({ //渲染外部端建议列表
                type: 'voice-list-render-outer',
                context: this,
                callback: this.renderOuter
            });
        },
        render: function (msg) { //渲染内部端建议列表
            var html, p = msg.params;

            key = msg.search; //ellipsisCnt中使用,
            p.ellipsisTitle = this.ellipsisTitle; //建议标题宏
            p.ellipsisCnt = this.ellipsisCnt; //查看全文宏
            p.showState = this.showState;
            html = app.Template.render('suggest-list', p);
            msg.callback(html);
        },
        renderOuter: function (msg) {
            var html, p = msg.params;

            search = false; //外部端没有关键字搜索
            p.ellipsisCnt = this.ellipsisCnt; //查看全文宏
            p.showState = this.showState;
            html = app.Template.render('suggest-me', p);
            msg.callback(html);
        },
        showState: function (state) { //建议状态转换成中文
            return states[state] || '未处理';
        },
        ellipsisCnt: function (str) { //生成查看全文
            var content = str,
                all = str,
                html = [];

            if (key !== '') { //包含关键字搜索
                reg = /<[^>]*>/g;
                all = content = content.replace(reg, ''); //过滤内容中的html串
                reg = new RegExp(key, 'gim');
                all = all.replace(reg, function (a) {
                    return '<span class="keyword">' + a + '</span>';
                });
            }

            if (content.length > 200) {
                content = content.slice(0, 200);
                if (key !== '') {
                    content = content.replace(reg, function (a) {
                        return '<span class="keyword">' + a + '</span>';
                    });
                }
                html.push('<div class="voice-content">' + content + '.... <a href="javascript:;" data-event="voice-expand">查看全文↓</a></div>');
                html.push('<div class="voice-content-all fn-hide">' + all + ' <a href="javascript:;" data-event="voice-fold">收起全文↑</a></div>');
            } else {
                html.push('<div class="voice-content">' + all + '</div>');
            }

            return html.join('');
        },
        ellipsisTitle: function (str) {
            var title = str;

            if (key != '') {
                reg = /<[^>]*>/g;
                title = title.replace(reg, ''); //过滤内容中的html串
                reg = new RegExp(key, 'gim');
                title = title.replace(reg, function (a) {
                    return '<span class="keyword">' + a + '</span>';
                });
            }
            return title;
        },
        updateState: function (msg) { //更新建议状态
            var li = sb.get('suggest' + msg.suggestId),
                meta = sb.query('.voice-meta', li)[0],
                feedback = sb.query('.feedback', li)[0],
                span = sb.query('.state', li)[0];
            if (span) { //修改显示状态文案
                span.className = 'state ' + msg.state;
                span.innerHTML = states[msg.state];
            }

            switch (msg.state) {
            case 'Ignore':
                //忽略自动反馈
                sb.attr(li, 'data-feedback', '1');
                feedback.innerHTML = '反馈(1)';
                sb.addClass(meta, 'voice-meta-Ignore');
                break;
            case 'save':
                sb.attr(li, 'data-feedback', '1');
                feedback.innerHTML = '反馈(1)';
                sb.addClass(meta, 'voice-meta-save');
                break;
            case 'demand':
                if (msg.isModify) { //转需求时，是否反馈过
                    sb.attr(li, 'data-feedback', '1');
                    feedback.innerHTML = '反馈(1)';
                }
                sb.addClass(meta, 'voice-meta-demand');
                break;
            default:
                break;
            }
        }
    };
});

//voice-ignore 忽略建议
app.register('voice-ignore', function (sb) {
    var self, target, suggestId;

    return {
        init: function () {
            self = this;
            app.Communication.listen({
                type: 'voice-ignore',
                context: this,
                callback: this.post
            });
        },
        post: function (msg) { //post数据
            var li;
            sb.preventDefault(msg.ev);
            target = sb.getTarget(msg.ev);
            li = sb.parent(target, 'li');
            suggestId = sb.attr(li, 'data-suggestId');

            app.Ajax.alipay({
                url: 'index.php?r=voice/ignore',
                success: function (res) {
                    self.success(res);
                },
                failure: function (res) {
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '忽略失败',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: {
                    voice_id: suggestId
                }
            });
        },
        success: function (res) {
            app.Communication.notify({ //更新建议状态
                type: 'voice-state-update',
                data: {
                    state: 'Ignore',
                    suggestId: suggestId
                }
            });
        }
    };
});

//feeback-view 查看反馈
app.register('feedback-view', function (sb) {
    var self, li, cfg = {};

    return {
        init: function () {
            self = this;
            app.Communication.listen({ //监听查看反馈
                type: 'feedback-view',
                context: this,
                callback: this.handle
            });
            app.Communication.listen({ //监听反馈窗口repaint
                type: 'feedback-refresh',
                context: this,
                callback: this.refresh
            });
            app.Communication.listen({ //监听反馈模板repaint
                type: 'reply-refresh',
                context: this,
                callback: this.refreshReply
            });
            app.Communication.listen({
                type: 'feedback-edit',
                context: this,
                callback: this.handleEdit
            });

            if (globalConfig.pageType !== 'outer') { //内部端
                app.Template.define('feedback-template', [ //反馈页面
                '<div class="feedback-wrapper">', '<dl class="feedback-bg">', '#if(${feedback})', '<dt class="feedback-person">${feedback.feedback_person}：</dt>', '<dd>', '<div class="feedback-content">${feedback.feedback_content}</div>', '<span class="feedback-date">${feedback.feedback_date}</span>', '<a href="#" class="feedback-edit" data-event="feedback-edit">编辑</a>', '</dd>', '<dd class="reply-wrapper fn-hide">', '#else', '<dd class="reply-wrapper">', '#end', '<div class="reply-cnt fn-clear">', '<div class="reply-swfupload fn-left"><span id="swfUpload${suggestId}"></span></div>', '<div class="reply-template fn-left">', '#foreach($reply in $replyTemplate)', '<a href="#" data-event="template-get" data-index="${velocityCount}" data-replyId="${reply.name}">回复模板[${velocityCount}]<span title="删除" data-event="template-del">X</span></a>', '#end', '</div>', '</div>', '<textarea class="reply-content"></textarea>', '<div class="fm-explain"></div>', '<div id="swfImageHolder${suggestId}" class="images-wrapper"></div>', '<div class="reply-action">', '<span class="ui-round-btn ui-round-btn-mini"><input type="button" class="ui-round-btn-text" data-event="feedback-add" data-suggestId="${suggestId}" data-feedback="${isFeedback}" value="回 复" /></span>', '<a href="#" class="reply-save" data-event="template-add">存为模板</a>', '</div>', '</dd>', '</dl>', '<span class="feedback-arrow">arrow</span>', '</div>']);
            } else { //外部端
                app.Template.define('feedback-template', [ //反馈页面
                '<div class="feedback-wrapper">', '<dl class="feedback-bg">', '<dt class="feedback-person">${feedback.feedback_person}：</dt>', '<dd>', '<div class="feedback-content">${feedback.feedback_content}</div>', '<span class="feedback-date">${feedback.feedback_date}</span>', '</dd>', '</dl>', '<span class="feedback-arrow">arrow</span>', '</div>']);
            }

            app.Template.define('reply-template', [ //反馈模板
            '#foreach($reply in $replyTemplate)', '<a href="#" data-event="template-get" data-index="${velocityCount}" data-replyId="${reply.name}" seed="reply-template">回复模板[${velocityCount}]<span title="删除" data-event="template-del">X</span></a>', '#end']);
        },
        handleEdit: function (msg) { //编辑反馈
            var target = sb.getTarget(msg.ev),
                feedWrapper = sb.parent(target, '.feedback-wrapper'),
                feedCnt = sb.query('.feedback-content', feedWrapper)[0],
                replyWrapper = sb.query('.reply-wrapper', feedWrapper)[0],
                replyCnt = sb.query('.reply-content', feedWrapper)[0];

            sb.preventDefault(msg.ev);
            replyCnt.value = feedCnt.innerHTML;
            sb.show(replyWrapper);

        },
        handle: function (msg) {
            var fb;
            sb.preventDefault(msg.ev);
            cfg = {};
            li = sb.parent(sb.getTarget(msg.ev), 'li');
            cfg.suggestId = sb.attr(li, 'data-suggestId');
            cfg.isFeedback = sb.attr(li, 'data-feedback');

            fb = sb.query('#suggest' + cfg.suggestId + ' .feedback-wrapper')[0];
            if (fb) { //检测是否已经渲染
                sb.toggleClass(fb, 'fn-hide');
            } else {
                if (parseInt(cfg.isFeedback, 10) > 0) { //已经反馈
                    this.getFeedback();
                } else {
                    this.render();
                }
            }
        },
        getFeedback: function () { //请求反馈信息
            app.Ajax.alipay({
                url: 'index.php?r=feedback/gets',
                success: function (res) {
                    cfg.feedback = res.data;
                    self.render();
                },
                failure: function (res) {
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '错误',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: {
                    voice_id: cfg.suggestId
                }
            });
        },
        refresh: function (msg) { //刷新反馈页面
            sb.extend(cfg, msg); //更新数据
            li = sb.get('suggest' + cfg.suggestId);
            this.render();
        },
        refreshReply: function (msg) { //刷新反馈模板
            var n, fb;

            cfg.suggestId = msg.suggestId;
            n = app.Template.render('reply-template', msg);
            fb = sb.query('#suggest' + cfg.suggestId + ' .reply-template')[0];
            if (fb) {
                fb.innerHTML = n;
            }
        },
        render: function () { //生成反馈页面
            if (globalConfig.pageType !== 'outer') { //内部端
                this.render = function () {
                    app.Communication.notify({ //获取反馈模板
                        type: 'template-load',
                        data: {
                            callback: function (templates) {
                                cfg.replyTemplate = templates;
                                var n = app.Template.render('feedback-template', cfg),
                                    fb = sb.query('#suggest' + cfg.suggestId + ' .feedback-wrapper')[0];
                                if (fb) {
                                    li.removeChild(fb);
                                }
                                li.appendChild(sb.create(n));
                                self.bindSwfUpload();
                            }
                        }
                    });
                };
            } else {
                this.render = function () {
                    var n;
                    if (parseInt(cfg.isFeedback, 10) > 0) {
                        n = app.Template.render('feedback-template', cfg);
                        li.appendChild(sb.create(n));
                    }
                };
            }
            this.render();
        },
        bindSwfUpload: function () { //绑定上传反馈图片事件
            var swu, config = globalConfig.upload;
            config.button_text = "";
            config.button_placeholder_id = 'swfUpload' + cfg.suggestId;
            swu = new SWFUpload(config);
            swu.imagesContainer = 'swfImageHolder' + cfg.suggestId;
            swu.category = 'Feedback';
            swu.maxFiles = globalConfig.upload.maxFiles; //最大上传图片
            swu.uploadFiles = 0; //已经上传图片数目
        }
    };
});

//feedback-add 添加/编辑反馈
app.register('feedback-add', function (sb) {
    var self, target, type, suggestId, isFeedback;
    return {
        init: function () {
            self = this;
            app.Communication.listen({
                type: 'feedback-add',
                context: this,
                callback: this.handle
            });
        },
        handle: function (msg) {
            target = sb.getTarget(msg.ev);
            suggestId = sb.attr(target, 'data-suggestId');
            isFeedback = sb.attr(target, 'data-feedback');
            type = parseInt(isFeedback, 10) >= 1 ? 'edit' : 'add';
            this.addFeedback();
        },
        validate: function (cnt) { //添加、编辑反馈时进行校验
            var flag = true;

            if (sb.isEmpty(cnt.value)) {
                flag = false;
                sb.showError(cnt, '反馈内容不能为空');
            }
            if (cnt.value.length > 400) {
                flag = false;
                sb.showError(cnt, '反馈内容不能大于400字');
            }
            return flag;
        },
        addFeedback: function () {
            var cnt = this.getFeedbackCnt();

            if (this.validate(cnt)) {
                app.Ajax.alipay({
                    url: 'index.php?r=feedback/add',
                    success: function (res) {
                        app.Communication.notify({ //显示反馈信息
                            type: 'feedback-refresh',
                            data: {
                                feedback: res.data,
                                //返回的数据字段名称需要pylu修改
                                suggestId: suggestId,
                                isFeedback: isFeedback
                            }
                        });
                        if (type === 'add') {
                            app.Communication.notify({ //更新建议状态
                                type: 'voice-state-update',
                                data: {
                                    state: 'save',
                                    suggestId: suggestId
                                }
                            });
                        }
                    },
                    failure: function (res) {
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '错误',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        voice_id: suggestId,
                        //建议id
                        content: sb.trim(cnt.value),
                        //反馈内容
                        attachment_id: '',
                        //反馈图片
                        type: type //添加|编辑
                    }
                });
            }
        },
        getFeedbackCnt: function () { //获取反馈内容
            var p = sb.parent(target, 'dd'),
                cnt = sb.query('.reply-content', p)[0];

            return cnt;
        }
    }
});

//feedback-template 反馈模板管理
app.register('feedback-template', function (sb) {
    var self, data, remain, suggestId; //可用name
    return {
        init: function () {
            self = this;
            app.Communication.listen({ //添加模板
                type: 'template-add',
                context: this,
                callback: function (msg) {
                    var p = sb.parent(sb.getTarget(msg.ev), '.reply-wrapper'),
                        txt = sb.query('.reply-content', p)[0];

                    sb.preventDefault(msg.ev);
                    if (txt && !sb.isEmpty(txt.value)) {
                        suggestId = sb.attr(sb.parent(p, 'li.voice-item'), 'data-suggestId');
                        self.add(sb.trim(txt.value));
                    }
                }
            });
            app.Communication.listen({ //删除模板
                type: 'template-del',
                context: this,
                callback: function (msg) {
                    var a = sb.parent(sb.getTarget(msg.ev)),
                        index = sb.attr(a, 'data-index'),
                        replyId = sb.attr(a, 'data-replyId');
                    sb.preventDefault(msg.ev);
                    suggestId = sb.attr(sb.parent(a, 'li.voice-item'), 'data-suggestId');
                    self.del(index, replyId);
                }
            });
            app.Communication.listen({ //返回模板
                type: 'template-load',
                context: this,
                callback: function (msg) {
                    msg.callback(data);
                }
            });
            app.Communication.listen({ //使用模板
                type: 'template-get',
                context: this,
                callback: this.get
            });
            this.load();
        },
        load: function (msg) { //读取本地模板
            var n, v;
            data = [];
            remain = [];
            for (var i = 1; i <= 3; i++) {
                n = 'reply' + i;
                v = sb.userData(n);
                if (v) {
                    data.push({
                        name: n,
                        value: v
                    })
                } else {
                    remain.push(n);
                }
            }
        },
        add: function (v) { //存为反馈模板
            var n;
            if (remain.length > 0) {
                n = remain.pop();
                data.push({
                    name: n,
                    value: v
                });
                sb.userData(n, v);
            } else {
                app.Communication.notify({
                    type: 'tip-show',
                    data: {
                        title: '保存反馈模板失败',
                        msg: '您的反馈模板数量已达上限，请先删除一个再添加新的模板',
                        cls: 'warn'
                    }
                })
            }
            //重新渲染反馈模板
            this.refreshReply();
        },
        del: function (index, name) { //删除反馈模板
            index = index - 1;
            if (remain.join('').indexOf(name) === -1) {
                data.splice(index, 1);
                sb.removeData(name);
                remain.push(name);
            }

            //重新渲染反馈模板
            this.refreshReply();
        },
        get: function (msg) { //显示模板内容
            var target = sb.getTarget(msg.ev),
                index = sb.attr(target, 'data-index') - 1;
            wrapper = sb.parent(target, '.reply-wrapper'), cnt = sb.query('.reply-content', wrapper)[0];

            sb.preventDefault(msg.ev);

            if (data[index]) {
                cnt.value = data[index].value;
            } else {
                app.Communication.notify({
                    type: 'tip-show',
                    data: {
                        title: '错误',
                        msg: '反馈模板可能已经被删除',
                        cls: 'error'
                    }
                })
                suggestId = sb.attr(sb.parent(wrapper, 'li.voice-item'), 'data-suggestId');
                this.refreshReply();
            }
        },
        refreshReply: function () { //重绘反馈模板
            app.Communication.notify({
                type: 'reply-refresh',
                data: {
                    replyTemplate: data,
                    suggestId: suggestId
                }
            });
        }
    }
});

//voice-images 展现图片
app.register('voice-images', function (sb) {

    return {
        init: function () {
            app.Template.define('album-template', ['<div class="photo-wrapper">', '<div>', '#foreach($img in $album)', '#if(${velocityCount} == 1)', '<div class="photo-div" data-show="1"><a href="index.php?r=attachment/ViewPicture&id=${img.id}" target="_blank"><img src="index.php?r=attachment/ViewPicture&id=${img.id}" class="photo-big" /></a></div>', '#else', '<div class="photo-div" style="display:none;" data-show="0"><a href="index.php?r=attachment/ViewPicture&id=${img.id}" target="_blank"><img src="index.php?r=attachment/ViewPicture&id=${img.id}" class="photo-big" /></a></div>', '#end', '#end', '</div>', '<ul class="photo-list">', '#foreach($img in $album)', '#if(${velocityCount} == 1)', '<li><a href="javascript:;" class="photo-item"><img src="index.php?r=attachment/ViewPicture&id=${img.id}" class="photo-thumb" data-event="album-wheel" data-index="${velocityCount}" /></a></li>', '#else', '<li><a href="javascript:;" class="photo-item"><img src="index.php?r=attachment/ViewPicture&id=${img.id}" class="photo-thumb" data-event="album-wheel" data-index="${velocityCount}" /></a></li>', '#end', '#end', '</ul>', '</div>']);

            app.Communication.listen({
                type: 'voice-images',
                context: this,
                callback: this.handle
            });
            app.Communication.listen({
                type: 'album-wheel',
                context: this,
                callback: this.toggleAlbum
            });
        },
        handle: function (msg) { //初始化图片显示
            var target = sb.getTarget(msg.ev),
                li = sb.parent(target, 'li'),
                rel = sb.query('.voice-meta', li)[0],
                album = sb.query('.photo-wrapper', li)[0],
                html, n, imgs = [];

            sb.preventDefault(msg.ev);

            sb.each(sb.attr(target, 'data-images').split('|'), function (id) {
                imgs.push({
                    id: id
                });
            });

            if (album) {
                sb.toggleClass(album, 'fn-hide');
            } else {
                html = app.Template.render('album-template', {
                    album: imgs
                });
                if (rel) {
                    sb.insertBefore(rel, html);
                } else {
                    li.appendChild(sb.create(html));
                }

            }
        },
        toggleAlbum: function (msg) {
            var target = sb.getTarget(msg.ev),
                album = sb.parent(target, 'div.photo-wrapper'),
                arr = sb.query('.photo-div', album),
                index = parseInt(sb.attr(target, 'data-index'), 10) - 1,
                isShow = sb.attr(arr[index], 'data-show');

            sb.preventDefault(msg.ev);

            sb.each(arr, function (div) {
                sb.hide(div);
                sb.attr(div, 'data-show', '0');
            });
            if (isShow === '0') { //显示
                sb.fadeIn(arr[index]);
                sb.attr(arr[index], 'data-show', '1');
            } else {
                sb.toggleClass(album, 'fn-hide');
                sb.fadeIn(arr[index]);
            }

        }
    };
});

//voice-forward module 转发问题点
app.register('voice-forward', function (sb) {
    var template, xbox, cfg, issues;

    template = ['<div id="xboxTransmit" class="xbox-transmit fn-hide">', '<div id="issuesListTransmit"></div>', '</div>'];
    app.Template.define('forward-template', [ //xbox问题点模板
    '<dl class="prodissue-dl">', '<dt class="prodissue-class">${title}</dt>', '<dd class="prodissue-list" data-prodId="${id}">', '#foreach($issue in $child)', '<a href="#" data-issueId="${issue.id}" class="prodissue-item">${issue.title}</a>', '#end', '</dd>', '</dl>']);

    return {
        init: function () {
            document.body.appendChild(sb.create(template.join('')));
            issues = sb.get('issuesListTransmit');
            app.Communication.notify({
                type: 'create-issues',
                data: {
                    template: 'forward-template',
                    el: issues
                }
            });
            app.Communication.listen({ //监听显示转发问题点事件
                type: 'voice-forward',
                context: this,
                callback: this.show
            });
            xbox = sb.domBox({
                width: 680,
                id: 'xboxTransmit',
                title: '选择问题点'
            });
            this.bind();
        },
        bind: function () {
            var self = this;
            sb.addEvent(issues, 'click', function (ev) {
                var target = sb.getTarget(ev);
                sb.preventDefault(ev);
                cfg.problem_id = sb.attr(target, 'data-issueId');
                cfg.product_id = sb.attr(target.parentNode, 'data-prodId');
                cfg.issue = target.innerHTML;

                if (cfg.problem_id && cfg.product_id) {
                    app.Ajax.alipay({
                        url: 'index.php?r=voiceInner/forwardVoice',
                        data: {
                            voice_id: cfg.voice_id,
                            problem_id: cfg.problem_id,
                            product_id: cfg.product_id
                        },
                        success: self.success,
                        failure: self.failure
                    });
                }
            });
        },
        show: function (msg) {
            var el = sb.getTarget(msg.ev),
                id = sb.attr(sb.parent(el, 'li.voice-item'), 'data-suggestId');

            sb.preventDefault(msg.ev);
            cfg = {
                target: el,
                voice_id: id
            };
            xbox.show();
        },
        success: function (res) { //转发成功回调
            var issueName = sb.query('#suggest' + cfg.voice_id + ' .voice-prod')[0],
                num = parseInt(sb.attr(cfg.target, 'data-forward'), 10) + 1;

            issueName.innerHTML = cfg.issue;
            cfg.target.innerHTML = '转发(' + num + ')';
            sb.attr(cfg.target, 'data-forward', num);

            xbox.hide();
            app.Communication.notify({
                type: 'tip-show',
                data: {
                    title: '成功',
                    msg: res.msg,
                    cls: 'success'
                }
            });
        },
        failure: function (res) { //转发失败回调
            xbox.hide();
            app.Communication.notify({
                type: 'tip-show',
                data: {
                    title: '错误',
                    msg: res.msg,
                    cls: 'error'
                }
            });
        }
    };
});

//voice-tags 建议标签
app.register('voice-tags', function (sb) {
    var self, tagsCnt, xbox, isLocked = false,
        //安全锁
        cfg = {
            MAX: 5 //建议打标签数字	
        };

    return {
        init: function () {
            self = this;
            document.body.appendChild(sb.create('<div id="xboxTags" class="fn-hide"><dl id="tagsCnt" class="tags-frequent"></dl><div class="tags-action"><span class="ui-round-btn"><input id="tagsAdd" type="button" class="ui-round-btn-text" value="添加标签" /></span></div></div>'));
            tagsCnt = sb.get('tagsCnt');
            xbox = sb.domBox({
                title: '贴标签',
                width: 435,
                id: 'xboxTags',
                beforeHide: function () {
                    self.updateTagsNum();
                }
            });

            app.Communication.listen({ //监听标签事件
                type: 'voice-tag',
                context: this,
                callback: this.handle
            });
            app.Template.define('tags-template', [ //标签模板
            '#if(${voice_tag}.length > 0)', '<dt class="tags-dt">建议已有标签</dt>', '<dd class="tags-dd">', '#foreach($tag in $voice_tag)', '<a href="#">${tag.name}<span data-tagId="${tag.id}" data-event="tags-del" title="删除标签">X</span></a>', '#end', '</dd>', '#end', '<dt class="tags-explain">多个标签请用英文逗号隔开，每条建议最多可添加5个标签</dt>', '<dd class="tags-txt">', '<textarea id="txtTags" class="tags-cnt"></textarea>', '<div id="tagsError" class="fm-explain"></div>', '</dd>', '#if(${issue_tag}.length > 0)', '<dt class="tags-dt">问题点常用标签</dt>', '<dd class="tags-dd">', '#foreach($tag in $issue_tag)', '<a href="#" data-event="tags-set">${tag.name}</a>', '#end', '</dd>', '#end']);
            this.bind();
        },
        bind: function () {
            sb.addEvent('tagsAdd', 'click', function () { //添加标签
                if (self.validate()) {
                    self.addTags();
                }
            });
            sb.addEvent('tagsCnt', 'click', function (ev) {
                var target = sb.getTarget(ev);
                switch (sb.attr(target, 'data-event')) {
                case 'tags-del':
                    //删除标签
                    sb.preventDefault(ev);
                    self.delTags(target);
                    break;
                case 'tags-set':
                    //使用
                    sb.preventDefault(ev);
                    self.useTags(target);
                    break;
                default:
                    break;
                }
            });
        },
        validate: function () { //添加标签时，进行校验
            var flag = true,
                tags, explain = sb.get('tagsError'),
                cnt = sb.get('txtTags'),
                txt = sb.trim(cnt.value);

            tags = txt.split(',');
            if (sb.isEmpty(txt)) {
                flag = false;
                sb.showError(cnt, '标签不能为空');
            }
            if (tags.length > cfg.remainCount) {
                flag = false;
                sb.showError(cnt, '您最多可以添加5个标签');
            }

            return flag;
        },
        useTags: function (target) {
            var cnt = sb.get('txtTags'),
                v = sb.trim(cnt.value);

            cnt.value = sb.isEmpty(v) ? target.innerHTML : v + ',' + target.innerHTML;
        },
        delTags: function (el) { //删除标签
            if (!isLocked) {
                isLocked = true;
                app.Ajax.alipay({
                    url: 'index.php?r=tag/del',
                    success: function (res) {
                        var a = el.parentNode;
                        a.parentNode.removeChild(a);
                        isLocked = false;
                        cfg.remainCount++;
                    },
                    failure: function (res) {
                        isLocked = false;
                        self.hide();
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '删除失败',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        voice_id: cfg.suggestId,
                        tag_id: sb.attr(el, 'data-tagId')
                    }
                });
            }
        },
        addTags: function () {
            var txt = sb.trim(sb.get('txtTags').value),
                num = txt.split(',').length;
            app.Ajax.alipay({
                url: 'index.php?r=tag/add',
                success: function (res) {
                    cfg.remainCount = cfg.remainCount - num;
                    self.hide();
                },
                failure: function (res) {
                    self.hide();
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '添加失败',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: {
                    product_id: cfg.productId,
                    //产品线
                    problem_id: cfg.problemId,
                    //问题点
                    voice_id: cfg.suggestId,
                    //建议id
                    tags: txt
                }
            });
        },
        handle: function (msg) {
            var target = sb.getTarget(msg.ev),
                li = sb.parent(target, 'li.voice-item');

            cfg.productId = sb.attr(li, 'data-productId');
            cfg.problemId = sb.attr(li, 'data-problemId');
            cfg.suggestId = sb.attr(li, 'data-suggestId');
            sb.preventDefault(msg.ev);

            app.Ajax.alipay({
                url: 'index.php?r=tag/get',
                success: function (res) {
                    cfg.remainCount = Math.max(cfg.MAX - res.data.voice_tag.length, 0); //剩余
                    self.render(res.data);
                },
                failure: function (res) {
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '获取标签错误',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: {
                    problem_id: cfg.problemId,
                    voice_id: cfg.suggestId
                }
            });
        },
        render: function (data) { //渲染巾标签模板
            var html = app.Template.render('tags-template', data);
            tagsCnt.innerHTML = html;
            this.show();
        },
        show: function () {
            xbox.show();
        },
        hide: function () {
            xbox.hide();
        },
        updateTagsNum: function () { //更新建议标签数
            var el = sb.query('#suggest' + cfg.suggestId + ' .tag')[0],
                num = cfg.MAX - cfg.remainCount;

            if (num === 0) {
                el.innerHTML = '标签';
            } else {
                el.innerHTML = '标签(' + num + ')';
            }
        }
    }
});

//issues-subscribe 订阅问题点
app.register('issues-subscribe', function (sb) {
    var self, xbox, issueListCnt, isLocked = false,
        //防止重复提交
        totalPage, oldPage = 1,
        pages = {},
        suggestHolder, pageHolder, subscribeHolder, data = {
            keyid: '',
            //默认请求全部已订阅问题点
            page: 1
        };

    app.Template.define('issues-list', [ //xbox问题点模板
    '<dl class="prodissue-dl">', '<dt class="prodissue-class">${title}</dt>', '<dd class="prodissue-list">', '#foreach($item in $child)', '<label class="prodissue-lb" for="issue-${item.id}" title="${item.title}"><input id="issue-${item.id}" type="checkbox" class="prodissue-chk" value="${item.id}" />${item.title}</label>', '#end', '</dd>', '</dl>']);

    return {
        init: function () {
            var template = ['<div id="xboxSubscribe" class="subscribe-xbox fn-hide">', '<div id="issueListCnt"></div>', '<div class="subscribe-action">', '<span class="ui-round-btn"><input id="btnAddIssueOk" type="button" class="ui-round-btn-text" value="确 定" /></span>', '<span class="ui-round-btn"><input id="btnAddIssueCancel" type="button" class="ui-round-btn-text" value="取 消" /></span>', '</div>', '</div>'];
            document.body.appendChild(sb.create(template.join('')));

            self = this;
            suggestHolder = sb.get('suggestHolder');
            pageHolder = sb.get('pageHolder');
            issueListCnt = sb.get('issueListCnt');
            subscribeHolder = sb.get('subscribeCnt');
            xbox = sb.domBox({
                title: '添加订阅',
                width: 680,
                id: 'xboxSubscribe',
                afterShow: function () {
                    self.renderXbox();
                }
            });
            this.bind();
            this.getBookedIssues();

            this.implementPage();
            this.query();

        },
        getBookedIssues: function () { //获取已经订阅的问题点
            var d = [];

            sb.each(sb.query('a', subscribeHolder), function (el) {
                d.push({
                    id: sb.attr(el, 'data-keyId'),
                    value: el.innerHTML
                });
            });
            this.setData(d);
        },
        bind: function () {
            app.Communication.notify({
                type: 'create-issues',
                data: {
                    template: 'issues-list',
                    el: issueListCnt
                }
            });
            app.Communication.notify({ //绑定事件:反馈、忽略、转发等
                type: 'bind-suggest',
                data: {
                    el: suggestHolder
                }
            });
            sb.addEvent('btnAddIssueCancel', 'click', function () { //关闭
                self.hide();
            });
            sb.addEvent('btnAddIssueOk', 'click', function () { //添加订阅
                var d = [],
                    data = self.getData();

                sb.each(data, function (item) {
                    d.push(item.id);
                });

                //stype: 2 来区分添加关键字
                app.Ajax.alipay({
                    url: 'index.php?r=subscribe/add',
                    success: function (res) {
                        self.setData(data);
                        self.setKeyId('');
                        self.reset(); //清空条件
                        self.renderBookedIssues();
                        self.query(); //查询全部
                    },
                    failure: function (res) {
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '错误',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        keyId: d.join('|'),
                        stype: 2
                    }
                });
                self.hide();
            });
            sb.addEvent('btnModSubscribe', 'click', function () {
                self.show();
            });
            sb.addEvent(subscribeHolder, 'click', function (ev) { //选择单个问题点
                var target = sb.getTarget(ev),
                    keyId = sb.attr(target, 'data-keyId');

                if (keyId) {
                    sb.preventDefault(ev);

                    if (keyId == data.keyid) {
                        sb.removeClass(target, 'current');
                        self.setKeyId('');
                    } else {
                        sb.removeClass('issueKey' + data.keyid, 'current');
                        sb.addClass(target, 'current');
                        self.setKeyId(keyId);
                    }
                    self.reset();
                    self.query();
                }

            });
        },
        reset: function () {
            data.page = oldPage = 1;
            pages = {};
            suggestHolder.innerHTML = '';
        },
        setKeyId: function (v) { //设置问题点id
            data.keyid = v;
        },
        show: function () {
            xbox.show();
        },
        hide: function () {
            xbox.hide();
        },
        renderXbox: function () {
            sb.each(sb.query('input', issueListCnt), function (chk) {
                chk.checked = false;
            });
            sb.each(this.issues, function (item) {
                sb.get('issue-' + item.id).checked = true;
            });
        },
        renderBookedIssues: function () { //渲染已经订阅的问题点
            var p = subscribeHolder.parentNode,
                html = [];

            sb.each(this.issues, function (o) {
                html.push('<a id="issueKey' + o.id + '" href="#" data-keyId="' + o.id + '">' + o.value + '</a>');
            });

            if (this.issues.length > 0) {
                sb.removeClass(p, 'subscribe-cnt-none');
            } else {
                sb.addClass(p, 'subscribe-cnt-none');
            }
            subscribeHolder.innerHTML = html.join('');
        },
        setData: function (d) {
            if (d) {
                this.issues = d;
            }
        },
        getData: function () {
            var d = [];
            sb.each(sb.query('input', issueListCnt), function (input) {
                if (input.checked) {
                    d.push({
                        id: input.value,
                        value: input.parentNode.title
                    });
                }
            });
            return d;
        },
        query: function () { //请求已订阅建议
            if (!isLocked) {
                isLocked = true;
                app.Ajax.alipay({
                    url: 'index.php?r=subscribe/problem',
                    success: function (res) {
                        self.success(res);
                    },
                    failure: function (res) {
                        self.failure(res);
                    },
                    data: data
                });
            }
        },
        success: function (res) {
            isLocked = false;
            totalPage = res.data.totalPage;
            this.renderSuggest(res);
            this.renderPage();
        },
        failure: function (res) {
            isLocked = false;
            suggestHolder.innerHTML = '<div style="padding:12px 0;">还没有订阅过建议</div>';
            sb.addClass(pageHolder, 'fn-hide');
        },
        jumpToPage: function () {
            var el;
            if (isLocked) return;
            if (pages['page' + data.page]) { //检查缓存
                sb.addClass(pages['page' + oldPage], 'fn-hide');
                sb.removeClass(pages['page' + data.page], 'fn-hide');
                this.renderPage();
                oldPage = data.page;
            } else {
                this.query();
            }
            el = document.documentElement.scrollTop > 0 ? document.documentElement : document.body;
            sb.animate(el, {
                scrollTop: sb.region('subscribeCnt').top
            }, {
                duration: 800
            });
        },
        renderSuggest: function (res) {
            var cp = data.page;


            app.Communication.notify({
                type: 'voice-list-render',
                data: {
                    params: res.data,
                    callback: function (html) {
                        var n = sb.create(html);
                        pages['page' + cp] = n;

                        suggestHolder.appendChild(n);
                        if (oldPage != cp) {
                            sb.addClass(pages['page' + oldPage], 'fn-hide');
                        }
                        oldPage = cp;

                    }
                }
            });
        },
        renderPage: function () { //渲染分页
            var half = 3,
                i, html = '',
                cp = parseInt(data.page, 10);

            if (totalPage <= 1) {
                sb.addClass(pageHolder, 'fn-hide');
                return;
            } else {
                sb.removeClass(pageHolder, 'fn-hide');
            }

            if (cp > half + 2) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="1"><span class="ui-round-btn-text">1</span></a><span class="ellipsis">...</span>';
                for (i = cp - half; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            } else {
                for (i = 1; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            html += '<span class="cp" data-page="' + cp + '">' + cp + '</span>';

            if (cp + half + 1 < totalPage) {
                for (i = cp + 1; i <= cp + half; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
                html += '<span class="ellipsis">...</span>';
            } else {
                for (i = cp + 1; i < totalPage; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            if (cp < totalPage) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + totalPage + '"><span class="ui-round-btn-text">' + totalPage + '</span></a>';
            }

            if (totalPage > 1) {
                html += '| 跳至<input type="text" class="txt" /> 页<span class="ui-round-btn ui-round-btn-mini"><input type="submit" class="ui-round-btn-text" value="Go" /></span>';
            }
            pageHolder.innerHTML = html;
        },
        implementPage: function () { //实现分页
            sb.addEvent(pageHolder, 'click', function (ev) {
                var el = sb.parent(sb.getTarget(ev));
                if (el.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    data.page = parseInt(el.getAttribute('data-page'), 10) || 1;
                    self.jumpToPage();
                }
            });
            sb.addEvent(pageHolder, 'submit', function (ev) {
                var page = parseInt(sb.query('.txt', pageHolder)[0].value, 10);
                sb.preventDefault(ev);

                if (page && page <= totalPage) {
                    data.page = page;
                    self.jumpToPage();
                }
            });
        }
    };
});

//key-subscribe 订阅关键字
app.register('key-subscribe', function (sb) {
    var self, key, isLocked = false,
        //防止重复提交
        totalPage, oldPage = 1,
        pages = {},
        suggestHolder, pageHolder, keyHolder, data = {
            keyid: '',
            //默认请求全部已订阅关键字
            page: 1
        };

    return {
        init: function () {
            self = this;
            suggestHolder = sb.get('suggestHolder');
            pageHolder = sb.get('pageHolder');
            keyHolder = sb.get('listAttention');

            this.bind();
            this.implementPage();
            self.setKeyId('');
            this.query();
        },
        bind: function () {
            app.Communication.notify({ //绑定事件:反馈、忽略、转发等
                type: 'bind-suggest',
                data: {
                    el: suggestHolder
                }
            });
            sb.addEvent('fmAttention', 'submit', function (ev) { //添加关键字
                var el = sb.get('keyAttention');
                sb.preventDefault(ev);
                var v = sb.trim(el.value);
                self.addKey(v);
                el.value = '';
            });
            sb.addEvent(keyHolder, 'click', function (ev) { //删除关键字
                var target = sb.getTarget(ev);

                sb.preventDefault(ev);
                switch (sb.attr(target, 'data-event')) {
                case 'key-del':
                    //删除关键字
                    self.delKey(target);
                    break;
                case 'key-query':
                    self.queryKey(target);
                    break;
                default:
                    break;
                }
            });
        },
        queryKey: function (el) { //查询单个关键定
            var keyId = sb.attr(el, 'data-keyId');

            if (keyId == data.keyid) {
                sb.removeClass(el, 'current');
                self.setKeyId('');
            } else {
                sb.removeClass('issueKey' + data.keyid, 'current');
                sb.addClass(el, 'current');
                self.setKeyId(keyId);
            }
            self.reset();
            self.query();
        },
        addKey: function (name) { //添加关键字
            if (!isLocked) {
                isLocked = true;
                app.Ajax.alipay({
                    url: 'index.php?r=subscribe/add',
                    success: function (res) {
                        var id = res.data.kid,
                            el = sb.create('<a id="issueKey' + id + '" href="#" data-keyId="' + id + '" data-event="key-query" data-title="' + name + '">' + name + '<span class="del" data-keyId="' + id + '" data-event="key-del">X</span></a>');

                        isLocked = false;
                        keyHolder.appendChild(el);
                        self.setKeyId(''); //搜全部关键字
                        self.reset();
                        self.query();
                    },
                    failure: function (res) {
                        isLocked = false;
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '添加失败',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        keyName: name,
                        stype: 1
                    } //stype 标识添加关键字，添加问题点
                });
            }
        },
        delKey: function (el) { //删除关键字
            if (!isLocked) {
                isLocked = true;
                app.Ajax.alipay({
                    url: 'index.php?r=subscribe/del',
                    success: function (res) {
                        keyHolder.removeChild(el.parentNode);
                        isLocked = false;

                        self.setKeyId(''); //搜全部关键字
                        self.reset();
                        self.query();
                    },
                    failure: function (res) {
                        isLocked = false;
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '删除失败',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        kid: sb.attr(el, 'data-keyId')
                    }
                });
            }
        },
        setKeyId: function (v) {
            if (v) {
                key = sb.attr(sb.get('issueKey' + v), 'data-title');
            } else {
                key = this.getAllKey();
            }
            data.keyid = v;
        },
        reset: function () {
            data.page = oldPage = 1;
            pages = {};
            suggestHolder.innerHTML = '';
        },
        query: function () { //搜索关键字
            if (!isLocked) {
                isLocked = true;
                app.Ajax.alipay({
                    url: 'index.php?r=subscribe/search',
                    success: function (res) {
                        self.success(res);
                    },
                    failure: function (res) {
                        self.failure(res);
                    },
                    data: data
                });
            }
        },
        success: function (res) {
            isLocked = false;
            totalPage = res.data.totalPage;
            this.renderSuggest(res);
            this.renderPage();
        },
        failure: function (res) {
            isLocked = false;
            suggestHolder.innerHTML = '<div style="padding:12px 0;">没有匹配的建议</div>';
            sb.addClass(pageHolder, 'fn-hide');
        },
        jumpToPage: function () {
            var el;
            if (isLocked) return;
            if (pages['page' + data.page]) { //检查缓存
                sb.addClass(pages['page' + oldPage], 'fn-hide');
                sb.removeClass(pages['page' + data.page], 'fn-hide');
                this.renderPage();
                oldPage = data.page;
            } else {
                this.query();
            }
            el = document.documentElement.scrollTop > 0 ? document.documentElement : document.body;
            sb.animate(el, {
                scrollTop: sb.region('subscribeCnt').top
            }, {
                duration: 800
            });
        },
        renderSuggest: function (res) {
            var cp = data.page;

            app.Communication.notify({
                type: 'voice-list-render',
                data: {
                    params: res.data,
                    search: key,
                    callback: function (html) {
                        var n = sb.create(html);
                        pages['page' + cp] = n;

                        suggestHolder.appendChild(n);
                        if (oldPage != cp) {
                            sb.addClass(pages['page' + oldPage], 'fn-hide');
                        }
                        oldPage = cp;
                    }
                }
            });
        },
        getAllKey: function () { //获取所有
            var ret = [];
            sb.each(sb.query('a', keyHolder), function (el) {
                ret.push(sb.attr(el, 'data-title'));
            });
            return ret.join('|');
        },
        renderPage: function () { //渲染分页
            var half = 3,
                i, html = '',
                cp = parseInt(data.page, 10);

            if (totalPage <= 1) {
                sb.addClass(pageHolder, 'fn-hide');
                return;
            } else {
                sb.removeClass(pageHolder, 'fn-hide');
            }

            if (cp > half + 2) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="1"><span class="ui-round-btn-text">1</span></a><span class="ellipsis">...</span>';
                for (i = cp - half; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            } else {
                for (i = 1; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            html += '<span class="cp" data-page="' + cp + '">' + cp + '</span>';

            if (cp + half + 1 < totalPage) {
                for (i = cp + 1; i <= cp + half; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
                html += '<span class="ellipsis">...</span>';
            } else {
                for (i = cp + 1; i < totalPage; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            if (cp < totalPage) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + totalPage + '"><span class="ui-round-btn-text">' + totalPage + '</span></a>';
            }

            if (totalPage > 1) {
                html += '| 跳至<input type="text" class="txt" /> 页<span class="ui-round-btn ui-round-btn-mini"><input type="submit" class="ui-round-btn-text" value="Go" /></span>';
            }
            pageHolder.innerHTML = html;
        },
        implementPage: function () { //实现分页
            sb.addEvent(pageHolder, 'click', function (ev) {
                var el = sb.parent(sb.getTarget(ev));
                if (el.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    data.page = parseInt(el.getAttribute('data-page'), 10) || 1;
                    self.jumpToPage();
                }
            });
            sb.addEvent(pageHolder, 'submit', function (ev) {
                var page = parseInt(sb.query('.txt', pageHolder)[0].value, 10);
                sb.preventDefault(ev);

                if (page && page <= totalPage) {
                    data.page = page;
                    self.jumpToPage();
                }
            });
        }
    }
});

//alipay-login module 登录
app.register('alipay-login', function (sb) {
    var template, xbox, code;

    template = ['<div id="xboxLogin"><iframe id="ifmLogin" class="frame-login" src="' + sb.get('loginUrl').value + '" frameborder="0" scrolling="no"></iframe></div>'];

    return {
        init: function () {
            document.body.appendChild(sb.create(template.join('')));
            //app.Tab({id: 'loginTab'});
            //this.bind();
            xbox = sb.domBox({
                width: 450,
                id: 'xboxLogin',
                title: '登录支付宝'
            });
            //xbox.hide();
            app.Communication.listen({
                type: 'alipay-login',
                context: this,
                callback: this.show
            });
        },
        show: function () {
            //this.refresh();
            xbox.show();
        },
        bind: function () { //绑定事件
            var self = this,
                close = sb.get('xboxLoginClose'),
                btn = sb.get('loginSubmit'),
                nick = sb.get('loginNickName'),
                contact = sb.get('loginContact'),
                valid = sb.get('loginCode'),
                fm = sb.get('fmAnony');

            code = sb.get('validCode');
            sb.focusError([nick, contact, valid]);
            sb.placeHolder(contact);
            sb.addEvent(close, 'click', function (ev) {
                ev.preventDefault();
                xbox.hide();
            }).addEvent(code, 'click', function () {
                self.refresh();
                valid.focus();
            }).addEvent(fm, 'submit', function (ev) {
                ev.preventDefault();
                var flag = true;
                if (sb.isEmpty(nick.value)) {
                    sb.showError(nick, '请输入昵称');
                    flag = false;
                }
                if (sb.isEmpty(contact.value)) {
                    sb.showError(contact, '请输入联系方式');
                    flag = false;
                }
                if (sb.isEmpty(valid.value)) {
                    sb.showError(valid, '请输入验证码');
                    flag = false;
                }
                if (!((/^1\d{10}$/).test(contact.value) || (/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/).test(contact.value))) {
                    sb.showError(contact, '请填写正确的电子邮件地址或手机号码');
                    flag = false;
                }

                if (flag) {
                    sb.disableButton(btn, 'disabled');
                    app.Ajax.alipay({
                        url: fm.action,
                        success: function (res) {
                            xbox.hide();
                            sb.enableButton(btn, 'disabled');
                            app.Communication.notify({
                                type: 'tip-show',
                                data: {
                                    title: '发表建议成功',
                                    cls: 'success',
                                    msg: '您可以继续发表建议',
                                    beforeHide: function () {
                                        window.location = '/';
                                    }
                                }
                            });
                        },
                        failure: function (res) {
                            sb.enableButton(btn, 'disabled');
                            if (res.msg == 'wrongcode') {
                                sb.showError(valid, '验证码错误');
                                self.refresh();
                            } else {
                                xbox.hide();
                                app.Communication.notify({
                                    type: 'tip-show',
                                    data: {
                                        title: '登录失败',
                                        msg: res.msg
                                    }
                                });
                            }
                        },
                        data: {
                            name: nick.value,
                            link: contact.value,
                            code: valid.value
                        }
                    });
                }
            });
        },
        refresh: function () {
            code.src = code.getAttribute('data-src') + '&t=' + (+new Date());
        }
    };
});

//tip-alert module 信息提示框
app.register('tip-alert', function (sb) {
    var template, xbox, wrapper, title, message, callback;

    tip = {
        success: 'tip-interact-success',
        error: 'tip-interact-error',
        warn: 'tip-interact-warn'
    };
    template = ['<div class="tip-interact" id="tipInteract">', '<span class="ico"></span>', '<h3 class="title" id="tipInteractTitle"></h3>', '<div class="msg" id="tipInteractMsg"></div>', '<div class="action">', '<span class="custom-btn"><input type="button" value="我知道了" class="custom-btn-text" id="btnInteractClose"></span>', '</div>', '</div>'];

    return {
        init: function () {
            document.body.appendChild(sb.create(template.join('')));
            this.bind();
            xbox = sb.domBox({
                width: 450,
                id: 'tipInteract',
                title: '提示信息',
                beforeHide: this.beforeHide
            });
            app.Communication.listen({
                type: 'tip-show',
                context: this,
                callback: this.show
            });
        },
        bind: function () {
            wrapper = sb.get('tipInteract');
            title = sb.get('tipInteractTitle');
            message = sb.get('tipInteractMsg');
            sb.addEvent('btnInteractClose', 'click', function () {
                xbox.hide();
            });
        },
        beforeHide: function () {
            callback && callback();
            callback = null; //执行后，删除
        },
        show: function (data) {
            var cls = data.cls || 'error';
            title.innerHTML = data.title;
            message.innerHTML = data.msg || '未指定原因';
            if (data.single) {
                wrapper.className = 'tip-interact tip-interact-single ' + tip[cls];
            } else {
                wrapper.className = 'tip-interact ' + tip[cls];
            }
            if (data.beforeHide) {
                callback = data.beforeHide;
            }

            xbox.show();
        }
    };
});

//ie6-position-fixed module 使ie6支持position:fixed
app.register('ie6-position-fixed', function (sb) {
    var el = sb.get('serviceHolder'),
        top;

    return {
        init: function () {
            if (sb.isIE6() && el) {
                top = sb.region(el).top;
                this.bind();
            }
        },
        bind: function () {
            window.onscroll = function () {
                el.style.top = top + document.documentElement.scrollTop + 'px';
                //app.Log(document.documentElement.scrollTop);
            }
        }
    };
});

//post-suggest module 发表建议
app.register('post-suggest', function (sb) {
    var self, flag, swu, xbox, refurl = sb.get('refurl').value,
        idle = true,
        //防止重复提交
        pageType = globalConfig.pageType,
        //判断内部端还是外部端
        isInner = pageType !== 'outer',
        //内部端标识
        issueTitle = sb.get('envelopeTitle'),
        issueType = sb.get('envelopeType'),
        issueCnt = sb.get('envelopeCnt'),
        btn = sb.get('postSuggest'); //发建议按钮
    return {
        init: function () {
            self = this;

            if (isInner) {
                this.createXbox();
                this.dynamicIssues();
            }

            //发表建议的上传图片
            swu = new SWFUpload(globalConfig.upload);
            swu.imagesContainer = 'imagesWrapper';
            swu.category = 'Recommend';
            swu.maxFiles = globalConfig.upload.maxFiles; //最大上传图片
            swu.uploadFiles = 0; //已经上传图片数目
            //this.selectIssue();
            this.bind();
        },
        bind: function () {
            if (!isInner) { //外部端
                sb.placeHolder(issueTitle); //实现html5 placeholder
                sb.placeHolder(issueCnt);
            }
            this.clearError(issueTitle);
            this.clearError(issueCnt);

            sb.addEvent(btn, 'click', function () {
                self.publish();
            });

            app.Communication.listen({
                type: 'enable-submit',
                context: this,
                callback: this.enableSubmit
            });
            app.Communication.listen({
                type: 'disable-submit',
                context: this,
                callback: this.disableSubmit
            });
        },
        createXbox: function () { //内部端生成xbox
            var template = ['<div id="xboxPublish" class="publish-wrapper fn-hide">', '<div class="publish-item">', '<input id="envelopeTitle" type="text" class="ui-input" placeholder="建议标题" />', '<div class="fm-explain"></div>', '</div>', '<div class="publish-item">', '<select id="envelopeTypeProd" class="ui-select"></select>', '<select id="envelopeType" class="ui-select"></select>', '<div class="fm-explain"></div>', '</div>', '<div class="publish-item">', '<textarea id="envelopeCnt" class="ui-textarea" placeholder="建议内容"></textarea>', '<div class="fm-explain"></div>', '</div>', '<div class="publish-item">', '<div id="imagesWrapper"></div>', '</div>', '<div class="publish-item publish-action">', '<span class="custom-btn"><input id="postSuggest" type="button" seed="sound-submit" class="custom-btn-text" value="提 交" /></span>', '</div>', '</div>'];

            document.body.appendChild(sb.create(template.join('')));

            issueTitle = sb.get('envelopeTitle');
            issueType = sb.get('envelopeType');
            issueCnt = sb.get('envelopeCnt');
            btn = sb.get('postSuggest');

            xbox = sb.domBox({
                title: '发建议',
                id: 'xboxPublish',
                width: 430
            });
            sb.addEvent('btnPublishVoice', 'click', function (ev) {
                sb.preventDefault(ev);
                xbox.show();
            });

        },
        dynamicIssues: function () { //内部端产品线、问题点联动菜单
            var prod = sb.get('envelopeTypeProd'),
                issue = sb.get('envelopeType'),
                data = {};

            function formatData() { //格式化数据，生成产品线列表
                var frag = document.createDocumentFragment(),
                    opt;

                sb.each(prodIssues, function (o) {
                    data['prod' + o.id] = o.child;

                    opt = document.createElement('option');
                    opt.value = o.id;
                    opt.innerHTML = o.title;
                    frag.appendChild(opt);
                })
                prod.options.length = 0;
                prod.appendChild(frag);
            }

            function changeIssues(pid) {
                var frag = document.createDocumentFragment(),
                    opt;

                sb.each(data['prod' + pid], function (o) {
                    opt = document.createElement('option');
                    opt.value = o.id;
                    opt.innerHTML = o.title;
                    frag.appendChild(opt);
                });
                issue.options.length = 0;
                issue.appendChild(frag);
            }

            if (prodIssues) { //数据存在
                formatData();
                sb.addEvent(prod, 'change', function () {
                    changeIssues(prod.value);
                });
                changeIssues(prod.value);
            }

        },
        publish: function () { //发建议
            var imgs;
            if (!idle) return; //正在上传图片，禁止提交
            flag = true;
            self.checkWhite(issueTitle, '请输入标题');
            self.checkWhite(issueType, '请选择建议分类')
            self.checkWhite(issueCnt, '请输入内容');
            self.checkLength(issueTitle, 40, '标题不能超过40个字');
            self.checkLength(issueCnt, 2000, '内容不能超过2000个字');

            if (flag && idle) { //提交数据
                imgs = self.getImages();
                self.disableSubmit();
                app.Ajax.alipay({
                    url: isInner ? 'index.php?r=voiceInner/add' : 'index.php?r=voice/add',
                    //外部端url，内部端voiceInner/add
                    success: self.success,
                    failure: self.failure,
                    data: {
                        title: issueTitle.value,
                        product_id: issueType.getAttribute('data-prod'),
                        problem_id: issueType.value,
                        content: issueCnt.value,
                        images: imgs.join('|'),
                        refurl: refurl
                    }
                });
            }
        },
        success: function (res) { //发表成功
            if (pageType === 'inner') { //内部端
                this.success = function (res) {
                    self.enableSubmit();
                    self.reset();
                    xbox.hide();
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '发表成功',
                            msg: res.msg,
                            cls: 'success'
                        }
                    });
                }
            } else { //外部端
                this.success = function (res) {
                    app.Communication.notify({ //显示评分
                        type: 'grade-show',
                        data: res.data
                    });
                    self.enableSubmit();
                    self.reset();
                }
            }
            this.success(res);
        },
        failure: function (res) { //发表失败
            self.enableSubmit();
            if (res.msg === 'nologin') { //未登录
                app.Communication.notify({
                    type: 'alipay-login',
                    data: {}
                });
            } else {
                if (xbox) {
                    xbox.hide();
                }
                app.Communication.notify({
                    type: 'tip-show',
                    data: {
                        title: '发表失败',
                        msg: res.msg,
                        cls: 'error'
                    }
                });
            }
        },
        selectIssue: function () { //显示已经问题点的描述
            var el, params = sb.getParams(location.search);
            if (params && params.pid) {
                el = sb.query('#classifyCnt a[data-problemid=' + params.pid + ']')[0];
                if (el) {
                    sb.get('tipPrize').innerHTML = el.getAttribute('data-prize');
                }
            }
        },
        reset: function () {
            self.resetForm();
            self.resetUpload();
        },
        resetForm: function () { //重置form
            issueTitle.value = '';
            issueCnt.value = '';
        },
        resetUpload: function () { //重置上传文件
            sb.get(swu.imagesContainer).innerHTML = '';
            swu.uploadFiles = 0;
        },
        enableSubmit: function () { //允许提交
            sb.removeClass(btn.parentNode, 'disabled');
            idle = true;
        },
        disableSubmit: function () { //禁止提交
            sb.addClass(btn.parentNode, 'disabled');
            idle = false;
        },
        getImages: function () { //获取上传的图片
            var ret = [];
            sb.each(sb.query('#imagesWrapper > div'), function (item) {
                ret.push(item.getAttribute('data-imgId'));
            });
            return ret;
        },
        checkWhite: function (el, msg) {
            if (sb.isEmpty(el.value)) {
                this.errorTip(el, msg);
            }
        },
        checkLength: function (el, max, msg) { //检测长度
            if (sb.trim(el.value).length > max) {
                this.errorTip(el, msg);
            }
        },
        errorTip: function (el, msg) {
            var p = sb.parent(el, 'div'),
                explain = sb.query('.fm-explain', p)[0];
            explain.innerHTML = msg;
            sb.addClass(p, 'fm-error');
            flag = false;
        },
        clearError: function (el) { //当获得焦点时，清除错误信息
            sb.addEvent(el, 'focus', function () {
                sb.removeClass(sb.parent(el, 'div'), 'fm-error');
            });
        }
    };
});

//issue-grade 问题点评分
app.register('issue-grade', function (sb) {
    var self, data = {},
        postCnt, gradeCnt, gradePoint;

    return {
        init: function () {
            var p = sb.getParams(location.search.slice(1));
            if (p.problem_id && p.voice_id && p.product_id) {
                data.problem_id = p.problem_id;
                data.voice_id = p.voice_id;
                data.product_id = p.product_id;
            }

            self = this;
            postCnt = sb.get('envelopePost');
            gradeCnt = sb.get('envelopeGrade');
            gradePoint = sb.get('issuePoint'); //问题点分数
            app.Template.define('option-template', [ //选项模板
            '#foreach($opt in $problems)', '<li class="problem-item"><input id="optProblem${velocityCount}" class="problem-chk" type="checkbox" value="${opt.id}" /><label for="optProblem${velocityCount}" class="problem-lb">${opt.option_name}</label></li>', '#end']);
            app.Communication.listen({
                type: 'grade-show',
                context: this,
                callback: this.show
            });
            this.starPoint('starGrade');
            this.bind();
        },
        bind: function () {
            sb.addEvent('postGrade', 'click', function () {
                delete data.problems;
                data.point = gradePoint.value;
                data.questions = self.getQuestions();
                if (sb.isEmpty(data.point) && sb.isEmpty(data.questions)) { //如果都为空，直接完成，不提交数据
                    self.hide();
                } else {
                    app.Ajax.alipay({
                        url: 'index.php?r=voice/evaluation',
                        success: function (res) {
                            app.Communication.notify({
                                type: 'tip-show',
                                data: {
                                    title: '提交成功',
                                    msg: '感谢您对支付宝的支持！',
                                    cls: 'success'
                                }
                            });
                            self.hide();
                        },
                        failure: function (res) {
                            app.Communication.notify({
                                type: 'tip-show',
                                data: {
                                    title: '评分失败',
                                    msg: res.msg,
                                    cls: 'error'
                                }
                            });
                        },
                        data: data
                    });
                }

            });
        },
        getQuestions: function () { //获取选项
            var ret = [];
            sb.each(sb.query('#problemList input'), function (chk) {
                if (chk.checked) {
                    ret.push(chk.value);
                }
            });
            return ret.join('|');
        },
        show: function (msg) { //显示评分
            data = msg;
            this.render();

            //如果问题点选项不存在，隐藏选项评分
            if (data.problems.length === 0) {
                sb.hide('problemCnt');
            } else {
                sb.show('problemCnt');
            }

            this.reset();
            sb.hide(postCnt);
            sb.show(gradeCnt);
        },
        hide: function () { //显示发表建议
            sb.show(postCnt);
            sb.hide(gradeCnt);
        },
        render: function () { //渲染问题点选项
            var str = app.Template.render('option-template', data);
            sb.get('problemList').innerHTML = str;
        },
        reload: function () { //刷新当前页面
        },
        reset: function () { //清空
            var star = sb.get('starGrade');
            sb.first(star).style.width = '0px';
            gradePoint.value = '';
        },
        starPoint: function (el) { //星形评分
            var left = 0,
                point = 0,
                width = 18;
            sb.addEvent(el, 'mousemove', function (ev) {
                setStars(getPoint(ev));
            }).addEvent(el, 'click', function (ev) {
                point = getPoint(ev);
                gradePoint.value = point;
            }).addEvent(el, 'mouseout', function () {
                setStars(point);
            });

            function getPoint(ev) {
                if (left == 0) {
                    left = sb.region(el).left;
                }
                return Math.ceil((ev.clientX - left) / width);
            }

            function setStars(n) {
                sb.first(el).style.width = n * width + 'px';
            }
        }
    };
});

//my-suggest 我的建议
app.register('my-suggest', function (sb) {
    var self, tab, totalPage, oldPage = 1,
        pages = {},
        suggestHolder, pageHolder, isLocked = false,
        data = {
            state: '',
            //建议状态
            page: 1
        };

    return {
        init: function () {
            self = this;
            suggestHolder = sb.get('mySuggest');
            pageHolder = sb.get('pageHolder');

            tab = sb.Tab({
                id: 'tabSuggest'
            });

            if (!suggestHolder) {
                return;
            }
            this.bind();
            this.implementPage();
            this.search();
        },
        bind: function () {
            var selectedState = sb.query('#searchBar .selected')[0];
            sb.addEvent('searchBar', 'click', function (ev) {
                var target = sb.getTarget(ev);
                if (target.tagName.toLowerCase() === 'a') {
                    sb.removeClass(selectedState, 'selected');
                    selectedState = target;
                    sb.addClass(selectedState, 'selected');
                    data.state = sb.attr(target, 'data-state');

                    self.reset();
                    self.search();
                }
            });
            app.Communication.notify({ //绑定事件:反馈、忽略、转发等
                type: 'bind-suggest',
                data: {
                    el: 'tabSuggest-Cnt'
                }
            });
        },
        search: function () {
            isLocked = true;
            app.Ajax.alipay({
                url: 'index.php?r=suggest/me',
                success: function (res) {
                    self.success(res);
                },
                failure: function (res) {
                    self.failure(res);
                },
                data: data
            });
        },
        reset: function () {
            pages = {};
            data.page = oldPage = 1;
            suggestHolder.innerHTML = '';
        },
        success: function (res) {
            isLocked = false;
            totalPage = res.data.totalPage;
            this.renderSuggest(res);
            this.renderPage();
        },
        failure: function (res) {
            isLocked = false;
            suggestHolder.innerHTML = '<div style="padding:12px 0;">还没有提交过建议</div>';
            sb.addClass(pageHolder, 'fn-hide');
        },
        jumpToPage: function () {
            var el;
            if (isLocked) return;
            if (pages['page' + data.page]) { //检查缓存
                sb.addClass(pages['page' + oldPage], 'fn-hide');
                sb.removeClass(pages['page' + data.page], 'fn-hide');
                this.renderPage();
                oldPage = data.page;
            } else {
                this.search();
            }
            el = document.documentElement.scrollTop > 0 ? document.documentElement : document.body;
            sb.animate(el, {
                scrollTop: sb.region('searchBar').top
            }, {
                duration: 800
            });
        },
        renderSuggest: function (res) {
            var cp = data.page;

            app.Communication.notify({
                type: 'voice-list-render-outer',
                data: {
                    params: res.data,
                    callback: function (html) {
                        var n = sb.create(html);
                        pages['page' + cp] = n;

                        suggestHolder.appendChild(n);
                        if (oldPage != cp) {
                            sb.addClass(pages['page' + oldPage], 'fn-hide');
                        }
                        oldPage = cp;

                    }
                }
            });
        },
        renderPage: function () { //渲染分页
            var half = 3,
                i, html = '',
                cp = parseInt(data.page, 10);

            if (totalPage <= 1) {
                sb.addClass(pageHolder, 'fn-hide');
                return;
            } else {
                sb.removeClass(pageHolder, 'fn-hide');
            }

            if (cp > half + 2) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="1"><span class="ui-round-btn-text">1</span></a><span class="ellipsis">...</span>';
                for (i = cp - half; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            } else {
                for (i = 1; i < cp; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            html += '<span class="cp" data-page="' + cp + '">' + cp + '</span>';

            if (cp + half + 1 < totalPage) {
                for (i = cp + 1; i <= cp + half; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
                html += '<span class="ellipsis">...</span>';
            } else {
                for (i = cp + 1; i < totalPage; i++) {
                    html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + i + '"><span class="ui-round-btn-text">' + i + '</span></a>';
                }
            }
            if (cp < totalPage) {
                html += '<a href="#searchBar" class="ui-round-btn ui-round-btn-mini" data-page="' + totalPage + '"><span class="ui-round-btn-text">' + totalPage + '</span></a>';
            }

            if (totalPage > 1) {
                html += '| 跳至<input type="text" class="txt" /> 页<span class="ui-round-btn ui-round-btn-mini"><input type="submit" class="ui-round-btn-text" value="Go" /></span>';
            }
            pageHolder.innerHTML = html;
        },
        implementPage: function () { //实现分页
            sb.addEvent(pageHolder, 'click', function (ev) {
                var el = sb.parent(sb.getTarget(ev));
                if (el.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    data.page = parseInt(el.getAttribute('data-page'), 10) || 1;
                    self.jumpToPage();
                }
            });
            sb.addEvent(pageHolder, 'submit', function (ev) {
                var page = parseInt(sb.query('.txt', pageHolder)[0].value, 10);
                sb.preventDefault(ev);

                if (page && page <= totalPage) {
                    data.page = page;
                    self.jumpToPage();
                }
            });
        }
    };
});

//voice-chart 内部端首页lineChart
app.register('voice-chart', function (sb) {
    var chartData;

    return {
        init: function () {
            try {
                chartData = lineChartData;
            } catch (e) {}

            if (chartData) {
                this.renderChart();
            }
        },
        renderChart: function () {
            var categories = [],
                series = [];

            sb.each(chartData, function (o) {
                var a = o.date.split('-');
                categories.push(a[1] + '.' + a[2]);
                series.push(parseInt(o.num, 10));
            });

            Highcharts.setOptions({
                colors: ['#FF9655']
            });

            new Highcharts.Chart({
                chart: {
                    renderTo: 'chartHolder',
                    type: 'line',
                    animation: true,
                    height: 160,
                    marginRight: 0,
                    marginBottom: 20
                },
                title: {
                    text: ''
                },
                subtitle: {
                    text: ''
                },
                xAxis: {
                    categories: categories,
                    labels: {
                        align: 'right',
                        style: {
                            fontSize: '12px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ''
                    },
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.series.name + '</b><br/>' + this.x + ': ' + this.y + '条';
                    }
                },
                legend: { //说明
                    enabled: false,
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: 0,
                    y: 0,
                    borderWidth: 0
                },
                series: [{
                    name: '建议量',
                    data: series
                }],
                credits: {
                    enabled: true,
                    text: '设置',
                    href: 'index.php?r=statistic/index',
                    position: {
                        align: 'right',
                        x: -4,
                        verticalAlign: 'top',
                        y: 25
                    },
                    style: {
                        border: '1px solid #ccc',
                        padding: '3px 5px 1px',
                        cursor: 'pointer',
                        background: '#eee',
                        fontSize: '12px'
                    }
                }
            });
        }
    }
});

//statistics-home 统计首页
app.register('statistics-home', function (sb) {
    var self, data, first = true,
        alias = {
            prod: '全部建议',
            state: ''
        },
        cfg = {
            product_id: '',
            problem_id: '',
            state: 'all',
            //默认全部
            datestart: sb.get('startDate').value,
            dateend: sb.get('endDate').value,
            isSetPreview: '0',
            //是否设为首页预览，0否,1是
            type: 'day' //默认按天
        };

    return {
        init: function () {
            var period = sb.get('startDate').value + ' - ' + sb.get('endDate').value;

            self = this;
            app.Template.define('pandect-template', [ //建议总览模板
            '<div class="title-bar">' + period + ' 建议总览</div>', '<ul id="pandectStat">', '<li><strong>建议量</strong><span>${total}</span></li>', '<li><strong>已忽略</strong><span>${ignore}</span></li>', '<li><strong>已反馈</strong><span>${save}</span></li>', '<li><strong>未处理</strong><span>${untreated}</span></li>', '<li><strong>转需求</strong><span>${demand}</span></li>', '</ul>']);
            app.Template.define('satisfy-template', [ //排行模板
            '#foreach($item in $topicSatisfy)', '<li><a href="index.php?r=statistic/score&productName=${item.productName}&problemName=${item.problemName}&datestart=${item.startDate}&dateend=${item.endDate}">${item.problemName}</a><span>${item.point}</span></li>', '#end']);
            app.Template.define('topic-template', ['#foreach($item in $topicProblem)', '<li><a href="index.php?r=statistic/option&productName=${item.productName}&problemName=${item.problemName}&datestart=${item.startDate}&dateend=${item.endDate}">${item.name}</a></li>', '#end']);

            app.Template.define('prodissue-template', [ //定义问题点渲染模板
            '<dl class="prodissue-dl">', '<dt class="prodissue-class"><a href="#" data-productId="${id}" class="prodissue-title">${title}</a></dt>', '<dd class="prodissue-list">', '#foreach($issue in $child)', '<a href="#" data-problemId="${issue.id}" class="prodissue-item">${issue.title}</a>', '#end', '</dd>', '</dl>']);
            app.Communication.notify({ //生成问题点
                type: 'create-issues',
                data: {
                    template: 'prodissue-template',
                    el: 'queryIssues'
                }
            });

            this.query();
            this.bind();
        },
        bind: function () {
            var selectedState = sb.query('#queryState .current')[0],
                //建议状态选中项
                selectedProd = sb.get('queryAll'),
                chkPreview = sb.get('homePreview');

            sb.addEvent('queryIssues', 'click', function (ev) { //切换问题点/产品线
                var target = sb.getTarget(ev),
                    problemId = sb.attr(target, 'data-problemId');
                if (target.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    sb.removeClass(selectedProd, 'current');
                    selectedProd = target;
                    sb.addClass(selectedProd, 'current');
                    if (problemId) { //问题点
                        self.setProblemId(problemId, target.innerHTML);
                    } else {
                        self.setProductId(sb.attr(target, 'data-productId'), target.innerHTML);
                    }
                }

            });
            sb.addEvent('queryAll', 'click', function (ev) { //切换到全部建议
                var target = sb.getTarget(ev);
                sb.preventDefault(ev);
                sb.removeClass(selectedProd, 'current');
                selectedProd = target;
                sb.addClass(selectedProd, 'current');
                self.setSuggestAll();
            });
            sb.addEvent('queryState', 'click', function (ev) { //切换建议状态
                var target = sb.getTarget(ev);
                if (target.tagName.toLowerCase() === 'a') {
                    sb.preventDefault(ev);
                    sb.removeClass(selectedState, 'current');
                    selectedState = target;
                    sb.addClass(selectedState, 'current');
                    self.setState(sb.attr(target, 'data-state'), target.innerHTML);
                }
            });
            sb.addEvent('queryByWhat', 'click', function (ev) {
                var target = sb.getTarget(ev);

                if (target.tagName.toLowerCase() === 'input') {
                    self.setType(target.value);
                }
            });
            sb.addEvent('btnQuery', 'click', function () { //提交数据
                self.setPreview(chkPreview.checked ? 1 : 0);
                self.query();
                self.hide();
            });
        },
        hide: function () {
            var cnt = sb.get('queryWrapper');
            sb.hide(cnt);
            setTimeout(function () {
                sb.show(cnt);
            }, 50);
        },
        query: function () {
            app.Ajax.alipay({
                url: 'index.php?r=statistic/trend',
                success: function (res) {
                    data = res.data;
                    self.render();
                },
                failure: function (res) {
                    app.Communication.notify({
                        type: 'tip-show',
                        data: {
                            title: '查询失败',
                            msg: res.msg,
                            cls: 'error'
                        }
                    });
                },
                data: cfg
            });
        },
        render: function () { //重绘页面
            this.setTitle();
            this.highChartLine();

            if (first) { //不用重新渲染，以后可以将这个接口分离
                this.highChartColumar();
                this.renderTopic();
                first = false;
            }

        },
        setTitle: function () { //设置标题
            sb.get('classifyResult').innerHTML = alias.prod + (cfg.state === 'all' ? '' : ' - ' + alias.state) + '<span class="arrow"></span>';
        },
        highChartLine: function () { //绘制折线图
            var categories = [],
                series = [];

            sb.each(data.line, function (o) {
                var a = o.date.split('-');
                categories.push(a[1] + '.' + a[2]);
                series.push(parseInt(o.num, 10));
            });

            Highcharts.setOptions({
                colors: ['#FF9655']
            });

            new Highcharts.Chart({
                chart: {
                    renderTo: 'chartLine',
                    type: 'line',
                    animation: true,
                    height: 200,
                    marginRight: 0,
                    marginBottom: 40
                },
                title: {
                    text: '',
                    x: -20 //center
                },
                subtitle: {
                    text: '',
                    x: -20
                },
                xAxis: {
                    categories: categories,
                    labels: {
                        rotation: -45,
                        align: 'right',
                        style: {
                            fontSize: '11px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ''
                    }
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.series.name + '</b><br/>' + this.x + ': ' + this.y + '条';
                    }
                },
                legend: { //说明
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: 0,
                    y: 0,
                    borderWidth: 0
                },
                series: [{
                    name: '建议量',
                    data: series
                }],
                credits: {
                    enable: true,
                    text: ''
                }
            });
        },
        highChartColumar: function () { //柱状图
            var categories = [],
                percent = [],
                series = [];

            function getPercentByCategory(category) {
                var i;
                sb.each(categories, function (name, index) {
                    if (category === name) {
                        i = index;
                    }
                });
                return percent[i];
            }

            sb.get('pandectCnt').innerHTML = app.Template.render('pandect-template', data);

            sb.each(data.columnar, function (o, index) {
                if (index < 18) {
                    categories.push(o.name);
                    series.push(parseInt(o.num, 10));
                    percent.push(o.percent);
                }

            });

            Highcharts.setOptions({
                colors: ['#4572A7']
            });

            new Highcharts.Chart({
                chart: {
                    renderTo: 'chartColumar',
                    animation: true,
                    height: 260,
                    marginTop: 20,
                    type: 'column'
                },
                title: {
                    text: ''
                },
                xAxis: {
                    categories: categories,
                    labels: {
                        rotation: -45,
                        align: 'right',
                        style: {
                            font: 'normal 12px Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ''
                    }
                },
                legend: {
                    layout: 'vertical',
                    backgroundColor: '#FFFFFF',
                    align: 'right',
                    verticalAlign: 'top',
                    x: 0,
                    y: 0,
                    floating: true,
                    shadow: true
                },
                tooltip: {
                    formatter: function () {
                        return '' + this.x + ': ' + this.y;
                    }
                },
                series: [{
                    name: '建议量',
                    data: series,
                    dataLabels: {
                        enabled: true,
                        align: 'right',
                        x: 0,
                        y: -18,
                        formatter: function () {
                            return this.y + '<br />' + getPercentByCategory(this.x);
                        },
                        style: {
                            fontSize: '12px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                }],
                credits: {
                    enable: true,
                    text: ''
                }
            });
        },
        renderTopic: function () { //渲染topic排行			
            sb.get('satisfyList').innerHTML = app.Template.render('satisfy-template', {
                topicSatisfy: data.topicSatisfy
            });
            sb.get('topicList').innerHTML = app.Template.render('topic-template', {
                topicProblem: data.topicProblem
            });
        },
        setState: function (v, name) { //建议状态
            cfg.state = v;
            alias.state = name;
        },
        setProductId: function (id, name) { //切换产品线
            cfg.product_id = id;
            cfg.problem_id = '';

            alias.prod = name;
        },
        setProblemId: function (id, name) { //切换问题点
            cfg.product_id = '';
            cfg.problem_id = id;

            alias.prod = name;
        },
        setSuggestAll: function () { //全部建议
            cfg.product_id = '';
            cfg.problem_id = '';

            alias.prod = '全部建议'
        },
        setType: function (v) {
            cfg.type = v;
        },
        setPreview: function (v) { //设为首页面预览
            cfg.isSetPreview = v;
        }
    };
});

//statistics-date 时间搜索
app.register('statistics-date', function (sb) {
    var dates;

    return {
        init: function () {
            dates = sb.datePicker({
                from: 'startDate',
                to: 'endDate',
                dateFormat: 'yy.mm.dd',
                maxDate: '0',
                numberOfMonths: 3,
                onSelect: function (selectedDate) {
                    sb.get('fmSearchDate').submit();
                }
            });
        }
    };
});

//new-online 新功能上线
app.register('new-online', function (sb) {
    var self, ul, distance = 890,
        timer, second = 6;

    return {
        init: function () {
            self = this;
            ul = sb.get('newOnline');

            if (sb.children(ul).length > 1) {
                this.delay(self.start);
                this.bind();
            }
        },
        bind: function () {
            sb.addEvent(ul, 'mouseenter', function () {
                self.stop();
            });
            sb.addEvent(ul, 'mouseleave', function () {
                self.start();
            });
        },
        start: function () {
            self.stop();
            sb.animate(ul, {
                left: '-' + distance + 'px'
            }, {
                duration: 1500,
                easing: 'swing',
                complete: function () {
                    var o = ul.removeChild(sb.first(ul));
                    ul.style.left = '0px';
                    ul.appendChild(o);
                }
            })

            self.delay(self.start);
        },
        stop: function () {
            $(ul).stop();
            clearTimeout(timer);
        },
        delay: function (f) {
            timer = setTimeout(f, second * 1000);
        }
    };
});

//statistics-operate 操作量统计
app.register('statistics-operate', function (sb) {
    var self, result, list, data, mapData, btnExport, url;

    return {
        init: function () {
            var cnt = sb.get('plusCnt'),
                tmp;

            self = this;
            result = sb.query('div.plus-selected', cnt)[0];
            list = sb.query('div.plus-list', cnt)[0];
            btnExport = sb.get('exportData');

            if (btnExport) {
                tmp = [];
                url = sb.attr(btnExport, 'href').split('&');
                sb.each(url, function (str) {
                    if (str.indexOf('dos') !== 0) {
                        tmp.push(str);
                    }
                });
                url = tmp.join('&');
            }

            mapData = { //导出数据，变量映射
                untreated: 'untreatedNum',
                save: 'HaveFeedBackNum',
                ignore: 'ignoreNum',
                demand: 'demandNum'
            };

            data = this.format();
            this.bind();
        },
        bind: function () { //绑定事件
            sb.addEvent(list, 'click', function (ev) {
                var target = sb.getTarget(ev);

                if (target.tagName.toLowerCase() === 'input') {
                    self.calculate();
                }
            });
        },
        format: function () { //格式化数据
            var ret = [],
                a, arr = sb.query('#tblDetail .result');

            sb.each(arr, function (span) {
                a = sb.attr(span, 'data-num').split('|');
                ret.push({
                    el: span,
                    untreated: parseInt(a[0], 10),
                    save: parseInt(a[1], 10),
                    ignore: parseInt(a[2], 10),
                    demand: parseInt(a[3], 10)
                });
            });
            return ret;
        },
        calculate: function () { //计算
            var selected = [],
                tmp = [];
            txt = [];

            sb.each(sb.query('input', list), function (el) {
                if (el.checked) {
                    selected.push(el.value);
                    txt.push(sb.next(el, 'label').innerHTML);
                }
            });
            result.innerHTML = (txt.length > 0 ? txt.join('/') : '　') + '<span class="arrow"></span>';

            sb.each(data, function (o) {
                var num = 0;
                sb.each(selected, function (key) {
                    num += o[key];
                });

                o.el.innerHTML = num;
            });

            if (btnExport) {
                sb.each(selected, function (key) {
                    tmp.push(mapData[key]);
                });
                sb.attr(btnExport, 'href', url + '&dos=' + tmp.join('|'));
            }
        }
    }
});

//voice-mail todone建议转到邮件 
app.register('voice-mail', function (sb) {

    return {
        init: function () {
            app.Communication.listen({
                type: 'voice-mail',
                context: this,
                callback: this.handle
            })
        },
        handle: function (msg) {
            sb.preventDefault(msg.ev);

            //todone 未开发
        }
    }
});

//统计页面提示信息
app.register('statistics-tip', function (sb) {
    var wrapper, cnt, self, timer, gap;

    return {
        init: function () {
            var template = ['<div id="tipDes" class="tip-des-wrapper">', '<div class="triangle-wrapper">', '<span class="triangle triangle-border"></span>', '<span class="triangle triangle-back"></span>', '</div>', '<div id="tipDesCnt" class="tip-des-cnt"></div>', '</div>'];
            self = this;
            document.body.appendChild(sb.create(template.join('')));
            wrapper = sb.get('tipDes');
            cnt = sb.get('tipDesCnt');
            gap = Math.round(wrapper.offsetWidth / 2),

            this.bind();
        },
        bind: function () {
            var list = sb.query('.statistics-tip');

            sb.each(list, function (el) {
                sb.addEvent(el, 'click', function (ev) {
                    var region = sb.region(el),
                        html = el.getAttribute('data-tip'),
                        l = region.left + Math.round(region.width) + 10,
                        t = region.top + region.height + 6;

                    sb.stopPropagation(ev);
                    if (!sb.isEmpty(html)) {
                        self.setHtml(html);
                        self.setPosition(l, t);
                    }
                });
            });
            sb.addEvent(wrapper, 'click', function (ev) {
                sb.stopPropagation(ev);
            });
            sb.addEvent(document.body, 'click', function () {
                self.hide();
            });
        },
        setPosition: function (l, t) {
            clearTimeout(timer);
            wrapper.style.top = t - 4 + 'px';
            wrapper.style.left = l - gap + 'px';
        },
        setHtml: function (html) {
            cnt.innerHTML = html;
        },
        hide: function () {
            timer = setTimeout(function () {
                wrapper.style.top = '-1000px';
            }, 100);
        }
    };
});

//voice-favor todone收藏建议
app.register('voice-favor', function (sb) {

    return {
        init: function () {
            app.Communication.listen({
                type: 'voice-favor',
                context: this,
                callback: this.handle
            });
        },
        handle: function (msg) {
            sb.preventDefault(msg.ev);

            var target = sb.getTarget(msg.ev),
                id = sb.attr(sb.parent(target, 'li'), 'data-suggestId');
            var url = '';
            if (sb.hasClass(target, 'voice-collected')) {
                url = 'index.php?r=collection/del';
                app.Ajax.alipay({
                    url: url,
                    success: function (res) {
                        sb.toggleClass(target, 'voice-collected');
                        sb.attr(target, 'title', '加入收藏');
                    },
                    failure: function (res) {
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '收藏失败',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        id: id
                    }
                });
            } else {
                url = 'index.php?r=collection/add';
                app.Ajax.alipay({
                    url: url,
                    success: function (res) {
                        sb.toggleClass(target, 'voice-collected');
                        sb.attr(target, 'title', '取消收藏');
                    },
                    failure: function (res) {
                        app.Communication.notify({
                            type: 'tip-show',
                            data: {
                                title: '收藏失败',
                                msg: res.msg,
                                cls: 'error'
                            }
                        });
                    },
                    data: {
                        id: id
                    }
                });
            }

        }
    }
});