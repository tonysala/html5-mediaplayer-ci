<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class UserException extends Exception{};

class User extends CI_Model {

	private $password_salt = "__player__";

	public function logged_in(){
		return true;
		$user_id = $this->session->userdata('id');
		if ($user_id !== false){
			$query = $this->db->query("SELECT UserID FROM users 
				WHERE UserID = ".$this->db->escape($user_id).";");
			if ($query->num_rows() > 0){
				return true;
			}
		}
		return false;
	}

	public function login($user, $pass){
		$query = $this->db->query("SELECT UserID FROM users 
			WHERE UserName = ".$this->db->escape($user)." 
			AND Password = ".$this->db->escape(hash("sha256",$this->password_salt.$pass)).";");
		if ($query->num_rows() > 0){
			$this->session->set_userdata(["id"=>$query->first_row()->UserID]);
			$this->logged_in = true;
			return true;
		}
		else {
			return false;
		}
	}

	public function logout(){
		$this->session->unset_userdata(["user"=>"","pass"=>""]);
		header("Location: /");
		exit;
	}

	public function create_user($data = []){
		if (isset($data["user"],$data["pass"],$data["email"]))
		if (!is_string($data["user"]) || !strlen($data["user"] > 5)){
			return false;
		}
		if (!is_string($data["pass"]) || !strlen($data["pass"] > 5)){
			return false;
		}
		if (!preg_match("/^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)/",$data["email"])){
			return false;
		}
		$this->db->query("INSERT INTO users SET(
			UserName = ".$this->db->escape($data['user']).",
			Password = ".$this->db->escape(hash("sha256",$this->password_salt.$data["pass"])).",
			SignupDate = NOW(),
			Status = 0)");
		if ($this->db->affected_rows() > 0){
			$this->login($data["user"],$data["pass"]);
			return true;
		}
		else {
			return false;
		}
	}

}