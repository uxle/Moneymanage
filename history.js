const History = (() => {
    let tbody, filterDate, filterShop, filterType, searchReason;
    let renderTimeout = null;

    const init = () => {
        tbody = document.getElementById('history-tbody');
        filterDate = document.getElementById('filter-date');
        filterShop = document.getElementById('filter-shop');
        filterType = document.getElementById('filter-type');
        searchReason = document.getElementById('search-reason');
    };

    const escapeHTML = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[c] || c));
    };

    const render = () => {
        if (!tbody) return;
        const data = window.App.data;
        const fDate = filterDate ? filterDate.value : '';
        const fShop = filterShop ? filterShop.value : 'ALL';
        const fType = filterType ? filterType.value : 'ALL';
        const search = searchReason ? searchReason.value.toLowerCase().trim() : '';

        // Single pass filtering map for max performance
        const filtered = [];
        for (let i = 0; i < data.transactions.length; i++) {
            const t = data.transactions[i];
            
            if (fDate && t.date !== fDate) continue;
            if (fShop !== 'ALL' && String(t.shopId) !== String(fShop)) continue;
            if (fType !== 'ALL' && t.type !== fType) continue;
            
            if (search) {
                const searchMatch = 
                    (t.reason && t.reason.toLowerCase().includes(search)) || 
                    (t.supplier && t.supplier.toLowerCase().includes(search)) ||
                    (t.category && t.category.toLowerCase().includes(search));
                
                if (!searchMatch) continue;
            }
            filtered.push(t);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No records found</td></tr>`;
            return;
        }

        // Cache shop mappings for O(1) lookup during mapping
        const shopMap = {};
        for (let i = 0; i < data.shops.length; i++) {
            shopMap[data.shops[i].id] = data.shops[i].name;
        }

        // Map to HTML
        let html = '';
        for (let i = 0; i < filtered.length; i++) {
            const t = filtered[i];
            const shopName = shopMap[t.shopId] || 'Unknown';
            const isIN = t.type === 'IN';
            const typeClass = isIN ? 'text-green' : 'text-red';
            
            const supBadge = t.supplier ? `<br><small class="text-muted">Vendor: ${escapeHTML(t.supplier)}</small>` : '';
            const isReturn = t.category && t.category.includes('Return');
            const catBadge = t.category ? `<br><span class="badge ${isReturn ? 'badge-blue' : 'badge-purple'}">${escapeHTML(t.category)}</span>` : '';

            html += `
            <tr>
                <td>${escapeHTML(t.date)}</td>
                <td><strong>${escapeHTML(shopName)}</strong></td>
                <td><span class="${typeClass} font-bold">${escapeHTML(t.type)}</span></td>
                <td class="${typeClass}">₹${t.amount.toLocaleString('en-IN')}</td>
                <td>${escapeHTML(t.reason)} ${supBadge} ${catBadge}</td>
                <td class="text-blue font-bold">₹${t.balanceAfter.toLocaleString('en-IN')}</td>
                <td>
                    <button type="button" class="btn-icon text-red" onclick="window.App.deleteTxn(${t.id})" title="Delete" aria-label="Delete Transaction">
                        <i data-lucide="trash-2" aria-hidden="true" style="width:16px;height:16px;"></i>
                    </button>
                </td>
            </tr>`;
        }
        
        tbody.innerHTML = html;
        if (window.lucide) window.lucide.createIcons({ root: tbody }); // Scoped icon creation
    };

    const deleteTxn = (id) => {
        if (!confirm("Are you sure? Shop balances will not automatically re-calculate if you delete history.")) return;
        
        window.App.data.transactions = window.App.data.transactions.filter(t => t.id !== id);
        Storage.save(window.App.data);
        
        render();
        Reports.renderOverall();
        UI.showToast("Record deleted");
    };

    const attachFilters = () => {
        if (filterDate) filterDate.addEventListener('input', render);
        if (filterShop) filterShop.addEventListener('input', render);
        if (filterType) filterType.addEventListener('input', render);
        
        // Debounce search input for performance on mobile
        if (searchReason) {
            searchReason.addEventListener('input', () => {
                clearTimeout(renderTimeout);
                renderTimeout = setTimeout(render, 200);
            });
        }
    };

    return { init, render, attachFilters, deleteTxn };
})();