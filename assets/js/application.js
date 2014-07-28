$(document).ready(function(){
	
    // Define default settings
	window.app_vars = {
		
		selected   : [],
        status     : 0,
		current    : undefined,
		queue      : [],
        shuffle    : false,
        loop       : false,
        contextbox : false,
        // items      : parseInt($(".item-row").length),
        playlists  : {
			"work" : []
		},
		history        : {
			items   : [], 
			pointer : -1
		},
		last_api_call : undefined,
		notification  : false,
		forwardrate   : 15,
		fastforward   : false,
		notification_duration: 12000,
		moving        : undefined,
		current_view  : "library_view",
		current_playlist : undefined,
		items         : {}
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
	    // Add a way of getting the index of the item
    $.fn.getId = function(){
		if ($(this).hasClass("item-row")){
			return parseInt($(this).data().id);
		} else {
			return undefined;
		}
	}
	
	$.fn.getIndex = function(){
		$this = $(this);
		if ($this.hasClass("item-row")){
			var id = $this.prop('id');
            return parseInt(id.substring(id.lastIndexOf("_") + 1));
		} else {
			return undefined;
		}
	}
	
    $("#playlist_list").slideUp();
    $(".slider-pointer").css({'left': (player.volume * ($(".slider-line").width() - 4)) });
    $("#library").css({"background":"ghostwhite"});
    $(".item-row").each(function(){
		$this = $(this);
		app_vars.items[$this.getIndex()] = $this.getId();
	});
    //chrome.notifications.create('item-play',{TemplateType:'basic',title:'now playing'});

    // Function Definitions
    var item_selected = function($elements){
        $(".item-row").removeClass("selected-row");
        app_vars.selected = [];
        
        $.each($elements,function(){
			$ele = $(this);
			if ($.inArray($ele.getIndex(),app_vars.selected) === -1){
				app_vars.selected.push($ele.getIndex());
			}
			if (!$ele.hasClass("selected-row")){
				$ele.addClass("selected-row");
			}
		});
		app_vars.selected.sort(function(a, b){return a-b});
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
		var item_index = $ele.getIndex();
		var item_id = app_vars.items[item_index];
		var trackname = $ele.find(".trackname span").text();
		var artistname = $ele.find(".artistname span").text();
		var $row_status = $ele.find(".row-status");
		$("#current_track").html("Playing: <b>"+trackname+" - "+artistname+"</b>");
		// Reset progress bar
		elements.$progress_bar.stop(true).animate({
			width: "0%"},500);
		elements.$track_pointer.stop(true).animate({
			left: "0%"},500);
		// Set current item variable
		app_vars.current = parseInt(item_index);
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
				id    : item_id
				},
			type: "get"
		}).done(function(data){
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
		var item_index = $ele.getIndex();
		var item_id = app_vars.items.item_index;
		app_vars.selected = [item_index];
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
		app_vars.status = 0;
        var title = undefined;
        var item_count;
        if (app_vars.current_view === "playlist_view"){
			item_count = sizeof(app_vars.playlists[app_vars.current_playlist]);
		} else if (app_vars.current_view === "library_view"){
			item_count = sizeof(app_vars.items);
		}
        if (app_vars.queue.length > 0){
			var next = app_vars.queue.shift();
			update_queue_count();
			$(".queue").find(".queue-itemcount").text("("+app_vars.queue.length+")");
			$element = $("#_media_"+next);
			title = item_clicked($element);
			$element.scrollIntoView();
		} else if (app_vars.loop === true){
            app_vars.status = 1;
            player.load();
        } else {
			if (app_vars.current === undefined){
				app_vars.current = -1;
			}
            if (app_vars.shuffle === false){
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
                var found = false;
                while(found === false){
                    var next = Math.floor(Math.random() * (item_count - 0 + 1)) + 0;
                    console.log(next);
                    if (next !== app_vars.current && $("#_media_"+next).length){
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
        }
	}
		
	var prev_item = function(){
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
                load_item($element);
            } else {
				if (app_vars.history.pointer > 0){
					app_vars.history.pointer--;
					load_item($("#_media_"+app_vars.history.items[app_vars.history.pointer]));
				} else {
					if (app_vars.history.pointer === 0 && app_vars.history.items.length > 0){
						app_vars.history.items = [];
					}
					next_item();
				}
			}
		}
	}
		
	var load_cover_art = function(){
		if (typeof $coverart_request !== 'undefined'){
			console.log("aborted");
			$coverart_request.abort();
		}
		$coverart_request = $.ajax({
			"url"  : "xhr/get_cover_art",
			"data" : {
				id : app_vars.items[$("#_media_"+app_vars.current).getIndex()]
				},
			"type" : "get",
			"dataType": "json"
		}).done(function(data){
			$("#cover_art_image").attr("src",data.url);
		}).always(function(){
			$coverart_request = undefined;
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
			{ width: "100%" }, ((player.duration - player.currentTime) * 1000) / rate,"linear"
		);
		elements.$track_pointer.stop(true).animate({ 
			left: "100%" }, ((player.duration - player.currentTime) * 1000) / rate,"linear"
		);
	}
	
	var switch_view = function(to, callback, $menuitem){
		if (app_vars.current_view !== to){
			$(".item-row").hide();
			if (typeof callback === "function"){
				callback.call();
			}
			$(".sidebar-row").css({"background":"#DCE8EC"});
			$menuitem.css({"background":"ghostwhite"});
		}
		item_selected([]);
	}
    
    var add_to_queue = function(){
		for (var c = 0; c < app_vars.selected.length; c++){
			if ($.inArray(app_vars.selected[c],app_vars.queue) === -1){
				app_vars.queue.push(app_vars.selected[c]);
			}
		}
		$(".queue").find(".queue-itemcount").text("("+app_vars.queue.length+")");
	}
	
	var update_queue_count = function(){
		$(".queue").find(".queue-item-count").text("("+app_vars.queue.length+")");
	}
	
	var update_playlist_count = function(playlist){
		$(".playlist").filter(function(){
			console.log($(this).data('playlistname'),playlist)
			return ($(this).data('playlistname') === playlist);
		})
		.find(".playlist-item-count").text("("+app_vars.playlists[playlist].length+")");
	}
    
    var sizeof = function(obj){
		var count = 0;
		for (i in obj){
			count++;
		}
		return count;
	}
    
    sort_items = function(by, asc){
		$items = $(".item-row");
		$item_container = $(".items-container");
		
		$items.sort(function(a,b){
		    var an = $(a).find("."+by).text().toLowerCase();
		    var bn = $(b).find("."+by).text().toLowerCase();
		    if (an > bn){
		        return (asc) ? 1 : -1;
		    }
		    if (an < bn){
		        return (asc) ? -1 : 1;
		    }
		    return 0;
		});
		
		$items.detach().appendTo($item_container);
	}
    
    // End of functions
    
    // --------------------------
    // Event Handlers
	// --------------------------
	$(".item-row")
	.on("dblclick",function(){
		item_clicked($(this));
	})
	.on("mouseup",function(event){
		var menu_on = ($("#contextmenu").css("display") !== "none");
		var $row = $(this);
		// right click
		if (event.which === 3){	
			// if menu is already visible hide it and return
			if (menu_on){
				hide_menu();
				return;
			}
			if ($.inArray($row.getIndex(),app_vars.selected) === -1){
				item_selected([$row]);
			} else {
				// nothing
			}
			if (app_vars.selected.length > 1){
				set_rating(0);
			} else {
				set_rating($row.data().rating);
			}
			show_menu();
			event.preventDefault();
		} else {
			// left click
			if (event.which === 1){
				// with shift key
				if (event.shiftKey){
					// multi select items
					var low, high, items = [];
					var num_selected = app_vars.selected.length;
					var min_selected = app_vars.selected[0];
					var max_selected = app_vars.selected[num_selected-1];
					var new_selected = $row.getIndex();
					if (new_selected > max_selected){
						low = min_selected;
						high = new_selected;
						app_vars.high_last_multi_sel = true;
					} else if (new_selected < min_selected){
						low = new_selected;
						high = max_selected;
						app_vars.high_last_multi_sel = false;
					} else if (app_vars.high_last_multi_sel){
						low = min_selected;
						high = new_selected;
						app_vars.high_last_multi_sel = true;
					} else {
						low = new_selected;
						high = max_selected;
						app_vars.high_last_multi_sel = false;
					}
					for (var c = low; c <= high; c++){
						items.push($("#_media_"+c));
					}
					item_selected(items);
				// with ctrl key
				} else if (event.ctrlKey){
					var item_ids = app_vars.selected;
					console.log("old_array");
					console.log(item_ids);
					var $items = [];
					var index = $row.getIndex();
					console.log("index: "+index);
					if ($.inArray(index,item_ids) !== -1){
						var array_index = item_ids.indexOf(index);
						item_ids.splice(array_index, 1);
					} else {
						item_ids.push(index);
					}
					console.log("new array");
					console.log(item_ids);
					for (var c = 0; c < item_ids.length; c++){
						$items.push($("#_media_"+app_vars.selected[c]));
					}
					item_selected($items);
				} else {
					item_selected([$row]);
                }
                event.preventDefault();
			} else {
                //event.preventDefault();
            }
			$("#contextmenu").fadeOut("200");
			$("#playlist_list").slideUp();
			app_vars.contextbox = false;
		}
	})
	.on("dragstart",function(e){
		if ($(this).hasClass("selected-row")){
			app_vars.moving = app_vars.selected;
		} else {
			app_vars.moving = [$(this).getIndex()];
		}
	})
	.on("dragend",function(e){
		//console.log(e);
	});
	
	
	// ContextMenu Code
	$(".items-container , #contextmenu").on("contextmenu",function(){
        return false;
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
        $filter = $(this);
        var query = $filter.val().toLowerCase();
        if (e.keyCode === 27){
			$filter.blur();
			return;
		}
        if (query.length > 2){
            $(".item-row").each(function(){
                //$element = $filter;
                $element = $(this);
                if ($element.find(".trackname").text().toLowerCase().indexOf(query) !== -1){
                    $element.show();
                } else if ($element.find(".artistname").text().toLowerCase().indexOf(query) !== -1){
                    $element.show();
                } else if ($element.find(".albumname").text().toLowerCase().indexOf(query) !== -1){
                    $element.show();
                } else {
                    $element.hide();
                }
            });         
        } else {
            $(".item-row").show();
        }
    });
    // End Search code
    
    $(player)
    .on("ended stalled",function(){
        next_item();
    })
    .on("ended", function(){
		$.ajax({
			url : "xhr/played",
			data: {
				id: app_vars.items[$("#_media_"+app_vars.current).getIndex()]
			},
			type: "get"
		}).done(function(e){
			console.log(e);
		});
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
		prev_item();
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
	
	elements.$control_next
	.on("mousedown",function(){
		if (app_vars.status === 1){
			fastforward_time_id = setTimeout(function(){
				app_vars.fastforward = true;
				set_rate(app_vars.forwardrate);
			},200);
		}
	})
	.on("mouseup",function(e){
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
	
	// KeyBinding Code
	$(document)
	.on("keydown",function(event) {
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
		} else if (key === 65 && event.ctrlKey){
			item_selected($(".item-row"));
		}
		console.log("KEY: "+key);
	})
	.on("keyup",function(event){

	});
	
	// End KeyBinding Code
	
	// Rating Code
	$(".rating")
	.on("mouseover",function(){
		$(this).prevAll().addClass("fa-star").removeClass("fa-star-o");
		$(this).addClass("fa-star").removeClass("fa-star-o");
		$(this).nextAll().addClass("fa-star-o").removeClass("fa-star");
	})
	.on("mouseout",function(){	
		rating = $("#_media_"+app_vars.selected[0]).data().rating;
		set_rating(rating);
	})
	.on("click",function(e){
		var rating = parseInt($(this).index() + 1);
		var $row, id = [];
		if (app_vars.selected.length > 1){
			for (var c = 0; c < app_vars.selected.length; c++){
				$row = $("#_media_"+app_vars.selected[c]);
				id.push(app_vars.items[$row.getIndex()]);
				$row.data().rating = rating;
			}
		} else {
			var $row   = $("#_media_"+app_vars.selected[0]);
			var id     = [app_vars.items[$row.getIndex()]];
			$row.data().rating = rating;
		}
		$.ajax({
			url : "/xhr/set_rating",
			data: {
				"rating": rating,
				"ids": JSON.stringify(id)
			},
			dataType: "json",
			type: "get"
		}).done(function(response){
			console.log(response);
		}).fail(function(obj){
			console.log(obj);
		});
		//item_selected($row);
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
		add_to_queue();
	});
	
	$(".playlist")
	.on("drop",function(e){
		var playlist = $(e.target).data().playlistname;
		console.log("adding to :"+playlist);
		for (var c = 0;c < app_vars.moving.length; c++){
			if ($.inArray(app_vars.moving[c],app_vars.playlists[playlist]) === -1){	
				$(this).data().itemcount += 1
				app_vars.playlists[playlist].unshift(app_vars.moving[c]);
				// ajax code
				//console.log("item added to "+playlist);
			} else {
				//console.log("item already in playlist");
			}
		}
		update_playlist_count(playlist);
		app_vars.moving = undefined;
	})
	.on("dragover",function(e){
		e.preventDefault()
	})
	.on("click",function(){
		var playlist = $(this).data().playlistname;
		switch_view("playlist",function(){
			for (var c = 0; c < app_vars.playlists[playlist].length; c++){
				console.log("adding: "+app_vars.playlists[playlist][c]);
				console.log($("#library_view > div > #_media_"+app_vars.playlists[playlist][c]));
				$("#_media_"+app_vars.playlists[playlist][c]).show().addClass("playlist-item");
			}
		},$(this));
		app_vars.current_playlist = playlist;
		app_vars.current_view = "playlist_view";
	});
	
	$(".queue")
	.on("drop",function(e){
		console.log("adding to queue");
		for (var c = 0;c < app_vars.moving.length; c++){
			if ($.inArray(app_vars.moving[c],app_vars.queue) === -1){	
				app_vars.queue.unshift(app_vars.moving[c]);
				// ajax code
				console.log("item added to queue: "+app_vars.moving[c]);
			} else {
				//console.log("item already in playlist");
			}
		}
		update_queue_count();
		app_vars.moving = undefined;
	})
	.on("dragover",function(e){
		e.preventDefault()
	})
	.on("click",function(){
		switch_view("queue",function(){
			for (var c = 0; c < app_vars.queue.length; c++){
				$("#_media_"+app_vars.queue[c]).show().addClass("playlist-item");
			}
		},$(this));
		app_vars.current_view = "queue_view";
	});
	
	$("#library").on("click",function(e){
		switch_view("library_view",function(){
			$(".item-row").show();
		},$(this));	
		app_vars.current_view = "library_view";
	});
	
	
	
});
