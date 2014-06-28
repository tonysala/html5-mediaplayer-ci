<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class ItemList extends CI_Model {

	private $_paths = array();
	private $_objects = array();
	private $_extensions = array();
	
	public function __construct(){
		$this->_paths = $this->config->item('watch_paths');
		$this->_extensions = $this->config->item('allowed_exts');
		$this->_objects = $this->generate_object_list($this->_paths);
	}
	
	public function set_watch_paths($paths = array()){
		if (is_array($paths)){
			$this->_paths = $paths;
		} else {
			throw new Exception("set_watch_paths() expects 1 parameter of type array, ".gettype($paths)." given");
		}
	}
	
	public function generate_object_list($paths = null){
		if ($paths === null) {
			$paths = $this->_paths;
		}
		foreach ($paths as $path){
			if (strlen(trim($path)) > 0 && is_dir($path)){
				$objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));
				foreach($objects as $name => $object){
					if ($name !== "." && $name !== ".."){
						$extension = substr($name,strrpos($name,"."));
						if (in_array($extension, $this->_extensions)){
							$this->_objects[] = $object;
						}
					}
				}
			}
			unset ($objects, $filename, $extension);
		}
	}
	
	public function get_list_as_links(){
		return array_map(function($object){
			return preg_replace('/\/var\/www\//','http://',$object->getRealPath());
		},$this->_objects);
	}
	
	public function get_list_as_paths(){
		return array_map(function($object){
			return substr($object->getRealPath(),strrpos($object->getRealPath(),"/")+1);
		},$this->_objects);
	}
	
	public function get_db_list($table){
		$table = mysqli_real_escape_string($table);
		$this->db->query("SELECT * FROM `".$table>"`");
	}
	
	public function write_list_to_db($objects = null){
		if ($objects === null) {
			$objects = $this->_objects;
		}
		$result = array_map(function($object){
			$real_path = $object->getRealPath();
			$md5 = md5_file($realpath);
			$db_md5 = $this->db->query("SELECT `id` FROM `tracks` WHERE `md5` = '".$md5."'");
			//$db_md5 = $this->db->select("id")->from("tracks")->where("md5",$md5)->get();
			$file = mysqli_real_escape_string($realpath);
			if (!$db_md5){
				$this->db->query("INSERT INTO `tracks` (`md5`,`title`) VALUES('".$md5."','".$file."')");
				return 1;
			} else {
				$this->db->query("UPDATE `tracks` SET `title` = '".$file."' WHERE `md5` = '".$md5."'");
				return 0;
			}
		},$objects);
		return (int)array_sum($result);
	}
	
	public function get_fullpath($title){
		foreach($this->_objects as $object){
			if ($title === $object->getFileName()){
				$path = preg_replace('/\/var\/www\//','http://',$object->getRealPath());
				return $path;
			}
		}
		return false;
	}
}
