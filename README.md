# substrate-monitor

substrate-monitor is a tiny monitoring service that monitors block production of a substrate chain. Whenever the latest block is older than 30 seconds, it sends emails and/or slack notifications as configured in a .env file.

## Prerequisites

1. You need node.js installed locally
1. If you want to receive notifications via email, you need a mailgun account: https://www.mailgun.com/
1. If you want to receive notifications via Slack, you need to setup an incoming webhook: https://api.slack.com/messaging/webhooks#getting-started

## Config

`cp .env.example .env` and adjust the values

## Running

`./run.sh`
