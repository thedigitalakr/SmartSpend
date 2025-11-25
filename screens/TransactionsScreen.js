// screens/TransactionsScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useBooks } from "../context/BooksContext";
import { useTransactions } from "../context/TransactionsContext";
import {
  exportTransactionsCSV,
  generateInvoicePdf,
} from "../utils/reporting";

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

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionsScreen() {
  const { activeBook } = useBooks();
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    privateMode,
    gstEnabled,
  } = useTransactions();

  const [fullMode, setFullMode] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [addVisible, setAddVisible] = useState(false);
  const [addType, setAddType] = useState("out");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [txDate, setTxDate] = useState(new Date());
  const [applyGst, setApplyGst] = useState(false);
  const [gstRate, setGstRate] = useState("18");

  const bookTransactions = useMemo(() => {
    if (!activeBook) return [];
    return transactions
      .filter((t) => t.bookId === activeBook.id)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [transactions, activeBook]);

  const filteredTransactions = useMemo(() => {
    let list = [...bookTransactions];

    if (typeFilter !== "all") {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (fromDate) {
      const fromTs = new Date(fromDate);
      fromTs.setHours(0, 0, 0, 0);
      const min = fromTs.getTime();
      list = list.filter((t) => new Date(t.date).getTime() >= min);
    }

    if (toDate) {
      const toTs = new Date(toDate);
      toTs.setHours(23, 59, 59, 999);
      const max = toTs.getTime();
      list = list.filter((t) => new Date(t.date).getTime() <= max);
    }

    return list;
  }, [bookTransactions, typeFilter, fromDate, toDate]);

  const shownTransactions = useMemo(() => {
    if (!fullMode) return filteredTransactions.slice(0, 5);
    return filteredTransactions;
  }, [filteredTransactions, fullMode]);

  const handleOpenAdd = (type) => {
    if (!activeBook) return;
    setAddType(type);
    setAmount("");
    setCategory(type === "in" ? "Cash-in" : "Cash-out");
    setNote("");
    setPaymentMethod("");
    setTxDate(new Date());
    setApplyGst(false);
    setGstRate("18");
    setAddVisible(true);
  };

  const handleConfirmAdd = () => {
    if (!activeBook) return;
    const amt = parseFloat(amount || "0");
    if (!amt || amt <= 0) return;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let rate = 0;

    if (applyGst && gstEnabled) {
      rate = parseFloat(gstRate || "0");
      const tax = (amt * rate) / 100;
      cgst = tax / 2;
      sgst = tax / 2;
      igst = 0;
    }

    addTransaction({
      bookId: activeBook.id,
      type: addType,
      amount: amt,
      date: txDate.toISOString(),
      category: category.trim() || (addType === "in" ? "Cash-in" : "Cash-out"),
      note: note.trim(),
      paymentMethod: paymentMethod.trim(),
      isGstApplied: applyGst && gstEnabled && rate > 0,
      gstRate: rate,
      cgst,
      sgst,
      igst,
    });

    setAddVisible(false);
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  const openDatePicker = (field) => {
    setDatePickerField(field);
    const base =
      field === "from"
        ? fromDate || new Date()
        : field === "to"
        ? toDate || new Date()
        : txDate || new Date();
    setTempDate(base);
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    // Android: close on confirm / dismiss
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }
      setShowDatePicker(false);
    }

    if (!selectedDate) return;

    setTempDate(selectedDate);

    if (datePickerField === "from") {
      setFromDate(selectedDate);
    } else if (datePickerField === "to") {
      setToDate(selectedDate);
    } else if (datePickerField === "tx") {
      // ✅ fix: actually update transaction date
      setTxDate(selectedDate);
    }
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setFromDate(null);
    setToDate(null);
  };

  const filterSummary = () => {
    const parts = [];
    if (typeFilter !== "all") {
      parts.push(typeFilter === "in" ? "cash-in only" : "cash-out only");
    }
    if (fromDate && toDate) {
      parts.push(
        `from ${formatDate(fromDate)} to ${formatDate(toDate)}`
      );
    } else if (fromDate) {
      parts.push(`from ${formatDate(fromDate)}`);
    } else if (toDate) {
      parts.push(`up to ${formatDate(toDate)}`);
    }
    if (parts.length === 0) return "No filters applied";
    return parts.join(" · ");
  };

  const handleExportCsv = async () => {
    if (!activeBook) return;
    await exportTransactionsCSV(filteredTransactions);
  };

  const handleInvoicePdf = async () => {
    if (!activeBook) return;
    await generateInvoicePdf(activeBook, filteredTransactions);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {!activeBook ? (
          <View style={styles.emptyWrapper}>
            <MaterialIcons name="menu-book" size={42} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No active cashbook</Text>
            <Text style={styles.emptyText}>
              Create a cashbook from the Home tab first, then record
              cash-in and cash-out entries here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Transactions</Text>
                <Text style={styles.subtitle}>
                  For cashbook: {activeBook.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modePill}
                onPress={() => setFullMode((v) => !v)}
              >
                <Feather
                  name={fullMode ? "minimize-2" : "maximize-2"}
                  size={14}
                  color="#2563EB"
                />
                <Text style={styles.modePillText}>
                  {fullMode ? "Compact view" : "Full view & filters"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.typeRow}>
              <TouchableOpacity
                onPress={() => setTypeFilter("all")}
                style={[
                  styles.chip,
                  typeFilter === "all" && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    typeFilter === "all" && styles.chipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTypeFilter("in")}
                style={[
                  styles.chip,
                  typeFilter === "in" && styles.chipActiveIn,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    typeFilter === "in" && styles.chipTextActiveIn,
                  ]}
                >
                  Cash-in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTypeFilter("out")}
                style={[
                  styles.chip,
                  typeFilter === "out" && styles.chipActiveOut,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    typeFilter === "out" && styles.chipTextActiveOut,
                  ]}
                >
                  Cash-out
                </Text>
              </TouchableOpacity>
            </View>

            {fullMode && (
              <View style={styles.filterCard}>
                <View style={styles.filterRow}>
                  <View style={styles.dateFieldWrapper}>
                    <Text style={styles.filterLabel}>From</Text>
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => openDatePicker("from")}
                    >
                      <Feather name="calendar" size={14} color="#6B7280" />
                      <Text style={styles.dateFieldText}>
                        {fromDate ? formatDate(fromDate) : "Select"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateFieldWrapper}>
                    <Text style={styles.filterLabel}>To</Text>
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => openDatePicker("to")}
                    >
                      <Feather name="calendar" size={14} color="#6B7280" />
                      <Text style={styles.dateFieldText}>
                        {toDate ? formatDate(toDate) : "Select"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.filterMetaRow}>
                  <Text style={styles.filterSummaryText}>
                    {filterSummary()}
                  </Text>
                  <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* FIXED ADD BUTTONS ABOVE NAVBAR */}
            <View style={styles.fixedBottomActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnIn]}
                onPress={() => handleOpenAdd("in")}
              >
                <Feather name="arrow-down-left" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnTextIn}>Add cash-in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOut]}
                onPress={() => handleOpenAdd("out")}
              >
                <Feather name="arrow-up-right" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnTextOut}>Add cash-out</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.listContent,
                styles.scrollPadBottom,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {shownTransactions.length === 0 ? (
                <View style={styles.emptyListCard}>
                  <Feather name="file-text" size={32} color="#9CA3AF" />
                  <Text style={styles.emptyListTitle}>No entries yet</Text>
                  <Text style={styles.emptyListText}>
                    Use the cash-in or cash-out buttons above to record your
                    first transaction.
                  </Text>
                </View>
              ) : (
                <>
                  {shownTransactions.map((t) => {
                    const isIn = t.type === "in";
                    const amountText = privateMode
                      ? "••••"
                      : `₹${t.amount.toFixed(2)}`;
                    const hasGst = t.isGstApplied && t.gstRate > 0;
                    const gstTotal =
                      (t.cgst || 0) + (t.sgst || 0) + (t.igst || 0);

                    return (
                      <View key={t.id} style={styles.txCard}>
                        <View style={styles.txHeaderRow}>
                          <View style={styles.txIconWrapper}>
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
                                  isIn
                                    ? "arrow-down-left"
                                    : "arrow-up-right"
                                }
                                size={18}
                                color="#FFFFFF"
                              />
                            </View>
                            <View>
                              <Text
                                style={styles.txCategory}
                                numberOfLines={1}
                              >
                                {t.category ||
                                  (isIn ? "Cash-in" : "Cash-out")}
                              </Text>
                              <Text style={styles.txMeta}>
                                {formatDate(t.date)} · {formatTime(t.date)} ·{" "}
                                {t.paymentMethod || "No method"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.txAmountCol}>
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
                            {hasGst && (
                              <Text style={styles.txGstText}>
                                GST {t.gstRate}% · ₹{gstTotal.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        </View>

                        {t.note ? (
                          <Text style={styles.txNote} numberOfLines={2}>
                            {t.note}
                          </Text>
                        ) : null}

                        <View style={styles.txFooterRow}>
                          <View style={styles.txTagsRow}>
                            {hasGst && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>GST applied</Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDelete(t.id)}
                            style={styles.deleteBtn}
                          >
                            <Feather
                              name="trash-2"
                              size={16}
                              color="#DC2626"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}

                  {!fullMode && filteredTransactions.length > 5 && (
                    <View style={styles.moreWrapper}>
                      <Text style={styles.moreText}>
                        Showing 5 of {filteredTransactions.length} entries
                      </Text>
                      <TouchableOpacity
                        onPress={() => setFullMode(true)}
                        style={styles.moreBtn}
                      >
                        <Text style={styles.moreBtnText}>Open full view</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Export / Invoice section */}
                  <View style={styles.exportCard}>
                    <Text style={styles.exportTitle}>Export & reports</Text>
                    <Text style={styles.exportSubtitle}>
                      Exports always use the current filters (date range,
                      type).
                    </Text>
                    <View style={styles.exportRow}>
                      <TouchableOpacity
                        style={styles.exportBtn}
                        onPress={handleExportCsv}
                      >
                        <Feather name="file" size={16} color="#2563EB" />
                        <Text style={styles.exportBtnText}>Export CSV</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.exportBtnSecondary}
                        onPress={handleInvoicePdf}
                      >
                        <Feather
                          name="file-text"
                          size={16}
                          color="#111827"
                        />
                        <Text style={styles.exportBtnTextSecondary}>
                          Invoice PDF
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ height: 80 }} />
                </>
              )}
            </ScrollView>
          </>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}

        <Modal
          visible={addVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Scrollable body so GST UI behaves nicely on small screens */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {addType === "in" ? "Add cash-in" : "Add cash-out"}
                  </Text>
                  <TouchableOpacity onPress={() => setAddVisible(false)}>
                    <Feather name="x" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder={
                    addType === "in"
                      ? "Salary, refund..."
                      : "Groceries, rent..."
                  }
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Payment method</Text>
                <TextInput
                  style={styles.input}
                  value={paymentMethod}
                  onChangeText={setPaymentMethod}
                  placeholder="Cash, UPI, card..."
                  placeholderTextColor="#9CA3AF"
                />

                <Text style={styles.inputLabel}>Note</Text>
                <TextInput
                  style={[styles.input, styles.inputNote]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Optional description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />

                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateField}
                  onPress={() => {
                    setDatePickerField("tx");
                    setTempDate(txDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Feather name="calendar" size={14} color="#6B7280" />
                  <Text style={styles.dateFieldText}>
                    {formatDate(txDate.toISOString())}
                  </Text>
                </TouchableOpacity>

                {gstEnabled && (
                  <>
                    <View style={styles.switchRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Apply GST</Text>
                        <Text style={styles.switchHint}>
                          Auto-splits into CGST and SGST at the chosen rate.
                        </Text>
                      </View>
                      <Switch
                        value={applyGst}
                        onValueChange={setApplyGst}
                        thumbColor={applyGst ? "#2563EB" : "#E5E7EB"}
                        trackColor={{
                          false: "#E5E7EB",
                          true: "#BFDBFE",
                        }}
                      />
                    </View>

                    {applyGst && (
                      <View style={styles.gstRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>GST rate (%)</Text>
                          <View style={styles.gstRateRow}>
                            {["5", "12", "18", "28"].map((rate) => (
                              <TouchableOpacity
                                key={rate}
                                onPress={() => setGstRate(rate)}
                                style={[
                                  styles.gstChip,
                                  gstRate === rate && styles.gstChipActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.gstChipText,
                                    gstRate === rate &&
                                      styles.gstChipTextActive,
                                  ]}
                                >
                                  {rate}%
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    (!amount || parseFloat(amount) <= 0) && {
                      opacity: 0.6,
                    },
                  ]}
                  disabled={!amount || parseFloat(amount) <= 0}
                  onPress={handleConfirmAdd}
                >
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save entry</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FB" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2, maxWidth: 230 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  modePillText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  chipActive: {
    backgroundColor: "#2563EB",
  },
  chipTextActive: { color: "#FFFFFF" },
  chipActiveIn: { backgroundColor: "#DCFCE7" },
  chipTextActiveIn: { color: "#15803D" },
  chipActiveOut: { backgroundColor: "#FEE2E2" },
  chipTextActiveOut: { color: "#B91C1C" },
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    columnGap: 8,
  },
  dateFieldWrapper: { flex: 1 },
  filterLabel: { fontSize: 11, color: "#6B7280", marginBottom: 3 },
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateFieldText: {
    fontSize: 13,
    color: "#111827",
  },
  filterMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  filterSummaryText: {
    fontSize: 11,
    color: "#6B7280",
    flex: 1,
    marginRight: 10,
  },
  clearText: { fontSize: 11, color: "#2563EB", fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    columnGap: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
  },
  actionBtnIn: { backgroundColor: "#16A34A" },
  actionBtnOut: { backgroundColor: "#DC2626" },
  actionBtnTextIn: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  actionBtnTextOut: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  fixedBottomActions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20, // sits just above bottom nav
    flexDirection: "row",
    columnGap: 10,
    zIndex: 999,
  },
  scrollPadBottom: {
    paddingBottom: 120, // space so list doesn't hide behind buttons
  },
  scroll: { flex: 1, marginTop: 4 },
  listContent: { paddingBottom: 16 },
  emptyListCard: {
    marginTop: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  emptyListTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  emptyListText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  txCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  txHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  txIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  txMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  txAmountCol: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  txGstText: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 1,
  },
  txNote: {
    marginTop: 6,
    fontSize: 12,
    color: "#4B5563",
  },
  txFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  txTagsRow: {
    flexDirection: "row",
    columnGap: 6,
  },
  tag: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 10,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
  },
  moreWrapper: {
    marginTop: 10,
    alignItems: "center",
  },
  moreText: {
    fontSize: 11,
    color: "#6B7280",
  },
  moreBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  moreBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exportCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  exportSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 8,
  },
  exportRow: {
    flexDirection: "row",
    columnGap: 8,
  },
  exportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  exportBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  exportBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  exportBtnTextSecondary: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
  inputNote: {
    height: 70,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  switchHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    maxWidth: 220,
  },
  gstRow: {
    marginTop: 6,
  },
  gstRateRow: {
    flexDirection: "row",
    columnGap: 8,
    marginTop: 4,
  },
  gstChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  gstChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  gstChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  gstChipTextActive: {
    color: "#FFFFFF",
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: "#2563EB",
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
