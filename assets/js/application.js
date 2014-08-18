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
        playlists  : {},
        history        : {
            items   : [],
            pointer : -1
        },
        last_api_call : undefined,
        forwardrate   : 15,
        fastforward   : false,
        moving        : undefined,
        current_view  : "library_view",
        playing_view  : "library_view",
        current_playlist : undefined,
        item_ids      : [],
        sort          : {
            order: 1,
            by: undefined
        },
        results       : [],
        downloads     : [],
        preview : {
            on: false,
            id : undefined
        },
        default_engine: 'mp3li'
    };

    window.elements = {
        $progress_bar      : $("#progress_bar"),
        $track_pointer     : $("#track_pointer"),
        $control_playpause : $("#control_playpause"),
        $control_next      : $("#control_next"),
        $control_prev      : $("#control_prev"),
        $library_view      : $("#library_view")
    };

    // Cache the player element...
    window.player = document.getElementById("_player");

    window.MediaObject = function(opts){
        var self = this;
        return {
            opts: opts,
            url: function(){
                return opts.Filename.replace("/var/www/player",window.location.origin+"/player");
            },
            play: function(){
                // make sure we reset any playing previews
                $(".preview-button").text("Preview");
                app_vars.preview.on = false;
                var $ele = opts.$element;
                // set some vars
                var trackname = $ele.find(".trackname span").text();
                var artistname = $ele.find(".artistname span").text();
                console.debug("loading '"+artistname+" - "+trackname+"'");
                var $row_status = $ele.find(".row-status");
                // change the current track text
                set_current_track_text("Playing: <b>"+trackname+" - "+artistname+"</b>");
                // set current item variable
                app_vars.current = parseInt(opts.ID);
                // remove all item status icons
                $(".item-row .row-status").removeClass("fa-pause fa-play");
                // set the current item status icon to pause icon
                $row_status.removeClass("fa-play");
                $row_status.addClass("fa-pause");
                play_item(
                    this.url()
                );
                load_cover_art();
            },
            pause: function(){
                // get the current element
                var $ele = opts.$element;
                var $row_status = $ele.find(".row-status");
                // set element status icon to play icon
                $row_status.removeClass("fa-pause");
                $row_status.addClass("fa-play");
                // set player play/pause button to play icon
                var $playpause_button_icon = elements.$control_playpause.find(".fa");
                $playpause_button_icon.removeClass("fa-pause");
                $playpause_button_icon.addClass("fa-play");
                // pause the player
                player.pause();
                // stop the progress bar
                elements.$progress_bar.stop(true);
                elements.$track_pointer.stop(true);
                // set status to 0 (paused/stopped)
                app_vars.status = 0;
            },
            click: function(){
                var $ele = opts.$element;
                app_vars.selected = [opts.ID];
                // if we clicked the current playing item, pause the player
                if (app_vars.current === opts.ID && app_vars.status === 1){
                    media_objects[app_vars.current].pause();
                // if we clicked the current paused item resume the player
                } else if (app_vars.current === opts.ID){
                    resume_item();
                // else load the new item
                } else {
                    media_objects[opts.ID].play();
                }
                // scroll the element into view
                $ele.scrollIntoView();
                return true;
            }
        };
    };

    window.media_objects = {};

    // Do setup stuff
    $.fn.getId = function(){
        var $this = $(this);
        if ($this.hasClass("item-row") || $this.hasClass("result-row")){
            var id = $this.prop('id');
            return parseInt(id.substring(id.lastIndexOf("_") + 1));
        }
        else {
            return undefined;
        }
    };

    // Function Definitions
    var set_item_objs = function(){
        $.ajax({
            url: "xhr/get_items",
            dataType: "json",
            type: "get"
        })
        .done(function(items){
            var $library_view_inner = elements.$library_view.find("div");
            $.each(items,function(index,$item){
                // var $item = $(this);
                console.log($item);
                $element = add_item_to_library($item, index);
                if ($element !== undefined){
                    $element.appendTo($library_view_inner);
                    app_vars.item_ids.push($item.ID);
                    // Add a hard link to the jQuery element to the item object
                    $item.$element = $element;
                    media_objects[$item.ID] = MediaObject($item);
                }
                // media_objects[$item.ID].url();
            });
            add_item_row_listeners();
        });
    };

    var add_item_to_library = function($item, index){
        if ($item.ID === undefined || $item.ID === null){
            return undefined;
        }
        return $("<div></div>")
        .addClass("row item-row")
        .attr({
            'draggable'   : true,
            'data-rating' : $item.Rating,
            'data-index'  : index,
            'id'          : "_media_"+$item.ID
        })
        .append($("<div></div>")
            .addClass("col-xs-1 col-md-1 row-status-container")
            .append($("<i></i>")
                .addClass("row-status fa")
            )
        )
        .append($("<div></div>")
            .addClass("col-xs-3 col-md-3 trackname")
            .attr({
                title:$item.TrackName
            })
            .append($("<span></span>")
                .text($item.TrackName)
            )
        )
        .append($("<div></div>")
            .addClass("col-xs-3 col-md-3 artistname")
            .attr({
                title:$item.ArtistName
            })
            .append($("<span></span>")
                .text($item.ArtistName)
            )
        )
        .append($("<div></div>")
            .addClass("col-xs-3 col-md-3 albumname")
            .attr({
                title:$item.AlbumName
            })
            .append($("<span></span>")
                .text($item.AlbumName)
            )
        )
        .append($("<div></div>")
            .addClass("col-xs-1 col-md-1 plays")
            .attr({
                title:$item.Plays
            })
            .append($("<span></span>")
                .text($item.Plays)
            )
        );       
    };

    var set_playlists = function(){
        $.ajax({
            url: "xhr/get_playlists",
            dataType: "json",
            type: "get"
        })
        .done(function(items){
            $.each(items,function(index,value){
                app_vars.playlists[index.toLowerCase()] = value;
                $("<div></div>")
                    .addClass("sidebar-row playlist")
                    .attr({
                        "data-playlistname":index.toLowerCase()
                    })
                    .append($("<span></span>")
                        .text(index.toUpperCase()+" PLAYLIST")
                    )
                    .append($("<span></span>")
                        .addClass("playlist-item-count")
                        .css({
                            "text-align":"right"
                        })
                        .text(" ("+value.length+")")
                    )
                .insertAfter($("#queue_sidebar_row"));
            });
            add_playlist_listeners();
        });
    };

    var item_selected = function(items){
        var classname = get_row_classname();
        if (typeof items !== 'object'){
            throw new Error("item_selected() expects an array, "+(typeof items)+" given");
        }
        console.debug("items selected: ("+items.length+")");
        // unselect previously selected items
        $("."+classname).removeClass("selected-row");
        app_vars.selected = [];
        // add items to the selected array
        $.each(items,function(){
            if (typeof this !== 'number' && !(this instanceof Number)){
                throw new Error("item_selected() expects an array of integers, element of type "+(typeof items)+" given in array");
            }
            var $ele = get_item_element_by_id(this);
            // check if this item is already in the selected array
            if ($.inArray(parseInt(this),app_vars.selected) === -1){
                app_vars.selected.push(parseInt(this));
                $ele.addClass("selected-row");
            }
        });
        // sort the selected array by id smallest to largest
        app_vars.selected.sort(function(a, b){return a-b;});
    };

    var resume_item = function(){
        if (app_vars.current === 'undefined'){
            throw new Error('app_vars.current must not be undefined when resume_item is called');
        }
        // get the current element
        var $ele = get_item_element_by_id(app_vars.current);
        if (typeof $ele !== 'object'){
            throw new Error('Failed to get element by id: '+app_vars.current);
        }
        var $row_status = $ele.find(".row-status");
        // set element status icon to pause icon
        $row_status.removeClass("fa-play");
        $row_status.addClass("fa-pause");
        // set player play/pause button to pause icon
        var $playpause_button = elements.$control_playpause.find(".fa");
        $playpause_button.removeClass("fa-play");
        $playpause_button.addClass("fa-pause");
        // resume the player
        player.play();
        // resume the progress bar
        //$(player).on("play",function(){
            //elements.$progress_bar.animate(
                //{ width: "100%" }, parseInt(player.duration - player.currentTime)*1000,"linear"
            //);
        //});
        start_seeker();
        // set status to 1 (playing)
        app_vars.status = 1;
    };

    var pause_item = function(){
        // get the current element
        var $ele = get_item_element_by_id(app_vars.current);
        var $row_status = $ele.find(".row-status");
        // set element status icon to play icon
        $row_status.removeClass("fa-pause");
        $row_status.addClass("fa-play");
        // set player play/pause button to play icon
        var $playpause_button = elements.$control_playpause.find(".fa");
        $playpause_button.removeClass("fa-pause");
        $playpause_button.addClass("fa-play");
        // pause the player
        player.pause();
        // stop the progress bar
        elements.$progress_bar.stop(true);
        elements.$track_pointer.stop(true);
        // set status to 0 (paused/stopped)
        app_vars.status = 0;
    };

    var play_item = function(link){
        console.debug("loading remote media: "+link);
        // set player source
        $("#_player > source").prop({
            "src" :link,
            "type":"audio/mpeg"
        });
        // set player play/pause button to pause icon
        var $playpause_button = elements.$control_playpause.find(".fa");
        $playpause_button.removeClass("fa-play");
        $playpause_button.addClass("fa-pause");
        // reset the seeker
        reset_seeker();
        // initialise the player
        player.load();
        // start seeker animation
        start_seeker();
        // set status to 1 (playing)
        app_vars.status = 1;
    };

    var start_seeker = function(){
        // resume/start the progress bar
        $(player).on("play",function(){
            elements.$progress_bar.animate({
                width: "100%"},(player.duration - player.currentTime)*1000,"linear"
            );
            elements.$track_pointer.animate({
                left: "100%"},(player.duration - player.currentTime)*1000,"linear"
            );
        });
    };

    var reset_seeker = function(){
        // set the progress bar to its initial position
        elements.$progress_bar.stop(true).animate({
            width: "0%"},500);
        elements.$track_pointer.stop(true).animate({
            left: "0%"},500);
    };

    var set_current_track_text = function(text){
        // change the current track text
        $("#current_track").html(text);
    };

    var get_item_element_by_index = function(index){
        return $(".item-row").eq(index);
    };

    var get_item_element_by_id = function(id){
        // return the jQuery element based on id
        return $("#_media_"+id);
    };

    var get_item_index_by_id = function(id){
        if (id === undefined){
            throw new Error('id must not be undefined in get_item_index_by_id(id)');
        }
        return app_vars.item_ids.indexOf(id);
    };

    var get_next_id_in_order = function(id){
        if (id === undefined){
            throw new Error('id must not be undefined in get_next_id_in_order(id)');
        }
        var $ele = get_item_element_by_id(id);
        if ($ele !== undefined){
            return $ele.next().getId();
        }
        return get_first_id_in_order();
    };

    var get_first_id_in_order = function(){
        return $(".item-row").first().getId();
    };

    var get_last_id_in_order = function(){
        return $(".item-row").last().getId();
    };

    var get_prev_id_in_order = function(){
        var $ele = get_item_element_by_id(id);
        var $next_ele = $ele.prev();
        if ($next_ele !== undefined){
            return $next_ele.getId();
        }
        return get_last_id_in_order();
    };

    var next_item = function(){
        app_vars.status = 0;
        var title, next, item_id, $element;
        if (app_vars.playing_view !== "library_view"){
            return;
        }
        // Check if there are items in the queue
        if (app_vars.queue.length > 0){
            next = app_vars.queue.shift();
            update_queue_count();
            $(".queue").find(".queue-itemcount").text("("+app_vars.queue.length+")");
            $element = $("#_media_"+next);
            item_id = app_vars.item_ids[next];
            media_objects[item_id].click();
            // title = item_clicked(item_id);
            $element.scrollIntoView();
        }
        // check if repeat is set
        else if (app_vars.loop === true){
            if (app_vars.current === undefined){
                next = get_first_id_in_order();
            }
            else {
                next = app_vars.current;
            }
            media_objects[next].play();
        } 
        // else get next item
        else {
            // linear progression
            if (app_vars.shuffle === false){
                if (app_vars.current === undefined){
                    next = get_first_id_in_order();
                } else {
                    console.debug("current id : "+app_vars.current);
                    next = get_next_id_in_order(app_vars.current);
                }

                if (get_item_element_by_id(next) !== undefined){
                    item_id = next;
                } else {
                    item_id = get_first_id_in_order();
                }
                console.debug("next item id : "+item_id);
                $element = get_item_element_by_id(item_id);
                media_objects[item_id].click();
                // item_clicked(item_id);
                $element.scrollIntoView();
            } 
            // get random next item
            else {
                var found = false;
                while(found === false){
                    next_index = Math.floor(Math.random() * (app_vars.item_ids.length - 0 + 1)) + 0;
                    next = $(".item-row").eq(next_index).getId();
                    if (next !== undefined && next !== app_vars.current){
                        found = true;
                        // Add to player history
                        app_vars.history.items.push(next);
                        app_vars.history.pointer++;
                        media_objects[next].click();
                        // title = item_clicked(next);
                        $element = get_item_element_by_id(next);
                        $element.scrollIntoView();
                        console.debug("POINTER:"+app_vars.history.pointer);
                        console.debug(app_vars.history.items);
                    }
                }
            }
        }
    };

    var prev_item = function(){
        var next_id;
        if (app_vars.current === undefined){
            next_id = get_first_id_in_order();
            media_objects[next_id].click();
            // item_clicked(get_first_id_in_order());
            return;
        }
        if (player.currentTime > 3 || app_vars.loop === true){
            next_id = app_vars.current;
            media_objects[next_id].play();
        }
        else {
            if (app_vars.shuffle === false){
                var prev = get_item_index_by_id(app_vars.current) - 1;
                if (prev >= 0){
                    next_id = app_vars.item_ids[prev];
                } else {
                    next_id = app_vars.item_ids[app_vars.item_ids.length - 1];
                }
                media_objects[next_id].click();
                // item_clicked(next_id);
            } else {
                console.debug("POINTER:"+app_vars.history.pointer);
                console.debug(app_vars.history.items);
                if (app_vars.history.pointer > 0 && app_vars.history.items[app_vars.history.pointer] !== app_vars.current){
                    app_vars.history.pointer--;
                    next_id = app_vars.history.items[app_vars.history.pointer];
                    media_objects[next_id].click();
                    // item_clicked(next_id);
                } else {
                    if (app_vars.history.pointer === 0 && app_vars.history.items.length > 0){
                        app_vars.history.items = [];
                    }
                    next_item();
                }
            }
        }
        next_id = undefined;
    };

    var load_cover_art = function(){
        if (typeof $coverart_request !== 'undefined'){
            console.debug("aborted");
            $coverart_request.abort();
        }
        $coverart_request = $.ajax({
            url  : "xhr/get_cover_art",
            data : {
                id : app_vars.current
            },
            type : "get",
            dataType: "json"
        }).done(function(data){
            $("#cover_art_image").attr("src",data.url);
        }).always(function(){
            $coverart_request = undefined;
        });
    };

    var save_cover_art = function(){
    };

    var hide_menu = function(){
        $("#contextmenu").hide();
        $("#playlist_list").slideUp();
        app_vars.contextbox = false;
        return;
    };

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
    };

    var set_rating = function(rating){
        var $element;
        var $elements = $("#rating_container").children();
        if (rating === 0){
            $elements.addClass("fa-star-o").removeClass("fa-star");
        } else {
            $element = $elements.eq(rating).addClass("fa-star-o").removeClass("fa-star");
            $element.prevAll().addClass("fa-star").removeClass("fa-star-o");
            $element.nextAll().addClass("fa-star-o").removeClass("fa-star");
        }
    };

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
    };

    var update_volume_icon = function(volume){
        var volume_icon = $("#volume_icon");
        if (volume === 0){
            volume_icon.attr('class','fa fa-volume-off');
        } else if (volume < 0.4){
            volume_icon.attr('class','fa fa-volume-down');
        } else {
            volume_icon.attr('class','fa fa-volume-up');
        }
    };

    var set_rate = function(rate){
        player.playbackRate = rate;
        elements.$progress_bar.stop(true).animate(
            { width: "100%" }, ((player.duration - player.currentTime) * 1000) / rate,"linear"
        );
        elements.$track_pointer.stop(true).animate({
            left: "100%" }, ((player.duration - player.currentTime) * 1000) / rate,"linear"
        );
    };

    var switch_view = function(to, callback, $menuitem){
        if (app_vars.current_view !== to){
            //$(".item-row").hide();
            if (typeof callback === "function"){
                callback.call();
            }
            $(".sidebar-row").css({"background":"#DCE8EC"});
            $menuitem.css({"background":"ghostwhite"});
            app_vars.current_view = to;
        }
        item_selected([]);
    };

    var add_to_queue = function(){
        for (var c = 0; c < app_vars.selected.length; c++){
            if ($.inArray(app_vars.selected[c],app_vars.queue) === -1){
                app_vars.queue.push(app_vars.selected[c]);
            }
        }
        $(".queue").find(".queue-itemcount").text("("+app_vars.queue.length+")");
    };

    var update_queue_count = function(){
        $("#queue_sidebar_row").find(".queue-item-count").text("("+app_vars.queue.length+")");
    };

    var update_playlist_count = function(playlist){
        $(".playlist").filter(function(){
            console.debug($(this).data('playlistname'),playlist);
            return ($(this).data('playlistname') === playlist);
        })
        .find(".playlist-item-count").text("("+app_vars.playlists[playlist].length+")");
    };

    var sort_items = function(by, asc){
        var $items = $(".item-row");
        var $item_container = $(".items-container");

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
    };

    var hash = function(len){
        var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var str = "";
        for (var i = 0; i < len; i++){
            var pos = Math.floor(Math.random() * chars.length);
            str += chars.substring(pos, pos+1);
        }
        return str;
    };

    var download_item = function(id){
        console.debug("downloading item ("+id+")");
        var $result;
        var $download;
        $result = $(".result-row").filter(function(index){
            return (id === $(this).data('id'));
        }).first();

        if (!$result.length){
            // throw new Error('Failed to find the result row');
        }

        var $result_button = $result.find(".download-button");

        if (!$result_button.length){
            // throw new Error('Failed to find the result download button');
        }

        $download = $(".download-row").filter(function(index){
            return id === $(this).data('id');
        }).first();

        // if we don't already have a download element in the view, create one
        if (!$download.length){
            // Detach this item (maybe we should clone it?) and add it to the downloads view
            $download = $result.clone(true,true)
                .prependTo("#downloads_view > div")
                .addClass("download-row")
                .removeClass("result-row");

            // remove the preview button
            $download.find(".preview-button")
                .remove();
        }

        if (!$download.length){
            throw new Error('Failed to find the download row');
        }
        console.log($download);
        var $download_button = $download.find(".download-button");

        if (!$download_button.length){
            throw new Error('could not find download button');
        }

        // Make sure this download isn't in the queue already
        if ($.inArray($download.data('id'),app_vars.downloads) === -1){
            app_vars.downloads.push($download.data('id'));
			// Mark the number of items in the downloads view
	        $("#downloads_item_count").text("("+$(".download-row").length+")");
	        // Disable the download buttons
	        $result_button.prop('disabled',true);
	        $download_button.prop('disabled',true);
        }
        else {
            // throw new Error('Item already in the download queue.');
        }

        // If there is more than one item in the download queue AND this isn't the next in the queue
        // then we should add this to the end of the queue
        if (app_vars.downloads.length > 1 && $.inArray($download.data('id'),app_vars.downloads) !== 0){
            console.debug('item queued :'+$download.data('id'));
            $download_button.text('Queued');
            return;
        }
        // Otherwise start the download
        else {
            console.debug('download started :'+$download.data('id'));
            $download_button.prop('disabled',true);
            $download_button.text('Downloading (0%)');
        }
        console.debug("Fetching "+$result.data('href')+" using "+$result.data('engine')+" engine");
        $.ajax({
            url  : "xhr/download_item",
            data : {
                href   : $result.data('href'),
                engine : $result.data('engine'),
                title  : $result.find('.resultname > span').text()
            },
            type : "get",
            xhrFields: {
                onprogress: function (e) {
                    var response = e.currentTarget.response;
                    var progress = 0;
                    response = response.substring(response.lastIndexOf('|') + 1);
                    if (response === ""){
                        progress = 0;
                    }
                    else {
						var json_response = JSON.parse(response);
						if (typeof json_response === 'object'){
							progress = json_response.progress;
						}
						else {
							progress = "?";
						}
					}
                    $download_button.text('Downloading ('+progress+'%)');
                }
            }
        })
        .fail(function(){
            $result_button.html("")
                .append($('<i></i>')
                .addClass('fa fa-warning')
                .css({"line-height": "8px"})
            );
            $download_button.html("")
                .append($('<i></i>')
                .addClass('fa fa-warning')
                .css({"line-height": "8px"})
            );
            $result_button.prop('disabled',false);
            $download_button.prop('disabled',false);
        })
        .done(function(response){
            console.log(response);
            response = response.substring(response.lastIndexOf('|') + 1);
            var message = '';
            if (response === "" || response === undefined){
				message = 'no data recieved';
			}
			else {
				var json_response = JSON.parse(response);
				if (typeof json_response === 'object'){
					if (json_response.error === true){
						message = json_response.message;
					}
				}
				else {
					message = 'malformed data recieved';
				}
			}
			if (message === ''){
				$download_button.html("")
				.append($('<i></i>')
					.addClass('fa fa-check')
					.css({"line-height": "7px"})
				);
				$download_button.prop('disabled',true);
			}
			else {
				$result_button.html("")
	                .append($('<i></i>')
	                .addClass('fa fa-warning')
	                .css({"line-height": "8px"})
	                .attr({title:message})
	            );
	            $download_button.html("")
	                .append($('<i></i>')
	                .addClass('fa fa-warning')
	                .css({"line-height": "8px"})
	                .attr({title:message})
	            );
	            $result_button.prop('disabled',false);
	            $download_button.prop('disabled',false);
	            console.warn(message);
			}
        })
        .always(function(){
			app_vars.downloads.shift();
            if (app_vars.downloads.length){
                console.debug("download queue:",app_vars.downloads);
                console.debug("next download in queue: "+app_vars.downloads[0]);
                download_item(app_vars.downloads[0]);
            }
            else {
                console.debug("end of download queue.");
            }
        });
    };

    var preview_item = function(id){
        if (id === undefined){
            throw new Error('id must not be undefined in preview_item(id) function');
        }

        var $result;
        var $preview_button;

        $result = $(".result-row").filter(function(index){
            return (id === $(this).data('id'));
        }).first();

        if (!$result.length){
            throw new Error('Failed to find the result row');
        }

        $preview_button = $result.find(".preview-button");

        console.debug(app_vars.preview);

        if (app_vars.preview.on && $result.data("id") === app_vars.preview.id){
            pause_preview();
            return;
        }
        if (!app_vars.preview.on && $result.data("id") === app_vars.preview.id){
            app_vars.preview.on = true;
            resume_item();
            $preview_button.text("Pause");
            return;
        }
        $(".preview-button").text("Preview");
        // Reset the progress bar
        reset_seeker();
        if (app_vars.current !== undefined){
            media_objects[app_vars.current].pause();
        }
        // Start preview code
        app_vars.preview = {
            on : false,
            id : undefined
        };
        console.debug("Previewing "+$result.data('href')+" using "+$result.data('engine')+" engine");
        $.ajax({
            url  : "xhr/preview_item",
            data : {
                href   : $result.data('href'),
                engine : $result.data('engine')
            },
            type : "get"
        })
        .fail(function(){
            console.warn("failed to get preview link.");
            $preview_button.text('Failed');
        })
        .done(function(link){
            play_item(link);
            app_vars.preview.on = true;
            app_vars.preview.id = $result.data('id');
            $preview_button.text("Pause");
        });
    };

    var pause_preview = function(){
        media_objects[app_vars.current].pause();
        app_vars.preview = {
            on : false,
            id : undefined
        };
        $(".preview-button").text("Preview");
    };

    var add_result_listeners = function(){
        $(".download-button").on("click",function(){
            download_item($(this).data("id"));
        });
        $(".preview-button").on("click",function(){
            preview_item($(this).closest('.result-row').data('id'));
        });
    };

    var get_row_classname = function(){
        var classname;
        if (app_vars.current_view === "library_view"){
            classname = "item-row";
        }
        else if (app_vars.current_view === "downloads_view"){
            classname = "download-row";
        }
        else if (app_vars.current_view === "results_view"){
            classname = "result-row";
        }
        return classname;
    };

    var get_files = function(query,callback){
        if (typeof $search_request !== 'undefined'){
            console.debug("aborted");
            $search_request.abort();
        }
        if ($(".download-row").length){
            $(".download-row").each(function(){
                $(this).data({'id':undefined});
            });
        }
        $search_request = $.ajax({
            "url"  : "xhr/query_songs",
            "data" : {
                query : query,
                engine: app_vars.default_engine
                },
            "type" : "get",
            "dataType": "json"
        })
        .done(function(response){
            $("#search_view .result-row").remove();
            if (response.error === true){
                alert(response.message);
            }
            else if (response.data !== undefined){
                var downloads_count = $(".download-row").length;
                var rand = hash(6);
                for(var c = 0; c < response.data.length; c++){
                    console.debug(response.data[c].title);
                    $("<div></div>")
                        .hide()
                        .addClass("row result-row")
                        .attr({
                            'data-engine' : response.data[c].engine,
                            'data-href'   : response.data[c].href
                        })
                        .data({id:rand+"_"+c})
                        .append($("<div></div>")
                            .addClass("col-xs-1 col-md-1 resultstatus")
                        )
                        .append($("<div></div>")
                            .attr({ title : response.data[c].title })
                            .addClass("col-xs-7 col-md-7 resultname")
                            .append($("<span></span>")
                                .text(response.data[c].title)
                            )
                        )
                        .append($("<div></div>")
                            .addClass("col-xs-4 col-md-4 resultactions")
                            .append($("<button></button>")
                                .addClass("btn btn-default download-button")
                                .data({id:rand+"_"+c})
                                .append($("<i></i>")
                                    .addClass("fa fa-download")
                                    .css({"line-height": "8px"})
                                )
                                //.text("Download")
                            )
                            .append($("<button></button>")
                                .addClass("btn btn-default preview-button")
                                .text("Preview")
                            )
                        )
                        .appendTo("#search_view > div");
                }
                add_result_listeners();
                $(".result-row").fadeIn(200);
            }
        })
        .fail(function(){
            // failed
        })
        .always(function(data){
            if (typeof callback === "function"){
                callback.call();
            }
            $search_request = undefined;
            //console.debug(data);
        });
    };

    var add_item_row_listeners = function(){
        $(".item-row")
        .on("dblclick",function(){
            media_objects[$(this).getId()].click();
            // item_clicked($(this).getId());
        })
        .on("mouseup",function(event){
            var menu_on = ($("#contextmenu").css("display") !== "none");
            var $row = $(this);
            // right click (open/close menu)
            if (event.which === 3){
                // if menu is already visible hide it and return
                if (menu_on){
                    hide_menu();
                    return;
                }
                if ($.inArray($row.getId(),app_vars.selected) === -1){
                    item_selected([$row.getId()]);
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
            }
            // left click (selected item)
            else {
                var classname = get_row_classname();
                if (event.which === 1){
                    var c;
                    var $items = [];
                    // with shift key
                    if (event.shiftKey){
                        // multi select items
                        var items = [];
                        var $low = $("."+classname+".selected-row").first();
                        if (!$low.length){
                            $items.push($row);
                        }
                        else {
                            var $high = $("."+classname+".selected-row").last();
                            if ($row.index() > $low.index()){
                                $items = $low.nextUntil($row);
                            }
                            else if ($row.index() < $low.index()){
                                $items = $high.prevUntil($row);
                            }
                            else if ($row.index() === $low.index()){
                                $items = $row;
                            }
                            $items.push($low);
                            $items.push($row);
                        }
                        $.each($items,function(){
                            items.push($(this).getId());
                        });
                        item_selected(items);
                    // with ctrl key
                    }
                    else if (event.ctrlKey){
                        var item_ids = app_vars.selected;
                        console.debug("old_array");
                        console.debug(item_ids);
                        $items = [];
                        var id = $row.getId();
                        console.debug("id: "+id);
                        if ($.inArray(id,item_ids) !== -1){
                            var array_index = item_ids.indexOf(id);
                            item_ids.splice(array_index, 1);
                        } else {
                            item_ids.push(id);
                        }
                        console.debug("new array");
                        console.debug(item_ids);
                        item_selected(item_ids);
                    }
                    else {
                        item_selected([$row.getId()]);
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
                app_vars.moving = [$(this).getId()];
            }
        })
        .on("dragend",function(e){
            //console.debug(e);
        });

        $(".result-row").on("mouseup",function(){

        })
        .on("dblclick",function(){
            item_selected($(this).getId());
        });
    };

    var add_playlist_listeners = function(){
        $(".playlist")
        .on("drop",function(e){
            var playlist = $(e.target).data().playlistname;
            console.debug("adding to :"+playlist);
            for (var c = 0;c < app_vars.moving.length; c++){
                if ($.inArray(app_vars.moving[c],app_vars.playlists[playlist]) === -1){
                    $(this).data().itemcount += 1;
                    app_vars.playlists[playlist].unshift(app_vars.moving[c]);
                    //console.debug("item added to "+playlist);
                } else {
                    //console.debug("item already in playlist");
                }
            }
            $.ajax({
                url : "xhr/save_playlist",
                data: {
                    items : JSON.stringify(app_vars.playlists[playlist]),
                    name  : playlist.toLowerCase()
                },
                type: "get"
            })
            .done(function(e){
                console.log(e);
            });
            update_playlist_count(playlist);
            app_vars.moving = undefined;
        })
        .on("dragover",function(e){
            e.preventDefault();
        })
        .on("click",function(){
            var playlist = $(this).data().playlistname;
            switch_view("playlist",function(){
                $(".item-row").hide();
                for (var c = 0; c < app_vars.playlists[playlist].length; c++){
                    console.debug("adding: "+app_vars.playlists[playlist][c]);
                    console.debug($("#library_view > div > #_media_"+app_vars.playlists[playlist][c]));
                    $("#_media_"+app_vars.playlists[playlist][c]).show().addClass("playlist-item");
                }
            },$(this));
            app_vars.current_playlist = playlist;
            app_vars.current_view = "playlist_view";
        });
    };
    // --------------------------
    // End of functions
    // --------------------------
    
    // --------------------------
    // Setup player
    // --------------------------
    
    $("#playlist_list").slideUp();
    $(".slider-pointer").css({'left': (player.volume * ($(".slider-line").width() - 4)) });
    $("#library_sidebar_row").css({"background":"ghostwhite"});

    set_item_objs();
    set_playlists();

    console.debug("loaded "+app_vars.item_ids.length+" items");

    // --------------------------
    // Event Handlers
    // --------------------------
    
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
        var $filter = $(this);
        var query = $filter.val().toLowerCase();
        if (app_vars.current_view === "find_new"){
            if (e.keyCode === 13){
                $(this).val(query+' (loading...)');
                $filter.blur();
                get_files(query,function(){
                    $("#item_filter").val(query);
                });
            }
            return;
        }
        if (e.keyCode === 27){
            $filter.blur();
            return;
        }
        if (query.length > 2){
            $(".item-row").each(function(){
                //$element = $filter;
                var $element = $(this);
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
    .on("stalled",function(){
        //if (app_vars.preview.on){
            //pause_preview();
        //}
        //else {
            //next_item();
        //}
    })
    .on("ended", function(){
        if (app_vars.preview.on){
            pause_preview();
            return;
        }
        $.ajax({
            url : "xhr/played",
            data: {
                id: app_vars.current
            },
            type: "get"
        })
        .done(function(e){
            console.debug('increment play count');
        })
        .fail(function(e){
            console.warn('failed to increment play count, ID: '+app_vars.current);
            console.warn(e);
        });
        // play next item
        next_item();
    })
    .on("seeking",function(){
        console.debug("trying to fetch data...");
    });

    $("#volume_down, #volume_up").on("click",function(){
        var volume = player.volume + $(this).data().mod;
        if (volume <= 1 && volume >= 0){
            player.muted = false;
            player.volume = volume;
        }
    });

    $("#volume_off").on("click",function(){
        if (player.muted === true){
            player.muted = false;
        } else {
            player.muted = true;
        }
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
        prev_item();
    });

    elements.$control_playpause.on("click",function(){
        var $icon = $(this).find(".fa");
        if (app_vars.preview.on){
            pause_preview();
            return;
        }
        if (app_vars.preview.id){
            resume_item();
            return;
        }
        if (app_vars.status === 0){
            $icon.removeClass("fa-play");
            $icon.addClass("fa-pause");
            if (app_vars.current !== undefined){
                resume_item($("#_media_"+app_vars.current));
            } else {
                next_item();
            }
        }
        else if (app_vars.current !== undefined) {
            $icon.removeClass("fa-pause");
            $icon.addClass("fa-play");
            media_objects[app_vars.current].pause();
        } else {
        }
    });

    elements.$control_next
    .on("mousedown",function(){
        if (app_vars.status === 1){
            window.fastforward_time_id = setTimeout(function(){
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

    // KeyBinding Code
    $(document)
    .on("keydown",function(event) {
        var key = event.keyCode;
        if (key === 70 && event.ctrlKey) { // Ctrl + f
            $("#item_filter").focus();
            event.preventDefault();
        } else if (key === 85 && event.ctrlKey){ // Ctrl + u
            event.preventDefault();
        } else if (key === 65 && event.ctrlKey){
            item_selected(app_vars.item_ids);
        }
        console.debug("KEY: "+key);
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
        var rating = $("#_media_"+app_vars.selected[0]).data().rating;
        set_rating(rating);
    })
    .on("click",function(e){
        var rating = parseInt($(this).index() + 1);
        var $row, id = [];
        if (app_vars.selected.length > 1){
            for (var c = 0; c < app_vars.selected.length; c++){
                $row = $("#_media_"+app_vars.selected[c]);
                id.push(app_vars.item_ids[$row.getId()]);
                $row.data().rating = rating;
            }
        } else {
            $row   = $("#_media_"+app_vars.selected[0]);
            id     = [app_vars.item_ids[$row.getId()]];
            $row.data().rating = rating;
        }
        $.ajax({
            url : "/xhr/set_rating",
            data: {
                rating : rating,
                ids : JSON.stringify(id)
            },
            dataType: "json",
            type: "get"
        }).done(function(response){
            console.debug(response);
        }).fail(function(obj){
            console.debug(obj);
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
                volume = slider.position / slider.width;
            } else {
                volume = 0;
            }
            if (volume <= 1 && volume >= 0){
                player.volume = volume;
            }
            update_volume_icon(volume);
        });
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

    $("#queue_sidebar_row")
    .on("drop",function(e){
        console.debug("adding to queue");
        for (var c = 0;c < app_vars.moving.length; c++){
            if ($.inArray(app_vars.moving[c],app_vars.queue) === -1){
                app_vars.queue.unshift(app_vars.moving[c]);
                // ajax code
                console.debug("item added to queue: "+app_vars.moving[c]);
            } else {
                //console.debug("item already in playlist");
            }
        }
        update_queue_count();
        app_vars.moving = undefined;
    })
    .on("dragover",function(e){
        e.preventDefault();
    })
    .on("click",function(){
        switch_view("queue_view",function(){
            $(".item-row").hide();
            for (var c = 0; c < app_vars.queue.length; c++){
                $("#_media_"+app_vars.queue[c]).show().addClass("playlist-item");
            }
        },$(this));
    });

    $("#library_sidebar_row").on("click",function(e){
        switch_view("library_view",function(){
            $(".pageview").hide();
            $("#library_view").show();
            $(".item-row").show();
        },$(this));
    });

    $("#downloads_sidebar_row").on("click",function(){
        switch_view("downloads",function(){
            $(".pageview").hide();
            $("#downloads_view").show();
            console.debug("downloads opened");
        },$(this));
    });

    $("#find_new_sidebar_row").on("click",function(){
        switch_view("find_new",function(){
            $(".pageview").hide();
            $("#search_view").show();
            console.debug("find_new opened");
        },$(this));
    });

    // Sort items code
    $("#sort_menu > li").on("click",function(){
        sort_items($(this).data('sortby'),app_vars.sort_order);
        if (app_vars.sort_order === 1){
            app_vars.sort_order = 0;
        } else {
            app_vars.sort_order = 1;
        }
    });
    // ---------------
});
