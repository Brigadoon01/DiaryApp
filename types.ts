export interface DiaryEntry {
  id: string;
  date: string;
  content: string; // This will now be a stringified JSON array
  mood?: Mood;
  tags?: string[];
  category?: string;
  voiceNote?: string;
  images?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Theme {
  name: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export type Mood = 'happy' | 'neutral' | 'sad' | 'excited' | 'calm' | 'stressed';

