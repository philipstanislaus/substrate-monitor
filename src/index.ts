// Import
import { ApiPromise, WsProvider } from '@polkadot/api'
import fetch from 'node-fetch'
import * as mailgun from 'mailgun-js'

require('dotenv').config()

const SUBSTRATE_NODE_WS = process.env.SUBSTRATE_NODE_WS
const NOTIFY_SLACK = false
const NOTIFY_SLACK_URL = process.env.NOTIFY_SLACK_URL
const NOTIFY_EMAIL = true
const NOTIFY_EMAIL_API_KEY = process.env.NOTIFY_EMAIL_API_KEY
const NOTIFY_EMAIL_DOMAIN = process.env.NOTIFY_EMAIL_DOMAIN
const NOTIFY_EMAIL_FROM = process.env.NOTIFY_EMAIL_FROM
const NOTIFY_EMAIL_TO = process.env.NOTIFY_EMAIL_TO

const mg = mailgun({apiKey: NOTIFY_EMAIL_API_KEY, domain: NOTIFY_EMAIL_DOMAIN})

async function monitor() {
    return new Promise(async (resolve) => {
        let unsub: () => void
        try {
            // Construct
            const wsProvider = new WsProvider(SUBSTRATE_NODE_WS)
            const api = await ApiPromise.create({ provider: wsProvider })

            // const last = await api.query.timestamp.now()
            // console.log('last', last)

            unsub = await api.query.timestamp.now((moment: any) => {
                console.log(`The last block has a timestamp of ${moment}, now is ${Date.now()}`)

                // if there was no more block for 30 seconds => notification
                if (moment < Date.now() - 30*1000) {
                    notify(`🚨🚨🚨 [substrate-monitor] Block Production on Flint halted! Connected to ${SUBSTRATE_NODE_WS}`)
                }
            }) as any
        } catch (e) {
            notify(`🚨🚨🚨 [substrate-monitor] Error subscribing timestamp from node ${SUBSTRATE_NODE_WS}: ${e}`)

            if (unsub) { unsub() }

            resolve()
        }
    })

}

async function main() {
    while (true) {
        try {
            await monitor()
        } catch (e) {
            // just log the error, can't do much here to recover
            console.error(e)
        }

        await sleep(60*1000)
    }
}

main()

async function notify(message: string) {
    console.log(message)

    if (NOTIFY_SLACK) {
        const res = await fetch(NOTIFY_SLACK_URL, {
            method: "POST",
            body:    JSON.stringify({
                "text": message,
            }),
            headers: { 'Content-Type': 'application/json' },
        })

        if (res.status != 200) {
            throw new Error(`Error sending Slack Notification, received status ${res.status} ${res.statusText} and message ${await res.text()}`)
        }
    }

    if (NOTIFY_EMAIL) {
        const data = {
            from: NOTIFY_EMAIL_FROM,
            to: NOTIFY_EMAIL_TO,
            subject: message,
            text: message,
        };
        await mg.messages().send(data)
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
