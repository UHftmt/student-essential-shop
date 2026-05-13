import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';

// ── Module-level cache ──────────────────────────────────────────────
//
// These variables live *outside* the hook function, at the ES-module
// scope.  Because ES modules are singletons, every component that
// calls useProducts() shares the same two variables.
//
// WHY: React state is destroyed when a component unmounts.  Without
//      this cache the user would see a loading spinner every time they
//      navigate to /products and back.  The module-level cache keeps
//      the last-fetched data in memory so re-mounting is instant.
//
// TRADEOFFS:
//  • Stale data  – The cache is never automatically invalidated.
//                  Users must press "Refresh products" to get fresh
//                  data from the server.
//  • No cross-tab sync – Each browser tab runs its own JS bundle, so
//                  tabs don't share this cache.
//  • Lost on full reload – A hard page refresh (Cmd-R) re-runs the
//                  module, resetting cachedProducts to null and
//                  triggering a new fetch.  This is usually fine.
//  • Memory      – The entire product list stays in memory for the
//                  lifetime of the SPA.  Acceptable for small catalogs;
//                  for thousands of products you'd want pagination.
// ─────────────────────────────────────────────────────────────────────
let cachedProducts = null;   // holds the last-fetched product array
let cachedLastUpdated = null; // Date when the cache was last populated
let cachedPage = 1;
let cachedHasMore = true;
let cachedSearchQuery = '';

const API_URL = getApiUrl('/products');

/**
 * useProducts – custom hook for fetching & caching the product list.
 *
 * Returns { products, isLoading, error, lastUpdated, refresh, search, loadMore, hasMore }.
 */
export default function useProducts() {
  const [products, setProducts] = useState(cachedProducts ?? []);
  const [isLoading, setIsLoading] = useState(cachedProducts === null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cachedLastUpdated);
  const [hasMore, setHasMore] = useState(cachedHasMore);

  const fetchProducts = useCallback(async (searchQuery = '', page = 1, append = false) => {
    setIsLoading(!append);
    setError(null);

    try {
      let url = `${API_URL}?page=${page}&limit=15`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      const now = new Date();

      setProducts(prev => {
        const next = append ? [...prev, ...data] : data;
        cachedProducts = next;
        return next;
      });
      
      cachedLastUpdated = now;
      cachedPage = page;
      cachedHasMore = data.length === 15;
      cachedSearchQuery = searchQuery;

      setLastUpdated(now);
      setHasMore(data.length === 15);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedProducts === null) {
      fetchProducts();
    }
  }, [fetchProducts]);

  const refresh = useCallback(() => {
    cachedProducts = null;
    cachedLastUpdated = null;
    cachedPage = 1;
    cachedHasMore = true;
    cachedSearchQuery = '';
    fetchProducts();
  }, [fetchProducts]);

  const search = useCallback((query) => {
    return fetchProducts(query, 1, false);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (cachedHasMore) {
      fetchProducts(cachedSearchQuery, cachedPage + 1, true);
    }
  }, [fetchProducts]);

  return { products, isLoading, error, lastUpdated, refresh, search, loadMore, hasMore };
}
