<?php
$directory = new RecursiveDirectoryIterator('/var/www/player/tracks/');
$iterator  = new RecursiveIteratorIterator($directory);
if (!file_exists("/var/www/player/tracks/md5s")){
	mkdir("/var/www/player/tracks/md5s");
}
foreach($iterator as $name => $obj){
	$fname = $obj->getFilename();
	if ($fname !== "." && $fname !== ".." && $obj->getExtension() === "mp3" && !preg_match('/^\/var\/www\/player\/tracks\/md5s\//',$name)){
		@chmod($name,777);
		$md5 = @md5_file($name);
		if (strlen($md5) > 0){
			if (file_exists("/var/www/player/tracks/md5s/".$md5.".mp3")){
				print "FILE EXISTS SKIPPING (".$md5." | ".$fname.")\n";
			}
			else {
				if (rename($name, "/var/www/player/tracks/md5s/".$md5.".mp3")){
					print "OK\n";
				}
				else {
					print "FAILED TO COPY\n";
				}
			}
		}
		else {
			print "FAIL (".$fname.")\n";
		}
		unset($fname,$md5);
	}
}

?>
