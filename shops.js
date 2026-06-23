const Shops = (() => {
    let domContainer, domCalcSelect, domFilterShop;

    const init = () => {
        domContainer = document.getElementById('shops-container');
        domCalcSelect = document.getElementById('calc-shop-select');
        domFilterShop = document.getElementById('filter-shop');
    };

    const escapeHTML = (str) => {
        return String(str).replace(/[&<>'"]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[c] || c));
    };

    const renderCards = () => {
        if (!domContainer) return;
        const shops = window.App.data.shops;
        const txns = window.App.data.transactions;
        
        // Fast DOM generation
        let html = '';
        for (let i = 0; i < shops.length; i++) {
            const shop = shops[i];
            const profit = shop.income - shop.expenses;
            
            // Optimized counting
            let txCount = 0;
            for (let j = 0; j < txns.length; j++) {
                if (txns[j].shopId === shop.id) txCount++;
            }
            
            html += `
            <div class="glass shop-card">
                <div class="shop-header">
                    <span>${escapeHTML(shop.name)}</span>
                    <button type="button" class="btn-icon text-red" onclick="Shops.deleteShop(${shop.id})" title="Delete Shop" aria-label="Delete Shop">
                        <i data-lucide="trash-2" aria-hidden="true"></i>
                    </button>
                </div>
                <div class="shop-stats">
                    <div><span class="text-muted">Drawer:</span> <strong class="text-blue">₹${shop.cash.toLocaleString('en-IN')}</strong></div>
                    <div><span class="text-muted">Exp:</span> <strong class="text-red">₹${shop.expenses.toLocaleString('en-IN')}</strong></div>
                    <div><span class="text-muted">Profit:</span> <strong class="text-green">₹${profit.toLocaleString('en-IN')}</strong></div>
                    <div><span class="text-muted">Txns:</span> <strong>${txCount}</strong></div>
                </div>
                <div class="shop-actions">
                    <button type="button" class="btn btn-success" onclick="Transactions.openModal(${shop.id}, 'IN')"><i data-lucide="arrow-down-left" aria-hidden="true"></i> IN</button>
                    <button type="button" class="btn btn-danger" onclick="Transactions.openModal(${shop.id}, 'OUT')"><i data-lucide="arrow-up-right" aria-hidden="true"></i> OUT</button>
                    <button type="button" class="btn btn-outline" onclick="Transactions.openModal(${shop.id}, 'RETURN')"><i data-lucide="corner-up-left" aria-hidden="true"></i> Return</button>
                    <button type="button" class="btn btn-purple col-span-2" onclick="Transactions.openModal(${shop.id}, 'BUY')"><i data-lucide="shopping-cart" aria-hidden="true"></i> Buy Inventory</button>
                </div>
            </div>`;
        }
        
        domContainer.innerHTML = html;
        if (window.lucide) window.lucide.createIcons({ root: domContainer }); // Optimize icon creation scope
        updateShopSelects();
    };

    const updateShopSelects = () => {
        const shops = window.App.data.shops;
        let options = '';
        for (let i = 0; i < shops.length; i++) {
            options += `<option value="${shops[i].id}">${escapeHTML(shops[i].name)}</option>`;
        }
        
        if (domCalcSelect) domCalcSelect.innerHTML = options;
        if (domFilterShop) domFilterShop.innerHTML = `<option value="ALL">All Shops</option>` + options;
    };

    const addShop = () => {
        const name = prompt("Enter workspace/shop name:");
        if (!name || !name.trim()) return;
        
        const newId = window.App.data.shops.length ? Math.max(...window.App.data.shops.map(s => s.id)) + 1 : 1;
        window.App.data.shops.push({ id: newId, name: name.trim(), cash: 0, expenses: 0, income: 0, yesterdayClosing: 0 });
        
        Storage.save(window.App.data);
        window.App.refreshAll();
        UI.showToast("Workspace created");
    };

    const deleteShop = (id) => {
        if (!confirm("Are you sure? This deletes the shop and all its history.")) return;
        
        window.App.data.shops = window.App.data.shops.filter(s => s.id !== id);
        window.App.data.transactions = window.App.data.transactions.filter(t => t.shopId !== id);
        
        Storage.save(window.App.data);
        window.App.refreshAll();
        UI.showToast("Workspace deleted");
    };

    return { init, renderCards, addShop, deleteShop, updateShopSelects };
})();