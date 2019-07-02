'option_strict'

let camIp = '111a'

let motion_x      = motion_zones[camIp].x
let motion_y      = motion_zones[camIp].y
var motion_width  = motion_zones[camIp].w
var motion_height = motion_zones[camIp].h

var _width = 640, _height = 352

var scaleX = motion_width / 64
var scaleY = motion_height / 48

const canvas = document.getElementById('canvas') // createCanvas(_width, _height)
const ctx    = canvas.getContext('2d')
ctx.imageSmoothingEnabled = true;
canvas.width = _width
canvas.height= _height

const canvas2 = document.getElementById('canvas2') //createCanvas(motion_width, motion_height)
const ctx2    = canvas2.getContext('2d')
canvas2.width = motion_width
canvas2.height= motion_height
//canvas2.style.display = 'none';

let canvasMotion = document.getElementById('canvasMotion')
let ctxMotion    = canvasMotion.getContext('2d')

const motion_bird    = 20
const motion_human   = 33
const motion_vehicle = 55

var last_filename = "";

// instead of having lots of global variables
// making the code look silly, create an options object
// to group and rule them all
var options = {}
options.diffcam_busy = false;
options.play_audio = true
options.save_motion = true;
options.clear_canvasmotion = false;
options.count_events = false;
options.max_draw_before_clear = 10
options.total_draw_before_clear = 1

let audio = new Audio();
audio.src = 'Soft delay.ogg';

let video = document.getElementById('video0')
video.style.display = 'none'

var events = {}

var video2canvas = function(){
		if ( !video.paused ){
			 ctx.clearRect(0,0, canvas.width, canvas.height)
			 ctx.drawImage( video , 0, 0, _width, _height, 0, 0, _width, _height)
			 ctx2.drawImage(canvas, motion_x, motion_y, motion_width, motion_height, 0, 0 , motion_width, motion_height)
		}

		// drawing the green motion zone
		ctx.lineWidth = '1';
		ctx.strokeStyle = 'green';
		ctx.strokeRect(motion_x, motion_y, motion_width, motion_height);

		// drawing any overlays
		for(let idx=0; idx < overlays.length; idx++){
			let o = overlays[idx];

			ctx.fillStyle = o.color		
			ctx.font = o.font || '11pt Helvetica'	
			ctx.fillText(o.text, o.x, o.y)
		}
		requestAnimationFrame( video2canvas ); 
}

// not using setInterval
requestAnimationFrame( video2canvas )

function initSuccess() {DiffCamEngine.start()}

function initError() {console.log('Something went wrong initing DiffCam.')}

function createCanvas(width, height){
	var can = document.createElement('canvas')
	can.width = width
	can.height = height
	can.style.left ='0px';
    can.style.top = '0px';
    can.style.display ='none';
	document.body.appendChild(can)
	return can
}

// this is a callback 
// when DiffCam detects motion: params motion object
function capture ( motion ) {
	//if (motion.score) console.log('Diffcam motion', motion.score, '%');

	if (options.diffcam_busy) {
	   console.log('Diffcam is busy')
	   return;
	}

	if ( motion.score > 3 ) {
		options.diffcam_busy = true;

		if ( motion.hasMotion && motion.motionBox ){

	 		 if ( options.play_audio ){
				 audio.play();
			 }

			 let x = motion.motionBox.x;
			 let y = motion.motionBox.y;

			let x1 = Math.ceil(x.min* scaleX)
			let y1 = Math.ceil(y.min*scaleY)
			let w  = Math.ceil((x.max-x.min)*scaleX)
			let h  = Math.ceil((y.max-y.min)*scaleY)

			// experiment: lighten
			/*
			let imageData = ctx.getImageData(  motion_x + x1, motion_y + y1, w, h )
			let data      = imageData.data

			for (let i = 0; i < data.length; i += 4) {
			  // invert colors
			  data[i]     = 255 - data[i];     // red
			  data[i + 1] = 255 - data[i + 1]; // green
			  data[i + 2] = 255 - data[i + 2]; // blue

			  // grayscale
			  var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
			  data[i]     = avg; // red
			  data[i + 1] = avg; // green
			  data[i + 2] = avg; // blue

			}
			ctx.putImageData( imageData, motion_x + x1, motion_y + y1) //, w, h )
			*/

			// drawing the red motion detected on Canvas for saving to disk
			ctx.lineWidth = '1';
			ctx.strokeStyle = 'red';
			ctx.strokeRect( motion_x + x1, motion_y + y1, w, h );

			// draw the red motion on the transparent canvas
			ctxMotion.lineWidth = '1';
			ctxMotion.strokeStyle = 'red';
			//ctxMotion.fillStyle = 'rgba(255,255,255,0.3)';

			if ( options.clear_canvasmotion ){
				ctxMotion.clearRect(0, 0, canvasMotion.width, canvasMotion.height)
			} else {
				// we are not clearRect()'ing for every drawImage but we get a mush 
				// so we need to clearRect every so many strokeRects()
				options.total_draw_before_clear++

				if ( options.total_draw_before_clear == options.max_draw_before_clear ){
					console.log('clearRect')
					ctxMotion.clearRect(0, 0, canvasMotion.width, canvasMotion.height)
					options.total_draw_before_clear = 0;
				}
			}

			ctxMotion.strokeRect( motion_x + x1, motion_y + y1, w, h);

			// get the video name from URL
			let len = video.src.split("/").length // so videos must be in a subdirectory
			let vid = video.src.split("/")[ len-1 ] // key 2019-12-21 00:00:00.mp4

			// count motion events per video
			if (! events[vid] ){
				events[ vid ] = 1
            } else {
				events[ vid ]++;
			}

			// Show event count per video
			if ( options.count_events ){
				var str = "";
				for( let e in events ){
					let total = events[ e ]
					str += `<a href='${video.src}' target='_blank'>${e}</a> <span class='badge'>${total}</span>&nbsp;`;
				}
				eventslist.innerHTML = str
			}

			// write motion frames to disk
			// otherwise we will have to redo this process on machine restart or power loss!
			if ( options.save_motion ){
				console.log('saving frame to disk');

				let url = "base64toimage.php";
				let time= new Date().getTime();
             	let data = {photo: canvas.toDataURL('image/jpg',0.5), prefix: time};

             	$.ajax({ url:     url,
		                 method:  'POST',
		                 data:    data,
		                 success: function(data){console.log('AJAX success', data);},
		                 error:   function(a, b, error){console.log('AJAX error',error);}
             			});
			} else {
				console.log('Not saving frames to disk')
			}

			//write the file name where motion detected last
			//ctxMotion.font = '12px Helvetica';
			//ctxMotion.fillStyle = 'red'
			//ctxMotion.fillText( `${vid} (${events_total} events)` , motion_x + x1, (motion_y + y1- 10))

			let can = document.createElement('canvas')
				can.width = canvas2.width
				can.height = canvas2.height
			let ctx0 = can.getContext('2d')
				ctx0.drawImage(canvas2, 0, 0)
				ctx0.lineWidth = '1';
				ctx0.strokeStyle = 'red';
				ctx0.strokeRect(x.min*scaleX, y.min*scaleY, (x.max-x.min)*scaleX, (y.max-y.min)*scaleY)

				can.style.padding = '5px'
				can.title = video.src
				can.ondblclick = function(){window.open(video.src, '_blank');}
			snaps.appendChild(can)

			console.warn(new Date().toLocaleString(), 'Motion', video.src)
		}

		options.diffcam_busy = false
	}
}

function pad( data ){
	return data.toString().length == 2 ? data : '0'+data;
}

function currentDate(){
	var date = new Date()

	return date.getFullYear() + '_' + 
	       pad((date.getMonth()+1)) + '_' + 
               pad(date.getDate()) + '_' + 
               pad(date.getHours()) + '-'+ 
	       pad(date.getMinutes()) + '-' + 
               pad(date.getSeconds());
}

/* O mighty Diffcam */
var DiffCamEngine = (function() {
	var stream;					// stream obtained from webcam
	var video;					// shows stream
	var captureCanvas;			// internal canvas for capturing full images from video
	var captureContext;			// context for capture canvas
	var diffCanvas;				// internal canvas for diffing downscaled captures
	var diffContext;			// context for diff canvas
	var motionCanvas;			// receives processed diff images
	var motionContext;			// context for motion canvas

	var initSuccessCallback;	// called when init succeeds
	var initErrorCallback;		// called when init fails
	var startCompleteCallback;	// called when start is complete
	var captureCallback;		// called when an image has been captured and diffed

	var captureInterval;		// interval for continuous captures
	var captureIntervalTime;	// time between captures, in ms
	var captureWidth;			// full captured image width
	var captureHeight;			// full captured image height
	var diffWidth;				// downscaled width for diff/motion
	var diffHeight;				// downscaled height for diff/motion
	var isReadyToDiff;			// has a previous capture been made to diff against?
	var pixelDiffThreshold;		// min for a pixel to be considered significant
	var scoreThreshold;			// min for an image to be considered significant
	var includeMotionBox;		// flag to calculate and draw motion bounding box
	var includeMotionPixels;	// flag to create object denoting pixels with motion

	function init( options ) {
		// sanity check
		if (!options) {
			throw 'No options provided';
		}

		// incoming options with defaults
		video = options.video; // using player1.canvas || document.createElement('video');
		motionCanvas = options.motionCanvas || createCanvas(_width, _height);
		captureIntervalTime = options.captureIntervalTime || 100;
		captureWidth = options.captureWidth || _width;
		captureHeight = options.captureHeight || _height;
		diffWidth = options.diffWidth || 64;
		diffHeight = options.diffHeight || 48;
		pixelDiffThreshold = options.pixelDiffThreshold || 32;
		scoreThreshold = options.scoreThreshold || 16;
		includeMotionBox = options.includeMotionBox || false;
		includeMotionPixels = options.includeMotionPixels || false;

		// callbacks
		initSuccessCallback = options.initSuccessCallback || function() {};
		initErrorCallback = options.initErrorCallback || function() {};
		startCompleteCallback = options.startCompleteCallback || function() {};
		captureCallback = options.captureCallback || function() {};

		// non-configurable
		captureCanvas = createCanvas(_width, _height);
		diffCanvas = createCanvas(_width, _height);
		isReadyToDiff = false;

		// prep video
		//video.autoplay = true;

		// prep capture canvas
		captureCanvas.width = captureWidth;
		captureCanvas.height = captureHeight;
		captureContext = captureCanvas.getContext('2d');

		// prep diff canvas
		diffCanvas.width = diffWidth;
		diffCanvas.height = diffHeight;
		diffContext = diffCanvas.getContext('2d');

		// prep motion canvas
		motionCanvas.width = diffWidth;
		motionCanvas.height = diffHeight;
		motionContext = motionCanvas.getContext('2d');

		//requestWebcam();
		initSuccessCallback();
	}

	function requestWebcam() {
		var constraints = {
			audio: false,
			video: { width: captureWidth, height: captureHeight }
		};

		navigator.mediaDevices.getUserMedia(constraints)
			.then(initSuccess)
			.catch(initError);
	}

	function initSuccess(requestedStream) {
		stream = requestedStream;
		initSuccessCallback();
	}

	function initError(error) {
		console.log(error);
		initErrorCallback();
	}

	function start() {
		//if (!stream) {
		//	throw 'Cannot start after init fail';
		//}

		// streaming takes a moment to start
		//video.addEventListener('canplay', startComplete);
		startComplete();
		//video.srcObject = stream;
	}

	function startComplete() {
		//video.removeEventListener('canplay', startComplete);
		captureInterval = setInterval(capture, captureIntervalTime);
		startCompleteCallback();
	}

	function stop() {
		clearInterval(captureInterval);
		//video.src = '';
		motionContext.clearRect(0, 0, diffWidth, diffHeight);
		isReadyToDiff = false;
	}

	function capture() {
		// save a full-sized copy of capture
		//captureContext.drawImage(video, 0, 0, captureWidth, captureHeight);
		var captureImageData = captureContext.getImageData(0, 0, captureWidth, captureHeight);

		// diff current capture over previous capture, leftover from last time
		diffContext.globalCompositeOperation = 'difference';
		diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);

		var diffImageData = diffContext.getImageData(0, 0, diffWidth, diffHeight);

		if (isReadyToDiff) {
			var diff = processDiff(diffImageData);

			motionContext.putImageData(diffImageData, 0, 0);
			if (diff.motionBox) {
				motionContext.strokeStyle = '#fff';
				motionContext.strokeRect(
					diff.motionBox.x.min + 0.5,
					diff.motionBox.y.min + 0.5,
					diff.motionBox.x.max - diff.motionBox.x.min,
					diff.motionBox.y.max - diff.motionBox.y.min
				);
			}
			captureCallback({
				imageData: captureImageData,
				score: diff.score,
				hasMotion: diff.score >= scoreThreshold,
				motionBox: diff.motionBox,
				motionPixels: diff.motionPixels,
				getURL: function(type='image/png',quality=1.0) {
					return getCaptureUrl(this.imageData, type, quality);
				},
				checkMotionPixel: function(x, y) {
					return checkMotionPixel(this.motionPixels, x, y)
				}
			});
		}

		// draw current capture normally over diff, ready for next time
		diffContext.globalCompositeOperation = 'source-over';
		diffContext.drawImage(video, 0, 0, diffWidth, diffHeight);
		isReadyToDiff = true;
	}

	function processDiff(diffImageData) {
		var rgba = diffImageData.data;

		// pixel adjustments are done by reference directly on diffImageData
		var score = 0;
		var motionPixels = includeMotionPixels ? [] : undefined;
		var motionBox = undefined;

		for (var i = 0; i < rgba.length; i += 4) {
			var pixelDiff = rgba[i] * 0.3 + rgba[i + 1] * 0.6 + rgba[i + 2] * 0.1;
			var normalized = Math.min(255, pixelDiff * (255 / pixelDiffThreshold));

			rgba[i] = 0;
			rgba[i + 1] = normalized;
			rgba[i + 2] = 0;

			if (pixelDiff >= pixelDiffThreshold) {
				score++;
				coords = calculateCoordinates(i / 4);

				if (includeMotionBox) {
					motionBox = calculateMotionBox(motionBox, coords.x, coords.y);
				}

				if (includeMotionPixels) {
					motionPixels = calculateMotionPixels(motionPixels, coords.x, coords.y, pixelDiff);
				}

			}
		}

		return {
			score: score,
			motionBox: score > scoreThreshold ? motionBox : undefined,
			motionPixels: motionPixels
		};
	}

	function calculateCoordinates(pixelIndex) {
		return {
			x: pixelIndex % diffWidth,
			y: Math.floor(pixelIndex / diffWidth)
		};
	}

	function calculateMotionBox(currentMotionBox, x, y) {
		// init motion box on demand
		var motionBox = currentMotionBox || {
			x: { min: coords.x, max: x },
			y: { min: coords.y, max: y }
		};

		motionBox.x.min = Math.min(motionBox.x.min, x);
		motionBox.x.max = Math.max(motionBox.x.max, x);
		motionBox.y.min = Math.min(motionBox.y.min, y);
		motionBox.y.max = Math.max(motionBox.y.max, y);

		return motionBox;
	}

	function calculateMotionPixels(motionPixels, x, y, pixelDiff) {
		motionPixels[x] = motionPixels[x] || [];
		motionPixels[x][y] = true;

		return motionPixels;
	}

	// type: image/jpeg, image/png
	// quality: 0.5, 1.0, 0.1
	function getCaptureUrl(captureImageData, type, quality) {
		// may as well borrow captureCanvas
		captureContext.putImageData(captureImageData, 0, 0);
		//if (type == 'image/png')
		//	return captureCanvas.toDataURL();
		//else
			return captureCanvas.toDataURL(type,quality);
	}

	function checkMotionPixel(motionPixels, x, y) {
		return motionPixels && motionPixels[x] && motionPixels[x][y];
	}

	function getPixelDiffThreshold() {
		return pixelDiffThreshold;
	}

	function setPixelDiffThreshold(val) {
		pixelDiffThreshold = val;
	}

	function getScoreThreshold() {
		return scoreThreshold;
	}

	function setScoreThreshold(val) {
		scoreThreshold = val;
	}

	return {
		// public getters/setters
		getPixelDiffThreshold: getPixelDiffThreshold,
		setPixelDiffThreshold: setPixelDiffThreshold,
		getScoreThreshold: getScoreThreshold,
		setScoreThreshold: setScoreThreshold,

		// public functions
		init: init,
		start: start,
		stop: stop
	};
})();

DiffCamEngine.init({
	//captureIntervalTime: 0,
	video: canvas2, /* the cropped canvas */
	initSuccessCallback: initSuccess,
	initErrorCallback: initError,
	includeMotionBox:true,
	captureCallback: capture
});

