#!/usr/bin/env node

'use-strict'

var os = require("os");
var hostname = os.hostname();

const NATS_HOST = process.env.NATS_HOST || "nats://127.0.0.1:4222";
const NATS_CLUSTER_ID = process.env.NATS_CLUSTER_ID || "test-cluster";
const NATS_TOPIC_JOBS = process.env.NATS_TOPIC_JOBS || "work_topic";
const NATS_TOPIC_RESULTS = process.env.NATS_TOPIC_RESULTS || "work_results";
const NATS_CLIENT_ID = `worker_${hostname}`;
const NATS_QUEUE = process.env.NATS_QUEUE || "workers";
const HOPS = process.env.HOPS || 10;

setTimeout(() => {
    console.log(`Connecting to ${NATS_HOST}`)

    const sc = require('node-nats-streaming').connect(NATS_CLUSTER_ID, NATS_CLIENT_ID, { servers: [NATS_HOST] })

    sc.on('connect', () => {
        console.log('Connected!')
        // Subscriber can specify how many existing messages to get.
        const opts = sc.subscriptionOptions()
            .setDeliverAllAvailable()

        console.log(`Subcribing to ${NATS_TOPIC_JOBS} as worker on ${NATS_QUEUE}`)

        const subscription = sc.subscribe(NATS_TOPIC_JOBS, NATS_QUEUE, opts)
        subscription.on('message', (msg) => {
            console.log( NATS_CLIENT_ID + ' received a message [' + msg.getSequence() + ']')
            let parsed = JSON.parse(msg.getData())

            if(parsed && !parsed.stops)
                parsed.stops = []

            parsed.stops.push({
                host: NATS_CLIENT_ID,
                timestamp: new Date()
            });

            if(parsed.stops.length < HOPS){
                sc.publish(NATS_TOPIC_JOBS, JSON.stringify(parsed), (err, guid) => {
                    if (err) {
                        console.log('publish failed: ' + err)
                    }
                })
            }else{
                sc.publish(NATS_TOPIC_RESULTS, JSON.stringify(parsed), (err, guid) => {
                    if (err) {
                        console.log('publish failed: ' + err)
                    }
                })
            }
        })
    })

    sc.on('close', () => {
        process.exit()
    })
}, 1000);
