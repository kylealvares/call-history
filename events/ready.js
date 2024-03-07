import axios from "axios";
import { Events } from "discord.js";
import cron from "node-cron";
import { sendQuote } from "../utils/quotes.js";

export default {
  name: Events.ClientReady,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.username}`);

    cron.schedule("30 9 * * *", async () => {
      await sendQuote(client.channels.cache.get(process.env.QUOTES_CHANNEL_ID));
    });

    cron.schedule("0 5 7,21 * *", async () => {
      const vibesChannel = client.channels.cache.get(
        process.env.VIBES_CHANNEL_ID
      );
      try {
        const messages = await vibesChannel.messages.fetch();
        await vibesChannel.bulkDelete(messages);
      } catch (error) {
        console.error(
          "Failed to bulk delete messages in vibes channel:",
          error
        );
      }
      console.log("Ran bi-weekly purge for vibes channel.");
    });
  },
};
