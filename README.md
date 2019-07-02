# cctv-motion-detector
Use Diffcam to batch detect and save motion frame in a long list of CCTV videos.

I record 3 cameras 24/7 using my own code (ffmpeg and ONVIF). 
It's a hassle to go through the footage to look for motion after some event occurs thou. 
This code will run through a directory of CCTV videos and save frames with motion (you can define an area of interest).
It uses Diffcam (a Javascript motion detector).

```
UI
```
![Interface](https://github.com/wilwad/cctv-motion-detector/blob/master/ui/modet.png)

```
Motion Zone Editor
```
![Interface](https://github.com/wilwad/cctv-motion-detector/blob/master/ui/motion-zone-editor.png)



