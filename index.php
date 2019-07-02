<?php
 /*
  * CCTV video motion detector using DiffCam
  * 
  * William Sengdara - June 22, 2019
  *
  */

  // directory where your CCTV footage is saved
  // use only 1!
  $cams = array(0=>"cctv/ipcam4substream");

  $ext        = "mp4"; // extension

  // for javascript
  $js_videofeatures = "autoplay controls"; // "controls autoplay";
  $js_cams     = array();
  $js_players = "";
  $js_videos  = "";
  $videofiles = "";  
	
  forEach($cams as $k=>$dir){
		$js_cams[]     = "cams[$k] = \"$dir\"; \n";
  }

  foreach($cams as $key=>$dir){
		$js_players .= "<div class='col-md-6'>
					      <video id='video$key' $js_videofeatures></video> 
			            </div>";
	}

	$idx        = 0;
	$dirname    = $cams[0]; // using directory 1 only
	$files      = glob($dirname . "/*.$ext");

    // sort DESC so next = next--
	usort($files, create_function('$a,$b', 'return filemtime($b) - filemtime($a);'));

    // sort ASC so next = next++
	//usort($files, create_function('$a,$b', 'return filemtime($a) - filemtime($b);'));

	$max_files = sizeof($files);

	/* Checking
	 * hh:mm:05, hh:mm:04, hh:mm:03, etc
	 * */
	$checktimes = array();
	for($idx1 = 5; $idx1 <= 59; $idx1+=5){
		$checktimes[] = $idx1;
	}
	
	/*
	 * videos["timestamp"] = ["dir1/ts1.mp4","dir2/ts1.mp4","dir3/ts3.mp4"];
	 * */
	foreach ($files as $file) {
	   $file  = basename($file);
	   $timestamp = str_replace(".$ext","", $file);
	   $idy   = $idx + 1;
	   
	   $seconds = explode('-',$timestamp);
	   $minutes = $seconds;
	   array_pop($minutes); // remove seconds
	   $seconds = $seconds[ 4 ];
	   $minutes = implode("-", $minutes);
	   $videofiles .= "$idy. <a href='#' onclick=\"playfile('$timestamp', $idx); return false;\">$timestamp</a> <BR>\n";
	   
	   $vids = array();
	   $idz = 0;
	   
	   foreach ($cams as $k=>$dir){
		    $path = "\"$dir/$file\"";
		    $bfound = false;
		    /*
		    if ($idz == 0){
				//$vids[] = $path;
			} else {
				
				// when greater than index 0
				// find the next existing file within the current timestamp				
				$path_ = "$dir/$file";
				
				if (! file_exists($path_)){
					//echo "Nope: $path_ ,";
					
					$seconds = intval($seconds)+5;
					
					foreach ($checktimes as $t){
						if ($seconds <= $t+5){
							for($s = $seconds; $s <= $t+5; $s--){
								$pad = strlen($s) == 1 ? "0" : "";
								$file_t = "$dir/$minutes-$pad$s.$ext";
								//echo "checking $file_t.. <BR>";
								
								if ( file_exists( $file_t ) ){
									$bfound = true;
									$vids[] = "\"$dir/$minutes-$pad$s.$ext\"";
									//echo "~~ Closest: '$file_t' <BR>";
									break;
								}
								
								if ($s == 0) {
									$bfound = true; //force outer loop to break
									$vids[] = $path;
									//echo "~~~~ Gave up: No file close to main timestamp found inside $dir. <BR>";
									break;
								}
							}
						}
						
						if ($bfound){
							//echo "~~~~ leaving outer loop <BR>";
							break;
						}
					}			
				}

			} 
			
			// default path if nothing found
			if (!$bfound) {	$vids[] = $path; }
			$idz++;*/
			$vids[] = $path;
	   }
		

	   $vids = implode(",", $vids);
	   
	   $js_videos .= "videos[\"$timestamp\"] = [$vids]; \n";
	   
	   $idx++;
	}
?>
<!DOCTYPE html>
<html>
 <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CCTV Motion Analyzer</title>
  <style>
   .border-me {border: 1px solid lightgray;}
   video {border:1px solid gray;}
   a {text-decoration:none; padding:5px;}
   div#files { max-height: 300px; overflow: scroll;}
   .container-fluid {margin-top:15px;}
  #canvasMotion{ border:1px solid gray; z-index: 2; position: absolute;}
  #canvas{ position:relative; z-index: 1;}
  #canvas2 { display:none}
  </style>
  <link href="lib/bootstrap.3.3.4.min.css" rel="stylesheet" type="text/css">
 </head>
 <body>
  <div class='container-fluid'>

   <div class='row'>
    <div class='col-md-12 border-me'>

	 <b>Speed:</b>
		[
		<small>
			 <a href='#' onclick="setvideospeed(0.5, 0); return false;" class='speed'>Slower</a> 
			 <a href='#' onclick="setvideospeed(1.0, 1); return false;" style='color:red' class='speed'>Normal</a> 
			 <a href='#' onclick="setvideospeed(2.5, 2); return false;" class='speed'>2.5x</a>
			 <a href='#' onclick="setvideospeed(3.0, 3); return false;" class='speed'>3x</a>
		</small>
		]
&nbsp;
     <b>State:</b>
		[
		<small>
			 <a href='#' onclick="setstate(2, 0); return false;" class='control'>Play</a> 
			 <a href='#' onclick="setstate(1, 1); return false;" class='control'>Pause</a> 
			 <a href='#' onclick="setstate(0, 2); return false;" class='control'>Stop</a>
		</small>
		]
	&nbsp;
   	 <b>Playing:</b> <span id='nowplaying'>Ready</span>

	 <span class='pull-right'>
	 <b>Navigation:</b>
		[
		<small>
			  <a href='#' onclick="setvideoplaying(1); return false;"><< Prev</a>
			  <a href='#' onclick="setvideoplaying(0); return false;">Next >></a>
		</small>
		]
     </span>
    </div>
   </div> <!-- row -->
	<p>&nbsp;</p>

	<div class="row">
		<div class='col-md-12'>
		 <div id='eventslist'></div>
		</div>
	</div>
	
	<div class='row'>
		 <div>
 		  <canvas id="canvasMotion" width="640" height="352"></canvas>
		  <canvas id='canvas' width="640" height="352"></canvas>
         </div>
		 <canvas id='canvas2'></canvas>
         <?php echo $js_players; ?>
         
     </div> <!-- row -->
	<div class="row">
		<div class='col-md-12'>
		 <div id='snaps' style='max-height: 155px; overflow-x: scroll;'></div>
		</div>
	</div>
    <div class='row'>
	<p>&nbsp;</p>
	<div class='col-md-12 border-me'>
      Video File List (<?php echo $max_files; ?> files) - <small>Click a time stamp below to play videos within. The next video plays automatically after previous. Click Prev/Next at top to navigate.</small>
      </div>
	  <div class='col-md-6' id='files'>
		<?php echo $videofiles; ?>
	  </div>
    </div><!-- row -->  

  </div> <!-- container -->

  <script>
	let snaps = document.getElementById('snaps')
	let overlays = [
					{x:430, y:45, text: "Upstairs", color: 'white', font: '14pt Helvetica'},
					{x:528, y:130, text: "Hole in the fence", color: 'white', font: '9pt Helvetica'},
					{x:310, y:340, text: "3 cars parked down here", color: 'white'}
				   ]
	let motion_zones = { 
						 'onvif1a': { x: 180, y: 60, w: 300, h: 250},
						 'onvif1b': { x: 0, y: 0, w: 640, h: 360},
						 109 : { x: 0, y: 160, w: 639, h: 190},
						 110 : { x: 100,  y: 229, w: 123, h: 122},
						 '110b' : { x: 189,  y: 105, w: 123, h: 103},
						 111 : { x: 0,   y: 31, w: 640, h: 352},
						 '111a' : { x: 298,   y: 30, w: 341, h: 322}
		               }

   snaps.style.height = motion_zones['111a'].h;

   var g_currIdx  = 0
   var g_playbackRate = 1.0
   var eventslist = document.getElementById('eventslist')
   var nowplaying = document.getElementById('nowplaying')
   var anchors    = document.querySelectorAll('div#files a')
   var cams       = []
   <?php echo implode('', $js_cams); ?>
   var players    = document.querySelectorAll('video')
   var videos = {};
   <?php echo $js_videos; ?>
   
   players[ players.length-1 ].onended = function(){
		console.log('last video ctl ended')
		// wait for last video to finish playing
		// but what if it's shorter than the others?
		setvideoplaying( 0 )
	}

   players[ players.length-1 ].onerror = function(){
		console.log('error on last video ctl')
		// wait for last video to finish playing
		// but what if it's shorter than the others?
		setvideoplaying( 0 )
	}


   players[ players.length-1 ].oncanplay = function(){
		console.log('last video ctl can play')
		// TODO: play all now
	}

   // handle play state
   var setstate = function( play_pause_stop, aIdx){
		switch (play_pause_stop){
             case 0: // stop
				  players.forEach((el,idx)=>{
					//el.stop()
				  })
					break;

             case 1: // pause
				  players.forEach((el,idx)=>{
					el.pause()
				  })
					break;

             case 2: // play
				  players.forEach((el,idx)=>{
					el.play()
				  })
					break;
        }

	  var speeds = document.querySelectorAll('a.control');
	  speeds.forEach((el,idx)=>{
          el.style.color = idx == aIdx ? 'red' : 'initial';
      })
   }

   // handle nav: next or prev
   var setvideoplaying = function( prev_or_next ){
		if ( !anchors.length ) return;

		console.log('setvideoplaying', prev_or_next)
		
		switch (prev_or_next){
			case 0: // prev
				if ( g_currIdx-1 < 0 ) return
				console.log('setvideoplaying',0);
				
				anchors[ g_currIdx ].style.color = 'initial' // reset active a
				g_currIdx--
				anchors[ g_currIdx ].click()
				break

			case 1: // next
				if ( g_currIdx+1 >= anchors.length ) return
				console.log('setvideoplaying',1);
				
				anchors[ g_currIdx ].style.color = 'initial' // reset active a
				g_currIdx++
				anchors[ g_currIdx ].click() // set new active a
				break;
        }
   }

   // handle playback speed: slower, normal or faster
   var setvideospeed = function( speed, aIdx ){
	  players.forEach((el,idx)=>{
        el.playbackRate = speed // 0.5, 1.0, 2.0, 3.0
      })

	  // update global var for next video
      g_playbackRate = speed

	  var speeds = document.querySelectorAll('a.speed')
	  speeds.forEach((el,idx)=>{
          el.style.color = idx == aIdx ? 'red' : 'initial'
      })

	  // all vids are set the same speed, we can query element 0
 	  console.log( 'playbackRate:',players[0].playbackRate )
   }

   // handle file being played: pass the index of the anchor in the div#files > a list
   var playfile = function( timestamp, aIdx ){
		anchors[ g_currIdx ].style.color = 'initial' // reset current active anchor
		anchors[ aIdx ].style.color      = 'red'     // set new active anchor color to red
		nowplaying.innerText             = timestamp

		console.log(timestamp, aIdx)
		
		players.forEach( (el,idx)=>{
			let path = videos[timestamp][idx]

			try {
				players[ idx ].src = `${path}`
				players[ idx ].playbackRate = g_playbackRate

			} catch ( e ){
				console.log( 'File not found:', e )
			}
		});

		g_currIdx = aIdx
   }
  </script>
   <script src="lib/diffcam.js"></script>
   <script src="lib/jquery.1.11.1.min.js"></script>
   <script src="lib/bootstrap.3.3.4.min.js"></script>
 </body>
</html>
