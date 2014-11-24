var requestScroll;
var ishave_request = false;
$(function(){
	$('#unreads').tabs();
	
	navite.listenClose(function(){
		setLocalStorage('msgbox');
	});
	
	requestScroll = new wrapper({
		id: 'request',
		content: 'unmsg',
		pullDown: 'request_pullDown',
		onRefresh: refresh
	});
	
	loadUnread();
});
function refresh(){
	$('#unmsg').empty();
	loadUnread();
	requestScroll.refresh();
}
function loadUnread(notin){
	ajax({
		url: baseUrl + '/wl/msg/allUnreads.do',
		data: {
			userid: getLocalStorage('user').id,
			notin: notin || null
		},
		success: function(data){
			var msgs = data.data.msgs;
			var i = 0;
			notin = '';
			if(msgs && msgs.length){
				for ( i = 0; i < msgs.length; i++) {
					var msg = msgs[i];
					notin += msg.id + ',';
					if(msg.type == 3){
						ishave_request = true;
						var content = msg.content;
						content = content.split('#');
						addRequestMsg(msg.fromDto, {
							date: msg.date,
							msg: content[0],
							content: msg.content, 
							id: msg.id
						});
					}
				}
				loadUnread(notin);
			}else{
				if(!ishave_request){
					$('#unmsg').html('没有未读验证消息(亲,下拉刷新哦~!)')
				}
			}
		}
	});
}
function addRequestMsg(user, data){
	var html = '<p style="background-color: ghostwhite;" id="request'+user.id+'">'+
						'<img onerror="faceNofind();" id="unmsg-face" src="'+user.face+'" width="44px" height="44px;" style="float: left;">'+
					'<span id="unmsg-date" style="float: right;color: #47778D;font-size: 12px;">'+data.date+'</span>'+
					'<span style="margin-left: 8px;color: #343434;" class="ellipsis"><span id="unmsg-nickName">'+user.nickName+'</span>(<span id="unmsg-name">'+user.name+'</span>) 请求添加您为好友.</span><br>'+
					'<span style="float: right;color: #47778D;font-size: 12px;">'+
						'<button onclick="openRequestMsg(\''+data.id+'\',\''+user.id+'\', \''+data.content+'\');">查看</button>'+
						'<button>忽略</button>'+
					'</span>'+
					'<span style="margin-left: 52px; color: #B6B6B6;display: block;" class="ellipsis">附加信息: <span>'+data.msg+'</span></span>'+
				'</p>';
	$('#unmsg').append(html);
	requestScroll.refresh();
}
function delRequestMsg(id){
	var msg = $('#request' + id);
	if(msg[0]){
		msg.remove();
		requestScroll.refresh();
	}
	var main = getLocalStorage('main').window;
	main._unreads = $('#unmsg').children().length;
	if(!main.window._unreads){
		$('#unmsg').html('没有未读验证消息(亲,下拉刷新哦~!)')
	}
	main.updateRequestUnread();
}
function openRequestMsg(msgid, userid, msg){
	ajax({
		url: baseUrl + '/wl/user/info.do',
		data: {
			id: userid
		},
		success: function(user){
			ajax({
				url: baseUrl + '/wl/msg/readMsg.do',
				data: {
					id: msgid
				},
				success: function(d){
					var friendv = getLocalStorage('friendv') || [];
					var f = navite.newWin('addFriendV.html?msg=' + encodeURIComponent(msg));
					f.opt = user.data.user;
					friendv.push(f);
					setLocalStorage('friendv', friendv);
					delRequestMsg(userid);
				}
			});
		}
	});
}