import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Theme } from "../types";
import * as ImagePicker from 'expo-image-picker';

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RichTextEditorProps {
  initialContent: string;
  onChangeText: (text: string) => void;
  theme: Theme;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface RichTextEditorRef {
  setContentHTML: (html: string) => void;
  getContentHtml: () => string;
  focus: () => void;
  blur: () => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
}

interface Format {
  type: string;
  active: boolean;
  range?: { start: number; end: number };
}

type FormatType =
  | "b"
  | "i"
  | "u"
  | "h1"
  | "h2"
  | "code"
  | "blockquote"
  | "ul"
  | "ol"
  | "link"
  | "align-left"
  | "align-center"
  | "align-right"
  | "image"
  | "record";

interface ToolbarButton {
  icon: keyof typeof Feather.glyphMap;
  format: FormatType;
  tooltip: string;
  group?: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: "bold", format: "b", tooltip: "Bold", group: "text" },
  { icon: "italic", format: "i", tooltip: "Italic", group: "text" },
  { icon: "underline", format: "u", tooltip: "Underline", group: "text" },
  { icon: "code", format: "code", tooltip: "Code", group: "text" },
  { icon: "type", format: "h1", tooltip: "Heading 1", group: "heading" },
  { icon: "type", format: "h2", tooltip: "Heading 2", group: "heading" },
  { icon: "align-left", format: "align-left", tooltip: "Align Left", group: "align" },
  { icon: "align-center", format: "align-center", tooltip: "Center", group: "align" },
  { icon: "align-right", format: "align-right", tooltip: "Align Right", group: "align" },
  { icon: "message-square", format: "blockquote", tooltip: "Quote", group: "block" },
  { icon: "list", format: "ul", tooltip: "Bullet List", group: "list" },
  { icon: "list", format: "ol", tooltip: "Numbered List", group: "list" },
  { icon: "link", format: "link", tooltip: "Insert Link", group: "insert" },
  { icon: "image", format: "image", tooltip: "Insert Image", group: "insert" },
  { icon: "mic", format: "record", tooltip: "Record Audio", group: "insert" },
];

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      initialContent,
      onChangeText,
      theme,
      placeholder = "Write your thoughts...",
      maxLength,
      autoFocus = false,
      editable = true,
      onFocus,
      onBlur,
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const [content, setContent] = useState(initialContent);
    const [formats, setFormats] = useState<Map<FormatType, Format>>(new Map());
    const [selection, setSelection] = useState<{ start: number; end: number }>({
      start: 0,
      end: 0,
    });
    const [history, setHistory] = useState<string[]>([initialContent]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const toolbarAnimation = useRef(new Animated.Value(1)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
        setKeyboardVisible(true);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
      const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardVisible(false);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });

      return () => {
        keyboardDidShow.remove();
        keyboardDidHide.remove();
      };
    }, []);

    const animateToolbar = useCallback(
      (visible: boolean) => {
        Animated.spring(toolbarAnimation, {
          toValue: visible ? 1 : 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      },
      [toolbarAnimation]
    );

    const updateHistory = useCallback(
      (newContent: string) => {
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), newContent]);
        setHistoryIndex((prev) => prev + 1);
      },
      [historyIndex]
    );

    const parseFormats = useCallback(
      (text: string, range: { start: number; end: number }) => {
        const newFormats = new Map<FormatType, Format>();

        TOOLBAR_BUTTONS.forEach(({ format }) => {
          const startTag = `<${format}>`;
          const endTag = `</${format}>`;
          let searchStartIndex = 0;
          let startIndex, endIndex;

          while (
            (startIndex = text.indexOf(startTag, searchStartIndex)) !== -1 &&
            (endIndex = text.indexOf(endTag, startIndex + startTag.length)) !== -1
          ) {
            if (startIndex <= range.start && endIndex >= range.end) {
              newFormats.set(format, {
                type: format,
                active: true,
                range: { start: startIndex, end: endIndex + endTag.length },
              });
              break;
            }
            searchStartIndex = endIndex + endTag.length;
          }
        });

        setFormats(newFormats);
      },
      []
    );

    const applyFormat = useCallback(
      (format: FormatType) => {
        const startTag = `<${format}>`;
        const endTag = `</${format}>`;
        let newContent = content;
        const currentFormat = formats.get(format);

        if (format === "image") {
          handleImagePicker();
          return;
        }

        if (format === "record") {
          handleRecording();
          return;
        }

        if (currentFormat?.active) {
          // Remove format
          const { start, end } = currentFormat.range!;
          newContent = newContent.slice(0, start) + newContent.slice(start + startTag.length, end - endTag.length) + newContent.slice(end);
        } else {
          // Apply format
          newContent =
            content.slice(0, selection.start) +
            startTag +
            content.slice(selection.start, selection.end) +
            endTag +
            content.slice(selection.end);
        }

        setContent(newContent);
        onChangeText(newContent);
        updateHistory(newContent);

        // Update selection after applying format
        const newSelection = {
          start: selection.start + startTag.length,
          end: selection.end + startTag.length,
        };
        setSelection(newSelection);
        inputRef.current?.setNativeProps({ selection: newSelection });

        // Parse formats after a short delay to ensure the selection has been updated
        setTimeout(() => parseFormats(newContent, newSelection), 0);

        // Animate button press
        Animated.sequence([
          Animated.spring(buttonScale, {
            toValue: 0.8,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
          }),
          Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }),
        ]).start();
      },
      [content, selection, formats, buttonScale, onChangeText, updateHistory, parseFormats]
    );

    const handleImagePicker = useCallback(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageTag = `<img src="${result.assets[0].uri}" alt="Inserted image" />`;
        const newContent = content.slice(0, selection.start) + imageTag + content.slice(selection.end);
        setContent(newContent);
        onChangeText(newContent);
        updateHistory(newContent);
      }
    }, [content, selection, onChangeText, updateHistory]);

    const handleRecording = useCallback(() => {
      setIsRecording((prev) => !prev);
      // Implement actual audio recording logic here
    }, []);

    useImperativeHandle(ref, () => ({
      setContentHTML: (html: string) => {
        setContent(html);
        updateHistory(html);
      },
      getContentHtml: () => content,
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        setContent("");
        updateHistory("");
      },
      undo: () => {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setContent(history[newIndex]);
          onChangeText(history[newIndex]);
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setContent(history[newIndex]);
          onChangeText(history[newIndex]);
        }
      },
    }));

    const renderToolbarButton = useCallback(
      ({ icon, format, tooltip }: ToolbarButton) => (
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            opacity: toolbarAnimation,
          }}
        >
          <TouchableOpacity
            onPress={() => applyFormat(format)}
            style={[
              styles.button,
              formats.get(format)?.active && styles.activeButton,
              {
                backgroundColor: formats.get(format)?.active || (format === "record" && isRecording)
                  ? theme.primaryColor + "20"
                  : "transparent",
              },
            ]}
            accessibilityLabel={tooltip}
          >
            <Feather
              name={format === "record" && isRecording ? "mic-off" : icon}
              size={20}
              color={
                formats.get(format)?.active || (format === "record" && isRecording)
                  ? theme.primaryColor
                  : theme.textColor
              }
            />
          </TouchableOpacity>
        </Animated.View>
      ),
      [formats, theme, buttonScale, toolbarAnimation, applyFormat, isRecording]
    );

    const renderToolbarGroup = useCallback(
      (groupName: string) => {
        const groupButtons = TOOLBAR_BUTTONS.filter(
          (btn) => btn.group === groupName
        );
        return (
          <View style={styles.toolbarGroup}>
            {groupButtons.map((button, index) => (
              <React.Fragment key={button.format}>
                {renderToolbarButton(button)}
                {index < groupButtons.length - 1 && (
                  <View style={styles.buttonSpacing} />
                )}
              </React.Fragment>
            ))}
          </View>
        );
      },
      [renderToolbarButton]
    );

    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      >
        <Animated.View
          style={[
            styles.toolbarContainer,
            {
              transform: [
                {
                  translateY: toolbarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.toolbar, { backgroundColor: theme.secondaryColor }]}
          >
            {renderToolbarGroup("text")}
            <View style={styles.divider} />
            {renderToolbarGroup("heading")}
            <View style={styles.divider} />
            {renderToolbarGroup("align")}
            <View style={styles.divider} />
            {renderToolbarGroup("block")}
            <View style={styles.divider} />
            {renderToolbarGroup("list")}
            <View style={styles.divider} />
            {renderToolbarGroup("insert")}
          </ScrollView>
        </Animated.View>

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              backgroundColor: theme.secondaryColor + "10",
              color: theme.textColor,
            },
          ]}
          multiline
          value={content}
          onChangeText={(text) => {
            setContent(text);
            onChangeText(text);
            updateHistory(text);
          }}
          onSelectionChange={(event) => {
            const sel = event.nativeEvent.selection;
            setSelection(sel);
            parseFormats(content, sel);
          }}
          onFocus={() => {
            animateToolbar(true);
            onFocus?.();
          }}
          onBlur={() => {
            animateToolbar(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={`${theme.textColor}40`}
          maxLength={maxLength}
          autoFocus={autoFocus}
          editable={editable}
          textAlignVertical="top"
          scrollEnabled
          keyboardType="default"
          returnKeyType="default"
          autoCapitalize="sentences"
          autoCorrect
          // {...Platform.select({
          //   ios: {
          //     keyboardAppearance: theme.isDark ? "dark" : "light",
          //   },
          // })}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toolbarContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    zIndex: 1,
  },
  toolbar: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toolbarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    transform: [{ scale: 1.1 }],
  },
  buttonSpacing: {
    width: 8,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    borderRadius: 16,
    margin: 8,
  },
});

export default RichTextEditor;

