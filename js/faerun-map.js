(() => {
    const viewer = document.querySelector("[data-map-viewer]");
    const image = document.querySelector("[data-map-image]");
    const zoomIn = document.querySelector("[data-map-zoom-in]");
    const zoomOut = document.querySelector("[data-map-zoom-out]");
    const reset = document.querySelector("[data-map-reset]");
    const zoomValue = document.querySelector("[data-map-zoom-value]");

    if (!viewer || !image) return;

    const state = {
        scale: 1,
        x: 0,
        y: 0,
        minScale: 1,
        maxScale: 10,
        pointers: new Map(),
        lastPinchDistance: 0
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function applyTransform() {
        state.scale = clamp(state.scale, state.minScale, state.maxScale);
        image.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
        if (zoomValue) zoomValue.textContent = `${Math.round(state.scale * 100)}%`;
    }

    function zoomAt(nextScale, clientX, clientY) {
        const rect = viewer.getBoundingClientRect();
        const originX = clientX - rect.left;
        const originY = clientY - rect.top;
        const oldScale = state.scale;

        state.scale = clamp(nextScale, state.minScale, state.maxScale);
        const ratio = state.scale / oldScale;
        state.x = originX - (originX - state.x) * ratio;
        state.y = originY - (originY - state.y) * ratio;
        applyTransform();
    }

    function resetView() {
        state.scale = 1;
        state.x = 0;
        state.y = 0;
        applyTransform();
    }

    function getPointerDistance() {
        const pointers = [...state.pointers.values()];
        if (pointers.length < 2) return 0;
        const dx = pointers[0].clientX - pointers[1].clientX;
        const dy = pointers[0].clientY - pointers[1].clientY;
        return Math.hypot(dx, dy);
    }

    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;

    viewer.addEventListener("pointerdown", (event) => {
        viewer.setPointerCapture(event.pointerId);
        state.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

        if (state.pointers.size === 1) {
            dragPointerId = event.pointerId;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            dragOriginX = state.x;
            dragOriginY = state.y;
            viewer.classList.add("is-dragging");
        } else if (state.pointers.size === 2) {
            state.lastPinchDistance = getPointerDistance();
            dragPointerId = null;
            viewer.classList.remove("is-dragging");
        }
    });

    viewer.addEventListener("pointermove", (event) => {
        if (!state.pointers.has(event.pointerId)) return;
        state.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

        if (state.pointers.size === 2) {
            const distance = getPointerDistance();
            if (state.lastPinchDistance) {
                const midpoint = [...state.pointers.values()].reduce(
                    (acc, pointer) => ({ clientX: acc.clientX + pointer.clientX / 2, clientY: acc.clientY + pointer.clientY / 2 }),
                    { clientX: 0, clientY: 0 }
                );
                zoomAt(state.scale * (distance / state.lastPinchDistance), midpoint.clientX, midpoint.clientY);
            }
            state.lastPinchDistance = distance;
            return;
        }

        if (event.pointerId === dragPointerId) {
            state.x = dragOriginX + (event.clientX - dragStartX);
            state.y = dragOriginY + (event.clientY - dragStartY);
            applyTransform();
        }
    });

    function releasePointer(event) {
        state.pointers.delete(event.pointerId);
        if (state.pointers.size < 2) state.lastPinchDistance = 0;
        if (event.pointerId === dragPointerId) {
            dragPointerId = null;
            viewer.classList.remove("is-dragging");
        }
    }

    viewer.addEventListener("pointerup", releasePointer);
    viewer.addEventListener("pointercancel", releasePointer);
    viewer.addEventListener("pointerleave", releasePointer);

    viewer.addEventListener("wheel", (event) => {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 1.1 : 0.9;
        zoomAt(state.scale * delta, event.clientX, event.clientY);
    }, { passive: false });

    if (zoomIn) {
        zoomIn.addEventListener("click", () => {
            const rect = viewer.getBoundingClientRect();
            zoomAt(state.scale * 1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener("click", () => {
            const rect = viewer.getBoundingClientRect();
            zoomAt(state.scale * 0.85, rect.left + rect.width / 2, rect.top + rect.height / 2);
        });
    }

    if (reset) {
        reset.addEventListener("click", resetView);
    }

    image.addEventListener("error", () => {
        viewer.classList.add("is-missing");
    });

    applyTransform();
})();
