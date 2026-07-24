import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

// Placeholder shell — real game history content (migrated from
// app/ledger.tsx's Previous Games section) arrives in a later piece.
export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>History — coming soon</Text>
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
