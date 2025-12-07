(function () {
    // servers s01. .. s10.
    const servers = Array.from({ length: 10 }, (_, i) =>
        `s${String(i + 1).padStart(2, "0")}.`
    );

    // Test if an image URL can be loaded
    function testImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url + (url.includes("?") ? "&" : "?") + "cache=" + Math.random();
        });
    }

    // Try all servers s01..s10 for the given URL
    async function tryAllServers(originalUrl) {
        // detect sXX. pattern (XX = 01–10)
        const match = originalUrl.match(/s\d{2}\./);
        if (!match) return null;

        const current = match[0];

        for (let srv of servers) {
            if (srv === current) continue;
            const candidate = originalUrl.replace(current, srv);
            try {
                const ok = await testImage(candidate);
                if (ok) return candidate;
            } catch (_) {}
        }
        return null;
    }

    // Handle failed image
    async function handleFailedImage(img) {
        const originalUrl = img.dataset.src || img.src || "";
        if (!originalUrl) return;

        if (!/s\d{2}\./.test(originalUrl)) return;

        const fixed = await tryAllServers(originalUrl);
        if (fixed) {
            if (img.dataset && img.dataset.src) img.dataset.src = fixed;
            img.src = fixed;
            console.log("[FixImages] replaced:", originalUrl, "→", fixed);
        } else {
            console.log("[FixImages] no alternative server found:", originalUrl);
        }
    }

    // attach error handler once
    function attachHandler(img) {
        img.removeEventListener("error", onImgError);
        img.addEventListener("error", onImgError);
    }

    function onImgError(e) {
        handleFailedImage(e.currentTarget).catch(() => {});
    }

    // initial scan
    function initialScan() {
        document.querySelectorAll("img").forEach(img => {
            attachHandler(img);

            const url = img.dataset.src || img.src || "";
            if ((img.complete && img.naturalWidth === 0) && /s\d{2}\./.test(url)) {
                handleFailedImage(img).catch(() => {});
            }
        });
    }

    // mutation observer for lazy/infinite images
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (!m.addedNodes) continue;
            m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.tagName === "IMG") {
                    attachHandler(node);
                } else {
                    node.querySelectorAll?.("img").forEach(attachHandler);
                }
            });
        }
    });

    // start
    initialScan();
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("load", () => {
        setTimeout(initialScan, 250);
    });
})();
