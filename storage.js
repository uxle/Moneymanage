const Storage = (() => {
    const STORAGE_KEY = 'shopFlowData';
    let memoryCache = null;

    const defaultData = {
        settings: { theme: 'light' },
        shops: [
            { id: 1, name: "Shop 1", cash: 50000, expenses: 10000, income: 60000, yesterdayClosing: 48000 }
        ],
        transactions: [],
        reports: []
    };

    const get = () => {
        if (memoryCache) return memoryCache;
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            memoryCache = data ? JSON.parse(data) : JSON.parse(JSON.stringify(defaultData));
        } catch (e) {
            console.error("Storage parse error, falling back to default.", e);
            memoryCache = JSON.parse(JSON.stringify(defaultData));
        }
        return memoryCache;
    };

    const save = (data) => {
        memoryCache = data;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Storage save error (Quota exceeded?).", e);
            if (window.UI) window.UI.showToast("Storage quota exceeded! Cannot save.", "error");
        }
    };

    return { get, save, defaultData };
})();