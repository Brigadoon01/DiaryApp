import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import tw from "twrnc";

interface DiaryEntry {
  id: string;
  content: string;
  date: string;
  mood?: keyof typeof MOODS;
  tags?: string[];
}

const MOODS = {
  happy: "😄",
  sad: "😢",
  angry: "😠",
  neutral: "😐",
} as const;

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  onEntrySelect: (entry: DiaryEntry) => void;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  entries: DiaryEntry[];
  onEntrySelect: (entry: DiaryEntry) => void;
}

export const SearchModal = ({
  visible,
  onClose,
  entries,
  onEntrySelect,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const filteredResults = useMemo(
      () =>
        entries.filter(
          (entry) =>
            entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.tags?.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ),
      [searchQuery, entries]
    );
    setSearchResults(filteredResults);
  }, [searchQuery, entries]);
  const filteredResults = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      ),
    [searchQuery, entries]
  );
  const renderItem = useCallback(
    ({ item }: { item: DiaryEntry }) => (
      <TouchableOpacity
        style={tw`bg-white p-4 rounded-lg mb-2`}
        onPress={() => {
          onEntrySelect(item);
          onClose();
        }}
      >
        <Text style={tw`text-base font-medium`}>
          {item.content.length > 100
            ? `${item.content.substring(0, 100)}...`
            : item.content}
        </Text>
        <View style={tw`flex-row mt-2`}>
          <Text style={tw`text-gray-500`}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          {item.mood && <Text style={tw`ml-2`}>{MOODS[item.mood]}</Text>}
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={tw`flex-row flex-wrap mt-2`}>
            {item.tags.map((tag) => (
              <View
                key={tag}
                style={tw`bg-gray-200 rounded-full px-2 py-1 mr-2 mb-1`}
              >
                <Text style={tw`text-sm text-gray-600`}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    ),
    [onEntrySelect, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1 bg-gray-800/95`}
      >
        <View style={tw`flex-1 mt-12`}>
          <View style={tw`flex-row px-4 items-center bg-white rounded-lg mx-4`}>
            <Feather name="search" size={20} color="gray" />
            <TextInput
              style={tw`flex-1 p-3 text-base`}
              placeholder="Search entries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            style={tw`mt-4`}
            contentContainerStyle={tw`px-4`}
            renderItem={renderItem}
          />
        </View>

        <TouchableOpacity
          style={tw`absolute top-12 right-4 p-2`}
          onPress={onClose}
        >
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};
