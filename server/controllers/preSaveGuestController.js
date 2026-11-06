
export const getGuestSession = (req, res) => {
  res.set("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    guest: {
      sessionActive: Boolean(req.guestId),
    },
  });
};
