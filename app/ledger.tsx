import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Colors } from '@/constants/theme';
import { LinedPaper } from '@/components/LinedPaper';

// ─── Sample data (hardcoded — real data wired in later) ──────────────────────
const SAMPLE_DEALER = 'Kim';

type HandEntry = {
  dealer: string;
  passed?: true;                              // if set, this hand was passed — no scores, no total
  us?: { score: number; tag: string | null };
  them?: { score: number; tag: string | null };
  usTotal: number;   // running total after this hand (unchanged for passed hands)
  themTotal: number;
};

const SAMPLE_HANDS: HandEntry[] = [
  {
    dealer: 'Kim',
    us: { score: 101, tag: null },
    them: { score: 61, tag: null },
    usTotal: 101,
    themTotal: 61,
  },
  {
    dealer: 'Morene',
    us: { score: 0, tag: 'BAIT' },
    them: { score: 162, tag: null },
    usTotal: 101,
    themTotal: 223,
  },
  {
    // Passed hand — totals stay the same as after Hand 2
    dealer: 'Arlene',
    passed: true,
    usTotal: 101,
    themTotal: 223,
  },
  {
    dealer: 'Alana',
    us: { score: 91, tag: 'Run' },
    them: { score: 71, tag: null },
    usTotal: 192,
    themTotal: 294,
  },
];

const SAMPLE_HISTORY = [
  { id: 2, label: 'Match 2 — Kim & Alana def. Morene & Arlene, 512–301' },
  { id: 1, label: 'Match 1 — Morene & Arlene def. Kim & Alana, 504–488' },
];

// ─── Dealer block ─────────────────────────────────────────────────────────────
// Small outlined card sitting in the left margin of each hand row.
// Green tint for a dealt hand; grey for a passed hand.
function DealerBlock({ dealer, passed }: { dealer: string; passed: boolean }) {
  return (
    <View style={[styles.dealerBlock, passed ? styles.dealerBlockPassed : styles.dealerBlockDealt]}>
      <Text style={styles.dealerBlockName} numberOfLines={1}>
        {dealer}
      </Text>
      <Text style={[styles.dealerBlockStatus, passed ? styles.dealerBlockStatusPassed : styles.dealerBlockStatusDealt]}>
        {passed ? 'passed' : 'dealt'}
      </Text>
    </View>
  );
}

// ─── Tag chip (BAIT / Run / etc.) ────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ─── Hand row ────────────────────────────────────────────────────────────────
// For a dealt hand: DealerBlock + raw scores → tilted addition line → running totals.
// For a passed hand: DealerBlock + "—" placeholders, no line, no totals.
// isFirst: the very first hand has no prior total to add to, so the raw score
// IS the running total — skip the addition line and bold total row.
function HandRow({ hand, isFirst }: { hand: HandEntry; isFirst: boolean }) {
  if (hand.passed) {
    return (
      <View style={styles.passedRow}>
        <View style={styles.dealerCol}>
          <DealerBlock dealer={hand.dealer} passed />
        </View>
        <View style={styles.scoreCell}>
          <Text style={styles.passedDash}>—</Text>
        </View>
        <View style={styles.scoreCell}>
          <Text style={styles.passedDash}>—</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {/* Raw score row */}
      <View style={styles.handRow}>
        <View style={styles.dealerCol}>
          <DealerBlock dealer={hand.dealer} passed={false} />
        </View>

        <View style={styles.scoreCell}>
          <View style={styles.scoreCellInner}>
            <Text style={styles.scoreNumber}>{hand.us!.score}</Text>
            {hand.us!.tag && <Tag label={hand.us!.tag} />}
          </View>
        </View>

        <View style={styles.scoreCell}>
          <View style={styles.scoreCellInner}>
            <Text style={styles.scoreNumber}>{hand.them!.score}</Text>
            {hand.them!.tag && <Tag label={hand.them!.tag} />}
          </View>
        </View>
      </View>

      {/* Addition line + running total — omitted for the first hand */}
      {!isFirst && (
        <>
          <View style={styles.additionLineWrap}>
            <View style={styles.additionLine} />
          </View>
          <View style={styles.handRow}>
            <View style={styles.dealerCol} />
            <View style={styles.scoreCell}>
              <Text style={styles.totalNumber}>{hand.usTotal}</Text>
            </View>
            <View style={styles.scoreCell}>
              <Text style={styles.totalNumber}>{hand.themTotal}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LedgerScreen() {
  const [fontsLoaded] = useFonts({ Caveat_400Regular, Caveat_700Bold });

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* ── Zone 1: Status strip (pinned) ──────────────────────────────── */}
      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>
          Whose deal is it?{'  →  '}
          <Text style={styles.statusDealer}>{SAMPLE_DEALER}</Text>
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.passDealBtn}>Pass deal</Text>
        </TouchableOpacity>
      </View>

      {/* ── Zone 2: Scribbler page (scrollable) ────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/*
          LinedPaper wraps the entire scrollable zone — lines run continuously
          behind both the score columns and the scratch margin.
        */}
        <LinedPaper style={styles.linedPaperFill}>

          <View style={styles.columnsRow}>

            {/* ── LEFT: Score columns ──────────────────────────────────── */}
            <View style={styles.scoreColumns}>

              {/* Column headers */}
              <View style={styles.handRow}>
                <View style={styles.dealerCol} />
                <View style={styles.scoreCell}>
                  <Text style={styles.colHeader}>US</Text>
                  <Text style={styles.colSubHeader}>Kim & Alana</Text>
                </View>
                <View style={styles.scoreCell}>
                  <Text style={styles.colHeader}>THEM</Text>
                  <Text style={styles.colSubHeader}>Morene & Arlene</Text>
                </View>
              </View>

              <View style={styles.headerUnderline} />

              {/* All hands — dealt or passed */}
              {SAMPLE_HANDS.map((hand, i) => (
                <HandRow key={i} hand={hand} isFirst={i === 0} />
              ))}
            </View>

            <View style={styles.marginDivider} />

            {/* ── RIGHT: Scratch margin ────────────────────────────────── */}
            <View style={styles.scratchMargin}>
              <Text style={styles.scratchLabel}>working</Text>
            </View>
          </View>

          {/* ── Match history (inside the same scroll, below current match) ── */}
          <View style={styles.historySection}>
            <View style={styles.historyDivider} />
            <Text style={styles.historyHeading}>Previous matches</Text>

            {SAMPLE_HISTORY.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyRow}
                onPress={() => console.log('history item tapped:', item.id)}
                activeOpacity={0.7}>
                <Text style={styles.historyText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </LinedPaper>
      </ScrollView>

      {/* ── Bottom action bar (pinned) ──────────────────────────────────── */}
      <SafeAreaView style={styles.actionBar} edges={['bottom']}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addHandBtn} activeOpacity={0.8}>
            <Text style={styles.addHandBtnText}>+ Add Hand</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.undoBtn} disabled activeOpacity={0.8}>
            <Text style={styles.undoBtnText}>Undo</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.endMatchLink} activeOpacity={0.7}>
          <Text style={styles.endMatchText}>End this match early</Text>
        </TouchableOpacity>
      </SafeAreaView>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },

  // ── Zone 1: Status strip ────────────────────────────────────────────
  statusStrip: {
    height: 44,
    backgroundColor: 'rgba(61, 92, 69, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 92, 69, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 13,
    color: Colors.ink,
  },
  statusDealer: {
    fontWeight: '600',
    color: Colors.green,
  },
  passDealBtn: {
    fontSize: 12,
    color: Colors.green,
    borderWidth: 1,
    borderColor: Colors.green,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  // ── Zone 2: Scrollable page ─────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  linedPaperFill: {
    flex: 1,
    minHeight: '100%',
  },
  columnsRow: {
    flexDirection: 'row',
    flex: 1,
  },

  // ── Score columns (left, flex 3) ────────────────────────────────────
  scoreColumns: {
    flex: 3,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Base row used for header row, raw score row, and running total row.
  // paddingVertical: 2 keeps rows packed — 2px above + 2px below each row.
  handRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 8,
  },

  // Passed hand row — same structure but no addition line or total below it.
  passedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingLeft: 8,
  },
  passedDash: {
    fontSize: 14,
    color: Colors.grey,
    fontStyle: 'italic',
    opacity: 0.5,
  },

  // Left gutter: holds the DealerBlock (or a blank spacer for header/total rows)
  dealerCol: {
    width: 56,
    paddingRight: 4,
    alignItems: 'center',
  },

  // ── Dealer block ────────────────────────────────────────────────────
  dealerBlock: {
    width: 52,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'center',
  },
  dealerBlockDealt: {
    borderWidth: 1.5,
    borderColor: 'rgba(61, 92, 69, 0.5)',
    backgroundColor: 'rgba(61, 92, 69, 0.06)',
  },
  dealerBlockPassed: {
    borderWidth: 1.5,
    borderColor: 'rgba(140, 140, 134, 0.4)',
    backgroundColor: 'rgba(140, 140, 134, 0.05)',
  },
  dealerBlockName: {
    fontFamily: 'Caveat_400Regular',
    fontSize: 13,
    color: Colors.ink,
    textAlign: 'center',
  },
  dealerBlockStatus: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealerBlockStatusDealt: {
    color: Colors.green,
  },
  dealerBlockStatusPassed: {
    color: Colors.grey,
  },

  // ── Score cells ─────────────────────────────────────────────────────
  scoreCell: {
    flex: 1,
    alignItems: 'center',
  },
  scoreCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreNumber: {
    fontFamily: 'Caveat_400Regular',
    fontSize: 22,
    color: Colors.ink,
  },
  totalNumber: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 26,
    color: Colors.ink,
  },

  // Column headers
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  colSubHeader: {
    fontSize: 10,
    color: Colors.grey,
    marginTop: 1,
    textAlign: 'center',
  },
  headerUnderline: {
    marginLeft: 56 + 8,
    marginRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43, 43, 40, 0.2)',
    marginBottom: 2,
  },

  // Addition line: sits between raw scores and running total.
  // paddingVertical: 1 keeps it snug — 3px total gap from score to line, 3px to total.
  additionLineWrap: {
    paddingLeft: 56 + 8,
    paddingRight: 8,
    paddingVertical: 1,
  },
  additionLine: {
    height: 1,
    backgroundColor: Colors.ink,
    opacity: 0.35,
    transform: [{ rotate: '-0.3deg' }],
  },

  // Tag chips (BAIT, Run, etc.)
  tag: {
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tagText: {
    fontSize: 9,
    color: Colors.gold,
    fontWeight: '600',
  },

  // ── Scratch margin (right, flex 1) ──────────────────────────────────
  marginDivider: {
    width: 1,
    backgroundColor: 'rgba(180, 195, 210, 0.6)',
  },
  scratchMargin: {
    flex: 1,
    backgroundColor: 'rgba(184, 144, 46, 0.04)',
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  scratchLabel: {
    fontSize: 10,
    color: Colors.grey,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // ── Match history ────────────────────────────────────────────────────
  historySection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  historyDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey,
    borderStyle: 'dashed',
    marginVertical: 20,
    opacity: 0.4,
  },
  historyHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  historyRow: {
    paddingVertical: 8,
    opacity: 0.4,
  },
  historyText: {
    fontSize: 13,
    color: Colors.ink,
  },

  // ── Bottom action bar ────────────────────────────────────────────────
  actionBar: {
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 140, 134, 0.3)',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  addHandBtn: {
    flex: 2,
    backgroundColor: Colors.green,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  addHandBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  undoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.grey,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    opacity: 0.45,
  },
  undoBtnText: {
    color: Colors.grey,
    fontSize: 16,
    fontWeight: '600',
  },
  endMatchLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  endMatchText: {
    fontSize: 12,
    color: Colors.grey,
  },
});
