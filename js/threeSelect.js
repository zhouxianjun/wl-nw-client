/**
@author binbin.yin
@param province_id 省级下拉框id
@param city_id     市级下拉框id
@param area_id     区县级下拉框id
@param defaultProvince 默认选中的省（可选）
@param defaultCity     默认选中的市（可选）
@param defaultArea     默认选中的区域（可选）
*/
(function($) {
	$.address=function(data, province_id, city_id, area_id, defaultProvince, defaultCity, defaultArea){
		var province=$('#'+province_id),city=$('#'+city_id),area=$('#'+area_id),province_opt='';
		$.address.setOption(province,data,defaultProvince);
		province.change(function(){
			var provinceIndex=$.address.getIndex(province);
			$.address.setOption(city,data[provinceIndex].c,defaultCity);
			$.address.setOption(area,data[provinceIndex].c[$.address.getIndex(city)].a,defaultArea);
		});
		var provinceIndex=$.address.getIndex(province);
		$.address.setOption(city,data[provinceIndex].c,defaultCity);
		city.change(function(){
			$.address.setOption(area,data[$.address.getIndex(province)].c[$.address.getIndex(city)].a,defaultArea);
		});
		$.address.setOption(area,data[provinceIndex].c[$.address.getIndex(city)].a,defaultArea);
	};
	$.address.getIndex=function(dom){return parseInt(dom.find('option:selected').attr('index'));};
	$.address.setOption=function(dom,obj,str){
		var opt='';
		$.each(obj,function(i,v){
			var text='object'==typeof v ? v.n : v;
			var selected = 'undefined'==typeof str || text!= str ? '' : ' selected';
			opt+='<option index="'+i+'" value="'+text+'"'+selected+'>'+text+'</option>';
		});
		dom.html(opt);
	}
})(jQuery);