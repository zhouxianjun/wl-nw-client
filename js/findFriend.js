var addFriendId;
var result;
$(function(){
	win.setResizable(false);
	navite.listenClose(function(){
		setLocalStorage('findWin');
	});
	$.address(addrlist, "province","city","district");
	$('[name="findType"]').click(function(){
		if(this.value == 1){
			$('.exactFind').show();
			$('.mutilFind').hide();
		}else{
			$('.exactFind').hide();
			$('.mutilFind').show();
		}
	});
});
function addFindResult(data){
	if(data.page && data.page.items && data.page.items.length){
		result = data;
		var html = '';
		var user = getLocalStorage('user');
		for ( var i = 0; i < data.page.items.length; i++) {
			var item = data.page.items[i];
			if(user.id != item.id){
				var u = getFreindInfo(item.id);
				html += '<li style="padding: 5px 0;border-top: 1px solid #F7F7F7; border-bottom: 1px solid #D5D6D7;">'+
				    '<a href="#">'+
					    '<div>'+
					    	'<img src="'+(item.userExt.face || '')+'" onerror="faceNofind()" style="float: left;width: 40px;height:40px;"/>'+
					    	'<div><span style="margin-left: 8px;color: #343434;" class="ellipsis">'+item.userExt.nickName+'('+item.name+')</span>'+
					    		'<div style="float: right; margin-right: 20px;">'+
					    			'<span style="margin: 0 5px;" onclick="openInfo(\''+item.id+'\');"><img src="images/search_detail_icon.png" style="vertical-align: middle;margin-right: 5px;"/>详细资料</span>'+
					    			(u ? '<span style="margin: 0 5px;">已添加</span>': '<a href="javascript:;" onclick="addFriend(\''+item.id+'\');"><span style="margin: 0 5px;"><img src="images/search_add_icon.png" style="vertical-align: middle;margin-right: 5px;"/>加为好友</span></a>')
					    			+
					    		'</div>'+
					    	'</div>'+
							'<span style="margin-left: 50px; color: #343434;display: block;">性别: '+item.userExt.sexMemo+'&nbsp;&nbsp;&nbsp;来自: '+item.area.country+item.area.province+item.area.city+'</span>'+
					    '</div>'+
				    '</a>'+
			    '</li>';
			}
		}
		if(html && html != ''){
			$('[data-role="listview"]', '#findResult').html(html).trigger('create');
			$('#findParam').hide();
			$('#findResult').show();
			$('#findBtn').hide();
			$('#preBtn').show();
		}
	}
}
function pre(){
	$('#findParam').show();
	$('#findResult').hide();
	$('[data-role="listview"]', '#findResult').empty();
	$('#preBtn').hide();
	$('#findBtn').show();
}
function find(){
	var type = $('[name="findType"]:checked').val();
	var username = $('#username'),
		nickName = $('#nickName');
	var un = username.val();
	var nn = nickName.val();
	if(un == '' && nn == '' && type == 1){
		username.focus();
	}else{
		var data = {
			type: type,
			name: un,
			nickName: nn,
			online: true
		}
		if(type == 2){
			data.nickName = $('#mutil_nickName').val();
			data.online = $('#online')[0].checked;
			data.province = $('#province').val();
			data.city = $('#city').val();
			data.sex = $('#sex').val();
		}
		for ( var key in data) {
			if(!data[key] || data[key] == '' || data[key] == '市辖区' || data[key] == '县' || data[key] == '请选择')
				delete data[key];
		}
		ajax({
			url: baseUrl + '/wl/user/find.do',
			data: data,
			success: function(data){
				addFindResult(data.data);
			}
		});
	}
}
function setGroup(id){
	loadGroup(function(data){
		addFriendId = id;
		var g = $('#group');
		g.empty();
		for ( var i = 0; i < data.data.list.length; i++) {
			var group = data.data.list[i];
			g.append('<option value="'+group.id+'" title="'+group.name+'">'+group.name+'</option>');
		}
	});
}
function addFriend(id){
	var data = result;
	if(data.page && data.page.items && data.page.items.length){
		for ( var i = 0; i < data.page.items.length; i++) {
			var item = data.page.items[i];
			if(item.id == id){
				var addFriends = getLocalStorage('addFriends') || {};
				if(addFriends && addFriends[id]){
					addFriends[id].show();
					addFriends[id].focus();
				}else{
					var f = navite.newWin('addFriend.html');
					f.opt = item;
					addFriends[id] = f;
					setLocalStorage('addFriends', addFriends);
				}
			}
		}
	}
}