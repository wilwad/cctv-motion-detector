# cctv-motion-detector
Use Diffcam to batch detect and save motion frame in a long list of CCTV videos.
Basically this code will run through video1.mp4 to video-n.mp4 and write frames with motion to motion/ directory. You can leave it running all night. It plays a sound every time it detects motion. Will write a NodeJS version soon, as it is faster.

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



