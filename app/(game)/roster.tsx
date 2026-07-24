import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

// Placeholder shell for the "Players" tab. Filed as roster.tsx (not
// players.tsx) — Expo Router strips the (game) group from the URL, so a
// players.tsx here would collide with the existing top-level setup screen
// at app/players.tsx ("Who is playing?"). Tab label/title stay "Players".
export default function RosterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Players — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
  },
});
