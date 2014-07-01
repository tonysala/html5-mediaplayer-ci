<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
ini_set('display_errors',1); 
error_reporting(E_ALL);
class MediaObjectException extends Exception{}

class MediaObject {

	public $ID = null;
	public $Filename = null;
	public $Trackname = null;
	public $ArtistID = null;
	public $AlbumID = null;
	public $Plays = null;
	public $FileMD5 = null;
	public $GenreID = null;
	public $BitRate = null;
	public $Rating = null;
	public $Duration = null;
	public $Year = null;
	public $SplFile = null;
	public $id3_info = null;
	public $tags = array();

	public function __construct(StdClass $object = null) {   
        if ($object === null){
			return;
		}
        foreach (get_object_vars($object) as $key => $value) {
            if (property_exists($this,$key)){
	            $this->$key = $value;
			}
        }
        if ($this->Filename !== null && file_exists($this->Filename)){
			try {
				$this->SplFile = new SplFileObject($this->Filename);
				$this->id3_info = new getID3();
				//$this->id3_info->analyze($this->Filename);
				//if (!empty($this->id3_info->info['tags'])){
					//$this->tags = array_pop($this->id3_info->info['tags']);
				//}
			} catch (RuntimeException $e){
				throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance.");
			}
		} else {
			throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance, file not found.");
		}
		//print "<pre>";
		//var_dump($this->id3_info);
		//print "</pre>";
	}
	
}
