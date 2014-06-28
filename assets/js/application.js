$(document).on("ready",function(){
	
    console.log("player loaded");
    
    // Define default settings
	window.app_vars = {
		
		selected   : undefined,
        status     : 0,
		current    : undefined,
		queue      : [],
        shuffle    : false,
        loop       : false,
        contextbox : false,
        items      : parseInt($(".item-row").length),
        playlists  : {
			"playlist_1" : [4,124,211,300,301,302,421]
		},
		history        : {
			items   : [], 
			pointer : -1
		}
	}
	
	window.elements = {
		$progress_bar      : $("#progress_bar"),
		$control_playpause : $("#control_playpause"),
		$control_next      : $("#control_next"),
		$control_prev      : $("#control_prev"),
	}
    
    // Define the player element...
    window.player = document.getElementById("_player");
        
    // Function Definitions
    var item_selected = function($ele){
        $(".item-row").removeClass("selected-row");
		if (!$ele.hasClass("selected-row")){
			app_vars.selected = $(this).data().id;
			$ele.addClass("selected-row");
		}
    }
	
	var resume_item = function($ele){
		// We should play
		var $row_status = $ele.find(".row-status");
		$row_status.removeClass("fa-play");
		$row_status.addClass("fa-pause");
		console.log("attempting resume");
		console.log("time (in ms) remaining: "+parseInt(player.duration - player.currentTime)*1000);
		player.play();
		$(player).on("play",function(){
			elements.$progress_bar.animate(
				{ width: "100%" }, parseInt(player.duration - player.currentTime)*1000,"linear"
			);
		});
		app_vars.status = 1;
	}
	
	var pause_item = function($ele){
		// We should pause..
		var $row_status = $ele.find(".row-status");
		$row_status.removeClass("fa-pause");
		$row_status.addClass("fa-play");
		console.log("attempting pause");
		player.pause();
		elements.$progress_bar.stop(true);
		app_vars.status = 0;
	}
	
	var load_item = function($ele){
		var item_id = $ele.data().id;
		var item_title = $ele.find(".item-title span").text();
		var $row_status = $ele.find(".row-status");
		$("#current_track").html("Playing: <b>"+item_title+"</b>");
		// Reset progress bar
		elements.$progress_bar.stop(true);
		elements.$progress_bar.animate({
			width: "0%"},500);
		// Set current item variable
		app_vars.current = parseInt(item_id);
		$(".item-row .row-status").removeClass("fa-pause fa-play");
		var $row_status = $ele.find(".row-status");
		$row_status.removeClass("fa-play");
		$row_status.addClass("fa-pause");
		// --- Change control icon ---
		var $playpause_button = $("#control_playpause").find(".fa");
		$playpause_button.removeClass("fa-play");
		$playpause_button.addClass("fa-pause");
		// Highlight the current row
		// -- remove any selected classes
		$(".item-row").removeClass("selected-row");
		if (!$ele.hasClass("selected-row")){
			$ele.addClass("selected-row");
		}
		console.log("asking server for url...");
		$.ajax({
			url  : "/xhr/get_url",
			data : {
				id    : item_id,
				title : item_title
				},
			type: 'get'
		}).done(function(file){
			console.log("got url from server: "+file);
			$("#_player > source").prop({
			"src":file,
			"type":"audio/mpeg"});
			console.log("loading file...");
			player.load();
			$(player).on("play",function(){
				console.log("animation duration = "+((player.duration)*1000));
				elements.$progress_bar.animate({
					width: "100%"},parseInt(player.duration)*1000,"linear");
			});
			app_vars.status = 1;
		}).fail(function(){
			console.log("failed getting url from server.");
		});
	}
	
    var item_clicked = function($ele){
		var item_title = $ele.find(".item-title span").text();
		var item_id = $ele.data().id;
		app_vars.selected = item_id;
        if (app_vars.current === item_id && app_vars.status === 1){
            pause_item($ele);
        } else if (app_vars.current === item_id){
			resume_item($ele);
        } else {
			load_item($ele);
        }
        $ele.scrollIntoView();
        return item_title;
    };
    
    var next_item = function(){
		app_vars.status = 0;
        var title = undefined;
        if (app_vars.loop === true){
            console.log("looping...");
            app_vars.status = 1;
            player.load();
        } else {
			if (app_vars.current === undefined){
				app_vars.current = -1;
			}
            if (app_vars.shuffle === false){
                var next = app_vars.current + 1;
                console.log("got next track: ID='"+app_vars.current+"' => ID='"+next+"'");
                if ($("#_media_"+next).length){
                    $element = $("#_media_"+next);
                } else {
                    $element = $("#_media_0");
                }
                title = item_clicked($element);
                $element.scrollIntoView();
            } else {
                var found = false;
                console.log("generating next shuffle track...");
                while(found === false){
                    var next = Math.floor(Math.random() * (app_vars.items - 0 + 1)) + 0;
                    if (next !== app_vars.current){
                        console.log("got next track: ID='"+app_vars.current+"' => ID='"+next+"'");
                        found = true;
                        $element = $("#_media_"+next);
                        title = item_clicked($element);
                        $element.scrollIntoView();
                    }
                }
            }
            
            if (title !== undefined){
				var $bar = $("#notification_bar");
				$bar.find("notification_text").text(title);
				if (app_vars.notification === false){
					$bar.fadeIn(400);
					var timeout_id = window.setTimeout(function(){
						$bar.fadeOut(400);
					},20000);
				}
			}
			
        }
	}
    // End of functions
    
    // Event Handlers
	$(".item-row").on("click",function(){
		console.log("single click triggered");
        item_selected($(this));
        item_clicked($(this));
	});
	
	$(".items-container , #contextmenu").on("contextmenu",function(){
		console.log("prevent system contextmenu");
        return false;
	});
	
	$(".items-container").on("mousedown",function(event){
		if (event.which === 3){
			var in_chain = ($(event.target).parents('.item-row').length > 0);
			if (in_chain){
				item_selected($(event.target).closest('.item-row'));
			}
			if ($("#contextmenu").css("display") !== "none"){
				$("#contextmenu").hide();
			}
			var pos_y = event.clientY;
			var pos_x = event.clientX;
			var window_height = $(window).height();
			var window_width  = $(window).width();
			var menu_height   = $("#contextmenu").height();
			var menu_width    = $("#contextmenu").width();
			if ((pos_y + menu_height) > window_height){
				pos_y = window_height - (menu_height + 20);
			}
			if ((pos_x + menu_width) > window_width){
				pos_x = window_width - (menu_width + 10);
			}
			$("#contextmenu").css({
				left: pos_x,
				top: pos_y
			});
			app_vars.contextbox = true;
			// Open window
			$("#contextmenu").fadeIn("200");
            console.log("click 3");
			event.preventDefault();
		} else {
			var in_chain = ($(event.target).parents('.item-row').length > 0);
			if (event.which === 2 && in_chain){
				console.log("in chain");
                event.preventDefault();
			} else {
                console.log("not in chain");
                event.preventDefault();
            }
			$("#contextmenu").fadeOut("200");
		}
	});
    
    $("#item_filter").on("keyup",function(){
        var query = $(this).val().toLowerCase();
        console.log("attempting search: "+query);
        if (query.length > 2){
            $(".item-row").each(function(){
                $element = $(this);
                if ($element.children(".item-title").text().toLowerCase().indexOf(query) === -1){
                    $element.hide();
                } else {
                    $element.show();
                }
            });         

        } else {
            $(".item-row").show();
        }
    });
    
    $("#_player").on("ended stalled",function(){
        console.log("track ended (or stalled).");
        console.log("adding to history");
        // Add to player history
		app_vars.history.items.push(item_id);
		app_vars.history.pointer++;
        next_item();
    });
    
    $("#volume_down, #volume_up").on("click",function(){
        var volume = player.volume + $(this).data().mod;
        console.log("trying to set volume to: "+volume);
        if (!(volume > 1) && !(volume < 0)){
            player.volume = volume;
        }
    });
    
    $("#volume_off").on("click",function(){
        console.log("setting volume to 0");
        player.volume = 0;
    });
    
	$("#shuffle").on("click",function(){
        if (app_vars.shuffle === true){
            app_vars.shuffle = false;
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-default");
        } else {
            app_vars.shuffle = true;
            $(this).removeClass("btn-default");
            $(this).addClass("btn-primary");
        }
	});
    
    $("#loop").on("click",function(){
        if (app_vars.loop === true){
            app_vars.loop = false;
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-default");
        } else {
            app_vars.loop = true;
            $(this).removeClass("btn-default");
            $(this).addClass("btn-primary");
        }
	});
	
	elements.$control_prev.on("click",function(){
		console.log("have you played enough of this song to get to the previous?");
		if (player.currentTime < 2.5){
			console.log("nope.");
			if (app_vars.current === undefined){
				load_item($("#_media_0"));
			} else {
				load_item($("#_media_"+app_vars.current));
			}
		} else {
			if (app_vars.shuffle === false){
                console.log("No shuffle, this'll be easy.");
                var prev = app_vars.current - 1;
                console.log("got next track: ID='"+app_vars.current+"' => ID='"+prev+"'");
                if (prev >= 0){
                    $element = $("#_media_"+prev);
                } else {
                    $element = $("#_media_"+(app_vars.items - 1));
                }
                console.log("playing ID: "+prev);
                title = item_clicked($element);
            } else {
				console.log("yep, but do you have history?");
				if (app_vars.history.pointer > 0){
					app_vars.history.pointer--;
					console.log("yep again! playing ID: "+app_vars.history.pointer);
					load_item($("#_media_"+app_vars.history.items[app_vars.history.pointer]));
				} else {
					console.log("you have about as much as america -_- im gonna give you a random track.");
					next_item();
				}
			}
		}
	});
	
	elements.$control_playpause.on("click",function(){
		console.log("deciding to play or pause...");
		var $icon = $(this).find(".fa");
		if (app_vars.status === 0){
			console.log("we should play!");
			$icon.removeClass("fa-play");
			$icon.addClass("fa-pause");
			if (app_vars.current !== undefined){
				resume_item($("#_media_"+app_vars.current));
			} else {
				next_item();
			}
		} else if (app_vars.current !== undefined) {
			console.log("we should pause.");
			$icon.removeClass("fa-pause");
			$icon.addClass("fa-play");
			pause_item($("#_media_"+app_vars.current));
		} else {
			console.error("Wat?!");
		}
	});
	
	elements.$control_next.on("click",function(){
		next_item();
	});
	
	$(player).on("seeking",function(){
		console.log("trying to fetch data...");
	});
	
});
