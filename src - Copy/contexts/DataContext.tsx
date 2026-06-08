// src/contexts/DataContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Transaction = {
  id: string;
  amount: number;
  type: 'debtor' | 'creditor';
  description: string;
  createdAt: string;
  updatedAt?: string;
};

export type Person = {
  id: string;
  name: string;
  transactions: Transaction[];
};

type DataContextType = {
  persons: Person[];
  addPerson: (name: string) => void;
  updatePerson: (id: string, newName: string) => void;
  deletePerson: (id: string) => void;
  addTransaction: (personId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (personId: string, transactionId: string, updatedTransaction: Partial<Transaction>) => void;
  deleteTransaction: (personId: string, transactionId: string) => void;
  importData: (data: Person[]) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);
const STORAGE_KEY = '@debt_app_data';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [persons, setPersons] = useState<Person[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setPersons(JSON.parse(stored));
      } catch (error) {
        console.error('خطا در بارگذاری:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
      } catch (error) {
        console.error('خطا در ذخیره:', error);
      }
    };
    saveData();
  }, [persons]);

  const addPerson = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      transactions: [],
    };
    setPersons(prev => [newPerson, ...prev]);
  };

  const updatePerson = (id: string, newName: string) => {
    setPersons(prev =>
      prev.map(p => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const deletePerson = (id: string) => {
    setPersons(prev => prev.filter(p => p.id !== id));
  };

  const addTransaction = (personId: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    setPersons(prev =>
      prev.map(person => {
        if (person.id !== personId) return person;
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        return { ...person, transactions: [...person.transactions, newTransaction] };
      })
    );
  };

  const updateTransaction = (personId: string, transactionId: string, updatedTransaction: Partial<Transaction>) => {
    setPersons(prev =>
      prev.map(person => {
        if (person.id !== personId) return person;
        const updatedTransactions = person.transactions.map(t =>
          t.id === transactionId
            ? { ...t, ...updatedTransaction, updatedAt: new Date().toISOString() }
            : t
        );
        return { ...person, transactions: updatedTransactions };
      })
    );
  };

  const deleteTransaction = (personId: string, transactionId: string) => {
    setPersons(prev =>
      prev.map(person => {
        if (person.id !== personId) return person;
        return { ...person, transactions: person.transactions.filter(t => t.id !== transactionId) };
      })
    );
  };

  const importData = (newData: Person[]) => {
    setPersons(newData);
  };

  return (
    <DataContext.Provider
      value={{
        persons,
        addPerson,
        updatePerson,
        deletePerson,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};