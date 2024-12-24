import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import tw from 'twrnc';
import { LineChart } from 'react-native-chart-kit';
import { DiaryEntry, Theme, Mood } from '../types';

interface MoodTrackerProps {
  entries: DiaryEntry[];
  theme: Theme;
}

const MOODS: Record<Mood, { emoji: string, value: number }> = {
  happy: { emoji: '😄', value: 5 },
  excited: { emoji: '🎉', value: 4 },
  calm: { emoji: '🧘', value: 3 },
  neutral: { emoji: '😐', value: 2 },
  stressed: { emoji: '😰', value: 1 },
  sad: { emoji: '😔', value: 0 }
};

const MoodTracker: React.FC<MoodTrackerProps> = ({ entries, theme }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [moodData, setMoodData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: []
  });

  useEffect(() => {
    updateMoodData();
  }, [entries, timeRange]);

  const updateMoodData = () => {
    const now = new Date();
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      switch (timeRange) {
        case 'week':
          return entryDate >= new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return entryDate >= new Date(now.setMonth(now.getMonth() - 1));
        case 'year':
          return entryDate >= new Date(now.setFullYear(now.getFullYear() - 1));
      }
    });

    const sortedEntries = filteredEntries.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedEntries.map(entry => {
      const date = new Date(entry.date);
      return timeRange === 'week' 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = sortedEntries.map(entry => 
      entry.mood ? MOODS[entry.mood].value : 0
    );

    setMoodData({ labels, data });
  };

  const getMoodStats = () => {
    const moodCounts = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<Mood, number>);

    const totalEntries = Object.values(moodCounts).reduce((a, b) => a + b, 0);

    return Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / totalEntries) * 100)
    }));
  };

  return (
    <View style={tw`p-4`}>
      {/* Time Range Selector */}
      <View style={tw`flex-row justify-around mb-6`}>
        {['week', 'month', 'year'].map((range) => (
          <TouchableOpacity
            key={range}
            onPress={() => setTimeRange(range as 'week' | 'month' | 'year')}
            style={[
              tw`px-4 py-2 rounded-full`,
              { backgroundColor: timeRange === range ? theme.primaryColor : theme.secondaryColor }
            ]}
          >
            <Text style={{ color: timeRange === range ? theme.backgroundColor : theme.textColor }}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mood Chart */}
      {moodData.data.length > 0 ? (
        <LineChart
          data={{
            labels: moodData.labels,
            datasets: [{ data: moodData.data }]
          }}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: theme.backgroundColor,
            backgroundGradientFrom: theme.backgroundColor,
            backgroundGradientTo: theme.backgroundColor,
            decimalPlaces: 0,
            color: () => theme.primaryColor,
            labelColor: () => theme.textColor,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.primaryColor
            }
          }}
          bezier
          style={tw`rounded-xl`}
        />
      ) : (
        <View style={tw`h-56 justify-center items-center`}>
          <Text style={{ color: theme.textColor }}>No mood data available</Text>
        </View>
      )}

      {/* Mood Statistics */}
      <ScrollView style={tw`mt-6`}>
        <Text style={[tw`text-lg font-bold mb-4`, { color: theme.textColor }]}>Mood Statistics</Text>
        {getMoodStats().map(({ mood, count, percentage }) => (
          <View key={mood} style={[tw`flex-row items-center justify-between mb-2 p-3 rounded-xl`, { backgroundColor: theme.secondaryColor }]}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-xl mr-2`}>{MOODS[mood as Mood].emoji}</Text>
              <Text style={{ color: theme.textColor }}>{mood}</Text>
            </View>
            <Text style={{ color: theme.textColor }}>{count} entries ({percentage}%)</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default MoodTracker;