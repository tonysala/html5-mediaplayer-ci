<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class ItemListException extends Exception{};

class ItemList extends CI_Model {

	private $_paths = array();
	private $_db_count = 0;
	private $_files = array();
	private $_objects = array();
	private $_extensions = array();
	public  $item_count = 0;
	public  $new_items = 0;

	public function initialise(){
		$this->_paths = $this->config->item('watch_paths');
		$this->_extensions = $this->config->item('allowed_exts');
		$this->load_db_objects();
	}

	public function full_scan_and_write(){
		$this->initialise();
		$this->generate_files_list();
		$this->write_files_to_db(null,true);
	}

	public function set_watch_paths($paths = array()){
		if (is_array($paths)){
			$this->_paths = $paths;
		} else {
			throw new ItemListException("set_watch_paths() expects 1 parameter of type array, ".gettype($paths)." given");
		}
	}

	public function generate_files_list($paths = null, $append = true){
		if ($paths === null) {
			$paths = $this->_paths;
		}
		if (empty($this->_objects)){
			$this->load_db_objects();
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
		$this->new_items = $this->item_count - $this->_db_count;
		return $this->_files;
	}

	public function get_id3_tags($file){
		$id3_info = new getID3();
		$id3_info->analyze($file->getRealPath());
		$tags = array();
		if (!empty($id3_info->info['tags'])){
			$tags = array_pop($id3_info->info['tags']);
		}
		return $tags;
	}

	public function write_tags($post){
		$return = [];
		$sql = "UPDATE music SET ";
		$sql_section = [];
		if (isset($post['track']) && !empty($post['track'])){
			$sql_section[] = " TrackName = ".$this->db->escape($post['track'])." ";
			$return['track'] = $post['track'];
		}
		if (isset($post['year']) && !empty($post['year'])){
			$sql_section[] = " Year = ".$this->db->escape($post['year'])." ";
			$return['year'] = $post['year'];
		}
		if (isset($post['artist']) && !empty($post['artist'])){
			$artist = $this->check_foreign($post['artist'],'ArtistName','artists');
			$sql_section[] = " ArtistID = ".$this->db->escape_str($artist)." ";
			$return['artist'] = $post['artist'];
			$return['artistID'] = $artist;
		}
		if (isset($post['album']) && !empty($post['album'])){
			$album = $this->check_foreign($post['album'],'AlbumName','albums');
			$sql_section[] = " AlbumID = ".$this->db->escape_str($album)." ";
			$return['album'] = $post['album'];
			$return['albumID'] = $album;
		}
		if (isset($post['genre']) && !empty($post['genre'])){
			$genre = $this->check_foreign($post['genre'],'GenreName','genres');
			$sql_section[] = " GenreID = ".$this->db->escape_str($genre)." ";
			$return['genre'] = $post['genre'];
			$return['genreID'] = $genre;
		}
		if (!count($sql_section)){
			return false;
		}
		$sql .= implode(",",$sql_section);
		$sql .= " WHERE music.ID IN (".implode(",",$this->db->escape_str($post['id'])).");";
		$this->db->query($sql);
		return $return;
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

	public function get_item($id){
		$row = $this->db->query("SELECT music.*, albums.AlbumName, artists.ArtistName, genres.GenreName
		FROM music
			LEFT JOIN artists ON music.ArtistID = artists.ID
			LEFT JOIN albums ON music.AlbumID = albums.ID
			LEFT JOIN genres ON music.GenreID = genres.ID
		WHERE `music`.`ID` = ".$this->db->escape($id)." LIMIT 1;")->first_row();
		if (empty($row)){
			return false;
		}
		try {
			$result = new MediaObject($row);
		} catch (MediaObjectException $e){
			throw new ItemListException("Failed to instantiate MediaObject, ".$e->getMessage());
		}

		return $result;
	}

	public function load_db_objects(){
		$items = $this->db->query('SELECT music.*, albums.AlbumName, artists.ArtistName, genres.GenreName
		FROM music
			LEFT JOIN artists ON music.ArtistID = artists.ID
			LEFT JOIN albums ON music.AlbumID = albums.ID
			LEFT JOIN genres ON music.GenreID = genres.ID
		ORDER BY ArtistName+0<>0 DESC, ArtistName+0, ArtistName;');

		$this->_db_count = $items->num_rows();
		$results = $items->result();
		if (is_array($results)){
			foreach($results as $k => &$result){
				try {
					$result = new MediaObject($result);
				} catch (MediaObjectException $e){
					unset($results[$k]);
				}
			};
			array_values($results);
			$this->_db_count = count($results);
			$this->_objects = $results;
			return true;
		} else {
			return false;
		}
	}

	public function write_files_to_db($files = null, $feedback = false){
		if ($files === null) {
			if (empty($this->_files)){
				$this->generate_files_list();
			}
			$files = $this->_files;
		}
		$result = [];
		$count = 0;
		foreach ($files as $file){
			$realpath = $file->getRealPath();
			$tags = $this->get_id3_tags($file);
			//print "|".json_encode($tags);
			//exit;
			$sql = array();
			if (isset($tags['artist'][0])){
				$artist = $this->check_foreign($tags['artist'][0],'ArtistName','artists');
				$sql[] = " ArtistID = ".$artist." ";
			}
			if (isset($tags['album'][0])){
				$album = $this->check_foreign($tags['album'][0],'AlbumName','albums');
				$sql[] = " AlbumID = ".$album." ";
			}
			if (isset($tags['genre'][0])){
				$genre = $this->check_foreign($tags['genre'][0],'GenreName','genres');
				$sql[] = " GenreID = ".$genre." ";
			}
			if (isset($tags['title'][0])){
				$sql[] = " TrackName = ".$this->db->escape($tags['title'][0])." ";
			}
			if (isset($tags['year'][0])){
				$sql[] = " Year = ".$this->db->escape($tags['year'][0])." ";
			}
			$sql = (count($sql) > 0 ? ", " : "").implode(" , ",$sql);
			$md5 = md5_file($realpath);
			$db_md5 = $this->db->query("SELECT ID FROM `music` WHERE `FileMD5` = '".$md5."';");
			$filename = $this->db->escape($realpath);
			$count = $count + 1;
			if ($db_md5->num_rows() === 0){
				$this->db->query("INSERT INTO music SET "
					. "FileMD5 = '".$md5."', "
					. "Filename = ".$filename
					. $sql
				);
				$result[] = $this->db->insert_id();
			} else {
				$this->db->query("UPDATE music SET "
					. "Filename=".$filename
					. $sql
					. " WHERE FileMD5='".$md5."';");
			}
			if ($feedback){
				print "<script>console.log('Writing: ".$count."/479 New: ".$result."')</script>";
				flush();
				ob_flush();
			}
		}
		return $result;
	}

	public function check_foreign($value, $foreign_col, $table){
		$value = $this->db->escape($value);
		$result = $this->db->query("SELECT ID FROM `".$table."` WHERE ".$foreign_col." = ".$value);
		if ($result->num_rows() !== 0){
			return $result->first_row()->ID;
		} else {
			$this->db->query("INSERT INTO `".$table."` SET ".$foreign_col." = ".$value);
			return $this->db->insert_id();
		}
	}

	public function get_fullpath($id){
		$item = $this->get_item($id);
		if ($item !== false){
			$fullpath = $item->Filename;
			$basepath = '/var/www/player/';
			$pos = strpos($fullpath,$basepath);
			if ($pos !== false) {
				return substr_replace($fullpath,'http://'.$_SERVER['HTTP_HOST'].'/',$pos,strlen($basepath));
			}
		}
		return false;
	}

	public function get_object_list(){
		if (empty($this->_objects)){
			$this->load_db_objects();
		}
		return $this->_objects;
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
