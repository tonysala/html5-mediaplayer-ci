<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

Class Auth_Hook {

	private $_black_list = ["tracks", "xhr"];
	private $CI;

	public function __construct(){
		$this->CI =& get_instance();
	}

	public function authenticate_access(){
		if (in_array($this->CI->uri->segment(1),$this->_black_list)){
			if ($this->CI->user->logged_in() === false){
				header("HTTP 1.1/Forbidden");
				header("Location: /");
				exit;
			}
		}
	}

}