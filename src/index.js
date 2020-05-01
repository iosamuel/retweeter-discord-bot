const eris = require("eris");
const fetch = require("node-fetch");
const Twitter = require("twitter");

require("dotenv").config();

const bot = new eris.Client(process.env.DISCORD_BOT_KEY);

bot.on("ready", () => {
  console.log("Connected and ready.");
});

bot.on("messageCreate", async ({ channel, content }) => {
  if (channel.name === "live-announcements") {
    if (content.match(/https:\/\/(www\.)?twitter\.com\/\w+\/status\/\d+/g)) {
      const query = `
        {
          estreamers {
            id
            username
            access_token
            token_secret
          }
        }
      `;
      fetch(process.env.HASURA_GRAPHQL_URL, {
        method: "post",
        Accept: "api_version=2",
        "Content-Type": "application/graphql",
        body: JSON.stringify({ query }),
        headers: {
          "X-Hasura-Admin-Secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET
        }
      })
        .then(res => res.json())
        .then(({ data: { estreamers } }) => {
          estreamers.forEach(estreamer => {
            const client = new Twitter({
              consumer_key: process.env.TWITTER_API_KEY,
              consumer_secret: process.env.TWITTER_SECRET_API_KEY,
              access_token_key: estreamer.access_token,
              access_token_secret: estreamer.token_secret
            });
            const id = content.match(/(\d+)/g);

            client.post(`statuses/retweet/${id}`, function () {
              console.log("Retweeted! ", id);
            });
          });
        })
        .catch(err => {
          console.error("Error:", err);
        });
    }
  }
});

bot.on("error", err => {
  console.warn(err);
});

bot.connect();
