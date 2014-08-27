<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

Class Auth_Hook {

	private $_login_required = ["tracks", "xhr"];
	private $CI;

	public function __construct(){
		$this->CI =& get_instance();
	}

	public function authenticate_access(){
		if (in_array($this->CI->uri->segment(1),$this->_login_required)){
			if ($this->CI->user->logged_in() === false){
				if ($this->CI->uri->segment(1) === "xhr"){
					header("HTTP 1.0/ 404 Forbidden");
				}
				else {
					header("Location: /");
				}
				exit;
			}
		}
	}

}