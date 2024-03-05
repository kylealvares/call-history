import axios from "axios";

export const sendQuote = async (channel) => {
  try {
    const dailyQuote = (await axios.get("https://zenquotes.io/api/today"))
      .data[0];
    const text = `"${dailyQuote.q}"`;
    const author = `~ ${dailyQuote.a}`;
    await channel.send(`**${text}**\n*${author}*`);
  } catch (error) {
    console.error("Failed to fetch and send quote:", error);
  }
};
