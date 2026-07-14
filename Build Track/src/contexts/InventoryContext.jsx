import { createContext, useContext, useState, useCallback } from 'react';
import { inventoryAPI } from '../api';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryAPI.getAll();
      const data = res.data?.inventory || res.data || [];
      setItems(data);
      return data;
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateThreshold = useCallback(async (id, threshold) => {
    const res = await inventoryAPI.updateThreshold(id, threshold);
    setItems((prev) =>
      prev.map((item) =>
        (item._id === id || item.id === id)
          ? { ...item, threshold, ...(res.data || {}) }
          : item
      )
    );
    return res.data;
  }, []);

  const addInventory = useCallback(async (data) => {
    const res = await inventoryAPI.add(data);
    await fetchInventory();
    return res.data;
  }, [fetchInventory]);

  const getStatus = useCallback((balance, threshold = 5) => {
    if (balance <= 0) return 'Out of Stock';
    if (balance <= threshold) return 'Low Stock';
    return 'In Stock';
  }, []);

  const value = {
    items, loading, error,
    fetchInventory, updateThreshold, addInventory, getStatus,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

export default InventoryContext;
