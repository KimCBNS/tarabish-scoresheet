import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers, type HouseRules } from '@/context/PlayersContext';
import { KeyboardSafeScrollView } from '@/components/KeyboardSafeScrollView';

// ─── Rule definitions ────────────────────────────────────────────────────────
type RuleKey = keyof HouseRules;

const RULES: Array<{ key: RuleKey; question: string; subtext: string }> = [
  {
    key: 'forceDeal',
    question: 'Force the deal?',
    subtext: 'If everyone passes, the dealer must call trump',
  },
  {
    key: 'halfBaitIsWholeBait',
    question: 'Bait: half bait is whole bait?',
    subtext: 'The calling team goes bait — full pool goes to the other team',
  },
  {
    key: 'noTrumpAllowed',
    question: 'Can we call No Trump?',
    subtext: 'No trump suit — pool drops to 130 points',
  },
];

// ─── Yes / No toggle ─────────────────────────────────────────────────────────
// A joined two-button selector. The outer container holds the border and radius;
// the inner buttons fill/unfill based on the current value.
function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <TouchableOpacity
        style={[styles.toggleBtn, styles.toggleBtnLeft, value && styles.toggleBtnActive]}
        onPress={() => onChange(true)}
        activeOpacity={0.8}>
        <Text style={[styles.toggleBtnText, value && styles.toggleBtnTextActive]}>Yes</Text>
      </TouchableOpacity>
      <View style={styles.toggleDivider} />
      <TouchableOpacity
        style={[styles.toggleBtn, styles.toggleBtnRight, !value && styles.toggleBtnActive]}
        onPress={() => onChange(false)}
        activeOpacity={0.8}>
        <Text style={[styles.toggleBtnText, !value && styles.toggleBtnTextActive]}>No</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function RulesScreen() {
  const { setHouseRules } = usePlayers();

  // Most common family settings default to true
  const [rules, setRules] = useState<HouseRules>({
    forceDeal: true,
    halfBaitIsWholeBait: true,
    noTrumpAllowed: true,
  });

  function setRule(key: RuleKey, value: boolean) {
    setRules(prev => ({ ...prev, [key]: value }));
  }

  function handleStart() {
    setHouseRules(rules);
    router.push('/ledger');
  }

  return (
    <KeyboardSafeScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tonight's rules</Text>

      {RULES.map(({ key, question, subtext }, index) => (
        <View
          key={key}
          style={[styles.ruleRow, index < RULES.length - 1 && styles.ruleRowDivider]}>
          <View style={styles.ruleTextBlock}>
            <Text style={styles.ruleQuestion}>{question}</Text>
            <Text style={styles.ruleSubtext}>{subtext}</Text>
          </View>
          <YesNoToggle value={rules[key]} onChange={v => setRule(key, v)} />
        </View>
      ))}

      <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
        <Text style={styles.startButtonText}>Let's Play!</Text>
      </TouchableOpacity>
    </KeyboardSafeScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 32,
  },

  // Rule rows
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  ruleRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(140, 140, 134, 0.25)', // Colors.grey at 25% opacity
  },
  ruleTextBlock: {
    flex: 1,
  },
  ruleQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.ink,
    marginBottom: 4,
  },
  ruleSubtext: {
    fontSize: 13,
    color: Colors.grey,
    lineHeight: 18,
  },

  // Yes / No toggle
  toggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderRadius: 6,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  toggleBtnLeft: {
    // no extra radius — outer container handles it via overflow: hidden
  },
  toggleBtnRight: {
    // no extra radius — outer container handles it via overflow: hidden
  },
  toggleBtnActive: {
    backgroundColor: Colors.green,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.green,
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  toggleDivider: {
    width: 1.5,
    backgroundColor: Colors.green,
  },

  // Let's Play button
  startButton: {
    backgroundColor: Colors.green,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 32,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
