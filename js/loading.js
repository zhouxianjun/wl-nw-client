var G_loading = function(){
	this.dom = '<div class="container">' +
					'<div class="content">' +
					    '<div class="circle"></div>' +
					    '<div class="circle1"></div>' +
				    '</div>' +
				'</div>';
	this.stop = function(){
		$('.circle, .circle1', this.dom).addClass('stop');
		$(this.dom).hide();
	}
	this.start = function(){
		me.center();
		$(this.dom).show();
		$('.circle, .circle1', this.dom).removeClass('stop');
	}
	this.center = function(){
		$(this.dom).css({
			 position:'absolute',
			 left: ($(window).width() - $(this.dom).outerWidth())/2,
			 top: ($(window).height() - $(this.dom).outerHeight())/2 + $(document).scrollTop()
		 });
	}
	var me = this;
	$(window).resize(function(){
		 me.center();
	});
	this.dom = $(this.dom).appendTo('body').hide();
}