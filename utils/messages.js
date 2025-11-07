export const deleteAllMessages = async (channel, author) => {
  let messages = await channel.messages.fetch();

  if (author) {
    messages = messages.filter((message) => message.author.id === author.id);
  }

  try {
    console.log(`Purging #${channel.name} using bulkDelete...`);
    await channel.bulkDelete(messages);
  } catch (err) {
    console.log(
      "Sudo purging can't happen cause the messages are over 14 days old. Gonna delete one by one instead."
    );
    for (const message of messages.values()) {
      await message.delete();
    }
  }
};

export const activeMembersString = (voiceChannels) => {
  return voiceChannels
    .filter((channel) => channel.members.size > 0)
    .map(
      (channel) =>
        `${channel.name} → ${channel.members
          .map((member) => member.displayName)
          .join(" • ")}`
    )
    .join("\n");
};
