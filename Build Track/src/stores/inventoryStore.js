import { create } from "zustand";
import { inventoryAPI } from "../api";

const useInventoryStore = create((set, get) => ({
  items: [],
  summary: null,
  loading: false,
  error: null,
  sortBy: "name",
  sortOrder: "asc",
  filterCategory: "",
  filterStatus: "",

  async fetchInventory(force = false) {
    const state = get();
    if (state.items.length > 0 && !force) {
      inventoryAPI.getAll().then(({ data }) => {
        const list = Array.isArray(data) ? data : data.items || data.inventory || [];
        set({ items: list });
      }).catch(() => {});
      return state.items;
    }

    set({ loading: state.items.length === 0, error: null });
    try {
      const { data } = await inventoryAPI.getAll();
      const list = Array.isArray(data) ? data : data.items || data.inventory || [];
      set({ items: list, loading: false });
      return list;
    } catch (err) {
      set({ error: err.message || "Failed to load inventory", loading: false });
      return state.items || [];
    }
  },

  async fetchSummary() {
    try {
      const { data } = await inventoryAPI.getSummary ? inventoryAPI.getSummary() : { data: null };
      set({ summary: data?.summary || data });
      return data;
    } catch {
      return null;
    }
  },

  async updateThreshold(id, threshold) {
    try {
      const { data } = await inventoryAPI.updateThreshold(id, threshold);
      const updated = data.item || data;
      set((state) => ({
        items: state.items.map((item) =>
          (item._id || item.id) === id ? { ...item, threshold, ...updated } : item
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message || "Failed to update threshold" });
      throw err;
    }
  },

  async useInventoryItem(itemData) {
    try {
      const { data } = await inventoryAPI.use(itemData);
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to use inventory item" });
      throw err;
    }
  },

  setSortBy(field) {
    set((state) => ({
      sortBy: field,
      sortOrder: state.sortBy === field && state.sortOrder === "asc" ? "desc" : "asc",
    }));
  },

  setFilter(key, value) {
    set((state) => ({
      ...state,
      [`filter${key.charAt(0).toUpperCase() + key.slice(1)}`]: value,
    }));
  },

  clearError() {
    set({ error: null });
  },

  get sortedItems() {
    const state = get();
    let filtered = [...state.items];

    if (state.filterCategory) {
      filtered = filtered.filter((i) => i.category === state.filterCategory);
    }
    if (state.filterStatus) {
      filtered = filtered.filter((i) => i.status === state.filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal = a[state.sortBy] || "";
      let bVal = b[state.sortBy] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return state.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return state.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  },
}));

export default useInventoryStore;
