export const formattedQuote = (res) => {
  const text = `"${res.data[0].q}"`;
  const author = `~ ${res.data[0].a}`;
  return `**${text}**\n*${author}*`;
};
