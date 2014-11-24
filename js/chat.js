var id;
var chat;
var isinit = false;
var notifier;
var waitRTC = false;
var waitRTCTime = 0;
var chatEditDiv;
var dropImgs = [];
var uploadhttps = {};
var lastMsg;
var firstHis = false;
$(function() {
	id = getQueryString('id');
	chat = win.chat;
	var target = getFreindInfo(id);
	if(!target && chat.type == 2){
		target = {
			nickName: chat.title,
			signature: chat.create.nickName + ' 创建于 ' + chat.createDate,
			online: true,
			noteName: chat.create.noteName,
			face: ''
		}
		$('#outGroupChat').show();
		$('#chatRumbleButton').hide();
	}
	document.title = (target.noteName && target.noteName != '' ? target.noteName : target.nickName) + '- '+ (chat.type == 2 ? '讨论组' : '会话');
	$('#chatNickName').text(chat.type == 1 ? (target.noteName && target.noteName != '' ? target.noteName : target.nickName) : chat.title);
	if(target.signature && target.signature != '')
		$('#chatSignature').text(target.signature).attr('title', target.signature);
	$('#chatFace').css('-webkit-filter', 'grayscale('+(target.online ? 0 : 1)+')').attr({
		src: target.face
	})[0].onerror = faceNofind;
	chatEditDiv = new editDiv('chatMsg');
	win.setMinimumSize(504, 424);
	if(navite){
		navite.listenClose(function(){
			var chats = getLocalStorage('chats');
			delete chats[id];
			setLocalStorage('chats', chats);
			var rtcs = getLocalStorage('rtcs');
			if(rtcs && rtcs[chat.id]){
				rtcs[chat.id].close();
			}
		});
		win.on('close', function(){
			hideFileDiv(function(){
				var rtcs = getLocalStorage('rtcs');
				if(rtcs && rtcs[chat.id]){
					confirmMsg({
						type: 'info',
						message: "关闭会话窗口将会终止视频通话,是否关闭?",
						ok: function(me){
							win.close(true);
						},
						cancel: function(me){
							me.destroy();
						}
					});
				}else{
					win.close(true);
				}
			});
		});
		navite.listenMaximize(function(){
			$('#maxWinDom').hide();
			$('#restoreWinDom').show();
		});
		navite.listenRestore(function(){
			$('#restoreWinDom').hide();
			$('#maxWinDom').show();
		});
	}
	$('body').click(function(e) {
		var historyMsg = $('.chatBox_historyButtonCon');
		var ishistorychild = historyMsg.find(e.target);
		if (!ishistorychild.length) {
			$('#chatLogOptionPanel').fadeOut();
		} else {
			var offset = historyMsg.offset();
			offset.top += 25;
			$('#chatLogOptionPanel').css(offset).fadeIn();
		}

		if ($(e.target).hasClass('chatBox_sendOptionButton')) {
			$('#sendOptionPanel').css({
				bottom : 30,
				right : 9
			}).fadeIn();
		} else {
			$('#sendOptionPanel').fadeOut();
		}

		if ($(e.target).hasClass('chatBox_faceButton')) {
			var offset = $('.chatBox_faceButton').offset();
			offset.left = 0;
			offset.top -= $('#EQQ_facePanel').height();
			$('#EQQ_facePanel').css(offset).fadeIn();
		} else {
			$('#EQQ_facePanel').fadeOut();
		}
	});
	$('.faceIcon').click(function() {
		var code = $(this).attr('facecode');
		insertContent('<img mark="'+code+'" src="http://0.web.qstatic.com/webqqpic/style/face/'+getNum(code)+'.gif" class="system">');
	});
	$(window).resize(function(){
		var top = window.innerHeight - 83 - 25 - 33 - $('.chatBox_inputBox').height();
		$('.chatBox_toolBar').css('top', top);
		$('.editorToolbar').css('top', top - 35);
		if($('#editorToolbar').is(":visible")){
			$('#unReadPos').css('top', top - 35 - $('#editorToolbar').height());
		}
		$('.chatBox_chatBoard').height(top);
	});
	$('.chatBox_toolBar').draggable({
		axis: "y",
		start: function(e, ui){
			var inputdiv = $('.chatBox_inputBox');
			inputdiv.data('height', inputdiv.height());
		},
		stop: function(e, ui){
			var inputdiv = $('.chatBox_inputBox');
			var msgbox = $('.chatBox_chatBoard');
			if(inputdiv.height() < 50){
				$(this).css('top', parseInt(getNum($(this).css('top'))) - (50 - inputdiv.height()));
				inputdiv.height(50);
			}
			if(msgbox.height() < 75){
				$(this).css('top', 75);
				msgbox.height(75);
				inputdiv.height(window.innerHeight - 75 - 83 - 25 - 33);
			}
		},
		drag: function(e, ui){
			var inputdiv = $('.chatBox_inputBox');
			var msgbox = $('.chatBox_chatBoard');
			if(inputdiv.height() < 50 || msgbox.height() < 75){
				console.log(111);
				return false;
			}
			var oldtop = ui.originalPosition.top;
			var nowtop = ui.position.top;
			//向上
			if(nowtop < oldtop){
				inputdiv.height(inputdiv.data('height') + (oldtop - nowtop));
			}else{
				inputdiv.height(inputdiv.data('height') - (nowtop - oldtop));
			}
			$('.editorToolbar').css('top', nowtop - 35);
			if($('#editorToolbar').is(":visible")){
				$('#unReadPos').css('top', nowtop - 35 - $('#editorToolbar').height());
			}
			msgbox.height($(this).css('top'));
		}
	});
	$('#chatMsg').keypress(function(event){
		if((event.which == 10 || event.which == 13) && !event.shiftKey){
			var sendOption = getCookieStorage('sendOption');
			if(sendOption == 'sendOption_ctrlEnterKey'){
				if(event.ctrlKey){
					sendMsg();
				}else{
					chatEditDiv.newline();
				}
			}else{
				if(!event.ctrlKey){
					sendMsg();
				}else{
					chatEditDiv.newline();
				}
			}
			return false;
		}
	});
	
	$(document).keypress(function(event){
		if(event.ctrlKey){
			if(event.which == 17){
				win.close();
				return false;
			}
			if(event.which == 19){
				sendMsg();
				return false;
			}
		}
	});
	$('.chatBox_chatBoard').height(window.innerHeight - 83 - 33 - 25 - $('.chatBox_inputBox').height());
	
	getUnreadMsg();
	
	getUnreadSystemMsg();
	
	initCookies();
	
	dropMsg();
	
	if(chat.messages && chat.messages.length){
		$('#showDisplayHisMsg').prependTo('.chatBox_msgList').show();
	}
});
function displayHisMsg(){
	ajax({
		url: baseUrl + '/wl/msg/historyMsg.do',
		data: {
			chatId: chat.id,
			lastMsgId: lastMsg ? lastMsg.id : lastMsg
		},
		success: function(data){
			var msgs = data.data.list;
			var has = data.data.has;
			var i = 0;
			var html = '';
			for ( i = msgs.length - 1; i > -1 ; i--) {
				var content = msgs[i].filePath;
				if(content){
					content = content.split('#')[0];
					var index = content.lastIndexOf('\\');
					if(index < 0){
						index = content.lastIndexOf('/');
					}
					content = '[文件]';
				}else{
					content = msgs[i].content;
				}
				var nickName = msgs[i].fromDto.nickName;
				var noteName = getFriendNoteName(msgs[i].fromDto.noteNames);
				if(noteName != null && noteName != ''){
					nickName = noteName;
				}
				if(msgs[i].type == 0){
					html +=	'<dl duin="" time="'+msgs[i].date+'" class="chatBox_buddyMsg">' +
						'<dt class="msgHead">' +
							'<span title=""><span class="icon_green">&nbsp;</span></span><span style="margin-left: 5px">'+msgs[i].date+'</span>' +
						'</dt>' +
						'<dd class="msgBody defaultFontStyle" style="">' +
							'<div class="msgFileBox">'+msgShowImg(content)+'</div>' +
						'</dd>' +
					'</dl>';
				}else{
					if(msgs[i].fromDto.id == getLocalStorage('user').id){
						html +=	'<dl class="chatBox_myMsg">' +
							'<dt class="msgHead" title="'+nickName+'">'+nickName+'<span style="margin-left: 5px">'+msgs[i].date+'</span></dt>' +
							'<dd class="msgBody defaultFontStyle" style="'+msgs[i].style+'">'+msgShowImg(content)+'</dd>' +
						'</dl>';
					}else{
						html +=	'<dl duin="'+msgs[i].fromDto.id+'" time="'+msgs[i].date+'" class="chatBox_buddyMsg">' +
							'<dt class="msgHead">' +
								'<span title="'+nickName+'">'+nickName+'</span><span style="margin-left: 5px">'+msgs[i].date+'</span>' +
							'</dt>' +
							'<dd class="msgBody defaultFontStyle" style="'+msgs[i].style+'">' + msgShowImg(content) +
							'</dd>' +
						'</dl>';
					}
				}
			}
			if(i < 0){
				lastMsg = msgs[msgs.length - 1];
			}
			if(!firstHis){
				html += '<div style="width:100%;line-height:30px;text-align:center;height:30px;background:url("images/time_line.png") no-repeat center middle;"><div style="background:#e9f6ff; display:inline">以上是历史消息</div></div>';
				firstHis = true;
			}
			$(html).insertAfter('#showDisplayHisMsg');
			if(has){
				$('#showDisplayHisMsg').prependTo('.chatBox_msgList').show();
			}else{
				$('#showDisplayHisMsg').hide();
			}
		},
		error: function(data){
			
		}
	});
}
function updateInfo(user){
	var noteName = getFriendNoteName(user.noteNames);
	document.title = (noteName && noteName != '' ? noteName : user.userExt.nickName) + '- 会话';
	$('#chatNickName').text(noteName && noteName != '' ? noteName : user.userExt.nickName);
	if(user.userExt.signature && user.userExt.signature != '')
		$('#chatSignature').text(user.userExt.signature);
	$('#chatFace').css('-webkit-filter', 'grayscale('+(user.login.online ? 0 : 1)+')').attr('src', user.userExt.face)[0].onerror = faceNofind;
}
function getUnreadMsg(){
	ajax({
		url: baseUrl + '/wl/msg/unreads.do',
		data: {
			userid: getLocalStorage('user').id,
			chatid: chat.id,
			type: chat.type
		},
		success: function(data){
			var msgs = data.data.msgs;
			var ids = '';
			var i = 0;
			for ( i = 0; i < msgs.length; i++) {
				ids += msgs[i].id + ',';
				var nickName = msgs[i].fromDto.nickName;
				var noteName = getFriendNoteName(msgs[i].fromDto.noteNames);
				if(noteName != null){
					nickName = noteName;
				}
				insertReceiveMsg({
					id: msgs[i].fromDto.id,
					time: msgs[i].date,
					nickName: nickName,
					msg: msgs[i].content,
					style: msgs[i].style,
					file: msgs[i].filePath
				});
			}
			lastMsg = msgs[i - 1];
			if(msgs && msgs.length){
				getLocalStorage('main').window.updateChat({
					chat: chat,
					content: msgs[i - 1].filePath ? '[文件]' : msgs[i - 1].content,
					date: msgs[i - 1].date
				});
			}else{
				isinit = true;
				getLocalStorage('main').window.hideChatUnread(chat.id);
				getLocalStorage('main').window.stopFaceRumble(id);
			}
			if(ids && ids != ''){
				ajax({
					url: baseUrl + '/wl/msg/reads.do',
					data: {
						ids: ids
					},
					success: function(data){
						getUnreadMsg();
					},
					error: function(data){
						getUnreadMsg();
					}
				});
			}
		},
		error: function(){
			isinit = true;
			getLocalStorage('main').window.hideChatUnread(chat.id);
			getLocalStorage('main').window.stopFaceRumble(id);
		}
	});
}
function getUnreadSystemMsg(){
	ajax({
		url: baseUrl + '/wl/msg/unreads.do',
		data: {
			userid: getLocalStorage('user').id,
			chatid: chat.id,
			type: 0
		},
		success: function(data){
			var msgs = data.data.msgs;
			var ids = '';
			var i = 0;
			for ( i = 0; i < msgs.length; i++) {
				ids += msgs[i].id + ',';
				insertSystemMsg({
					time: msgs[i].date,
					msg: msgs[i].content
				});
			}
			if(msgs && msgs.length){
				getLocalStorage('main').window.updateChat({
					chat: chat,
					content: msgs[i - 1].content,
					date: msgs[i - 1].date
				});
			}else{
				isinit = true;
				getLocalStorage('main').window.hideChatUnread(chat.id);
				getLocalStorage('main').window.stopFaceRumble(id);
			}
			if(ids && ids != ''){
				ajax({
					url: baseUrl + '/wl/msg/reads.do',
					data: {
						ids: ids
					},
					success: function(data){
						getUnreadSystemMsg();
					},
					error: function(data){
						getUnreadSystemMsg();
					}
				});
			}
		},
		error: function(){
			isinit = true;
			getLocalStorage('main').window.hideChatUnread(chat.id);
			getLocalStorage('main').window.stopFaceRumble(id);
		}
	});
}
/**
 * 显示隐藏设置样式工具栏
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:11:02
 */
function showFontBtn() {
	$('#editorToolbar').fadeToggle();
	if($('#editorToolbar').is(":visible")){
		$('#unReadPos').css('top', $('#unReadPos').css('top') - $('#editorToolbar').height());
	}else{
		$('#unReadPos').css('top', $('#unReadPos').css('top') + $('#editorToolbar').height());
	}
}
/**
 * 加粗
 * @param me
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:11:31
 */
function boldBtn(me) {
	me = $(me);
	var str;
	if (me.hasClass('selected')) {
		str = 'normal';
	} else {
		str = 'bold';
	}
	setBoldBtn(str);
}
function setBoldBtn(str) {
	$('.rich_editor').css('font-weight', str);
	setCookieStorage('font-weight', str);
	if(str == 'normal'){
		$('#bold').removeClass('selected');
	}else{
		$('#bold').addClass('selected');
	}
}
/**
 * 斜体
 * @param me
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:12:08
 */
function italicBtn(me) {
	me = $(me);
	var str;
	if (me.hasClass('selected')) {
		str = 'normal';
	} else {
		str = 'italic';
	}
	setItalicBtn(str);
}
function setItalicBtn(str) {
	$('.rich_editor').css('font-style', str);
	setCookieStorage('font-style', str);
	if(str == 'normal'){
		$('#italic').removeClass('selected');
	}else{
		$('#italic').addClass('selected');
	}
}
/**
 * 下划线
 * @param me
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:12:28
 */
function underlineBtn(me) {
	me = $(me);
	var str;
	if (me.hasClass('selected')) {
		str = 'none';
	} else {
		str = 'underline';
	}
	setUnderlineBtn(str);
}
function setUnderlineBtn(str) {
	$('.rich_editor').css('text-decoration', str);
	setCookieStorage('text-decoration', str);
	if(str == 'none'){
		$('#underline').removeClass('selected');
	}else{
		$('#underline').addClass('selected');
	}
}
/**
 * 显示隐藏设置颜色
 * @author Gary
 * @date 2013年12月7日
 * @time 上午6:12:57
 */
function showSelectColor() {
	$('.colorPanel').fadeToggle();
}
/**
 * 选择颜色
 * @param color
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:13:23
 */
function selectedColor(color, noshow) {
	$('.rich_editor').css('color', color);
	noshow || showSelectColor();
	setCookieStorage('color', color);
}
/**
 * 字体
 * @param family
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:13:51
 */
function familyBtn(family) {
	$('.rich_editor').css('font-family', family);
	setCookieStorage('font-family', family);
}
function sizeBtn(size) {
	$('.rich_editor').css('font-size', size + 'pt');
	setCookieStorage('font-size', size);
}
/**
 * 消息发送快捷键方式
 * @param me
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:14:51
 */
function simpleMenuItemSelected(me) {
	if(typeof me == 'string')
		me = $('#' + me);
	else
		me = $(me);
	$('.simpleMenuItem').removeClass('simpleMenuItemSelected');
	me.addClass('simpleMenuItemSelected');
	setCookieStorage('sendOption', me[0].id);
}
function initCookies(){
	var fontSize = getCookieStorage('font-size');
	if(fontSize){
		sizeBtn(fontSize);
		$('#fontSize').val(fontSize);
	}
	
	var fontFamily = getCookieStorage('font-family');
	if(fontFamily){
		familyBtn(fontFamily);
		$('#fontFamily').val(fontFamily);
	}
	
	var color = getCookieStorage('color');
	color && selectedColor(color, true);
	
	var underline = getCookieStorage('text-decoration');
	underline && setUnderlineBtn(underline);
	
	var italic = getCookieStorage('font-style');
	italic && setItalicBtn(italic);
	
	var bold = getCookieStorage('font-weight');
	bold && setBoldBtn(bold);
	
	var sendOption = getCookieStorage('sendOption');
	sendOption && simpleMenuItemSelected(sendOption);
}
function clear(){
	var isshow = $('#showDisplayHisMsg').is(':visible');
	$('.chatBox_msgList').html('');
	if(isshow){
		if(!$('#')[0]){
			$('<div id="showDisplayHisMsg" align="center" style="padding-top:10px;display: none;"><a href="javascript:void(0)" style="text-decoration:none; color:#008bea; line-height:30px;" onclick="displayHisMsg()"><img style="border:none; vertical-align:middle;" src="images/time.gif"/>&nbsp;查看更多消息</a><br></div>').prependTo('.chatBox_msgList').show();
		}else{
			$('#showDisplayHisMsg').prependTo('.chatBox_msgList').show();
		}
	}
}
function rumble(df){
	if(window.isRunRumble){
		return;
	}
	if(!df){
		var dto = getFreindInfo(id);
		if(!dto || !dto.online){
			notifier.warning({ 
				message: "对方已处于离线状态...",
				destroy: true,	// hides all existing notification
				opacity: 0.5,
				ms: 3000,
				loader: false
			});
			return;
		}
		getLocalStorage('socket').push('rumble', {
			to: id,
			from: getLocalStorage('user'),
			chat: chat
		}, window);
	}
	window.isRunRumble = true;
	var m = 0;
	var kz = 0;
	var l = (window.screen.availWidth - window.innerWidth) / 2;
	var t = (window.screen.availHeight - window.innerHeight) / 2;
	var left = 0;
	var top = 0;
	var dd = setInterval(function(){
		if(m > 30){
			clearInterval(dd);
			window.isRunRumble = false;
		}
		if(kz == 0){
			l = l - 4;
			left = -4;
			kz = 1;
		}else if(kz == 1){
			t = t + 4;
			top = 4;
			kz = 2;
		}else if(kz == 2){
			l = l + 4;
			left = 4;
			kz = 3;
		}else if(kz == 3){
			t = t - 4;
			top = -4;
			kz = 0;
		}
		win.moveBy(left, top);
		//window.moveTo(l,t);
		m++;
	},32);
}
function insertContent(content) {
	$('#chatMsg').focus();
	chatEditDiv.insertHTML(content);
	/*var div = document.getElementById('chatMsg');
	div.innerHTML += content;
	setTimeout(function(){
		focusEnd(div);
	}, 500);*/
}
function toNewMsgPos(){
	$('#unReadPos').hide();
	var parent = $('.chatBox_msgList');
	parent.scrollTop(parent[0].scrollHeight);
}
function insertReceiveMsg(opt){
	if(opt.id == getLocalStorage('user').id){
		insertSendMsg(opt);
	}else{
		if(opt.file){
			var content = opt.msg.split('#');
			showFileDiv({
				sha: hex_sha1(opt.file),
				name: content[0],
				size: parseInt(content[1]),
				path: opt.file,
				date: moment(opt.time).format('HH:mm')
			});
		}else{
			var html = '';
			html +=	'<dl duin="'+opt.id+'" time="'+opt.time+'" class="chatBox_buddyMsg">' +
						'<dt class="msgHead">' +
							'<span title="'+opt.nickName+'">'+opt.nickName+'</span><span style="margin-left: 5px">'+opt.time+'</span>' +
						'</dt>' +
						'<dd class="msgBody defaultFontStyle" style="'+opt.style+'">' + msgShowImg(opt.msg) +
						'</dd>' +
					'</dl>';
			var parent = $('.chatBox_msgList');
			var isEnd = parent.scrollTop() + parent.height() >= parent[0].scrollHeight;
			parent.append(html);
			if(isEnd){
				parent.scrollTop(parent[0].scrollHeight);
			}else{
				$('#unReadPos').html('<div class="ellipsis"><span>' + opt.nickName + ': </span>' + opt.msg + '</div>').show();
			}
			return parent;
		}
	}
}
function insertSendMsg(opt){
	var html = '';
	html +=	'<dl class="chatBox_myMsg">' +
				'<dt class="msgHead" title="'+opt.nickName+'">'+opt.nickName+'<span style="margin-left: 5px">'+opt.time+'</span></dt>' +
				'<dd class="msgBody defaultFontStyle" style="'+opt.style+'">'+opt.msg+'</dd>' +
			'</dl>';
	var parent = $('.chatBox_msgList');
	return parent.append(html).scrollTop(parent[0].scrollHeight);
}
function insertSystemMsg(opt){
	var html = '';
	html +=	'<dl duin="'+opt.name+'" time="'+opt.time+'" class="chatBox_buddyMsg">' +
				'<dt class="msgHead">' +
					'<span title="'+opt.nickName+'"><span class="icon_green">&nbsp;</span></span><span style="margin-left: 5px">'+opt.time+'</span>' +
				'</dt>' +
				'<dd class="msgBody defaultFontStyle" style="">' +
					'<div class="msgFileBox">'+opt.msg+'</div>' +
				'</dd>' +
			'</dl>';
	var parent = $('.chatBox_msgList');
	var isEnd = parent.scrollTop() + parent.height() >= parent[0].scrollHeight;
	parent.append(html);
	if(isEnd){
		parent.scrollTop(parent[0].scrollHeight);
	}else{
		$('#unReadPos').html('<div class="ellipsis"><span>' + opt.name + ': </span>' + opt.msg + '</div>').show();
	}
	return parent;
}
/**
 * 转换表情为{[?]}
 * @param msg
 * @param img
 * @returns
 */
function rplImg(msg, img){
	if(msg.indexOf(img) > -1){
		msg = msg.replace(img, '{' + img.match(/\[(.*?)\]/g)[0] + '}');
		return rplImg(msg, img);
	}else{
		return msg;
	}
}
/**
 * {[?]}转换为表情
 * @param msg
 * @param img
 * @returns
 */
function rplImg2(msg, img){
	if(msg.indexOf(img) > -1){
		msg = msg.replace(img, '<img mark="'+img.substring(1, img.length - 1)+'" src="http://0.web.qstatic.com/webqqpic/style/face/'+getNum(img)+'.gif" class="system">');
		return rplImg2(msg, img);
	}else{
		return msg;
	}
}
function rplMsgImg(msg){
	var imgs = msg.match(/<img\s*([^>]*)\s*mark=\"(.*?)\"\s*([^>]*)>/g);
	if(imgs){
		for ( var i = 0; i < imgs.length; i++) {
			msg = rplImg(msg, imgs[i]);
		}
	}
	
	imgs = msg.match(/<img\s*([^>]*)\s*file=\"(.*?)\"\s*([^>]*)>/g);
	if(imgs){
		for ( var i = 0; i < imgs.length; i++) {
			msg = msg.replace(imgs[i], '');
		}
	}
	return msg; 
}
function msgShowImg(msg){
	var imgs = msg.match(/\{\[(.*?)\]\}/g);
	if(imgs){
		for ( var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			if($('a[facecode="'+img.substring(1, img.length - 1)+'"]')[0]){
				msg = rplImg2(msg, img);
			}
		}
	}
	return msg;
}
function groupFirends(){
	var gwin = openCreateOrAddGroup(chat);
}
function outGroupChat(){
	outChat(chat.id);
}
function openRTC(){
	if(chat && !waitRTC){
		waitRTC = notifier.info({ 
			message: "等待对方接受邀请...",
			destroy: true,	// hides all existing notification
			opacity: 0.5,
			ms: false,
			loader: true
		});
		getLocalStorage('socket').push('rtc', {
			id: id,
			chat: chat,
			from: getLocalStorage('user')
		}, window);
		setTimeout(function(){
			if(waitRTC && waitRTC.destroy){
				waitRTC.destroy();
				waitRTC = false;
				insertSystemMsg({
					time: moment().format('YYYY-MM-DD HH:mm:ss'),
					msg: '视频请求无应答!',
				});
			}
		}, 1000 * 30);
	}
}
function showRTCRequest(data){
	confirmMsg({
		buttons: [
			{'data-role': 'ok', text: '接受'},
			{'data-role': 'cancel', text: '拒绝'}
		],
		type: 'info',
		message: "对方向您发送了视频请求!",
		ok: function(me){
			me.destroy();
			waitRTC = true;
			getLocalStorage('socket').push('rtcOk', data, window);
			if(waitRTC){
				chatRTC(chat.id, id);
				insertSystemMsg({
					time: moment().format('YYYY-MM-DD HH:mm:ss'),
					msg: '您接受了对方的视频邀请。',
				});
			}
		},
		cancel: function(me){
			me.destroy();
			getLocalStorage('socket').push('rtcFail', data, window);
		}
	});
}
function focusEnd(obj) {
    if (typeof obj == 'string') obj = document.getElementById(obj);
     obj.focus();
     if (obj.createTextRange) {//ie
         var rtextRange = obj.createTextRange();
         rtextRange.moveStart('character', obj.value.length);
         rtextRange.collapse(true);
         rtextRange.select();
     }
     else if (obj.selectionStart){//chrome "<input>"、"<textarea>"
			obj.selectionStart = obj.value.length;
     }else if(window.getSelection){
    	 var sel = window.getSelection();			

    	 var tempRange = document.createRange();
    	 tempRange.setStart(obj.firstChild, obj.firstChild.length);

    	 sel.removeAllRanges();
    	 sel.addRange(tempRange);
     }
 }
function upload(file, url, callback, progress, wjj){
	
	sha1(file.path, function(val, path){
		if((!getLocalStorage('files') || !getLocalStorage('files')[hex_sha1(path)]) && url != '/wl/upload/msgImg.do'){
			return;
		}
		ajax({
			url: baseUrl + '/wl/upload/sha.do',
			data: {
				sha: val,
				path: wjj
			},
			success: function(data){
				if(data.data.file){
					if(typeof callback === 'function'){
						data.data.files = [data.data.file.path];
			        	callback(file, data);
			        }
				}else{
					var xhr = new XMLHttpRequest();
				    xhr.open("post", baseUrl + url + '?_userid=' + getLocalStorage('user').id + '&sha=' + val, true);
				    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				    xhr.upload.addEventListener("progress", function(e){
				        if(e.lengthComputable){
				            var loaded = Math.ceil((e.loaded / e.total) * 100);
				            if(typeof progress === 'function'){
				            	progress(file, loaded);
				            }
				        }
				    }, false);
				    xhr.addEventListener("load", function(e){
				        var result = jQuery.parseJSON(e.target.responseText);
				        if(typeof callback === 'function'){
				        	callback(file, result);
				        }
				    }, false);
				    var fd = new FormData();
				    fd.append('files', file);
				    xhr.send(fd);
				    uploadhttps[hex_sha1(file.path)] = xhr;
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
	});
}
function uploadImg(dropimg, callback, progress){
	upload(dropimg, '/wl/upload/msgImg.do', callback, progress, config.msg_IMG_PATH);
}
function checkLocalImg(callback){
	var msgImgs = $('img[class="localImg"]', chatEditDiv.obj);
    var uploadImgs = msgImgs.length;
    msgImgs.each(function(index, img){
		var dropimg = dropImgs[$(img).attr('file')];
		if(dropimg){
			uploadImg(dropimg, function(me, data){
				uploadImgs--;
				if(data.data.files && data.data.files.length){
	            	for ( var i = 0; i < data.data.files.length; i++) {
						$('img[file="'+me.stime+'"]', chatEditDiv.obj).attr('src', baseUrl + '/wl/' + config.msg_IMG_PATH + '/' + data.data.files[i]).removeAttr('file');
					}
	            }
			});
		}
	});
    var inter = setInterval(function(){
    	if(uploadImgs <= 0 && typeof callback === 'function'){
    		clearInterval(inter);
			callback();
		}
    }, 100);
}
function sendMsg(){
	if(!isinit)
		return;
	var content = chatEditDiv.getContent();
	var style = $('#chatMsgStyle').attr('style');
	if(content != '' && content && chat && id){
		checkLocalImg(function(){
			content = chatEditDiv.getContent();
			var data = {
				id: id,
				content: rplMsgImg(content),
				style: style,
				chat: chat
			};
			if(getLocalStorage('socket').push('push', data, window)){
				data.date = moment().format('YYYY-MM-DD HH:mm:ss');
				insertSendMsg({
					time: data.date,
					nickName: getLocalStorage('user').userExt.nickName,
					style: style,
					msg: content
				});
				getLocalStorage('main').window.updateChat(data);
			}
			$('#chatMsg').html('').focus();
		});
	}
}
function _insertimg(str) {
    var selection = window.getSelection ? window.getSelection() : document.selection;
    var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
    if (!window.getSelection) {
        document.getElementById('chatMsg').focus();
        var selection = window.getSelection ? window.getSelection() : document.selection;
        var range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
        range.pasteHTML(str);
        range.collapse(false);
        range.select();
    } else {
        document.getElementById('chatMsg').focus();
        range.collapse(false);
        var hasR = range.createContextualFragment(str);
        var hasR_lastChild = hasR.lastChild;
        while (hasR_lastChild && hasR_lastChild.nodeName.toLowerCase() == "br" && hasR_lastChild.previousSibling && hasR_lastChild.previousSibling.nodeName.toLowerCase() == "br") {
            var e = hasR_lastChild;
            hasR_lastChild = hasR_lastChild.previousSibling;
            hasR.removeChild(e)
        }
        range.insertNode(hasR);
        if (hasR_lastChild) {
            range.setEndAfter(hasR_lastChild);
            range.setStartAfter(hasR_lastChild)
        }
        selection.removeAllRanges();
        selection.addRange(range)
    }
}
function sizeMemo(size, level){
	level = level || 0;
	var levels = ['B', 'KB', 'MB', 'GB'];
	if(size > 1024 && level < levels.length - 1){
		size = size / 1024;
		level++;
		return sizeMemo(size, level);
	}else{
		return size.toFixed(2) + levels[level];
	}
}
function showSendFileDiv(file, online){
	navite.setSize(620, 424);
	win.setMinimumSize(620, 424);
	$('#window_body_outer_1').css('width', 'calc(100% - 275px)');
	var fileDiv = $('#fileDiv');
	if(!fileDiv[0]){
		fileDiv = $('<div id="fileDiv" style="top: 83px;position: absolute;right: 0;width: 275px;-webkit-box-shadow: 0px 1px 4px #333;height: calc(100% - 7.2em);border-radius: 5px;"><div style="width: 100%;border: 0;border-radius: 5px 5px 0 0;padding: 3px 8px;font-size: 12px;" class="window_bg_container">传送文件</div><div id="files_div" class="autoscroll"></div></div>');
		fileDiv.appendTo('.window_content');
	}
	var _file = $('#' + file.sha);
	if(!_file[0]){
		var filetype = file.name;
		filetype = filetype.substr(filetype.lastIndexOf('.') + 1).toUpperCase();
		if(filetype == 'RMVB' || filetype == 'RM' || filetype == 'FLASH' || filetype == '3GP'){
			filetype = 'MOVIE';
		}
		file.sizeMemo = sizeMemo(file.size);
		_file = $('<div id="'+file.sha+'" style="margin-top: 40px;"><img style="float: left;margin-left: 20px;" onerror="fileNofind();" src="filetypeimgs/'+filetype+'.png" width="40px" height="40px"/><div><div class="ellipsis" style="float: left;margin-left: 10px;width: 130px;" title="'+file.name+'">'+file.name+'</div><span>('+file.sizeMemo+')</span><div><div class="loading2wrapper"><div class="load-bar" style="margin: 5px 0px 5px 70px;width: calc(100% - 80px);height: 5px;"><div class="load-bar-inner" data-loading="0"></div></div></div></div><div><div style="float: left;margin-left: 10px;">'+moment().format('HH:mm')+'</div><div style="float: right;"><a href="javascript:'+(!online ? 'offlineSendFile(\''+file.sha+'\', true)' : '')+';" style="margin: 0 8px;">'+(online ? ''　: '转离线发送')+'</a><a href="javascript:cancelFileTransfer(\''+file.sha+'\', \''+file.name+'\');" style="margin: 0 8px;">取消</a></div></div></div>');
		_file.appendTo('#files_div');
	}
}
function saveas(path, name){
	var suffix = name.substring(name.lastIndexOf('.'));
	var chooser = $('<input style="display:none;" type="file" nwsaveas="'+name+'" accept="'+suffix+'" />');
	chooser.appendTo('body');
    chooser.change(function(evt) {
    	downloadMsgFile(path, name, chooser.val());
    	chooser.remove();
    });
    chooser.trigger('click');
}
function saveAsFile(sha, path, ip, port, name){
	var suffix = name.substring(name.lastIndexOf('.'));
	var chooser = $('<input style="display:none;" type="file" nwsaveas="'+name+'" accept="'+suffix+'" />');
	chooser.appendTo('body');
    chooser.change(function(evt) {
    	okMsgFile(sha, path, ip, port, chooser.val());
    	chooser.remove();
    });
    chooser.trigger('click');
}
function downloadMsgFile(path, name, save){
	var url = baseUrl+'/wl/'+config.msg_FILE_PATH+'/'+path;
	var sha = hex_sha1(path);
	$('.cancel' + sha).hide();
	download(url, name, function(file){
		var openpath = file.path.replace(/\\/g, '\\\\');
		cancelFileTransfer(sha, name, true);
		insertSystemMsg({
			time: moment().format('YYYY-MM-DD HH:mm:ss'),
			msg: '成功接受文件 <a title="'+file.path+'" href="javascript:openFile(\''+openpath+'\');">'+name+'</a>.',
		});
	}, function(loaded){
		var fid = sha;
		$('.load-bar-inner', '#' + fid).width(loaded + '%');
	}, save, sha, function(fname){
		insertSystemMsg({
			time: moment().format('YYYY-MM-DD HH:mm:ss'),
			msg: '文件 '+fname+'接收失败!',
		});
		$('.cancel' + sha).show();
	});
}
function okMsgFile(sha, path, ip, port, save){
	$('.cancel' + sha).hide();
	var url = 'http://' + ip + ':' + port + '/getFile?path=' + path + '&id=' + getLocalStorage('user').id;
	download(url, path.substr(path.lastIndexOf('\\') + 1), function(file){
		var openpath = file.path.replace(/\\/g, '\\\\');
		var name = file.path.substr(file.path.lastIndexOf('\\') + 1);
		cancelFileTransfer(sha, name, true);
		insertSystemMsg({
			time: moment().format('YYYY-MM-DD HH:mm:ss'),
			msg: '成功接受文件 <a title="'+file.path+'" href="javascript:openFile(\''+openpath+'\');">'+name+'</a>.',
		});
	}, function(loaded){
		var fid = sha;
		$('.load-bar-inner', '#' + fid).width(loaded + '%');
	}, save, sha, function(fname){
		insertSystemMsg({
			time: moment().format('YYYY-MM-DD HH:mm:ss'),
			msg: '文件 '+fname+'接收失败!',
		});
		$('.cancel' + sha).show();
	});
}
function showFileDiv(file, data){
	navite.setSize(620, 424);
	win.setMinimumSize(620, 424);
	$('#window_body_outer_1').css('width', 'calc(100% - 275px)');
	var fileDiv = $('#fileDiv');
	if(!fileDiv[0]){
		fileDiv = $('<div id="fileDiv" style="top: 83px;position: absolute;right: 0;width: 275px;-webkit-box-shadow: 0px 1px 4px #333;height: calc(100% - 7.2em);border-radius: 5px;"><div style="width: 100%;border: 0;border-radius: 5px 5px 0 0;padding: 3px 8px;font-size: 12px;" class="window_bg_container">传送文件</div><div id="files_div" class="autoscroll"></div></div>');
		fileDiv.appendTo('.window_content');
	}
	var files = getLocalStorage('files')||{};
	files[file.sha] = file;
	setLocalStorage('files', files);
	var _file = $('#' + file.sha);
	if(!_file[0]){
		var filetype = file.name;
		filetype = filetype.substr(filetype.lastIndexOf('.') + 1).toUpperCase();
		if(filetype == 'RMVB' || filetype == 'RM' || filetype == 'FLASH' || filetype == '3GP'){
			filetype = 'MOVIE';
		}
		file.sizeMemo = sizeMemo(file.size);
		_file = $('<div id="'+file.sha+'" style="margin-top: 40px;"><img style="float: left;margin-left: 20px;" onerror="fileNofind();" src="filetypeimgs/'+filetype+'.png" width="40px" height="40px"/><div><div class="ellipsis" style="float: left;margin-left: 10px;width: 130px;" title="'+file.name+'">'+file.name+'</div><span>('+file.sizeMemo+')</span><div><div class="loading2wrapper"><div class="load-bar" style="margin: 5px 0px 5px 70px;width: calc(100% - 80px);height: 5px;"><div class="load-bar-inner" data-loading="0"></div></div></div></div><div><div style="float: left;margin-left: 10px;">'+(file.date || moment().format('HH:mm'))+'</div><div style="float: right;"><a class="cancel'+file.sha+'" href="javascript:'+(file.path ? 'downloadMsgFile(\''+file.path+'\', \''+file.name+'\')' : 'okMsgFile(\''+file.sha+'\', \''+file.localpath.replace(/\\/g, '\\\\')+'\', \''+data.ip+'\', \''+data.port+'\')')+';" style="margin: 0 8px;">接收</a><a class="cancel'+file.sha+'" href="javascript:'+(file.path ? 'saveas(\''+file.path+'\', \''+file.name+'\')' : 'saveAsFile(\''+file.sha+'\', \''+file.localpath.replace(/\\/g, '\\\\')+'\', \''+data.ip+'\', \''+data.port+'\', \''+file.name+'\')')+';" style="margin: 0 8px;">另存为</a><a href="javascript:cancelFileTransfer(\''+file.sha+'\', \''+file.name+'\', '+(file.path ? true : false)+');" style="margin: 0 8px;">取消</a></div></div></div>');
		_file.appendTo('#files_div');
	}
}
function cancelFileTransfer(sha, name, df){
	var _file = $('#' + sha);
	if(_file[0]){
		if(df || getLocalStorage('socket').push('pushFileCancel', {
			sha: sha,
			to: id,
			chat: chat,
			from: getLocalStorage('user'),
			name: name
		}, window)){
			var files = getLocalStorage('files')||{};
			delete files[sha];
			setLocalStorage('files', files);
			_file.remove();
			if(!$('#files_div').children().length){
				hideFileDiv();
			}
		}
	}
	if(uploadhttps[sha]){
		uploadhttps[sha].abort();
		delete uploadhttps[sha];
	}
}
function hideFileDiv(cb){
	win.setMinimumSize(504, 424);
	var files = getLocalStorage('files')||{};
	for ( var file in files) {
		if(files[file]){
			cancelFileTransfer(file, files[file].name);
		}
	}
	$('#window_body_outer_1').css('width', '100%');
	var fileDiv = $('#fileDiv');
	if(fileDiv[0]){
		fileDiv.remove();
	}
	if(typeof cb === 'function')
		cb();
}
function offlineSendFile(sha, is){
	var files = getLocalStorage('files');
	var ofile = files[sha];
	if(!ofile){
		return;
	}
	if(is){
		cancelFileTransfer(sha, ofile.name);
		files = getLocalStorage('files');
		files[sha] = ofile;
		setLocalStorage('files', files);
	}
	var file = {
		sha: sha,
		name: ofile.name,
		size: ofile.size
	};
	showSendFileDiv(file, true);
	upload(ofile, '/wl/upload/msgFile.do', function(me, data){
		if(data.success){
			var data = {
				id: id,
				content: me.name + '#' + me.size,
				chat: chat,
				file: data.data.files[0]
			};
			if(getLocalStorage('socket').push('push', data, window)){
				data.date = moment().format('YYYY-MM-DD HH:mm:ss');
				cancelFileTransfer(hex_sha1(me.path), me.name, true);
    			insertSystemMsg({
    				time: moment().format('YYYY-MM-DD HH:mm:ss'),
    				msg: '成功发送文件 '+me.name+'。',
    			});
    			data.content = '[文件]';
				getLocalStorage('main').window.updateChat(data);
			}
			$('#chatMsg').html('').focus();
		}else{
			insertSystemMsg({
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
				msg: '文件 '+me.name+'发送失败!',
			});
			cancelFileTransfer(hex_sha1(me.path), me.name, true);
		}
	}, function(me, progress){
		var fid = hex_sha1(me.path);
		$('.load-bar-inner', '#' + fid).width(progress + '%');
	}, config.msg_FILE_PATH);
}
function sendFiles(){
	var chooser = $('<input type="file" style="display: none;" id="sendFiles" multiple />');
	chooser.appendTo('body');
    chooser.change(function(evt) {
      	var files = chooser[0].files;
      	handFiles(files);
      	chooser.remove();
    });

    chooser.trigger('click');
}
function dropMsg(){
	var box = document.getElementById('chatMsg');
    box.addEventListener("drop",function(e){
        e.preventDefault();
        //获取文件列表
        var fileList = e.dataTransfer.files;
        //检测是否是拖拽文件到页面的操作
        if(fileList.length == 0){
            return;
        }
         
        handFiles(fileList);
    },false);
}
function handFiles(fileList){
	if($.browser.safari || $.browser.webkit){
        //Chrome8+
    	for ( var i = 0; i < fileList.length; i++) {
    		//检测文件是不是图片
    		var sha = hex_sha1(fileList[i].path);
    		var files = getLocalStorage('files')||{};
    		var stat = fs.lstatSync(fileList[i].path);
    		if(stat.isFile()){
    			if(fileList[i].type.indexOf('image') > -1){
                	var src = window.webkitURL.createObjectURL(fileList[i]);
            		var stime = new Date().getTime();
            		insertContent('<img file="'+stime+'" src="'+src+'" class="localImg">');
            		fileList[i].stime = stime;
            		dropImgs[stime] = fileList[i];
                }else if(!files || !files[sha]){
                	var file = {
						sha: sha,
						name: fileList[i].name,
						size: fileList[i].size,
						localpath: fileList[i].path
					};
                	var tdto = getFreindInfo(id);
                	var ipok = false;
                	if(tdto){
                		if(tdto.ipinfo){
                			ipok = tdto.ipinfo.ip == getLocalStorage('user').ipinfo.ip;
                		}else{
                			ipok = tdto.ip == getLocalStorage('user').ipinfo.ip;
                		}
                	}
                	if(tdto && tdto.online && ipok){
						if(getLocalStorage('socket').push('pushFile', {
							sha: sha,
							to: id,
							chat: chat,
							from: getLocalStorage('user'),
							file: file,
							ip: ip.address(),
							port: getLocalStorage('fileHttpPort')
						}, window)){
							files[sha] = fileList[i];
							setLocalStorage('files', files);
							showSendFileDiv(file);
						}
                	}else{
                		if(fileList[i].size > 2147483648){
                			insertSystemMsg({
                				time: moment().format('YYYY-MM-DD HH:mm:ss'),
                				msg: '文件 '+fileList[i].name+'发送失败!不能大于2GB.',
                			});
                		}else{
                			files[sha] = fileList[i];
                    		setLocalStorage('files', files);
                    		offlineSendFile(sha);
                		}
                	}
                }
    		}
		}
    }else if($.browser.mozilla){
        //FF4+
    	for ( var i = 0; i < fileList.length; i++) {
    		//检测文件是不是图片
            if(fileList[i].type.indexOf('image') > -1){
        		var src = window.URL.createObjectURL(fileList[i]);
        		var stime = new Date().getTime();
        		insertContent('<img file="'+stime+'" src="'+src+'" class="localImg">');
        		fileList[i].stime = stime;
        		dropImgs[stime] = fileList[i];
            }else if(fileList[i].type != ''){
            	
            }
		}
    }
}