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

const API_URL = getApiUrl('/products');

/**
 * useProducts – custom hook for fetching & caching the product list.
 *
 * Returns { products, isLoading, error, lastUpdated, refresh, search }.
 *
 *  products    – Array of product objects ([] while loading).
 *  isLoading   – true during the network request.
 *  error       – Error message string, or null.
 *  lastUpdated – Date object of the most recent successful fetch.
 *  refresh()   – Clears the cache and re-fetches from the network.
 *  search(q)   – Fetches products matching query `q` from the backend
 *                and updates the cache with the results.
 */
export default function useProducts() {
  // Initialise state from the cache so returning to this page is
  // instant: products are shown immediately, isLoading starts false.
  const [products, setProducts] = useState(cachedProducts ?? []);
  const [isLoading, setIsLoading] = useState(cachedProducts === null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(cachedLastUpdated);

  // fetchProducts hits the network and writes both the module-level
  // cache AND the React state.  Because it updates the cache first,
  // any *new* component that mounts mid-flight will still pick up
  // the freshest data once the fetch resolves.
  const fetchProducts = useCallback(async (searchQuery = '') => {
    setIsLoading(true);
    setError(null);

    try {
      // Build URL with optional search parameter
      let url = API_URL;
      if (searchQuery.trim()) {
        url += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      const now = new Date();

      // Write to the module-level cache so future mounts skip the fetch.
      cachedProducts = data;
      cachedLastUpdated = now;

      // Sync React state so the current component re-renders.
      setProducts(data);
      setLastUpdated(now);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On mount: only fetch if the cache is empty (first load or after
  // a refresh).  If cachedProducts already has data we skip the
  // network call entirely — that's the whole point of the cache.
  useEffect(() => {
    if (cachedProducts === null) {
      fetchProducts();
    }
  }, [fetchProducts]);

  // refresh – the user-facing "Refresh products" action.
  // Nulls the cache so the next fetchProducts() call treats it as a
  // cold start, then immediately fires the fetch.
  const refresh = useCallback(() => {
    cachedProducts = null;
    cachedLastUpdated = null;
    fetchProducts();
  }, [fetchProducts]);

  // search – queries the backend with a search term and updates the
  // product cache with the results.
  const search = useCallback((query) => {
    return fetchProducts(query);
  }, [fetchProducts]);

  return { products, isLoading, error, lastUpdated, refresh, search };
}
