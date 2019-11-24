// Import
import { ApiPromise, WsProvider } from '@polkadot/api'
import fetch from 'node-fetch'

const SUBSTRATE_NODE_WS = 'ws://127.0.0.1:9944'
const SLACK_URL = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX'

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
                // console.log(`The last block has a timestamp of ${moment}, now is ${Date.now()}`)

                // if there was no more block for 30 seconds => notification
                if (moment < Date.now() - 30*1000) {
                    notify(`🚨🚨🚨 [substrate-monitor] Block Production on Flint halted! Connected to ${SUBSTRATE_NODE_WS}`)
                }
            })
        } catch (e) {
            notify(`🚨🚨🚨 [substrate-monitor] Error subscribing timestamp from node ${SUBSTRATE_NODE_WS}: ${e}`)

            if (unsub) { unsub() }

            resolve()
        }
    })

}

async function main() {
    while (true) {
        await monitor()

        await sleep(60*1000)
    }
}

main()

async function notify(message: string) {
    const res = await fetch(SLACK_URL, {
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
