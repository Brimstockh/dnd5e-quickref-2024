const THEME_KEY = "dnd2024_theme";

function readStoredTheme(storage) {
    return storage && typeof storage.get === "function" ? storage.get(THEME_KEY, null) : null;
}

function preferredTheme(view) {
    return view?.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
}

export function createThemeController({ document, storage, view = globalThis }) {
    let currentTheme = "dark";

    function apply(theme, persist) {
        currentTheme = theme === "light" ? "light" : "dark";
        document.documentElement.dataset.theme = currentTheme;
        if (persist && storage && typeof storage.set === "function") storage.set(THEME_KEY, currentTheme);
        return currentTheme;
    }

    function applyInitial() {
        const saved = readStoredTheme(storage);
        return apply(saved === "light" || saved === "dark" ? saved : preferredTheme(view), false);
    }

    function bind(button, setIcon) {
        setIcon(button, currentTheme === "dark" ? "theme-sun" : "theme-moon");
        button.addEventListener("click", () => {
            const next = apply(currentTheme === "dark" ? "light" : "dark", true);
            setIcon(button, next === "dark" ? "theme-sun" : "theme-moon");
        });
    }

    return Object.freeze({
        apply,
        applyInitial,
        bind,
        current: () => currentTheme,
    });
}
