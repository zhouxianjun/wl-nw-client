var remember;
var remembers = getCookieStorage('remembers');
var cookieUsers = getCookieStorage('cookie_users') || [];
var configDig;
$(function(){
	win.setResizable(false);
	$('#username').focus();
	navite.listenClose(function(){
		var msgs = getLocalStorage('msgs');
		if(msgs){
			for ( var i = 0; i < msgs.length; i++) {
				msgs[i].close();
			}
		}
	});
	$('input[type="submit"]').mouseover(function(){
		startAudio('sounds/login.wav');
	}).mouseout(function(){
		stopAudio('sounds/login.wav');
	}).click(function(){
		startAudio('sounds/playbutton.wav');
	});
	$(window).keypress(function(event){
		if(event.keyCode == 15 && event.ctrlKey && event.shiftKey && !configDig){
			configDig = notifier.notify({
				title: '配置服务器地址',
				message: '<div><div style="float: left;width: 80px;">主服务器:</div><input value="'+baseUrl+'" type="text" id="main_server"/></div><div><div style="float: left;width: 80px;">消息服务器:</div><input value="'+socketio+'" type="text" id="socket_server"/></div><div><div style="float: left;width: 80px;">视频服务器:</div><input value="'+rtcServer+'" type="text" id="rtc_server"/></div>',
				buttons: [
				{'data-role': 'ok', text: '确定'},
				{'data-role': 'reset', text: '重置'},
				{'data-role': 'no', text: '取消'}
				],
				modal: true,
				ms: null,
				modal: true,
				destroy: false
			}).on('click:ok', function(){
				var main_server = $('#main_server').val();
				var socket_server = $('#socket_server').val();
				var rtc_server = $('#rtc_server').val();
				var regx = /http(s)?:\/\/[^\s]*/;
				if(!regx.test(main_server)){
					$('#main_server').focus();
					return;
				}else if(!regx.test(socket_server)){
					$('#socket_server').focus();
					return;
				}else if(!regx.test(rtc_server)){
					$('#rtc_server').focus();
					return;
				}
				configDig = false;
				setLocalStorage('server_config', {
					main: $('#main_server').val(),
					socket: $('#socket_server').val(),
					rtc: $('#rtc_server').val()
				});
				this.destroy();
				win.reload();
			}).on('click:reset', function(){
				configDig = false;
				setLocalStorage('server_config');
				this.destroy();
				win.reload();
			}).on('click:no', function(){
				configDig = false;
				this.destroy();
			});
		}
	});
	remember = remembers && remembers.length ? remembers[remembers.length - 1] : false;
	if(remember){
		$('#remember')[0].checked = true;
		$('#username').val(remember.name);
		$('#password').val(remember.password);
		
		$("#username").bind('input', function () {
			var have = false;
		   	for ( var i = 0; i < remembers.length; i++) {
				if(this.value == remembers[i].name){
					$('#password').val(remembers[i].password);
					have = true;
				}
			}
		   	if(!have){
		   		$('#password').val('');
		   	}
		});
	}
	if(cookieUsers.length){
		for ( var i = 0; i < cookieUsers.length; i++) {
			$('#users').append('<option value="'+cookieUsers[i]+'"></option> ');
		}
	}
	setTimeout(function(){
		ajax({
			url: baseUrl + '/wl/main/getConfig.do',
			success: function(data){
				setLocalStorage('config', data.data.config);
				checkUpdate(window, true);
			},
			error: function(data){
				showMsg({
					title: '错误',
					message: data.msg,
					type: 'warning'
				});
			}
		});
	}, 200);
});
function showReg(){
	setTimeout(function(){
		navite.setSize(null, 546);
		$('#usernamesignup').focus();
	},200);
}
function showLogin(){
	navite.setSize(null, 424);
	$('#username').focus();
}
function onLogin(){
	var param = {
		name: $('#username').val(),
		password: $('#password').val()
	};
	ajax({
		url: baseUrl + '/wl/user/login.do',
		data: param,
		success: function(data){
			if($('#remember')[0].checked){
				remembers = remembers ? remembers : [];
				if(remembers && remembers.length){
					var have = false;
					for ( var i = 0; i < remembers.length; i++) {
						if(remembers[i].name == param.name){
							remembers[i] = param;
							have = true;
							break;
						}
					}
					if (!have) {
						remembers.push(param);
					}
				}else{
					remembers.push(param);
				}
				setCookieStorage('remembers', remembers);
			}else{
				if(!remembers || !remembers.length){
					setCookieStorage('remembers', false);
				}
			}
			if(cookieUsers && cookieUsers.length){
				var have = false;
				for ( var i = 0; i < cookieUsers.length; i++) {
					if(cookieUsers[i] == param.name){
						have = true;
						break;
					}
				}
				if (!have) {
					cookieUsers.push(param.name);
				}
			}else{
				cookieUsers.push(param.name);
			}
			if(cookieUsers.length > 5){
				cookieUsers = cookieUsers.slice(cookieUsers.length - 5);
			}
			setCookieStorage('cookie_users', cookieUsers);
			setLocalStorage('user', data.data.user);
			navite.closeWin();
			var main = navite.newWin('main.html');
			main.hide();
			setLocalStorage('main', main);
		},
		error: function(data){
			showMsg({
				title: '错误',
				message: data.msg,
				type: 'warning'
			});
		}
	});
	return false;
}
function onReg(){
	getIp(function(){}, function(data){
		if(data.code != 0){
			return;
		}
		ajax({
			url: baseUrl + '/wl/user/reg.do',
			data: {
				name: $('#usernamesignup').val(),
				email: $('#emailsignup').val(),
				password: $('#passwordsignup').val(),
				ip: data.data.ip
			},
			success: function(data){
				//$('#_toLogin').click();
				showMsg({
					title: '提示',
					message: '注册成功',
					type: 'success'
				});
			},
			error: function(data){
				showMsg({
					title: '错误',
					message: data.msg,
					type: 'warning'
				});
			}
		});
	});
	return false;
}