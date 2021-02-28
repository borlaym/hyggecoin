import { App } from '@slack/bolt';
import { getBlocks, getLastBlock } from './db';

const slackApp = new App({
  signingSecret: process.env.SLACK_APP_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

(async () => {
  // Start your app
  await slackApp.start(Number(process.env.SLACK_PORT) || 8000);

  console.log('⚡️ Bolt app is running!');
})();

slackApp.event('app_home_opened', async ({ event, client, context }) => {
  console.log(context);
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
          }
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});
