var chat;
if(navite){
	navite.setSize(496, 396);
	navite.listenClose(function(){
		setLocalStorage('groupWindow');
		win.tag.window.unMaskWin();
	});
	win.setResizable(false);
	chat = win.chat;
}
var setting = {
	view: {
		selectedMulti: false,
		fontCss: {
			overflow: 'hidden'
		}
	},
	data: {
		keep: {
			parent:true,
			leaf:true
		},
		simpleData: {
			enable: true
		}
	},
	callback: {
		onClick: add
	}
};
function addRight(id, name, face){
	if($('.right ul #'+id).size() >= 1){ return false; }
	var addli = $('<li id="'+id+'"><img src="'+face+'" width="20px;" height="20px;" onerror="faceNofind();" style="float: left;margin-right: 10px;margin-top: 4px;border-radius: 3px;"/><div style="float: left;">'+name+'</div></li>').appendTo('.right ul');
	addli.mouseenter(function(event){
		if($(this).index() < 2){
			return false;
		}
		$('<img id="removeNode'+id+'" src="images/removeOver.jpg"/>').appendTo(this).css({
			position: 'absolute',
			right: '11px'
		}).click(function(){
			$('#' + this.id.replace('removeNode', ''), '.right ul').remove();
			$('.right h2 span').html($('.right ul li').size());
		});
	}).mouseleave(function(){
		if($(this).index() < 2){
			return false;
		}
		$('#removeNode' + this.id).remove();
	});
	$('.right h2 span').html($('.right ul li').size());
}
function add(event, treeId, treeNode){
	if(treeNode.pId == null){ return false; }
	console.log(treeNode);
	addRight(treeNode.id, treeNode.name, treeNode.icon);
}
$(function(){
	if(chat){
		var title = chat.type == 1 ? '创建讨论组' : '添加新成员';
		$('#title').html();
		document.title = title;
	}
	ajax({
		url: baseUrl + '/wl/group/list.do',
		data: {
			id: getLocalStorage('user').id
		},
		success: function(res){
			var groups = res.data.list;
			var nodes = [];
			for ( var i = 0; i < groups.length; i++) {
				var group = groups[i];
				nodes.push({
					id: group.id,
					pId: 0,
					name: group.name,
					open: false
				});
				for ( var j = 0; j < group.usersDto.length; j++) {
					var u = group.usersDto[j];
					nodes.push({
						id: u.id,
						pId: group.id,
						name: u.nickName + '(' + u.name + ')',
						icon: u.face || faceNofind(),
						iconImg: true
					});
				}
			}
			$.fn.zTree.init($("#groupFriends"), setting, nodes);
			if(chat){
				for ( var i = 0; i < chat.usersDto.length; i++) {
					console.log(chat.usersDto[i]);
					addRight(chat.usersDto[i].id, chat.usersDto[i].name, chat.usersDto[i].face);
				}
			}
		}
	});
});
function create(){
	var userIds = '';
	$('.right ul li').each(function(index, dom){
		userIds += dom.id + ',';
	});
	getLocalStorage('main').window.openChat(chat.id, 2, function(id, ct){
		win.tag.close();
		win.close();
	}, userIds);
}