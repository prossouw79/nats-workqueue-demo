#!/usr/bin/env node

'use-strict'

const { v4: uuidv4 } = require('uuid')
const fs = require('fs');

const NATS_HOST = process.env.NATS_HOST || "nats://127.0.0.1:4222";
const NATS_CLUSTER_ID = process.env.NATS_CLUSTER_ID || "test-cluster";
const NATS_TOPIC_JOBS = process.env.NATS_TOPIC_JOBS || "work_topic";
const NATS_TOPIC_RESULTS = process.env.NATS_TOPIC_RESULTS || "work_results";
const NATS_CLIENT_ID = process.env.NATS_CLIENT_ID || "employer_pub";


let results = [];

setInterval(() => {
    if (results.length > 0) {

        if (!fs.existsSync("results")){
            fs.mkdirSync("results");
        }

        fs.writeFile('results/collection.json', JSON.stringify(results, null, 2), function (err) {
            if (err) return console.log(err);
        });
    }
}, 3000);


setTimeout(() => {

    console.log(`Connecting to ${NATS_HOST}`)

    const sc = require('node-nats-streaming').connect(NATS_CLUSTER_ID, NATS_CLIENT_ID, { servers: [NATS_HOST] })

    sc.on('connect', () => {
        console.log('connected')

        const opts = sc.subscriptionOptions()
            .setDeliverAllAvailable()
        const subscription = sc.subscribe(NATS_TOPIC_RESULTS, opts)
        subscription.on('message', (msg) => {
            console.log(NATS_CLIENT_ID + ' received a message [' + msg.getSequence() + ']')
            let parsed = JSON.parse(msg.getData())
            results.push(parsed);
        })

        setInterval(() => {

            let msg = {
                uid: uuidv4(),
                stops: []
            }

            // console.log('Sending message')
            sc.publish(NATS_TOPIC_JOBS, JSON.stringify(msg), (err, guid) => {
                if (err) {
                    console.log('publish failed: ' + err)
                } else {
                    // console.log('published message with guid: ' + guid)
                }
            })
        }, 1000);
    })

    sc.on('close', () => {
        process.exit()
    })
}, 1000);