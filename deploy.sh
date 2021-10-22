#!/bin/bash

docker stack rm nats-hops

docker stack deploy -c docker-compose.yml nats-hops