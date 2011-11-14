$(world).bind({
	'world.click:10.10':	function(){
		$(this).one('world.walk:9.10 world.walk:10.9 world.walk:10.11 world.walk:11.10',function(v){
			socket.emit('player.openChest');
			socket.once('player.openChest',function(data){
				console.log(10,10,data);
			});
		});
	}
});