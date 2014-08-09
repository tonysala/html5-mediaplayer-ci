<div class="container-fluid <?=$skin?>" id="control_bar" style="width:100%">
    <div class="row">
        <div class="col-sm-2 hidden-xs">
            <span id="app_title">Note</span>
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
		<div class="hidden-xs sidebar <?=$skin?>">
            <div id="sidebar_list">
				<div class="sidebar-row" id='queue_sidebar_row'>
					<span style='text-align:left'>PLAY QUEUE</span>
					<span style='text-align:right;' class='queue-item-count'></span>
				</div>
				<div class="sidebar-row playlist" data-playlistname='work'>
					<span style='text-align:left'>WORK PLAYLIST</span>
					<span style='text-align:right;' class='playlist-item-count'></span>
				</div>
				<div class="sidebar-row" id='library_sidebar_row'>
					<span>LIBRARY</span>
					<span style='text-align:right;' class='library-item-count'>(<?=count($files)?>)</span>
				</div>
				<div class="sidebar-row" id='find_new_sidebar_row'>
					<span>FIND NEW MUSIC</span>
				</div>
				<div class="sidebar-row" id='downloads_sidebar_row'>
					<span>DOWNLOADS</span>
					<span style='text-align:right;' id='downloads_item_count'></span>
				</div>
				<div class="sidebar-row" id='settings_sidebar_row'>
					<span>SETTINGS</span>
				</div>
			</div>
			<div id="cover_art_container">
				<img id="cover_art_image" src="assets/images/album-placeholder.png">
				<div id="cover_art_actions_container">

				</div>
			</div>
		</div>
		<div class="col-md-12 content <?=$skin?>">
			<?php if (count($files)): ?>
			<div class="row header-row <?=$skin?>">
				<div class="col-sm-8 col-md-7 current-track-container"><span id="current_track">Playing: </span></div>
				<div class="col-sm-4 col-md-5 hidden-xs">
					<div class="input-group">
						<div class="input-group-btn sort_search">
							<button type="button" id="sort_by" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Sort by
								<span class="caret"></span>
							</button>
							<ul class="dropdown-menu" id="sort_menu" role="menu">
							    <li data-sortby='trackname'><a href="#">Track</a></li>
								<li data-sortby='artistname'><a href="#">Artist</a></li>
								<li data-sortby='albumname'><a href="#">Album</a></li>
							</ul>
							<button type="button" class="btn btn-default" id="shuffle" title='Shuffle'><i class="fa fa-sort-alpha-asc"></i></button>
						</div>
						<input type="text" id="item_filter" class="form-control <?=$skin?>" placeholder="Search tracks...">
					</div>
                </div>
			</div>
			<div id="page_views_container">
				<div class="row items-container pageview" id='library_view'>
					<div class="col-md-12">
	                <?php foreach($files as $k => $file): ?>
		                <div class='row item-row <?=$skin?>' draggable='true' data-rating='<?=$file->Rating?>' data-index='<?=$k?>' id='_media_<?=$file->ID?>'>
		                    <div class="col-xs-1 col-md-1 row-status-container"><i class="row-status fa"></i></div>
		                    <div class="col-xs-3 col-md-3 trackname" title="<?=$file->Trackname?>">
								<span><?=$file->Trackname?></span>
							</div>
							<div class="col-xs-3 col-md-3 artistname" title="<?=$file->Artist?>">
								<span><?=$file->Artist?></span>
							</div>
							<div class="col-xs-3 col-md-3 albumname" title="<?=$file->Album?>">
								<span><?=$file->Album?></span>
							</div>
							<div class="col-xs-1 col-md-1 plays" title="<?=$file->Plays?> Plays">
								<span><?=$file->Plays?></span>
							</div>
		                </div>
	                <?php endforeach; ?>
	                </div>
	            </div>
	            <div class="row pageview" id="downloads_view">
					<div class="col-md-12">

					</div>
	            </div>
	            <div class="row pageview" id="search_view">
					<div class="col-md-12">

					</div>
	            </div>
	        </div>
            <?php else: ?>
				<h1>No music found :(</h1>
            <?php endif; ?>
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

