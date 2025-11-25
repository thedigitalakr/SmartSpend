// screens/BooksScreen.js
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // 👈 NEW
import { useBooks } from "../context/BooksContext";
import { useTransactions } from "../context/TransactionsContext";
import { exportPassbookPdf } from "../utils/reporting";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BooksScreen() {
  const navigation = useNavigation(); // 👈 NEW

  const { books, activeBookId, setActiveBook, addBook, deleteBook } =
    useBooks();
  const { transactions, getBookBalance, privateMode } = useTransactions();

  const sortedBooks = useMemo(
    () =>
      [...books].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [books]
  );

  const handleQuickCreate = () => {
    const newBook = addBook({
      name: `Cashbook ${books.length + 1}`,
      description: "Quick-created book",
      color: "#2563EB",
    });
    setActiveBook(newBook.id);
  };

  const handleExportPassbook = async (book) => {
    const bookTx = transactions
      .filter((t) => t.bookId === book.id)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    await exportPassbookPdf(book, bookTx);
  };

  const handleDeleteBook = (book) => {
    Alert.alert(
      "Delete cashbook",
      `This will remove “${book.name}” and its structure. Transactions linked to this book will no longer appear grouped here.\n\nAre you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBook(book.id),
        },
      ]
    );
  };

  const handleViewInTransactions = (bookId) => {
    // ✅ make this book active, then jump to Transactions tab
    setActiveBook(bookId);
    navigation.navigate("Transactions");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your cashbooks</Text>
            <Text style={styles.subtitle}>
              Separate passbooks for business, family, and goals.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addPill}
            onPress={handleQuickCreate}
            activeOpacity={0.9}
          >
            <Feather name="plus" size={16} color="#2563EB" />
            <Text style={styles.addPillText}>Quick create</Text>
          </TouchableOpacity>
        </View>

        {sortedBooks.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="menu-book" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No cashbooks yet</Text>
            <Text style={styles.emptyText}>
              Use the “+” button on the Home tab to create your first cashbook
              and start tracking cash-in and cash-out entries.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {sortedBooks.map((book) => {
              const bal = getBookBalance(book.id);
              const isActive = book.id === activeBookId;
              const total = Math.abs(bal.inTotal) + Math.abs(bal.outTotal);
              const inPct =
                total > 0 ? (Math.abs(bal.inTotal) / total) * 100 : 0;
              const outPct =
                total > 0 ? (Math.abs(bal.outTotal) / total) * 100 : 0;

              return (
                <View
                  key={book.id}
                  style={[
                    styles.card,
                    isActive && styles.cardActive,
                    { borderLeftColor: book.color || "#2563EB" },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setActiveBook(book.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.bookTitleRow}>
                        <View
                          style={[
                            styles.bookDot,
                            { backgroundColor: book.color || "#2563EB" },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookName} numberOfLines={1}>
                            {book.name}
                          </Text>
                          {book.description ? (
                            <Text style={styles.bookDesc} numberOfLines={1}>
                              {book.description}
                            </Text>
                          ) : (
                            <Text style={styles.bookDescLight}>
                              Created on {formatDate(book.createdAt)}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isActive && (
                        <View style={styles.activeChip}>
                          <View style={styles.activeDot} />
                          <Text style={styles.activeChipText}>Active</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardBodyRow}>
                      <View>
                        <Text style={styles.labelMuted}>Balance</Text>
                        <Text style={styles.balanceText}>
                          {privateMode
                            ? "••••"
                            : `₹${bal.balance.toFixed(2)}`}
                        </Text>
                      </View>
                      <View style={styles.inOutRow}>
                        <View style={{ marginRight: 16 }}>
                          <Text style={styles.inLabel}>Cash-in</Text>
                          <Text style={styles.inValue}>
                            {privateMode
                              ? "••••"
                              : `₹${bal.inTotal.toFixed(2)}`}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.outLabel}>Cash-out</Text>
                          <Text style={styles.outValue}>
                            {privateMode
                              ? "••••"
                              : `₹${bal.outTotal.toFixed(2)}`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.dashboardRow}>
                      <Text style={styles.dashboardLabel}>Spend split</Text>
                      <View style={styles.pieBar}>
                        <View
                          style={[
                            styles.pieSegmentIn,
                            { flex: inPct || 1 },
                          ]}
                        />
                        <View
                          style={[
                            styles.pieSegmentOut,
                            { flex: outPct || 1 },
                          ]}
                        />
                      </View>
                      <View style={styles.dashboardLegendRow}>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: "#22C55E" },
                            ]}
                          />
                          <Text style={styles.legendText}>
                            In {total > 0 ? `${inPct.toFixed(0)}%` : "-"}
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: "#F97316" },
                            ]}
                          />
                          <Text style={styles.legendText}>
                            Out {total > 0 ? `${outPct.toFixed(0)}%` : "-"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleViewInTransactions(book.id)} // 👈 UPDATED
                    >
                      <Feather name="activity" size={14} color="#2563EB" />
                      <Text style={styles.actionText}>
                        View in Transactions
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleExportPassbook(book)}
                    >
                      <Feather
                        name="download-cloud"
                        size={14}
                        color="#111827"
                      />
                      <Text style={styles.actionTextSecondary}>
                        Passbook PDF
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDanger}
                      onPress={() => handleDeleteBook(book)}
                    >
                      <Feather name="trash-2" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={{ height: 90 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2, maxWidth: 260 },
  addPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  addPillText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
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
  scroll: { flex: 1, marginTop: 4 },
  content: { paddingBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  cardActive: {
    borderColor: "rgba(37, 99, 235, 0.45)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bookDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  bookName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  bookDesc: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 1,
  },
  bookDescLight: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
  },
  cardBodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  labelMuted: { fontSize: 11, color: "#9CA3AF" },
  balanceText: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  inOutRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inLabel: { fontSize: 11, color: "#16A34A" },
  outLabel: { fontSize: 11, color: "#DC2626" },
  inValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
    marginTop: 2,
  },
  outValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7F1D1D",
    marginTop: 2,
  },
  dashboardRow: { marginTop: 10 },
  dashboardLabel: { fontSize: 11, color: "#6B7280", marginBottom: 4 },
  pieBar: {
    height: 8,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  pieSegmentIn: { backgroundColor: "#22C55E" },
  pieSegmentOut: { backgroundColor: "#F97316" },
  dashboardLegendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 4,
  },
  legendText: { fontSize: 11, color: "#6B7280" },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
    columnGap: 8,
    alignItems: "center",
  },
  actionBtn: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  actionText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  actionBtnSecondary: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  actionTextSecondary: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  actionBtnDanger: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
});
