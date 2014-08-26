<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

Class Auth extends CI_Controller {

	private function set_json_out(){
		header("Content-Type: application/json");
	}

	public function auth_details(){
		$this->set_json_out();
		$user = $this->input->post("user");
		$pass = $this->input->post("pass");
		if ($user !== false && $pass !== false){
			if ($this->user->login($user,$pass) === true){
				print json_encode(["status"=>0]);
			}
			else {
				print json_encode(["status"=>1]);
			}
		}
		else {
			print json_encode(["status"=>4]);
		}
	}

	public function create_user(){
		$user = $this->input->post("user");
		$pass = $this->input->post("pass");
		$email = $this->input->post("email");
		$this->user->create_user(["user"=>$user,"pass"=>$pass,"email"=>$email]);
		print json_encode(["error"=>false]);
	}

	public function auth_user(){
		if ($this->user->logged_in() === true){
			print json_encode(["status"=>0]);
		}
		else {
			print json_encode(["status"=>1]);
		}
	}

}

?>