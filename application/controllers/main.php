<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {
	
	public function __construct(){
		parent::__construct();
		$this->itemlist->generate_object_list();
	}
	
	public function index(){
		
		ini_set('display_errors',1); 
		error_reporting(E_ALL);
		
		define('APP_PATH', getcwd());
		
		$path = "";
		$valid_exts = $this->config->item('allowed_exts');
		
		$skin = $this->config->item('skin');
		
		$paths = $this->config->item('watch_paths');
		$files = $this->itemlist->get_list_as_paths();
		$data = array("files"=>$files,"skin"=>$skin);
		
		$this->load->view("layout/header");
		$this->load->view("player", $data);
		$this->load->view("layout/footer");
		
		
	}
	
	public function setup(){
		var_dump("x");
	}
}
