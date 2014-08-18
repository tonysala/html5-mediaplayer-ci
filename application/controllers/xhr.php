<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

//ini_set('display_errors',1);
//error_reporting(E_ALL);

class Xhr extends CI_Controller {

	public function __construct(){
		parent::__construct();
		$this->itemlist->initialise();
		//header("Content-Type: application/json");
	}

	public function index(){
		header("HTTP/1.1 401 Unauthorized");
		exit;
	}

	public function get_url(){
		$id = $this->input->get("id");

		$path = $this->itemlist->get_fullpath($id);
		if ($path === false){
			print "fail";
			//header("HTTP/1.1 404 Content Not Found");
		}
		else {
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
		if (($ids = $this->input->get("ids")) && ($rating = $this->input->get("rating"))){
			$ids = json_decode($ids);
			$rating = $this->db->escape(json_decode($rating));
			foreach ($ids as &$id){
				$id = $this->db->escape($id);
			}
			$ids = implode(",",$ids);
			print json_encode(array("ids"=>"UPDATE music SET Rating = ".$rating." WHERE ID IN (".$ids.");"));
			exit;
			$result = $this->db->query("UPDATE music SET Rating = ".$rating." WHERE ID IN (".$ids.");");
			if ($result === true){
				print json_encode(array("error"=>false));
			} else {
				print json_encode(array("error"=>true));
			}
		} else {
			print json_encode(array("error"=>true));
		}
	}

	public function get_items(){
		print json_encode($this->itemlist->get_object_list());
	}

	public function played(){
		if ($id = $this->input->get("id")){
			$result = $this->db->query("UPDATE music SET Plays = Plays + 1 WHERE ID = ".$id.";");
			if ($result === true){
				print json_encode(array("error"=>false));
			} else {
				print json_encode(array("error"=>true));
			}
		} else {
			print json_encode(array("error"=>true));
		}
	}

	public function add_playlist(){
		$name = $this->input->get("name");
		$items = $this->input->get("items");
		if ($name !== false && $items !== false){
			$name = $this->db->escape($name);
			$items = $this->db->escape($items);
			$this->db->query("INSERT INTO playlists SET Items = ".$items.", Name = ".$name.";");
			print json_encode(["error"=>false]);
		}
		else {
			print json_encode(["error"=>true,"message"=>"Missing parameters."]);
		}
	}

	public function save_playlist(){
		$name = $this->input->get("name");
		$items = $this->input->get("items");
		if ($name !== false && $items !== false){
			$name = $this->db->escape($name);
			$items = $this->db->escape($items);
			$this->db->query("UPDATE playlists SET Items = ".$items." where Name = ".$name.";");
			print json_encode(["error"=>false]);
		}
		else {
			print json_encode(["error"=>true,"message"=>"Missing parameters."]);
		}
	}

	public function get_playlists(){
		$result = [];
		$playlists = $this->db->query("SELECT * FROM playlists")->result();
		foreach($playlists as $playlist){
			$result[$playlist->Name] = json_decode($playlist->Items);
		}
		print json_encode($result);
	}

	public function query_songs(){
		if ($query = $this->input->get("query")){
			$engine = $this->input->get("engine");
			$fetcher = new Fetcher($engine);
			$result = $fetcher->query($query);
			if ($result){
				print json_encode(array(
					"data" =>$result,
					"error"=>false
				));
			} else {
				print json_encode(array("error"=>true,"message"=>"no results found."));
			}
		} else {
			print json_encode(array("error"=>true,"message"=>"no query provided."));
		}
	}

	public function download_item(){
		$engine = $this->input->get("engine");
		$href = $this->input->get("href");
		$title = $this->input->get("title");

		if ($href && $engine){
			$fetcher = new Fetcher($engine);
			$file = $fetcher->download($href, $title);
			if ($file !== false){
				print json_encode(["error"=>false,"updated"=>$file]);
			} else {
				print "|".json_encode(["error"=>true,'message'=>'unknown error']);
			}
		} else {
			print json_encode(["error"=>true,"message"=>"missing params"]);
		}
	}

	public function preview_item(){
		$engine = $this->input->get("engine");
		$href = $this->input->get("href");

		if ($href && $engine){
			$fetcher = new Fetcher($engine);
			if ($link = $fetcher->preview($href)){
				print $link;
			} else {
				header("HTTP/1.0 404 Not Found");
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

	public function debug(){
		if ($query = $this->input->get("query")){
			header("Content-Type: text/html",true);
			$engine = $this->input->get("engine");
			$fetcher = new Fetcher($engine);
			$result = $fetcher->debug_query($query);
			if ($result){
				print json_encode(array(
					"data" =>$result,
					"error"=>false
				));
			} else {
				print json_encode(array("error"=>true,"message"=>"no results found."));
			}
		} else {
			print json_encode(array("error"=>true,"message"=>"no query provided."));
		}
	}
}
