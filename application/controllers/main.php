<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Main extends CI_Controller {

	public function __construct(){
		parent::__construct();
		//$this->itemlist->initialise();
	}

	public function index(){

		ini_set('display_errors',1);
		error_reporting(E_ALL);

		$skin = $this->config->item('skin');

		$data  = ["skin"=>$skin];

		$this->load->view("layout/header");
		$this->load->view("player", $data);
		$this->load->view("layout/footer");


	}

	public function setup(){
		// Setup player
	}
}
