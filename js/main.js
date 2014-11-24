var exGroups = {};
var rumbleFaces = {};
$(function(){
	if(navite){
		var flash = false;
		/*window.setInterval(function(){
			if(flash){
				tray.icon = 'images/qq_16.png';
				flash = false;
			}else{
				tray.icon =  '';
				flash = true;
			}
		}, 5000);*/
		navite.setSize(300, 500);
		navite.createTrayMenu([{
			label: '打开主面板',
			click: function(){
				win.show();// 显示窗口
				win.focus();
			}
		},{
			label: '退出',
			click: function(){
				navite.closeWin();
			}
		}]);
		/**
		 * 监听关闭事件
		 */
		navite.listenClose(function(){
			var chats = getLocalStorage('chats');
			var friendv = getLocalStorage('friendv');
			var findWin = getLocalStorage('findWin');
			var msgbox = getLocalStorage('msgbox');
			var rtcs = getLocalStorage('rtcs');
			var addFriends = getLocalStorage('addFriends');
			var editInfo = getLocalStorage('editInfo');
			var onlineWindow = getLocalStorage('onlineWindow');
			var infos = getLocalStorage('infos');
			var groupWindow = getLocalStorage('groupWindow');
			//关闭所有打开的会话窗口
			if(chats){
				for ( var chat in chats) {
					if(chats[chat])
						chats[chat].close();
				}
			}
			//关闭所有打开的资料信息窗口
			if(infos){
				for ( var info in infos) {
					if(infos[info])
						infos[info].close();
				}
			}
			//关闭所有打开的添加好友窗口
			if(addFriends){
				for ( var addFriend in addFriends) {
					if(addFriends[addFriend])
						addFriends[addFriend].close();
				}
			}
			//关闭所有视频会话窗口
			if(rtcs){
				for ( var rtc in rtcs) {
					if(rtcs[rtc])
						rtcs[rtc].close();
				}
			}
			//关闭所有好友验证窗口
			if(friendv){
				for ( var i = 0; i < friendv.length; i++) {
					if(friendv[i])
						friendv[i].close();
				}
			}
			//关闭查找好友窗口
			if(findWin){
				findWin.close();
			}
			//关闭消息提示窗口
			if(msgbox){
				msgbox.close();
			}
			//关闭修改个人信息窗口
			if(editInfo){
				editInfo.close();
			}
			if(onlineWindow){
				onlineWindow.close();
			}
			if(groupWindow){
				groupWindow.close();
			}
		});
		$(window).resize(function() {
			window.myScroll.refresh();
			window.friendsScroll.refresh();
		});
	}
	initSocket(function(socket){
		getIp(function(){}, function(data){
			var user = getLocalStorage('user');
			user.ipinfo = data.data || {
							country: "未知",
							country_id: "未知",
							area: "未知",
							region: "未知",
							region_id: "未知",
							city: "未知",
							city_id: "未知",
							county: "",
							isp: "未知",
							ip: "未知"
						};
			setLocalStorage('user', user);
			socket.push('login', user, window);
			setLocalStorage('socket', socket);
		}, true);
	});
	addrChange(1);
	setTimeout(function(){
		window.myScroll.refresh();
	}, 500);
	$('#signatureInput').blur(function(){
		$(this).hide();
		var val = $(this).val();
		if($('#my_signature').text() != val){
			ajax({
				url: baseUrl + '/wl/user/update.do',
				data: {
					id: getLocalStorage('user').id,
					'userExt.signature': val
				},
				success: function(data){
					setLocalStorage('user', data.data.user);
					$('#my_signature').text(val);
					getLocalStorage('socket').push('updateInfo', data.data.user, window);
				}
			});
		}
	}).keypress(function(e){
		if(e.which == 13 || e.which == 10){
			$(this).blur();
		}
	});
	$('#main_search').focus(function(){
		$('#main_searchClean').show();
	}).blur(function(){
		$('#main_searchClean').hide();
	});
	$('#my_signature').click(function(){
		$('#signatureInput').show().val($('#my_signature').text()).focus();
	});
	
	window.myScroll = new wrapper({
		id: 'wrapper',
		content: 'list',
		pullDown: 'pullDown',
		onRefresh: function(){
			var me = this;
			ajax({
				url: baseUrl + '/wl/chat/list.do',
				data: {
					userid: getLocalStorage('user').id
				},
				success: function(data){
					initChats(data.data.list);
				}
			});
			me.refresh();
		}
	});
	
	window.friendsScroll = new wrapper({
		id: 'friends_wrapper',
		content: 'friends',
		pullDown: 'friends_pullDown',
		onRefresh: function(){
			var me = this;
			ajax({
				url: baseUrl + '/wl/group/list.do',
				data: {
					id: getLocalStorage('user').id
				},
				success: function(data){
					var user = getLocalStorage('user');
					user.groups = data.data.list;
					setLocalStorage('user', user);
					initGroup();
					me.refresh();
				}
			});
			me.refresh();
		}
	});
	initMyInfo({
		face: getLocalStorage('user').userExt.face,
		nickName: getLocalStorage('user').userExt.nickName,
		signature: getLocalStorage('user').userExt.signature || ''
	});
	initGroup();
	initList();
});
function initMyInfo(opt){
	$('#my_face').attr('src', opt.face)[0].onerror = faceNofind;
	$('#my_nickName').html(opt.nickName);
	$('#my_signature').text(opt.signature);
}
function initList(){
	var user = getLocalStorage('user');
	if(user && user.chats){
		initChats(user.chats);
	}
}
function initChats(chats){
	$('#list').children().each(function(index, dom){
		$.contextMenu( 'destroy', '[data-id='+$(dom).data('id')+']' );
	});
	$('#list').empty();
	var user = getLocalStorage('user');
	for ( var i = 0; i < chats.length; i++) {
		var chat = chats[i];
		if(chat && chat.messages && chat.messages.length){
			var message = chat.messages.length ? chat.messages[0] : {
				content: '',
				date: chat.createDate
			};
			message.filePath && (message.content = '[文件]');
			var unread = 0;
			for ( var j = 0; j < chat.messages.length; j++) {
				if(!chat.messages[j].state && chat.messages[j].toDto.id == user.id)
					unread++;
			}
			if(chat.id && message && message.type != 3){
				addList({
					id: chat.id,
					to: chat.type == 1 && chat.create.id != user.id ? chat.create.id : chat.target.id,
					msg: message.content,
					title: chat.type == 1 ? (chat.create.id != user.id ? chat.create.nickName : chat.target.nickName) : chat.title,
					time: message.date,
					type: chat.type,
					target: chat.target,
					unread: unread,
					face: chat.type == 1 && chat.create.id != user.id ? chat.create.face : '',
					isOnline: chat.type == 1 ? (chat.create.id != user.id ? chat.create.online : chat.target.online) : 1
				});
				
				if(unread > 0 && chat.type == 1){
					var tid = chat.create.id != user.id ? chat.create.id : chat.target.id;
					rumbleFaces[tid] = $('#friendFace' + tid).jrumble({
						x: 0,
						y: 4,
						rotation: 0,
						speed: 100,
						opacity: true
					});
					rumbleFaces[tid].trigger('startRumble');
				}
			}
		}
	}
}
function initGroup(){
	var user = getLocalStorage('user');
	if(user && user.groups){
		for ( var i = 0; i < user.groups.length; i++) {
			var group = user.groups[i];
			$.contextMenu( 'destroy', '[data-id='+group.id+'] > h3' );
			for ( var j = 0; j < group.usersDto.length; j++) {
				var u = group.usersDto[j];
				$.contextMenu( 'destroy', '[data-id='+u.id+']' );
			}
		}
		$('#friends').empty();
		for ( var i = 0; i < user.groups.length; i++) {
			var group = user.groups[i];
			group.count = group.usersDto.length;
			addFriendGroup(group);
			var online = 0;
			for ( var j = 0; j < group.usersDto.length; j++) {
				var u = group.usersDto[j];
				if(u.online){
					online++;
				}
				var nickName = u.nickName;
				var noteName = getFriendNoteName(u.noteNames);
				if(noteName != null && noteName != ''){
					nickName = noteName + '(' + nickName + ')';
				}
				addFriend({
					id: u.id,
					group: group.id, 
					name: u.name,
					nickName: nickName,
					isOnline: u.online,
					signature: u.signature
				});
			}
			$('.friends_is_online', '[data-id='+group.id+']').text(online + '/' + group.count);
			if(exGroups[group.id]){
				$('#group' + group.id).trigger("expand");
			}
		}
		updateGroupOnline();
	}
}
function addrChange(n){
	if(n == 1){
		$('.bag')[0].style.backgroundPosition = '-28px -69px';
		$('.bag')[1].style.backgroundPosition = '-56px -69px';
		$('#friends_wrapper').hide();
		$('#wrapper').fadeIn();
		if(window.myScroll)
			window.myScroll.refresh();
	}else{
		$('.bag')[0].style.backgroundPosition = '-1px -69px';
		$('.bag')[1].style.backgroundPosition = '-84px -69px';
		$('#wrapper').hide();
		$('#friends_wrapper').fadeIn();
		if(window.friendsScroll)
			window.friendsScroll.refresh();
	}
}
function rplDiv(html){
	html = html.replace(/<div\s*([^>]*)>/g, "");
	html = html.replace(/<\/div>/g, "");
	html = html.replace(/<br>/g, " ");
	html = html.replace(/<br\/>/g, " ");
	html = html.replace(/\{\[(.*?)\]\}/g, "[表情]");
	html = html.replace(/<img\s*([^>]*)\s*\s*([^>]*)>/g, "[图片]");
	return html;
}
function updateChat(data, unread){
	var chatmsg = $('#chatMsg'+data.chat.id);
	if(!chatmsg[0]){
		var user = getLocalStorage('user');
		addList({
			id: data.chat.id,
			to: data.chat.type == 1 && data.chat.create.id != user.id ? data.chat.create.id : data.chat.target.id,
			msg: data.content,
			title: data.chat.type == 1 ? (data.chat.create.id != user.id ? data.chat.create.nickName : data.chat.target.nickName) : data.chat.title,
			time: data.date,
			type: data.chat.type,
			target: data.chat.target,
			face: data.chat.type == 1 ? (data.chat.create.id != user.id ? data.chat.create.face : data.chat.target.face) : '',
			isOnline: data.chat.type == 1 ? (data.chat.create.id != user.id ? data.chat.create.online : data.chat.target.online) : 1
		});
		chatmsg = $('#chatMsg'+data.chat.id);
	}
	chatmsg.attr('title', rplHtml(data.content)).html(rplDiv(data.content));
	$('#chatTime' + data.chat.id).text(data.date);
	if(unread){
		var ur = $('#chatUnread' + data.chat.id);
		if(ur.text() && ur.text() != ''){
			var count = parseInt(ur.text());
			if(count < 99)
				ur.text(count + 1);
		}else{
			ur.text(1);
		}
		ur.show();
	}
	var list = $('#list').children();
	var frag = document.createDocumentFragment();
	list.sort(function(a, b){
		var date_a = $('#chatTime' + $(a).data('id')).text();
		var date_b = $('#chatTime' + $(b).data('id')).text();
		date_a = new Date(date_a).getTime();
		date_b = new Date(date_b).getTime();
		var res = date_b - date_a;
		return res == 0 ? 1 : res;
	});
	for ( var i = 0; i < list.length; i++) {
		frag.appendChild(list[i]);
	}
	$('#list')[0].appendChild(frag);
}
function addList(opt){
	var html = '<p data-target="'+opt.to+'" data-id="'+opt.id+'" ondblclick="openChat(\''+opt.to+'\', \''+opt.type+'\')">' +
		'<img id="chatFace'+opt.to+'" onerror="faceNofind();" src="'+opt.face+'" width="44px" height="44px;" style="float: left;-webkit-border-radius: 5px;float: left;-webkit-filter:grayscale('+(opt.isOnline ? 0 : 1)+');">' +
		'<span id="chatTime'+opt.id+'" style="float: right;color: #47778D;font-size: 12px;">'+opt.time+'</span>' +
		'<span id="chatUnread'+opt.id+'" style="background-color: red;display: '+(opt.unread && opt.unread > 0 ? 'block' : 'none')+';padding: 2px 4px;border-radius: 5px;position: absolute;right: 10px;margin-top: 20px;font-size: 12px;">'+(opt.unread && opt.unread > 0 ? opt.unread : '')+'</span>' +
		'<span style="margin-left: 8px;color: #343434;display: block;" class="ellipsis" title="'+opt.title+'">'+opt.title+'</span>' +
		'<span id="chatMsg'+opt.id+'" title="'+rplHtml(opt.msg)+'" style="margin-left: 52px; color: #B6B6B6;max-width: 240px;display: block;margin-right: 25px;" class="ellipsis">'+rplDiv(opt.msg)+'</span>' +
		'</p>';
	$('#list').append(html);
	$.contextMenu({
        selector: '[data-id='+opt.id+']', 
        items: {
            "delete": {
            	name: "删除", 
            	icon: "delete",
            	disabled: true,
            	callback: function(){
            		removeDataId(opt.id);
            	}
            },
            'out': {
            	name: '退出讨论组',
            	disabled: (opt.type == 1),
            	callback: function(){
            		outChat(opt.id);
            	}
            }
        }
    });
	window.myScroll.refresh();
}

function removeDataId(id){
	$('[data-id='+id+']').remove();
	$.contextMenu('destroy', '[data-id='+id+']');
}
function isHaveFriendByGroup(id){
	return $('[data-role="listview"]', '[data-id="'+id+'"]').children().length;
}
function getFriendGroup(name){
	var friends = $('#friends').children();
	for ( var i = 0; i < friends.length; i++) {
		var friend = $(friends[i]);
		if(friend.find('[data-id='+name+']').length){
			return friend;
		}
	}
}
function updateGroupOnline(){
	var friends = $('#friends').children();
	for ( var i = 0; i < friends.length; i++) {
		var friend = $(friends[i]);
		var list = friend.find('[data-role="listview"]').children();
		var online = 0;
		var frag = document.createDocumentFragment();
		list.sort(function(a, b){
			var onlineText_a = $('#friendOnline' + $(a).data('id')).text();
			var onlineText_b = $('#friendOnline' + $(b).data('id')).text();
			onlineText_a = onlineText_a == '在线' ? 1 : 0;
			onlineText_b = onlineText_b == '在线' ? 1 : 0;
			var res = onlineText_b - onlineText_a;
			return res == 0 ? 1 : res;
		});
		for ( var j = 0; j < list.length; j++) {
			var onlineText = $('#friendOnline' + $(list[j]).data('id')).text();
			if(onlineText == '在线'){
				online++;
			}
			frag.appendChild(list[j]);
		}
		friend.find('[data-role="listview"]')[0].appendChild(frag);
		$('.friends_is_online', friend).text(online + '/' + list.length);
	}
}
function addFriendGroup(opt){
	var html = '<div id="group'+opt.id+'" data-id="'+opt.id+'" data-state="'+opt.state+'"  data-role="collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d">' +
	    '<h3><span id="edit-'+opt.id+'" style="height: 20px;float: left;width: 60%;" '+(opt.state == 1 ? "" : 'ondblclick="editFriendGroup(this, \''+opt.id+'\');"')+'>'+opt.name+'</span><div class="friends_is_online">'+(opt.online || 0)+'/'+(opt.count || 0)+'</div></h3><div data-role="listview"></div></div>';
	var result = $('#friends').append(html).trigger('create');
	
	$('#group'+opt.id).bind('expand', function () {
		exGroups[opt.id] = true;
		window.friendsScroll.refresh();
	}).bind('collapse', function () {
		exGroups[opt.id] = false;
		window.friendsScroll.refresh();
	});
	
	if(opt.id != 'addGroupTemp'){
		$.contextMenu({
	        selector: '[data-id='+opt.id+'] > h3', 
	        items: {
	        	"edit": {
	        		name: "修改", 
	            	icon: "edit",
	            	disabled: opt.state == 1 ? true : false,
	            	callback: function(key, options){
	            		editFriendGroup('#edit-'+opt.id, opt.id, function(input, id){
	            			ajax({
	            				url: baseUrl + '/wl/group/updateGroup.do',
	            				data: {
	            					id: id,
	            					name: input.val()
	            				},
	            				success: function(data){
	            					
	            				},
	            				error: function(data){
	            					removeDataId(id);
	            					showMsg({
	            						title: '错误',
	            						message: '该分组不存在',
	            						type: 'warning'
	            					});
	            				}
	            			});
	            		});
	            	}
	        	},
	            "add": {
	            	name: "新增", 
	            	icon: "add",
	            	callback: function(key, options){
	            		addFriendGroup({
	            			id: 'addGroupTemp',
	            			name: '',
	            			count: 0
	            		});
	            		editFriendGroup('#edit-addGroupTemp', 'addGroupTemp', function(input, id){
	            			removeDataId('addGroupTemp');
	            			ajax({
	            				url: baseUrl + '/wl/group/addGroup.do',
	            				data: {
	            					id: getLocalStorage('user').id,
	            					name: input.val()
	            				},
	            				success: function(data){
	            					var user = getLocalStorage('user');
	            					user.groups.push(data.data.group);
	            					setLocalStorage('user', user);
	            					addFriendGroup(data.data.group);
	            					updateGroupOnline();
	            				},
	            				error: function(data){
	            					showMsg({
	            						title: '错误',
	            						message: data.executeResult.result == 11 ? '该分组已存在' : '非法用户',
	            						type: 'warning'
	            					});
	            				}
	            			});
	            		});
	            	}
	            },
	            "find": {
	            	name: "查找/添加好友", 
	            	icon: 'find',
	            	callback: function(key, options){
	            		openFind();
	            	}
	            },
	            "sep1": "---------",
	            "delete": {
	            	name: "删除", 
	            	icon: "delete",
	            	disabled: opt.state == 1 ? true : false,
	            	callback: function(){
	            		if(!isHaveFriendByGroup(opt.id)){
	            			confirmMsg({
	                			type: 'warning',
	                			message: '您确定删除 ' + opt.name + ' 分组吗?',
	                			ok: function(me){
	                				me.destroy();
	                				ajax({
	    	            				url: baseUrl + '/wl/group/delGroup.do',
	    	            				data: {
	    	            					id: opt.id
	    	            				},
	    	            				success: function(data){
	    	            					removeDataId(opt.id);
	    	            					var user = getLocalStorage('user');
	    	            					for ( var i = 0; i < user.groups.length; i++) {
	    										if(user.groups[i].id == opt.id){
	    											user.groups.splice(i, 1);
	    										}
	    									}
	    	            					setLocalStorage('user', user);
	    	            				},
	    	            				error: function(data){
    	            						showMsg({
    		            						title: '错误',
    		            						message: data.msg || data.executeResult.resultMsg,
    		            						type: 'error'
    		            					});
	    	            				}
	    	            			});
	                			},
	                			cancel: function(me){
	                				me.destroy();
	                			}
	                		});
	            		}else{
	            			confirmMsg({
	                			type: 'warning',
	                			message: '请先删除该组所有好友!',
	                			buttons: [
  	            					{'data-role': 'ok', text: '关闭'}
  	            				],
	                			ok: function(me){
	                				me.destroy();
	                			}
	            			});
	            		}
	            	}
	            }
	        }
	    });
	}
	return result;
}
function openFind(){
	var findWin = getLocalStorage('findWin');
	if(findWin){
		findWin.show();
		findWin.focus();
	}else{
		setLocalStorage('findWin', navite.newWin('findFriend.html'));
	}
}
function delFriend(id){
	removeDataId(id);
	var target = $('[data-target="'+id+'"]');
	if(target[0] && target.data('id')){
		removeDataId(target.data('id'));
	}
	var chats = getLocalStorage('chats');
	if(chats && chats[id]){
		chats[id].close();
	}
	delMemFriend(id);
	updateGroupOnline();
}

function addFriend(opt){
	var user = getLocalStorage('user');
	var html = '';
	html += '<div data-id="'+opt.id+'" ondblclick="openChat(\''+opt.id+'\', 1);" data-name="'+opt.name+'" class="friends_list">' +
				'<img onerror="faceNofind();" id="friendFace'+opt.id+'" src="'+opt.face+'" width="44px" height="44px;" style="float: left;-webkit-filter:grayscale('+(opt.isOnline ? 0 : 1)+');">' +
				'<span id="friendOnline'+opt.id+'" style="float: right;color: #47778D;font-size: 12px;">'+(opt.isOnline ? "在线" : "离线")+'</span>' +
				'<span id="friendNickName'+opt.id+'" style="margin-left: 8px;color: #343434;" class="ellipsis">'+opt.nickName+'</span><br>' +
				'<span id="friendSignature'+opt.id+'" style="margin-left: 52px; color: #B6B6B6;max-width: 240px;display: block;" class="ellipsis">'+(opt.signature || '')+'</span>' +
			'</div>';
	
	var result = $('[data-role="listview"]', '[data-id="'+opt.group+'"]').append(html).trigger('create');
	if(rumbleFaces[opt.id]){
		rumbleFaces[opt.id] = $('#friendFace' + opt.id).jrumble({
			x: 0,
			y: 3,
			rotation: 0,
			speed: 110,
			opacity: true
		});
		rumbleFaces[opt.id].trigger('startRumble');
	}
	var movegroups = {};
	for ( var i = 0; i < user.groups.length; i++) {
		var group = user.groups[i];
		if(group.id != opt.group){
			movegroups[group.id] = {
				name: group.name,
				callback: function(key){
					ajax({
        				url: baseUrl + '/wl/user/moveFriend.do',
        				data: {
        					userid: opt.id,
        					groupid: key,
        					ogroupid: opt.group
        				},
        				success: function(data){
        					removeDataId(opt.id);
        					var dto = delMemFriend(opt.id);
        					var nickName = dto.nickName;
							var noteName = getFriendNoteName(dto.noteNames);
							if(noteName != null && noteName != ''){
								nickName = noteName + '(' + nickName + ')';
							}
        					addFriend({
        						id: opt.id,
        						group: key, 
        						name: dto.name,
        						nickName: nickName,
        						isOnline: dto.online,
        						signature: dto.signature
        					});
        					addMemFriend(key, dto);
        					updateGroupOnline();
        				},
        				error: function(data){
    						showMsg({
        						title: '错误',
        						message: data.msg || data.executeResult.resultMsg,
        						type: 'error'
        					});
        				}
        			});
				}
			}
		}
	}
	$.contextMenu({
        selector: '[data-id='+opt.id+']', 
        items: {
            "delete": {
            	name: "删除好友", 
            	icon: "delete",
            	callback: function(){
            		confirmMsg({
            			type: 'warning',
            			message: '您确定删除 ' + opt.nickName + ' 好友吗?',
            			ok: function(me){
            				me.destroy();
            				ajax({
                				url: baseUrl + '/wl/user/delFriend.do',
                				data: {
                					userid: opt.id,
                					groupid: opt.group,
                					id: getLocalStorage('user').id
                				},
                				success: function(data){
                					getLocalStorage('socket').push('delFriend', {
                						from: getLocalStorage('user').id,
                						to: opt.id
                					}, window);
                					delFriend(opt.id);
                				},
                				error: function(data){
            						showMsg({
                						title: '错误',
                						message: data.msg || data.executeResult.resultMsg,
                						type: 'error'
                					});
                				}
                			});
            			},
            			cancel: function(me){
            				me.destroy();
            			}
            		});
            	}
            },
            'info': {
            	name: "查看资料", 
            	icon: "edit",
            	callback: function(){
            		openInfo(opt.id);
            	}
            },
            'noteName': {
            	name: "修改备注名", 
            	icon: "edit",
            	callback: function(){
            		var u = getFreindInfo(opt.id);
            		notifier.notify({
						title: '修改备注姓名',
						message: '<div><div>请输入备注姓名:</div><div><input type="text" value="'+(u.noteName || '')+'" id="editNoteName"/></div></div>',
						buttons: [
							{'data-role': 'ok', text: '确定'},
							{'data-role': 'no', text: '取消'}
						],
						modal: true,
						ms: null,
						modal: true,
						destroy: false
					}).on('click:ok', function(){
						ajax({
            				url: baseUrl + '/wl/user/noteName.do',
            				data: {
            					noteName: $('#editNoteName').val() || '',
            					userid: opt.id
            				},
            				success: function(data){
            					var user = getFreindInfo(opt.id, data.data.user);
            					var nickName = user.nickName;
								if(user.noteName != null && user.noteName != ''){
									nickName = user.noteName + '(' + nickName + ')';
								}
            					$('#friendNickName' + user.id).text(nickName);
            					this.destroy();
            				},
            				error: function(data){
        						showMsg({
            						title: '错误',
            						message: data.msg || data.executeResult.resultMsg,
            						type: 'error'
            					});
            				}
            			});
					}).on('click:no', function(){
						this.destroy();
					});
            	}
            },
            'move': {
            	name: '移动联系人至',
            	items: movegroups
            }
        }
    });
	return result;
}

function openChat(id, type, cb, users){
	var chats = getLocalStorage('chats') || [];
	if(chats && chats[id] && !users){
		chats[id].show();
		chats[id].focus();
		if(typeof cb === 'function'){
			cb(id, type);
		}
		return;
	}
	if(type == 2){
		ajax({
			url: baseUrl + '/wl/chat/groupTalk.do',
			data: {
				id: id,
				userIds: users
			},
			success: function(data){
				var newUsers = data.data.newUsers;
				if(newUsers && newUsers.length){
					for(var i=0; i<newUsers.length; i++) {
						var uid = newUsers[i].split('$#$')[0];
						var unkn = newUsers[i].split('$#$')[1];
						if(uid != getLocalStorage('user').id){
							getLocalStorage('socket').push('push', {
								id: id,
								content: unkn + '加入了讨论组!',
								type: 0,
								chat: data.data.chat
							}, window);
						}
					}
				}
				chats[id] = navite.newWin('chat.html?id=' + id);
				chats[id].chat = data.data.chat;
				setLocalStorage('chats', chats);
				if(typeof cb === 'function'){
					cb(chats[id], data.data.chat);
				}
			},
			error: function(data){
				
			}
		});
	}else{
		ajax({
			url: baseUrl + '/wl/chat/talk.do',
			data: {
				create: getLocalStorage('user').id,
				to: id
			},
			success: function(data){
				chats[id] = navite.newWin('chat.html?id=' + id);
				chats[id].chat = data.data.chat;
				setLocalStorage('chats', chats);
				if(typeof cb === 'function'){
					cb(chats[id], data.data.chat);
				}
			},
			error: function(data){
				
			}
		});
	}
}
function editInfo(){
	var editInfo = getLocalStorage('editInfo');
	if(editInfo){
		editInfo.show();
		editInfo.focus();
	}else{
		editInfo = navite.newWin('editInfo.html');
		setLocalStorage('editInfo', editInfo);
	}
}
function readChatUnread(){
	var ur = $('#chatUnread' + data.chat.id);
	if(ur.text() && ur.text() != ''){
		var count = parseInt(ur.text());
		count--;
		if(count <= 0)
			ur.hide();
		else
			ur.show();
	}else{
		ur.hide();
	}
}
function stopFaceRumble(id){
	var r = rumbleFaces[id];
	if(r){
		r.trigger('stopRumble');
		rumbleFaces[id] = false;
	}
}
function hideChatUnread(chat){
	$('#chatUnread' + chat).text('').hide();
}
function editFriendGroup(me, id, fn){
	var offset = $(me).offset();
	offset.top -= 3;
	offset.left -= 1;
	var old = $(me).text();
	$('.friendGroupEditInpt').css(offset).val(old).show().focus().blur(function(){
		var val = $(this).val();
		if(!val || '' == val){
			if(id == 'addGroupTemp'){
				removeDataId('addGroupTemp');
				$(this).unbind().hide();
			}else{
				$(this).focus();
			}
			return;
		}
		$(this).unbind().hide();
		if(val != old){
			$(me).text(val);
			if(typeof fn == 'function'){
				fn($(this),id);
			}
		}
	}).keypress(function(e){
		if(e.which == 10 || e.which == 13){
			$(this).blur();
		}
	});
}