var menu = (function(){
	var self = this,
		$self = $('#menu'),
		isOpen = false,
		open = function(){
			isOpen = true;
			party();
			$self.stop().fadeTo(1e3,1);
		},
		close = function(){
			isOpen = false;
			$self.stop().fadeTo(1e3,0,function(){
				$self.hide();
			});
		},
		toggle = function(){
			if(!isOpen){
				open();
			}else{
				close();
			}
		},
		party = function(){
			var i,l,
				$members = $('#party').children('ol');
			$('#menu-party-invite').hide();
			$.when(game.getParty()).done(function(party){
				$members.html('');
				for(i = 0, l = party.length; i < l; i += 1){
					$members.append('<li>' + party[i] + '</li>');
				}
			});
		},
		init = (function(){
			var i,l,
				$players = $('#menu-party-invite-name');
			$('#menu-party-invite-button').on('click',function(){
				$.when(game.getPlayers()).done(function(players){
					$players.children().eq(0).nextAll().remove();
					for(i = 0, l = players.length; i < l; i += 1){
						if(players[i] != me.user){
							$players.append('<option>' + players[i] + '</option>');
						}
					}
					$('#menu-party-invite').show(function(){
						$players.chosen();
					});
				});
			});
			$('#menu-party-invite-send').on('click',function(){
				$('#menu-party-invite').hide();
				$.get('POST/invite',{
					user:	$players.val()
				});
			});
		})();
	return {
		isOpen:	isOpen,
		toggle:	toggle
	};
})();