import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  tags?: string[];
  voiceNote?: string;
}

interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

const THEMES = {
  light: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f5f5f5',
    text: '#333333',
  },
  dark: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#2c3e50',
    text: '#ecf0f1',
  },
  sepia: {
    primary: '#d35400',
    secondary: '#e67e22',
    background: '#f4e5d3',
    text: '#4a4a4a',
  },
};

export const useDiaryApp = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const theme = THEMES[currentTheme];

  useEffect(() => {
    loadEntries();
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [currentTheme, isDarkMode]);

  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem('diaryEntries');
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error('Error loading entries', error);
    }
  };

  const saveEntries = async () => {
    try {
      await AsyncStorage.setItem('diaryEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries', error);
    }
  };

  const loadSettings = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setCurrentTheme(storedTheme as keyof typeof THEMES);
      }
      const storedDarkMode = await AsyncStorage.getItem('darkMode');
      if (storedDarkMode) {
        setIsDarkMode(JSON.parse(storedDarkMode));
      }
    } catch (error) {
      console.error('Error loading settings', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('theme', currentTheme);
      await AsyncStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Error saving settings', error);
    }
  };

  const addEntry = (newEntry: DiaryEntry) => {
    setEntries(prevEntries => [newEntry, ...prevEntries]);
    saveEntries();
  };

  const editEntry = (updatedEntry: DiaryEntry) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
    saveEntries();
  };

  const deleteEntry = (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    saveEntries();
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    setCurrentTheme(isDarkMode ? 'light' : 'dark');
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const filteredEntries = useMemo(() => 
    entries.filter(entry => 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [entries, searchQuery]
  );

  return {
    entries,
    filteredEntries,
    theme,
    isDarkMode,
    searchQuery,
    recording,
    addEntry,
    editEntry,
    deleteEntry,
    toggleTheme,
    setSearchQuery,
    startRecording,
    stopRecording,
  };
};

