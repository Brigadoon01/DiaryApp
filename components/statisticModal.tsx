import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import tw from 'twrnc';
import { DiaryEntry, Theme } from '../types';
import { calculateStatistics } from './statsModal';

interface StatisticsModalProps {
  isVisible: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  theme: Theme;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isVisible, onClose, entries, theme }) => {
  const stats = calculateStatistics(entries);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[tw`bg-white rounded-xl p-6 w-5/6`, { backgroundColor: theme.backgroundColor }]}>
          <Text style={[tw`text-xl font-bold mb-4`, { color: theme.textColor }]}>Your Diary Statistics</Text>
          <Text style={[tw`mb-2`, { color: theme.textColor }]}>Total Entries: {stats.totalEntries}</Text>
          <Text style={[tw`mb-2`, { color: theme.textColor }]}>Total Words: {stats.wordCount}</Text>
          <Text style={[tw`mb-2`, { color: theme.textColor }]}>Most Used Mood: {stats.topMood}</Text>
          <Text style={[tw`mb-4`, { color: theme.textColor }]}>Most Used Tag: {stats.topTag}</Text>
          <TouchableOpacity onPress={onClose} style={[tw`bg-blue-500 p-2 rounded-xl`, { backgroundColor: theme.primaryColor }]}>
            <Text style={[tw`text-center text-white`, { color: theme.backgroundColor }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default StatisticsModal;

