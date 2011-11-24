$(world).bind({
	'world.click:5.5':	function(){
		console.log(5,5);
	},
	'world.click:2.2':	function(){
		console.log(2,2);
	},
	'world.walk:3.3':	function(v){
		console.log(3,3);
	},
	'world.click:14.14':	function(){
		$(this).one('world.walk:13.14 world.walk:14.13 world.walk:15.14',function(v){
			socket.emit('player.openChest');
			socket.once('player.openChest',function(data){
				console.log(14,14,data);
				$(world).unbind('world.walk:13.14 world.walk:14.13 world.walk:15.14');
			});
		});
	}
});