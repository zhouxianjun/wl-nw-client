var _unreads = 0;
var _unreadChatMsgWins = 0;
function initSocket(fn) {
	if(typeof io === 'undefined')return;
	var socket = io.connect(socketio);
	socket.push = function(){
		if(this.socket.open){
			if(arguments.length > 1)
				this.emit(arguments[0],arguments[1]);
			else
				this.emit(arguments[0]);
			return true;
		}else{
			if(arguments && arguments[arguments.length - 1]){
				var _window = arguments[arguments.length - 1];
				if(_window.notifier){
					_window.notifier.warning({ 
						message: "您已处于离线状态...",
						destroy: true,	// hides all existing notification
						opacity: 0.5,
						ms: 3000,
						loader: false
					});
				}
			}
			return false;
		}
	}
	socket.on('connect', function(){
    	if(typeof fn === 'function'){
    		fn(socket);
    	}
    });
	
	socket.on('delFriend', function(data){
		delFriend(data.from);
    });
	
	socket.on('pushFile', function(data){
		var chats = getLocalStorage('chats') || [];
		var chat = chats[data.from.id];
		if(!chat){
			openChat(data.from.id, data.chat.type, function(chat){
				setTimeout(function(){
					chats = getLocalStorage('chats');
					chats[data.from.id].window.showFileDiv(data.file, data);
				}, 500);
			});
		}else{
			chat.window.showFileDiv(data.file, data);
		}
    });
	
	socket.on('pushFileOk', function(data){
		var chats = getLocalStorage('chats') || [];
		var chat = chats[data.from.id];
		if(chat){
			console.log(data.local);
		}
    });
	
	socket.on('pushFileCancel', function(data){
		var chats = getLocalStorage('chats') || [];
		var chat = chats[data.from.id];
		if(chat){
			chat.window.cancelFileTransfer(data.sha, data.name, true);
			chat.window.insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '对方中断了 '+data.name+' 文件传送.',
			});
		}
    });
	
	socket.on('rumble', function(data){
		var chats = getLocalStorage('chats') || [];
		var chat = chats[data.from.id];
		if(!chat){
			openChat(data.from.id, data.chat.type, function(chat){
				setTimeout(function(){
					chats = getLocalStorage('chats');
					chats[data.from.id].window.rumble(true);
					chats[data.from.id].window.insertSystemMsg({
						time: moment().format('YYYY-MM-DD HH:mm:ss'),
						msg: '对方调皮的抖动了一下您。',
					});
				}, 500);
			});
		}else{
			chat.window.rumble(true);
			chat.window.insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '对方调皮的抖动了一下您。',
			});
		}
    });
	
	socket.on('updateInfo', function(data){
		var user = getFreindInfo(data.id, data);
		if(user){
			var chatFace = $('#chatFace' + data.id);
			if(chatFace[0]){
				$('#chatFace' + data.id).css('-webkit-filter', 'grayscale('+(data.login.online ? 0 : 1)+')').attr('src', data.userExt.face)[0].onerror = faceNofind;
			}
			$('#friendFace' + data.id).css('-webkit-filter', 'grayscale('+(data.login.online ? 0 : 1)+')').attr('src', data.userExt.face)[0].onerror = faceNofind;
			$('#friendNickName' + data.id).text(data.userExt.nickName);
			$('#friendSignature' + data.id).text(data.userExt.signature || '').attr('title', data.userExt.signature || '');
			var chats = getLocalStorage('chats') || [];
			if(chats[data.id]){
				chats[data.id].window.updateInfo(data);
			}
		}
    });
	
	/**
	 * 收到rtc视频会话请求
	 * @author Gary
	 */
	socket.on('rtc', function(data){
		var user = getFreindInfo(data.from.id);
		if(user){
			var chats = getLocalStorage('chats') || [];
			if(!chats[data.from.id]){
				openChat(data.from.id, data.chat.type, function(chat){
					setTimeout(function(){
						chats = getLocalStorage('chats');
						chats[data.from.id].window.showRTCRequest(data);
					}, 500);
				});
			}else{
				chats[data.from.id].window.showRTCRequest(data);
			}
		}
    });
	
	/**
	 * 收到视频会话请求被接受(对方接受了)
	 * @author Gary
	 */
	socket.on('rtcOk', function(data){
		var chats = getLocalStorage('chats') || [];
		if(chats && chats[data.id]){
			chats[data.id].window.waitRTC.destroy();
			chats[data.id].window.waitRTC = true;
			chatRTC(data.chat.id, data.id);
			chats[data.id].window.insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '对方接受了您的视频邀请。',
			});
		}else{
			socket.push('rtcClose', data, window);
		}
    });
	
	socket.on('rtcClose', function(data){
		var chats = getLocalStorage('chats') || [];
		if(chats && chats[data.from.id]){
			chats[data.from.id].window.waitRTC = false;
			chats[data.from.id].window.insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '对方挂断了视频视频通话',
			});
			var rtcs = getLocalStorage('rtcs');
			if(rtcs && rtcs[data.chat.id]){
				rtcs[data.chat.id].close();
			}
		}
    });
    
	/**
	 * 收到视频会话请求被拒绝
	 * @author Gary
	 */
    socket.on('rtcFail', function(data){
    	var chats = getLocalStorage('chats') || [];
		if(chats && chats[data.id]){
			chats[data.id].window.waitRTC.destroy();
			chats[data.id].window.waitRTC = false;
			chats[data.id].window.insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '对方拒绝了您的视频请求',
			});
		}
    });
    
    socket.on('addFriendFail', function(data){
    	ajax({
			url: baseUrl + '/wl/msg/read.do',
			data: {
				from: getLocalStorage('user').id,
				to: data.friend.id,
				type: 3,
				state: 3
			},
			success: function(){
				loadingMsg({
					message: data.friend.userExt.nickName + '拒绝您的好友申请!<br>附加信息: '+ data.content || '无',
					ms: false,
					hideOnClick: true,
					loader: false
				});
			}
    	});
    });
	
    socket.on('addFriendOk', function(data){
    	loadingMsg({
			message: data.friend.userExt.nickName + '同意了您的好友申请!',
			ms: 5000,
			loader: false
		});
		addFriend({
			id: data.friend.id,
			group: data.group, 
			name: data.friend.name,
			nickName: data.friend.userExt.nickName,
			isOnline: data.friend.login.online,
			signature: data.friend.userExt.signature
		});
    	addMemFriend(data.group, {
    		id: data.friend.id,
			face: data.friend.userExt.face,
			level: data.friend.login.level,
			nickName: data.friend.userExt.nickName,
			signature: data.friend.userExt.signature,
			online: data.friend.login.online
		});
    	updateGroupOnline();
    });
    
	socket.on('disconnect', function(){
		$('#my_face').css('-webkit-filter', 'grayscale(1)');
		tray.tooltip = 'Gary 微聊\n' + getLocalStorage('user').name + '\n状态: 离线';
    });
	
	socket.on('close', function(data){
		showMsg({
			title: '提醒',
			message: '您的帐号于 ' + moment().format('YYYY-MM-DD HH:mm:ss') + ' 在 ' + data.ipinfo.country + data.ipinfo.region + data.ipinfo.city + '登录。',
			type: 'error',
			callback: function(){
				win.close();
				return true;
			}
		});
    });
	
    socket.on('reconnecting', function(){
    	if(this.socket.reconnectionAttempts >= this.socket.options['max reconnection attempts']){
    		this.socket.reconnectionAttempts = 0;
    	}
    });
	
	socket.on('login', function(data) {
		if(data && data.success == true){
			setLocalStorage('online', true);
			$('#my_face').css('-webkit-filter', 'grayscale(0)');
			tray.tooltip = 'Gary 微聊\n' + getLocalStorage('user').name + '\n状态: 在线';
		}else if(data && data.success == false){
			setLocalStorage('online', false);
			$('#my_face').css('-webkit-filter', 'grayscale(1)');
			tray.tooltip = 'Gary 微聊\n' + getLocalStorage('user').name + '\n状态: 离线';
		}
	});
	socket.on('online', function(data) {
		startAudio('sounds/friend_login.wav');
		getFreindInfo(data.id, data);
		var friend = $('#friendOnline' + data.id);
		if(friend && friend[0]){
			friend.text('在线');
			$('#friendFace' + data.id).css('-webkit-filter', 'grayscale(0)');
			$('#chatFace' + data.id).css('-webkit-filter', 'grayscale(0)');
			updateGroupOnline();
			var chats = getLocalStorage('chats') || [];
			if(chats[data.id]){
				chats[data.id].window.updateInfo(data);
			}
		}
		var onlineWindow = getLocalStorage('onlineWindow');
		if(onlineWindow){
			onlineWindow.window.remoteLoad();
		}
		/*var group = getFriendGroup(data.id);
		var text = $('.friends_is_online', group).text();
		text = text.split('/');
		var online = parseInt(text[0]) + 1;
		$('.friends_is_online', group).text(online + '/' + text[1]);*/
	});
	socket.on('logout', function(data) {
		startAudio('sounds/friend_logout.wav');
		getFreindInfo(data.id, data);
		var friend = $('#friendOnline' + data.id);
		if(friend && friend[0]){
			friend.text('离线');
			$('#friendFace' + data.id).css('-webkit-filter', 'grayscale(1)');
			$('#chatFace' + data.id).css('-webkit-filter', 'grayscale(1)');
			updateGroupOnline();
			var chats = getLocalStorage('chats') || [];
			if(chats[data.id]){
				chats[data.id].window.updateInfo(data);
			}
		}
		var onlineWindow = getLocalStorage('onlineWindow');
		if(onlineWindow){
			onlineWindow.window.remoteLoad();
		}
		/*var group = getFriendGroup(data.id);
		var text = $('.friends_is_online', group).text();
		text = text.split('/');
		var online = parseInt(text[0]) - 1;
		$('.friends_is_online', group).text(online + '/' + text[1]);*/
	});
	socket.on('addFriend', function(data) {
		if(data && data.success == true){
		}else{
			alert('发送添加好友请求失败');
		}
	});
	socket.on('addFriendV', function(data) {
		startAudio('sounds/buddy_invite.wav');
		_unreads++;
		updateRequestUnread();
	});
	socket.on('pushError', function(data) {
		console.log(data);
		alert('发送消息失败' + data);
	});
	socket.on('push', function(data) {
		startAudio('sounds/pm_receive.wav');
		var chats = getLocalStorage('chats') || [];
		var chat = chats[data.chat.type == 1 ? data.from.id : data.chat.id];
		data.date = moment(data.date).format('YYYY-MM-DD HH:mm:ss');
		if(chat){
			ajax({
				url: baseUrl + '/wl/msg/read.do',
				data: {
					from: data.from.id,
					to: data.id,
					type: data.chat.type
				},
				success: function(d){
					chat.window.insertReceiveMsg({
						id: data.from.id,
						time: data.date,
						nickName: data.from.userExt.nickName,
						msg: data.content,
						style: data.style,
						file: data.file
					});
					data.file && (data.content = '[文件]');
					updateChat(data);
					chat.focus();
				}
			});
		}else{
			rumbleFaces[data.from.id] = $('#friendFace' + data.from.id).jrumble({
				x: 0,
				y: 4,
				rotation: 0,
				speed: 100,
				opacity: true
			});
			rumbleFaces[data.from.id].trigger('startRumble');
			data.file && (data.content = '[文件]');
			updateChat(data, true);
			win.focus();
		}
	});
}
function updateRequestUnread(){
	var isonline = getLocalStorage('online') ? '在线' : '离线';
	if(_unreads)
		tray.tooltip = 'Gary 微聊 - '+_unreads+' 条验证消息\n' + getLocalStorage('user').name + '\n状态: ' + isonline;
	else
		tray.tooltip = 'Gary 微聊\n' + getLocalStorage('user').name + '\n状态: ' + isonline;
}