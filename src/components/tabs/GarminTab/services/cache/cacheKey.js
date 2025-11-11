const sanitize = (value) => {
  if (!value) return 'none';
  return String(value).replace(/[\s:]+/g, '_');
};

export const buildCacheKey = (rangeInfo = {}, context = {}, schemaVersion = 'v1') => {
  const mode = context.forceMode || 'auto';
  const includeToday = context.includeToday ? '1' : '0';
  const start = sanitize(rangeInfo.startDate);
  const end = sanitize(rangeInfo.endDate);
  const lastSync = sanitize(rangeInfo.lastSyncTimestamp);
  return `garmin:${schemaVersion}:${mode}:${start}:${end}:${includeToday}:${lastSync}`;
};
