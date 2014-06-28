<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class ItemList extends CI_Model {

	private $_paths = array();
	private $_db_count = 0;
	private $_files = array();
	private $_objects = array();
	private $_extensions = array();
	
	public function initialise(){
		$this->_paths = $this->config->item('watch_paths');
		$this->_extensions = $this->config->item('allowed_exts');
		$this->load_db_objects();
	}
	
	public function set_watch_paths($paths = array()){
		if (is_array($paths)){
			$this->_paths = $paths;
		} else {
			throw new Exception("set_watch_paths() expects 1 parameter of type array, ".gettype($paths)." given");
		}
	}
	
	public function generate_files_list($paths = null, $append = true){
		if ($paths === null) {
			$paths = $this->_paths;
		}
		if (!$append){
			$this->_files[] = array();
		}
		foreach ($paths as $path){
			if (strlen(trim($path)) > 0 && is_dir($path)){
				$objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));
				foreach($objects as $name => $object){
					if ($this->_valid_file($name)){
						$this->_files[] = $object;
					}
				}
			}
			unset ($objects, $extension);
		}
		return $this->files;
	}
	
	public function get_list_as_links(){
		if (empty($this->_objects)){
			$this->load_db_objects();
		}
		return array_map(function($object){
			return preg_replace('/\/var\/www\//','http://',$object->SplFile->getRealPath());
		},$this->_objects);
	}
	
	public function get_list_as_paths(){
		if (empty($this->_objects)){
			$this->load_db_objects();
		}
		return array_map(function($object){
			return substr($object->SplFile->getRealPath(),strrpos($object->SplFile->getRealPath(),"/")+1);
		},$this->_objects);
	}
	
	public function load_db_objects(){
		$items = $this->db->query('SELECT * FROM music;');
		$this->_db_count = $items->num_rows();
		$results = $items->result();
		if (is_array($results)){
			array_walk($results, function(&$object){
				$object = new MediaObject($object);
			});
			$this->_objects = $results;
			return true;
		} else {
			return false;
		}
	}
	
	public function write_files_to_db($objects = null){
		if ($objects === null) {
			if (empty($this->_files)){
				$this->generate_files_list();
			}
			$objects = $this->_files;
		}
		$result = array_map(function($object){
			$realpath = $object->getRealPath();
			$md5 = md5_file($realpath);
			$db_md5 = $this->db->query("SELECT ID FROM `music` WHERE `FileMD5` = '".$md5."';");
			$file = $this->db->escape($realpath);
			if ($db_md5->num_rows() === 0){
				$this->db->query("INSERT INTO music SET FileMD5 = '".$md5."', Filename = ".$file.";");
				return 1;
			} else {
				$this->db->query("UPDATE music SET Filename=".$file." WHERE FileMD5='".$md5."';");
				return 0;
			}
		},$objects);
		return (int)array_sum($result);
	}
	
	public function get_fullpath($title){
		if (empty($this->_objects)){
			$this->load_db_objects();
		}
		foreach($this->_objects as $object){
			if ($title === $object->SplFile->getFileName()){
				$path = preg_replace('/\/var\/www\//','http://',$object->SplFile->getRealPath());
				return $path;
			}
		}
		return false;
	}
	
	private function _valid_file($name){
		if ($name !== "." && $name !== ".."){
			$extension = substr($name,strrpos($name,"."));
			if (in_array($extension, $this->_extensions)){
				return true;
			}
		}
		return false;
	}
}
