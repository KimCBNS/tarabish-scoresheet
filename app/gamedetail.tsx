import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFonts, ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { Colors } from '@/constants/theme';
import { LinedPaper } from '@/components/LinedPaper';
import { usePlayers } from '@/context/PlayersContext';
// Reuse the exact ledger rendering (dealer blocks, running addition, tag chips)
// so a past game reads identically to how it looked live — just read-only.
import { buildDisplayHands, HandRow, ledgerStyles } from '@/app/ledger';

export default function GameDetailScreen() {
  const [fontsLoaded] = useFonts({ ArchitectsDaughter_400Regular });
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { gameHistory } = usePlayers();

  const entry = gameHistory.find(g => g.id === id);

  if (!fontsLoaded) {
    return <View style={styles.screen} />;
  }

  if (!entry) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.notFoundText}>Game not found.</Text>
      </View>
    );
  }

  const usLabel = entry.usTeamNames.join(' & ');
  const themLabel = entry.themTeamNames.join(' & ');
  const winnerNames = entry.winner === 'us' ? usLabel : themLabel;
  const loserNames = entry.winner === 'us' ? themLabel : usLabel;
  const winScore = entry.winner === 'us' ? entry.usScore : entry.themScore;
  const loseScore = entry.winner === 'us' ? entry.themScore : entry.usScore;
  const handsPlayed = entry.hands.filter(h => !h.passed).length;

  // usTeamId isn't needed by buildDisplayHands (unused parameter in its signature).
  const { entries: displayHands } = buildDisplayHands(entry.hands, '');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ── Game summary ──────────────────────────────────────────────── */}
      <View style={styles.summaryBlock}>
        <Text style={styles.summaryDef}>{winnerNames} def. {loserNames}</Text>
        <Text style={styles.summaryScore}>{winScore} – {loseScore}</Text>
        <Text style={styles.summaryHands}>{handsPlayed} hands played</Text>
      </View>

      {/* ── Read-only ledger for this game ───────────────────────────── */}
      <LinedPaper style={ledgerStyles.linedPaperFill}>
        <View style={ledgerStyles.handRow}>
          <View style={ledgerStyles.dealerCol} />
          <View style={ledgerStyles.scoreCell}>
            <Text style={ledgerStyles.colHeader}>US</Text>
            <Text style={ledgerStyles.colSubHeader}>{usLabel}</Text>
          </View>
          <View style={ledgerStyles.scoreCell}>
            <Text style={ledgerStyles.colHeader}>THEM</Text>
            <Text style={ledgerStyles.colSubHeader}>{themLabel}</Text>
          </View>
          <View style={ledgerStyles.handTagCol} />
        </View>

        <View style={ledgerStyles.headerUnderline} />

        {displayHands.map((hand, i) => (
          <HandRow key={i} hand={hand} compact={false} />
        ))}
      </LinedPaper>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },
  content: { padding: 20, paddingBottom: 40 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 15, color: Colors.grey },

  summaryBlock: { alignItems: 'center', marginBottom: 24 },
  summaryDef: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  summaryScore: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 32,
    color: Colors.gold,
    marginBottom: 4,
  },
  summaryHands: {
    fontSize: 12,
    color: Colors.grey,
    fontStyle: 'italic',
  },
});
