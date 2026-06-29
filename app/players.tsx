import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { usePlayers } from '@/context/PlayersContext';
import { KeyboardSafeScrollView } from '@/components/KeyboardSafeScrollView';

export default function PlayersScreen() {
  const { setPlayers } = usePlayers();
  const [names, setNames] = useState<string[]>(['', '', '', '']);

  function updateName(index: number, value: string) {
    setNames(prev => prev.map((n, i) => (i === index ? value : n)));
  }

  function addPlayer() {
    setNames(prev => [...prev, '']);
  }

  function handleNext() {
    const filled = names.map(n => n.trim()).filter(n => n.length > 0);
    setPlayers(filled);
    router.push('/partners');
  }

  const footer = (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardSafeScrollView contentContainerStyle={styles.content} footer={footer}>
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
    </KeyboardSafeScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 24,
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
  footer: {
    padding: 24,
    paddingBottom: 40,
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
