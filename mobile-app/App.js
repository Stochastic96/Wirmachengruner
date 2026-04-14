import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5001';

const TABS = ['Home', 'Receipts', 'Profiles'];

export default function App() {
  const [tab, setTab] = useState('Home');
  const [stats, setStats] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');

  const currency = 'EUR';

  const categories = useMemo(
    () => ['food', 'transport', 'office', 'shopping', 'accommodation', 'entertainment', 'utilities', 'healthcare'],
    []
  );

  async function loadStats() {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) throw new Error('Failed to load stats');
    const payload = await response.json();
    setStats(payload);
  }

  async function loadReceipts() {
    const response = await fetch(`${API_BASE_URL}/api/receipts`);
    if (!response.ok) throw new Error('Failed to load receipts');
    const payload = await response.json();
    setReceipts(payload);
  }

  async function refreshAll() {
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([loadStats(), loadReceipts()]);
    } catch (error) {
      setMessage(error.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  async function addReceipt() {
    if (!vendor.trim() || !amount.trim()) {
      setMessage('Vendor and amount are required.');
      return;
    }

    const form = new FormData();
    form.append('vendor', vendor.trim());
    form.append('amount', amount.trim());
    form.append('currency', currency);
    form.append('category', category);

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/receipts`, {
        method: 'POST',
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to add receipt');
      }
      setVendor('');
      setAmount('');
      await refreshAll();
      setMessage('Receipt added.');
    } catch (error) {
      setMessage(error.message || 'Failed to add receipt');
    } finally {
      setLoading(false);
    }
  }

  async function removeReceipt(id) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/receipts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete receipt');
      await refreshAll();
      setMessage('Receipt deleted.');
    } catch (error) {
      setMessage(error.message || 'Failed to delete receipt');
    } finally {
      setLoading(false);
    }
  }

  async function setLanguage(language) {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      });
      if (!response.ok) throw new Error('Failed to update language');
      setMessage(`Language set to ${language.toUpperCase()}.`);
    } catch (error) {
      setMessage(error.message || 'Failed to update language');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>Receipt Vault Mobile</Text>
        <Text style={styles.subtitle}>API: {API_BASE_URL}</Text>

        <View style={styles.tabRow}>
          {TABS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.tabButton, tab === item && styles.tabButtonActive]}
              onPress={() => setTab(item)}
            >
              <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!message && <Text style={styles.message}>{message}</Text>}
        {loading && <ActivityIndicator size="small" color="#2d5a4f" />}

        {tab === 'Home' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overview</Text>
            <Text style={styles.metric}>Receipts: {stats?.total_receipts ?? '-'}</Text>
            <Text style={styles.metric}>Total Spent: EUR {stats?.total_spent ?? '-'}</Text>
            <Text style={styles.metric}>CO2: {stats?.total_co2 ?? '-'} kg</Text>
            <Text style={styles.tip}>{stats?.carbon_tip || ''}</Text>
            <TouchableOpacity style={styles.primary} onPress={refreshAll}>
              <Text style={styles.primaryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'Receipts' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Receipt</Text>
            <TextInput style={styles.input} placeholder="Vendor" value={vendor} onChangeText={setVendor} />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.categoryRow}>
              {categories.slice(0, 4).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pill, category === item && styles.pillActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.pillText, category === item && styles.pillTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primary} onPress={addReceipt}>
              <Text style={styles.primaryText}>Save Receipt</Text>
            </TouchableOpacity>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>Recent Receipts</Text>
            <FlatList
              data={receipts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vendor}>{item.vendor}</Text>
                    <Text style={styles.meta}>
                      EUR {item.amount} | {item.category || 'uncategorized'} | {item.co2_kg || 0} kg CO2
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeReceipt(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {tab === 'Profiles' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Language</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondary} onPress={() => setLanguage('en')}>
                <Text style={styles.secondaryText}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondary} onPress={() => setLanguage('de')}>
                <Text style={styles.secondaryText}>Deutsch</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.meta}>
              This is a real mobile app shell running in Expo Go, connected to your Flask backend.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f7f5' },
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: '700', color: '#1f4038' },
  subtitle: { fontSize: 12, color: '#61716e' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabButton: {
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  tabButtonActive: { backgroundColor: '#2d5a4f', borderColor: '#2d5a4f' },
  tabText: { color: '#1d2a29', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  message: { color: '#1d4f75', fontSize: 13 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1f4038' },
  metric: { fontSize: 15, color: '#1d2a29' },
  tip: { fontSize: 13, color: '#61716e' },
  input: {
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primary: {
    backgroundColor: '#2d5a4f',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pillActive: { backgroundColor: '#edf6f1', borderColor: '#7ba999' },
  pillText: { color: '#61716e', fontSize: 12 },
  pillTextActive: { color: '#1f4038', fontWeight: '700' },
  listItem: {
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendor: { fontWeight: '700', color: '#1f4038' },
  meta: { color: '#61716e', fontSize: 12 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#b84d4a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteText: { color: '#b84d4a', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  secondary: {
    borderWidth: 1,
    borderColor: '#d6e2dd',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  secondaryText: { color: '#1d2a29', fontWeight: '600' },
});
