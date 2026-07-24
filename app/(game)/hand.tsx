import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';

type Trump = '♠' | '♥' | '♦' | '♣' | 'NT';

const RED = '#C0392B';

// Glyph color is tied to the suit itself (not to selection state) — red
// suits stay red, black suits stay ink, NT stays grey, whether or not
// they're the one currently selected.
function trumpColor(trump: Trump): string {
  if (trump === '♥' || trump === '♦') return RED;
  if (trump === 'NT') return Colors.grey;
  return Colors.ink;
}

// ─── Run ×20 stepper (0–3) ─────────────────────────────────────────────────
function Stepper({
  value, max, onChange,
}: {
  value: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <TouchableOpacity onPress={() => onChange(Math.max(0, value - 1))} disabled={value === 0} activeOpacity={0.7}>
        <Text style={[styles.stepperBtn, value === 0 && styles.stepperBtnDisabled]}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperVal}>{value}</Text>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + 1))} disabled={value === max} activeOpacity={0.7}>
        <Text style={[styles.stepperBtn, value === max && styles.stepperBtnDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── No / Yes toggle (Run ×50, Bella) ───────────────────────────────────────
function YesNoToggle({
  value, onChange, disabled,
}: {
  value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[styles.toggle, disabled && styles.toggleDisabled]}>
      <TouchableOpacity
        style={[styles.toggleBtn, !value && styles.toggleBtnActive]}
        onPress={() => onChange(false)}
        disabled={disabled}
        activeOpacity={0.8}>
        <Text style={[styles.toggleBtnText, !value && styles.toggleBtnTextActive]}>No</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleBtn, value && styles.toggleBtnActive]}
        onPress={() => onChange(true)}
        disabled={disabled}
        activeOpacity={0.8}>
        <Text style={[styles.toggleBtnText, value && styles.toggleBtnTextActive]}>Yes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function CurrentHandScreen() {
  const { seating, houseRules, currentDealerIndex, passHand } = usePlayers();

  // ── Local hand-entry state — nothing here touches context until POST
  //    (Piece 3). Resets to these defaults whenever the screen remounts
  //    fresh after a post. ─────────────────────────────────────────────────
  const [selectedTrump, setSelectedTrump] = useState<Trump | null>(null);
  const [runs20, setRuns20] = useState(0);
  const [runs50, setRuns50] = useState(false);
  const [bella, setBella] = useState(false);

  const seatOrder = seating?.seatOrder ?? [];
  const dealerName = seatOrder[currentDealerIndex] ?? '';

  const isNoTrump = selectedTrump === 'NT';
  const pool = isNoTrump ? 130 : 162;
  const count = pool + runs20 * 20 + (runs50 ? 50 : 0) + (bella ? 20 : 0);

  const suits: Trump[] = houseRules.noTrumpAllowed
    ? ['♠', '♥', '♦', '♣', 'NT']
    : ['♠', '♥', '♦', '♣'];

  function handleSelectTrump(trump: Trump) {
    setSelectedTrump(trump);
    // No trump suit = no Bella card possible — keep the toggle's disabled
    // greyed-out state honest by clearing any bonus it was already granting.
    if (trump === 'NT') setBella(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Section 1: Status strip ─────────────────────────────────────── */}
      <View style={styles.statusStrip}>

        {/* Left column: whose deal + Pass Deal */}
        <View style={styles.statusLeftCol}>
          <Text style={styles.statusText}>
            It's <Text style={styles.statusDealerName}>{dealerName || '—'}</Text>'s deal
          </Text>
          <TouchableOpacity style={styles.passDealBtn} onPress={passHand} activeOpacity={0.7}>
            <Text style={styles.passDealBtnText}>Pass Deal</Text>
          </TouchableOpacity>
        </View>

        {/* Right column: trump selection */}
        <View style={styles.statusRightCol}>
          <Text style={styles.trumpLabel}>TRUMP</Text>

          <View style={styles.trumpIconRow}>
            {suits.map(suit => (
              <TouchableOpacity
                key={suit}
                style={[styles.trumpIconBtn, selectedTrump === suit && styles.trumpIconBtnSelected]}
                onPress={() => handleSelectTrump(suit)}
                activeOpacity={0.7}>
                <Text style={[styles.trumpIconText, { color: trumpColor(suit) }]}>{suit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedTrump ? (
            <Text style={[styles.trumpSelectedBig, { color: trumpColor(selectedTrump) }]}>
              {selectedTrump}
            </Text>
          ) : (
            <Text style={styles.trumpHint}>tap to select</Text>
          )}
        </View>
      </View>

      {/* ── Section 2: WHAT'S OUT ───────────────────────────────────────── */}
      <View style={styles.outSection}>
        <Text style={styles.sectionLabel}>WHAT'S OUT</Text>

        <View style={styles.outColumnsRow}>
          {/* Column 1 — Run ×20 */}
          <View style={styles.outColumn}>
            <Text style={styles.outColumnLabel}>Run ×20</Text>
            <Stepper value={runs20} max={3} onChange={setRuns20} />
            {runs20 > 0 && <Text style={styles.pointsText}>+{runs20 * 20}pts</Text>}
          </View>

          <View style={styles.outColumnDivider} />

          {/* Column 2 — Run ×50 */}
          <View style={styles.outColumn}>
            <Text style={styles.outColumnLabel}>Run ×50</Text>
            <YesNoToggle value={runs50} onChange={setRuns50} />
            {runs50 && <Text style={styles.pointsText}>+50pts</Text>}
          </View>

          <View style={styles.outColumnDivider} />

          {/* Column 3 — Bella (no trump = no Bella card possible) */}
          <View style={styles.outColumn}>
            <Text style={styles.outColumnLabel}>Bella</Text>
            <YesNoToggle value={bella} onChange={setBella} disabled={isNoTrump} />
            {bella && !isNoTrump && <Text style={styles.pointsText}>+20pts</Text>}
          </View>
        </View>

        <Text style={styles.countText}>
          <Text style={styles.countLabelPart}>Count: </Text>
          <Text style={styles.countValuePart}>{count}</Text>
        </Text>
      </View>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.paper },

  // ── Section 1: Status strip ─────────────────────────────────────────
  statusStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(61, 92, 69, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 195, 210, 0.5)',
  },

  statusLeftCol: { flex: 1, justifyContent: 'center' },
  statusText: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  statusDealerName: { color: Colors.green, fontWeight: '700' },
  passDealBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  passDealBtnText: { fontSize: 12, color: Colors.ink, fontWeight: '600' },

  statusRightCol: { flex: 1, alignItems: 'center' },
  trumpLabel: {
    fontSize: 9,
    color: Colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  trumpIconRow: { flexDirection: 'row', alignItems: 'center' },
  trumpIconBtn: { padding: 5, opacity: 0.55 },
  trumpIconBtnSelected: { opacity: 1, padding: 8 },
  trumpIconText: { fontSize: 22, fontWeight: '600' },
  trumpSelectedBig: { fontSize: 48, marginTop: 2, textAlign: 'center' },
  trumpHint: {
    fontSize: 11,
    color: Colors.grey,
    fontStyle: 'italic',
    marginTop: 10,
  },

  // ── Section 2: WHAT'S OUT ───────────────────────────────────────────
  outSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(180, 195, 210, 0.5)',
  },
  sectionLabel: {
    fontSize: 9,
    color: Colors.grey,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  outColumnsRow: { flexDirection: 'row' },
  outColumn: { flex: 1, alignItems: 'center' },
  outColumnDivider: {
    width: 1,
    backgroundColor: 'rgba(180, 195, 210, 0.5)',
  },
  outColumnLabel: { fontSize: 11, color: Colors.grey, marginBottom: 6 },
  pointsText: { fontSize: 11, color: Colors.gold, fontWeight: '600', marginTop: 4 },

  countText: { fontSize: 15, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  countLabelPart: { color: Colors.grey },
  countValuePart: { color: Colors.green },

  // Stepper (Run ×20)
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { fontSize: 20, color: Colors.green, fontWeight: '700', paddingHorizontal: 4 },
  stepperBtnDisabled: { color: Colors.grey },
  stepperVal: { fontSize: 16, color: Colors.ink, fontWeight: '600', minWidth: 16, textAlign: 'center' },

  // No / Yes toggle (Run ×50, Bella)
  toggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderRadius: 6,
    overflow: 'hidden',
  },
  toggleDisabled: { borderColor: Colors.grey, opacity: 0.5 },
  toggleBtn: { paddingVertical: 5, paddingHorizontal: 10 },
  toggleBtnActive: { backgroundColor: Colors.green },
  toggleBtnText: { fontSize: 12, color: Colors.green, fontWeight: '600' },
  toggleBtnTextActive: { color: '#fff' },
});
