//create the application namespace
var app = (function (window, document, undefined) {
    'use strict';
    var moduleData = {};

    return {
        register: function (moduleId, Creator) {
            moduleData[moduleId] = {
                creator: Creator,
                instance: null
            };
        },
        start: function (moduleId) {
            try {
                moduleData[moduleId].instance = moduleData[moduleId].creator(app.Sandbox(this));
                moduleData[moduleId].instance.init();
                this.Log('Success: Start-Module ' + moduleId, 'info');
            } catch (e) {
                this.Log('Faulure: Start-Module ' + moduleId + ', ' + e, 'warn');
            }
        },
        startAll: function () {
            for (var moduleId in moduleData) {
                if (moduleData.hasOwnProperty(moduleId)) {
                    this.start(moduleId);
                }
            }
        },
        stop: function (moduleId) {
            var data = moduleData[moduleId];
            if (data.instance) {
                try {
                    data.instance.destroy();
                    data.instance = null;
                } catch (e) {
                    this.Log('Stop-Module ' + moduleId + ' Error: ' + e, 'warn');
                }
            }
        },
        stopAll: function () {
            for (var moduleId in moduleData) {
                if (moduleData.hasOwnProperty(moduleId)) {
                    this.stop(moduleId);
                }
            }
        },
        getModuleData: function (moduleId) {
            return moduleData[moduleId];
        },
        /**
         * Returns the namespace specified and creates it if it doesn't exist
         * @method namespace
         * @param  {string*} arguments 1-n namespaces to create 
         * @return {object}  A reference to the last namespace object created
         */
        namespace: function () {
            var a = arguments,
                o = null,
                i, j, d;
            for (i = 0; i < a.length; i = i + 1) {
                d = ("" + a[i]).split(".");
                o = this;
                for (j = (d[0] == "app") ? 1 : 0; j < d.length; j = j + 1) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            }
            return o;
        }
    };

}(this, this.document));

//create the util object
app.Util = (function () {
    'use strict';

    function getId(el) {
        return (typeof el === 'string') ? $('#' + el) : $(el);
    }
    return {
        get: function (id) {
            return getId(id).get(0);
        },
        query: function (selector, context) {
            return $(selector, context);
        },
        attr: function (el, name, value) {
            return getId(el).attr(name, value);
        },
        css: function (el, name, value) {
            if (value !== undefined) {
                return getId(el).css(name, value);
            } else {
                return getId(el).css(name);
            }
        },
        addClass: function (el, cls) {
            getId(el).addClass(cls);
            return this;
        },
        removeClass: function (el, cls) {
            getId(el).removeClass(cls);
            return this;
        },
        hasClass: function (el, cls) {
            return getId(el).hasClass(cls);
        },
        toggleClass: function (el, cls) {
            getId(el).toggleClass(cls);
        },
        parent: function (el, tagName) {
            return tagName ? getId(el).parents(tagName)[0] : getId(el).parent()[0];
        },
        next: function (el, tagName) {
            return tagName ? getId(el).nextAll(tagName)[0] : getId(el).next()[0];
        },
        prev: function (el, tagName) {
            return tagName ? getId(el).prevAll(tagName)[0] : getId(el).prev()[0];
        },
        last: function (el, tagName) {
            var a = getId(el).children(tagName);
            return a[a.length - 1];
        },
        first: function (el, tagName) {
            var a = getId(el).children(tagName);
            return a.get(0);
        },
        children: function (el) { //获取子节点集合
            return getId(el).children();
        },
        region: function (el) {
            var ot, ret = {};
            el = getId(el);
            ot = el.offset();
            if (ot) {
                ret.top = ot.top;
                ret.left = ot.left;
                ret.width = el.width();
                ret.height = el.height();
            }
            return ret;
        },
        slideDown: function (el, callback) {
            getId(el).slideDown(callback);
        },
        slideUp: function (el, callback) {
            getId(el).slideUp(callback);
        },
        fadeIn: function (el, callback) {
            getId(el).fadeIn(callback);
        },
        fadeOut: function (el, callback) {
            getId(el).fadeOut(callback);
        },
        insertBefore: function (rel, html) {
            $(html).insertBefore(rel);
        },
        hide: function (el) {
            getId(el).hide();
        },
        show: function (el) {
            getId(el).show();
        },
        trim: function (str) {
            return $.trim(str);
        },
        isEmpty: function (str) {
            return this.trim(str) === '';
        },
        addEvent: function (el, type, handler) {
            getId(el).on(type, handler);
            return this;
        },
        preventDefault: function (ev) {
            ev.preventDefault();
        },
        stopPropagation: function (ev) {
            ev.stopPropagation();
        },
        isIE6: function () {
            var b = $.browser;
            return (b.msie && b.version === '6.0') ? true : false;
        },
        isIE: function () {
            return $.browser.msie === true;
        },
        getTarget: function (ev) {
            return ev.target;
        },
        each: function (arr, callback) {
            $.each(arr, function (index, value) {
                callback(value, index);
            });
        },
        create: function (html) {
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.firstChild;
        },
        extend: function (s, t) {
            for (var p in t) {
                if (t.hasOwnProperty(p)) {
                    s[p] = t[p];
                }
            }
            return s;
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
                        ele.save('VOICE_USERDATA');
                    } else {
                        ele.load("VOICE_USERDATA");
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
                    ele.load("VOICE_USERDATA");
                    ele.removeAttribute(name);
                }
            }
            this.removeData(name);
        },
        showError: function (el, msg) {
            var node = getId(el);
            node.parent().addClass('fm-error');
            node.nextAll('div')[0].innerHTML = msg;
        },
        hideError: function (el) {
            getId(el).parent().removeClass('fm-error');
        },
        focusError: function (arr) {
            this.each(arr, function (el) {
                el = getId(el);
                el.on('focus', function () {
                    el.parent().removeClass('fm-error');
                });
            });
        },
        domBox: function (cfg) {
            /*
    		 width
			 beforeHide
			 afterShow
			 id
			 title	xbox标题
			*/
            function Xbox() {

            }
            Xbox.prototype = {
                show: function () {
                    this.box = $('#' + cfg.id).dialog({
                        title: cfg.title || '',
                        modal: true,
                        width: cfg.width,
                        beforeClose: function (ev, ui) {
                            cfg.beforeHide && cfg.beforeHide();
                        },
                        open: function (ev, ui) {
                            cfg.afterShow && cfg.afterShow();
                        }
                    });

                    this.show = function () {
                        this.box.dialog('open');
                    }

                    this.show();
                },
                hide: function () {
                    this.box.dialog('close');
                }
            }

            return new Xbox(cfg);
            /*
			return new aralex.xbox.DomXbox({
                el: '',
                width: cfg.width,
                beforeHide: function () {
                    cfg.beforeHide && cfg.beforeHide();
                },
                beforeShow: function () {
                    cfg.beforeShow && cfg.beforeShow();
                },
                afterShow: function () {
                    cfg.afterShow && cfg.afterShow();
                },
                closeLink: cfg.close || '',
                value: function (e) {
                    return $(cfg.id);
                }
            });
			*/
        },
        enableButton: function (el, cls) {
            var btn = getId(el);
            cls = cls || 'ui-round-btn-state-disabled';
            btn.parent().removeClass(cls);
            btn.get(0).disabled = false;
        },
        disableButton: function (el, cls) {
            var btn = getId(el);
            cls = cls || 'ui-round-btn-state-disabled';
            btn.parent().addClass(cls);
            btn.get(0).disabled = true;
        },
        Tab: function (cfg) {
            return app.Tab(cfg);
        },
        placeHolder: function (input) {
            var p;
            input = getId(input);
            p = input.parent();

            input.on('focus', function () {
                p.addClass('placehold-hover');
            });
            input.on('blur', function () {
                if (input.attr('value') === '') {
                    p.removeClass('placehold-hover');
                }
            });
            if (input.attr('value') != '') {
                p.addClass('placehold-hover');
            }
        },
        getParams: function (str) {
            var ret = {},
                self = this,
                a = str.split('&');

            if (a.length > 1) {
                str = '{"' + a.join('","') + '"}';
            } else {
                str = '{"' + str + '"}';
            }

            a = str.split('=');

            if (a.length > 1) {
                str = a.join('":"');
                ret = $.parseJSON(str);
            }
            return ret;
        },
        datePicker: function (cfg) { //jqeryui datepicker
            var dates = $('#' + cfg.from + ', #' + cfg.to).datepicker({
                dateFormat: cfg.dateFormat,
                numberOfMonths: cfg.numberOfMonths,
                maxDate: cfg.maxDate || '',
                onSelect: function (selectedDate) {
                    var option = this.id == cfg.from ? "minDate" : "maxDate",
                        instance = $(this).data("datepicker"),
                        date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
                    dates.not(this).datepicker("option", option, date);

                    cfg.onSelect && cfg.onSelect(selectedDate);
                }
            });

            return dates;
        },
        animate: function (el, props, options) { //自定义动画
            getId(el).animate(props, options);
        }
    };
})();

//create the sandbox object
app.Sandbox = function (Core) {
    'use strict';
    var util = app.Util;
    return {
        get: function (id) {
            return util.get(id);
        },
        query: function (selector, context) {
            return util.query(selector, context);
        },
        attr: function (el, name, value) {
            return util.attr(el, name, value);
        },
        css: function (el, name, value) {
            return util.css(el, name, value);
        },
        addClass: function (el, cls) {
            return util.addClass(el, cls);
        },
        removeClass: function (el, cls) {
            return util.removeClass(el, cls);
        },
        hasClass: function (el, cls) {
            return util.hasClass(el, cls);
        },
        toggleClass: function (el, cls) {
            return util.toggleClass(el, cls);
        },
        parent: function (el, tagName) {
            return util.parent(el, tagName);
        },
        next: function (el, tagName) {
            return util.next(el, tagName);
        },
        prev: function (el, tagName) {
            return util.prev(el, tagName);
        },
        last: function (el, tagName) {
            return util.last(el, tagName);
        },
        first: function (el, tagName) {
            return util.first(el, tagName);
        },
        children: function (el) {
            return util.children(el);
        },
        region: function (el) {
            return util.region(el);
        },
        slideDown: function (el, callback) {
            return util.slideDown(el, callback);
        },
        slideUp: function (el, callback) {
            return util.slideUp(el, callback);
        },
        fadeIn: function (el, callback) {
            return util.fadeIn(el, callback);
        },
        fadeOut: function (el, callback) {
            return util.fadeOut(el, callback);
        },
        insertBefore: function (rel, html) {
            return util.insertBefore(rel, html);
        },
        hide: function (el) {
            return util.hide(el);
        },
        show: function (el) {
            return util.show(el);
        },
        trim: function (str) {
            return util.trim(str);
        },
        isEmpty: function (str) {
            return util.isEmpty(str);
        },
        addEvent: function (el, type, handler) {
            return util.addEvent(el, type, handler);
        },
        preventDefault: function (ev) {
            return util.preventDefault(ev);
        },
        stopPropagation: function (ev) {
            return util.stopPropagation(ev);
        },
        isIE6: function () {
            return util.isIE6();
        },
        getTarget: function (ev) {
            return util.getTarget(ev);
        },
        each: function (arr, callback) {
            return util.each(arr, callback);
        },
        create: function (html) {
            return util.create(html);
        },
        extend: function (s, t) {
            return util.extend(s, t);
        },
        userData: function (name, value) {
            return util.userData(name, value);
        },
        removeData: function (name) {
            return util.removeData(name);
        },
        showError: function (el, msg) {
            return util.showError(el, msg);
        },
        hideError: function (el) {
            return util.hideError(el);
        },
        focusError: function (arr) {
            return util.focusError(arr);
        },
        domBox: function (cfg) {
            return util.domBox(cfg);
        },
        enableButton: function (el, cls) {
            return util.enableButton(el, cls);
        },
        disableButton: function (el, cls) {
            return util.disableButton(el, cls);
        },
        Tab: function (cfg) {
            return util.Tab(cfg);
        },
        placeHolder: function (input) {
            return util.placeHolder(input);
        },
        getParams: function (str) {
            return util.getParams(str);
        },
        datePicker: function (cfg) {
            return util.datePicker(cfg);
        },
        animate: function (el, props, options) {
            return util.animate(el, props, options);
        }
    };
};

//inter-module communication methods
app.Communication = (function () {
    'use strict';
    //object containing all the handler functions
    var handlers = {};

    return {
        listen: function (msg) {
            var type = msg.type;
            if (!handlers[type]) {
                handlers[type] = [];
            }
            handlers[type].push({
                context: msg.context,
                callback: msg.callback
            });
            return this;
        },
        notify: function (msg) {
            var type = msg.type;
            if (handlers[type] instanceof Array) {
                var msgList = handlers[type];
                for (var i = 0, len = msgList.length; i < len; i++) {
                    try {
                        msgList[i].callback.call(msgList[i].context, msg.data);
                    } catch (e) {
                        app.Log('Notify ' + type + ' Error: ' + e, 'warn');
                    }
                }
            }
            return this;
        },
        remove: function (msg) {
            var type = msg.type,
                callback = msg.callback,
                handlersArray = handlers[type];
            if (handlersArray instanceof Array) {
                for (var i = 0, len = handlersArray.length; i < len; i++) {
                    if (handlersArray[i].callback == callback) {
                        handlers[type].splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
})();

//inter-module Ajax methods
app.Ajax = (function () {
    'use strict';
    var token;
    //return the public methods
    return {
        alipay: function (cfg) {
            app.Log('Ajax-alipay:' + cfg.url, 'info');
            if (!token) {
                token = app.Util.get('sec_token').value;
            }
            cfg.data.sec_token = token;
            $.ajax({
                type: 'POST',
                url: cfg.url,
                data: cfg.data,
                dataType: 'json',
                success: function (res) {
                    if (res.stat === 'ok') {
                        cfg.success(res);
                    } else {
                        app.Log(res.msg || '未指定错误原因', 'error');
                        cfg.failure(res);
                    }
                }
            });
        }
    };
})();

//inter-module Log methods
app.Log = (function () {
    'use strict';
    var debug = window.location.href.indexOf('debug') > -1,
        log = function () {
            var div = document.createElement('div');
            div.style.cssText = 'position:fixed;width:100%;bottom:0;height:120px;border-top:2px solid #ccc;backround-color:#efefef;overflow-y:scroll';
            document.body.appendChild(div);

            log = function (msg, type) {
                var d = document.createElement('div');
                d.style.padding = '4px';
                switch (type) {
                case 'warn':
                    d.style.color = 'red';
                    break;
                case 'info':
                    break;
                }
                d.innerHTML = msg;
                div.appendChild(d);
            };
        };
    if (debug) {
        if (window.console && console.log) {
            return function (msg, type) {
                switch (type) {
                case 'info':
                    console.info(msg);
                    break;
                case 'warn':
                    console.warn(msg);
                    break;
                default:
                    console.log(msg);
                    break;
                }

            };
        } else {
            log();
            return log;
        }
    } else {
        return function () {};
    }
})();

/*
	inter-module Template methods
	模板语法velocity
*/
app.Template = (function (undefined) {
    'use strict';
    var util = app.Util,
        templates = {},
        SENTENCE = /#([a-z]+)\(([\s\S]+?)\)/,
        VARIABLE = /\$\{\w[\w\.]*\}/g,
        velocity;

    velocity = {
        parse: function (str, params) {
            var result;

            params = params || {};

            while ((result = SENTENCE.exec(str)) !== null) {
                switch (result[1]) {
                case 'set':
                    str = this.parseSet(str, params, result);
                    break;
                case 'if':
                    str = this.parseIf(str, params, result);
                    break;
                case 'foreach':
                    str = this.parseForeach(str, params, result);
                    break;
                case 'macro':
                    str = this.parseMacro(str, params, result);
                    break;
                }
                //break; //debug开发阶段只执行一次
            }
            str = this.replaceVariable(str, params);
            return str;
        },
        parseSet: function (str, params, result) { //解析#set
            var start = result.index,
                end = start + result[0].length,
                expression = result[2];

            if (expression.indexOf('=') > -1) {
                expression = expression.split('=');
                params[expression[0].slice(2, -1)] = this.express(expression[1], params);
            } else {
                app.Log('#set 语法错误', 'warn');
            }
            str = str.slice(0, start) + str.slice(end);
            return str;
        },
        parseIf: function (str, params, result) { //解析#if
            var flag = this.express(this.velocityToVariable(result[2], params), params),
                start = result.index,
                middle = this.matchElse(str),
                end = this.matchEnd(str);

            if (end === -1) {
                app.Log('语法错误，缺少#end', 'warn');
                return str;
            }

            //#if(expression) 长度=5+expression.length
            //#end 长度=4
            //#else 长度=5
            if (middle > -1 && middle < end) {
                if (flag) {
                    str = str.slice(0, start) + str.slice(start + result[2].length + 5, middle) + str.slice(end + 4);
                } else {
                    str = str.slice(0, start) + str.slice(middle + 5, end) + str.slice(end + 4);
                }
            } else {
                if (flag) {
                    str = str.slice(0, start) + str.slice(start + result[2].length + 5, end) + str.slice(end + 4);
                } else {
                    str = str.slice(0, start) + str.slice(end + 4);
                }
            }
            return str;
        },
        //#foreach(expression) 长度=10+expression.length
        //#end 长度=4
        parseForeach: function (str, params, result) { //解析#foreach
            var start = result.index,
                end = this.matchEnd(str),
                context = str.slice(start + result[2].length + 10, end),
                arr = result[2].split(' in '),
                list, item, html = '';

            if (arr.length !== 2) {
                app.log('语法错误: ' + result[0], 'error');
                return str;
            }

            item = util.trim(arr[0]).slice(1);
            list = params[util.trim(arr[1]).slice(1)]

            if (list) {
                util.each(list, function (o, index) {
                    var p = velocity.clone(params);
                    p[item] = list[index];
                    p.velocityCount = index + 1;

                    html += velocity.parse(context, p);
                });
            }

            str = str.slice(0, start) + html + str.slice(end + 4);

            return str;
        },
        //#macro(funcName $variable1 $variable2);
        parseMacro: function (str, params, result) { //解析#macro
            var start = result.index,
                end = start + result[0].length,
                ret = '',
                func, arr = [];

            //过滤空格，计算变量值
            util.each(result[2].split(' '), function (v, index) {
                if (!util.isEmpty(v)) {
                    if (index > 0) {
                        arr.push(velocity.getVariable(util.trim(v).slice(2, -1), params));
                    } else {
                        arr.push(util.trim(v));
                    }

                }
            });

            func = arr[0];
            if (func) {
                func = params[func];
                if (func) {
                    ret = func.apply(null, arr.slice(1)) || '';
                } else {
                    app.Log('#macro ' + arr[0] + ' 未定义', 'error');
                }
            } else {
                app.Log('#macro 语法错误，缺少宏名称', 'error')
            }
            str = str.slice(0, start) + ret + str.slice(end);
            return str;
        },
        clone: function () { //抄写对象
            var ret = {},
                i, len, o, p;
            for (i = 0, len = arguments.length; i < len; i++) {
                o = arguments[i];
                for (p in o) {
                    if (o.hasOwnProperty(p) && !ret[p]) {
                        ret[p] = o[p];
                    }
                }
            }
            return ret;
        },
        express: function (expression, params) { //计算表达式
            return eval('(' + expression + ')');
        },
        velocityToVariable: function (str, params) { //将velocity转换成JS
            str = str.replace(VARIABLE, function (all) {
                return 'params.' + all.slice(2, -1);
            });
            return str;
        },
        replaceVariable: function (str, params) { //显示velocity变量
            str = str.replace(VARIABLE, function (all) {
                var name = all.slice(2, -1),
                    value = velocity.getVariable(name, params);

                if (value !== undefined) {
                    return value;
                } else {
                    app.Log('变量 ' + all + '不存在', 'warn');
                    return all;
                }
            });
            return str;
        },
        getVariable: function (name, params) {
            var ret, tmp, arr, i, len;
            if (name.indexOf('.') === -1) {
                ret = params[name];
            } else {
                ret = params;
                arr = name.split('.');
                for (i = 0, len = arr.length; i < len; i++) {
                    if (ret[arr[i]] !== undefined) {
                        ret = ret[arr[i]];
                    } else {
                        app.Log('变量 ' + name + ' 不存在', 'warn');
                        ret = '';
                        break;
                    }
                }
            }
            return ret;
        },
        matchEnd: function (str) { //匹配查找#end的位置
            var reg = /#(foreach|if|end)/g,
                start = 0,
                index = -1,
                result;

            while ((result = reg.exec(str)) !== null) {
                switch (result[1]) {
                case 'foreach':
                case 'if':
                    start += 1;
                    break;
                case 'end':
                    start -= 1;
                    if (start === 0) {
                        index = result.index;
                    }
                    break;
                default:
                    break;
                }

                if (index > -1) {
                    break;
                }
            }

            return index;
        },
        matchElse: function (str) { //匹配查找#else的位置
            var reg = /#(if|else|end)/g,
                start = 0,
                index = -1,
                result;

            while ((result = reg.exec(str)) !== null) {
                switch (result[1]) {
                case 'if':
                    start += 1;
                    break;
                case 'end':
                    start -= 1;
                    break;
                case 'else':
                    if (start === 1) {
                        index = result.index;
                    }
                    break;
                default:
                    break;
                }

                if (index > -1) {
                    break;
                }
            }
            return index;
        }
    };

    return {
        render: function (name, params) {
            if (typeof templates[name] !== 'string') {
                app.Log('Template ' + name + ' not found!', 'warn');
                return '';
            } else {
                return velocity.parse(templates[name], params);
            }
        },
        define: function (name, template) {
            if (typeof template == 'string') {
                templates[name] = template;
            } else { //数组
                templates[name] = template.join('');
            }
        }
    };
})();

//inter-module confirmbox
app.ConfirmBox = (function () {
    var util = app.Util;

    function Box(config) {
        var fn = function () {},
            self = this;

        config = config || {};
        this.config = {
            msg: config.msg || '确定？',
            des: config.des || '',
            confirm: config.confirm || fn,
            cancel: config.cancel || fn
        };
        this.p = util.create('<div class="confirm-wrapper fn-clear"></div>');
        this.btnOk = util.create('<span class="ui-round-btn ui-round-btn-mini"><input type="button" class="ui-round-btn-text" value="确定" /></span>');
        this.btnCancel = util.create('<span class="ui-round-btn ui-round-btn-mini"><input type="button" class="ui-round-btn-text" value="取消" /></span>');

        util.addEvent(this.btnOk, 'click', function () {
            self.config.confirm();
            self.hide();
        });
        util.addEvent(this.btnCancel, 'click', function () {
            self.config.cancel();
            self.hide();
        });

        this.p.appendChild(util.create('<div class="msg fn-left">' + this.config.msg + '</div>'));
        this.action = util.create('<div class="fn-left"></div>');
        this.action.appendChild(this.btnOk);
        this.action.appendChild(this.btnCancel);
        this.p.appendChild(this.action);
        document.body.appendChild(this.p);
    }
    Box.prototype = {
        show: function () {
            this.p.style.display = 'block';
        },
        hide: function () {
            this.p.style.display = 'none';
            this.id = 0;
        },
        setPosition: function (pos) {
            pos = pos || {
                left: 0,
                top: 0
            };
            this.p.style.left = pos.left + 'px';
            this.p.style.top = pos.top + 'px';
        },
        setConfirm: function (fn) {
            fn = fn ||
            function () {};
            this.config.confirm = fn;
        },
        setCancel: function (fn) {
            fn = fn ||
            function () {};
            this.config.cancel = fn;
        }
    };

    return function (config) {
        return new Box(config);
    };
})();

//inter-module tab
app.Tab = (function () {
    var util = app.Util;

    function Tabs(cfg) {
        this.nav = util.children(cfg.id);
        this.menu = util.children(cfg.id + '-Cnt');
        this.cls = cfg.cls || 'current';
        this.index = cfg.index || 0;
        this.init();
    }
    Tabs.prototype = {
        init: function () {
            var self = this;
            util.each(self.nav, function (item, index) {
                util.addEvent(item, 'click', function (ev) {
                    util.preventDefault(ev);
                    self.set(index);
                });
            });
            this.set(self.index);
        },
        set: function (index) {
            var self = this;
            index = index || 0;
            util.each(self.nav, function (item) {
                util.removeClass(item, self.cls);
            });
            util.each(self.menu, function (item) {
                util.removeClass(item, self.cls);
            });
            util.addClass(self.nav[index], self.cls);
            util.addClass(self.menu[index], self.cls);
        }
    };

    return function (cfg) {
        return new Tabs(cfg);
    };
})();