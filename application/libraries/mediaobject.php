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
	public $DateAdded = null;
	public $SplFile = null;
	public $id3_info = null;
	public $tags = [];
	public $Broken = false;
	// public $CI;

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
		// $this->CI =& get_instance();
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

}
