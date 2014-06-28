<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Xhr extends CI_Controller {
	
	public function __construct(){
		parent::__construct();
		$this->itemlist->generate_object_list();
	}
	
	public function index(){
		header("HTTP/1.1 401 Unauthorized");
	}
	
	public function get_url(){
		ini_set('display_errors',1); 
		error_reporting(E_ALL);
		$id = $this->input->get("id");
		$title = $this->input->get("title");
		
		$path = $this->itemlist->get_fullpath($title);
		if ($path === false){
			header("HTTP/1.1 404 Content Not Found");
		} else {
			print $path;
		}
	}
}
