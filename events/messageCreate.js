import { Events } from "discord.js";

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

    // TODO: separate function for tts channel
    if (message.channelId === ttsChannel.id) {
      if (messageContent === "purge" || messageContent === "sudo purge") {
        message.channel.messages
          .fetch()
          .then((messages) => message.channel.bulkDelete(messages))
          .catch((err) => console.log("Sudo purging:", err));
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
  },
};
