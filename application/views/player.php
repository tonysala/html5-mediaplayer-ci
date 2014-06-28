<div id="notification_bar" style="display:none;">
	<marquee behavior="scroll" direction="left">NOW PLAYING: <span>Fire Inside - Gemini</span></marquee>
</div>
<div class="container-fluid <?=$skin?>" id="control_bar" style="width:100%">
    <div class="row">
        <div class="col-md-4 hidden-xs">
            <span>Note&trade; PRE-ALPHA v0.09 &nbsp;&nbsp;</span>
        </div>
        <div class="col-md-6 col-md-offset-2 col-xs-12">
			<div class="btn-group toolbar_buttons">
                <button class="btn btn-default" id="control_back"><i class="fa fa-backward"></i></button>
                <button class="btn btn-default" id="control_play"><i class="fa fa-play"></i></button>
                <button class="btn btn-default" id="control_next"><i class="fa fa-forward"></i></button>
            </div>
            <div class="btn-group toolbar_buttons">
                <button type="button" class="btn btn-default" id="shuffle"><i class="fa fa-random"></i></button>
                <button type="button" class="btn btn-default" id="loop"><i class="fa fa-refresh"></i></button>
                <button type="button" class="btn btn-default" id="settings"><i class="fa fa fa-gear"></i></button>
            </div>
            <div class="btn-group toolbar_buttons">
                <button type="button" class="btn btn-default" id="volume_off"><i class="fa fa-volume-off"></i></button>
                <button type="button" class="btn btn-default" id="volume_down" data-mod="-0.1"><i class="fa fa-volume-down"></i></button>
                <button type="button" class="btn btn-default" id="volume_up" data-mod="0.1"><i class="fa fa fa-volume-up"></i></button>
            </div>
        </div>
    </div>
    <div class="row" id="progress_container">
		<div id="progress_bar"></div>
    </div>
</div>
<div class="container-fluid page-wrapper">
	<div class="row">
		<div class="col-md-3 hidden-sm hidden-xs sidebar <?=$skin?>">
            <div id="sidebar_list">
				<div class="sidebar-row">PLAYLIST 1</div>
				<div class="sidebar-row">LIBRARY</div>
				<div class="sidebar-row">SETTINGS</div>
			</div>
		</div>
		<div class="col-md-9 content <?=$skin?>">
			<div class="row header-row <?=$skin?>">
				<div class="col-sm-10 col-md-6 current-track-container"><span id="current_track">Playing: </span></div>
				<div class="col-md-4">
                    <input type="text" id="item_filter" class="form-control <?=$skin?>" placeholder="Search tracks...">
                </div>
			</div>
			<div class="items-container">
                <?php foreach($files as $id => $file): ?>
                <div class="row item-row <?=$skin?>" data-id="<?=$id?>" id="_media_<?=$id?>">
                    <div class="col-xs-1 col-md-1 row-status-container"><i class="row-status fa"></i></div>
                    <div class="col-sm-11 col-md-9 item-title" title="<?=$file?>"><span><?=$file?></span></div>
                    <div class="hidden-xs hidden-sm col-md-2"></div>
                </div>
                <?php endforeach; ?>
            </div>
		</div>
	</div>
</div>
<audio style="display:none;" id="_player" autoplay>
    <source src="" type="audio/mpeg">
</audio>
<ul id="contextmenu" class="dropdown-menu" role="menu" aria-labelledby="dropdownMenu">
    <li><a tabindex="-1">Add to Playlist &gt;</a></li>
    <li><a tabindex="-1">Add to Queue</a></li>
    <li><a tabindex="-1">Edit ID3 Tags</a></li>
    <li><a tabindex="-1">Rate &gt;</a></li>
    <li class="divider"></li>
    <li><a tabindex="-1">Delete from Library</a></li>
</ul>
    
