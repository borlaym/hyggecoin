import { App, UsersSelectAction, ExpressReceiver } from '@slack/bolt';
import { addTransaction, createTransaction, getBalance, getLastBlock } from './db';
import { signTransaction } from './transaction';
import { getSlackWallet } from './wallet';

const receiver = new ExpressReceiver({ signingSecret: process.env.SLACK_APP_SIGNING_SECRET });

const slackApp = new App({
  signingSecret: process.env.SLACK_APP_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

(async () => {
  // Start your app
  await slackApp.start(Number(process.env.SLACK_PORT) || 9000);

  console.log('⚡️ Bolt app is running!');
})();

slackApp.event('app_home_opened', async ({ event, client, context }) => {
  const userId = event.user;
  let wallet = getSlackWallet(userId);
  const myBalance = await getBalance(wallet.publicKey);

  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        "blocks": [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": "Hyggecoin Exchange",
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": `Latest block: ${(await getLastBlock()).hash}`,
              "emoji": true
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": `Your wallet balance: ${myBalance}`,
              "emoji": true
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Send 5 coins to"
            },
            "accessory": {
              "type": "users_select",
              "placeholder": {
                "type": "plain_text",
                "text": "Select conversations",
                "emoji": true
              },
              "action_id": "send5coins"
            }
          },
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

slackApp.action('send5coins', async ({ payload, ack, body, ...others }) => {
  const sender = body.user.id;
  const receiver = (payload as UsersSelectAction).selected_user;
  const senderWallet = getSlackWallet(sender);
  const receiverWallet = getSlackWallet(receiver);
  createTransaction(senderWallet.publicKey, receiverWallet.publicKey, 5)
    .then(transaction => {
      const signedTransaction = signTransaction(transaction, senderWallet.secretKey);
      console.log(signedTransaction);
      addTransaction(signedTransaction)
      .then(() => {
        console.log('success')
        ack();
      })
      .catch(err => ack(err));
    })
    .catch(err => ack(err));
})

export default slackApp;
export { receiver };