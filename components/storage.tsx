import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryEntry } from './myDiary';


export const saveEntries = async (entries: DiaryEntry[]) => {
  try {
    await AsyncStorage.setItem('diaryEntries', JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving entries', error);
  }
};

export const loadEntries = async (): Promise<DiaryEntry[]> => {
  try {
    const storedEntries = await AsyncStorage.getItem('diaryEntries');
    if (storedEntries) {
      return JSON.parse(storedEntries);
    }
  } catch (error) {
    console.error('Error loading entries', error);
  }
  return [];
};

export const saveTheme = async (isDarkMode: boolean) => {
  try {
    await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  } catch (error) {
    console.error('Error saving theme', error);
  }
};

export const loadTheme = async (): Promise<boolean | null> => {
  try {
    const storedTheme = await AsyncStorage.getItem('isDarkMode');
    if (storedTheme !== null) {
      return JSON.parse(storedTheme);
    }
  } catch (error) {
    console.error('Error loading theme', error);
  }
  return null;
};

