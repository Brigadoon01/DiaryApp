import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;

export const startRecording = async (): Promise<string> => {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recording = newRecording;

    return 'Recording started';
  } catch (err) {
    console.error('Failed to start recording', err);
    return '';
  }
};

export const stopRecording = async (): Promise<string> => {
  if (!recording) {
    return '';
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    return uri || '';
  } catch (err) {
    console.error('Failed to stop recording', err);
    return '';
  }
};

export const playAudio = async (uri: string): Promise<void> => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
  } catch (err) {
    console.error('Failed to play audio', err);
  }
};
