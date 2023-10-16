require('dotenv').config();

const sadGifs = require('./sad-gifs.json');
const Discord = require("discord.js");
const WordFilter = require('bad-words');
const express = require('express');

const app = express();

const wordFilter = new WordFilter();

app.listen(3000, () => {
    console.log('Call History Discord Bot listening on port...')
});

app.get("/", (req, res) => {
    res.send("Call History Discord Bot running...");
});

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });

const logsChannelID = process.env.LOGS_CHANNEL_ID;
const activeChannelID = process.env.ACTIVE_CHANNEL_ID;

client.on("messageCreate", message => {
    if (message.content === "jtc") {
        message.channel.send("Lets you know when users join and leave the call");
    } else if (wordFilter.isProfane(message.content)) {
        message.channel.send(sadGifs.gifs[Math.floor(Math.random() * sadGifs.gifs.length)])
    }
})

client.on("voiceStateUpdate", async (oldState, newState) => {

      // check if the user has joined or left a voice channel
    if (oldState.channel !== null && newState.channel !== null) return;

    const userID = oldState.id;

    const Guild = client.guilds.cache.get(logsChannelID);
    const Member = Guild.members.cache.get(userID);

    const user = await client.users.cache.find(user => user.id === userID);
    const username = user.username;
    const callHistoryChannel = await client.channels.cache.find(channel => channel.name === "🪵-logs");

    // send a message to the log channel indicating if the user joined or left the call
    if (Member.voice.channel) {
        callHistoryChannel.send(`<@${userID}> ${user.username} joined the call in ${newState.channel}.`);
    } else {
        callHistoryChannel.send(`<@${userID}> ${user.username} has left the call in ${oldState.channel}.`);
    }

    // get the active members in the voice channel
    const onCallChannel = await client.channels.cache.find(channel => channel.name === "🏓-active");
    const members = newState.channel && newState.channel.members ?
        newState.channel.members.filter(member => !member.user.bot)
        : [];

    // delete previous messages from active channel
    const activeChannel = client.channels.cache.get(activeChannelID); //
    activeChannel.messages.fetch().then(messages => {
        activeChannel.bulkDelete(messages);
    });

      // send a message to the active members channel
    if (members.length === 0) {
        onCallChannel.send(`https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447`);
    } else {
        onCallChannel.send(`${newState.channel.name}: ${members.map(member => member.displayName).join(', ')}`);
    }

});

client.login(process.env.TOKEN);