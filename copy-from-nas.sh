#!/bin/bash

mkdir -p cctv/ipcam3substream

cp /mnt/dlink-ccbfee.local/CCTV/ipcam3substream/*.mp4 cctv/ipcam3substream/
echo "Process complete."

paplay "/usr/share/sounds/ubuntu/notifications/Mallet.ogg"
