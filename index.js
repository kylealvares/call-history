// deployed: https://dashboard.render.com/web/srv-ckf4bn6npffc73fvch8g/deploys/dep-ckf4eiunpffc7390tn6g

require('dotenv').config();

const sadGifs = require('./sad-gifs.json');

const express = require('express');
const Discord = require("discord.js");
const WordFilter = require('bad-words');

const app = express();
const wordFilter = new WordFilter();

app.listen(3000, () => {
    console.log('Call History Discord Bot listening on port...')
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
    const callHistoryChannel = await client.channels.cache.find(channel => channel.name === "🪵-logs");

    if (Member.voice.channel) {
        callHistoryChannel.send(`<@${userID}> joined the call in ${newState.channel}.`);
    } else {
        callHistoryChannel.send(`<@${userID}> has left the call in ${oldState.channel}.`);
    }

    // active members
    const onCallChannel = await client.channels.cache.find(channel => channel.name === "🏓-active");
    const members = newState.channel && newState.channel.members ?
        newState.channel.members.filter(member => !member.user.bot)
        : [];

    // Get the channel you want to delete messages from
    const channel = client.channels.cache.get('1163268114130157660');

    // Fetch the messages in the channel
    channel.messages.fetch().then(messages => {
        channel.bulkDelete(messages);
    });

    if (members.length === 0) {
        onCallChannel.send(`https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447`);
    } else {
        onCallChannel.send(`${newState.channel.name}: ${members.map(member => member.displayName).join(', ')}`);
    }

});

client.login(process.env.TOKEN);

// TODO: When the first person starts the call it should say: <@${userID}> started the call.
// TODO: Vice versa ^ for ending the call