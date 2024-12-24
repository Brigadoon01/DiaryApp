import { DiaryEntry, Theme } from '@/types';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { PieChart, BarChart, StackedBarChart } from 'react-native-chart-kit';
import tw from 'twrnc';


interface DataVisualizationProps {
  entries: DiaryEntry[];
  theme: Theme;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ entries, theme }) => {
  const moodData = entries.reduce((acc, entry) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(moodData).map(([mood, count], index) => ({
    name: mood,
    population: count,
    color: `hsl(${index * 60}, 70%, 50%)`,
    legendFontColor: theme.textColor,
  }));

  const tagData = entries.reduce((acc, entry) => {
    entry.tags?.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedTags = Object.entries(tagData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const barChartData = {
    labels: sortedTags.map(([tag]) => tag),
    datasets: [
      {
        data: sortedTags.map(([, count]) => count),
      },
    ],
  };

  return (
    <ScrollView style={tw`p-4`}>
      <Text style={[tw`text-xl font-bold mb-4`, { color: theme.textColor }]}>Data Visualization</Text>
      
      <Text style={[tw`text-lg font-semibold mb-2`, { color: theme.textColor }]}>Mood Distribution</Text>
      <PieChart
        data={pieChartData}
        width={300}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
      />

      <Text style={[tw`text-lg font-semibold mt-6 mb-2`, { color: theme.textColor }]}>Top 5 Tags</Text>
      {/* <BarChart
        data={barChartData}
        width={300}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: theme.backgroundColor,
          backgroundGradientFrom: theme.backgroundColor,
          backgroundGradientTo: theme.backgroundColor,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.primaryColor,
          labelColor: (opacity = 1) => theme.textColor,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.primaryColor
          }
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      /> */}
    </ScrollView>
  );
};

export default DataVisualization;

