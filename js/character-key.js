const CHARACTER_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_CHARACTER_KEY_LENGTH = 80;

export function validateCharacterKey(value) {
  const key = String(value ?? "").trim();
  if (!key || key.length > MAX_CHARACTER_KEY_LENGTH || !CHARACTER_KEY_PATTERN.test(key)) {
    throw new Error("Clé de personnage invalide.");
  }
  return key;
}
