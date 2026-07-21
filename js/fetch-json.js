export async function fetchJson(path, { optional = false, fetchImpl = globalThis.fetch } = {}) {
  let response;

  try {
    response = await fetchImpl(path);
  } catch {
    throw new Error(`Impossible de charger ${path}.`);
  }

  if (!response.ok) {
    if (optional) return null;
    throw new Error(`Impossible de charger ${path} (HTTP ${response.status}).`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`JSON invalide pour ${path}.`);
  }
}
