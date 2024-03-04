import { Events } from "discord.js";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    // if (oldState.channel !== null && newState.channel !== null) return; ???????

    if (newState.streaming === !oldState.streaming) return;

    const channelCache = oldState.client.channels.cache;
    const user = oldState.member.user;

    const voiceChannel = await channelCache.get(process.env.VOICE_CHANNEL_ID);
    const logsChannel = await channelCache.get(process.env.LOGS_CHANNEL_ID);
    const activeChannel = await channelCache.get(process.env.ACTIVE_CHANNEL_ID);

    // update logsChannel with join/leave message for this user
    logsChannel.send(
      `**\`${user.displayName}\`** ${
        newState.channel ? "joined" : "left"
      } **\`${voiceChannel.name}\`**`
    );

    // get the active members in the voice channel
    const members = voiceChannel.members.map((member) => member.displayName);

    // clear activeChannel
    await activeChannel.messages.fetch().then((messages) => {
      activeChannel.bulkDelete(messages);
    });

    // send a sad gif if no one is in activeChannel, otherwise list who's in it
    const message =
      members.length === 0
        ? "https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447"
        : `**\`${voiceChannel.name}\`** • ${members.join(", ")}`;
    activeChannel.send(message);
  },
};
