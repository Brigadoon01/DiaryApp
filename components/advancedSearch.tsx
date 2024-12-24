import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Theme, Mood } from '../types';

interface AdvancedSearchProps {
  theme: Theme;
  onSearch: (criteria: SearchCriteria) => void;
}

export interface SearchCriteria {
  text: string;
  startDate: Date | null;
  endDate: Date | null;
  mood: Mood | null;
  tags: string[];
}

const MOODS: Mood[] = ['happy', 'neutral', 'sad', 'excited', 'calm', 'stressed'];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ theme, onSearch }) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    text: '',
    startDate: null,
    endDate: null,
    mood: null,
    tags: [],
  });
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleSearch = () => {
    onSearch(criteria);
  };

  const addTag = () => {
    if (newTag && !criteria.tags.includes(newTag)) {
      setCriteria(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setCriteria(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.textColor,
    },
    input: {
      padding: 8,
      borderRadius: 4,
      marginBottom: 8,
      backgroundColor: theme.secondaryColor,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    dateContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    dateButton: {
      flex: 1,
      padding: 8,
      borderRadius: 4,
      backgroundColor: theme.secondaryColor,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    dateText: {
      color: theme.textColor,
    },
    moodLabel: {
      marginTop: 8,
      marginBottom: 4,
      color: theme.textColor,
    },
    moodScrollView: {
      marginBottom: 8,
    },
    moodButton: {
      padding: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    moodButtonSelected: {
      backgroundColor: theme.primaryColor,
    },
    moodButtonUnselected: {
      backgroundColor: theme.secondaryColor,
    },
    moodText: {
      color: theme.textColor,
    },
    moodTextSelected: {
      color: theme.backgroundColor,
    },
    tagInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    tagInput: {
      flex: 1,
      padding: 8,
      borderRadius: 4,
      backgroundColor: theme.secondaryColor,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    addTagButton: {
      padding: 8,
      borderRadius: 4,
      backgroundColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tagsScrollView: {
      marginTop: 8,
      marginBottom: 8,
    },
    tagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      marginRight: 8,
      backgroundColor: theme.secondaryColor,
      borderWidth: 1,
      borderColor: theme.primaryColor,
    },
    tagText: {
      marginRight: 4,
      color: theme.textColor,
    },
    searchButton: {
      marginTop: 16,
      padding: 12,
      borderRadius: 4,
      backgroundColor: theme.primaryColor,
      alignItems: 'center',
    },
    searchButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.backgroundColor,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Search</Text>
      
      <TextInput
        placeholder="Search text"
        value={criteria.text}
        onChangeText={(text) => setCriteria(prev => ({ ...prev, text }))}
        style={styles.input}
        placeholderTextColor={theme.textColor + '80'}
      />

      <View style={styles.dateContainer}>
        <TouchableOpacity
          onPress={() => setShowStartDate(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateText}>
            {criteria.startDate ? criteria.startDate.toLocaleDateString() : 'Start Date'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setShowEndDate(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateText}>
            {criteria.endDate ? criteria.endDate.toLocaleDateString() : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showStartDate && (
        <DateTimePicker
          value={criteria.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDate(false);
            if (selectedDate) {
              setCriteria(prev => ({ ...prev, startDate: selectedDate }));
            }
          }}
        />
      )}

      {showEndDate && (
        <DateTimePicker
          value={criteria.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDate(false);
            if (selectedDate) {
              setCriteria(prev => ({ ...prev, endDate: selectedDate }));
            }
          }}
        />
      )}

      <Text style={styles.moodLabel}>Mood:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.moodScrollView}
      >
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood}
            onPress={() => setCriteria(prev => ({ 
              ...prev, 
              mood: prev.mood === mood ? null : mood 
            }))}
            style={[
              styles.moodButton,
              criteria.mood === mood ? styles.moodButtonSelected : styles.moodButtonUnselected
            ]}
          >
            <Text style={[
              styles.moodText,
              criteria.mood === mood && styles.moodTextSelected
            ]}>
              {mood}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.tagInputContainer}>
        <TextInput
          placeholder="Add tag"
          value={newTag}
          onChangeText={setNewTag}
          style={styles.tagInput}
          placeholderTextColor={theme.textColor + '80'}
        />
        <TouchableOpacity 
          onPress={addTag}
          style={styles.addTagButton}
        >
          <Feather name="plus" size={24} color={theme.backgroundColor} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tagsScrollView}
      >
        {criteria.tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => removeTag(tag)}
            style={styles.tagContainer}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <Feather name="x" size={16} color={theme.textColor} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={handleSearch}
        style={styles.searchButton}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AdvancedSearch;