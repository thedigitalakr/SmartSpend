// context/BooksContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BooksContext = createContext(null);

const STORAGE_KEY = "@smartspend_books_v1";

// Simple ID generator (no extra libraries)
function makeId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function BooksProvider({ children }) {
  const [books, setBooks] = useState([]);
  const [activeBookId, setActiveBookId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setBooks(parsed.books || []);
          setActiveBookId(parsed.activeBookId || null);
        }
      } catch (e) {
        console.log("Failed to load books", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const persist = async () => {
      try {
        const payload = JSON.stringify({ books, activeBookId });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {
        console.log("Failed to save books", e);
      }
    };
    persist();
  }, [books, activeBookId, loading]);

  const addBook = ({ name, description, color }) => {
    const now = new Date().toISOString();
    const newBook = {
      id: makeId(),
      name,
      description: description || "",
      color: color || "#2563EB",
      createdAt: now,
    };
    setBooks((prev) => [newBook, ...prev]);
    if (!activeBookId) setActiveBookId(newBook.id);
    return newBook;
  };

  const setActiveBook = (id) => {
    setActiveBookId(id);
  };

  const clearAllBooks = () => {
    setBooks([]);
    setActiveBookId(null);
  };

  const deleteBook = (id) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setActiveBookId((prevId) => {
      if (prevId === id) {
        const remaining = books.filter((b) => b.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prevId;
    });
  };

  const activeBook = books.find((b) => b.id === activeBookId) || null;

  return (
    <BooksContext.Provider
      value={{
        books,
        activeBook,
        activeBookId,
        loading,
        addBook,
        setActiveBook,
        clearAllBooks,
        deleteBook,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) {
    throw new Error("useBooks must be used within BooksProvider");
  }
  return ctx;
}
