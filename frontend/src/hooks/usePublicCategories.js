import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  buildCustomerNavFromApi,
  buildHomeCategoryChips,
} from '../data/customerCategories';

/**
 * Loads live marketplace categories created by vendors.
 * Customer sidebar / home chips use this — not a hardcoded list.
 */
export default function usePublicCategories() {
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/shops/categories/public');
        if (!cancelled) {
          setApiCategories(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load public categories', err);
        if (!cancelled) {
          setApiCategories([]);
          setError('Could not load categories');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    apiCategories,
    navItems: buildCustomerNavFromApi(apiCategories),
    homeChips: buildHomeCategoryChips(apiCategories),
    loading,
    error,
  };
}
