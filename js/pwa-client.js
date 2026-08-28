(function () {
    "use strict";

    var doc = document;
    var script = doc.currentScript;
    var siteRoot = new URL("../", script ? script.src : window.location.href);
    var registration = null;
    var reloadAfterUpdate = false;
    var promptElement = null;

    function pageUrl(path) {
        return new URL(path, siteRoot).href;
    }

    function setStatus(status) {
        doc.documentElement.dataset.pwaStatus = status;
    }

    function ensureMetadata() {
        if (!doc.querySelector('link[rel="manifest"]')) {
            var manifest = doc.createElement("link");
            manifest.rel = "manifest";
            manifest.href = pageUrl("manifest.webmanifest");
            doc.head.append(manifest);
        }
        if (!doc.querySelector('meta[name="theme-color"]')) {
            var themeColor = doc.createElement("meta");
            themeColor.name = "theme-color";
            themeColor.content = "#0d0c0a";
            doc.head.append(themeColor);
        }
    }

    function dismissPrompt() {
        if (!promptElement) return;
        promptElement.remove();
        promptElement = null;
    }

    function showUpdatePrompt(worker) {
        if (!worker || promptElement) return;

        var message = doc.createElement("p");
        var updateButton = doc.createElement("button");
        var laterButton = doc.createElement("button");
        var actions = doc.createElement("div");
        promptElement = doc.createElement("aside");

        promptElement.className = "pwa-update";
        promptElement.setAttribute("role", "status");
        promptElement.setAttribute("aria-live", "polite");
        message.textContent = "Une nouvelle version est disponible.";
        updateButton.type = "button";
        updateButton.className = "pwa-update__primary";
        updateButton.textContent = "Mettre à jour";
        laterButton.type = "button";
        laterButton.textContent = "Plus tard";
        actions.className = "pwa-update__actions";

        updateButton.addEventListener("click", function () {
            reloadAfterUpdate = true;
            updateButton.disabled = true;
            updateButton.textContent = "Mise à jour…";
            worker.postMessage({ type: "SKIP_WAITING" });
        });
        laterButton.addEventListener("click", dismissPrompt);

        actions.append(updateButton, laterButton);
        promptElement.append(message, actions);
        doc.body.append(promptElement);
        updateButton.focus();
    }

    function watchRegistration(nextRegistration) {
        registration = nextRegistration;
        if (registration.waiting) showUpdatePrompt(registration.waiting);

        registration.addEventListener("updatefound", function () {
            var worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", function () {
                if (worker.state === "installed" && navigator.serviceWorker.controller) {
                    showUpdatePrompt(worker);
                }
            });
        });
    }

    async function register() {
        if (!("serviceWorker" in navigator)) {
            setStatus("unsupported");
            return null;
        }
        if (!window.isSecureContext && !/^(?:localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
            setStatus("unavailable");
            return null;
        }
        setStatus("registering");
        try {
            var nextRegistration = await navigator.serviceWorker.register(pageUrl("sw.js"), {
                scope: siteRoot.pathname,
            });
            watchRegistration(nextRegistration);
            setStatus("registered");
            navigator.serviceWorker.ready.then(function () { setStatus("ready"); });
            return nextRegistration;
        } catch (error) {
            setStatus("failed");
            console.warn("Le mode hors connexion n’a pas pu être activé.", error);
            return null;
        }
    }

    ensureMetadata();
    navigator.serviceWorker?.addEventListener("controllerchange", function () {
        if (reloadAfterUpdate) window.location.reload();
    });

    window.DndPwa = Object.freeze({
        dismissPrompt: dismissPrompt,
        getRegistration: function () { return registration; },
        pageUrl: pageUrl,
        register: register,
        showUpdatePrompt: showUpdatePrompt,
    });

    register();
})();
