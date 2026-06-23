const Transactions = (() => {
    const els = {};

    const init = () => {
        els.shopId = document.getElementById('tx-shop-id');
        els.type = document.getElementById('tx-type');
        els.amount = document.getElementById('tx-amount');
        els.reason = document.getElementById('tx-reason');
        els.date = document.getElementById('tx-date');
        
        els.categoryGroup = document.getElementById('tx-category-group');
        els.category = document.getElementById('tx-category');
        
        els.returnGroup = document.getElementById('tx-return-group');
        els.returnType = document.getElementById('tx-return-type');
        
        els.supplierGroup = document.getElementById('tx-supplier-group');
        els.supplier = document.getElementById('tx-supplier');
        
        els.modalTitle = document.getElementById('tx-modal-title');
    };

    const openModal = (shopId, type) => {
        if (!els.shopId) init(); // Safe fallback
        
        els.shopId.value = shopId;
        els.type.value = type;
        els.amount.value = '';
        els.reason.value = '';
        
        // Auto-fill local date correctly based on timezone
        const now = new Date();
        const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        els.date.value = localDate;
        
        const isBuy = type === 'BUY';
        const isOut = type === 'OUT';
        const isReturn = type === 'RETURN';
        
        els.supplierGroup.style.display = isBuy ? 'block' : 'none';
        els.supplier.required = isBuy;
        
        els.categoryGroup.style.display = isOut ? 'block' : 'none';
        els.returnGroup.style.display = isReturn ? 'block' : 'none';
        
        const titles = { 'IN': 'Cash IN', 'OUT': 'Cash Expense', 'BUY': 'Buy Inventory', 'RETURN': 'Process Return' };
        els.modalTitle.textContent = titles[type] || 'Transaction';
        
        UI.openModal('tx-modal');
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const shopId = parseInt(els.shopId.value, 10);
        const type = els.type.value;
        const amount = parseFloat(els.amount.value);
        const reason = els.reason.value.trim();
        const date = els.date.value;
        
        if (isNaN(amount) || amount <= 0) return UI.showToast("Please enter a valid amount", "error");

        const data = window.App.data;
        const shop = data.shops.find(s => s.id === shopId);
        if (!shop) return UI.showToast("Shop not found", "error");

        let finalType = type;
        let category = null;
        let supplier = null;

        if (type === 'BUY') {
            finalType = 'OUT';
            category = 'Inventory';
            supplier = els.supplier.value.trim();
        } else if (type === 'OUT') {
            category = els.category.value;
        }

        // Logic routing based on evaluated type
        if (type === 'RETURN') {
            const retType = els.returnType.value;
            if (retType === 'CUST') {
                if (shop.cash < amount) {
                    if (!confirm(`Warning: Not enough cash (₹${shop.cash}). Proceed?`)) return;
                }
                shop.cash -= amount;
                shop.income -= amount; // Revert income
                finalType = 'OUT';
                category = 'Customer Return';
            } else {
                shop.cash += amount;
                shop.expenses -= amount; // Revert expense
                finalType = 'IN';
                category = 'Supplier Return';
            }
        } else if (finalType === 'IN') {
            shop.cash += amount;
            shop.income += amount;
        } else if (finalType === 'OUT') {
            if (shop.cash < amount) {
                if (!confirm(`Warning: Drawer cash (₹${shop.cash}) is lower than transaction amount. Proceed?`)) return;
            }
            shop.cash -= amount;
            shop.expenses += amount;
        }

        const txn = {
            id: Date.now(),
            shopId,
            type: finalType,
            amount,
            category,
            reason: type === 'BUY' ? `Stock: ${reason}` : type === 'RETURN' ? `Refund: ${reason}` : reason,
            supplier,
            date,
            balanceAfter: shop.cash
        };

        data.transactions.unshift(txn);
        Storage.save(data);
        
        UI.closeModal('tx-modal');
        UI.showToast(`Saved successfully`);
        
        // Reset form to prevent ghost inputs on reopen
        els.amount.value = '';
        els.reason.value = '';
        els.supplier.value = '';
        
        window.App.refreshAll();
    };

    return { init, openModal, handleFormSubmit };
})();