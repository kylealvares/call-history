import { GIPHY_GIFS_BASE_URL, gifErrorGif, vibesList } from "../constants.js";

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

export const vibesGif = async () => {
  const vibe = vibesList[Math.floor(Math.random() * vibesList.length)];

  const params = new URLSearchParams({
    api_key: process.env.GIPHY_API_KEY,
    q: vibe,
    limit: "50",
    rating: "g",
    bundle: "messaging_non_clips",
  });
  const url = `${GIPHY_GIFS_BASE_URL}/search?${params}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Giphy API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const { data } = json;

    if (!Array.isArray(data) || data.length === 0) {
      return gifErrorGif;
    }

    const randomGif = data[Math.floor(Math.random() * data.length)];
    return randomGif?.images?.original?.url || randomGif?.url || gifErrorGif;
  } catch (error) {
    console.error("Failed to fetch vibes gif:", error);
    return gifErrorGif;
  }
};
