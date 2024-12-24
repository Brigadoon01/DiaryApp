import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { DiaryEntry, Theme } from '../types';

interface MoodAnalysisChartProps {
  entries: DiaryEntry[];
  theme: Theme;
}

const MoodAnalysisChart: React.FC<MoodAnalysisChartProps> = ({ entries, theme }) => {
  const moodData = entries
    .filter(entry => entry.mood)
    .slice(-30) // Get last 30 entries with mood
    .map(entry => ({
      date: new Date(entry.date),
      mood: entry.mood === 'happy' ? 5 :
            entry.mood === 'excited' ? 4 :
            entry.mood === 'calm' ? 3 :
            entry.mood === 'neutral' ? 2 :
            entry.mood === 'sad' ? 1 : 0
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const data = {
    labels: moodData.map(d => d.date.toLocaleDateString()),
    datasets: [{
      data: moodData.map(d => d.mood)
    }]
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.textColor }}>Mood Analysis</Text>
      <LineChart
        data={data}
        width={300}
        height={200}
        chartConfig={{
          backgroundColor: theme.backgroundColor,
          backgroundGradientFrom: theme.backgroundColor,
          backgroundGradientTo: theme.backgroundColor,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.primaryColor,
          labelColor: (opacity = 1) => theme.textColor,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.primaryColor
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
};

export default MoodAnalysisChart;

