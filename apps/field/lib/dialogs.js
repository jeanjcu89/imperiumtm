import { Alert, Platform } from 'react-native';

// react-native-web ships Alert as a silent no-op, so on web these fall back
// to the browser's native dialogs — otherwise error messages would be
// invisible and confirm flows (like account deletion) would dead-end.

export function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmDestructive({ title, message, actionLabel, onConfirm }) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
