exports.timeFrameToDate = (timeframe) => {
  const now = new Date();

  switch (timeframe) {
    case 'today':
      return {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      };
    case 'yesterday':
      return {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      };
    case 'this_week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return { $gte: startOfWeek, $lt: endOfWeek };
    case 'last_week':
      const startOfLastWeek = new Date(now);
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);
      return { $gte: startOfLastWeek, $lt: endOfLastWeek };
    case 'this_month':
      return {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      };
    default:
      return { $gte: new Date(0), $lt: new Date(8640000000000000) }; // All time
  }
};
