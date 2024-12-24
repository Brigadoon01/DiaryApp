import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Theme } from '../types';

interface ThemeCustomizerProps {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ currentTheme, setTheme }) => {
  const themes: Theme[] = [
    {
      name: 'Light',
      backgroundColor: '#ffffff',
      primaryColor: '#0062ff',
      secondaryColor: '#e8f0fe',
      textColor: '#18181b',
    },
    {
      name: 'Dark',
      backgroundColor: '#121212',
      primaryColor: '#60a5fa',
      secondaryColor: '#27272a',
      textColor: '#fafafa',
    },
    {
      name: 'Sepia',
      backgroundColor: '#fdf6e9',
      primaryColor: '#9c4221',
      secondaryColor: '#eaddc7',
      textColor: '#433127',
    },
    {
      name: 'Ocean',
      backgroundColor: '#f0f9ff',
      primaryColor: '#0369a1',
      secondaryColor: '#bae6fd',
      textColor: '#0c4a6e',
    },
    {
      name: 'Forest',
      backgroundColor: '#f1f8f4',
      primaryColor: '#166534',
      secondaryColor: '#bbf7d0',
      textColor: '#14532d',
    },
    {
      name: 'Purple',
      backgroundColor: '#faf5ff',
      primaryColor: '#7e22ce',
      secondaryColor: '#e9d5ff',
      textColor: '#581c87',
    },
    {
      name: 'Sunset',
      backgroundColor: '#fff7ed',
      primaryColor: '#c2410c',
      secondaryColor: '#fed7aa',
      textColor: '#7c2d12',
    },
  ];

  return (
    <View style={tw`p-4`}>
      <Text style={[tw`text-lg font-bold mb-4`, { color: currentTheme.textColor }]}>Choose a theme:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {themes.map((theme, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setTheme(theme)}
            style={[
              tw`mr-4 p-4 rounded-xl`,
              {
                backgroundColor: theme.backgroundColor,
                borderColor: currentTheme.name === theme.name ? theme.primaryColor : 'transparent',
                borderWidth: 2,
                shadowColor: theme.textColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}
          >
            <Text style={[tw`text-lg font-semibold mb-2`, { color: theme.textColor }]}>{theme.name}</Text>
            <View style={tw`flex-row mt-2`}>
              <View 
                style={[
                  tw`w-8 h-8 rounded-full mr-2`, 
                  { backgroundColor: theme.primaryColor, shadowColor: theme.primaryColor, shadowOpacity: 0.3, shadowRadius: 4 }
                ]} 
              />
              <View 
                style={[
                  tw`w-8 h-8 rounded-full`, 
                  { backgroundColor: theme.secondaryColor }
                ]} 
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ThemeCustomizer; 