import { liteClient } from "algoliasearch/lite";

let client;

export function getAlgoliaSearchConfig() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_PRODUCTS_INDEX;

  if (!appId || !searchKey || !indexName) return null;

  if (!client) client = liteClient(appId, searchKey);
  return { client, indexName };
}
