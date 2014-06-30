<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

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
			} catch (RuntimeException $e){
				throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance.");
			}
		} else {
			throw new MediaObjectException("Could not create SplFileObject property on MediaObject instance, file not found.");
		}
	}
	
}
