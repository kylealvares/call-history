import { Events } from "discord.js";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    // channel that triggered this event
    const eventChannel = newState.channel || oldState.channel;
    const channels = await newState.client.channels.cache;
    const logsChannel = await channels.get(process.env.LOGS_CHANNEL_ID);
    const activeChannel = await channels.get(process.env.ACTIVE_CHANNEL_ID);

    // skip unless this user joined/left a voice channel
    if (newState.channelId === oldState.channelId) return;

    // log this user's joined/left event
    logsChannel.send(
      `${newState.member.user.displayName} ${
        newState.channel ? "joined" : "left"
      } ${eventChannel.name}`
    );

    // clear activeChannel messages
    await activeChannel.messages.fetch().then((messages) => {
      activeChannel.bulkDelete(messages);
    });

    const voiceChannels = channels.filter((channel) => channel.type === 2);
    const activeMessage = voiceChannels
      .map(
        (channel) =>
          `${channel.name} ▶️ ${channel.members
            .map((member) => member.displayName)
            .join(", ")}`
      )
      .join("\n");

    voiceChannels.every((channel) => channel.members.size === 0)
      ? activeChannel.send(
          "https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447"
        )
      : activeChannel.send(activeMessage);
  },
};
