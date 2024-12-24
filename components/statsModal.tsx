import { DiaryEntry } from "@/types";



export const calculateStatistics = (entries: DiaryEntry[]) => {
  const totalEntries = entries.length;
  const wordCount = entries.reduce((count, entry) => count + entry.content.split(/\s+/).length, 0);
  const moodCounts = entries.reduce((counts, entry) => {
    if (entry.mood) {
      counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No mood data';
  const tagCounts = entries.reduce((counts, entry) => {
    entry.tags?.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, {} as Record<string, number>);
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No tags';

  return {
    totalEntries,
    wordCount,
    topMood,
    topTag,
  };
};
