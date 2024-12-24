import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import tw from 'twrnc';
import { Category, Theme } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  theme: Theme;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  theme
}) => {
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <ScrollView 
  horizontal 
  style={tw`py-3`} 
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={tw`px-4`}
>
  <TouchableOpacity
    onPress={() => setSelectedCategory(null)}
    style={[
      tw`px-4 py-2 rounded-full mr-3 shadow-sm`,
      {
        backgroundColor: selectedCategory === null ? theme.primaryColor : theme.secondaryColor,
        borderWidth: 1,
        borderColor: theme.primaryColor + '20'
      }
    ]}
  >
    <Text 
      style={[
        tw`font-medium  text-sm`,
        { color: selectedCategory === null ? theme.backgroundColor : theme.textColor }
      ]}
    >
      All
    </Text>
  </TouchableOpacity>
  
  {categories.map(category => (
    <TouchableOpacity
      key={category.id}
      onPress={() => setSelectedCategory(category.id)}
      style={[
        tw`px-4 py-2 rounded-full mr-3 flex-row items-center shadow-sm`,
        {
          backgroundColor: selectedCategory === category.id ? theme.primaryColor : theme.secondaryColor,
          borderWidth: 1,
          borderColor: theme.primaryColor + '20'
        }
      ]}
    >
      <View 
        style={[
          tw`w-3 h-3 rounded-full mr-2`,
          { backgroundColor: category.color || getRandomColor() }
        ]} 
      />
      <Text 
        style={[
          tw`font-medium text-sm`,
          { color: selectedCategory === category.id ? theme.backgroundColor : theme.textColor }
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
  );
};

export default CategoryFilter;

