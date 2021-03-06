$(document).ready(function(){

    // Define default settings
    var app_vars = {

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
        playing_playlist : undefined,
        item_ids      : [],
        sort          : {
            order: 1,
            by: undefined
        },
        results       : [],
        downloads     : [],
        default_engine: 'mp3li',
        $editing_playlist_name : undefined,
        $api_request  : undefined,
        touchevent    : {
            time : undefined,
            pos  : undefined
        }
    };

    var elements = {
        $progress_bar      : $("#progress_bar"),
        $track_pointer     : $("#track_pointer"),
        $control_playpause : $("#control_playpause"),
        $control_next      : $("#control_next"),
        $control_prev      : $("#control_prev"),
        $library_view      : $("#library_view"),
        $library_view_inner: $("#library_view").find("div")
    };

    // Cache the player element...
    var player = document.getElementById("_player");

    var MediaObject = function(opts){
        return {
            opts: opts,
            url: function(){
                return "/tracks/"+opts.FileMD5;
            },
            play: function(){       
                var $ele = opts.$element;
                // set some vars
                var trackname = $ele.find(".trackname span").text();
                var artistname = $ele.find(".artistname span").text();
                console.debug("loading '"+artistname+" - "+trackname+"'");
                var $row_status = $ele.find(".row-status");
                // change the current track text
                set_current_track_text("Playing: <b>"+trackname+" - "+artistname+"</b>");
                // set current item variable
                app_vars.current = parseInt(opts.ID,10);
                // remove all item status icons
                $(".item-row .row-status").removeClass("fa-pause fa-play fa-asterisk");
                // set the current item status icon to pause icon
                $row_status.removeClass("fa-play");
                $row_status.addClass("fa-pause");
                // set player source
                $("#_player > source").prop({
                    "src" :this.url(),
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
                load_cover_art();
                return this;
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
                stop_seeker();
                // set status to 0 (paused/stopped)
                app_vars.status = 0;
                return this;
            },
            click: function(){
                if (app_vars.playing_view !== app_vars.current_view){
                    //play view was changed, empty old history object
                    reset_history();
                }
                app_vars.playing_view = app_vars.current_view;
                // check if song was initiated in a playlist view
                if (app_vars.playing_view === "playlist_view"){
                    if (app_vars.playing_playlist !== app_vars.current_playlist){
                        reset_history();
                    }
                    app_vars.playing_playlist = app_vars.current_playlist;
                }
                else {
                    app_vars.playing_playlist = undefined;
                }
                this.select();
                // if we clicked the current playing item, pause the player
                if (parseInt(app_vars.current,10) === parseInt(opts.ID,10) && app_vars.status === 1){
                    this.pause();
                // if we clicked the current paused item resume the player
                } else if (parseInt(app_vars.current,10) === parseInt(opts.ID,10)){
                    resume_item();
                // else load the new item
                } else {
                    this.play();
                }
                // scroll the element into view
                this.show();
                return this;
            },
            select: function(){
                // check if this item is already in the selected array
                if ($.inArray(parseInt(opts.ID,10),app_vars.selected) === -1){
                    app_vars.selected.push(parseInt(opts.ID,10));
                    opts.$element.addClass("selected-row");
                }
            },
            show: function(){
                opts.$element.scrollIntoView();
                return this;
            },
            edit: function(changes){
				if (typeof changes.track !== "undefined"){
					opts.TrackName = changes.track;
					opts.$element.find('.trackname')
						.text(changes.track)
						.attr({
							title : changes.track
						});
				}
				if (typeof changes.artist !== "undefined"){
					opts.ArtistName = changes.artist;
					opts.ArtistID = changes.artistID;
					opts.$element.find('.artistname')
						.text(changes.artist)
						.attr({
							title : changes.artist
						});
				}
				if (typeof changes.album !== "undefined"){
					opts.AlbumName = changes.album;
					opts.AlbumID = changes.albumID;
					opts.$element.find('.albumname')
						.text(changes.album)
						.attr({
							title : changes.album
						});
				}
				if (typeof changes.year !== "undefined"){
					opts.Year = changes.year;
				}
                if (typeof changes.genre !== "undefined"){
                    opts.GenreName = changes.genre;
                    opts.GenreID = changes.genreID;
                }
                if (typeof changes.trackEchoID !== "undefined"){
                    opts.TrackEchoID = changes.trackEchoID;
                }
                if (typeof changes.artistEchoID !== "undefined"){
                    opts.ArtistEchoID = changes.artistEchoID;
                }
                if (typeof changes.albumEchoID !== "undefined"){
                    opts.AlbumEchoID = changes.albumEchoID;
                }
                return this;
			}
        };
    };

    // for debugging
    window.media_objects = {};

    // Do setup stuff
    $.fn.getId = function(){
        var $this = $(this);
        if ($this.hasClass("item-row") || $this.hasClass("result-row")){
            var id = $this.prop('id');
            return parseInt(id.substring(id.lastIndexOf("_") + 1),10);
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
            $.each(items,function(index,$item){
                add_item_to_library($item, index);
            });
            update_library_count();
            add_item_row_listeners();
        });
    };

    var add_item_to_library = function($item, index){
        if ($item.ID === undefined || $item.ID === null){
            return undefined;
        }
        if (typeof $item.Broken === "undefined"){
            $item.Broken = false;
        }
        var classname = "item-row";
        var status = "";
        var $last_col = $("<div></div>")
            .addClass("col-xs-1 col-md-1 plays")
            .attr({
                title:$item.Plays
            })
            .append($("<span></span>")
                .text($item.Plays)
            );
            
        if ($item.Broken === true){
            classname = "broken-item-row";
            status = "fa-warning";
            $last_col = $("<div></div>")
                .addClass("col-xs-1 col-md-1 resultactions")
                .append($("<button></button>")
                    .addClass("btn btn-default delete-button")
                    .data({
                        id:$item.ID,
                        md5:$item.FileMD5
                    })
                    .text("Delete ")
                    .css({"line-height": "5px"})
                    .append($("<i></i>")
                        .addClass("fa fa-times")
                        .css({"line-height": "5px"})
                    )
                    
                );
        }
        var $element = $("<div></div>")
			.addClass("row "+classname)
			.attr({
				'draggable'   : true,
				'data-rating' : $item.Rating,
				'data-index'  : index,
				'id'          : "_media_"+$item.ID
			})
			.append($("<div></div>")
				.addClass("col-xs-1 col-md-1 row-status-container")
				.append($("<i></i>")
					.addClass("row-status fa "+status)
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
			.append($last_col)
        .appendTo(elements.$library_view_inner);
		app_vars.item_ids.push($item.ID);
		// Add a hard link to the jQuery element to the item object
		$item.$element = $element;
		media_objects[$item.ID] = new MediaObject($item);
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
                create_playlist_link(index,value);
            });
            add_playlist_listeners();
        });
    };

	var create_playlist = function(playlist_name,items,callback){
		if (playlist_name.length){
			if (typeof app_vars.playlists[playlist_name] === 'undefined'){
                $.ajax({
					url : "xhr/add_playlist",
					data: {
						name  : playlist_name,
						items : JSON.stringify(items)
					},
					type: "get"
				})
				.done(function(){
					app_vars.playlists[playlist_name] = items;
					create_playlist_link(playlist_name,items);
					add_playlist_listeners();
					if (typeof callback === 'function'){
						callback.call();
					}
				})
				.fail(function(e){
					console.warn(e);
				});
			}
            else {
                alert("Name already taken");
            }
		}
		else {
			console.warn("No playlist name provided");
		}
	};

	var create_playlist_link = function(index,value){
		$("<div></div>")
			.addClass("sidebar-row playlist")
			.attr({
				"data-playlistname":index.toLowerCase()
			})
			.append($("<span></span>")
                .html("<span class='playlist_name_span'>"+index.toUpperCase()+"</span> PLAYLIST ")
			)
			.append($("<span></span>")
				.addClass("playlist-item-count")
				.css({
					"text-align":"right"
				})
				.text("("+value.length+")")
			)
		.appendTo($("#playlists_sidebar_container"));

        $("<li></li>")
            .append($("<a></a>")
                .addClass("hidden-list-item")
                .attr({
                    tabindex:"-1"
                })
                .text(index)
            )
        .appendTo($("#playlist_list"));
	};

    var save_playlist = function(playlist){
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
    };

    var items_selected = function(items){
        var classname = get_view_row_classname();
        if (typeof items !== 'object'){
            throw new Error("items_selected() expects an array, "+(typeof items)+" given");
        }
        console.debug("items selected: ("+items.length+") "+JSON.stringify(items));
        // unselect previously selected items
        $("."+classname).removeClass("selected-row");
        app_vars.selected = [];
        // add items to the selected array
        $.each(items,function(){
            media_objects[parseInt(this,10)].select();
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
        start_seeker();
        // set status to 1 (playing)
        app_vars.status = 1;
    };

    var start_seeker = function(){
        // resume/start the progress bar
        $(player).one("play",function(){
            elements.$progress_bar.animate({
                width: "100%"},(player.duration - player.currentTime)*1000,"linear"
            );
            elements.$track_pointer.animate({
                left: "100%"},(player.duration - player.currentTime)*1000,"linear"
            );
        });
    };

    var stop_seeker = function(){
        elements.$progress_bar.stop(true);
        elements.$track_pointer.stop(true);
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

    var get_next_id_in_order = function(id,view,filter){
        var classname;
        if (typeof view === "boolean"){
            classname = view ? get_view_row_classname() : get_play_row_classname();
        } else {
            view = false;
            classname = get_play_row_classname();
        }
        if (typeof filter === "undefined"){
            filter = "";
        }
        if (id === undefined){
            throw new Error('id must not be undefined in get_next_id_in_order(id)');
        }
        var $ele = get_item_element_by_id(id);
        // console.log($ele);
        var $next = $ele.nextAll("."+classname+filter+":first");
        if ($next.length === 0){
            return get_first_id_in_order(view,filter);
        }
        return $next.getId();
    };

    var get_first_id_in_order = function(view,filter){
        var classname;
        if (typeof view === "boolean"){
            classname = view ? get_view_row_classname() : get_play_row_classname();
        } else {
            view = false;
            classname = get_play_row_classname();
        }
        if (typeof filter === "undefined"){
            filter = "";
        }
        return $("."+classname+filter).first().getId();
    };

    var get_last_id_in_order = function(view,filter){
        var classname;
        if (typeof view === "boolean"){
            classname = view ? get_view_row_classname() : get_play_row_classname();
        } else {
            view = false;
            classname = get_play_row_classname();
        }
        if (typeof filter === "undefined"){
            filter = "";
        }
        return $("."+classname+filter).last().getId();
    };

    var get_prev_id_in_order = function(id,view,filter){
        var classname;
        if (typeof view === "boolean"){
            classname = view ? get_view_row_classname() : get_play_row_classname();
        } else {
            view = false;
            classname = get_play_row_classname();
        }
        if (typeof filter === "undefined"){
            filter = "";
        }
        if (id === undefined){
            throw new Error('id must not be undefined in get_next_id_in_order(id)');
        }
        var $ele = get_item_element_by_id(id);
        var $prev = $ele.prevAll("."+classname+filter+":first");
        // console.log($prev);
        if ($prev.length === 0){
            return get_last_id_in_order(view,filter);
        }
        return $prev.getId();
    };

    var next_item = function(){
        app_vars.status = 0;
        var next;
        // Check if there are items in the queue
        if (app_vars.queue.length > 0){
            next = app_vars.queue.shift();
            update_queue_count();
            media_objects[next].play().show();
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
                }
                else {
                    next = get_next_id_in_order(app_vars.current);
                }
                media_objects[next].play().show();
            }
            // get random next item
            else {
                var found = false;
                while(found === false){
                    var bucket;
                    if (app_vars.playing_view === "library_view"){
                        bucket = app_vars.item_ids;
                    }
                    else if (app_vars.playing_view === "playlist_view"){
                        bucket = app_vars.playlists[app_vars.current_playlist];
                    }
                    next_index = Math.floor(Math.random() * (bucket.length - 0 + 1)) + 0;
                    next = $("."+get_play_row_classname()).eq(next_index).getId();
                    if (next !== undefined && next !== app_vars.current){
                        found = true;
                        // Add to player history
                        if ($.inArray(next,app_vars.history) !== -1){
                            var array_index = app_vars.history.indexOf(next);
                            app_vars.history.splice(array_index, 1);
                        }
                        app_vars.history.items.push(next);
                        app_vars.history.pointer++;
                        media_objects[next].play().show();
                        console.debug("pointer:"+app_vars.history.pointer);
                        console.debug(app_vars.history.items);
                    }
                }
            }
        }
    };

    var prev_item = function(){
        var prev;
        if (app_vars.current === undefined){
            prev = get_first_id_in_order();
            media_objects[prev].play();
            return;
        }
        if (player.currentTime > 3 || app_vars.loop === true){
            prev = app_vars.current;
            media_objects[prev].play();
        }
        else {
            if (app_vars.shuffle === false){
                prev = get_prev_id_in_order(app_vars.current);
                console.log(prev);
                media_objects[prev].play();
            } 
            else {
                console.debug("pointer:"+app_vars.history.pointer);
                console.debug(app_vars.history.items);
                if (app_vars.history.pointer > 0 && app_vars.history.items[app_vars.history.pointer] !== app_vars.current){
                    app_vars.history.pointer--;
                    prev = app_vars.history.items[app_vars.history.pointer];
                    media_objects[prev].play();
                } else {
                    if (app_vars.history.pointer === 0 && app_vars.history.items.length > 0){
                        app_vars.history.items = [];
                    }
                    next_item();
                }
            }
        }
        prev = undefined;
    };

    var reset_history = function(){
        app_vars.history = {
            items: [],
            pointer: -1
        };
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

    var show_menu = function(pos_x , pos_y){
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
        hide_menu();
        if (app_vars.current_view !== to){
            if (typeof callback === "function"){
                callback.call();
            }
            $(".sidebar-row").css({"background":"#DCE8EC"});
            $menuitem.css({"background":"ghostwhite"});
            app_vars.current_view = to;
        }
        items_selected([]);
    };

    var add_to_queue = function(){
        for (var c = 0; c < app_vars.selected.length; c++){
            if ($.inArray(app_vars.selected[c],app_vars.queue) === -1){
                app_vars.queue.push(parseInt(app_vars.selected[c],10));
            }
        }
        update_queue_count();
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

	var update_library_count = function(){
		$("#library_item_count").text("("+app_vars.item_ids.length+")");
	};

    var sort_items = function(by, asc){
        var $items = $("."+get_view_row_classname());

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
        })
        .detach().appendTo(elements.$library_view_inner);
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
                .addClass("download-row")
                .removeClass("result-row")
            .prependTo("#downloads_view > div");
        }

        if (!$download.length){
            console.log($download);
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
        .fail(function(e){
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
            show_error_modal("Error downloading file!");
        })
        .done(function(response){
            console.log(response);
            response = response.substring(response.lastIndexOf('|') + 1);
            var message = '';
            if (response === "" || response === undefined){
				message = 'No data recieved!';
			}
			else {
				var json_response = JSON.parse(response);
				if (typeof json_response === 'object'){
					if (json_response.error === true){
						message = json_response.message;
					}
					else {
						console.log(json_response);
						add_item_to_library(json_response.inserted,Object.keys(media_objects).length,"fa-asterisk");
						update_library_count();
					}
				}
				else {
					message = 'Malformed data response!';
				}
			}
			if (message === ''){
				$download_button.html("")
				.append($('<i></i>')
					.addClass('fa fa-check')
					.css({"line-height": "7px"})
				);
				$download_button.prop('disabled',true);
				$result_button.html("")
				.append($('<i></i>')
					.addClass('fa fa-check')
					.css({"line-height": "7px"})
				);
				$result_button.prop('disabled',true);
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
                show_error_modal(message);
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

    var add_result_listeners = function(){
        $(".download-button").on("click",function(){
            download_item($(this).data("id"));
        });
    };

    var get_view_row_classname = function(){
        var classname;
        if (app_vars.current_view === "library_view"){
            classname = "item-row";
        }
        else if (app_vars.current_view === "playlist_view"){
            classname = "item-row.playlist-row";
        }
        else if (app_vars.current_view === "downloads_view"){
            classname = "download-row";
        }
        else if (app_vars.current_view === "results_view"){
            classname = "result-row";
        }
        return classname;
    };

    var get_play_row_classname = function(){
        var classname;
        if (app_vars.playing_view === "library_view"){
            classname = "item-row";
        }
        else if (app_vars.playing_view === "playlist_view"){
            classname = "item-row.playlist-row";
        }
        else if (app_vars.playing_view === "downloads_view"){
            classname = "download-row";
        }
        else if (app_vars.playing_view === "results_view"){
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
        elements.$library_view
        .on("dblclick",".item-row",function(){
            items_selected([$(this).getId()]);
        })
        .on("touchstart",".item-row",function(e){
            // Reset previous touch data
            app_vars.touch = {time:undefined,pos:undefined};
            app_vars.touch.time = e.timeStamp;
            app_vars.touch.pos = e.originalEvent.changedTouches[0].screenY;
        })
        .on("touchend",".item-row",function(e){
            var touch_event = e.originalEvent.changedTouches[0];
            if (touch_event.screenY !== app_vars.touch.pos){
            }
            else if (e.timeStamp < app_vars.touch.time + 350){
                items_selected([]);
                media_objects[$(this).getId()].click();
            }
            else {
                items_selected([$(this).getId()]);
                show_menu(touch_event.screenX, touch_event.screenY);
            }
            // Clear touch data
            app_vars.touch = {time:undefined,pos:undefined};
        })
        .on("mouseup",".item-row",function(event){
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
                    items_selected([$row.getId()]);
                } else {
                    // nothing
                }
                if (app_vars.selected.length > 1){
                    set_rating(0);
                } else {
                    set_rating($row.data().rating);
                }
                show_menu(event.clientX, event.clientY);
                event.preventDefault();
            }
            // left click (selected item)
            else {
                var classname = get_view_row_classname();
                if (event.which === 1){
                    var c;
                    var $items = [];
                    // with shift key
                    if (event.shiftKey){
                        // multi select items
                        var items = [];
                        var $low = $("."+classname+".selected-row:visible:first");
                        var $high = $("."+classname+".selected-row:visible:last");

                        if (!$low.length){
                            $items.push($row);
                        }
                        else {
                            if ($row.index() > $low.index()){
                                $items = $low.nextUntil($row,"."+classname+":visible");
                                items.push($low.getId());
                                items.push($row.getId());
                            }
                            else if ($row.index() < $low.index()){
                                $items = $high.prevUntil($row,"."+classname+":visible");
                                items.push($high.getId());
                                items.push($low.getId());
                                items.push($row.getId());
                            }
                            else if ($row.index() === $low.index()){
                                $items = $row;
                            }
                            
                        }
                        $.each($items,function(){
                            items.push($(this).getId());
                        });
                        items_selected(items);
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
                            item_ids.push(parseInt(id,10));
                        }
                        console.debug("new array");
                        console.debug(item_ids);
                        items_selected(item_ids);
                    }
                    else {
                        items_selected([$row.getId()]);
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
        .on("dragstart",".item-row",function(e){
            if ($(this).hasClass("selected-row")){
                app_vars.moving = app_vars.selected;
            } else {
                app_vars.moving = [$(this).getId()];
            }
        })
        .on("dragend",".item-row",function(e){
            //console.debug(e);
        });

        elements.$library_view
        .on("dblclick",".broken-item-row",function(){
            show_error_modal("This file is missing!<br> Please relink or delete this file.");
        });

        $(".delete-button").on("click",function(){
            var md5 = $(this).data('md5');
            var id = $(this).data('id');
            if (!md5.length){
                md5 = "_";
            }
            console.debug("removing, ID: "+$(this).data('id')+" MD5: "+md5);
            get_item_element_by_id($(this).data('id')).remove();
            $.ajax({
                url : "xhr/delete_item",
                data: {
                    id : [id],
                    md5 : [md5]
                },
                type: "get"
            })
            .done(function(data){
                console.log(data);
            });
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
                    console.log(playlist);
                    app_vars.playlists[playlist].unshift(app_vars.moving[c]);
                    //console.debug("item added to "+playlist);
                } else {
                    //console.debug("item already in playlist");
                }
            }
            save_playlist(playlist);
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
                $(".pageview").hide();
                elements.$library_view.show();
                for (var c = 0; c < app_vars.playlists[playlist].length; c++){
                    console.debug("showing item: "+app_vars.playlists[playlist][c]+" in "+playlist+" playlist view");
                    $("#_media_"+app_vars.playlists[playlist][c]).show().addClass("playlist-row");
                }
            },$(this));
            app_vars.current_playlist = playlist;
            app_vars.current_view = "playlist_view";
        })
        .on("dblclick",".playlist_name_span",function(){
            app_vars.$editing_playlist_name = $(this).attr({
                contenteditable: "true"
            })
            .focus().select();
        })
        .on("blur",".playlist_name_span",function(e){
            $(this).text($(this).text().toUpperCase())
            .attr({
                contenteditable: "false"
            });
            save_playlist(app_vars.$editing_playlist_name.parent().data('playlistname'));
            app_vars.$editing_playlist_name = undefined;
        });
    };

    var client_download_files = function(){
        var files = [];
        var download_limit = 10;
        $.each(app_vars.selected,function(){
            var file = {
                "path" : media_objects[this].opts.Filename,
                "name" : media_objects[this].opts.TrackName
            };
            files.push(file);
        });
        if (files.length){
            if (files.length <= download_limit){
                $("#download_request_form")
                    .empty()
                    .append($("<input></input>")
                        .attr({
                            name  : "files",
                            value : JSON.stringify(files)
                        })
                    )
                .submit();
            }
            else {
                show_error_modal("You may only download up to "+download_limit+" files at a time.");
            }
        }
        else {
            show_error_modal("You must select a file to download.");
        }
    };

    var identify_track = function(){
        var md5 = media_objects[app_vars.selected[0]].opts.FileMD5;
        var $button = $("#identify_button").find(".fa");
        $button
            .removeClass()
            .addClass("fa fa-spin fa-cog")
            .parent().prop({disabled:true});

        app_vars.$api_request = $.ajax({
            url: "xhr/analyse_file",
            data: {
                md5 : md5
            },
            type: "get",
            dataType: "json"
        })
        .done(function(data){
            console.log(data.response);
            if (data.response.status.code !== 0){
                console.warn(data.response.status.message);
                $button
                    .removeClass()
                    .addClass("fa fa-warning")
                    .attr({
                        title:"Failed [Error "+data.response.status.code+"]"
                    })
                    .parent().prop({disabled:true});
            }
            else if (typeof data.response.track === "object"){
                if (data.response.track.status === "pending"){
                    $button
                        .removeClass()
                        .addClass("fa fa-check")
                        .attr({
                            title:"Retry for better accuracy"
                        })
                        .parent().prop({disabled:false});
                }
                else {
                    $button
                        .removeClass()
                        .addClass("fa fa-check")
                        .attr({
                            title:"Done."
                        })
                        .parent().prop({disabled:true});
                }
                console.log(data.response.track);
                $track_edit = $("#track_edit");
                $artist_edit = $("#artist_edit");
                $album_edit = $("#album_edit");
                $song_id = $("#song_id_field");
                $artist_id = $("#artist_id_field");

                if (typeof data.response.track.title !== "undefined" && data.response.track.title.length){
                    $track_edit.val(data.response.track.title).addClass("success");
                }
                if (typeof data.response.track.artist !== "undefined" && data.response.track.artist.length){
                    $artist_edit.val(data.response.track.artist).addClass("success");
                }
                if (typeof data.response.track.release !== "undefined" && data.response.track.release.length){
                    $album_edit.val(data.response.track.release).addClass("success");
                }
                if (typeof data.response.track.song_id !== "undefined" && data.response.track.song_id.length){
                    $song_id.val(data.response.track.song_id);
                }
                if (typeof data.response.track.artist_id !== "undefined" && data.response.track.artist_id.length){
                    $artist_id.val(data.response.track.artist_id);
                }
            }
        })
        .fail(function(data){
            if (data.status === 0 && data.statusText === 'abort') {
                console.log("request aborted");
                return;
            }
            $button
                .removeClass()
                .addClass("fa fa-warnng")
                .attr({
                    title:"Failed."
                })
                .parent().prop({disabled:true});
            show_error_modal("Could not analyse track.");
        });
    };

    var save_tags = function(close){
        var $button = $("edit_tags_confirm");
        var $apply_button = $("#apply_tags_changes .fa");
        var sel = app_vars.selected;
        var data = {};
        if ($("#track_edit").val() !== ""){
            data.track = $("#track_edit").val();
        }
        if ($("#artist_edit").val() !== ""){
            data.artist = $("#artist_edit").val();
        }
        if ($("#album_edit").val() !== ""){
            data.album = $("#album_edit").val();
        }
        if ($("#year_edit").val() !== ""){
            data.year = $("#year_edit").val();
        }
        if ($("#genre_edit").val() !== ""){
            data.genre = $("#genre_edit").val();
        }
        if ($("#song_id_field").val() !== ""){
            data.song_id = $("#song_id_field").val();
        }
        if ($("#artist_id_field").val() !== ""){
            data.artist_id = $("#artist_id_field").val();
        }

        if (Object.keys(data).length === 0){
            $("#id3_modal").modal('hide');
            return;
        }
        data.id = sel;
        $button.text("Saving...").prop({disabled:true});
        $apply_button
            .removeClass()
            .addClass("fa fa-spinner fa-spin")
            .attr({title:"Saving..."})
            .parent().prop({disabled:true});
        $.ajax({
            url  : "xhr/edit_tags",
            data : data,
            type : "post"
        })
        .done(function(data){
            if (data.error === false){
                if (close){
                    $("#id3_modal").modal('hide');
                }
                else {
                    $button.text("Success");
                    $apply_button
                        .removeClass()
                        .addClass("fa fa-check")
                        .attr({title:"Success"})
                        .parent().prop({disabled:false});
                    }
                for (var c = 0; c < sel.length; c++){
                    media_objects[sel[c]].edit(data.updated);
                }
            }
            else {
                console.warn('Error - '+data.message);
                $("#edit_failed_error").text("Error occured ("+data.message+")").show();
                $button.text("Failed, Retry");
                $apply_button
                    .removeClass()
                    .addClass("fa fa-warning")
                    .attr({title:"Failed, Retry"})
                    .parent().prop({disabled:false});
            }
        })
        .fail(function(e){
            $button.text("Failed, Retry");
            $("#edit_failed_error").text("Unknown error occured!").show();
            $apply_button
                .removeClass()
                .addClass("fa fa-warning")
                .attr({title:"Failed, Retry"})
                .parent().prop({disabled:false});
            console.warn(e);
        });
    };

    var show_edit_tags_modal = function(){
        hide_menu();
        if (typeof app_vars.$api_request !== "undefined"){
            app_vars.$api_request.abort();
        }
        $("#edit_tags_confirm").text("Save & Close");
        $("#apply_tags_changes .fa")
            .removeClass()
            .addClass("fa fa-save")
            .attr({title:"Save Changes"})
            .parent().prop({disabled:false});
        $("#edit_failed_error").hide();
        $("#selected_for_edit_count").text(app_vars.selected.length);
        $("#artist_edit").val('').removeClass("success");
        $("#album_edit").val('').removeClass("success");
        $("#year_edit").val('').removeClass("success");
        $("#genre_edit").val('').removeClass("success");
        $("#song_id_field").val('');
        $("#artist_id_field").val('');
        if (app_vars.selected.length === 1){
            var obj = media_objects[app_vars.selected[0]].opts;
            console.log(obj);
            $("#track_orig").val(obj.TrackName);
            $("#artist_orig").val(obj.ArtistName);
            $("#album_orig").val(obj.AlbumName);
            $("#year_orig").val(obj.Year);
            $("#genre_orig").val(obj.GenreName);
            $("#multi_edit_warning").hide();
            $("#identify_button .fa").removeClass()
                    .addClass("fa fa-tasks")
                    .attr({
                        title:"Identify Tracks"
                    })
                    .parent().prop({disabled:false});
            $("#track_edit").val('').prop({disabled:false}).removeClass("success");
        }
        else if (app_vars.selected.length > 1){
            $("#identify_button .fa").removeClass()
                    .addClass("fa fa-tasks")
                    .attr({
                        title:"Identify Tracks"
                    })
                    .parent().prop({disabled:true});
            $("#track_orig").val('');
            $("#artist_orig").val('');
            $("#album_orig").val('');
            $("#year_orig").val('');
            $("#genre_orig").val('');
            $("#multi_edit_warning").show();
            $("#track_edit").val('').prop({disabled:true}).removeClass("success");
        } 
        else {
            throw new Error('cannot show edit tags page when no item has been selected');
        }
        $("#id3_modal").modal({});
    };

    var show_error_modal = function(error){
        $("#error_modal").find(".alert").html("<i class='fa fa-warning'></i> <strong>"+error+"</strong>");
        $("#error_modal").modal();
    };
    // --------------------------
    // End of functions
    // --------------------------

    // --------------------------
    // Setup player
    // --------------------------

    var setup_player = function(){

        $("#playlist_list").slideUp();
        $("#playlists_sidebar_container").slideUp();
        $(".slider-pointer").css({'left': (player.volume * ($(".slider-line").width() - 4)) });
        $("#library_sidebar_row").css({"background":"ghostwhite"});

        set_item_objs();
        set_playlists();

        // --------------------------
        // Event Handlers
        // --------------------------

        // ContextMenu Code
        $(".pageview, #contextmenu").on("contextmenu",function(){
            return false;
        });

        $("#contextmenu").on("click","li",function(e){
            $this = $(this);
            console.log($this,$this.attr('id'));
            if ($this.attr('id') === 'add_to_playlist'){
                if ($("#playlist_list").css("display") !== "none"){
                    $("#playlist_list").slideUp(300);
                } else {
                    $("#playlist_list").slideDown(300);
                }
            }
            else if ($this.attr('id') === 'edit_tags'){
    			$("#id3_modal").addClass("fade");
                show_edit_tags_modal();
    		}
            else if ($this.attr('id') === 'delete_item'){
                var data = {
                    id:[],
                    md5:[]
                };
                $.each(app_vars.selected,function(){
                    var obj = media_objects[this];
                    data.id.push(obj.opts.ID);
                    data.md5.push(obj.opts.FileMD5);
                    
                    // remove element(s) and all trace of element(s)
                    obj.opts.$element.remove();
                    // remove from item_ids array
                    var index = app_vars.item_ids.indexOf(parseInt(obj.opts.ID,10));
                    app_vars.item_ids.splice(index, 1);                
                    // remove from history (if found)
                    var h_index = app_vars.history.items.indexOf(parseInt(obj.opts.ID,10));
                    if (h_index !== -1){
                        app_vars.history.items.splice(h_index, 1);
                        app_vars.history.pointer--;
                    }
                    // remove from queue (if found)
                    var q_index = app_vars.queue.indexOf(parseInt(obj.opts.ID,10));
                    if (q_index !== -1){
                        app_vars.queue.splice(q_index, 1);
                    }
                    // unset as current (if set)
                    if (app_vars.current === parseInt(obj.opts.ID,10)){
                        app_vars.current = undefined;
                        if (app_vars.status === 1){
                            next_item();
                        }
                    }
                    app_vars.selected = [];
                    // remove from any playlist
                    $.each(app_vars.playlists,function(key,value){
                        console.log(key);
                        var index = app_vars.playlists[key].indexOf(parseInt(obj.opts.ID,10));
                        if (index !== -1){
                            app_vars.playlists[key].splice(index, 1);
                            save_playlist(key);
                        }
                        update_playlist_count(key);
                    });
                    // unset mediaObject
                    media_objects[obj.opts.ID] = undefined;
                });
                update_library_count();
                update_queue_count();
                hide_menu();
                $.ajax({
                    url : "xhr/delete_item",
                    data: data,
                    type: "get"
                })
                .done(function(data){
                
                });
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
            var classname = get_view_row_classname();
            if (query.length > 2){
                $("."+classname).each(function(){
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
                console.log(get_view_row_classname());
                $("."+classname).show();
            }
        });
        // End Search code

        $(player)
        .on("stalled",function(){
            stop_seeker();
            console.warn("stalled, loading...");
            $(this).one("play",function(){
                start_seeker();
            });
        })
        .on("ended", function(){
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
        .on("error",function(){
            next_item();
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
            // Editing the playlist name capture all keystrokes
            if (app_vars.$editing_playlist_name !== undefined){
                console.log(key);
                if (key === 13){
                    app_vars.$editing_playlist_name.text(
                        app_vars.$editing_playlist_name.text().toUpperCase()
                    )
                    .attr({
                        contenteditable: "false"
                    });
                    save_playlist(app_vars.$editing_playlist_name.parent().data('playlistname'));
                    app_vars.$editing_playlist_name = undefined;
                }
                return;
            }
            if (key === 70 && event.ctrlKey) { // Ctrl + f
                $("#item_filter").focus();
                event.preventDefault();
            } else if (key === 85 && event.ctrlKey){ // Ctrl + u
                event.preventDefault();
            } else if (key === 65 && event.ctrlKey){ // Ctrl + a
                items_selected(app_vars.item_ids);
            } else if (key === 40 || key === 38){ // Down key || Up key
                event.preventDefault();
                var id;
                if (key === 40){ // Down
                    // console.log("down key");
                    if (app_vars.selected.length === 0){
                        id = get_first_id_in_order();
                    }
                    else {
                        id = $("."+get_view_row_classname()+".selected-row:visible:last").getId();
                        id = get_next_id_in_order(id);
                    }
                }
                else { // Up
                    // console.log("up key");
                    if (app_vars.selected.length === 0){
                        id = get_last_id_in_order();
                    }
                    else {
                        id = $("."+get_view_row_classname()+".selected-row:visible:first").getId();
                        id = get_prev_id_in_order(id);
                    }
                }
                items_selected([id]);
                media_objects[id].show();
            } else if (key === 68 && event.ctrlKey){ // Ctrl + d
                event.preventDefault();
                $("#find_new_sidebar_row").trigger("click");
            } else if (key === 13) { // Enter
                if ($(".modal:visible").length){
                    console.log($(".modal:visible:first").find(".btn-primary:first"));
                    event.preventDefault();
                    $(".modal:visible:first").find(".btn-primary:first").trigger("click");
                    return;
                }
                if (app_vars.selected.length > 0){
                    if (app_vars.selected.length === 1){
                        $(".item-row.selected-row").trigger("dblclick");
                    }
                    else {
                        add_to_queue();
                    }
                }
            } else if (key === 76 && event.ctrlKey){ // Ctrl + l
                $("#library_sidebar_row").trigger("click");
            }
            console.debug("key ["+key+"]");
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
            var rating = parseInt($(this).index() + 1,10);
            var $row, id = [];
            if (app_vars.selected.length < 1){
    			throw new Error('One or more items need to be selected to set rating.');
    		}
    		for (var c = 0; c < app_vars.selected.length; c++){
    			$row = $("#_media_"+app_vars.selected[c]);
    			id.push(app_vars.selected[c]);
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
            //items_selected($row);
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
            hide_menu();
        });

        $("#queue_sidebar_row")
        .on("drop",function(e){
            console.debug("adding to queue");
            for (var c = 0;c < app_vars.moving.length; c++){
                if ($.inArray(app_vars.moving[c],app_vars.queue) === -1){
                    app_vars.queue.unshift(parseInt(app_vars.moving[c],10));
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
                $(".pageview").hide();
                elements.$library_view.show();
                for (var c = 0; c < app_vars.queue.length; c++){
                    $("#_media_"+app_vars.queue[c]).show().addClass("playlist-row");
                }
            },$(this));
        });

        $("#library_sidebar_row").on("click",function(e){
            switch_view("library_view",function(){
                $(".pageview").hide();
                elements.$library_view.show();
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

        $("#settings_sidebar_row").on("click",function(){
            switch_view("settings",function(){
                $(".pageview").hide();
                $("#settings_view").show();
                console.debug("settings page opened");
            },$(this));
        });

        $("#playlists_sidebar_row").on("click",function(){
            if ($("#playlists_sidebar_container").css("display") === "none"){
                $("#playlists_sidebar_container").slideDown();
                $("#playlist_row_caret").css('transform','rotate(180deg)');
            }
            else {
                $("#playlists_sidebar_container").slideUp();
                $("#playlist_row_caret").css('transform','rotate(0deg)');
            }
        });

        // Sort items code
        $("#sort_menu > li").on("click",function(){
            var sortby = $(this).data('sortby');
            if (app_vars.sort_by === sortby){
                if (app_vars.sort_order === 1){
                    app_vars.sort_order = 0;
                } else {
                    app_vars.sort_order = 1;
                }
            }
            else {
                app_vars.sort_order = 1;
            }
            app_vars.sort_by = sortby;
            sort_items(sortby,app_vars.sort_order);
        });
        // ---------------

        $("#add_to_new_playlist,#create_playlist_button").on("click",function(){
    		$("#playlist_name_field").val('');
    		$("#playlist_name_modal").modal();
    	});

    	$("#playlist_name_confirm").on("click",function(){
    		var playlist_name = $("#playlist_name_field").val().toLowerCase();
    		create_playlist(playlist_name,app_vars.selected,function(){
    			$("#playlist_name_modal").modal('hide');
    			add_playlist_listeners();
    		});
    	});

        // Edit tags code
        $("#edit_tags_confirm").on("click", function(){
            $button = $(this);
            save_tags(true);
        });
        // End Edit tags code

        $("#identify_button").on("click",function(){
            identify_track();
        });
        
        $("#client_download_button").on("click",function(){
            client_download_files();
        });

        $("#edit_modal_next").on("click",function(){
            console.log("next modal");
            var next = get_next_id_in_order(app_vars.selected[0],true,":visible");
            items_selected([next]);
            $("#id3_modal").one("hidden.bs.modal",function(){
                show_edit_tags_modal();
            });
            $("#id3_modal").removeClass("fade").modal('hide');
        });

        $("#edit_modal_prev").on("click",function(){
            console.log("prev modal");
            var next = get_prev_id_in_order(app_vars.selected[0],true,":visible");
            items_selected([next]);
            $("#id3_modal").one("hidden.bs.modal",function(){
                show_edit_tags_modal();
            });
            $("#id3_modal").removeClass("fade").modal('hide');
        });

        $("#apply_tags_changes").on("click",function(){
            save_tags(false);
        });
    };

    var authenticate_details = function(user, pass){
        if (typeof user === "undefined" || !user.length){
            show_error_modal("No username provided");
            return false;
        }
        if (typeof pass === "undefined" || !pass.length){
            show_error_modal("No password provided");
            return false;
        }
        $.ajax({
            url : "auth/auth_details",
            data: {
                user : user,
                pass : pass
            },
            type: "post",
            dataType: "json"
        })
        .done(function(response){
            console.debug(response);
            if (typeof response === "object"){
                if (response.status === 0){
                    $("#login_modal").modal("hide");
                    setup_player();
                } 
                else {
                    console.warn("Failed!");
                }
            }
            else {
                console.warn("Server Error!");
            }
        })
        .fail(function(e){
            console.warn(e);
        });
    };

    var authenticate_user = function(){
        $.ajax({
            url : "auth/auth_user",
            type: "get",
            dataType: "json"
        })
        .done(function(response){
            console.debug("au response: "+response);
            if (typeof response === "object"){
                if (response.status === 0){
                    $("#loading_modal").modal('hide');
                    setup_player();
                    return;
                }
            }
            not_logged_in();
        })
        .fail(function(e){
            not_logged_in();
        });
    };

    var not_logged_in = function(){
        $("#loading_modal").modal('hide');
        $("#login_modal").modal();
        $("#login_confirm").on("click",function(){
            authenticate_details($("#username_field").val(),$("#password_field").val());
        });
    };

    $("#loading_modal").modal();
    authenticate_user();

});
