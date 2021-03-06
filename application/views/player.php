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
                <button type="button" class="btn btn-default" id="loop" title='Repeat!'><i class="fa fa-refresh"></i></button>
                <button type="button" class="btn btn-default" id="settings" title='Settings'><i class="fa fa fa-gear"></i></button>
                <button class="btn btn-default" id="create_playlist_button" title="Create a Playlist">
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
				<div class="sidebar-row" id='playlists_sidebar_row'>
					<span>PLAYLISTS&nbsp;&nbsp;&nbsp;<i id="playlist_row_caret" class="fa fa-caret-down"></i></span>
				</div>
				<div id="playlists_sidebar_container">
					<!-- playlist links go here -->
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
								<li data-sortby='plays'><a href="#">Plays</a></li>
							</ul>
							<button type="button" class="btn btn-default" id="client_download_button" title='Download'><i class="fa fa-cloud-download"></i></button>
						</div>
						<input type="text" id="item_filter" class="form-control <?=$skin?>" placeholder="Search tracks...">
					</div>
                </div>
			</div>
			<div id="page_views_container">
				<div class="row items-container pageview" id='library_view'>
					<div class="col-md-12"></div>
	            </div>
	            <div class="row pageview" id="downloads_view">
					<div class="col-md-12"></div>
	            </div>
	            <div class="row pageview" id="search_view">
					<div class="col-md-12"></div>
	            </div>
	            <div class="row pageview" id="settings_view">
	            	<div class="col-md-12">
	            		<h1>Coming soon!</h1>
	            	</div>
	            </div>
	        </div>
		</div>
	</div>
</div>
<audio style="display:none;" id="_player" autoplay>
    <source src='' type='audio/mpeg'>
</audio>
<ul id="contextmenu" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">
    <li id='add_to_playlist'><a tabindex="-1" id="to_playlist">Add to Playlist&nbsp;&nbsp;&nbsp;<i class='fa fa-caret-down'></i></a></li>
    <ul class='dropdown-menu' id='playlist_list'>
    	<li id="add_to_new_playlist"><a>Create new...</a></li>
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
	<div class="modal-dialog compact-modal">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h5 class="modal-title">Edit <span id="selected_for_edit_count"></span> Item(s)</h5>
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="col-xs-12">
						<div id="multi_edit_warning" class="alert alert-warning">
							Warning you're are editing multiple items!
						</div>
						<div id="edit_failed_error" class="alert alert-danger">
							An error occured while updating your records!
						</div>
					</div>
				</div>
				<div class="row">
					<div class="col-xs-6">
						<span>Track:</span>
						<input type="text" class="form-control" id="track_orig" disabled/>
						<span>Album:</span>
						<input type="text" class="form-control" id="album_orig" disabled/>
						<span>Genre:</span>
						<input type="text" class="form-control" id="genre_orig" disabled/>
						<span>Artist:</span>
						<input type="text" class="form-control" id="artist_orig" disabled/>
						<span>Year Released:</span>
						<input type="text" class="form-control" id="year_orig" disabled/>
					</div>
					<div class="col-xs-6">
					<span>Track:</span>
						<input type="text" class="form-control" id="track_edit"/>
						<span>Album:</span>
						<input type="text" class="form-control" id="album_edit"/>
						<span>Genre:</span>
						<input type="text" class="form-control" id="genre_edit"/>
						<span>Artist:</span>
						<input type="text" class="form-control" id="artist_edit"/>
						<span>Year Released:</span>
						<input type="text" class="form-control" id="year_edit"/>
						<input type="hidden" id="song_id_field">
						<input type="hidden" id="artist_id_field">
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<div class="btn-group" style="margin-right: 5px;">
	                <button type="button" class="btn btn-default modal-footer-btn" id="edit_modal_prev" title='Previous Item'><i class="fa fa-arrow-left"></i></button>
					<button type="button" class="btn btn-default modal-footer-btn" id="identify_button"><i class="fa fa-tasks"></i> Analyse</button>
	                <button type="button" class="btn btn-default modal-footer-btn" id="apply_tags_changes" title='Save Tags'><i class="fa fa-pencil"></i> Apply</button>
	                <button type="button" class="btn btn-default modal-footer-btn" id="edit_modal_next" title='Next Item'><i class="fa fa-arrow-right"></i></button>
	            </div>
				<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary" id="edit_tags_confirm">Save &amp; Close</button>
			</div>
		</div>
	</div>
</div>
<div class="modal fade" id="playlist_name_modal">
	<div class="modal-dialog modal-sm compact-modal">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h5 class="modal-title">Name your playlist</h5>
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
<div class="modal fade" id="error_modal">
	<div class="modal-dialog modal-sm compact-modal">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h5 class="modal-title">Error Occured!</h5>
			</div>
			<div class="modal-body">
				<div class="alert alert-danger" style="display:block;"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary" data-dismiss="modal">OK</button>
			</div>
		</div>
	</div>
</div>
<div class="modal fade" id="login_modal" data-backdrop="static">
	<div class="modal-dialog modal-sm compact-modal">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">Login</h5>
			</div>
			<div class="modal-body">
				<span>Username:</span>
				<input type="text" id="username_field" class="form-control"/>
				<span>Password:</span>
				<input type="password" id="password_field" class="form-control"/>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary" id="login_confirm">Login</button>
			</div>
		</div>
	</div>
</div>
<form action="xhr/client_download" method="post" id="download_request_form">

</form>
