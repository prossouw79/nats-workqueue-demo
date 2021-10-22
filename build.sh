#!/bin/bash

docker build -t registry.pieterdev.com/node-nats:latest .
docker push	registry.pieterdev.com/node-nats:latest