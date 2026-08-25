const BULK_KEYS = Number(process.env.BULK_KEYS ?? 1200);

export const messages = {
  card: { invitationTitle: "What are you working towards?" },
  bulk: Object.fromEntries(
    Array.from({ length: BULK_KEYS }, (_, i) => [
      `entry${i}`,
      `Some interface copy for entry ${i} that is about as long as a real sentence.`,
    ])
  ),
};
