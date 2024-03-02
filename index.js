import WordFilter from "bad-words";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// constants
const vibesChannelId = process.env.VIBES_CHANNEL_ID;
const quotesChannelId = process.env.QUOTES_CHANNEL_ID;

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

// read slash commands

client.commands = new Collection();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    let command = await import(
      process.platform === "win32"
        ? `file://${filePath.replace(/\\/g, "/")}`
        : filePath
    );

    command = command[file.split(".")[0]];
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// read events

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);

  const event = await import(
    process.platform === "win32"
      ? `file://${filePath.replace(/\\/g, "/")}`
      : filePath
  );

  if (event.default.once) {
    client.once(event.default.name, (...args) =>
      event.default.execute(...args)
    );
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

// events

// vanish mode (in 😇vibes)
client.on(Events.MessageCreate, async (message) => {
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
              messages.filter((mes) => mes.author.id === message.author.id)
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

client.login(process.env.TOKEN);
