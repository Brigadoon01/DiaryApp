import React from "react";
import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import tw from "twrnc";
import { DiaryEntry, Theme, Mood } from "../types";
import { playAudio } from "../utils/audioRecorder";
import HTML from "react-native-render-html";
import { format, isValid, parseISO } from "date-fns";

interface DiaryEntryProps {
  entry: DiaryEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
  onPress: (entry: DiaryEntry) => void;
  theme: Theme;
}

const moodEmojis: Record<Mood, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  excited: "🤩",
  calm: "😌",
  stressed: "😫"
};

const DiaryEntryComponent: React.FC<DiaryEntryProps> = ({
  entry,
  onDelete,
  onEdit,
  onPress,
  theme,
}) => {
  const getMoodEmoji = (mood: Mood | undefined): string => {
    if (!mood) return "";
    return moodEmojis[mood] || mood;
  };
  const handlePlayAudio = async () => {
    if (entry.voiceNote) {
      try {
        await playAudio(entry.voiceNote);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  return (
    <Pressable
      onPress={() => onPress(entry)}
      style={({ pressed }) => [tw`mb-6`, pressed && tw`opacity-90`]}
    >
      <View
        style={[
          tw`rounded-2xl shadow-lg`,
          {
            backgroundColor: theme.secondaryColor,
            shadowColor: theme.textColor,
            shadowOpacity: 0.1,
            shadowRadius: 15,
          },
        ]}
      >
        {/* Header Section */}
        <View style={tw`p-5 border-b border-gray-200/10`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={[tw`text-medium font-medium`, { color: theme.textColor }]}>
              {entry.date}
            </Text>
            {entry.mood && (
              <Text style={tw`text-2xl`}>
                {getMoodEmoji(entry.mood)}
              </Text>
            )}
          </View>
          
          {entry.category && (
            <View style={tw`mt-2`}>
              <Text style={[tw`text-sm`, { color: `${theme.textColor}99` }]}>
                {entry.category}
              </Text>
            </View>
          )}
        </View>
        {/* Content Section */}
        <View style={tw`p-5`}>
          <HTML
            source={{ html: entry.content }}
            contentWidth={300}
            tagsStyles={{
              p: {
                color: theme.textColor,
                marginVertical: 8,
                lineHeight: 24,
                fontSize: 16,
              },
              h1: {
                color: theme.textColor,
                fontSize: 24,
                fontWeight: "700",
                marginVertical: 12,
                lineHeight: 32,
              },
              h2: {
                color: theme.textColor,
                fontSize: 20,
                fontWeight: "600",
                marginVertical: 10,
                lineHeight: 28,
              },
              ul: {
                color: theme.textColor,
                marginLeft: 20,
                marginVertical: 8,
              },
              ol: {
                color: theme.textColor,
                marginLeft: 20,
                marginVertical: 8,
              },
              li: {
                marginVertical: 4,
                lineHeight: 24,
              },
            }}
          />

          {/* Images Grid */}
          {entry.images && entry.images.length > 0 && (
            <View style={tw`mt-4 flex-row flex-wrap`}>
              {entry.images.map((image, index) => (
                <View
                  key={index}
                  style={tw`mr-2 mb-2 rounded-lg overflow-hidden shadow-sm`}
                >
                  <Image source={{ uri: image }} style={tw`w-24 h-24`} />
                </View>
              ))}
            </View>
          )}

          {/* Voice Note */}
          {entry.voiceNote && (
            <TouchableOpacity
              onPress={handlePlayAudio}
              style={[
                tw`mt-4 flex-row items-center p-3 rounded-lg`,
                { backgroundColor: `${theme.primaryColor}20` },
              ]}
            >
              <Feather
                name="play-circle"
                size={24}
                color={theme.primaryColor}
              />
              <Text
                style={[tw`ml-2 font-medium`, { color: theme.primaryColor }]}
              >
                Play Voice Note
              </Text>
            </TouchableOpacity>
          )}

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <View style={tw`mt-4 flex-row flex-wrap`}>
              {entry.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    tw`px-3 py-1.5 rounded-full mr-2 mb-2`,
                    { backgroundColor: `${theme.primaryColor}15` },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-sm font-medium`,
                      { color: theme.primaryColor },
                    ]}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View
          style={[
            tw`px-5 py-4 flex-row justify-end border-t`,
            { borderColor: `${theme.textColor}10` },
          ]}
        >
          <TouchableOpacity
            onPress={() => onEdit(entry)}
            style={[
              tw`mr-4 p-2 rounded-full`,
              { backgroundColor: `${theme.primaryColor}15` },
            ]}
          >
            <Feather name="edit-2" size={18} color={theme.primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(entry.id)}
            style={[tw`p-2 rounded-full`, { backgroundColor: "#ff000015" }]}
          >
            <Feather name="trash-2" size={18} color="#ff0000" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

export default DiaryEntryComponent;
