// context/TransactionsContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TransactionsContext = createContext(null);

const STORAGE_KEY = "@smartspend_transactions_v1";

// Same ID generator as BooksContext
function makeId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setTransactions(parsed.transactions || []);
          setGstEnabled(!!parsed.gstEnabled);
          setRoundUpEnabled(!!parsed.roundUpEnabled);
          setPrivateMode(!!parsed.privateMode);
          setMonthlyBudget(
            typeof parsed.monthlyBudget === "number"
              ? parsed.monthlyBudget
              : null
          );
          setSavingsGoal(
            typeof parsed.savingsGoal === "number"
              ? parsed.savingsGoal
              : null
          );
        }
      } catch (e) {
        console.log("Failed to load transactions", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const persist = async () => {
      try {
        const payload = JSON.stringify({
          transactions,
          gstEnabled,
          roundUpEnabled,
          privateMode,
          monthlyBudget,
          savingsGoal,
        });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        console.log("Failed to save transactions", e);
      }
    };
    persist();
  }, [
    transactions,
    gstEnabled,
    roundUpEnabled,
    privateMode,
    monthlyBudget,
    savingsGoal,
    loading,
  ]);

  const addTransaction = (tx) => {
    const now = new Date().toISOString();
    const newTx = {
      id: makeId(),
      createdAt: now,
      ...tx,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAllTransactions = () => {
    setTransactions([]);
  };

  const getBookBalance = (bookId) => {
    let inTotal = 0;
    let outTotal = 0;
    transactions.forEach((t) => {
      if (t.bookId !== bookId) return;
      if (t.type === "in") inTotal += t.amount || 0;
      if (t.type === "out") outTotal += t.amount || 0;
    });
    return {
      inTotal,
      outTotal,
      balance: inTotal - outTotal,
    };
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        clearAllTransactions,
        getBookBalance,
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
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error(
      "useTransactions must be used within TransactionsProvider"
    );
  }
  return ctx;
}
