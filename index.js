// imports
import axios from "axios";
import WordFilter from "bad-words";
import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import { formattedQuote } from "./utils.js";
dotenv.config();

// constants
const logsChannelId = process.env.LOGS_CHANNEL_ID;
const activeChannelId = process.env.ACTIVE_CHANNEL_ID;
const vibesChannelId = process.env.VIBES_CHANNEL_ID;
const quotesChannelId = process.env.QUOTES_CHANNEL_ID;
const voiceChannelId = process.env.VOICE_CHANNEL_ID;

// server
const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("🤡 Call History is listening on port", port);
});

app.get("/", (_, res) => {
  res.send("🤡 Call History is running...");
});

// init
const wordFilter = new WordFilter();

let autoDelete = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

// events

// bot wakes up
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.username}`);

  cron.schedule("30 9 * * *", () => {
    const quotesChannel = client.channels.cache.get(quotesChannelId);
    if (quotesChannel) {
      axios.get("https://zenquotes.io/api/today").then((data) => {
        quotesChannel.send(formattedQuote(data));
      });
    } else {
      console.log("Quotes channel not found");
    }
  });

  cron.schedule("0 5 7,21 * *", () => {
    const vibesChannel = client.channels.cache.get(vibesChannelId);
    if (vibesChannel) {
      vibesChannel.messages
        .fetch()
        .then((messages) => vibesChannel.bulkDelete(messages))
        .catch((err) => console.log("Bi-weekly purging:", err));
    } else {
      console.log("Vibes channel not found");
    }
  });
});

// vanish mode (in 😇vibes)
client.on(Events.MessageCreate, (message) => {
  const vibesChannel = client.channels.cache.get(vibesChannelId);
  const messageContent = message.content.toLowerCase();

  // toggle activation
  if (messageContent === "vanish") {
    autoDelete = !autoDelete;
    //TODO: add emojis in front
    vibesChannel.send(
      "Vanish mode " + `(${autoDelete ? "activated" : "deactivated"})`
    );
  }

  if (messageContent === "jtc") {
    message.channel.send("Lets you know when users join and leave the call");
  } else if (wordFilter.isProfane(messageContent)) {
    //TODO: use async/await
    const url = `https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_API_KEY}&tag=sad&rating=g`;
    fetch(url)
      .then((res) => res.json())
      .then((json) => message.channel.send(json.data.url))
      .catch((err) => console.error(err));
  }

  // timed message deletion
  if (autoDelete) {
    if (message.channelId === vibesChannelId) {
      // prevent purges
      if (messageContent === "purge" || messageContent === "sudo purge") {
        vibesChannel.send("Cannot purge in vanish mode.");
      } else {
        setTimeout(() => {
          try {
            message.delete();
          } catch (err) {
            console.error("Auto-delete purging:", err);
          }
        }, 30000);
      }
    }
  } else {
    // last word can be an additional command
    const cmd = messageContent.split(" ").pop();

    if (message.channelId === vibesChannelId) {
      if (messageContent === "purge") {
        message.channel.messages
          .fetch()
          .then((messages) =>
            message.channel.bulkDelete(
              messages.filter(
                (message) => message.author.id === message.author.id
              )
            )
          )
          .catch((err) => console.log("Purging:", err));
      } else if (messageContent === "sudo purge") {
        message.channel.messages
          .fetch()
          .then((messages) => message.channel.bulkDelete(messages))
          .catch((err) => console.log("Sudo purging:", err));
      } else if (messageContent === "vibes") {
        if (messageContent.includes("vibes")) {
          // TODO: change to async/await
          const url = `https://api.giphy.com/v1/gifs/random?api_key=${process.env.GIPHY_API_KEY}&tag=vibes&rating=g`;
          fetch(url)
            .then((res) => res.json())
            .then((json) => message.channel.send(json.data.url))
            .catch((err) => console.error(err));
        }
      } else if (cmd[0] === "/") {
        let timeout = cmd.slice(1);
        if (!Number.isInteger(Number(timeout))) return;
        setTimeout(() => {
          try {
            message.delete();
          } catch (err) {
            console.error("Auto-delete purging:", err);
          }
        }, timeout * 1000);
      }
      return;
    }
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  // check if the user has joined or left a voice channel
  if (oldState.channel !== null && newState.channel !== null) return;

  const userId = oldState.id;

  const Guild = client.guilds.cache.get(oldState.guild.id);
  const Member = Guild.members.cache.get(userId);

  const user = await client.users.cache.find((user) => user.id === userId);
  const logsChannel = client.channels.cache.get(logsChannelId);

  // send a message to the log channel indicating if the user joined or left the call
  logsChannel.send(
    `${user.username} ${Member.voice.channel ? "joined" : "has left"} the call.`
  );

  // get the active members in the voice channel
  const channel = client.channels.cache.get(voiceChannelId);
  const members = channel.members.map((member) => member.displayName);

  // delete previous messages from active channel
  const activeChannel = client.channels.cache.get(activeChannelId);
  activeChannel.messages.fetch().then((messages) => {
    activeChannel.bulkDelete(messages);
  });

  // send a message to the active members channel
  if (members.length === 0) {
    activeChannel.send(
      "https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447"
    );
  } else {
    activeChannel.send(
      `${channel.name}: ${members.map((member) => member).join(", ")}.`
    );
  }
});

client.login(process.env.TOKEN);
