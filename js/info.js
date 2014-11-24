var id;
if(navite){
	navite.setSize(562, 333);
	navite.listenClose(function(){
		var infos = getLocalStorage('infos');
		delete infos[id];
		setLocalStorage('infos', infos);
	});
	win.setResizable(false);
}
$(function(){
	id = getQueryString('id');
	ajax({
		url: baseUrl + '/wl/user/info.do',
		data: {
			id: id
		},
		success: function(data){
			var user = data.data.user;
			$('#face').attr('src', user.userExt.face)[0].onerror = faceNofind;
			$('#nickName').text(user.userExt.nickName || '');
			$('#signature').text(user.userExt.signature || '');
			$('#sex').text(user.userExt.sexMemo);
			$('#birthday').text(user.userExt.birthday || '');
			$('#country').text(user.area.country);
			$('#province').text(user.area.province);
			$('#city').text(user.area.city);
			$('#email').text(user.email);
			$('#mobile').text(user.userExt.mobile || '');
			$('#tel').text(user.userExt.tel || '');
			$('#description').text(user.userExt.description || '');
			$('#constellation').text(user.userExt.constellation || '');
			$('#zodiac').text(user.userExt.zodiac || '');
		},
		error: function(data){
			showMsg({
				title: '错误',
				message: '拉取信息失败',
				type: 'warning',
				callback: function(){
					win.close();
					return true;
				}
			});
		}
	});
});