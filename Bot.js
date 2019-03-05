require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
    name: String,
    username: String,
    telegram_id: Number,
    date: Date
});

User.index({ name: "text", username: "text", telegram_id: "text" });

let UserModel = mongoose.model("User", User);

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@gameoflifedb-bizxs.mongodb.net/test`, { useNewUrlParser: true })
    .then(console.log("Connected to database"))
    .catch(err => {
        console.log(err);
    });


const port = process.env.PORT || 3000
app.get('/', (req, res) => {
    res.send('Bot is live')
})
app.listen(port, () => {
    console.log(`Bot is listening on port ${port}`)
})

const Telegraf = require('micro-bot');


const Bot = new Telegraf(process.env.BOT_TOKEN);

const Tools = require('./scripts/Tools');

Bot.start((chat) => {
    chat.reply("I have been summoned! Welcome to the game of life!");
});

Bot.help((chat) => {
    chat.reply("My current commands are:\n/list - View all of the players\n/register (your username)- Register to begin tracking your progress\n/remove (username)- To remove a player from the game\n/reset (username) - Reset a player's time");
});

Bot.use((chat, next) => {
    if (chat.updateType === 'message') {
        const text = chat.update.message.text;
        if (text && text.startsWith('/')) {
            const match = text.match(/^\/([^\s]+)\s?(.+)?/)
            let args = []
            let command
            if (match !== null) {
                if (match[1]) {
                    command = match[1]
                }
                if (match[2]) {
                    args = match[2].split(' ')
                }
            }

            chat.state.command = {
                raw: text,
                command,
                args
            }
        }
    }
    return next();
});

Bot.command("register", (chat, next) => {
    if (chat.state.command.args.length != 0) {
        let id = chat.from.id;
        let name = chat.from.first_name;
        let username = chat.state.command.args;
        UserModel.find({ telegram_id: id }, (err, res) => {
            console.log(res);
            if (res.length != 0) {
                chat.reply(`User ${username} has already registered!`);
            } else {
                let user = new UserModel({ name, username, telegram_id: id, date: new Date() });
                console.log(user);
                user.save();
                chat.reply(`Welcome to the Game of Life ${username}!\nPlease view the rules here: https://docs.google.com/document/d/1WFKwrKPXZPmuyqU_-RpGDccXeAR7HZgEHqboOeDgr30`);
            }
        });
    } else {
        chat.reply("Could not register! Please provide your @ username");
    }

});

Bot.command("reset", (chat, next) => {
    Tools.verifyAuth(chat).then(isAuth => {
        if (isAuth) {
            if (chat.state.command.args.length != 0) {
                UserModel.findOne({ username: chat.state.command.args }, (err, res) => {
                    if (res) {
                        UserModel.updateOne({ username: chat.state.command.args }, { date: new Date() }, (err2, res2) => {
                            if (err2 != null) {
                                console.log(err2);
                                chat.reply("There was an error in updating the user: " + chat.state.command.args);
                            } else {
                                chat.reply(`Successfully reset ${chat.state.command.args}!\nUser survived ${Math.round((new Date().getTime() - (res.date.getTime())) / 1000 / 60)} minutes!`);
                            }
                        });
                    } else {
                        chat.reply("Could not find user!");
                    }
                });
            } else {
                chat.reply("You must provide a @ username in order to reset a user!");
            }
        }
    });
});

Bot.command("list", (chat, next) => {
    UserModel.find({}, (err, users) => {
        if (users.length == 0) {
            chat.reply("There are currently 0 registered users");
        } else {
            let u = "";
            for (let i = 0; i < users.length; i++) {
                u += users[i].username + " - " + users[i].date + "\n\n";
            }
            chat.reply("There are currently " + users.length + " registered users: \n" + u);
        }
    });
});

Bot.command("remove", (chat, next) => {
    Tools.verifyAuth(chat).then(isAuth => {
        if (chat.state.command.args.length == 0) {
            chat.reply("Could not remove user! Must provide @ username");
        } else {
            if (isAuth) {
                UserModel.findOneAndDelete({ username: chat.state.command.args }, (err, res) => {
                    if (err) chat.reply("There was an error in deleting the user");
                    else {
                        if (res) {
                            chat.reply("Successfully removed " + chat.state.command.args);
                        } else {
                            chat.reply("Could not find user " + chat.state.command.args);
                        }
                    }
                });
            }
        }
    });
});


Bot.launch();