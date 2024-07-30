import { Events } from "discord.js";
import cron from "node-cron";
import { sendQuote } from "../utils/quotes.js";
import { bedtimeReminder } from "../utils/reminders.js";
import { deleteAllMessages } from "../utils/messages.js";

export default {
  name: Events.ClientReady,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.username}`);

    // periodic quotes
    cron.schedule("30 9 * * *", async () => {
      await sendQuote(client.channels.cache.get(process.env.QUOTES_CHANNEL_ID));
    });

    // bedtime reminders
    cron.schedule("30 23 * * *", async () => {
      await bedtimeReminder(client);
    });

    // periodic vibes channel message deletion
    cron.schedule("0 5 7,20 * *", async () => {
      console.log("Running bi-weekly purge for 😇-vibes channel.");
      await deleteAllMessages(vibesChannel);
    });
  },
};
