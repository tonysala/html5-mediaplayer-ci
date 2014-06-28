<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

$config['watch_paths'] = array(
	'/var/www/player/tracks'
);
$config['shuffle']      = false;
$config["run_setup"]    = false;
$config['allowed_exts'] = array(".mp3",".flac",".aac",".ogg");
$config['skin']         = "";
$config['sqlite_db']    = "/var/www/player/sqlite/musicinfo";
$config['crossfade']    = false;
