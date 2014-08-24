<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
ini_set('display_errors',1);
error_reporting(E_ALL);

class EchoNestException extends Exception{}

class EchoNest {

	private $api_key = "RDJJ0FGRTN5AAE889";
	private $endpoint = "http://developer.echonest.com/api/v4/track/upload?";

	public function analyse_file($file){
		
		print `curl -X POST "http://developer.echonest.com/api/v4/track/upload" -d "api_key={$this->api_key}&url=http://tronfo.com/tracks/{$file}.mp3"`;

	}

}