import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/theme';

// ─── Tab icon ────────────────────────────────────────────────────────────────
// Plain emoji glyphs for now — swap for real iconography later if needed.
function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

// ─── Bottom tab navigator — the main container for an in-progress game ───────
// Setup screens (players, partners, seating, deal, rules) stay as stack
// screens outside this group; "Let's Play!" lands here, on the Hand tab.
export default function GameTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.green,
        tabBarInactiveTintColor: Colors.grey,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopWidth: 1,
          borderTopColor: 'rgba(140, 140, 134, 0.3)',
          height: 83,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="hand"
        options={{
          title: 'Current Hand',
          tabBarLabel: 'Hand',
          tabBarIcon: ({ color }) => <TabIcon emoji="🃏" color={color} />,
        }}
      />
      <Tabs.Screen
        name="score"
        options={{
          title: 'Score',
          tabBarLabel: 'Score',
          tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          title: 'Players',
          tabBarLabel: 'Players',
          tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <TabIcon emoji="📖" color={color} />,
        }}
      />
    </Tabs>
  );
}
