if(navite)
	navite.setSize(455, 290);
var opt = {};
var msg;
$(function(){
	navite.listenClose(function(){
		var friendv = getLocalStorage('friendv');
		delete friendv[win];
		setLocalStorage('friendv', friendv);
	});
	setGroup();
	opt = win.opt;
	msg = getQueryString('msg');
	var vmsg = msg.split('#')[0];
	document.title = '好友申请 - ' + opt.userExt.nickName;
	$('#infoImg').attr('src', opt.userExt.face);
	$('#infoNickName').text(opt.userExt.nickName);
	$('#infoName').text(opt.name);
	$('#sex').text(opt.userExt.sexMemo);
	$('#area').text(opt.area.country+opt.area.province+opt.area.city).attr('title', opt.area.country+opt.area.province+opt.area.city);
	$('#msgNickName').text(opt.userExt.nickName);
	$('#vmsg').text(vmsg);
});
/**
 * 获取最新的好友列表
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:08:33
 */
function setGroup(){
	loadGroup(function(data){
		var g = $('#group');
		g.empty();
		for ( var i = 0; i < data.data.list.length; i++) {
			var group = data.data.list[i];
			g.append('<option value="'+group.id+'" title="'+group.name+'">'+group.name+'</option>');
		}
	});
}
/**
 * 互相加为好友
 * @author Gary
 * @date 2013年12月7日 
 * @time 上午6:09:59
 */
function ok(){
	var isok = $('input[name=isok]:checked').val();
	if(isok == 1){
		var sval = $('#group').val();
		if(!sval){
			alert('请选择分组');
		}else{
			ajax({
				url: baseUrl + '/wl/user/addFriend.do',
				data: {
					userid: opt.id,
					groupid: sval
				},
				success: function(data){
					ajax({
						url: baseUrl + '/wl/user/addFriend.do',
						data: {
							userid: msg.split('#')[1],
							groupid: msg.split('#')[2]
						},
						success: function(data){
							getLocalStorage('socket').push('addFriendOk', {
								id: opt.id,
								friend: getLocalStorage('user'),
								group: msg.split('#')[2]
							}, window);
							getLocalStorage('main').window.addFriend({
								id: opt.id,
								group: sval, 
								name: opt.name,
								nickName: opt.userExt.nickName,
								isOnline: opt.login.online,
								signature: opt.userExt.signature
							});
							addMemFriend(sval, {
								id: opt.id,
								face: opt.userExt.face,
								level: opt.login.level,
								nickName: opt.userExt.nickName,
								signature: opt.userExt.signature,
								online: opt.login.online
							});
							getLocalStorage('main').window.updateGroupOnline();
							navite.closeWin();
						}
					});
				}
			});
		}
	}else{
		var nomsg = $('#nomsg').val();
		ajax({
			url: baseUrl + '/wl/msg/friendFail.do',
			data: {
				from: opt.id,
				to: getLocalStorage('user').id,
				content: nomsg
			},
			success: function(data){
				getLocalStorage('socket').push('addFriendFail', {
					id: opt.id,
					friend: getLocalStorage('user'),
					content: nomsg
				}, window);
				navite.closeWin();
			}
		});
	}
}