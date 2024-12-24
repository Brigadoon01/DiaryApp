import React from 'react';
import DiaryApp from '@/components/myDiary';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Index() {
  return (
    <ThemeProvider>
      <DiaryApp />
    </ThemeProvider>
  );
}

