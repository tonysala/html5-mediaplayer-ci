<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Tracks extends CI_Controller {

	public function get($track){
		$filename = "/var/www/player/store/".$track.".mp3";
		if (file_exists($filename)){
			header("Content-Type: audio/mpeg");
			header('Content-Disposition: inline;filename="__.mp3"');
		    header('Content-length: '.filesize($filename));
		    header('Cache-Control: no-cache');
		    header("Content-Transfer-Encoding: binary"); 
			readfile($filename);
		}
	}

}