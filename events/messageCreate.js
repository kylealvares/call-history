import { Events } from "discord.js";
import { deleteAllMessages, vibesGif } from "../utils/messages.js";

let autoDelete = false;

export default {
  name: Events.MessageCreate,
  async execute(message) {
    const vibesChannel = message.client.channels.cache.get(
      process.env.VIBES_CHANNEL_ID
    );
    const ttsChannel = message.client.channels.cache.get(
      process.env.TTS_CHANNEL_ID
    );

    const messageContent = message.content.toLowerCase();

    if (message.channelId === ttsChannel.id) {
      if (messageContent === "purge" || messageContent === "sudo purge") {
        await deleteAllMessages(ttsChannel);
      }
    }

    // toggle activation
    if (messageContent === "vanish") {
      autoDelete = !autoDelete;
      //TODO: add emojis in front
      vibesChannel.send(
        "Vanish mode " + `(${autoDelete ? "activated" : "deactivated"})`
      );
    }

    // timed message deletion
    if (autoDelete) {
      if (message.channelId === vibesChannel.id) {
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

      if (message.channelId === vibesChannel.id) {
        if (messageContent === "purge") {
          deleteAllMessages(vibesChannel, message.author);
        } else if (messageContent === "sudo purge") {
          deleteAllMessages(vibesChannel);
        } else if (messageContent === "vibes") {
          if (messageContent.includes("vibes")) {
            message.channel.send(await vibesGif());
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
  },
};
