
function wrapper(opt, params){
	this.hasNext = true;
	this.onNext = opt && opt.onNext ? opt.onNext : function(){};
	this.onRefresh = opt && opt.onRefresh ? opt.onRefresh : function(){};
	this.scrollToTop = function(){
		if(this.scroll)
			this.scroll.scrollTo(0,0);
	},
	this.refresh = function(){
		if(this.scroll)
			this.scroll.refresh();
	}
	var me = this;
	me.content = document.getElementById(opt.content)
	me.pullDown = opt.pullDown ? document.getElementById(opt.pullDown) : false;
	me.pullUp = opt.pullUp ? document.getElementById(opt.pullUp) : false;	
	var p = {
		scrollbarClass: 'myScrollbar', /* 重要样式 */
		useTransition: false, /* 此属性不知用意，本人从true改为false */
		onRefresh: function () {
			if($('#' + opt.pullUp)[0] &&  $(me.content)[0] && $(me.content).children().length){
				$('#' + opt.pullUp).show();
			}else{
				$('#' + opt.pullUp).hide();
			}
			if (me.pullDown && me.pullDown.className.match('loading')) {
				$(me.pullDown).removeClass('loading');
				$(me.pullDown).removeClass('flip');
				me.pullDown.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
				me.pullDown.style.width = '150px';
			} else if (me.pullUp && me.pullUp.className.match('loading')) {
				$(me.pullUp).removeClass('loading');
				$(me.pullUp).removeClass('flip');
				me.pullUp.querySelector('.pullUpLabel').innerHTML = '上拉加载更多...';
			}
		},
		onScrollMove: function () {
			if(!me.firstY){
				me.firstY = this.y;
			}
			if (me.pullDown && this.y > 5 && !me.pullDown.className.match('flip')) {
				$(me.pullDown).addClass('flip');
				me.pullDown.querySelector('.pullDownLabel').innerHTML = '松手开始更新...';
				this.minScrollY = 0;
				me.pullDown.style.width = '150px';
			} else if (me.pullDown && this.y < 5 && me.pullDown.className.match('flip')) {
				$(me.pullDown).removeClass('flip');
				me.pullDown.querySelector('.pullDownLabel').innerHTML = '下拉刷新...';
				this.minScrollY = -me.pullDown.offsetHeight;
				me.pullDown.style.width = '150px';
			} else if (me.hasNext && this.y < (me.firstY - 5) && me.pullUp && this.y < (this.maxScrollY - 5) && !me.pullUp.className.match('flip')) {
				$(me.pullUp).addClass('flip');
				me.pullUp.querySelector('.pullUpLabel').innerHTML = '松手开始加载...';
				this.maxScrollY = this.maxScrollY;
			} else if (me.pullUp && this.y > (this.maxScrollY + 5) && me.pullUp.className.match('flip')) {
				$(me.pullUp).removeClass('flip');
				me.pullUp.querySelector('.pullUpLabel').innerHTML = me.hasNext ? '上拉加载更多...' : '没有可加载的了';
				this.maxScrollY = pullUp.offsetHeight;
			}
		},
		onScrollEnd: function () {
			if (me.pullDown && me.pullDown.className.match('flip')) {
				$(me.pullDown).addClass('loading');
				$(me.pullDown).removeClass('flip');
				me.pullDown.style.width = '100px';
				me.pullDown.querySelector('.pullDownLabel').innerHTML = '加载中...';				
				me.onRefresh();
			}else if (me.pullUp && me.pullUp.className.match('flip')) {
				$(me.pullUp).addClass('loading');
				$(me.pullUp).removeClass('flip');
				me.pullUp.querySelector('.pullUpLabel').innerHTML = '加载中...';	
				me.onNext();
			}
			me.firstY = 0;
		}
	};
	if(opt.content){
		p.topOffset = $(me.pullDown).height();
	}
	if(params){
		for(var o in params){
			p[o] = params[0];
		}
	}
	me.scroll = new iScroll(opt.id, p);
	return me;
}