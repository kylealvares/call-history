import { Events } from "discord.js";
import { activeMembersString } from "../utils/messages.js";

// Debounce timer to batch rapid voice state updates
let updateTimeout = null;
let isProcessing = false;

const processChannelUpdate = async (client, activeChannel) => {
  if (isProcessing) return;

  isProcessing = true;

  try {
    // Get fresh state
    const channels = client.channels.cache;
    const voiceChannels = channels.filter((channel) => channel.type === 2);

    // Clear activeChannel messages
    const messages = await activeChannel.messages.fetch();
    if (messages.size > 0) {
      try {
        await activeChannel.bulkDelete(messages);
      } catch (error) {
        // Ignore errors from concurrent deletions (50034 = Unknown Message, 50008 = Missing Permissions)
        if (error.code !== 50034 && error.code !== 50008) {
          console.log(
            "Failed to clear active channel messages:",
            error.message
          );
        }
      }
    }

    if (voiceChannels.every((channel) => channel.members.size === 0)) {
      await activeChannel.send(
        "https://tenor.com/view/pettyratz-call-me-bored-sad-gif-22155447"
      );
      return;
    }
    await activeChannel.send(activeMembersString(voiceChannels));
  } finally {
    isProcessing = false;
  }
};

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

    // Debounce channel updates to batch rapid events
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      processChannelUpdate(newState.client, activeChannel);
    }, 500);
  },
};
