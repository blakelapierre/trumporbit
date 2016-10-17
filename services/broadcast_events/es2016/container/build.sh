#!/bin/bash

rm -rf app
mkdir app

cp -r ../.dist ./app
cp -r ../node_modules ./app/node_modules

sudo docker build -t trumporbit/broadcast_events .