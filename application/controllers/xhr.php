<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

ini_set('display_errors',1); 
error_reporting(E_ALL);

class Xhr extends CI_Controller {
	
	public function __construct(){
		parent::__construct();
		$this->itemlist->initialise();
		//$this->itemlist->load_db_objects('music');
	}
	
	public function index(){
		header("HTTP/1.1 401 Unauthorized");
	}
	
	public function get_url(){
		$id = $this->input->get("id");
		$title = $this->input->get("title");
		
		$path = $this->itemlist->get_fullpath($title);
		if ($path === false){
			header("HTTP/1.1 404 Content Not Found");
		} else {
			print $path;
		}
	}
	
	public function update_db(){
		if ($watch = $this->input->get("watch[]")){
			
		}
		return json_encode(
			array(
				"found" => count($this->generate_files_list($watch)),
				"new"   => 0
			)
		);
	}
}
