import { create } from "zustand";
import { transactionAPI } from "../api";

const useTransactionStore = create((set, get) => ({
  transactions: [],
  totalTransactions: 0,
  page: 1,
  limit: 20,
  loading: false,
  error: null,
  filters: {
    type: "",
    projectId: "",
    search: "",
    paymentStatus: "",
    sortBy: "date",
    sortOrder: "desc",
  },

  async fetchTransactions(params = {}) {
    set({ loading: true, error: null });
    try {
      const state = get();
      const queryParams = {
        page: state.page,
        limit: state.limit,
        ...state.filters,
        ...params,
      };
      Object.keys(queryParams).forEach((key) => {
        if (!queryParams[key]) delete queryParams[key];
      });

      const { data } = await transactionAPI.getAll(queryParams);
      const list = Array.isArray(data) ? data : data.transactions || [];
      set({
        transactions: list,
        totalTransactions: data.total || data.totalCount || list.length,
        loading: false,
      });
      return list;
    } catch (err) {
      set({ error: err.message || "Failed to load transactions", loading: false });
      return [];
    }
  },

  async createTransaction(txData) {
    try {
      const { data } = await transactionAPI.create(txData);
      const newTx = data.transaction || data;
      set((state) => ({ transactions: [newTx, ...state.transactions] }));
      return newTx;
    } catch (err) {
      set({ error: err.message || "Failed to create transaction" });
      throw err;
    }
  },

  async updateTransaction(id, updates) {
    try {
      const { data } = await transactionAPI.update(id, updates);
      const updated = data.transaction || data;
      set((state) => ({
        transactions: state.transactions.map((t) =>
          (t._id || t.id) === id ? updated : t
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message || "Failed to update transaction" });
      throw err;
    }
  },

  async deleteTransaction(id) {
    try {
      await transactionAPI.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => (t._id || t.id) !== id),
      }));
      return true;
    } catch (err) {
      set({ error: err.message || "Failed to delete transaction" });
      throw err;
    }
  },

  setPage(page) {
    set({ page });
  },

  setFilter(key, value) {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    }));
  },

  resetFilters() {
    set({
      filters: {
        type: "",
        projectId: "",
        search: "",
        paymentStatus: "",
        sortBy: "date",
        sortOrder: "desc",
      },
      page: 1,
    });
  },

  clearError() {
    set({ error: null });
  },
}));

export default useTransactionStore;
