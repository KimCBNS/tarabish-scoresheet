import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/theme';

export default function PlayersScreen() {
  const [names, setNames] = useState<string[]>(['', '', '', '']);

  function updateName(index: number, value: string) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    setNames(prev => [...prev, '']);
  }

  function handleNext() {
    const filled = names.map(n => n.trim()).filter(n => n.length > 0);
    console.log('Players:', filled);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Who is playing?</Text>

        {names.map((name, i) => (
          <TextInput
            key={i}
            style={styles.input}
            value={name}
            onChangeText={v => updateName(i, v)}
            placeholder="First name only"
            placeholderTextColor={Colors.grey}
            autoCapitalize="words"
            returnKeyType="next"
          />
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
          <Text style={styles.addButtonText}>+ Add another</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 32,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 2,
    fontSize: 18,
    color: Colors.ink,
    marginBottom: 20,
  },
  addButton: {
    paddingVertical: 8,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.green,
    fontWeight: '600',
  },
  spacer: {
    height: 48,
  },
  nextButton: {
    backgroundColor: Colors.green,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
