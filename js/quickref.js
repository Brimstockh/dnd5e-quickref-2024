(function () {
    "use strict";

    function addQuickrefItem(parent, data, type) {
        var icon = data.icon || "perspective-dice-six-faces-one";
        var subtitle = data.subtitle || "";
        var title = data.title || "[sans titre]";
        var item = document.createElement("div");
        var iconEl = document.createElement("div");
        var textContainer = document.createElement("div");
        var titleEl = document.createElement("div");
        var subtitleEl = document.createElement("div");

        item.className = "item itemsize";
        iconEl.className = "item-icon iconsize icon-" + icon;
        textContainer.className = "item-text-container text";
        titleEl.className = "item-title";
        titleEl.textContent = title;
        subtitleEl.className = "item-desc";
        subtitleEl.textContent = subtitle;

        textContainer.appendChild(titleEl);
        textContainer.appendChild(subtitleEl);
        item.appendChild(iconEl);
        item.appendChild(textContainer);

        var style = window.getComputedStyle(parent.parentNode.parentNode);
        var color = style.backgroundColor;
        item.addEventListener("click", function () {
            showModal(data, color, type);
        });
        parent.appendChild(item);
    }

    function showModal(data, color, type) {
        var title = data.title || "[sans titre]";
        var subtitle = data.description || data.subtitle || "";
        var bullets = Array.isArray(data.bullets) ? data.bullets : [];
        var reference = data.reference || "";
        var modalTitle = document.getElementById("modal-title");
        var typeEl = document.createElement("span");
        var bulletsEl = document.getElementById("modal-bullets");

        document.body.classList.add("modal-open");
        document.getElementById("modal").classList.add("modal-visible");
        document.getElementById("modal-backdrop").style.height = window.innerHeight + "px";
        document.getElementById("modal-container").style.backgroundColor = color || "black";
        document.getElementById("modal-container").style.borderColor = color || "black";

        modalTitle.textContent = title;
        typeEl.className = "float-right";
        typeEl.textContent = type || "";
        modalTitle.appendChild(typeEl);
        document.getElementById("modal-subtitle").textContent = subtitle;
        document.getElementById("modal-reference").textContent = reference;

        bulletsEl.replaceChildren();
        bullets.forEach(function (bullet, index) {
            if (index > 0) bulletsEl.appendChild(document.createElement("hr"));
            var paragraph = document.createElement("p");
            paragraph.className = "fonstsize";
            paragraph.innerHTML = bullet;
            bulletsEl.appendChild(paragraph);
        });
    }

    function hideModal() {
        document.body.classList.remove("modal-open");
        document.getElementById("modal").classList.remove("modal-visible");
    }

    function fillSection(data, parentId, type) {
        var parent = document.getElementById(parentId);
        if (!parent || !Array.isArray(data)) return;
        data.forEach(function (item) {
            addQuickrefItem(parent, item, type);
        });
    }

    function init() {
        fillSection(data_movement, "basic-movement", "Déplacement");
        fillSection(data_action, "basic-actions", "Action");
        fillSection(data_bonusaction, "basic-bonus-actions", "Action bonus");
        fillSection(data_reaction, "basic-reactions", "Réaction");
        fillSection(data_condition, "basic-conditions", "État");
        fillSection(data_environment_obscurance, "environment-obscurance", "Environnement");
        fillSection(data_environment_light, "environment-light", "Environnement");
        fillSection(data_environment_vision, "environment-vision", "Environnement");
        fillSection(data_environment_cover, "environment-cover", "Environnement");

        document.getElementById("modal").addEventListener("click", hideModal);
    }

    document.addEventListener("DOMContentLoaded", init, { once: true });
})();
