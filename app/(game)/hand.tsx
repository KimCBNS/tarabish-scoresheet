import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

// Placeholder shell — real live hand entry (migrated from app/ledger.tsx)
// arrives in a later piece.
export default function CurrentHandScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Current Hand — coming soon</Text>
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
