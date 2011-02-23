(function($){

var module = {
	name: "volume",
	events: {
		volumeChanged: function() {
			bar.adjustBar($('body').data('volume'));
		},
	},
	enable: function() {},
	disable: function(){}
};

var ui,bar;

d10.fn.playlistModules = d10.fn.playlistModules || {};
d10.fn.playlistModules.volume = function(widget,current)  {
		ui = widget;
		bar = new volumebar(ui,1);
		bar.adjustBar(current);
        return module;
};


function volumebar( widget_arg, maxi ) { 
	
	var ui = widget_arg;
	var pmax = 0; 
	var punit = 0;
	var current = 0;
	this.setMax = function(num) {
		pmax=num;
		punit= pmax / ui.width();
	}
	this.adjustBar = function (vol) {
		if ( vol > pmax ) return ;
		$('div',ui).css('width',ui.width() / pmax  * vol);
	}
	this.getCurrent = function() {
		return pmax* 0.1 * $('div',ui).width();
	};
	ui.css({ textAlign: 'left', position: 'relative', overflow: 'hidden' });
	$('div',ui).css({ position: 'absolute', width: 0, height: '100%', overflow: 'hidden' });
	ui.click(function(e) {
		var offset = ui.offset();
		var pix = e.pageX-offset.left;
		var volume = $.sprintf('%.2f',pix*punit) ;
		if ( volume > 1 )
			volume = 1;
		else if ( volume < 0 )
			volume = 0;
		d10.playlist.volume(volume);
	});
	
	
	this.setMax(maxi);
};




})(jQuery);
