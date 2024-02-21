import { SlashCommandBuilder } from "discord.js";

// https://discord.com/developers/docs/interactions/application-commands
// use deploy-commands.js to redeploy the command if you need to update the name or description
// the execute() function doesn't need to be redeployed

export const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};
