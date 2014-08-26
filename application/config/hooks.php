<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
| -------------------------------------------------------------------------
| Hooks
| -------------------------------------------------------------------------
| This file lets you define "hooks" to extend CI without hacking the core
| files.  Please see the user guide for info:
|
|	http://codeigniter.com/user_guide/general/hooks.html
|
*/

ini_set('display_errors',1);
error_reporting(E_ALL);

$hook['post_controller_constructor'][] = array(
	'class'    => 'Auth_Hook',
	'function' => 'authenticate_access',
	'filename' => 'auth_hook.php',
	'filepath' => 'hooks'
);


/* End of file hooks.php */
/* Location: ./application/config/hooks.php */
