(function () {
    const servers = ["s03.", "s04.", "s05.", "s06.", "s07.", "s08.", "s09."];

    function testImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url + "?cache=" + Math.random();
        });
    }

    async function fixUrl(originalUrl) {
        if (!originalUrl.includes("s02.")) return null;

        for (let srv of servers) {
            const newUrl = originalUrl.replace("s02.", srv);
            const ok = await testImage(newUrl);
            if (ok) return newUrl;
        }

        return null;
    }

    async function handleImage(img) {
        let url = img.dataset.src || img.src;
        if (!url.includes("s02.")) return;

        const fixed = await fixUrl(url);
        if (fixed) {
            if (img.dataset.src) {
                img.dataset.src = fixed;
            }
            img.src = fixed;
            console.log("Fixed:", fixed);
        }
    }

    function scanImages() {
        document.querySelectorAll("img").forEach(img => {
            img.addEventListener("error", () => handleImage(img));
            handleImage(img);
        });
    }

    scanImages();

    // Untuk image yang muncul setelah scroll (lazy-loading)
    const observer = new MutationObserver(() => scanImages());
    observer.observe(document.body, { childList: true, subtree: true });

})();
