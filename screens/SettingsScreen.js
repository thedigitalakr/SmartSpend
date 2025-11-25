// screens/SettingsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useBooks } from "../context/BooksContext";
import { useTransactions } from "../context/TransactionsContext";

export default function SettingsScreen() {
  const { books, clearAllBooks } = useBooks();
  const {
    gstEnabled,
    setGstEnabled,
    roundUpEnabled,
    setRoundUpEnabled,
    privateMode,
    setPrivateMode,
    monthlyBudget,
    setMonthlyBudget,
    savingsGoal,
    setSavingsGoal,
    clearAllTransactions,
  } = useTransactions();

  const [budgetInput, setBudgetInput] = useState(
    monthlyBudget ? String(monthlyBudget) : ""
  );
  const [goalInput, setGoalInput] = useState(
    savingsGoal ? String(savingsGoal) : ""
  );

  const handleSaveBudget = () => {
    const v = parseFloat(budgetInput || "0");
    if (Number.isNaN(v) || v <= 0) {
      setMonthlyBudget(null);
      return;
    }
    setMonthlyBudget(v);
  };

  const handleSaveGoal = () => {
    const v = parseFloat(goalInput || "0");
    if (Number.isNaN(v) || v <= 0) {
      setSavingsGoal(null);
      return;
    }
    setSavingsGoal(v);
  };

  const confirmClearTransactions = () => {
    Alert.alert(
      "Clear all entries",
      "This will permanently delete all transactions from every cashbook on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearAllTransactions();
          },
        },
      ]
    );
  };

  const confirmClearBooks = () => {
    Alert.alert(
      "Clear all cashbooks",
      "This will delete all cashbooks and their structure from this device. You will also lose links between books and transactions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearAllBooks();
            clearAllTransactions();
          },
        },
      ]
    );
  };

  const totalBooks = books.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <View style={styles.appIcon}>
              <Feather name="pie-chart" size={22} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appTitle}>SmartSpend</Text>
              <Text style={styles.appSubtitle}>
                Fine-tune how your money manager behaves.
              </Text>
            </View>
            <View style={styles.versionPill}>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Money & currency</Text>
            <View style={styles.cardRow}>
              <View style={styles.iconPillBlue}>
                <Feather name="globe" size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Currency</Text>
                <Text style={styles.rowSubtitle}>
                  SmartSpend is currently optimized for ₹ (INR).
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>₹ INR</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.rowTitle}>Monthly budget</Text>
              <Text style={styles.rowSubtitle}>
                Set an ideal monthly spend limit to track how disciplined you
                are across all cashbooks.
              </Text>
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.inlineBtn}
                  onPress={handleSaveBudget}
                >
                  <Text style={styles.inlineBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              {monthlyBudget ? (
                <Text style={styles.infoText}>
                  Current budget: ₹{monthlyBudget.toFixed(0)}
                </Text>
              ) : (
                <Text style={styles.infoTextMuted}>
                  No active budget. SmartSpend will not highlight overspending.
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.rowTitle}>Savings goal</Text>
              <Text style={styles.rowSubtitle}>
                Define how much you want to save in total. SmartSpend will show
                your progress on the Home dashboard.
              </Text>
              <View style={styles.inlineInputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={goalInput}
                  onChangeText={setGoalInput}
                  placeholder="e.g. 200000"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.inlineBtn}
                  onPress={handleSaveGoal}
                >
                  <Text style={styles.inlineBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
              {savingsGoal ? (
                <Text style={styles.infoText}>
                  Active goal: ₹{savingsGoal.toFixed(0)}
                </Text>
              ) : (
                <Text style={styles.infoTextMuted}>
                  No active savings goal. You can set one anytime.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Privacy & safety</Text>

            <View style={styles.cardRow}>
              <View style={styles.iconPillGray}>
                <Feather name="eye-off" size={16} color="#4B5563" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Private mode</Text>
                <Text style={styles.rowSubtitle}>
                  Hide all amounts on Home, Books, and Transactions screens.
                  Perfect when someone is near your phone.
                </Text>
              </View>
              <Switch
                value={privateMode}
                onValueChange={setPrivateMode}
                thumbColor={privateMode ? "#2563EB" : "#E5E7EB"}
                trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
              />
            </View>

            <View style={styles.cardRow}>
              <View style={styles.iconPillGray}>
                <Feather name="shield" size={16} color="#4B5563" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Local-only data</Text>
                <Text style={styles.rowSubtitle}>
                  All your entries are stored securely on this device only.
                  Export and backup features will be added later.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tax & automation</Text>

            <View style={styles.cardRow}>
              <View style={styles.iconPillBlue}>
                <MaterialIcons
                  name="request-quote"
                  size={18}
                  color="#2563EB"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>GST calculator</Text>
                <Text style={styles.rowSubtitle}>
                  Turn this on to enable GST fields while creating entries.
                  You can then choose the rate per transaction.
                </Text>
              </View>
              <Switch
                value={gstEnabled}
                onValueChange={setGstEnabled}
                thumbColor={gstEnabled ? "#2563EB" : "#E5E7EB"}
                trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
              />
            </View>

            <View style={styles.cardRow}>
              <View style={styles.iconPillGreen}>
                <Feather name="trending-up" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Round-up savings</Text>
                <Text style={styles.rowSubtitle}>
                  When enabled, SmartSpend can round up cash-out entries and
                  allocate the difference as savings (coming soon).
                </Text>
              </View>
              <Switch
                value={roundUpEnabled}
                onValueChange={setRoundUpEnabled}
                thumbColor={roundUpEnabled ? "#16A34A" : "#E5E7EB"}
                trackColor={{ false: "#E5E7EB", true: "#BBF7D0" }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Data & storage</Text>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconPillOrange}>
                  <Feather name="database" size={16} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Your local data</Text>
                  <Text style={styles.rowSubtitle}>
                    You currently have {totalBooks} cashbook
                    {totalBooks === 1 ? "" : "s"} stored on this device.
                  </Text>
                </View>
              </View>

              <View style={styles.actionsCol}>
                <TouchableOpacity
                  onPress={confirmClearTransactions}
                  style={styles.dangerBtnLight}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                  <Text style={styles.dangerBtnLightText}>
                    Clear all transactions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmClearBooks}
                  style={styles.dangerBtn}
                >
                  <Feather name="alert-triangle" size={16} color="#FFFFFF" />
                  <Text style={styles.dangerBtnText}>
                    Clear everything (books + entries)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
             Made for India 🇮🇳 — simple, clean passbooks today, smarter features tomorrow ✨
            </Text>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginBottom: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  appSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  versionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  section: { marginTop: 14 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginTop: 6,
  },
  iconPillBlue: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconPillGreen: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconPillGray: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconPillOrange: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  rowSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  inlineInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  inlineBtn: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  inlineBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoText: {
    marginTop: 6,
    fontSize: 12,
    color: "#166534",
  },
  infoTextMuted: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsCol: {
    marginTop: 12,
  },
  dangerBtnLight: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    marginBottom: 6,
  },
  dangerBtnLightText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#DC2626",
  },
  dangerBtnText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    marginTop: 18,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
  },
  footerText: {
    fontSize: 12,
    color: "#1F2937",
  },
});
