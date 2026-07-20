(function (root) {
  "use strict";

  const ALLOWED_TAG_PATTERN = /&lt;(\/?)(p|strong|ul|li)&gt;/gi;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sanitizeRichHtml(value) {
    return escapeHtml(value).replace(ALLOWED_TAG_PATTERN, function (_, closingSlash, tagName) {
      return `<${closingSlash}${tagName.toLowerCase()}>`;
    });
  }

  root.DndHtml = root.DndHtml || {};
  root.DndHtml.sanitizeRichHtml = sanitizeRichHtml;
})(globalThis);
