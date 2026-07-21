import { readFileSync } from "node:fs";
import vm from "node:vm";

export function loadClassicScript(path, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const context = { ...globals };
  vm.runInNewContext(source, context);
  return context;
}
