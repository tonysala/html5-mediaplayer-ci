<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
ini_set('display_errors',1);
error_reporting(E_ALL);

class EchoNestException extends Exception{}

class EchoNest {

	private $api_key = "RDJJ0FGRTN5AAE889";

	public function analyse_file($file){
		
		$endpoint = "http://developer.echonest.com/api/v4/track/upload";
		print `curl -X POST "{$endpoint}" -d "api_key={$this->api_key}&url=http://{$_SERVER['HTTP_HOST']}/tracks/{$file}.mp3"`;

	}

}