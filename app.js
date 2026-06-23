const App = (() => {
    const init = () => {
        // Initialize memory state safely
        window.App = { 
            data: Storage.get(),
            refreshAll: refreshAll,
            deleteTxn: History.deleteTxn // Map for HTML onclick handlers
        };

        // Initialize Core UI systems
        UI.init();
        UI.applySavedTheme();
        if (window.lucide) window.lucide.createIcons();

        // Init modules logic & cache nodes
        Reports.init();
        Shops.init();
        Transactions.init();
        Calculator.init();
        History.init();
        
        History.attachFilters();
        
        // Initial Mount Renders
        refreshAll();
        setupEventListeners();
        
        // Auto-load calculator defaults
        if (window.App.data.shops && window.App.data.shops.length > 0) {
            Calculator.loadShopData();
        }
    };

    const refreshAll = () => {
        Shops.renderCards();
        Reports.renderOverall();
        History.render();
    };

    const setupEventListeners = () => {
        // General Actions
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', UI.toggleTheme);
        
        const addShopBtn = document.getElementById('add-shop-btn');
        if (addShopBtn) addShopBtn.addEventListener('click', Shops.addShop);
        
        // Form Handling
        const txForm = document.getElementById('tx-form');
        if (txForm) txForm.addEventListener('submit', Transactions.handleFormSubmit);
        
        // Close Modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => UI.closeModal('tx-modal'));
        });
        
        // Calculator Submits
        const saveReportBtn = document.getElementById('save-report-btn');
        if (saveReportBtn) saveReportBtn.addEventListener('click', Calculator.saveReport);
        
        const printReportBtn = document.getElementById('print-report-btn');
        if (printReportBtn) printReportBtn.addEventListener('click', Calculator.printDailyReport);
        
        // Data IO Exports/Imports
        const exportMdBtn = document.getElementById('export-md-btn');
        if (exportMdBtn) exportMdBtn.addEventListener('click', Reports.exportMarkdown);
        
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', Reports.exportJSON);
        
        const importJsonBtn = document.getElementById('import-json-btn');
        const importFile = document.getElementById('import-file');
        
        if (importJsonBtn && importFile) {
            importJsonBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', Reports.importJSON);
        }
    };

    return { init };
})();

// Bootstrap Application entry point
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}