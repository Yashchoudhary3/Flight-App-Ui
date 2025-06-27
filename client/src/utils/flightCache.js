import { openDB } from 'idb';

const DB_NAME = 'flight-search-db';
const STORE_NAME = 'searches';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function cacheFlightSearch(queryKey, results) {
  const db = await getDB();
  await db.put(STORE_NAME, results, queryKey);
}

export async function getCachedFlightSearch(queryKey) {
  const db = await getDB();
  return db.get(STORE_NAME, queryKey);
}

export async function clearFlightCache() {
  const db = await getDB();
  await db.clear(STORE_NAME);
} 