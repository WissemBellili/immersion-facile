#!/bin/bash

source /home/docker/.env

if [ "$ENV_TYPE" != "production" ];
then
	exit 0;
fi

DAY=`date +%A`
NICE="/usr/bin/nice -n 15"

LOCAL_DIR="/home/backup";
DIST_DIR="/mnt/backups";
FILENAME="docker_$DAY.tar.bz2";

mkdir -p $DIST_DIR;

$NICE tar --exclude=cache/* --exclude=*.log --exclude=*.gz --exclude=*.bz2 -C /home/docker/immersion-facile/docker-data -I pbzip2 -cf - . | tee $LOCAL_DIR/$FILENAME $DIST_DIR/$FILENAME >/dev/null;
