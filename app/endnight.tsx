import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFonts, ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';

export default function EndNightScreen() {
  const [fontsLoaded] = useFonts({ ArchitectsDaughter_400Regular });
  const { resetAll } = usePlayers();

  if (!fontsLoaded) {
    return <View style={styles.screen} />;
  }

  function handleEndNight() {
    resetAll();
    // replace (not push) — the finished night shouldn't be reachable via back
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>

      {/* ── Title section — mirrors the title screen for a full-circle feel ── */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Tarabish Scoresheet</Text>
        <Text style={styles.subtitle}>a scribbler for your card night</Text>
      </View>

      {/* ── Quote section ─────────────────────────────────────────────── */}
      <View style={styles.quoteSection}>
        <View style={styles.dottedDivider} />
        <Text style={styles.quote}>
          The best game nights aren't about who won,{'\n'}they're about who played.
        </Text>
        <View style={styles.dottedDivider} />
      </View>

      {/* ── Thanks ─────────────────────────────────────────────────────── */}
      <Text style={styles.thanks}>Thanks for playing tonight.</Text>

      {/* Flexible spacer — pushes the button + website groups to the bottom */}
      <View style={styles.spacer} />

      {/* ── Button section ────────────────────────────────────────────── */}
      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.endNightButton} onPress={handleEndNight} activeOpacity={0.8}>
          <Text style={styles.endNightButtonText}>End the Night</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.continueLink}>Continue Game</Text>
        </TouchableOpacity>
      </View>

      {/* ── Website section ───────────────────────────────────────────── */}
      <View style={styles.websiteSection}>
        <Text style={styles.credit}>Made with ♥ in Cape Breton by Kim Desveaux</Text>
        <Text style={styles.websiteLink} onPress={() => Linking.openURL('https://www.kimdesveaux.com')}>
          kimdesveaux.com
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: 24,
  },

  titleSection: { alignItems: 'center', marginTop: 56 },
  title: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 28,
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },

  quoteSection: { alignItems: 'center', paddingVertical: 36 },
  dottedDivider: {
    width: 120,
    borderTopWidth: 1,
    borderStyle: 'dotted',
    borderTopColor: Colors.grey,
    marginVertical: 16,
  },
  quote: {
    fontStyle: 'italic',
    color: Colors.grey,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  thanks: {
    fontSize: 15,
    color: Colors.ink,
    textAlign: 'center',
  },

  spacer: { flex: 1 },

  buttonSection: { alignItems: 'center', marginBottom: 32 },
  endNightButton: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 6,
    marginBottom: 12,
  },
  endNightButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  continueLink: {
    fontSize: 13,
    color: Colors.grey,
  },

  websiteSection: { alignItems: 'center', marginBottom: 16 },
  credit: {
    fontSize: 12,
    color: Colors.grey,
    textAlign: 'center',
  },
  websiteLink: {
    fontSize: 12,
    color: Colors.green,
    textDecorationLine: 'underline',
    marginTop: 4,
    textAlign: 'center',
  },
});
