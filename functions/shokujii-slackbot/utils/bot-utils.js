const isDebug = false;

const sendSlackMessage = async (slackBotData, message) => {
  const botDoc = await slackBotData.reference.get();
  const url = botDoc.data().url;
  const slackMessage = {
    channel: slackBotData.channel_id,
    text: message,
  }

  if (isDebug) {
    const message = JSON.stringify(slackMessage)
    console.log({ url,  message })
    return;
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(slackMessage)
  });
}

export const sendMessage = async (botData, message) => {
  switch (botData.type) {
    case 'slack':
      await sendSlackMessage(botData, message);
    default:
      break;
  }
};

export const getCommunityBots = async (db, communityId) => {
  const bots = await db.collection('communities').doc(communityId).collection('bots').get();
  return bots.docs.map(bot => bot.data());
}

export const getEventUrl = (communityAccount, eventId) => {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}/e/${eventId}`;
}

export const getUserUrl = (userId) => {
  return `https://${process.env.EVENT_HOST}/u/${userId}`;
}
