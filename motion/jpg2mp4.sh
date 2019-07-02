#!/bin/bash

ffmpeg -framerate 5 -pattern_type glob -i '2019-07-02/*.png' -c:v libx264 -r 5 -pix_fmt yuv420p -y 2019-07-02.mp4
#rm "cam110/*.jpeg"

