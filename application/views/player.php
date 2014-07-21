<div id="notification_bar">
	<marquee behavior="scroll" direction="left">NOW PLAYING: <span id="notification_text">Fire Inside - Gemini</span></marquee>
</div>
<div class="container-fluid <?=$skin?>" id="control_bar" style="width:100%">
    <div class="row">
        <div class="col-sm-2 hidden-xs">
            <span id="app_title">Note&trade; PRE-ALPHA v0.02 &nbsp;&nbsp;</span>
        </div>
        <div class="col-sm-8 col-sm-offset-2 col-xs-12 controls-container">
			<div class="btn-group toolbar_buttons">
				<button class="btn btn-default" id="control_prev" title='Previous'><i class="fa fa-backward"></i></button>
                <button class="btn btn-default" id="control_playpause" title='Play / Pause'><i class="fa fa-play"></i></button>
                <button class="btn btn-default" id="control_next" title='Next'><i class="fa fa-forward"></i></button>
            </div>
            <div class="btn-group toolbar_buttons">
                <button type="button" class="btn btn-default" id="shuffle" title='Shuffle'><i class="fa fa-random"></i></button>
                <button type="button" class="btn btn-default" id="loop" title='Play on Repeat!'><i class="fa fa-refresh"></i></button>
                <button type="button" class="btn btn-default" id="settings" title='Fiddle with the knobs!'><i class="fa fa fa-gear"></i></button>
            </div>
            <div class='slider-line'>
				<div class='slider-pointer'></div>
            </div>
            <i class="fa fa-volume-up" id="volume_icon"></i>
<!--
            <div class="btn-group toolbar_buttons">
                <button type="button" class="btn btn-default" id="volume_off" title='Mute'><i class="fa fa-volume-off"></i></button>
                <button type="button" class="btn btn-default" id="volume_down" data-mod="-0.1" title='Volume down'><i class="fa fa-volume-down"></i></button>
                <button type="button" class="btn btn-default" id="volume_up" data-mod="0.1" title='Crank up the volume!'><i class="fa fa-volume-up"></i></button>
            </div>
-->
        </div>
    </div>
    <div class="row" id="progress_container">
		<div id="progress_bar">
			<div id="track_pointer"></div>
		</div>
    </div>
</div>
<!-- Spinning fa icon! <i class="fa fa-circle-o-notch fa-spin"></i> -->
<div class="container-fluid page-wrapper">
	<div class="row">
		<div class="col-md-2 col-sm-3 hidden-xs sidebar <?=$skin?>">
            <div id="sidebar_list">
				<div class="sidebar-row">PLAYLIST 1</div>
				<div class="sidebar-row">LIBRARY</div>
				<div class="sidebar-row">SETTINGS</div>
			</div>
			<div id="cover_art_container">
				<img id="cover_art_image" src="">
			</div>
		</div>
		<div class="col-md-10 col-sm-9 content <?=$skin?>">
			<div class="row header-row <?=$skin?>">
				<div class="col-sm-10 col-md-6 current-track-container"><span id="current_track">Playing: </span></div>
				<div class="col-md-4">
                    <input type="text" id="item_filter" class="form-control <?=$skin?>" placeholder="Search tracks...">
                </div>
			</div>
			<div class="items-container">
                <?php foreach($files as $k => $file): ?>
                <div class='row item-row <?=$skin?>' data-rating='<?=$file->Rating?>' data-id='<?=$file->ID?>' id='_media_<?=$file->ID?>'>
                    <div class="col-xs-1 col-md-1 row-status-container"><i class="row-status fa"></i></div>
                    <div class="col-sm-11 col-md-9 item-title" title="<?=$file->SplFile->getFileName()?>">
						<span><?=$file->SplFile->getFileName()?></span>
					</div>
                    <div class="hidden-xs hidden-sm col-md-2"></div>
                </div>
                <?php endforeach; ?>
            </div>
		</div>
	</div>
</div>
<audio style="display:none;" id="_player" autoplay preload>
    <source src='' type='audio/mpeg'>
</audio>
<ul id="contextmenu" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">
    <li id='add_to_playlist'><a tabindex="-1" id="to_playlist">Add to Playlist &gt;</a></li>
    <ul class='dropdown-menu' id='playlist_list'>
		<li><a tabindex="-1" class="hidden-list-item">Work Playlist</a></li>
		<li><a tabindex="-1" class="hidden-list-item">Home Playlist</a></li>
		<li><a tabindex="-1" class="hidden-list-item">Workout Playlist</a></li>
		<li class="divider"></li>
    </ul>
    <li id='add_to_queue'><a tabindex="-1">Add to Queue</a></li>
    <li id='edit_id3'><a tabindex="-1">Edit ID3 Tags</a></li>
    <li id='rate'><a tabindex="-1">Rate
		<div id="rating_container" style='display:inline-block'>
			<i class="fa fa-star<?=$file->Rating >= 1 ? '' : '-o'?> rating"></i>
			<i class="fa fa-star<?=$file->Rating >= 2 ? '' : '-o'?> rating"></i>
			<i class="fa fa-star<?=$file->Rating >= 3 ? '' : '-o'?> rating"></i>
			<i class="fa fa-star<?=$file->Rating >= 4 ? '' : '-o'?> rating"></i>
			<i class="fa fa-star<?=$file->Rating >= 5 ? '' : '-o'?> rating"></i>
		</div>
    </a></li>
    <li class="divider"></li>
    <li id='delete_item'><a tabindex="-1">Delete from Library</a></li>
</ul>
    
