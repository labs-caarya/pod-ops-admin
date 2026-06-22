import { useSyncExternalStore } from "react";
import { makeId } from "./utils";

/**
 * Tiny localStorage-backed collection with a subscription model so multiple
 * components stay in sync. The shape intentionally mirrors a REST resource so
 * it can be swapped for chronos-be / a real backend later without touching
 * callers.
 */

const NS = "podops.v6";

export interface Entity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection<T extends Entity> {
  key: string;
  all: () => T[];
  get: (id: string) => T | undefined;
  upsert: (item: Partial<T> & { id?: string }) => T;
  remove: (id: string) => void;
  replaceAll: (items: T[]) => void;
  subscribe: (cb: () => void) => () => void;
}

export function createCollection<T extends Entity>(
  name: string,
  seed: T[] = [],
): Collection<T> {
  const key = `${NS}.${name}`;
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;

  function read(): T[] {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        cache = JSON.parse(raw) as T[];
        return cache;
      }
    } catch {
      /* ignore */
    }
    cache = seed;
    write(seed);
    return cache;
  }

  function write(items: T[]) {
    cache = items;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
    listeners.forEach((cb) => cb());
  }

  return {
    key,
    all: () => read(),
    get: (id) => read().find((i) => i.id === id),
    upsert(item) {
      const items = [...read()];
      const now = new Date().toISOString();
      if (item.id) {
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          const merged = { ...items[idx], ...item, updatedAt: now } as T;
          items[idx] = merged;
          write(items);
          return merged;
        }
      }
      const created = {
        ...item,
        id: item.id || makeId(name.slice(0, 3)),
        createdAt: now,
        updatedAt: now,
      } as T;
      write([created, ...items]);
      return created;
    },
    remove(id) {
      write(read().filter((i) => i.id !== id));
    },
    replaceAll(items) {
      write(items);
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

/** React hook: subscribe a component to a collection. */
export function useCollection<T extends Entity>(collection: Collection<T>): T[] {
  return useSyncExternalStore(
    collection.subscribe,
    collection.all,
    collection.all,
  );
}
