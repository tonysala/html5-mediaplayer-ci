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
                <button class="btn btn-default" id="create_playlist_button" title="create a playlist">
					<span>Create Playlist</span>
                </button>
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
		<div class="sidebar hidden-xs <?=$skin?>">
            <div id="sidebar_list">
				<div class="sidebar-row" id='queue_sidebar_row'>
					<span style='text-align:left'>PLAY QUEUE</span>
					<span style='text-align:right;' class='queue-item-count'></span>
				</div>
				<div class="sidebar-row" id='library_sidebar_row'>
					<span>LIBRARY</span>
					<span style='text-align:right;' id='library_item_count'>(0)</span>
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
			<div class="row header-row <?=$skin?>">
				<div class="col-xs-5 col-md-7 current-track-container"><span id="current_track">Playing: </span></div>
				<div class="col-xs-7 col-md-5">
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
		</div>
	</div>
</div>
<audio style="display:none;" id="_player" autoplay preload>
    <source src='' type='audio/mpeg'>
</audio>
<ul id="contextmenu" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">
    <li id='add_to_playlist'><a tabindex="-1" id="to_playlist">Add to Playlist&nbsp;&nbsp;&nbsp;<i class='fa fa-caret-down'></i></a></li>
    <ul class='dropdown-menu' id='playlist_list'>
		<li><a tabindex="-1" class="hidden-list-item">Work Playlist</a></li>
		<li><a tabindex="-1" class="hidden-list-item">Home Playlist</a></li>
		<li><a tabindex="-1" class="hidden-list-item">Workout Playlist</a></li>
		<li class="divider"></li>
    </ul>
    <li id='add_to_queue'><a tabindex="-1">Add to Queue</a></li>
    <li id='edit_tags'><a tabindex="-1">Edit Tags</a></li>
    <li id='rate'><a tabindex="-1">Rate
		<div id="rating_container" style='display:inline-block'>
			<i class="fa fa-star-o rating"></i>
			<i class="fa fa-star-o rating"></i>
			<i class="fa fa-star-o rating"></i>
			<i class="fa fa-star-o rating"></i>
			<i class="fa fa-star-o rating"></i>
		</div>
    </a></li>
    <li class="divider"></li>
    <li id='delete_item'><a tabindex="-1">Delete from Library</a></li>
</ul>
<div class="modal fade" id="id3_modal">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h4 class="modal-title">Edit <span id="selected_for_edit_count"></span> Item(s)</h4>
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="col-xs-6">
						<span>Track:</span>
						<input type="text" class="form-control" placeholder="track" id="track_edit"/>
						<br>
						<span>Album:</span>
						<input type="text" class="form-control" placeholder="album" id="album_edit"/>
						<br>
						<span>Genre:</span>
						<input type="text" class="form-control" placeholder="genre" id="genre_edit"/>
						<br>
					</div>
					<div class="col-xs-6">
						<span>Artist:</span>
						<input type="text" class="form-control" placeholder="artist" id="artist_edit"/>
						<br>
						<span>Year Released:</span>
						<input type="text" class="form-control" placeholder="year" id="year_edit"/>
						<br>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button typy="button" class="btn btn-default" id="identify_button">Identify (Beta)</button>
				<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				<button type="button" class="btn btn-primary" id="edit_tags_confirm">Save changes</button>
			</div>
		</div>
	</div>
</div>
<div class="modal fade" id="playlist_name_modal">
	<div class="modal-dialog modal-sm">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h4 class="modal-title">Name your playlist</h4>
			</div>
			<div class="modal-body">
				<span>Playlist Name:</span>
				<input type="text" id="playlist_name_field" class="form-control"/>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary" id="playlist_name_confirm">Save playlist</button>
			</div>
		</div>
	</div>
</div>
