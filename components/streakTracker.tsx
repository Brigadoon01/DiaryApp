import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { DiaryEntry, Theme } from '../types';

interface StreakTrackerProps {
  entries: DiaryEntry[];
  theme: Theme;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ entries, theme }) => {
  const calculateStreak = () => {
    let streak = 0;
    let currentDate = new Date();
    
    // Sort entries by date in descending order
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      if (currentDate.toDateString() === entryDate.toDateString()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (currentDate > entryDate) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  return (
    <View 
      style={[
        tw`items-center justify-center p-4 rounded-2xl mx-4 my-2`,
        {
          backgroundColor: theme.secondaryColor,
          shadowColor: theme.shadowColor || theme.primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4
        }
      ]}
    >
      <Text 
        style={[
          tw`text-base font-semibold mb-1`,
          { color: theme.textColor }
        ]}
      >
        Current Streak
      </Text>
      
      <View style={tw`flex-row items-baseline justify-center`}>
        <Text 
          style={[
            tw`text-5xl font-bold`,
            { color: theme.primaryColor }
          ]}
        >
          {streak}
        </Text>
        <Text 
          style={[
            tw`text-lg ml-2 font-medium`,
            { color: theme.textColor + 'CC' }
          ]}
        >
          days
        </Text>
      </View>
    </View>
  );
};

export default StreakTracker;