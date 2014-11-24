if(navite){
	navite.setSize(562, 373);
	navite.listenClose(function(){
		var editInfo = getLocalStorage('editInfo');
		setLocalStorage('editInfo');
	});
	win.setResizable(false);
}
var nyrdata = getNYR(1984);
$(function(){
	var data = new Array();
	if(nyrdata && nyrdata.length){
		for ( var i = nyrdata.length - 1; i >= 0; i--) {
			data.push({
				n: nyrdata[i].y + '('+nyrdata[i].sx+')' + nyrdata[i].year,
				c: initMonth(nyrdata[i].year)
			});
		}
	}
	$.address(data, "edit_year","edit_month","edit_day");
	ajax({
		url: baseUrl + '/wl/user/info.do',
		data: {
			id: getLocalStorage('user').id
		},
		success: function(data){
			var user = data.data.user;
			$('#edit_face').attr('src', user.userExt.face)[0].onerror = faceNofind;
			$('#edit_nickName').val(user.userExt.nickName || '');
			$('#edit_signature').val(user.userExt.signature || '');
			$('#edit_sex').val(user.userExt.sex);
			$('#edit_email').val(user.email);
			$('#edit_mobile').val(user.userExt.mobile || '');
			$('#edit_tel').val(user.userExt.tel || '');
			$('#edit_description').val(user.userExt.description || '');
			
			if(user.userExt.birthday){
				var date = user.userExt.birthday.split('-');
				var yy = getYear(date[0]);
				$('#edit_year').val(yy.y + '('+yy.sx+')' + yy.year);
				$('#edit_month').val(date[1]);
				$('#edit_day').val(date[2]);
				var gl = ntog(date[0], date[1], date[2]);
				$('#edit_constellation').val(start(gl.m, gl.d) || '');
				yearChange(date[1]);
			}
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
function getYear(year){
	if(year && year != '请选择'){
		year = getNum(year + '');
		for ( var i = 0; i < nyrdata.length; i++) {
			if(nyrdata[i].year == year){
				return nyrdata[i];
			}
		}
	}
}
function yearChange(){
	var year = $('#edit_year').val();
	if(year && year != '请选择'){
		$('#edit_zodiac').val(getYear(year).sx);
	}
}
function initMonth(year){
	var marr = new Array();
	for ( var i = 1; i < 13; i++) {
		marr.push({
			n: i < 10 ? '0' + i : i,
			a: initDays(year, i)
		});
	}
	return marr;
}
function initDays(year, m){
	var nl = GetLunarDay(parseInt(year),parseInt(m) + 1,0);
	var max = [1,3,5,7,8,10,12];
	var days = nl.m.indexOf('(闰)') > -1 ? 28 : (max.indexOf(parseInt(m)) > -1 ? 30 : 29);
	var darr = new Array();
	for ( var i = 1; i < days + 1; i++) {
		darr.push({
			n: i < 10 ? '0' + i : i
		});
	}
	return darr;
}
function monthChange(){
	var year = $('#edit_year').val();
	var m = $('#edit_month').val();
	if(m && m != '请选择'){
		m = getNum(m);
		year = getNum(year);
		var nl = GetLunarDay(parseInt(year),parseInt(m) + 1,0);
		var max = [1,3,5,7,8,10,12];
		var days = nl.m.indexOf('(闰)') > -1 ? 28 : (max.indexOf(parseInt(m)) > -1 ? 30 : 29);
		var html = '';
		for ( var i = 1; i < days + 1; i++) {
			var d = i < 10 ? '0' + i : i;
			html += '<option index="'+(i-1)+'" value="'+d+'">'+d+'</option>';
		}
		$('#edit_day').empty();
		$('#edit_day').append(html);
		$('#edit_day').val(m);
	}
	
}
function startChange(){
	var year = $('#edit_year').val();
	var m = $('#edit_month').val();
	var d = $('#edit_day').val();
	if(m && d && m != '请选择' && d != '请选择'){
		try {
			m = parseInt(getNum(m));
			d = parseInt(d);
			var gl = ntog(parseInt(getNum(year)), m, d);
			$('#edit_constellation').val(start(gl.m, gl.d) || '');
		} catch (e) {
			// TODO: handle exception
		}
	}
}
function openFaceFile(){
	var chooser = $('<input style="display:none;" name="face" id="faceFileDialog" type="file" accept=".jpeg,.jpg,.png,.gif" />');
	chooser.appendTo('body');
    chooser.change(function(evt) {
    	var id = getLocalStorage('user').id;
    	window.loading = loadingMsg({});
    	$.ajaxFileUpload({
    		url: baseUrl + '/wl/user/updateFace.do?_userid=' + id + '&id=' + id,
    		secureuri: false,
    		fileElementId: 'faceFileDialog',
    		dataType: 'json',
            success: function (data, status){
            	window.loading.destroy();
            	$('#edit_face').attr('src', data.data.user.userExt.face)[0].onerror = faceNofind;
            	getLocalStorage('socket').push('updateInfo', data.data.user, window);
    			getLocalStorage('main').window.initMyInfo({
    				face: data.data.user.userExt.face,
    				nickName: data.data.user.userExt.nickName,
    				signature: data.data.user.userExt.signature || ''
    			});
            },
            error: function (data, status, e){
            	window.loading.destroy();
            	confirmMsg({
        			type: 'warning',
        			message: '上传头像失败!',
        			buttons: [
      					{'data-role': 'ok', text: '关闭'}
      				],
        			ok: function(me){
        				me.destroy();
        			}
    			});
            }
        });
    	chooser.remove();
    });
    chooser.trigger('click');
}
function update(){
	var params = {
		id: getLocalStorage('user').id,
		'userExt.nickName': $('#edit_nickName').val(),
		'userExt.signature': $('#edit_signature').val(),
		'userExt.sex': $('#edit_sex').val(),
		'userExt.mobile': $('#edit_mobile').val(),
		'userExt.tel': $('#edit_tel').val(),
		'userExt.zodiac': $('#edit_zodiac').val(),
		'userExt.constellation': $('#edit_constellation').val(),
		'userExt.description': $('#edit_description').val()
	}
	if($('#edit_day').val() && $('#edit_day').val() != '请选择'){
		params['userExt.birthday'] = getNum($('#edit_year').val()) + '-' + $('#edit_month').val() + '-' + $('#edit_day').val();
	}
	for ( var key in params) {
		if(!params[key] || params[key] == ''){
			delete params[key];
		}
	}
	ajax({
		url: baseUrl + '/wl/user/update.do',
		data: params,
		success: function(data){
			var user = data.data.user;
			setLocalStorage('user', user);
			var opt = {
				message: "更新资料成功",
				destroy: true,	// hides all existing notification
				opacity: .5,
				ms: 5000,
				position: 'center',
				modal: true,
				loader: false
			}
			notifier.success(opt);
			getLocalStorage('socket').push('updateInfo', user, window);
			getLocalStorage('main').window.initMyInfo({
				face: user.userExt.face,
				nickName: user.userExt.nickName,
				signature: user.userExt.signature || ''
			});
		}
	});
}