require('dotenv').config();

const sadGifs = require('./sad-gifs.json');

const express = require('express');
const Discord = require("discord.js");
const WordFilter = require('bad-words');

const app = express();
const wordFilter = new WordFilter();

app.listen(3000, () => {
    console.log('Call History Discord Bot running...')
});

app.get("/", (req, res) => {
    res.send("Call History Discord Bot running...");
});

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });

const channelID = process.env.CHANNEL_ID;

client.on("messageCreate", message => {
    if (message.content === "jtc") {
        message.channel.send("Lets you know when users join and leave the call");
    } else if (wordFilter.isProfane(message.content)) {
        message.channel.send(sadGifs.gifs[Math.floor(Math.random() * sadGifs.gifs.length)])
    }
})

client.on("voiceStateUpdate", async (oldState, newState) => {

    if (oldState.channel !== null && newState.channel !== null) return;

    const userID = oldState.id;

    const Guild = client.guilds.cache.get(channelID);
    const Member = Guild.members.cache.get(userID);

    const user = await client.users.cache.find(user => user.id === userID);
    const username = user.username;
    const channel = await client.channels.cache.find(channel => channel.name === "call-history");


    if (Member.voice.channel) {
        channel.send(`<@${userID}> joined the call in ${newState.channel}.`);
    } else {
        channel.send(`<@${userID}> has left the call in ${oldState.channel}.`);
    }


});

client.login(process.env.TOKEN);

// TODO: When the first person starts the call it should say: <@${userID}> started the call.
// TODO: Vice versa ^ for ending the call