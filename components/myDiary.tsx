import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import tw from "twrnc";
import * as ImagePicker from "expo-image-picker";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

import { calculateStatistics } from "./statsModal";
import {
  setPassword,
  verifyPassword,
  isBiometricAvailable,
  authenticateWithBiometrics,
} from "../utils/secureStorage";
import {
  startRecording,
  stopRecording,
  playAudio,
} from "../utils/audioRecorder";
import DiaryEntryComponent from "./diaryEntry";
import RichTextEditor, { RichTextEditorRef } from "./richTextEditor";
import CategoryFilter from "./categoryFilter";
import StatisticsModal from "./statisticModal";
import MoodTracker from "./moodTracker";
import MoodAnalysisChart from "./moodAnalysisChart";
import StreakTracker from "./streakTracker";
import ThemeCustomizer from "./themeCustomizer";
import AdvancedSearch, { SearchCriteria } from "./advancedSearch";
import DataVisualization from "./dataVisualization";
import { DiaryEntry, Category, Mood, Theme } from "../types";
import { useTheme } from "../context/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MOODS: Record<Mood, string> = {
  happy: "😄",
  neutral: "😐",
  sad: "😔",
  excited: "🎉",
  calm: "🧘",
  stressed: "😰",
};

const DiaryApp: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [entryText, setEntryText] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [entryTags, setEntryTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [isMoodTrackerVisible, setIsMoodTrackerVisible] = useState(false);
  const [isThemeCustomizerVisible, setIsThemeCustomizerVisible] =
    useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPasswordState] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAdvancedSearchVisible, setIsAdvancedSearchVisible] = useState(false);
  const [isDataVisualizationVisible, setIsDataVisualizationVisible] =
    useState(false);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(
    null
  );

  const searchBarHeight = useRef(new Animated.Value(0)).current;
  const richTextRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    loadData();
    checkBiometricSupport();
  }, []);

  const loadData = async () => {
    try {
      const loadedEntries = await AsyncStorage.getItem("diaryEntries");
      if (loadedEntries) setEntries(JSON.parse(loadedEntries));

      const loadedCategories = await AsyncStorage.getItem("categories");
      if (loadedCategories) setCategories(JSON.parse(loadedCategories));

      const hasPassword = await AsyncStorage.getItem("hasPassword");
      setIsPasswordSet(hasPassword === "true");
      setIsLocked(hasPassword === "true");
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load your diary data. Please try again.");
    }
  };

  const checkBiometricSupport = async () => {
    const supported = await isBiometricAvailable();
    setIsBiometricSupported(supported);
  };

  useEffect(() => {
    const saveEntries = async () => {
      try {
        await AsyncStorage.setItem("diaryEntries", JSON.stringify(entries));
      } catch (error) {
        console.error("Error saving entries:", error);
        Alert.alert("Error", "Failed to save your entries. Please try again.");
      }
    };
    saveEntries();
  }, [entries]);

  useEffect(() => {
    const saveCategories = async () => {
      try {
        await AsyncStorage.setItem("categories", JSON.stringify(categories));
      } catch (error) {
        console.error("Error saving categories:", error);
        Alert.alert(
          "Error",
          "Failed to save your categories. Please try again."
        );
      }
    };
    saveCategories();
  }, [categories]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (searchCriteria) {
      filtered = filtered.filter((entry) => {
        const matchesText = entry.content
          .toLowerCase()
          .includes(searchCriteria.text.toLowerCase());
        const matchesStartDate =
          !searchCriteria.startDate ||
          new Date(entry.date) >= searchCriteria.startDate;
        const matchesEndDate =
          !searchCriteria.endDate ||
          new Date(entry.date) <= searchCriteria.endDate;
        const matchesMood =
          !searchCriteria.mood || entry.mood === searchCriteria.mood;
        const matchesTags =
          searchCriteria.tags.length === 0 ||
          searchCriteria.tags.some((tag) => entry.tags?.includes(tag));

        return (
          matchesText &&
          matchesStartDate &&
          matchesEndDate &&
          matchesMood &&
          matchesTags
        );
      });
    } else {
      filtered = filtered.filter(
        (entry) =>
          (entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.tags?.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )) &&
          (!selectedCategory || entry.category === selectedCategory)
      );
    }

    return filtered;
  }, [entries, searchQuery, selectedCategory, searchCriteria]);

  const addTag = useCallback(() => {
    if (newTag.trim() && !entryTags.includes(newTag.trim())) {
      setEntryTags((prevTags) => [...prevTags, newTag.trim()]);
      setNewTag("");
    }
  }, [newTag, entryTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setEntryTags((prevTags) => prevTags.filter((tag) => tag !== tagToRemove));
  }, []);

  const addEntry = useCallback(() => {
    if (!entryText.trim()) return;

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      content: entryText.trim(),
      mood: selectedMood || undefined,
      tags: entryTags.length > 0 ? [...entryTags] : undefined,
      category: selectedCategory || undefined,
      voiceNote: recordingUri || undefined,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
    };
    setEntries((prevEntries) => [newEntry, ...prevEntries]);
    resetModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [
    entryText,
    selectedMood,
    entryTags,
    selectedCategory,
    recordingUri,
    selectedImages,
  ]);

  const editEntry = useCallback(() => {
    if (!entryText.trim() || !currentEntry) return;

    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry.id === currentEntry.id
          ? {
              ...entry,
              content: entryText.trim(),
              mood: selectedMood || undefined,
              tags: entryTags.length > 0 ? [...entryTags] : undefined,
              category: selectedCategory || undefined,
              voiceNote: recordingUri || entry.voiceNote,
              images:
                selectedImages.length > 0 ? [...selectedImages] : entry.images,
            }
          : entry
      )
    );
    resetModal();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [
    currentEntry,
    entryText,
    selectedMood,
    entryTags,
    selectedCategory,
    recordingUri,
    selectedImages,
  ]);

  const deleteEntry = useCallback((id: string) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setEntries((prevEntries) =>
            prevEntries.filter((entry) => entry.id !== id)
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, []);

  const openEditModal = useCallback((entry: DiaryEntry) => {
    setCurrentEntry(entry);
    setEntryText(entry.content);
    setSelectedMood(entry.mood || null);
    setEntryTags(entry.tags || []);
    setSelectedCategory(entry.category || null);
    setRecordingUri(entry.voiceNote || null);
    setSelectedImages(entry.images || []);
    setModalVisible(true);
  }, []);

  const resetModal = useCallback(() => {
    setModalVisible(false);
    setCurrentEntry(null);
    setEntryText("");
    setSelectedMood(null);
    setEntryTags([]);
    setNewTag("");
    setSelectedCategory(null);
    setRecordingUri(null);
    setSelectedImages([]);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchVisible((prev) => !prev);
    Animated.timing(searchBarHeight, {
      toValue: isSearchVisible ? 0 : 40,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSearchVisible, searchBarHeight]);

  const handleSetPassword = useCallback(async () => {
    if (password.length < 4) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 4 characters long."
      );
      return;
    }
    try {
      await setPassword(password);
      await AsyncStorage.setItem("hasPassword", "true");
      setIsPasswordSet(true);
      setIsLocked(false);
      setPasswordState("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error setting password:", error);
      Alert.alert("Error", "Failed to set password. Please try again.");
    }
  }, [password]);

  const handleUnlock = useCallback(async () => {
    if (isBiometricSupported) {
      const authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        setIsLocked(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
    }

    try {
      const isCorrect = await verifyPassword(password);
      if (isCorrect) {
        setIsLocked(false);
        setPasswordState("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Incorrect Password", "Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      Alert.alert("Error", "Failed to verify password. Please try again.");
    }
  }, [isBiometricSupported, password]);

  const handleAudioRecording = useCallback(async () => {
    try {
      if (isRecording) {
        const uri = await stopRecording();
        setRecordingUri(uri);
        setIsRecording(false);
      } else {
        await startRecording();
        setIsRecording(true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error handling audio recording:", error);
      Alert.alert(
        "Error",
        "Failed to handle audio recording. Please try again."
      );
    }
  }, [isRecording]);

  const handlePlayAudio = useCallback(async (uri: string) => {
    try {
      await playAudio(uri);
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert("Playback Error", "There was an error playing the audio.");
    }
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setSelectedImages((prevImages) => [
          ...prevImages,
          `data:image/jpeg;base64,${result.assets[0].base64}`,
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const addCategory = useCallback((name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    setCategories((prevCategories) => [...prevCategories, newCategory]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const exportToPDF = useCallback(async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: ${theme.primaryColor}; }
            .entry { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .date { font-weight: bold; }
            .content { margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>My Diary Entries</h1>
          ${entries
            .map(
              (entry) => `
            <div class="entry">
              <div class="date">${entry.date}</div>
              <div class="content">${entry.content}</div>
              ${entry.mood ? `<div>Mood: ${entry.mood}</div>` : ""}
              ${entry.tags ? `<div>Tags: ${entry.tags.join(", ")}</div>` : ""}
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      Alert.alert(
        "Export Failed",
        "There was an error exporting your entries to PDF."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [entries, theme.primaryColor]);

  const handleAdvancedSearch = useCallback((criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setIsAdvancedSearchVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (isLocked) {
    return (
      <SafeAreaView
        style={[tw`flex-1`, { backgroundColor: theme.backgroundColor }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1 justify-center items-center px-6`}
        >
          <View style={tw`w-full max-w-sm`}>
            {/* Logo/Title Section */}
            <View style={tw`mb-12 items-center`}>
              <Feather
                name="book-open"
                size={48}
                color={theme.primaryColor}
                style={tw`mb-4`}
              />
              <Text
                style={[tw`text-4xl font-bold`, { color: theme.primaryColor }]}
              >
                My Diary
              </Text>
            </View>

            {/* Login Card */}
            <View
              style={[
                tw`bg-white rounded-3xl p-6`,
                {
                  shadowColor: theme.primaryColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 5,
                },
              ]}
            >
              <Text
                style={[
                  tw`text-xl mb-6 font-semibold`,
                  { color: theme.primaryColor },
                ]}
              >
                Welcome Back
              </Text>

              {/* Password Input */}
              <View style={tw`mb-6`}>
                <View
                  style={[
                    tw`flex-row items-center border rounded-xl px-4`,
                    { borderColor: theme.primaryColor },
                  ]}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={theme.primaryColor}
                    style={tw`mr-2`}
                  />
                  <TextInput
                    secureTextEntry
                    value={password}
                    onChangeText={setPasswordState}
                    style={[tw`flex-1 py-3`, { color: theme.primaryColor }]}
                    placeholderTextColor={`${theme.primaryColor}80`}
                    placeholder="Enter your password"
                  />
                </View>
              </View>

              {/* Unlock Button */}
              <TouchableOpacity
                onPress={handleUnlock}
                style={[
                  tw`p-4 rounded-xl mb-4`,
                  { backgroundColor: theme.primaryColor },
                ]}
              >
                <View style={tw`flex-row justify-center items-center`}>
                  <Feather
                    name="unlock"
                    size={20}
                    color={theme.backgroundColor}
                    style={tw`mr-2`}
                  />
                  <Text
                    style={[
                      tw`text-center text-lg font-semibold`,
                      { color: theme.backgroundColor },
                    ]}
                  >
                    Unlock Diary
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Biometric Button */}
              {isBiometricSupported && (
                <TouchableOpacity
                  onPress={handleUnlock}
                  style={[
                    tw`p-4 rounded-xl`,
                    {
                      backgroundColor: theme.backgroundColor,
                      borderWidth: 1,
                      borderColor: theme.primaryColor,
                    },
                  ]}
                >
                  <View style={tw`flex-row justify-center items-center`}>
                    <Feather
                      name="fingerprint"
                      size={20}
                      color={theme.primaryColor}
                      style={tw`mr-2`}
                    />
                    <Text
                      style={[
                        tw`text-center text-lg font-semibold`,
                        { color: theme.primaryColor },
                      ]}
                    >
                      Use Biometrics
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[tw`flex-1`, { backgroundColor: theme.backgroundColor }]}
    >
      <StatusBar
        barStyle={theme.name === "Dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={[tw`shadow-md p-4`, { backgroundColor: theme.primaryColor }]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <Text
            style={[tw`text-3xl font-bold`, { color: theme.backgroundColor }]}
          >
            My Diary
          </Text>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity
              onPress={() => setIsThemeCustomizerVisible(true)}
              style={tw`mr-4`}
            >
              <Feather
                name="settings"
                size={24}
                color={theme.backgroundColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsStatsVisible(true)}
              style={tw`mr-4`}
            >
              <Feather
                name="bar-chart-2"
                size={24}
                color={theme.backgroundColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsMoodTrackerVisible(true)}
              style={tw`mr-4`}
            >
              <Feather name="smile" size={24} color={theme.backgroundColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsDataVisualizationVisible(true)}
              style={tw`mr-4`}
            >
              <Feather
                name="pie-chart"
                size={24}
                color={theme.backgroundColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                tw`p-2 rounded-full`,
                { backgroundColor: theme.backgroundColor },
              ]}
              onPress={toggleSearch}
            >
              <Feather
                name={isSearchVisible ? "x" : "search"}
                size={24}
                color={theme.primaryColor}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={{ height: searchBarHeight, overflow: "hidden" }}>
          <TextInput
            placeholder="Search entries..."
            placeholderTextColor={theme.backgroundColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              tw`rounded-xl p-3 mt-4`,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                color: theme.backgroundColor,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => setIsAdvancedSearchVisible(true)}
            style={[
              tw`mt-2 p-2 rounded-xl`,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <Text
              style={[
                tw`text-center font-semibold`,
                { color: theme.primaryColor },
              ]}
            >
              Advanced Search
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      {/* Category Filter */}
      <View style={tw`w-full`}>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          theme={theme}
        />
      </View>

      {/* Streak Tracker */}
      <StreakTracker entries={entries} theme={theme} />

      {/* Entries List */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DiaryEntryComponent
            entry={item}
            onDelete={deleteEntry}
            onEdit={openEditModal}
            onPress={setSelectedEntry}
            theme={theme}
          />
        )}
        contentContainerStyle={tw`p-4 pb-20`}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center mt-20`}>
            <Text style={[tw`text-lg`, { color: theme.textColor }]}>
              {searchQuery
                ? "No matching entries found."
                : "No entries yet. Start writing!"}
            </Text>
          </View>
        }
      />

      {/* Add Entry Button */}
      <TouchableOpacity
        style={[
          tw`absolute bottom-6 right-6 p-4 rounded-full shadow-2xl`,
          { backgroundColor: theme.primaryColor },
        ]}
        onPress={() => {
          resetModal();
          setModalVisible(true);
        }}
      >
        <Feather name="plus" size={28} color={theme.backgroundColor} />
      </TouchableOpacity>

      {/* Entry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <View
            style={[
              tw`flex-1 justify-end`,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                tw`rounded-t-3xl p-6`,
                {
                  backgroundColor: theme.backgroundColor,
                  maxHeight: "90%",
                },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={[
                    tw`text-2xl font-bold mb-6`,
                    { color: theme.textColor },
                  ]}
                >
                  {currentEntry ? "Edit Entry" : "New Entry"}
                </Text>

                {/* Mood Selection */}
                <View style={tw`flex-row justify-between mb-6`}>
                  {Object.entries(MOODS).map(([mood, emoji]) => (
                    <TouchableOpacity
                      key={mood}
                      style={[
                        tw`p-3 rounded-full`,
                        {
                          backgroundColor:
                            selectedMood === mood
                              ? theme.primaryColor
                              : theme.secondaryColor,
                        },
                      ]}
                      onPress={() => setSelectedMood(mood as Mood)}
                    >
                      <Text style={tw`text-3xl`}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Rich Text Editor */}
                <View style={tw`mb-6`}>
                  <RichTextEditor
                    ref={richTextRef}
                    initialContent={entryText}
                    onChangeText={setEntryText}
                    theme={theme}
                  />
                </View>

                {/* Category Selection */}
                <View style={tw`mb-6`}>
                  <Text
                    style={[
                      tw`mb-2 text-lg font-semibold`,
                      { color: theme.textColor },
                    ]}
                  >
                    Category:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => setSelectedCategory(category.id)}
                        style={[
                          tw`px-4 py-2 rounded-full mr-2`,
                          {
                            backgroundColor:
                              selectedCategory === category.id
                                ? theme.primaryColor
                                : theme.secondaryColor,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              selectedCategory === category.id
                                ? theme.backgroundColor
                                : theme.textColor,
                          }}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Tag Input */}
                <View style={tw`flex-row mb-4`}>
                  <TextInput
                    placeholder="Add tags"
                    placeholderTextColor={theme.textColor}
                    value={newTag}
                    onChangeText={setNewTag}
                    style={[
                      tw`flex-1 rounded-xl p-3 mr-2`,
                      {
                        backgroundColor: theme.secondaryColor,
                        color: theme.textColor,
                      },
                    ]}
                    onSubmitEditing={addTag}
                  />
                  <TouchableOpacity
                    onPress={addTag}
                    style={[
                      tw`p-3 rounded-xl`,
                      { backgroundColor: theme.primaryColor },
                    ]}
                  >
                    <Feather
                      name="plus"
                      size={24}
                      color={theme.backgroundColor}
                    />
                  </TouchableOpacity>
                </View>

                {/* Selected Tags */}
                <View style={tw`flex-row flex-wrap mb-6`}>
                  {entryTags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        tw`px-3 py-2 rounded-full mr-2 mb-2 flex-row items-center`,
                        { backgroundColor: theme.secondaryColor },
                      ]}
                    >
                      <Text style={[tw`mr-2`, { color: theme.textColor }]}>
                        #{tag}
                      </Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <Feather
                          name="x"
                          size={16}
                          color={theme.primaryColor}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Voice Note Recording */}
                <TouchableOpacity
                  onPress={handleAudioRecording}
                  style={[
                    tw`p-3 rounded-xl mb-4`,
                    { backgroundColor: theme.primaryColor },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-center font-semibold`,
                      { color: theme.backgroundColor },
                    ]}
                  >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Text>
                </TouchableOpacity>
                {recordingUri && (
                  <TouchableOpacity
                    onPress={() => handlePlayAudio(recordingUri)}
                    style={tw`mb-4 flex-row items-center`}
                  >
                    <Feather name="play" size={24} color={theme.primaryColor} />
                    <Text style={[tw`ml-2`, { color: theme.textColor }]}>
                      Play Voice Note
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Image Attachment */}
                <TouchableOpacity
                  onPress={pickImage}
                  style={[
                    tw`p-3 rounded-xl mb-4`,
                    { backgroundColor: theme.primaryColor },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-center font-semibold`,
                      { color: theme.backgroundColor },
                    ]}
                  >
                    Attach Image
                  </Text>
                </TouchableOpacity>
                {selectedImages.length > 0 && (
                  <ScrollView horizontal style={tw`mb-6`}>
                    {selectedImages.map((image, index) => (
                      <View key={index} style={tw`mr-2`}>
                        <Image
                          source={{ uri: image }}
                          style={tw`w-20 h-20 rounded-xl`}
                        />
                        <TouchableOpacity
                          onPress={() => removeImage(index)}
                          style={tw`absolute top-1 right-1 bg-red-500 rounded-full p-1`}
                        >
                          <Feather name="x" size={12} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Action Buttons */}
                <View style={tw`flex-row justify-between mt-6`}>
                  <TouchableOpacity
                    onPress={resetModal}
                    style={[
                      tw`p-4 rounded-xl flex-1 mr-2`,
                      { backgroundColor: theme.secondaryColor },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-center font-semibold`,
                        { color: theme.textColor },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={currentEntry ? editEntry : addEntry}
                    style={[
                      tw`p-4 rounded-xl flex-1 ml-2`,
                      {
                        backgroundColor: theme.primaryColor,
                        opacity: !entryText.trim() ? 0.5 : 1,
                      },
                    ]}
                    disabled={!entryText.trim()}
                  >
                    <Text
                      style={[
                        tw`text-center font-semibold`,
                        { color: theme.backgroundColor },
                      ]}
                    >
                      {currentEntry ? "Update" : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Screen Entry View */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!selectedEntry}
        onRequestClose={() => setSelectedEntry(null)}
      >
        {selectedEntry && (
          <View
            style={[tw`flex-1 p-6`, { backgroundColor: theme.backgroundColor }]}
          >
            <TouchableOpacity
              onPress={() => setSelectedEntry(null)}
              style={tw`mb-4`}
            >
              <Feather name="x" size={24} color={theme.textColor} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[
                  tw`text-3xl font-bold mb-4`,
                  { color: theme.textColor },
                ]}
              >
                {selectedEntry.date}
              </Text>
              {selectedEntry.mood && (
                <Text style={[tw`text-2xl mb-4`, { color: theme.textColor }]}>
                  {MOODS[selectedEntry.mood]}
                </Text>
              )}
              <Text style={[tw`text-lg mb-6`, { color: theme.textColor }]}>
                {selectedEntry.content}
              </Text>
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <View style={tw`flex-row flex-wrap mb-6`}>
                  {selectedEntry.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[
                        tw`bg-gray-200 rounded-full px-3 py-1 mr-2 mb-2`,
                        { backgroundColor: theme.secondaryColor },
                      ]}
                    >
                      <Text style={{ color: theme.textColor }}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              {selectedEntry.images && selectedEntry.images.length > 0 && (
                <View style={tw`mb-6`}>
                  {selectedEntry.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={tw`w-full h-64 rounded-xl mb-2`}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
              {selectedEntry.voiceNote && (
                <TouchableOpacity
                  onPress={() => handlePlayAudio(selectedEntry.voiceNote!)}
                  style={tw`mb-6 flex-row items-center`}
                >
                  <Feather name="play" size={24} color={theme.primaryColor} />
                  <Text style={[tw`ml-2`, { color: theme.textColor }]}>
                    Play Voice Note
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Statistics Modal */}
      <StatisticsModal
        isVisible={isStatsVisible}
        onClose={() => setIsStatsVisible(false)}
        entries={entries}
        theme={theme}
      />

      {/* Mood Tracker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMoodTrackerVisible}
        onRequestClose={() => setIsMoodTrackerVisible(false)}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              tw`bg-white rounded-2xl p-6 w-11/12`,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <Text
              style={[tw`text-2xl font-bold mb-6`, { color: theme.textColor }]}
            >
              Mood Tracker
            </Text>
            <MoodAnalysisChart entries={entries} theme={theme} />
            <TouchableOpacity
              onPress={() => setIsMoodTrackerVisible(false)}
              style={[
                tw`bg-blue-500 p-3 rounded-xl mt-6`,
                { backgroundColor: theme.primaryColor },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-semibold`,
                  { color: theme.backgroundColor },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Customizer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isThemeCustomizerVisible}
        onRequestClose={() => setIsThemeCustomizerVisible(false)}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              tw`bg-white rounded-2xl p-6 w-11/12`,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <Text
              style={[tw`text-2xl font-bold mb-6`, { color: theme.textColor }]}
            >
              Customize Theme
            </Text>
            <ThemeCustomizer
              currentTheme={theme}
              setTheme={(newTheme) => {
                setTheme(newTheme);
                AsyncStorage.setItem("theme", JSON.stringify(newTheme));
              }}
            />
            <TouchableOpacity
              onPress={() => setIsThemeCustomizerVisible(false)}
              style={[
                tw`bg-blue-500 p-3 rounded-xl mt-6`,
                { backgroundColor: theme.primaryColor },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-semibold`,
                  { color: theme.backgroundColor },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Advanced Search Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAdvancedSearchVisible}
        onRequestClose={() => setIsAdvancedSearchVisible(false)}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              tw`bg-white rounded-2xl p-6 w-11/12`,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <Text
              style={[tw`text-2xl font-bold mb-6`, { color: theme.textColor }]}
            >
              Advanced Search
            </Text>
            <AdvancedSearch theme={theme} onSearch={handleAdvancedSearch} />
            <TouchableOpacity
              onPress={() => setIsAdvancedSearchVisible(false)}
              style={[
                tw`bg-blue-500 p-3 rounded-xl mt-6`,
                { backgroundColor: theme.primaryColor },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-semibold`,
                  { color: theme.backgroundColor },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Data Visualization Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDataVisualizationVisible}
        onRequestClose={() => setIsDataVisualizationVisible(false)}
      >
        <View
          style={[
            tw`flex-1 justify-center items-center`,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <View
            style={[
              tw`bg-white rounded-2xl p-6 w-11/12 h-5/6`,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <Text
              style={[tw`text-2xl font-bold mb-6`, { color: theme.textColor }]}
            >
              Data Visualization
            </Text>
            <DataVisualization entries={entries} theme={theme} />
            <TouchableOpacity
              onPress={() => setIsDataVisualizationVisible(false)}
              style={[
                tw`bg-blue-500 p-3 rounded-xl mt-6`,
                { backgroundColor: theme.primaryColor },
              ]}
            >
              <Text
                style={[
                  tw`text-center font-semibold`,
                  { color: theme.backgroundColor },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export to PDF Button */}
      <TouchableOpacity
        style={[
          tw`absolute bottom-6 left-6 p-4 rounded-full shadow-2xl`,
          { backgroundColor: theme.primaryColor },
        ]}
        onPress={exportToPDF}
      >
        <Feather name="download" size={28} color={theme.backgroundColor} />
      </TouchableOpacity>

      {/* Password Setting Modal */}
      {!isPasswordSet && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!isPasswordSet}
        >
          <View
            style={[
              tw`flex-1 justify-center items-center`,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                tw`bg-white rounded-2xl p-6 w-11/12`,
                { backgroundColor: theme.backgroundColor },
              ]}
            >
              <Text
                style={[
                  tw`text-2xl font-bold mb-6`,
                  { color: theme.textColor },
                ]}
              >
                Set Password
              </Text>
              <TextInput
                secureTextEntry
                value={password}
                onChangeText={setPasswordState}
                style={[
                  tw`w-full p-3 mb-6 rounded-xl`,
                  {
                    backgroundColor: theme.secondaryColor,
                    color: theme.textColor,
                  },
                ]}
                placeholder="Enter password"
                placeholderTextColor={theme.textColor}
              />
              <TouchableOpacity
                onPress={handleSetPassword}
                style={[
                  tw`bg-blue-500 p-3 rounded-xl`,
                  { backgroundColor: theme.primaryColor },
                ]}
              >
                <Text
                  style={[
                    tw`text-center font-semibold`,
                    { color: theme.backgroundColor },
                  ]}
                >
                  Set Password
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default DiaryApp;
