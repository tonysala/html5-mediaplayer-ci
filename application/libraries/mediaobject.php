<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
ini_set('display_errors',1); 
error_reporting(E_ALL);

class MediaObjectException extends Exception{}

class MediaObject {

	public $ID = null;
	public $Filename = null;
	public $Filepath = null;
	public $TrackName = null;
	public $ArtistID = null;
	public $AlbumID = null;
	public $GenreID = null;
	public $AlbumName = null;
	public $ArtistName = null;
	public $GenreName = null;
	public $Plays = null;
	public $FileMD5 = null;
	public $BitRate = null;
	public $Rating = null;
	public $Duration = null;
	public $Year = null;
	public $SplFile = null;
	public $id3_info = null;
	public $tags = [];
	public $CI;

	private $defaults = array(
		"ArtistName" => "-",
		"AlbumName" => "-",
		"GenreName" => "-",
		"TrackName" => "-",
		"Year" => "-",
		"Plays" => "0"
	); 

	public function __construct(StdClass $object = null) {   
        if (!($object instanceof StdClass)){
			return;
		}
		$this->CI =& get_instance();
        foreach (get_object_vars($object) as $key => $value) {
            if (property_exists($this,$key)){
	            if (in_array($key, array_keys($this->defaults)) && empty($value)){
	            	$this->$key = $this->defaults[$key];
	            }
	            else {
		            $this->$key = $value;
				}
			}
        }
        if ($this->Filename !== null && file_exists($this->Filename)){
			try {
				$this->SplFile = new SplFileInfo($this->Filename);
				$this->id3_info = new getID3();
			} catch (RuntimeException $e){
				throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance.");
			}
		} else {
			throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance, file not found.");
		}
	}
	
	public function get_foreign($id, $foreign_col, $table){
		$id = $this->CI->db->escape($id);
		// Cant escape table name using codeigniter function
		$result = $this->CI->db->query("SELECT ".$foreign_col." FROM `".$table."` WHERE ID = ".$id.";");
		$value = $result->first_row();
		if (is_object($value)){
			return $value->$foreign_col;
		} else return "Unknown";
	} 
	
	// public function __get($property){
	// 	if (property_exists($property,get_class($this))){
	// 		return $property;
	// 	} else {
	// 		if ($property === "Artist"){
	// 			return $this->get_foreign($this->ArtistID,"ArtistName","artists");
	// 		} else if ($property === "Album"){
	// 			return $this->get_foreign($this->AlbumID,"AlbumName","albums"); 
	// 		} else if ($property === "Genre"){
	// 			return $this->get_foreign($this->GenreID,"GenreName","genres");
	// 		}
	// 	}
	// }
	
}
