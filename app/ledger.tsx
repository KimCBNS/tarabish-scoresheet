import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useFonts, ArchitectsDaughter_400Regular } from '@expo-google-fonts/architects-daughter';
import { Colors } from '@/constants/theme';
import { LinedPaper } from '@/components/LinedPaper';
import { usePlayers, type Hand, type HandTag } from '@/context/PlayersContext';

// LayoutAnimation requires an opt-in on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Hardcoded previous-match history (real history wired in a later screen) ─
const SAMPLE_HISTORY = [
  { id: 2, label: 'Match 2 — Kim & Alana def. Morene & Arlene, 512–301' },
  { id: 1, label: 'Match 1 — Morene & Arlene def. Kim & Alana, 504–488' },
];

// ─── Display type ─────────────────────────────────────────────────────────────
// isFirstDealt: true for the first non-passed hand — suppresses the addition
// line and bold running total (the raw score IS the total for that hand).
// allTags: merged list of all tags for the hand, shown in the right margin column.
type HandEntry = {
  dealer: string;
  passed?: true;
  us?: { score: number };
  them?: { score: number };
  allTags: string[];   // all tags for this hand, rendered in the right margin
  usTotal: number;
  themTotal: number;
  isFirstDealt: boolean;
};

// ─── Convert context Hand[] into display entries ──────────────────────────────
// Accumulates running totals. Tags are collected into a single allTags list
// and rendered in the right margin column (Change 3 — not split by team).
function buildDisplayHands(
  hands: Hand[],
  usTeamId: string,
): { entries: HandEntry[]; usTotal: number; themTotal: number } {
  let usTotal = 0;
  let themTotal = 0;
  let dealtCount = 0;

  const entries: HandEntry[] = hands.map(hand => {
    if (hand.passed) {
      return { dealer: hand.dealerId, passed: true as const, allTags: [], isFirstDealt: false, usTotal, themTotal };
    }

    usTotal += hand.usScore;
    themTotal += hand.themScore;
    const isFirstDealt = dealtCount === 0;
    dealtCount++;

    // Build the flat tag display list for the right margin.
    // run20/run50 may appear twice (once per run), so iterate the tags array directly.
    const allTags: string[] = [];
    for (const tag of hand.tags) {
      switch (tag) {
        case 'bait':    allTags.push('BAIT'); break;
        case 'run20':   allTags.push('Run ×20'); break;
        case 'run50':   allTags.push('Run ×50'); break;
        case 'bella':   allTags.push('Bella'); break;
        case 'noTrump': allTags.push('No Trump'); break;
      }
    }

    return {
      dealer: hand.dealerId,
      isFirstDealt,
      us: { score: hand.usScore },
      them: { score: hand.themScore },
      allTags,
      usTotal,
      themTotal,
    };
  });

  return { entries, usTotal, themTotal };
}

// ─── Count calculation ────────────────────────────────────────────────────────
// Base count is 162 (normal) or 130 (no trump). Runs and Bella add to the count.
// Bella is impossible with no trump (no suit = no Bella card possible).
function calcPool(runs20: number, runs50: number, bella: boolean, noTrump: boolean): number {
  const base = noTrump ? 130 : 162;
  return base + runs20 * 20 + runs50 * 50 + (!noTrump && bella ? 20 : 0);
}

// ─── DealerBlock ─────────────────────────────────────────────────────────────
function DealerBlock({ dealer, passed }: { dealer: string; passed: boolean }) {
  return (
    <View style={[styles.dealerBlock, passed ? styles.dealerBlockPassed : styles.dealerBlockDealt]}>
      <Text style={styles.dealerBlockName} numberOfLines={1}>{dealer}</Text>
      <Text style={[styles.dealerBlockStatus, passed ? styles.dealerBlockStatusPassed : styles.dealerBlockStatusDealt]}>
        {passed ? 'passed' : 'dealt'}
      </Text>
    </View>
  );
}

// ─── Tag chip ────────────────────────────────────────────────────────────────
function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ─── Stepper row (Run ×20 / Run ×50) ─────────────────────────────────────────
function Stepper({
  label, value, max, onDec, onInc,
}: {
  label: string; value: number; max: number; onDec: () => void; onInc: () => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TouchableOpacity onPress={onDec} disabled={value === 0} activeOpacity={0.7}>
        <Text style={[styles.stepperBtn, value === 0 && styles.stepperBtnDisabled]}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepperVal}>{value}</Text>
      <TouchableOpacity onPress={onInc} disabled={value === max} activeOpacity={0.7}>
        <Text style={[styles.stepperBtn, value === max && styles.stepperBtnDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────
function CheckRow({
  label, value, onToggle,
}: {
  label: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={() => onToggle(!value)} activeOpacity={0.7}>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Hand row ─────────────────────────────────────────────────────────────────
// Four columns: dealer block | US score | THEM score | tag chips.
// Tags are embedded as the 4th column so they're vertically co-located with their
// row by construction — no parallel height-matching required.
function HandRow({ hand, compact }: { hand: HandEntry; compact: boolean }) {
  if (hand.passed) {
    return (
      <View style={styles.passedRow}>
        <View style={[styles.dealerCol, compact && styles.dealerColHidden]}><DealerBlock dealer={hand.dealer} passed /></View>
        <View style={styles.scoreCell}><Text style={styles.passedDash}>—</Text></View>
        <View style={styles.scoreCell}><Text style={styles.passedDash}>—</Text></View>
        <View style={[styles.handTagCol, compact && styles.handTagColHidden]} />
      </View>
    );
  }

  return (
    <View>
      {/* Raw score row — tags stack vertically in the 4th column, top-aligned */}
      <View style={styles.handRow}>
        <View style={[styles.dealerCol, compact && styles.dealerColHidden]}><DealerBlock dealer={hand.dealer} passed={false} /></View>
        <View style={styles.scoreCell}>
          <Text style={styles.scoreNumber}>{hand.us!.score}</Text>
        </View>
        <View style={styles.scoreCell}>
          <Text style={styles.scoreNumber}>{hand.them!.score}</Text>
        </View>
        <View style={[styles.handTagCol, compact && styles.handTagColHidden]}>
          {hand.allTags.map((label, i) => <Tag key={i} label={label} />)}
        </View>
      </View>

      {/* First dealt hand has no prior total to add to — skip the equation line */}
      {!hand.isFirstDealt && (
        <>
          <View style={styles.additionLineWrap}><View style={styles.additionLine} /></View>
          <View style={styles.handRow}>
            <View style={[styles.dealerCol, compact && styles.dealerColHidden]} />
            <View style={styles.scoreCell}>
              <Text style={styles.totalNumber}>{hand.usTotal}</Text>
            </View>
            <View style={styles.scoreCell}>
              <Text style={styles.totalNumber}>{hand.themTotal}</Text>
            </View>
            {/* Empty spacer keeps score cells the same width as the raw score row above */}
            <View style={[styles.handTagCol, compact && styles.handTagColHidden]} />
          </View>
        </>
      )}
    </View>
  );
}

// ─── Section divider used inside the entry form ───────────────────────────────
function EntrySectionDivider() {
  return <View style={styles.entrySectionDivider} />;
}

// ─── Scratch margin entry form ─────────────────────────────────────────────────
// Renders inside the expanded right-hand scratch margin. Unmounts on cancel/post,
// resetting all state automatically.
function ScratchMarginEntry({
  usTeamId,
  themTeamId,
  usLabel,
  themLabel,
  houseRules,
  currentDealerName,
  onPost,
  onCancel,
}: {
  usTeamId: string;
  themTeamId: string;
  usLabel: string;
  themLabel: string;
  houseRules: { halfBaitIsWholeBait: boolean; noTrumpAllowed: boolean };
  currentDealerName: string;
  onPost: (hand: Omit<Hand, 'id'>) => void;
  onCancel: () => void;
}) {
  // ── Section 1: Who counted? ──────────────────────────────────────────────
  const [countedTeamId, setCountedTeamId] = useState<string | null>(null);

  // ── Section 2: What's out? ───────────────────────────────────────────────
  const [runs20, setRuns20] = useState(0);
  const [runs50, setRuns50] = useState(0);
  const [bella, setBella] = useState(false);
  const [bait, setBait] = useState(false);
  const [noTrump, setNoTrump] = useState(false);

  // ── Section 4: Bait branch ───────────────────────────────────────────────
  const [baitTeamId, setBaitTeamId] = useState<string | null>(null);

  // ── Section 3: Counted score input ──────────────────────────────────────
  const [countedScoreStr, setCountedScoreStr] = useState('');

  // ── Derived values ───────────────────────────────────────────────────────
  const pool = calcPool(runs20, runs50, bella, noTrump);

  const parsedScore = countedScoreStr === '' ? NaN : parseInt(countedScoreStr, 10);
  const countedScore = isNaN(parsedScore) ? 0 : parsedScore;
  const otherScore = pool - countedScore;

  // When halfBaitIsWholeBait: bait team auto-scores 0, other gets full count → no input needed
  const autoScores = bait && baitTeamId !== null && houseRules.halfBaitIsWholeBait;
  const showScoreInput = !autoScores;
  const scoreEntered = !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= pool;
  const scoreValid = !showScoreInput || scoreEntered;

  // Warning: claiming a score > half count while also marking bait is contradictory
  const showBaitWarning = bait && scoreEntered && parsedScore > pool / 2;

  const canPost =
    countedTeamId !== null &&
    (!bait || baitTeamId !== null) &&
    scoreValid;

  // ── Section header completion states (Change 1) ──────────────────────────
  // "WHO COUNTED" turns green when a team is selected
  const whoCountedDone = countedTeamId !== null;
  // "WHAT'S OUT" is always complete (nothing out is a valid answer)
  const whatsOutDone = true;
  // "THE SCORE" turns green when a count is entered or auto-calculated
  const theScoreDone = autoScores || scoreEntered;

  // Label for the counted team in the math section
  const countedLabel =
    countedTeamId === usTeamId ? usLabel :
    countedTeamId === themTeamId ? themLabel : '';

  // Which team gets the full count when halfBaitIsWholeBait
  const fullCountTeamLabel =
    baitTeamId === usTeamId ? themLabel :
    baitTeamId === themTeamId ? usLabel : '';

  function handleScoreChange(text: string) {
    // Only allow empty or non-negative integers that don't exceed the count
    if (text === '' || /^\d+$/.test(text)) {
      const num = parseInt(text, 10);
      if (text === '' || num <= pool) setCountedScoreStr(text);
    }
  }

  function handlePost() {
    if (!canPost || !countedTeamId) return;

    const tags: HandTag[] = [];
    for (let i = 0; i < runs20; i++) tags.push('run20');
    for (let i = 0; i < runs50; i++) tags.push('run50');
    if (bella && !noTrump) tags.push('bella');
    if (bait) tags.push('bait');
    if (noTrump) tags.push('noTrump');

    let usScore: number;
    let themScore: number;
    const countedIsUs = countedTeamId === usTeamId;
    const baitIsUs = baitTeamId === usTeamId;

    if (bait && baitTeamId) {
      if (houseRules.halfBaitIsWholeBait) {
        usScore = baitIsUs ? 0 : pool;
        themScore = baitIsUs ? pool : 0;
      } else {
        usScore = baitIsUs ? 0 : countedScore;
        themScore = baitIsUs ? countedScore : 0;
      }
    } else {
      usScore = countedIsUs ? countedScore : otherScore;
      themScore = countedIsUs ? otherScore : countedScore;
    }

    onPost({
      dealerId: currentDealerName,
      passed: false,
      usScore,
      themScore,
      tags,
      countedTeamId,
      baitTeamId: bait ? baitTeamId : null,
    });
  }

  return (
    <View style={styles.entryContainer}>

      {/* ✕ cancel — top of form */}
      <TouchableOpacity onPress={onCancel} style={styles.entryCancel} activeOpacity={0.7}>
        <Text style={styles.entryCancelText}>✕ cancel</Text>
      </TouchableOpacity>

      {/* ── Section 1: WHO COUNTED ─────────────────────────────────────── */}
      <Text style={[styles.entrySectionHeader, whoCountedDone && styles.entrySectionHeaderDone]}>
        WHO COUNTED
      </Text>

      <TouchableOpacity
        style={[styles.entryTeamBtn, countedTeamId === usTeamId && styles.entryTeamBtnActive]}
        onPress={() => setCountedTeamId(usTeamId)}
        activeOpacity={0.8}>
        <Text style={[styles.entryTeamBtnText, countedTeamId === usTeamId && styles.entryTeamBtnTextActive]}>
          {usLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.entryTeamBtn, countedTeamId === themTeamId && styles.entryTeamBtnActive]}
        onPress={() => setCountedTeamId(themTeamId)}
        activeOpacity={0.8}>
        <Text style={[styles.entryTeamBtnText, countedTeamId === themTeamId && styles.entryTeamBtnTextActive]}>
          {themLabel}
        </Text>
      </TouchableOpacity>

      <EntrySectionDivider />

      {/* ── Section 2: WHAT'S OUT ──────────────────────────────────────── */}
      <Text style={[styles.entrySectionHeader, whatsOutDone && styles.entrySectionHeaderDone]}>
        WHAT'S OUT
      </Text>

      <Stepper
        label="Run ×20" value={runs20} max={2}
        onDec={() => setRuns20(v => Math.max(0, v - 1))}
        onInc={() => setRuns20(v => Math.min(2, v + 1))} />

      <Stepper
        label="Run ×50" value={runs50} max={2}
        onDec={() => setRuns50(v => Math.max(0, v - 1))}
        onInc={() => setRuns50(v => Math.min(2, v + 1))} />

      {/* Bella is hidden when no trump (no trump suit = Bella impossible) */}
      {!noTrump && (
        <CheckRow label="Bella  +20" value={bella} onToggle={setBella} />
      )}

      <CheckRow
        label="Bait"
        value={bait}
        onToggle={v => { setBait(v); if (!v) setBaitTeamId(null); }} />

      {houseRules.noTrumpAllowed && (
        <CheckRow
          label="No Trump"
          value={noTrump}
          onToggle={v => { setNoTrump(v); if (v) setBella(false); }} />
      )}

      {/* Bait branch: who went bait? — appears inside WHAT'S OUT when bait is checked */}
      {bait && (
        <View style={styles.baitSection}>
          <Text style={styles.baitSectionLabel}>who went bait?</Text>
          <TouchableOpacity
            style={[styles.entryTeamBtn, baitTeamId === usTeamId && styles.entryTeamBtnActive]}
            onPress={() => setBaitTeamId(usTeamId)}
            activeOpacity={0.8}>
            <Text style={[styles.entryTeamBtnText, baitTeamId === usTeamId && styles.entryTeamBtnTextActive]}>
              {usLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.entryTeamBtn, baitTeamId === themTeamId && styles.entryTeamBtnActive]}
            onPress={() => setBaitTeamId(themTeamId)}
            activeOpacity={0.8}>
            <Text style={[styles.entryTeamBtnText, baitTeamId === themTeamId && styles.entryTeamBtnTextActive]}>
              {themLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <EntrySectionDivider />

      {/* ── Section 3: THE SCORE ──────────────────────────────────────────── */}
      <Text style={[styles.entrySectionHeader, theScoreDone && styles.entrySectionHeaderDone]}>
        THE SCORE
      </Text>

      {countedTeamId ? (
        <View style={styles.mathSection}>
          <Text style={styles.mathLabel}>{countedLabel} counted:</Text>

          {/* Count total — updates live as runs/bella/noTrump change */}
          <Text style={styles.mathPool}>{pool}</Text>

          {/* Counted score input (hidden when autoScores: bait + halfBaitIsWholeBait) */}
          {showScoreInput && (
            <View style={styles.mathInputRow}>
              <Text style={styles.mathMinus}>−</Text>
              <TextInput
                style={styles.mathInput}
                value={countedScoreStr}
                onChangeText={handleScoreChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.grey}
                returnKeyType="done"
              />
            </View>
          )}

          {/* Derived other-team score — shown once a number is entered */}
          {showScoreInput && countedScoreStr !== '' && (
            <>
              <View style={styles.mathAdditionLineWrap}>
                <View style={styles.mathAdditionLine} />
              </View>
              <Text style={styles.mathOther}>{otherScore}</Text>
            </>
          )}

          {/* Auto-score note when halfBaitIsWholeBait */}
          {autoScores && fullCountTeamLabel !== '' && (
            <Text style={styles.autoScoreNote}>
              {fullCountTeamLabel} gets{'\n'}full count: {pool}
            </Text>
          )}

          {/* Warning: score > half count while bait is checked is contradictory */}
          {showBaitWarning && (
            <Text style={styles.baitWarning}>
              Score exceeds half count — remove Bait?
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.mathPlaceholder}>Select who counted first</Text>
      )}

      {/* ── Post button ───────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.entryPostBtn, !canPost && styles.entryPostBtnDisabled]}
        onPress={handlePost}
        disabled={!canPost}
        activeOpacity={0.8}>
        <Text style={styles.entryPostBtnText}>Post ✓</Text>
      </TouchableOpacity>

    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function LedgerScreen() {
  const [fontsLoaded] = useFonts({ ArchitectsDaughter_400Regular });
  const {
    hands, addHand, undoLastHand,
    seating, teams, houseRules,
    currentDealerIndex, advanceDealer,
    matchWinner,
  } = usePlayers();

  const [marginOpen, setMarginOpen] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // ── Resolve team identities ───────────────────────────────────────────────
  const usTeamId = seating?.usTeamId ?? '';
  const themTeamId = seating?.themTeamId ?? '';
  const usTeam = teams.find(t => t.name === usTeamId);
  const themTeam = teams.find(t => t.name === themTeamId);
  const usLabel = usTeam?.members.join(' & ') ?? 'US';
  const themLabel = themTeam?.members.join(' & ') ?? 'THEM';

  const seatOrder = seating?.seatOrder ?? [];
  const currentDealerName = seatOrder[currentDealerIndex] ?? '';

  // ── Derive display data ───────────────────────────────────────────────────
  const { entries: displayHands } = buildDisplayHands(hands, usTeamId);

  // ── Win detection ─────────────────────────────────────────────────────────
  // matchWinner lives in PlayersContext (set by addHand/undoLastHand) so it
  // stays correct if the winning hand is later undone.
  const matchOver = matchWinner !== null;

  // ── Margin animation helpers ──────────────────────────────────────────────
  function openMargin() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMarginOpen(true);
  }

  function closeMargin() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMarginOpen(false);
  }

  function handlePost(hand: Omit<Hand, 'id'>) {
    addHand(hand);
    advanceDealer();
    closeMargin();
  }

  function handleUndoPress() {
    setConfirmingUndo(true);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setConfirmingUndo(false), 4000);
  }

  function handleUndoYes() {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setConfirmingUndo(false);
    undoLastHand();
  }

  function handleUndoNo() {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setConfirmingUndo(false);
  }

  function handlePassDeal() {
    addHand({
      dealerId: currentDealerName,
      passed: true,
      usScore: 0,
      themScore: 0,
      tags: [],
      countedTeamId: '',
      baitTeamId: null,
    });
    advanceDealer();
  }

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* ── Zone 1: Status strip (pinned) ──────────────────────────────── */}
      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>
          Whose deal is it?{'  →  '}
          <Text style={styles.statusDealer}>{currentDealerName || '—'}</Text>
        </Text>
        {!matchOver && (
          <TouchableOpacity activeOpacity={0.7} onPress={handlePassDeal}>
            <Text style={styles.passDealBtn}>Pass deal</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Zone 2: Scribbler page (scrollable) ────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <LinedPaper style={styles.linedPaperFill}>

          <View style={styles.columnsRow}>

            {/* ── LEFT: Score columns — compresses to flex:2 when margin opens */}
            <View style={[styles.scoreColumns, marginOpen && styles.scoreColumnsCompressed]}>

              <View style={styles.handRow}>
                <View style={[styles.dealerCol, marginOpen && styles.dealerColHidden]} />
                <View style={styles.scoreCell}>
                  <Text style={styles.colHeader}>US</Text>
                  <Text style={styles.colSubHeader}>{usLabel}</Text>
                </View>
                <View style={styles.scoreCell}>
                  <Text style={styles.colHeader}>THEM</Text>
                  <Text style={styles.colSubHeader}>{themLabel}</Text>
                </View>
                {/* Spacer keeps header columns aligned with hand row columns */}
                <View style={[styles.handTagCol, marginOpen && styles.handTagColHidden]} />
              </View>

              <View style={styles.headerUnderline} />

              {displayHands.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Waiting for the first hand...</Text>
                </View>
              )}

              {displayHands.map((hand, i) => (
                <HandRow key={i} hand={hand} compact={marginOpen} />
              ))}
            </View>

            <View style={styles.marginDivider} />

            {/* ── RIGHT: Scratch margin ─────────────────────────────────── */}
            {/* Expands from flex:1 to flex:2 when entry form is open.
                When collapsed: shows tag history + "+ Add Hand" tap target.
                When expanded: shows the entry form. */}
            <View style={[styles.scratchMargin, marginOpen && styles.scratchMarginOpen]}>
              {marginOpen ? (
                <ScratchMarginEntry
                  usTeamId={usTeamId}
                  themTeamId={themTeamId}
                  usLabel={usLabel}
                  themLabel={themLabel}
                  houseRules={houseRules}
                  currentDealerName={currentDealerName}
                  onPost={handlePost}
                  onCancel={closeMargin}
                />
              ) : (
                // Collapsed state: tag history up top (future), + Add Hand / undo pinned to the bottom
                <View style={styles.marginCollapsed}>
                  <View />

                  <View style={styles.marginBottomStack}>
                    {!matchOver && (
                      <TouchableOpacity
                        style={styles.marginAddHandLabel}
                        onPress={openMargin}
                        activeOpacity={0.7}>
                        <Text style={styles.marginAddHandText}>+ Add Hand</Text>
                      </TouchableOpacity>
                    )}

                    {hands.length > 0 && (
                      confirmingUndo ? (
                        <View style={styles.undoAreaWrap}>
                          <Text style={styles.undoConfirmQuestion}>Undo last hand?</Text>
                          <View style={styles.undoConfirmActions}>
                            <TouchableOpacity onPress={handleUndoYes} activeOpacity={0.7}>
                              <Text style={styles.undoConfirmYes}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUndoNo} activeOpacity={0.7}>
                              <Text style={styles.undoConfirmNo}>No</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.undoAreaWrap}
                          onPress={handleUndoPress}
                          activeOpacity={0.7}>
                          <Text style={styles.undoLinkText}>↺ undo</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Match history ─────────────────────────────────────────────── */}
          <View style={styles.historySection}>
            <View style={styles.historyDivider} />
            <Text style={styles.historyHeading}>Previous matches</Text>
            {SAMPLE_HISTORY.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyRow}
                onPress={() => {}}
                activeOpacity={0.7}>
                <Text style={styles.historyText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        </LinedPaper>
      </ScrollView>

      {/* ── Winner banner (pinned above action bar) ─────────────────────── */}
      {matchOver && matchWinner && (
        <View style={styles.winnerBanner}>
          <Text
            style={styles.winnerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            ★ {matchWinner === 'us' ? `US WINS — ${usLabel}` : `THEM WINS — ${themLabel}`} ★
          </Text>
          <TouchableOpacity style={styles.nextMatchBtn} activeOpacity={0.8}>
            <Text style={styles.nextMatchBtnText}>Start Next Match</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      {/* "+ Add Hand" and Undo both live in the scratch margin now */}
      <SafeAreaView style={styles.actionBar} edges={['bottom']}>
        <TouchableOpacity style={styles.endMatchLink} activeOpacity={0.7}>
          <Text style={styles.endMatchText}>End this match early</Text>
        </TouchableOpacity>
      </SafeAreaView>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: Colors.cream },
  safeArea: { flex: 1, backgroundColor: Colors.cream },

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
  statusText: { fontSize: 13, color: Colors.ink },
  statusDealer: { fontWeight: '600', color: Colors.green },
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
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  linedPaperFill: { flex: 1, minHeight: '100%' },
  columnsRow: { flexDirection: 'row', flex: 1 },

  // ── Score columns ────────────────────────────────────────────────────
  scoreColumns: { flex: 3, paddingTop: 8, paddingBottom: 16 },
  scoreColumnsCompressed: { flex: 2 },

  handRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingLeft: 8 },
  passedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingLeft: 8 },
  passedDash: { fontSize: 14, color: Colors.grey, fontStyle: 'italic', opacity: 0.5 },

  dealerCol: { width: 56, paddingRight: 4, alignItems: 'center' },
  // Collapses to nothing while the scratch margin entry form is open
  dealerColHidden: { width: 0, paddingRight: 0, overflow: 'hidden' },

  dealerBlock: { width: 52, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3, alignItems: 'center' },
  dealerBlockDealt: { borderWidth: 1.5, borderColor: 'rgba(61, 92, 69, 0.5)', backgroundColor: 'rgba(61, 92, 69, 0.06)' },
  dealerBlockPassed: { borderWidth: 1.5, borderColor: 'rgba(140, 140, 134, 0.4)', backgroundColor: 'rgba(140, 140, 134, 0.05)' },
  dealerBlockName: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 13, color: Colors.ink, textAlign: 'center' },
  dealerBlockStatus: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  dealerBlockStatusDealt: { color: Colors.green },
  dealerBlockStatusPassed: { color: Colors.grey },

  scoreCell: { flex: 1, alignItems: 'center' },
  scoreNumber: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 19, color: Colors.ink },
  totalNumber: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 26, color: Colors.ink },

  colHeader: { fontSize: 11, fontWeight: '700', color: Colors.ink, letterSpacing: 1.5, textTransform: 'uppercase' },
  colSubHeader: { fontSize: 10, color: Colors.grey, marginTop: 1, textAlign: 'center' },
  headerUnderline: {
    marginLeft: 56 + 8,
    marginRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(43, 43, 40, 0.2)',
    marginBottom: 2,
  },

  additionLineWrap: { paddingLeft: 56 + 8, paddingRight: 8, paddingVertical: 1 },
  additionLine: {
    height: 1,
    backgroundColor: Colors.ink,
    opacity: 0.35,
    transform: [{ rotate: '-0.3deg' }],
  },

  // Tag chips — used in the right margin column
  tag: { borderWidth: 1, borderColor: Colors.gold, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginBottom: 2 },
  tagText: { fontSize: 9, color: Colors.gold, fontWeight: '600' },

  emptyState: { paddingTop: 20, paddingLeft: 56 + 8, paddingRight: 8 },
  emptyStateText: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 14, color: Colors.grey, fontStyle: 'italic' },

  // ── Right margin ─────────────────────────────────────────────────────
  marginDivider: { width: 1, backgroundColor: 'rgba(180, 195, 210, 0.6)' },
  scratchMargin: {
    flex: 1,
    backgroundColor: 'rgba(184, 144, 46, 0.04)',
  },
  scratchMarginOpen: { flex: 2 },

  // Collapsed margin: tag history (future) up top, + Add Hand / undo pinned to the bottom
  marginCollapsed: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  marginBottomStack: { width: '100%' },
  marginAddHandLabel: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  marginAddHandText: {
    fontSize: 11,
    color: Colors.green,
    fontWeight: '600',
  },

  // "↺ undo" link and its inline confirmation — set well apart from
  // "+ Add Hand" above so it isn't accidentally tapped.
  undoAreaWrap: { marginTop: 24, alignItems: 'center' },
  undoLinkText: { fontSize: 11, color: Colors.grey },
  undoConfirmQuestion: {
    fontSize: 11,
    color: Colors.grey,
    textAlign: 'center',
    marginBottom: 4,
  },
  undoConfirmActions: { flexDirection: 'row', gap: 14 },
  undoConfirmYes: { fontSize: 11, color: Colors.gold, fontWeight: '600' },
  undoConfirmNo: { fontSize: 11, color: Colors.grey, fontWeight: '600' },

  // Tag chip column — 4th cell in every hand row.
  // alignSelf: 'flex-start' pins chips to the top of the row instead of
  // stretching to match the dealer block height.
  handTagCol: {
    width: 44,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 3,
    paddingTop: 2,
  },
  // Collapses to nothing while the scratch margin entry form is open
  handTagColHidden: { width: 0, paddingLeft: 0, overflow: 'hidden' },

  // ── Match history ────────────────────────────────────────────────────
  historySection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  historyDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey,
    borderStyle: 'dashed',
    marginVertical: 20,
    opacity: 0.4,
  },
  historyHeading: {
    fontSize: 11, fontWeight: '600', color: Colors.grey,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  historyRow: { paddingVertical: 8, opacity: 0.4 },
  historyText: { fontSize: 13, color: Colors.ink },

  // ── Winner banner ────────────────────────────────────────────────────
  winnerBanner: {
    backgroundColor: 'rgba(184, 144, 46, 0.08)',
    borderTopWidth: 1.5,
    borderTopColor: Colors.gold,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  winnerText: {
    fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: Colors.gold,
    letterSpacing: 0.8, marginBottom: 8, textAlign: 'center',
  },
  nextMatchBtn: {
    borderWidth: 1.5, borderColor: Colors.green,
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 5,
  },
  nextMatchBtnText: { fontSize: 14, color: Colors.green, fontWeight: '600' },

  // ── Bottom action bar ────────────────────────────────────────────────
  actionBar: {
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: 'rgba(140, 140, 134, 0.3)',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  endMatchLink: { alignItems: 'center', paddingVertical: 4 },
  endMatchText: { fontSize: 12, color: Colors.grey },

  // ── Scratch margin entry form ─────────────────────────────────────────
  entryContainer: { paddingHorizontal: 5, paddingTop: 4, paddingBottom: 12 },

  entryCancel: { alignSelf: 'flex-start', paddingVertical: 3, marginBottom: 4 },
  entryCancelText: { fontSize: 10, color: Colors.grey },

  // Section headers: grey when incomplete, green when done
  entrySectionHeader: {
    fontSize: 9,
    color: 'rgba(140, 140, 134, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '600',
  },
  entrySectionHeaderDone: { color: Colors.green },

  // Thin divider between sections — same blue-grey as ruled lines
  entrySectionDivider: {
    height: 1,
    backgroundColor: 'rgba(180, 195, 210, 0.6)',
    marginVertical: 6,
  },

  entryTeamBtn: {
    borderWidth: 1,
    borderColor: Colors.ink,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 3,
    alignItems: 'center',
  },
  entryTeamBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  entryTeamBtnText: { fontSize: 11, color: Colors.ink, fontWeight: '500', textAlign: 'center' },
  entryTeamBtnTextActive: { color: '#fff' },

  // Stepper (runs)
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  stepperLabel: { fontSize: 10, color: Colors.ink, flex: 1 },
  stepperBtn: { fontSize: 16, color: Colors.green, paddingHorizontal: 3, fontWeight: '700' },
  stepperBtnDisabled: { color: Colors.grey },
  stepperVal: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    minWidth: 14,
    textAlign: 'center',
  },

  // Checkbox (bella / bait / no trump)
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  checkbox: {
    width: 14, height: 14,
    borderWidth: 1, borderColor: Colors.ink,
    borderRadius: 2, marginRight: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkmark: { fontSize: 9, color: '#fff', lineHeight: 14 },
  checkLabel: { fontSize: 10, color: Colors.ink },

  // Bait sub-section (nested inside WHAT'S OUT)
  baitSection: { marginTop: 3 },
  baitSectionLabel: {
    fontSize: 9, color: Colors.grey,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 3, marginTop: 4,
  },

  // Math equation display
  mathSection: { marginTop: 4, alignItems: 'flex-end' },
  mathLabel: { fontSize: 9, color: Colors.grey, marginBottom: 2, alignSelf: 'flex-start' },
  mathPool: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 15, color: Colors.grey },
  mathInputRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mathMinus: { fontSize: 18, color: Colors.ink },
  mathInput: {
    fontFamily: 'ArchitectsDaughter_400Regular',
    fontSize: 23,
    color: Colors.ink,
    minWidth: 46,
    textAlign: 'right',
    paddingVertical: 0,
  },
  mathAdditionLineWrap: { width: '100%', paddingVertical: 1 },
  mathAdditionLine: {
    height: 1,
    backgroundColor: Colors.ink,
    opacity: 0.4,
    transform: [{ rotate: '-0.3deg' }],
  },
  mathOther: { fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 19, color: Colors.ink },
  mathPlaceholder: { fontSize: 10, color: Colors.grey, fontStyle: 'italic', marginTop: 2 },
  autoScoreNote: {
    fontSize: 10, color: Colors.green, fontStyle: 'italic',
    textAlign: 'right', marginTop: 4,
  },
  baitWarning: { fontSize: 9, color: Colors.gold, marginTop: 2, textAlign: 'right' },

  // Post button
  entryPostBtn: {
    backgroundColor: Colors.green,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  entryPostBtnDisabled: { backgroundColor: Colors.grey, opacity: 0.5 },
  entryPostBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
