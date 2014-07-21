<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

//ini_set('display_errors',1); 
//error_reporting(E_ALL);

class Xhr extends CI_Controller {
	
	public function __construct(){
		parent::__construct();
		$this->itemlist->initialise();
	}
	
	public function index(){
		header("HTTP/1.1 401 Unauthorized");
		exit;
	}
	
	public function get_url(){
		$id = $this->input->get("id");
		$title = $this->input->get("title");
		
		$path = $this->itemlist->get_fullpath($title);
		if ($path === false){
			header("HTTP/1.1 404 Content Not Found");
		} else {
			// messes up on json decode at the client side
			//print json_encode(
				//array(
					//"path" => $path,
					//"error" => false
				//)
			//);
			print $path;
		}
	}
	
	public function update_db(){
		if ($watch = $this->input->get("watch")){
			$this->itemlist->generate_files_list((array)($watch));
			$this->itemlist->write_files_to_db();
			print json_encode(
				array(
					"error" => false,
					"found" => $this->itemlist->item_count,
					"new"   => $this->itemlist->new_items
				)
			);
		} else {
			print json_encode(
				array(
					"error" => true,
					"found" => 0,
					"new"   => 0
				)
			);
		}
	}
	
	public function get_cover_art(){
		if ($id = $this->input->get("id")){
			$item = $this->itemlist->get_item($id);
			$search_term = $item->Artist." ".$item->Album." ".$item->Year." album cover";
			if (!$url = $this->_get_google_img($search_term)){
				$url = "http://player/assets/images/album-placeholder.png";
			}
			print json_encode(array("error"=>false,"url"=>$url));
		} else {
			print json_encode(array("error"=>true));
		}
	}
	
	public function set_rating(){
		if ($id = $this->input->get("id") && $rating = $this->input->get("rating")){
			$rating = $this->db->escape($rating);
			$id     = $this->db->escape($id);
			$result = $this->db->query("UPDATE music SET Rating = ".$rating." WHERE ID = ".$id.";");
			var_dump("UPDATE music SET Rating = ".$rating." WHERE ID = ".$id.";");
			if ($result === true){
				print json_encode(array("error"=>false));
			} else {
				print json_encode(array("error"=>true));
			}
		} else {
			print json_encode(array("error"=>true));
		}
	}
	
	private function _get_google_img($term, $offset = 0){
	    $url = "https://www.google.co.uk/search?as_st=y&tbm=isch&hl=en&as_q=".urlencode($term)."&as_epq=&as_oq=&as_eq=&cr=&as_sitesearch=&safe=images&tbs=isz:l,iar:s";
	    if (!$web_page = file_get_contents($url)){
			return false;
		}
	    preg_match_all('/\"(https:\/\/encrypted\-tbn1\.gstatic\.com\/images\?q.*?)\"/',$web_page,$matches);
	    if (array_key_exists($offset,$matches[1])){
		    return $matches[1][$offset];
		} else {
			return false;
		}
	}
}
