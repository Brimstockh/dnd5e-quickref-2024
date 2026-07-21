import { escapeHtml } from "./html-utils.js";

const ALLOWED_TAG_PATTERN = /&lt;(\/?)(p|strong|ul|li)&gt;/gi;

export function sanitizeRichHtml(value) {
  return escapeHtml(value).replace(ALLOWED_TAG_PATTERN, function (_, closingSlash, tagName) {
    return `<${closingSlash}${tagName.toLowerCase()}>`;
  });
}
