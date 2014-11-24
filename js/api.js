var gui = require('nw.gui');
var win = gui.Window.get();
var audios = getLocalStorage('audios') || {};
var server_config = getLocalStorage('server_config');
var baseUrl = server_config ? server_config.main : 'http://gary.wicp.net:80';
var socketio = server_config ? server_config.socket : 'http://gary.wicp.net:4567';
var rtcServer = server_config ? server_config.rtc : 'http://gary.wicp.net:8888';
if(!getLocalStorage('chats'))
	setLocalStorage('chats', new Array());
var notifier;
var config = getLocalStorage('config');
var version = '1.0.4';
win.on('loaded', function(){
	window.ondragover = function(e) { e.preventDefault(); return false };
	window.ondrop = function(e) { e.preventDefault(); return false };
	if(typeof Backbone != 'undefined'){
		notifier = new Backbone.Notifier({
		    ms: 5000,
		    hideOnClick: false
		});
	}
	if(win.type != 'MSG'){
		win.show();
		win.focus();
	}
	$(window).keypress(function(event){
		if(event.keyCode == 10 && event.ctrlKey && event.shiftKey){
			win.showDevTools();
		}
	});
	if($('.autoscroll').length){
		$('.autoscroll').mouseover(function(){
			$(this).css('overflow-y', 'auto');
		}).mouseout(function(){
			$(this).css('overflow-y', 'hidden');
		});
	}
});
var tray;
var navite = {
	// 窗口最小化
	minimize : function() {
		win.minimize();
	},
	maximize: function(){
		win.maximize();
	},
	restore: function(){
		win.restore();
	},
	listenMove : function(fn) {
		win.on('move', fn);
	},
	// 监听窗口最小化事件
	listenMinimize : function(fn) {
		win.on('minimize', fn);
	},
	// 监听窗口关闭事件
	listenClose : function(fn) {
		win.on('closed', fn);
	},
	// 取消窗口关闭事件的监听
	cancelClose : function() {
		win.removeAllListeners('closed');
	},
	// 监听窗口最大化事件
	listenMaximize : function(fn) {
		win.on('maximize', fn);
	},
	// 取消窗口最大化事件的监听
	cancelMaximize : function() {
		win.removeAllListeners('maximize');
	},
	// 监听窗口还原事件
	listenRestore : function(fn) {
		win.on('unmaximize', fn);
	},
	// 取消窗口还原事件的监听
	cancelRestore : function() {
		win.removeAllListeners('unmaximize');
	},
	// 取消窗口最小化事件的监听
	cancelMinimize : function() {
		win.removeAllListeners('minimize');
	},
	// 创建新的窗口
	newWin : function(url, opt) {
//		opt = opt || {};
//		opt.show = opt.show || false;
		return gui.Window.get(window.open(url, opt));
	},
	// 关闭当前窗口
	closeWin : function() {
		win.close();
	},
	setSize: function(w, h){
		if(w)
			win.width = w;
		if(h)
			win.height = h;
	},
	// 创建右键菜单
	createContextMenu : function() {
		var menu = new gui.Menu();
		menu.append(new gui.MenuItem({
			label : 'Item A'
		}));
		menu.append(new gui.MenuItem({
			label : 'Item B'
		}));
		menu.append(new gui.MenuItem({
			type : 'separator'
		}));
		menu.append(new gui.MenuItem({
			label : 'Item C'
		}));
		document.body.addEventListener('contextmenu', function(ev) {
			ev.preventDefault();
			menu.popup(ev.x, ev.y);
			return false;
		});
	},
	// 创建系统托盘
	createTrayMenu : function(menus, icon) {
		var trayMenu = new gui.Menu();
		for ( var i = 0; i < menus.length; i++) {
			trayMenu.append(new gui.MenuItem(menus[i]));
		}
		console.log(typeof trayMenu);
		console.log(typeof menus);
		tray = new gui.Tray({
			title : '系统托盘',
			icon: icon || 'images/qq_16.png'
		});
		tray.menu = trayMenu;
		tray.tooltip = 'Gary 微聊';
		tray.on('click', function() {
			//this.remove();// 删除系统托盘
			//tray = null;
			win.show();// 显示窗口
			win.focus();
		});
	},
	flashTray: function(icon, time){
		this.createTrayMenu([], icon);
	}
}
function outChat(id){
	ajax({
		url: baseUrl + '/wl/chat/outChat.do',
		data: {
			id: id,
			userId: getLocalStorage('user').id
		},
		success: function(data){
			var chat = data.data.chat;
			getLocalStorage('socket').push('push', {
				id: id,
				content: getLocalStorage('user').userExt.nickName + '退出了讨论组!',
				type: 0,
				chat: chat
			}, window);
			getLocalStorage('main').window.removeDataId(id);
			var chats = getLocalStorage('chats');
			if(chats && chats[id]){
				chats[id].close();
			}
		},
		error: function(data){
			
		}
	});
}
function ajax(opt, loading){
	opt.showLoading = opt.showLoading || true;
	if(opt.showLoading){
		window.loading = loadingMsg(loading || {});
	}
	if(getLocalStorage('user') && getLocalStorage('socket') && getLocalStorage('socket').socket.open)
		opt.data._userid = getLocalStorage('user').id;
	$.ajax({
		dataType: opt.type || "json",
		url: opt.url,
		data: opt.data,
		type: opt.method || 'post',
		contentType: opt.contentType,
		complete: function(){
			if(window.loading && window.loading.destroy)
				window.loading.destroy();
		},
		error: function(xhr, s, e){
			if(window.loading && window.loading.destroy)
				window.loading.destroy();
			showMsg({
				title: '错误',
				message: '服务器异常',
				type: 'error'
			});
		},
		success: function(data){
			if(window.loading && window.loading.destroy)
				window.loading.destroy();
			if(data && data.success){
				if(typeof opt.success == 'function')
					opt.success(data);
			}else{
				if(data.executeResult.result == 405){
					showMsg({
						title: '错误',
						message: data.msg || data.executeResult.resultMsg,
						type: 'warning',
						callback: function(){
							if(typeof opt.error == 'function')
								opt.error(data);
							return true;
						}
					});
				}else if(data.executeResult.result == 400){
					var msg;
					if(data.data.validation){
						msg = '';
						for ( var i = 0; i < data.data.validation.length; i++) {
							var v = data.data.validation[i];
							msg += v.errorMsg + '<br>';
						}
					}
					showMsg({
						title: data.executeResult.resultMsg,
						message: msg || (data.msg || data.executeResult.resultMsg),
						type: 'warning',
						callback: function(){
							if(typeof opt.error == 'function')
								opt.error(data);
							return true;
						}
					});
				}else{
					if(typeof opt.error == 'function')
						opt.error(data);
				}
			}
		}
	});
}
function getNum(text){
	return text.replace(/[^0-9]/ig,""); 
}
function getQueryString(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = decodeURIComponent(window.location.search).substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}
function getIp(error, success, gen){
	$.ajax({
		dataType: "json",
		url: 'http://ip.taobao.com/service/getIpInfo.php?ip=myip',
		error: (gen ? success : error),
		success: success
	});
}
function loadGroup(success){
	ajax({
		url: baseUrl + '/wl/group/list.do',
		data: {
			id: getLocalStorage('user').id
		},
		success: success
	});
}
function setLocalStorage(name, data){
	//localStorage[name] = JSON.stringify(data);
	global[name] = data;
}
function getLocalStorage(name){
	/*var val = localStorage[name];
	if(val){
		return $.parseJSON(val);
	}else{
		return '';
	}*/
	return global[name];
}
function isJSON(obj){
    var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
    return isjson;
}
function setCookieStorage(name, data){
	try {
		data = JSON.stringify(data);
	} catch (e) {
		// : handle exception
	}
	localStorage[name] = data;
}
function getCookieStorage(name){
	var val = localStorage[name];
	if(val){
		try {
			return $.parseJSON(val);
		} catch (e) {
			return val;
		}
	}else{
		return false;
	}
}
function delMemFriend(id){
	var user = getLocalStorage('user');
	var dto;
	if(user && user.groups){
		for ( var i = 0; i < user.groups.length; i++) {
			var group = user.groups[i];
			var have = false;
			for ( var j = 0; j < group.usersDto.length; j++) {
				if(id == group.usersDto[j].id){
					dto = group.usersDto[j];
					delete group.usersDto[j];
					have = true;
					break;
				}
			}
			if(have){
				group.usersDto = delUndefinde(group.usersDto);
			}
		}
	}
	setLocalStorage('user', user);
	return dto;
}
function addMemFriend(groupid, userdto){
	var user = getLocalStorage('user');
	if(user && user.groups){
		for ( var i = 0; i < user.groups.length; i++) {
			var group = user.groups[i];
			if(group.id == groupid){
				var have = false;
				for ( var j = 0; j < group.usersDto.length; j++) {
					if(userdto.id == group.usersDto[j].id){
						have = true;
						break;
					}
				}
				if(!have){
					group.usersDto.push(userdto);
				}
			}
		}
	}
	setLocalStorage('user', user);
}
function getFriendNoteName(noteNames){
	if(noteNames && noteNames.length){
		for ( var h = 0; h < noteNames.length; h++) {
			if(noteNames[h].belongsDto.id == getLocalStorage('user').id){
				return noteNames[h].name;
			}
		}
	}
	return null;
}
function getFreindInfo(id, tag){
	var user = getLocalStorage('user');
	if(user && user.groups){
		for ( var i = 0; i < user.groups.length; i++) {
			var group = user.groups[i];
			for ( var j = 0; j < group.usersDto.length; j++) {
				var u = group.usersDto[j];
				if(u && u.id == id){
					if(tag){
						u.face = tag.userExt.face;
						u.level = tag.login.level;
						u.nickName = tag.userExt.nickName;
						u.signature = tag.userExt.signature;
						u.online = tag.login.online;
						u.ipinfo = tag.ipinfo;
						u.noteName = getFriendNoteName(tag.noteNames);
					}
					return u;
				}
			}
		}
	}
	return false;
}
function rplHtml(html){
	return html.replace(/<[^>]*>/g, "");
}
function faceNofind(){ 
	var path = 'images/face.png';
	if(event){
		var img = event.srcElement; 
		img.src = path; 
		img.onerror = null;
	}
	return path;
}
function fileNofind(){ 
	var path = 'filetypeimgs/Default.png';
	if(event){
		var img = event.srcElement; 
		img.src = path; 
		img.onerror = null;
	}
	return path;
}
function startAudio(path){
	stopAudio(path);
	audios[path] = new Audio(path);
	setLocalStorage('audios', audios);
	audios[path].play();
}
function stopAudio(path){
	if(audios[path]){
		audios[path].currentTime = 0;
		audios[path].pause();
	}
}
function openMsgBox(){
	var msgbox = getLocalStorage('msgbox');
	if(!msgbox){
		msgbox = navite.newWin('msgbox.html');
	}else{
		msgbox.window.refresh();
	}
	setLocalStorage('msgbox', msgbox);
	msgbox.show();// 显示窗口
	msgbox.focus();
}
function openOnline(){
	var onlineWindow = getLocalStorage('onlineWindow');
	if(!onlineWindow){
		onlineWindow = navite.newWin('onlineUserStatistics.html');
	}
	setLocalStorage('onlineWindow', onlineWindow);
	onlineWindow.show();// 显示窗口
	onlineWindow.focus();
}
function openCreateOrAddGroup(chat){
	var groupWindow = getLocalStorage('groupWindow');
	if(!groupWindow){
		groupWindow = navite.newWin('createOrAddGroupFriend.html');
	}
	if(chat){
		groupWindow.chat = chat;
	}
	groupWindow.tag = win;
	setLocalStorage('groupWindow', groupWindow);
	groupWindow.show();// 显示窗口
	groupWindow.focus();
	maskWin(groupWindow);
	return groupWindow;
}
function chatRTC(id, chatwindowid){
	var rtcs = getLocalStorage('rtcs') || {};
	if(rtcs[id]){
		rtcs[id].show();
		rtcs[id].focus();
		return;
	}
	rtcs[id] = navite.newWin('rtc.html?chatid=' + id + '&winid=' + chatwindowid, {
		show: false
	});
	setLocalStorage('rtcs', rtcs);
}
function delUndefinde(arr){
	if(arr && arr.length){
		var sz = [];
		for ( var i = 0; i < arr.length; i++) {
			if(arr[i]){
				sz.push(arr[i]);
			}
		}
		return sz;
	}
}
function showMsg(opt, nomodel){
	if(opt){
		var msgs = getLocalStorage('msgs') || [];
		if(!nomodel && msgs[0]){
			msgs[0].show();
			msgs[0].focus();
		}else{
			var msg = navite.newWin('msg.html?title=' + encodeURIComponent(opt.title) + '&message=' + encodeURIComponent(opt.message) + '&type=' + opt.type, {
				position: 'center'
			});
			msg.hide();
			msg.type = 'MSG';
			msg.callback = opt.callback;
			msg.setResizable(false);
			msgs.push(msg);
			setLocalStorage('msgs', msgs);
			if(!nomodel){
				maskAll();
			}
		}
	}
}
function confirmMsg(opt){
	if(!notifier)return;
	opt = $.extend({},{
		type: 'info',
		buttons: [
			{'data-role': 'ok', text: '确定'},
			{'data-role': 'cancel', text: '取消'}
		],
		modal: true,
		position: 'center',
		ms: null,
		destroy: true
	}, opt);
	var cMsg = notifier.notify(opt)
	.on('click:ok', function(){
		if(typeof opt.ok === 'function'){
			opt.ok(this);
		}
	})
	.on('click:cancel', function(){
		if(typeof opt.cancel === 'function'){
			opt.cancel(this);
		}
	});
}
function loadingMsg(opt){
	if(notifier){
		opt = $.extend({},{
			message: "正在请求,请稍后...",
			destroy: true,	// hides all existing notification
			opacity: .5,
			fadeInMs: 0,
			fadeOutMs: 0,
			ms: null,
			position: 'center',
			screenOpacity: 0,
			modal: true,
			loader: true
		}, opt);
		return notifier.info(opt);
	}
}
function maskWin(_win){
	if($('#maskWin')[0]){
		$('#maskWin').show();
	}else{
		$('<div id="maskWin"></div>').appendTo('body').css({
			position: 'absolute', 
			top: '0px', 
			left: '0px', 
			'z-index': 99999, 
			width: win.width, 
			height: win.height, 
			'background-color': '#fff', 
			opacity: 0
		}).click(function(){ 
			if(_win){
				_win.show();
				_win.focus();
			}else{
				hides();
			}
		}).mousedown(function(e){ 
			if( e.button == 2 && !_win) { 
				hides();
				return false; 
			} 
			return true; 
	    });
		function hides(){
			var msgs = getLocalStorage('msgs');
			if(!msgs || !msgs[0] || !msgs.length){
				unMaskAll();
			}else{
				msgs[0].show();
				msgs[0].focus();
			}
		}
	}
}
function unMaskWin(){
	$('#maskWin').remove();
}
function unMaskAll(){
	var chats = getLocalStorage('chats');
	var friendv = getLocalStorage('friendv');
	var findWin = getLocalStorage('findWin');
	var rtcs = getLocalStorage('rtcs');
	var main = getLocalStorage('main');
	var addFriends = getLocalStorage('addFriends');
	var editInfo = getLocalStorage('editInfo');
	var infos = getLocalStorage('infos');
	var groupWindow = getLocalStorage('groupWindow');
	window.opener.unMaskWin();
	if(chats){
		for ( var chat in chats) {
			if(chats[chat] && chats[chat].window){
				chats[chat].window.unMaskWin();
			}
		}
	}
	if(addFriends){
		for ( var addFriend in addFriends) {
			if(addFriends[addFriend] && addFriends[addFriend].window){
				addFriends[addFriend].window.unMaskWin();
			}
		}
	}
	if(infos){
		for ( var info in infos) {
			if(infos[info] && infos[info].window){
				infos[info].window.unMaskWin();
			}
		}
	}
	if(rtcs){
		for ( var rtc in rtcs) {
			if(rtcs[rtc] && rtcs[rtc].window){
				rtcs[rtc].window.unMaskWin();
			}
		}
	}
	if(friendv){
		for ( var i = 0; i < friendv.length; i++) {
			if(friendv[i] && friendv[i].window){
				friendv[i].window.unMaskWin();
			}
		}
	}
	if(findWin && findWin.window){
		findWin.window.unMaskWin();
	}
	if(main && main.window){
		main.window.unMaskWin();
	}
	if(editInfo && editInfo.window){
		editInfo.window.unMaskWin();
	}
	if(groupWindow && groupWindow.window){
		groupWindow.window.unMaskWin();
	}
}
function maskAll(){
	var chats = getLocalStorage('chats');
	var friendv = getLocalStorage('friendv');
	var findWin = getLocalStorage('findWin');
	var rtcs = getLocalStorage('rtcs');
	var main = getLocalStorage('main');
	var addFriends = getLocalStorage('addFriends');
	var editInfo = getLocalStorage('editInfo');
	var infos = getLocalStorage('infos');
	var groupWindow = getLocalStorage('groupWindow');
	maskWin();
	if(chats){
		for ( var chat in chats) {
			if(chats[chat] && chats[chat].window){
				chats[chat].window.maskWin();
			}
		}
	}
	if(addFriends){
		for ( var addFriend in addFriends) {
			if(addFriends[addFriend] && addFriends[addFriend].window){
				addFriends[addFriend].window.maskWin();
			}
		}
	}
	if(infos){
		for ( var info in infos) {
			if(infos[info] && infos[info].window){
				infos[info].window.maskWin();
			}
		}
	}
	if(rtcs){
		for ( var rtc in rtcs) {
			if(rtcs[rtc] && rtcs[rtc].window){
				rtcs[rtc].window.maskWin();
			}
		}
	}
	if(friendv){
		for ( var i = 0; i < friendv.length; i++) {
			if(friendv[i] && friendv[i].window){
				friendv[i].window.maskWin();
			}
		}
	}
	if(findWin && findWin.window){
		findWin.window.maskWin();
	}
	if(main && main.window){
		main.window.maskWin();
	}
	if(editInfo && editInfo.window){
		editInfo.window.maskWin();
	}
	if(groupWindow && groupWindow.window){
		groupWindow.window.unMaskWin();
	}
}
function update(_version){
	var mask = $('<div id="update-mask"></div>').appendTo('body');
	mask.css({
		position: 'fixed',
		top: '0px',
		left: '0px',
		width: '100%',
		height: '100%',
		opacity: '0.5',
		'z-index': '20000',
		'background-color': '#000'
	});
	var content = $('<div id="update-main" class="update-main"><div class="update-wrapper"><div class="update-load-bar"><div id="update-pros" class="update-load-bar-inner" data-loading="0"></div></div><h1>正在更新，请稍后...</h1><p><a href="javascript:gui.Shell.openExternal(\''+_version.url+'\');">您可以点击下载最新完整版客户端</a></p></div><div>').appendTo('body');
	content.css({
		'z-index': '20001',
		position: 'fixed',
		top: '50%',
		'margin-top': - content.height() / 2
	});
	content.css({
		left: '50%',
		'margin-left': - content.width() / 2
	});
	updateDownload(_version.url, function(file){
		closeUpdate();
		var name = file.path.substr(file.path.lastIndexOf('\\') + 1);
		var execpath = global.process.execPath;
		execpath = execpath.substring(0, execpath.lastIndexOf('\\') + 1);
		confirmMsg({
			message: '更新完成!<div>请退出本软件后,把'+file.path+'文件移动到'+execpath+'目录下并重命名为wl.exe</div><div>或dos到'+execpath+'目录下输入命令:update.bat '+name+'</div>',
			buttons: [{
				'data-role': 'ok', text: '确定'
			}],
			ok: function(me){
				me.destroy();
			}
		});
	}, function(loaded){
		$('#update-pros').width(loaded + '%');
	}, function(res){
		closeUpdate();
		confirmMsg({
			message: '更新失败! code: ' + res.statusCode,
			buttons: [{
				'data-role': 'ok', text: '确定'
			}],
			ok: function(me){
				me.destroy();
			}
		});
	});
}
function closeUpdate(){
	$('#update-mask').remove();
	$('#update-main').remove();
}
function checkUpdate(_winodw, isinit){
	ajax({
		url: baseUrl + '/wl/version/now.do',
		data: {
			type: 'PC'
		},
		success: function(data){
			var _version = data.data.now;
			if(_version && _version.version != version){
				if(_winodw && _winodw.notifier){
					confirmMsg({
						message: '您有最新的微聊版本可以更新了!<br><div>本地版本: '+version+' -- 服务器版本: '+_version.version+'</div><div>更新日志:</div><div style="max-Width: 200px;max-height: 100px;overflow: auto;">'+(_version.memo || '')+'</div>',
						ok: function(me){
							me.destroy();
							update(_version);
						},
						cancel: function(me){
							me.destroy();
						}
					});
				}else{
					showMsg({
						message: '您有最新的微聊版本可以更新了!<br><div>本地版本: '+version+' -- 服务器版本: '+_version.version+'</div><div>更新日志:</div><div style="max-Width: 200px;max-height: 100px;overflow: auto;">'+(_version.memo || '')+'</div>',
						callback: function(){
							return true;
						}
					});
				}
			}else{
				if(!isinit){
					if(_winodw && _winodw.notifier){
						confirmMsg({
							message: '您的微聊目前是最新版本!',
							buttons: [{
								'data-role': 'ok', text: '确定'
							}],
							ok: function(me){
								me.destroy();
							}
						});
					}else{
						showMsg({
							message: '您的微聊目前是最新版本!'
						});
					}
				}
			}
		},
		error: function(data){
			showMsg({
				title: '错误',
				message: data.msg,
				type: 'warning'
			});
		}
	});
}
function openInfo(id){
	var infos = getLocalStorage('infos') || [];
	if(infos && infos[id]){
		infos[id].show();
		infos[id].focus();
	}else{
		infos[id] = navite.newWin('info.html?id=' + id);
		setLocalStorage('infos', infos);
	}
}
function openFile(path){
	gui.Shell.openItem(path);
}