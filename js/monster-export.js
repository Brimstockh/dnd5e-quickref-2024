(function (root) {
  "use strict";

  function buildMonsterExportJson(monster) {
    return `${JSON.stringify(monster || {}, null, 2)}\n`;
  }

  function monsterExportFilename(monster) {
    const source = monster?.slug || monster?.name || "monstre";
    const slug = String(source)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${slug || "monstre"}.json`;
  }

  function downloadMonsterJson(monster) {
    const content = buildMonsterExportJson(monster);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = monsterExportFilename(monster);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    return link.download;
  }

  root.DndMonsterExport = root.DndMonsterExport || {};
  root.DndMonsterExport.buildMonsterExportJson = buildMonsterExportJson;
  root.DndMonsterExport.downloadMonsterJson = downloadMonsterJson;
  root.DndMonsterExport.monsterExportFilename = monsterExportFilename;
})(globalThis);
