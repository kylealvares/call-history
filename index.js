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

// let autoDelete = false;

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

client.login(process.env.TOKEN);
