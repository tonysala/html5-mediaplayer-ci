$(document).on("ready",function(){
	
    console.log("player loaded");
    
	window.settings = {
		
        status  : 0,
		current : undefined,
		queue   : [],
        items   : undefined,
        shuffle : false,
        loop    : false
		
	}
    
    var buttongroup_width = $("#media_controls").width();
    $("#media_controls").css({"box-shadow":"-"+buttongroup_width+"px -3px #4986D4"});
    
    window.player = document.getElementById("_player");
	
    settings.items = parseInt($(".item-row").length);
    
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
        if (settings.shuffle === true){
            settings.shuffle = false;
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-default");
        } else {
            settings.shuffle = true;
            $(this).removeClass("btn-default");
            $(this).addClass("btn-primary");
        }
	});
    
    $("#loop").on("click",function(){
        if (settings.loop === true){
            settings.loop = false;
            $(this).removeClass("btn-primary");
            $(this).addClass("btn-default");
        } else {
            settings.loop = true;
            $(this).removeClass("btn-default");
            $(this).addClass("btn-primary");
        }
	});
	
	$(".item-row").on("click",function(){
        console.log("single click triggered");
        item_selected($(this));
	});
    
    var item_selected = function($ele){
        $(".item-row").removeClass("selected-row");
		if (!$ele.hasClass("selected-row")){
			$ele.addClass("selected-row");
		}
    }
	
    var item_clicked = function($ele){
        var item_id = $ele.data().id;
		$("#current_track").html("Playing: <b>"+$ele.find(".item-title span").text()+"</b>");
        if (settings.current === item_id && settings.status === 1){
            $ele.find(".row-status").removeClass("fa-pause");
            $ele.find(".row-status").addClass("fa-play");
            console.log("attempting pause");
            player.pause();
            settings.status = 0;
        } else if (settings.current === item_id){
            $ele.find(".row-status").removeClass("fa-play");
            $ele.find(".row-status").addClass("fa-pause");
            console.log("attempting resume");
            player.play();
            settings.status = 1;
        } else {
            var title   = $ele.children(".item-title").prop("title");
            settings.current = parseInt(item_id);
            $(".row-status").removeClass("fa-pause fa-play");
            $ele.find(".row-status").removeClass("fa-play");
            $ele.find(".row-status").addClass("fa-pause");
            $(".item-row").removeClass("selected-row");
            if (!$ele.hasClass("selected-row")){
                $ele.addClass("selected-row");
            }
            console.log("asking server for url...");
            $.ajax({
                url  : "/xhr/get_url",
                data : {
                    id    : item_id,
                    title : title
                    },
                type: 'get'
            }).done(function(file){
                console.log("got url from server: "+file);
                $("#_player source").prop({
                "src":file,
                "type":"audio/mpeg"});
                console.log("loading file...");
                player.load();
                settings.status = 1;
            }).fail(function(){
                console.log("failed getting url from server.");
            });
        }
    };
    
	$(".item-row").on("click",function(){
		console.log("double click triggered");
        item_clicked($(this));
	});
	
	$(".items-container").bind("contextmenu",function(){
		console.log("prevent system contextmenu");
        return false;
	});
	
	$(".items-container").on("mousedown",function(event){
		if (event.which === 3){
			if ($("#contextmenu").css("display") === "none"){
				$("#contextmenu").css({
					left: event.clientX,
					top: event.clientY
				});
				$("#contextmenu").fadeIn("200");
			} else {
				$("#contextmenu").fadeOut("100");
			}
			// Open window
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
    
    $("#_player").on("ended",function(){
        console.log("track ended.");
        settings.status = 0;
        if (settings.loop === true){
            console.log("looping...");
            settings.status = 1;
            player.load();
        } else {
            if (settings.shuffle === false){
                var next = settings.current + 1;
                console.log("got next track: ID='"+settings.current+"' => ID='"+next+"'");
                if ($(".item-row[data-id='"+next+"']").length){
                    $element = $(".item-row[data-id='"+next+"']");
                } else {
                    $element = $(".item-row[data-id='0']");
                }
                item_clicked($element);
                $element.scrollIntoView();
            } else {
                var found = false;
                console.log("generating next shuffle track...");
                while(found === false){
                    var next = Math.floor(Math.random() * (settings.items - 0 + 1)) + 0;
                    if (next !== settings.current){
                        console.log("got next track: ID='"+settings.current+"' => ID='"+next+"'");
                        found = true;
                        $element = $(".item-row[data-id='"+next+"']");
                        item_clicked($element);
                        $element.scrollIntoView();
                    }
                }
            }
        }
    });
	
});
