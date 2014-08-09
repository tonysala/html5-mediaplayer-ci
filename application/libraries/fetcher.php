<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
//ini_set('display_errors',1);
//error_reporting(E_ALL);

class FetcherException extends Exception{}

class Fetcher {

	private $engine;
	private $CI;

	public function __construct($engine = null) {
		if ($engine === null){
			$engine = 'mp3li';
		}
		ucfirst($engine);
		if (class_exists($engine)){
			$this->engine = new $engine();
		} else {
			throw new FetcherException("Engine (".$engine.") not found.");
		}
		$this->CI =& get_instance();
	}

	public function query($query){
		$this->engine->search($query);
		return $this->engine->results;
		exit;
	}

	public function download($href, $title){
		if ($filename = $this->engine->get_download($href, $title)){
			$fileinfo = new SplFileInfo($filename);
			//$fileinfo = $fileinfo->getFileInfo();
			if ($fileinfo instanceof SplFileInfo){
				return $this->CI->itemlist->write_files_to_db(array($fileinfo));
			}
		}
	}

	public function preview($href){
		$link = $this->engine->get_download_url($href);
		return $link;
	}

}

abstract class Engine {

	protected $raw_results;
	public $results;
	protected $_dom;
	protected $_xpath;
	public $previous_progress = 0;
	protected $audio_formats = array("mp3","flac","aac","ogg");

	public function __construct(){
		$this->_dom = new DOMDocument;
	}

	abstract function search($query);
	abstract function get_download($href, $title);

	public function get_search_url($query){
		$string = str_replace("<query>",$query, $this->url_format);
		$string = str_replace("<base>",$this->base_url, $string);
		return $string;
	}

	protected function progress_callback($download_size, $downloaded_size, $upload_size, $uploaded_size){
	    if ($upload_size == 0){
	        $progress = 0;
	    } else {
	        $progress = round($upload_size * 100 / $downloaded_size);
	    }
	    flush();
		@ob_flush();
	    if ($progress > $this->previous_progress){
	        print "|".$progress;
	        $this->previous_progress = $progress;
	    }
	}

}

class Kohit extends Engine {

	private $name = "kohit";
	private $separator = "-";
	protected $base_url = "kohit.net";
	protected $url_format = "<query>-search-downloads.<base>";
	private $search_exp = "(//*[@class='left']//a[2])";

	public function get_download($href, $title){

		$link = $this->_get_url($href);
		if (!empty($link)){
			$ch = curl_init($link);
		    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		    curl_setopt($ch, CURLOPT_FILETIME, true);
			curl_setopt($ch, CURLOPT_NOBODY, true);
		    curl_exec($ch);
		    $fileinfo = curl_getinfo($ch);
		    curl_close($ch);
		    $filesize = $fileinfo['download_content_length'];
		    if ($fileinfo['content_type'] !== "audio/mpeg"){
				return false;
			} else {
				$title = preg_replace('/[^\s\&\'\(\)a-zA-Z0-9\-_]+/','-',$title);
				$filename = "/var/www/player/tracks/".$title.".mp3";
				if (file_exists($filename)){
					return false;
				}
				$target = fopen($filename, 'w');
				$ch = curl_init($link);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
				curl_setopt($ch, CURLOPT_NOPROGRESS, false);
				curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, array($this,'progress_callback'));
				curl_setopt($ch, CURLOPT_FILE, $target);
				curl_exec($ch);
				curl_close($ch);
				fclose($target);
				if (!file_exists($filename)){
					return false;
				}
				if ($this->previous_progress === 0){
					return false;
				}
				chmod($filename,777);
				return $filename;
			}
		} else {
			return false;
		}
		exit;
	}

	public function search($query){
		$query = preg_replace('/[^a-zA-Z0-9]+/',$this->separator,$query);
		$href = $this->get_search_url($query);

		$this->raw_results = file_get_contents("http://".$href);
		@$this->_dom->loadHTML($this->raw_results);
		$this->_xpath = new DOMXPath($this->_dom);
		$results = $this->_xpath->query($this->search_exp);

		if ($results->length > 0) {
			for($c = 0; $c < $results->length; $c++){
				$this->results[] = array(
					"title" => $results->item($c)->nodeValue,
					"href"  => $results->item($c)->getAttribute("href"),
					"engine" => $this->name
				);
			}
			return true;
		}
		return false;
	}

	public function get_download_url($href){
		return $this->_get_url($href);
	}

	private function _get_url($href){
		$page = file_get_contents($href);
		preg_match('/href\s*=\s*(\"|\')((.*?)\.('.implode("|",$this->audio_formats).'))(\1)/',$page,$matches);
		if (isset($matches[2])){
			return $matches[2];
		}
		return false;
	}
}

class Mp3li extends Engine {

	private $name = "mp3li";
	private $separator = "+";
	protected $base_url = "mp3.li";
	protected $url_format = "<base>/index.php?q=<query>";
	private $search_exp = "//*[@itemprop='tracks']";

	public function get_download($href, $title){

		$link = $this->_get_url($href);
		if (!empty($link)){
			$ch = curl_init($link);
		    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		    curl_setopt($ch, CURLOPT_FILETIME, true);
			curl_setopt($ch, CURLOPT_NOBODY, true);
		    curl_exec($ch);
		    $fileinfo = curl_getinfo($ch);
		    curl_close($ch);
		    $filesize = $fileinfo['download_content_length'];
		    if ($fileinfo['content_type'] !== "audio/mpeg"){
				return false;
			} else {
				$title = preg_replace('/[^\s\&\'\(\)a-zA-Z0-9\-_]+/','-',$title);
				$filename = "/var/www/player/tracks/".$title.".mp3";
				if (file_exists($filename)){
					return false;
				}
				$target = fopen($filename, 'w');
				$ch = curl_init($link);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
				curl_setopt($ch, CURLOPT_NOPROGRESS, false);
				curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, array($this,'progress_callback'));
				curl_setopt($ch, CURLOPT_FILE, $target);
				curl_exec($ch);
				curl_close($ch);
				fclose($target);
				if (!file_exists($filename)){
					return false;
				}
				if ($this->previous_progress === 0){
					return false;
				}
				chmod($filename,777);
				return $filename;
			}
		} else {
			return false;
		}
	}

	public function search($query){
		$query = preg_replace('/[^a-zA-Z0-9]+/',$this->separator,$query);
		$href = $this->get_search_url($query);

		$this->raw_results = @file_get_contents("http://".$href);

		@$this->_dom->loadHTML($this->raw_results);
		$this->_xpath = new DOMXPath($this->_dom);

		$results = $this->_xpath->query($this->search_exp);

		if ($results->length > 0) {
			for($c = 0; $c < $results->length; $c++){
				$this->results[] = array(
					"title" => trim($results->item($c)->getElementsByTagName("div")->item(0)->nodeValue),
					"href"  => $results->item($c)->getElementsByTagName("a")->item(1)->getAttribute("href"),
					"engine" => $this->name
				);
			}
			return true;
		}
		return false;
	}

	public function get_download_url($href){
		return $this->_get_url($href);
	}

	private function _get_url($href){
		$page = @file_get_contents($href);
		preg_match('/document\.location\.href\s*=\s*(\"|\')((.*?)\.('.implode("|",$this->audio_formats).'))(\1)/',$page,$matches);
		if (isset($matches[2])){
			$link = $matches[2];
			return $link;
		} else {
			return false;
		}
	}
}
