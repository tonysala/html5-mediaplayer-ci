<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
//ini_set('display_errors',1); 
//error_reporting(E_ALL);

class FetcherException extends Exception{}

class Fetcher {

	private $engines = array();

	public function __construct() {
		$this->CI =& get_instance();
	}
	
	public function query($query){
		$this->engines['kohit'] = new Engine("kohit.net");
		$this->engines['kohit']->search_str = "<query>-search-downloads.<base>";
		$this->engines['kohit']->search_exp = "(//*[@class='left']//a[2])";
		$this->engines['kohit']->search($query);
		return $this->engines['kohit']->results;
	}
	
}

class Engine {

	protected $base_url;
	protected $raw_results;
	public $results;
	protected $_dom;
	protected $_xpath;
	public $search_str;
	public $search_exp;

	public function __construct($url){
		$this->base_url = $url;
		$this->_dom = new DOMDocument;
	}
	
	public function search($query){
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
					"engine" => "kohit"
				);
			}
			return true;
		}
		return false;
	}
	
	public function get_search_url($query){
		$string = str_replace("<query>",$query, $this->search_str);
		$string = str_replace("<base>",$this->base_url, $string);
		return $string;
	}
	
}
