// screens/HomeScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useBooks } from "../context/BooksContext";
import { useTransactions } from "../context/TransactionsContext";
import SwipeTabsWrapper from "../components/SwipeTabsWrapper";
import FAB from "../components/FAB";

const BOOK_COLORS = ["#2563EB", "#0EA5E9", "#22C55E", "#F97316", "#EC4899"];

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}`;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { books, activeBook, addBook, setActiveBook } = useBooks();
  const {
    transactions,
    getBookBalance,
    privateMode,
    monthlyBudget,
    savingsGoal,
  } = useTransactions();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [bookName, setBookName] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookColor, setBookColor] = useState(BOOK_COLORS[0]);

  const active = activeBook || books[0] || null;
  const balance = active
    ? getBookBalance(active.id)
    : { inTotal: 0, outTotal: 0, balance: 0 };

  const recentTransactions = useMemo(() => {
    if (!active) return [];
    const list = transactions
      .filter((t) => t.bookId === active.id)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    return list.slice(0, 5);
  }, [transactions, active]);

  const graphData = useMemo(() => {
    if (!active) return [];
    const today = new Date();
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      let inTotal = 0;
      let outTotal = 0;

      transactions.forEach((t) => {
        if (t.bookId !== active.id) return;
        const ts = new Date(t.date).getTime();
        if (ts < start.getTime() || ts > end.getTime()) return;
        if (t.type === "in") inTotal += t.amount || 0;
        if (t.type === "out") outTotal += t.amount || 0;
      });

      out.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2),
        net: inTotal - outTotal,
      });
    }
    return out;
  }, [transactions, active]);

  const maxAbs = Math.max(1, ...graphData.map((x) => Math.abs(x.net) || 0));

  const handleOpenCreateBook = () => {
    setBookName("");
    setBookDesc("");
    setBookColor(BOOK_COLORS[0]);
    setCreateModalVisible(true);
  };

  const handleCreateBook = () => {
    if (!bookName.trim()) return;
    const newBook = addBook({
      name: bookName.trim(),
      description: bookDesc.trim(),
      color: bookColor,
    });
    setActiveBook(newBook.id);
    setCreateModalVisible(false);
  };

  const budgetText =
    monthlyBudget && monthlyBudget > 0
      ? `Monthly budget: ₹${monthlyBudget.toFixed(0)}`
      : "Set a monthly budget in Settings";

  const goalText =
    savingsGoal && savingsGoal > 0
      ? `Savings goal: ₹${savingsGoal.toFixed(0)}`
      : "Set a savings goal in Settings";

  return (
    <SwipeTabsWrapper>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>SmartSpend</Text>
                <Text style={styles.subtitle}>
                  Your personal passbook for every rupee.
                </Text>
              </View>
              {active && (
                <TouchableOpacity
                  style={styles.bookBadge}
                  onPress={() => navigation.navigate("Books")}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.bookDot,
                      { backgroundColor: active.color || "#2563EB" },
                    ]}
                  />
                  <Text style={styles.bookBadgeText} numberOfLines={1}>
                    {active.name}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color="#9CA3AF"
                    style={{ marginLeft: 2 }}
                  />
                </TouchableOpacity>
              )}
            </View>

            {!active ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="menu-book" size={40} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No cashbook yet</Text>
                <Text style={styles.emptyText}>
                  Create your first cashbook to start recording cash-in and
                  cash-out entries.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={handleOpenCreateBook}
                >
                  <Text style={styles.emptyBtnText}>Create cashbook</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.cardPrimary}>
                  <View style={styles.balanceRow}>
                    <View>
                      <Text style={styles.balanceLabel}>Current balance</Text>
                      <Text style={styles.balanceValue}>
                        {privateMode
                          ? "••••"
                          : `₹${balance.balance.toFixed(2)}`}
                      </Text>
                    </View>
                    <View style={styles.inOutRow}>
                      <View style={{ marginRight: 16 }}>
                        <Text style={styles.inLabel}>Cash-in</Text>
                        <Text style={styles.inValue}>
                          {privateMode
                            ? "••••"
                            : `₹${balance.inTotal.toFixed(2)}`}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.outLabel}>Cash-out</Text>
                        <Text style={styles.outValue}>
                          {privateMode
                            ? "••••"
                            : `₹${balance.outTotal.toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.metaHintRow}>
                    <Feather name="info" size={14} color="#1D4ED8" />
                    <Text style={styles.metaHintText}>
                      All values are for the active cashbook only.
                    </Text>
                  </View>
                </View>

                <View style={styles.rowCards}>
                  <View style={styles.smallCard}>
                    <View style={styles.smallCardHeader}>
                      <View style={styles.iconPillBlue}>
                        <Feather name="target" size={16} color="#2563EB" />
                      </View>
                      <Text style={styles.smallCardTitle}>Budget</Text>
                    </View>
                    <Text style={styles.smallCardText}>{budgetText}</Text>
                  </View>
                  <View style={styles.smallCard}>
                    <View style={styles.smallCardHeader}>
                      <View style={styles.iconPillGreen}>
                        <Feather
                          name="trending-up"
                          size={16}
                          color="#16A34A"
                        />
                      </View>
                      <Text style={styles.smallCardTitle}>Savings</Text>
                    </View>
                    <Text style={styles.smallCardText}>{goalText}</Text>
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>7-day cashflow</Text>
                      <Text style={styles.cardSubtitle}>
                        Net cash per day for the active book.
                      </Text>
                    </View>
                    <Feather name="bar-chart-2" size={18} color="#4B5563" />
                  </View>
                  <View style={styles.graphRow}>
                    {graphData.map((d) => {
                      const positive = d.net >= 0;
                      const height = Math.max(
                        6,
                        (Math.abs(d.net) / maxAbs) * 70
                      );
                      return (
                        <View key={d.label} style={styles.graphCol}>
                          <View style={styles.graphTrack}>
                            <View
                              style={[
                                styles.graphBar,
                                {
                                  height,
                                  backgroundColor: positive
                                    ? "#22C55E"
                                    : "#F97316",
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.graphLabel}>{d.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>Recent entries</Text>
                      <Text style={styles.cardSubtitle}>
                        Showing last 5 transactions.
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Transactions")}
                    >
                      <Text style={styles.linkText}>View all</Text>
                    </TouchableOpacity>
                  </View>

                  {recentTransactions.length === 0 ? (
                    <Text style={styles.emptyListText}>
                      No transactions yet. Use the Transactions tab to add a
                      cash-in or cash-out.
                    </Text>
                  ) : (
                    recentTransactions.map((t) => {
                      const isIn = t.type === "in";
                      const amountText = privateMode
                        ? "••••"
                        : `₹${t.amount.toFixed(2)}`;
                      return (
                        <View key={t.id} style={styles.txRow}>
                          <View
                            style={[
                              styles.txIcon,
                              {
                                backgroundColor: isIn
                                  ? "#22C55E"
                                  : "#F97316",
                              },
                            ]}
                          >
                            <Feather
                              name={
                                isIn ? "arrow-down-left" : "arrow-up-right"
                              }
                              size={16}
                              color="#FFFFFF"
                            />
                          </View>
                          <View style={styles.txBody}>
                            <View style={styles.txHeaderRow}>
                              <Text
                                style={styles.txCategory}
                                numberOfLines={1}
                              >
                                {t.category || (isIn ? "Cash-in" : "Cash-out")}
                              </Text>
                              <Text
                                style={[
                                  styles.txAmount,
                                  isIn
                                    ? { color: "#16A34A" }
                                    : { color: "#DC2626" },
                                ]}
                              >
                                {amountText}
                              </Text>
                            </View>
                            <Text style={styles.txMeta}>
                              {formatShortDate(t.date)} ·{" "}
                              {t.paymentMethod || "No method"}
                            </Text>
                            {t.note ? (
                              <Text style={styles.txNote} numberOfLines={1}>
                                {t.note}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            )}

          </ScrollView>

          {/* Floating button just above tabs */}
          <FAB onPress={handleOpenCreateBook} />

          <Modal
            visible={createModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCreateModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New cashbook</Text>
                  <TouchableOpacity
                    onPress={() => setCreateModalVisible(false)}
                  >
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  value={bookName}
                  onChangeText={setBookName}
                  placeholder="Shop cashbook, Family wallet..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  value={bookDesc}
                  onChangeText={setBookDesc}
                  placeholder="Optional note about this cashbook"
                  placeholderTextColor="#9CA3AF"
                  style={[
                    styles.input,
                    { height: 70, textAlignVertical: "top" },
                  ]}
                  multiline
                />

                <Text style={styles.inputLabel}>Color</Text>
                <View style={styles.colorRow}>
                  {BOOK_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setBookColor(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        bookColor === c && styles.colorDotActive,
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.createBtn,
                    !bookName.trim() && { opacity: 0.6 },
                  ]}
                  disabled={!bookName.trim()}
                  onPress={handleCreateBook}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.createBtnText}>Create cashbook</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </SwipeTabsWrapper>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2, maxWidth: 230 },
  bookBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    maxWidth: 180,
  },
  bookDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  bookBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
    maxWidth: 120,
  },
  cardPrimary: {
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceLabel: { fontSize: 12, color: "#DBEAFE" },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  inOutRow: { flexDirection: "row", alignItems: "flex-end" },
  inLabel: { fontSize: 11, color: "#BBF7D0" },
  outLabel: { fontSize: 11, color: "#FEE2E2" },
  inValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ECFDF5",
    marginTop: 2,
  },
  outValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FEF2F2",
    marginTop: 2,
  },
  metaHintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaHintText: {
    fontSize: 11,
    color: "#DBEAFE",
    marginLeft: 6,
  },
  rowCards: {
    flexDirection: "row",
    columnGap: 10,
    marginTop: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  smallCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  iconPillBlue: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconPillGreen: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  smallCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  smallCardText: {
    fontSize: 12,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginTop: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  graphRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
  },
  graphCol: { flex: 1, alignItems: "center" },
  graphTrack: {
    height: 80,
    width: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  graphBar: {
    width: 10,
    borderRadius: 999,
  },
  graphLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  emptyListText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 10,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  txBody: { flex: 1 },
  txHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  txCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },
  txAmount: { fontSize: 13, fontWeight: "700" },
  txMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  txNote: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 1,
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  inputLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    marginTop: 4,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotActive: {
    borderColor: "#111827",
  },
  createBtn: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
