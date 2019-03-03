const Telegraf = require('micro-bot');

require('dotenv').config();

const Bot = new Telegraf(process.env.BOT_TOKEN);

Bot.start((chat) => {
    chat.reply("I have been summoned! Welcome to the game of life!");
});

Bot.help((chat) => {
    chat.reply("My current commands are:\n/update - Get the latest information for the game");
});

Bot.command("update", (chat) => {
    chat.reply("Bot replying to update command");
});

Bot.launch();