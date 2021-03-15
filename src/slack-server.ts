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
  await slackApp.start(Number(process.env.PORT) || 9000);

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

slackApp.event('reaction_added', async ({ event, client }) => {
  console.log(event)
  if (event.reaction === 'coin' || event.reaction === 'moneybag' || event.reaction === 'money_with_wings') {
    const sender = event.user;
    const receiver = event.item_user;
    const senderWallet = getSlackWallet(sender);
    const receiverWallet = getSlackWallet(receiver);
    const channel = event.item.type === 'message' ? event.item.channel : null;
    const amount = (() => {
      switch (event.reaction) {
        case 'coin': return 1;
        case 'moneybag': return 5;
        case 'money_with_wings': return 1000;
        default: return 0;
      }
    })()
    createTransaction(senderWallet.publicKey, receiverWallet.publicKey, amount)
    .then(transaction => {
      const signedTransaction = signTransaction(transaction, senderWallet.secretKey);
      addTransaction(signedTransaction)
      .then(() => {
        if (channel) {
          // Notify sender
          client.apiCall('users.info', {
            user: receiver
          }).then(res => {
            const username = (res.user as any).name;
            client.apiCall('chat.postEphemeral', {
              channel,
              user: sender,
              attachments: [],
              icon_emoji: `:${event.reaction}:`,
              link_names: true,
              text: `Successfully sent ${amount} coins to @${username}.`
            }).catch(err => console.error(err))
          }).catch(err => console.error(err));
          // Notify receiver
          Promise.all([
            client.apiCall('users.conversations', {
              types: 'im',
              user: receiver
            }),
            client.apiCall('users.info', {
              user: sender
            })
          ])
          .then(([conversations, senderInfo]) => {
            if (conversations.channels && (conversations.channels as any).length > 0) {
              client.apiCall('chat.postMessage', {
                channel: (conversations.channels as any)[0].id,
                icon_emoji: `:${event.reaction}:`,
                link_names: true,
                text: `Received ${amount} coins from  @${(senderInfo.user as any).name}!`
              }).catch(err => console.error(err))
            }
          })
        }
      })
      .catch(err => {
        console.error(err)
        client.apiCall('chat.postEphemeral', {
          channel,
          user: sender,
          attachments: [],
          icon_emoji: `:warning:`,
          text: `Unable to send coins: ${err}. Please kindly remove the emoji, don\'t hack the system, thank you.`
        }).catch(err => console.error(err))
      });
    })
    .catch(err => {
      console.error(err)
        client.apiCall('chat.postEphemeral', {
          channel,
          user: sender,
          attachments: [],
          icon_emoji: `:warning:`,
          text: `Unable to send coins: ${err}. Please kindly remove the emoji, don\'t hack the system, thank you.`
        }).catch(err => console.error(err))
    });
  }
});

slackApp.action('send5coins', async ({ payload, ack, body }) => {
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