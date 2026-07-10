import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';

export default function TitleScreen() {
  const { seating, hands } = usePlayers();
  // A game is "in progress" if the table has been set up or at least one
  // hand has been recorded — either means there's real data to resume.
  const hasGameInProgress = seating !== null || hands.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarabish Scoresheet</Text>
      <Text style={styles.subtitle}>a scribbler for your card night</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/players')}
        activeOpacity={0.8}>
        <Text style={styles.buttonText}>Ready to Play</Text>
      </TouchableOpacity>

      {hasGameInProgress && (
        <TouchableOpacity
          style={styles.resumeButton}
          onPress={() => router.push('/ledger')}
          activeOpacity={0.8}>
          <Text style={styles.resumeButtonText}>Resume Tonight's Game</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: 56,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.green,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  resumeButton: {
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: Colors.green,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 6,
  },
  resumeButtonText: {
    color: Colors.green,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
