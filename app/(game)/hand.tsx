import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useFonts, ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { Colors } from '@/constants/theme';
import { usePlayers, type HandTag } from '@/context/PlayersContext';
import { KeyboardSafeScrollView } from '@/components/KeyboardSafeScrollView';

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
  const [fontsLoaded] = useFonts({ ArchitectsDaughter_400Regular });
  const { players, teams, seating, houseRules, currentDealerIndex, addHand, advanceDealer, passHand } = usePlayers();

  // ── Local hand-entry state — nothing here touches context until POST.
  //    Reset to these defaults right after every post, ready for the next
  //    hand. ─────────────────────────────────────────────────────────────
  const [selectedTrump, setSelectedTrump] = useState<Trump | null>(null);
  const [runs20, setRuns20] = useState(0);
  const [runs50, setRuns50] = useState(false);
  const [bella, setBella] = useState(false);
  const [baitMode, setBaitMode] = useState(false);
  const [counterId, setCounterId] = useState<string | null>(null);
  const [baitTeamId, setBaitTeamId] = useState<string | null>(null);
  const [enteredScore, setEnteredScore] = useState('');

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

  // ── Section 3 derived values ──────────────────────────────────────────────
  const usTeamId = seating?.usTeamId ?? '';
  const themTeamId = seating?.themTeamId ?? '';
  const usTeam = teams.find(t => t.name === usTeamId);
  const themTeam = teams.find(t => t.name === themTeamId);
  const usLabel = usTeam?.members.join(' & ') ?? 'US';
  const themLabel = themTeam?.members.join(' & ') ?? 'THEM';

  const baitTeamLabel = baitTeamId === usTeamId ? usLabel : baitTeamId === themTeamId ? themLabel : '';
  const baitOtherTeamLabel = baitTeamId === usTeamId ? themLabel : baitTeamId === themTeamId ? usLabel : '';

  const parsedEntered = enteredScore === '' ? NaN : parseInt(enteredScore, 10);
  const enteredValid = !isNaN(parsedEntered) && parsedEntered >= 0 && parsedEntered <= count;
  const derivedScore = count - (isNaN(parsedEntered) ? 0 : parsedEntered);

  // Bait payout: halfBaitIsWholeBait means the outcome never depends on the
  // exact score (always 0 / full count), so no input is needed at all. When
  // that house rule is off, the other team's actual count decides it: if the
  // bait team would come out strictly under half, the other team still gets
  // the full count; otherwise (exactly half, or a contradictory entry where
  // the "bait" team would clear half) the other team is capped at what they
  // actually counted rather than being awarded the full pool.
  const baitAutoAward = houseRules.halfBaitIsWholeBait;
  const baitOtherAward = baitAutoAward
    ? count
    : (enteredValid ? (parsedEntered > count / 2 ? count : parsedEntered) : null);

  const scoreReady = baitMode ? (baitAutoAward || enteredValid) : enteredValid;

  const canPost =
    selectedTrump !== null &&
    (baitMode ? baitTeamId !== null : counterId !== null) &&
    scoreReady;

  function handleScoreChange(text: string) {
    // Only allow empty or non-negative integers that don't exceed the count
    if (text === '' || /^\d+$/.test(text)) {
      const num = parseInt(text, 10);
      if (text === '' || num <= count) setEnteredScore(text);
    }
  }

  // Switching modes invalidates whatever was mid-entry on the other side —
  // clear it so a stale selection/score can't leak into the new mode.
  function handleToggleBaitMode() {
    setBaitMode(v => !v);
    setCounterId(null);
    setBaitTeamId(null);
    setEnteredScore('');
  }

  function handlePost() {
    if (!canPost) return;

    const tags: HandTag[] = [];
    for (let i = 0; i < runs20; i++) tags.push('run20');
    if (runs50) tags.push('run50');
    if (bella && !isNoTrump) tags.push('bella');
    if (isNoTrump) tags.push('noTrump');
    if (baitMode) tags.push('bait');

    let usScore: number;
    let themScore: number;
    let countedTeamId: string;

    if (baitMode && baitTeamId) {
      const otherTeamId = baitTeamId === usTeamId ? themTeamId : usTeamId;
      const award = baitOtherAward ?? 0;
      const baitIsUs = baitTeamId === usTeamId;
      usScore = baitIsUs ? 0 : award;
      themScore = baitIsUs ? award : 0;
      countedTeamId = otherTeamId;
    } else {
      const counterTeam = teams.find(t => t.members.includes(counterId ?? ''));
      const counterIsUs = counterTeam?.name === usTeamId;
      const entered = isNaN(parsedEntered) ? 0 : parsedEntered;
      usScore = counterIsUs ? entered : count - entered;
      themScore = counterIsUs ? count - entered : entered;
      countedTeamId = counterTeam?.name ?? '';
    }

    addHand({
      dealerId: dealerName,
      passed: false,
      usScore,
      themScore,
      tags,
      countedTeamId,
      baitTeamId: baitMode ? baitTeamId : null,
      countedPlayerId: baitMode ? undefined : (counterId ?? undefined),
    });
    advanceDealer();

    // Reset local state — screen is ready for the next hand, new dealer
    // already reflected in the status strip via context's currentDealerIndex.
    setSelectedTrump(null);
    setRuns20(0);
    setRuns50(false);
    setBella(false);
    setBaitMode(false);
    setCounterId(null);
    setBaitTeamId(null);
    setEnteredScore('');
  }

  if (!fontsLoaded) {
    return <View style={styles.screen} />;
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

      {/* ── Section 3: THE SCORE ────────────────────────────────────────── */}
      {/* Scrollable so Part C's math never gets cramped on a short screen;
          the POST button lives in the footer so it stays visible above the
          keyboard once the score input is focused. */}
      <KeyboardSafeScrollView
        contentContainerStyle={styles.scoreScrollContent}
        footer={
          <View style={styles.postBtnWrap}>
            <TouchableOpacity
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
              onPress={handlePost}
              disabled={!canPost}
              activeOpacity={0.8}>
              <Text style={styles.postBtnText}>Post Score →</Text>
            </TouchableOpacity>
          </View>
        }>
        <View style={styles.scoreSection}>
          <Text style={styles.sectionLabel}>THE SCORE</Text>

          {/* Part A/B: who counted (or who went bait) + BAIT toggle */}
          <View style={styles.whoCountedRow}>
            <View style={styles.whoCountedLeft}>
              <Text style={styles.whoCountedLabel}>
                {baitMode ? 'Who went bait:' : 'Who counted:'}
              </Text>
              <View style={styles.chipRow}>
                {baitMode ? (
                  <>
                    <TouchableOpacity
                      style={[styles.chip, baitTeamId === usTeamId && styles.chipSelected]}
                      onPress={() => setBaitTeamId(usTeamId)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, baitTeamId === usTeamId && styles.chipTextSelected]}>
                        {usLabel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chip, baitTeamId === themTeamId && styles.chipSelected]}
                      onPress={() => setBaitTeamId(themTeamId)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, baitTeamId === themTeamId && styles.chipTextSelected]}>
                        {themLabel}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  players.map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.chip, counterId === name && styles.chipSelected]}
                      onPress={() => setCounterId(name)}
                      activeOpacity={0.7}>
                      <Text style={[styles.chipText, counterId === name && styles.chipTextSelected]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.baitToggleBtn, baitMode && styles.baitToggleBtnActive]}
              onPress={handleToggleBaitMode}
              activeOpacity={0.7}>
              <Text style={[styles.baitToggleBtnText, baitMode && styles.baitToggleBtnTextActive]}>
                BAIT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Part C: the math */}
          {!baitMode && counterId !== null && (
            <View style={styles.mathSection}>
              <Text style={styles.mathPoolLabel}>Count total</Text>
              <Text style={styles.mathPoolValue}>{count}</Text>

              <View style={styles.mathInputRow}>
                <Text style={styles.mathMinus}>−</Text>
                <TextInput
                  style={styles.mathInput}
                  value={enteredScore}
                  onChangeText={handleScoreChange}
                  keyboardType="number-pad"
                  placeholder="enter score"
                  placeholderTextColor={Colors.grey}
                  returnKeyType="done"
                />
              </View>

              {enteredValid && (
                <>
                  <View style={styles.mathAdditionLineWrap}>
                    <View style={styles.mathAdditionLine} />
                  </View>
                  <Text style={styles.mathDerived}>{derivedScore}</Text>
                </>
              )}
            </View>
          )}

          {baitMode && baitTeamId !== null && (
            <View style={styles.baitMathSection}>
              {baitAutoAward ? (
                <Text style={styles.baitResultText}>
                  {baitTeamLabel} → 0{'\n'}{baitOtherTeamLabel} → {count}
                </Text>
              ) : (
                <>
                  <Text style={styles.mathPoolLabel}>{baitOtherTeamLabel} counted:</Text>
                  <View style={styles.mathInputRow}>
                    <Text style={styles.mathMinus}>−</Text>
                    <TextInput
                      style={styles.mathInput}
                      value={enteredScore}
                      onChangeText={handleScoreChange}
                      keyboardType="number-pad"
                      placeholder="enter score"
                      placeholderTextColor={Colors.grey}
                      returnKeyType="done"
                    />
                  </View>
                  {baitOtherAward !== null && (
                    <Text style={styles.baitResultText}>
                      {baitTeamLabel} → 0{'\n'}{baitOtherTeamLabel} → {baitOtherAward}
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </KeyboardSafeScrollView>

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

  // ── Section 3: THE SCORE ────────────────────────────────────────────
  scoreScrollContent: { flexGrow: 1 },
  scoreSection: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },

  // Part A/B: who counted / who went bait + BAIT toggle
  whoCountedRow: { flexDirection: 'row', alignItems: 'flex-end' },
  whoCountedLeft: { flex: 1 },
  whoCountedLabel: { fontSize: 11, color: Colors.grey, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.cream,
  },
  chipSelected: { backgroundColor: Colors.green, borderColor: Colors.green },
  chipText: { fontSize: 13, color: Colors.ink, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },

  baitToggleBtn: {
    borderWidth: 1.5,
    borderColor: Colors.grey,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  baitToggleBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(184, 144, 46, 0.08)',
  },
  baitToggleBtnText: { fontSize: 12, color: Colors.grey, fontWeight: '700', letterSpacing: 0.5 },
  baitToggleBtnTextActive: { color: Colors.gold },

  // Part C: the math (non-bait) — right-aligned numeric column
  mathSection: { marginTop: 16, alignItems: 'flex-end' },
  mathPoolLabel: { fontSize: 9, color: Colors.grey, marginBottom: 2 },
  mathPoolValue: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 14, color: Colors.grey },
  mathInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  mathMinus: { fontSize: 18, color: Colors.ink },
  mathInput: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 21,
    color: Colors.ink,
    minWidth: 60,
    textAlign: 'right',
    paddingVertical: 0,
  },
  mathAdditionLineWrap: { width: 90, paddingVertical: 2 },
  mathAdditionLine: {
    height: 1,
    backgroundColor: Colors.ink,
    opacity: 0.4,
    transform: [{ rotate: '-0.3deg' }],
  },
  mathDerived: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 19, color: Colors.ink, marginTop: 2 },

  // Part C: the math (bait mode) — centered result statement
  baitMathSection: { marginTop: 16, alignItems: 'center' },
  baitResultText: {
    fontSize: 14,
    color: Colors.ink,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },

  // Part D: Post button
  postBtnWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  postBtn: {
    backgroundColor: Colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: Colors.grey, opacity: 0.5 },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
