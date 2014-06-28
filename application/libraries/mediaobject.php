<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

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
        if ($this->Filename !== null){
			$this->SplFile = new SplFileObject($this->Filename);
		}
    }  
	
	
}
