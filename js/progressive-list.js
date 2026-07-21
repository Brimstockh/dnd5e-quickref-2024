(function (root) {
    "use strict";

    function create(options) {
        var button = options.button;
        var batchSize = Math.max(1, Number(options.batchSize) || 60);
        var limit = batchSize;

        button.addEventListener("click", function () {
            limit += batchSize;
            options.onChange();
        });

        function take(items) {
            var visible = items.slice(0, limit);
            var remaining = items.length - visible.length;
            button.hidden = remaining === 0;
            button.textContent = remaining > 0
                ? "Afficher " + Math.min(batchSize, remaining) + " résultats de plus (" + visible.length + "/" + items.length + ")"
                : "";
            return visible;
        }

        return {
            reset: function () { limit = batchSize; },
            take: take,
        };
    }

    root.DndProgressiveList = { create: create };
})(globalThis);
