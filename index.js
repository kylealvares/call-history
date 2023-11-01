require('dotenv').config();

const Discord = require("discord.js");
const WordFilter = require('bad-words');
const express = require('express');

const app = express();

const wordFilter = new WordFilter();

app.listen(process.env.PORT || 3000, () => {
    console.log('Call History Discord Bot listening on port 3000 ...')
});

app.get("/", (req, res) => {
    res.send("Call History Discord Bot running...");
});

const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });

const logsChannelID = process.env.LOGS_CHANNEL_ID;
const activeChannelID = process.env.ACTIVE_CHANNEL_ID;
const vibesChannelID = process.env.VIBES_CHANNEL_ID;
const voiceChannelID = process.env.VOICE_CHANNEL_ID;

let autoDelete = false;

client.on("messageCreate", message => {

    const vibesChannel = client.channels.cache.get(vibesChannelID);

    const messageContent = message.content.toLowerCase();

    if (messageContent === "vanish") {
        autoDelete = !autoDelete;
        vibesChannel.send(autoDelete ? 'Vanish mode activated' : 'Vanish mode deactivated');
    }

    if (autoDelete) {
        if (message.channelId === vibesChannelID) {
            if (messageContent === "purge" || messageContent === "sudo purge") {
                vibesChannel.send('Cannot purge in vanish mode.');
            } else {
                setTimeout(() => {
                    try {
                        message.delete(delay = 1)
                    } catch (err) {
                        console.error('Auto-delete purging:', err);
                    }
                }, 30000)
            }
        }
    } else {

        // last word can be an additional command
        const cmd = messageContent.split(' ').pop();

        if (message.channelId === vibesChannelID) {
            if (messageContent === "purge") {
                message.channel.messages.fetch()
                    .then(messages => message.channel.bulkDelete(messages.filter(msg => msg.author.id === message.author.id)))
                    .catch(err => console.log('Purging:', err));
            } else if (messageContent === "sudo purge") {
                message.channel.messages.fetch()
                    .then(messages => message.channel.bulkDelete(messages))
                    .catch(err => console.log('Sudo purging:', err));
            } else if (messageContent === "vibes") {
                if (messageContent.includes('vibes')) {
                    const url = `https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_API_KEY}&tag=vibes&rating=g`;
                    fetch(url)
                        .then(res => res.json())
                        .then(json => message.channel.send(json.data.url))
                        .catch(err => console.error(err));
                }
            } else if (cmd[0] === ('/')) {
                let timeout = cmd.slice(1);
                if (!Number.isInteger(Number(timeout))) return;
                setTimeout(() => {
                    try {
                        message.delete(delay = 1)
                    } catch (err) {
                        console.error('Auto-delete purging:', err);
                    }
                }, timeout * 1000)
            }
            return;
        }
    }


    if (messageContent === "jtc") {
        message.channel.send("Lets you know when users join and leave the call");
    } else if (wordFilter.isProfane(messageContent)) {
        const url = `https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_API_KEY}&tag=sad&rating=g`;
        fetch(url)
            .then(res => res.json())
            .then(json => message.channel.send(json.data.url))
            .catch(err => console.error(err));
    }
});

client.on("voiceStateUpdate", async (oldState, newState) => {

    // check if the user has joined or left a voice channel
    if (oldState.channel !== null && newState.channel !== null) return;

    const userID = oldState.id;

    const Guild = client.guilds.cache.get(logsChannelID);
    const Member = Guild.members.cache.get(userID);

    const user = await client.users.cache.find(user => user.id === userID);
    const userIDReference = `<@${userID}>`;
    const callHistoryChannel = await client.channels.cache.find(channel => channel.name === "🪵-logs");

    // send a message to the log channel indicating if the user joined or left the call
    if (Member.voice.channel) {
        callHistoryChannel.send(`${user.username} joined the call.`);
    } else {
        callHistoryChannel.send(`${user.username} has left the call.`);
    }

    // get the active members in the voice channel
    const onCallChannel = await client.channels.cache.find(channel => channel.name === "🏓-active");
    const channel = client.channels.cache.get(voiceChannelID);
    const members = channel.members.map(member => member.displayName);

    // delete previous messages from active channel
    const activeChannel = client.channels.cache.get(activeChannelID);
    activeChannel.messages.fetch().then(messages => {
        activeChannel.bulkDelete(messages);
    });

    // send a message to the active members channel
    if (members.length === 0) {
        onCallChannel.send(`https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447`);
    } else {
        onCallChannel.send(`${channel.name}: ${members.map(member => member).join(', ')}`);
    }

});

client.login(process.env.TOKEN);
