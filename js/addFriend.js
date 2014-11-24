var opt = {};
if(navite){
	navite.setSize(352, 285);
	navite.listenClose(function(){
		var addFriends = getLocalStorage('addFriends');
		delete addFriends[opt.id];
		setLocalStorage('addFriends', addFriends);
	});
	win.setResizable(false);
}
$(function(){
	setGroup();
	opt = win.opt;
	document.title = '添加好友 - ' + opt.userExt.nickName;
	$('#face').attr('src', opt.userExt.face);
	$('#nickName').text(opt.userExt.nickName);
});
function addFriend(){
	var group = $('#group').val();
	if(group){
		var content = $('#msg').val() || '我是' + getLocalStorage('user').userExt.nickName;
		var ok = getLocalStorage('socket').push('addFriend', {
			id: opt.id,
			content: content + '#' + opt.id + '#' + group
		}, window);
		if(ok){
			win.close();
		}
	}
}
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