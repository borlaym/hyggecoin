import { App, UsersSelectAction, ExpressReceiver } from '@slack/bolt';
import { addTransaction, createTransaction, getBalance, getLastBlock } from './db';
import { signTransaction } from './transaction';
import { ensureSlackWallet, getSlackWallet } from './wallet';

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
  let wallet = await ensureSlackWallet(userId);
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
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": `Your hyggecoin address: ${wallet.publicKey}`,
              "emoji": true
            }
          },
          {
            "type": "section",
            "text": {
              "type": "plain_text",
              "text": `Your secret key: ${wallet.secretKey}`,
              "emoji": true
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
  if (event.reaction === 'hyggecoin-bronze' || event.reaction === 'hyggecoin-silver' || event.reaction === 'hyggecoin-gold') {
    const sender = event.user;
    const receiver = event.item_user;
    const senderWallet = await ensureSlackWallet(sender);
    const receiverWallet = await ensureSlackWallet(receiver);
    const channel = event.item.type === 'message' ? event.item.channel : null;
    const amount = (() => {
      switch (event.reaction) {
        case 'hyggecoin-bronze': return 1;
        case 'hyggecoin-silver': return 5;
        case 'hyggecoin-gold': return 10;
        default: return 0;
      }
    })()
    createTransaction(senderWallet.publicKey, receiverWallet.publicKey, null, amount)
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
                text: `Received ${amount} coins from @${(senderInfo.user as any).name}!`
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

slackApp.command('/hyggecoin', async ({ command, ack, client, respond }) => {
  const sender = command.user_id;
  const [receiverHandle, amount, ...optionalMessage] = command.text.split(' ');
  ack();
  if (!receiverHandle || !amount) {
    respond({
      text: 'Not valid syntax for command',
      response_type: 'ephemeral'
    });
    return;
  }
  client.apiCall('users.list').then(async (res) => {
    const receiverUser = (res.members as any).find((member: any) => member.name === receiverHandle.replace('@', ''));
    if (!receiverUser) {
      respond({
        text: 'Can\'t find user',
        response_type: 'ephemeral'
      });
      return;
    }
    const senderWallet = await ensureSlackWallet(sender);
    const receiverWallet = await ensureSlackWallet(receiverUser.id);
    createTransaction(senderWallet.publicKey, receiverWallet.publicKey, optionalMessage && optionalMessage.length > 0 ? optionalMessage.join(' ') : null, Number(amount))
      .then(transaction => {
        const signedTransaction = signTransaction(transaction, senderWallet.secretKey);
        addTransaction(signedTransaction)
        .then(() => {
            // Notify sender
            respond({
              text: `Successfully sent ${amount} coins to ${receiverUser.real_name}!`,
              response_type: 'ephemeral'
            });
            // Notify receiver
            Promise.all([
              client.apiCall('users.conversations', {
                types: 'im',
                user: receiverUser.id
              }),
              client.apiCall('users.info', {
                user: sender
              })
            ])
            .then(([conversations, senderInfo]) => {
              if (conversations.channels && (conversations.channels as any).length > 0) {
                client.apiCall('chat.postMessage', {
                  channel: (conversations.channels as any)[0].id,
                  link_names: true,
                  text: `Received ${amount} coins from ${(senderInfo.user as any).real_name}!${optionalMessage && optionalMessage.length > 0 ? ` They included the following message: "${optionalMessage.join(' ')}"` : ''}`
                }).catch(err => console.error(err))
              }
            })
        })
        .catch(err => {
          console.error(err);
          respond({
            text: err.message,
            response_type: 'ephemeral'
          });
        });
      })
      .catch(err => {
        console.error(err);
        respond({
          text: err.message,
          response_type: 'ephemeral'
        });
      });
  });
});

export default slackApp;
export { receiver };