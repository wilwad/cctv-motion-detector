# cctv-motion-detector
I record 3 cameras 24/7 using my own code (ffmpeg and ONVIF). 
Use Diffcam (a Javascript motion detector) to batch detect and save motion frame in a long list of CCTV videos.
Basically this code will run through video1.mp4 to video-n.mp4 and write frames with motion to motion/ directory. You can leave it running all night. It plays a sound every time it detects motion. 

Included is a basic motion zone editor to graphically allow you to get the X,Y,Width,Height for drawImage() which we use to snip the video and pass that portion to Diffcam. Performance wise it's better to detect motion in the smallest area.

Will write a NodeJS version soon, as it is faster.

```
UI
```
![Interface](https://github.com/wilwad/cctv-motion-detector/blob/master/ui/modet.png)

```
Motion Zone Editor
```
![Interface](https://github.com/wilwad/cctv-motion-detector/blob/master/ui/motion-zone-editor.png)



