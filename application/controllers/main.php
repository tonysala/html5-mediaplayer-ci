<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {
	
	public function __construct(){
		parent::__construct();
		$this->itemlist->initialise();
		//$this->itemlist->load_db_objects('music');
	}
	
	public function index(){
		
		ini_set('display_errors',1); 
		error_reporting(E_ALL);
				
		$valid_exts = $this->config->item('allowed_exts');
		
		$skin = $this->config->item('skin');
		if (false){
			var_dump($this->itemlist->write_files_to_db());
		}
		$files = array();
		$files = $this->itemlist->get_object_list();
		$data  = array("files"=>$files,"skin"=>$skin);
		
		$this->load->view("layout/header");
		$this->load->view("player", $data);
		$this->load->view("layout/footer");
		
		
	}
	
	public function setup(){
		var_dump("x");
	}
}
