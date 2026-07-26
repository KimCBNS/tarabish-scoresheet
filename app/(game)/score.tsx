import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { Colors } from '@/constants/theme';
import { LinedPaper } from '@/components/LinedPaper';
import { usePlayers } from '@/context/PlayersContext';
// Reuse the exact ledger rendering (dealer blocks, running addition, tag
// chips) so the full scoreboard's hand history reads identically to the
// live ledger — no duplicated hand-row logic.
import { buildDisplayHands, HandRow, ledgerStyles } from '@/app/ledger';

export default function ScoreScreen() {
  const [fontsLoaded] = useFonts({ ArchitectsDaughter_400Regular });
  const { hands, teams, seating } = usePlayers();

  const usTeamId = seating?.usTeamId ?? '';
  const themTeamId = seating?.themTeamId ?? '';
  const usTeam = teams.find(t => t.name === usTeamId);
  const themTeam = teams.find(t => t.name === themTeamId);
  const usLabel = usTeam?.members.join(' & ') ?? 'US';
  const themLabel = themTeam?.members.join(' & ') ?? 'THEM';

  const { entries: displayHands, usTotal, themTotal } = buildDisplayHands(hands, usTeamId);

  if (!fontsLoaded) {
    return <View style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Pinned header: team headers, player names, running totals ──── */}
      <View style={styles.header}>
        <View style={styles.headerCol}>
          <Text style={styles.headerLabel}>US</Text>
          <Text style={styles.headerNames} numberOfLines={1}>{usLabel}</Text>
          <Text style={styles.headerTotal}>{usTotal}</Text>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.headerCol}>
          <Text style={styles.headerLabel}>THEM</Text>
          <Text style={styles.headerNames} numberOfLines={1}>{themLabel}</Text>
          <Text style={styles.headerTotal}>{themTotal}</Text>
        </View>
      </View>

      {/* ── Scrollable hand history — identical rendering to ledger.tsx ── */}
      {/* No repeated US/THEM column header here — the pinned header above
          already establishes which side is which, and stays visible while
          this list scrolls. */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinedPaper style={ledgerStyles.linedPaperFill}>
          {displayHands.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={ledgerStyles.emptyStateText}>Waiting for the first hand...</Text>
            </View>
          ) : (
            displayHands.map((hand, i) => (
              <HandRow key={i} hand={hand} compact={false} />
            ))
          )}
        </LinedPaper>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },

  // ── Pinned header ─────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    backgroundColor: 'rgba(61, 92, 69, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 195, 210, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCol: { flex: 1, alignItems: 'center' },
  headerDivider: { width: 1, backgroundColor: 'rgba(180, 195, 210, 0.5)' },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.ink,
  },
  headerNames: {
    fontSize: 11,
    color: Colors.grey,
    marginTop: 2,
    paddingHorizontal: 8,
  },
  headerTotal: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 32,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 4,
  },

  // ── Scrollable hand history ─────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
});
