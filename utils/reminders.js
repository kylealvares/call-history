export const bedtimeReminder = async (client) => {
  const channels = await client.guilds.cache.get(process.env.GUILD_ID).channels
    .cache;
  const voiceChannels = channels.filter((channel) => channel.type === 2);

  const logsChannel = await channels.get(process.env.LOGS_CHANNEL_ID);

  const users = voiceChannels.reduce((acc, channel) => {
    if (channel.members.size > 0) {
      acc.push(...channel.members.map((member) => `<@${member.user.id}>`));
    }
    return acc;
  }, []);
  const remind = users.length > 0;

  if (remind) {
    logsChannel.send(
      `💤 It's bedtime! Time to get some rest → ${users.join(" • ")}`
    );
  }
};
