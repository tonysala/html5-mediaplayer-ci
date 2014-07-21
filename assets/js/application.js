$(document).on("ready",function(){
	
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
		},
		last_api_call : undefined,
		notification  : false,
		forwardrate   : 4,
		fastforward   : false,
		notification_duration: 12000
	}
	
	window.elements = {
		$progress_bar      : $("#progress_bar"),
		$track_pointer     : $("#track_pointer"),
		$control_playpause : $("#control_playpause"),
		$control_next      : $("#control_next"),
		$control_prev      : $("#control_prev"),
	}
    
    // Define the player element...
    window.player = document.getElementById("_player");
      
    // Do setup stuff
    $("#playlist_list").slideUp();
    $(".slider-pointer").css({'left': (player.volume * ($(".slider-line").width() - 4)) });
    //chrome.notifications.create('item-play',{TemplateType:'basic',title:'now playing'});
    
    // Add a way of getting the index of the item
    $.fn.getIndex = function(){
		if ($(this).hasClass("item-row")){
			var id = $(this).prop('id');
			return parseInt(id.substring(id.lastIndexOf("_") + 1));
		} else {
			return undefined;
		}
	}
        
    // Function Definitions
    var item_selected = function($ele){
		app_vars.selected = $ele.getIndex();
        $(".item-row").removeClass("selected-row");
		if (!$ele.hasClass("selected-row")){
			$ele.addClass("selected-row");
		}
    }
	
	var resume_item = function($ele){
		// We should play
		var $row_status = $ele.find(".row-status");
		$row_status.removeClass("fa-play");
		$row_status.addClass("fa-pause");
		var $playpause_button = elements.$control_playpause.find(".fa");
		$playpause_button.removeClass("fa-play");
		$playpause_button.addClass("fa-pause");
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
		var $playpause_button = elements.$control_playpause.find(".fa");
		$playpause_button.removeClass("fa-pause");
		$playpause_button.addClass("fa-play");
		player.pause();
		elements.$progress_bar.stop(true);
		elements.$track_pointer.stop(true);
		app_vars.status = 0;
	}
	
	var load_item = function($ele){
		console.log($ele);
		var item_id = $ele.getIndex();
		var item_title = $ele.find(".item-title span").text();
		var $row_status = $ele.find(".row-status");
		$("#current_track").html("Playing: <b>"+item_title+"</b>");
		// Reset progress bar
		elements.$progress_bar.stop(true).animate({
			width: "0%"},500);
		elements.$track_pointer.stop(true).animate({
			left: "0%"},500);
		// Set current item variable
		app_vars.current = parseInt(item_id);
		$(".item-row .row-status").removeClass("fa-pause fa-play");
		var $row_status = $ele.find(".row-status");
		$row_status.removeClass("fa-play");
		$row_status.addClass("fa-pause");
		// --- Change control icon ---
		var $playpause_button = elements.$control_playpause.find(".fa");
		$playpause_button.removeClass("fa-play");
		$playpause_button.addClass("fa-pause");
		// Highlight the current row
		// -- remove any selected classes
		$(".item-row").removeClass("selected-row");
		if (!$ele.hasClass("selected-row")){
			$ele.addClass("selected-row");
		}
		$.ajax({
			url  : "/xhr/get_url",
			data : {
				id    : item_id,
				title : item_title
				},
			type: 'get'
		}).done(function(data){
			console.log(data);
			$("#_player > source").prop({
				"src" :data,
				"type":"audio/mpeg"
			});
			player.load();
			$(player).on("play",function(){
				elements.$progress_bar.animate({
					width: "100%"},parseInt(player.duration)*1000,"linear"
				);
				elements.$track_pointer.animate({
					left: "100%"},parseInt(player.duration)*1000,"linear"
				);
			});
			app_vars.status = 1;
			load_cover_art();
		}).fail(function(){
			console.log("failed getting url from server.");
		});
	}
	
    var item_clicked = function($ele){
		var item_title = $ele.find(".item-title span").text();
		var item_id = $ele.data().id;
		var item_index = $ele.getIndex();
		app_vars.selected = item_index;
        console.log(app_vars.current, item_index);
        if (app_vars.current === item_index && app_vars.status === 1){
            pause_item($ele);
        } else if (app_vars.current === item_index){
			resume_item($ele);
        } else {
			load_item($ele);
        }
        $ele.scrollIntoView();
        return item_title;
    };
    
    var next_item = function(){
		console.log("next item");
		app_vars.status = 0;
        var title = undefined;
        if (app_vars.queue.length > 0){
			var next = app_vars.queue.shift();
			$element = $("#_media_"+next);
			title = item_clicked($element);
			$element.scrollIntoView();
		} else if (app_vars.loop === true){
            app_vars.status = 1;
            player.load();
        } else {
			console.log("not looping, current: "+app_vars.current);
			if (app_vars.current === undefined){
				app_vars.current = -1;
			}
            if (app_vars.shuffle === false){
                console.log("not shuffling..");
                // We need to account for a reordered item list (getNext() method on juery element?)
                var next = app_vars.current + 1;
                if ($("#_media_"+next).length){
                    $element = $("#_media_"+next);
                } else {
                    $element = $("#_media_0");
                }
                
                title = item_clicked($element);
                $element.scrollIntoView();
            } else {
				console.log("shuffling..");
                var found = false;
                while(found === false){
                    var next = Math.floor(Math.random() * (app_vars.items - 0 + 1)) + 0;
                    if (next !== app_vars.current){
                        found = true;
                        $element = $("#_media_"+next);
						// Add to player history
						app_vars.history.items.push(next);
						app_vars.history.pointer++;
                        title = item_clicked($element);
                        $element.scrollIntoView();
                    }
                }
            }
            
            if (title !== undefined){
				var $bar = $("#notification_bar");
				$bar.find("#notification_text").text(title);
				clearTimeout(window.timeout_id);
				if (app_vars.notification === false){
					app_vars.notification = true;
					$bar.animate({bottom:"0px"},300,'swing');
				}
				window.timeout_id = setTimeout(function(){
					$bar.animate({bottom:"-30px"},300,'swing');
					app_vars.notification = false;
				},app_vars.notification_duration);
			}
			
        }
	}
		
	var load_cover_art = function(){
		console.log("Attempting cover art download");
		$.ajax({
			"url"  : "xhr/get_cover_art",
			"data" : {
				id : $("#_media_"+app_vars.selected).getIndex()
				},
			"type" : "get",
			"dataType": "json"
		}).done(function(data){
			console.log(data);
			$("#cover_art_image").attr("src",data.url);
		}).fail(function(data){
			console.log("Error(s) occured");
			console.log(data);
		});
	};
	
	
	var save_cover_art = function(){
		
	}
		
	var hide_menu = function(){
		$("#contextmenu").hide();
		$("#playlist_list").slideUp();
		app_vars.contextbox = false;
		return;
	}
	
	var show_menu = function(){
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
		// We can safely say the menu will now show
		app_vars.contextbox = true;
		// Open window
		$("#contextmenu").fadeIn("200");
	}

	var set_rating = function(rating){
		var $elements = $("#rating_container").children();
		if (rating == 0){
			$elements.addClass("fa-star-o").removeClass("fa-star");
		} else {
			$element = $elements.eq(rating).addClass("fa-star-o").removeClass("fa-star");;
			$element.prevAll().addClass("fa-star").removeClass("fa-star-o");
			$element.nextAll().addClass("fa-star-o").removeClass("fa-star");
		}
	}
    
    var move_slider_pointer = function(pageX){
		var start = $(".slider-line").offset().left;
		var width = $(".slider-line").width() - 4;
		var position = pageX - start;
		if (position < 0){
			position = 0;
		} else if (position > width){
			position = width;
		}
		$(".slider-pointer").css({'left':position});
		return {'position':position,'width':width};
	}
	
	var update_volume_icon = function(volume){
		var volume_icon = $("#volume_icon");
		console.log(volume);
		if (volume === 0){
			volume_icon.attr('class','fa fa-volume-off');
		} else if (volume < 0.4){
			volume_icon.attr('class','fa fa-volume-down');			
		} else {
			volume_icon.attr('class','fa fa-volume-up');
		}
	}
    
    var set_rate = function(rate){
		player.playbackRate = rate;
		elements.$progress_bar.stop(true).animate(
			{ width: "100%" }, (parseInt(player.duration - player.currentTime) * 1000) / rate,"linear"
		);
		elements.$track_pointer.stop(true).animate({ 
			left: "100%" }, (parseInt(player.duration - player.currentTime) * 1000) / rate,"linear"
		);
	}
    // End of functions
    
    // Event Handlers
	$(".item-row").on("click",function(){
        item_selected($(this));
        item_clicked($(this));
	});
	
	// ContextMenu Code
	$(".items-container , #contextmenu").on("contextmenu",function(){
        return false;
	});
	
	$("body").on("mousedown",function(event){
		var in_chain = ($(event.target).parents('.item-row').length > 0);
		var menu_on = ($("#contextmenu").css("display") !== "none");
		var $row = $(event.target).closest(".item-row");
		if (event.which === 3){	
			// If not right clicked over an item
			// Or if menu is already visible hide it and return
			if (!in_chain || menu_on){
				hide_menu();
				return;
			}
			item_selected($row);
			set_rating($row.data().rating);
			show_menu();
			event.preventDefault();
		} else {
			if (event.which === 2 && in_chain){
				item_selected($row);
                event.preventDefault();
			} else {
                event.preventDefault();
            }
			$("#contextmenu").fadeOut("200");
			$("#playlist_list").slideUp();
			app_vars.contextbox = false;
		}
	});
	
	$("#contextmenu li").on("click",function(e){
		if ($(e.target).closest("li").data().id === 1){
			if ($("#playlist_list").css("display") !== "none"){
				$("#playlist_list").slideUp(300);
			} else {
				$("#playlist_list").slideDown(300);
			}
		}
	});
	// End ContextMenu Code
    
    // Search code
    $("#item_filter").on("keyup",function(e){
        var query = $(this).val().toLowerCase();
        if (e.keyCode === 27){
			$(this).blur();
			return;
		}
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
    // End Search code
    
    $("#_player").on("ended stalled",function(){
        next_item();
    });
    
    $("#volume_down, #volume_up").on("click",function(){
        var volume = player.volume + $(this).data().mod;
        if (!(volume > 1) && !(volume < 0)){
            player.muted = false;
            player.volume = volume;
        }
    });
    
    $("#volume_off").on("click",function(){
        if (player.muted === true){
			player.muted = false;
		} else {
			player.muted = true;
		};
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
	
	elements.$control_prev.on("click dblclick",function(){
		if (player.currentTime > 3){
			if (app_vars.current === undefined){
				load_item($("#_media_0"));
			} else {
				load_item($("#_media_"+app_vars.current));
			}
		} else {
			if (app_vars.shuffle === false){
                var prev = app_vars.current - 1;
                if (prev >= 0){
                    $element = $("#_media_"+prev);
                } else {
                    $element = $("#_media_"+(app_vars.items - 1));
                }
                title = item_clicked($element);
            } else {
				if (app_vars.history.pointer > 0){
					app_vars.history.pointer--;
					item_clicked($("#_media_"+app_vars.history.items[app_vars.history.pointer]));
				} else {
					if (app_vars.history.pointer === 0 && app_vars.history.items.length > 0){
						app_vars.history.items = [];
					}
					next_item();
				}
			}
		}
	});
	
	elements.$control_playpause.on("click",function(){
		var $icon = $(this).find(".fa");
		if (app_vars.status === 0){
			$icon.removeClass("fa-play");
			$icon.addClass("fa-pause");
			if (app_vars.current !== undefined){
				resume_item($("#_media_"+app_vars.current));
			} else {
				next_item();
			}
		} else if (app_vars.current !== undefined) {
			$icon.removeClass("fa-pause");
			$icon.addClass("fa-play");
			pause_item($("#_media_"+app_vars.current));
		} else {
		}
	});
	
	elements.$control_next.on("mousedown",function(){
		if (app_vars.status === 1){
			fastforward_time_id = setTimeout(function(){
				app_vars.fastforward = true;
				set_rate(app_vars.forwardrate);
			},200);
		}
	});
	
	elements.$control_next.on("mouseup",function(e){
		set_rate(1);
		if (app_vars.status === 1){
			clearTimeout(fastforward_time_id);
		}
		if (app_vars.fastforward === true){
			app_vars.fastforward = false;
		} else {
			next_item();
		}
	});
	
	$(player).on("seeking",function(){
		console.log("trying to fetch data...");
	});
	
	$("#notification_bar").on("mouseover",function(){
		$("#notification_bar").animate({bottom:"-30px"},300,'swing');
		app_vars.notification = false;
	});
	
	// KeyBinding Code
	$(document).keydown(function(event) {
		var key = event.keyCode;
		if (key === 70 && event.ctrlKey) { // Ctrl + f
			$element = $("#item_filter");
			$element.scrollIntoView(300,'swing');
			setTimeout(function(){
				$element.focus();
			},300);
			event.preventDefault();
		} else if (key === 85 && event.ctrlKey){ // Ctrl + u
			event.preventDefault();
		}
		console.log("KEY: "+key);
	});
	// End KeyBinding Code
	
	// Rating Code
	$(".rating").on("mouseover",function(){
		var $element = $("#_media_"+app_vars.selected);
		$(this).prevAll().addClass("fa-star").removeClass("fa-star-o");
		$(this).addClass("fa-star").removeClass("fa-star-o");
		$(this).nextAll().addClass("fa-star-o").removeClass("fa-star");
	});
	
	$(".rating").on("mouseout",function(){
		rating = $("#_media_"+app_vars.selected).data().rating;
		set_rating(rating);
	});
	
	$(".rating").on("click",function(e){
		var $row   = $("#_media_"+app_vars.selected);
		var rating = parseInt($(this).index() + 1);
		var id     = $row.data().id;
		$row.data().rating = rating;
		$.ajax({
			url : "/xhr/set_rating",
			data: {
				rating: rating,
				id: id
			},
			dataType: "json",
			type: "get"
		}).done(function(response){
			console.log(response);
		}).fail(function(response){
			console.log(response);
		});
		item_selected($row);
		e.stopPropagation();
	});
	// End Rating Code
	
	// Volume slider Code
	$(".slider-pointer").on("mousedown",function(){
		$("body").on("mousemove",function(event){
			var slider = move_slider_pointer(event.pageX);
			var volume;
			if (slider.width !== 0 && slider.position !== 0){
				var volume = slider.position / slider.width;
			} else {
				var volume = 0;
			}
			if (!(volume > 1) && !(volume < 0)){
				player.volume = volume;
			}
			update_volume_icon(volume);
		})
	});
	
	$("body").on("mouseup",function(){
		$("body").off("mousemove");
	});
	
	$(".slider-line").on("click",function(event){
		var slider = move_slider_pointer(event.pageX);
		var volume;
		if (slider.position !== 0 && slider.width !== 0){
			volume = slider.position / slider.width;
		} else {
			volume = 0;
		}
		player.volume = volume;
		update_volume_icon(volume);
	});
	
	$("#add_to_queue").on("click",function(){
		if ($.inArray(app_vars.selected,app_vars.queue) === -1){
			app_vars.queue.push(app_vars.selected);
		}
		console.log(app_vars.queue);
	});
	
});
