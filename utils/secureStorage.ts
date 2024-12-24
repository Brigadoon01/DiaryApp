import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export const setPassword = async (password: string) => {
  await SecureStore.setItemAsync('diaryPassword', password);
};

export const getPassword = async () => {
  return await SecureStore.getItemAsync('diaryPassword');
};

export const verifyPassword = async (inputPassword: string) => {
  const storedPassword = await getPassword();
  return inputPassword === storedPassword;
};

export const isBiometricAvailable = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
};

export const authenticateWithBiometrics = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your diary',
    fallbackLabel: 'Use password',
  });
  return result.success;
};

