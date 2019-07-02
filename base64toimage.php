<?php
    /*
     * CURL
     * Take a base64 string of a PNG image (from a webcam usually) 
     * and save it as a file
     *
     * Params:
     *   photo: base64 string
     *   ext: jpeg or png
     */
    header("Access-Control-Allow-Origin: *"); 
    date_default_timezone_set('Africa/Windhoek');
    
	ini_set('display_startup_errors',1);
	ini_set('display_errors',1);
	error_reporting(-1);

	$target = "motion";
	$data              = @ $_POST['photo'];
	$prefix            = @ $_POST['prefix'];

	if (!$data) die("S_POST[data] missing");

	$date=date('Y-m-d H:i:s');
	
	//appendtolog('log.log', "$date\ndata=$data \n\n");
	
	/*
        winkelnkemper at googlemail dot com 8 years ago
        If you want to save data that is derived from a Javascript canvas.toDataURL() function, you have to convert blanks into +. 
        If you do not do that, the decoded data is corrupted:	
	*/
	$data = str_replace(' ','+',$data);
	
	list($type, $data) = explode(';', $data);//image/jpeg;base64,/9
	list(, $data)      = explode(',', $data);// /9
	$data              = base64_decode($data);
	$date              = date('Y-m-d');
	$dir               = "$target/$date";
	$ext               = explode('/',$type)[1];
	
	if (!is_dir( $target )){ @ mkdir( $target );}
	if (!is_dir($dir)){ @ mkdir($dir);}
	
	//$rnd = mt_rand();
	/* get prefix from:
       new Date().getTime()
    */
	$filename          = "$dir/" . date('Y-m-d-H-i-s') . "-$prefix.$ext";
	
	@ file_put_contents($filename, $data) or die("failed to save the image");

	echo "success;$filename";
	
	function appendtolog($log, $data){
             $fh = @ fopen($log, "a");
             if (!$fh) return false;
             
             fwrite($fh, $data);
             fclose($fh);
	}
?>
