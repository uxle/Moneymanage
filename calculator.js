const Calculator = (() => {
    const denoms = [500, 200, 100, 50, 20, 10, 'Coins', 'Online', 'Card'];
    const domCache = {};

    const init = () => {
        const container = document.getElementById('denom-inputs');
        if (!container) return;

        // Generate input HTML sequentially via fragment for fast paint
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < denoms.length; i++) {
            const d = denoms[i];
            const isAmount = ['Coins', 'Online', 'Card'].includes(d);
            const step = isAmount ? '0.01' : '1';
            const label = typeof d === 'number' ? `₹${d}` : d === 'Coins' ? '🪙 Coins' : d === 'Online' ? '📱 Online' : '💳 Card';
            
            const div = document.createElement('div');
            div.className = 'denom-row';
            div.innerHTML = `
                <span class="denom-label">${label}</span>
                <input type="number" id="calc-${d}" class="form-input denom-calc" placeholder="0" min="0" step="${step}" inputmode="${isAmount ? 'decimal' : 'numeric'}" autocomplete="off">
                <span class="denom-total" id="total-${d}">₹0</span>
            `;
            fragment.appendChild(div);
        }
        container.appendChild(fragment);

        // Cache elements tightly to avoid layout thrashing during input
        for (let i = 0; i < denoms.length; i++) {
            const d = denoms[i];
            domCache[`calc-${d}`] = document.getElementById(`calc-${d}`);
            domCache[`total-${d}`] = document.getElementById(`total-${d}`);
            
            if (domCache[`calc-${d}`]) {
                domCache[`calc-${d}`].addEventListener('input', calculate);
            }
        }

        domCache.shopSelect = document.getElementById('calc-shop-select');
        domCache.yesterday = document.getElementById('calc-yesterday');
        domCache.total = document.getElementById('calc-total');
        domCache.plBox = document.getElementById('calc-pl-box');
        domCache.plLabel = document.getElementById('calc-pl-label');
        domCache.plAmount = document.getElementById('calc-pl-amount');

        if (domCache.shopSelect) domCache.shopSelect.addEventListener('change', loadShopData);
        if (domCache.yesterday) domCache.yesterday.addEventListener('input', calculate);
    };

    const loadShopData = () => {
        if (!domCache.shopSelect) return;
        const shopId = parseInt(domCache.shopSelect.value, 10);
        const shop = window.App.data.shops.find(s => s.id === shopId);
        if (shop && domCache.yesterday) {
            domCache.yesterday.value = shop.yesterdayClosing || 0;
            calculate();
        }
    };

    const calculate = () => {
        let total = 0;
        
        // Batch read/calculate
        for (let i = 0; i < denoms.length; i++) {
            const d = denoms[i];
            const input = domCache[`calc-${d}`];
            const count = parseFloat(input.value) || 0;
            const isAmount = ['Coins', 'Online', 'Card'].includes(d);
            const rowTotal = isAmount ? count : count * d;
            
            total += rowTotal;
            const totalEl = domCache[`total-${d}`];
            if (totalEl) totalEl.textContent = `₹${rowTotal.toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
        }

        // Batch write DOM to prevent reflows
        if (domCache.total) domCache.total.textContent = `₹${total.toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
        
        const yesterday = parseFloat(domCache.yesterday?.value) || 0;
        const pl = total - yesterday;
        
        if (!domCache.plBox) return;

        if (pl > 0) {
            domCache.plBox.className = 'pl-box glass mt-4 stat-box green';
            domCache.plLabel.textContent = 'Day Profit';
            domCache.plAmount.textContent = `+₹${pl.toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
        } else if (pl < 0) {
            domCache.plBox.className = 'pl-box glass mt-4 stat-box red';
            domCache.plLabel.textContent = 'Day Loss';
            domCache.plAmount.textContent = `-₹${Math.abs(pl).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
        } else {
            domCache.plBox.className = 'pl-box glass mt-4 text-center';
            domCache.plLabel.textContent = 'Break Even';
            domCache.plAmount.textContent = '₹0';
        }
    };

    const saveReport = () => {
        if (!domCache.shopSelect) return;
        const shopId = parseInt(domCache.shopSelect.value, 10);
        if (!shopId) return UI.showToast("Select a shop first", "error");

        const shop = window.App.data.shops.find(s => s.id === shopId);
        if (!shop) return;

        const yesterday = parseFloat(domCache.yesterday?.value) || 0;
        const totalRaw = domCache.total.textContent.replace(/[^0-9.-]+/g, "");
        const total = parseFloat(totalRaw) || 0;

        shop.yesterdayClosing = total;
        
        const denomData = {};
        for (let i = 0; i < denoms.length; i++) {
            const d = denoms[i];
            denomData[d] = domCache[`calc-${d}`].value || 0;
        }

        const report = {
            id: Date.now(),
            shopId,
            date: new Date().toISOString(),
            total,
            yesterday,
            profit: total - yesterday,
            denoms: denomData
        };

        window.App.data.reports.push(report);
        Storage.save(window.App.data);
        UI.showToast(`Report saved for ${shop.name}`);
        
        // Reset fields fast
        for (let i = 0; i < denoms.length; i++) {
            domCache[`calc-${denoms[i]}`].value = '';
        }
        calculate();
    };

    const printDailyReport = () => {
        if (!domCache.shopSelect) return;
        const shopId = parseInt(domCache.shopSelect.value, 10);
        if (!shopId) return UI.showToast("Select a shop to print", "error");
        
        const shop = window.App.data.shops.find(s => s.id === shopId);
        const yesterday = domCache.yesterday?.value || 0;
        const total = domCache.total?.textContent || "₹0";
        const plLabel = domCache.plLabel?.textContent || "";
        const plAmount = domCache.plAmount?.textContent || "₹0";
        
        let denomRows = '';
        for (let i = 0; i < denoms.length; i++) {
            const d = denoms[i];
            const count = domCache[`calc-${d}`].value || 0;
            const amt = domCache[`total-${d}`].textContent || "₹0";
            const label = typeof d === 'number' ? `₹${d} Note` : d;
            const countStr = ['Coins', 'Online', 'Card'].includes(d) ? '-' : `${count} pcs`;
            denomRows += `<tr><td style="padding:8px; border-bottom:1px solid #ddd;">${label}</td><td style="padding:8px; border-bottom:1px solid #ddd;">${countStr}</td><td style="padding:8px; text-align:right; border-bottom:1px solid #ddd;">${amt}</td></tr>`;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return UI.showToast("Pop-up blocked. Allow pop-ups to print.", "error");

        printWindow.document.write(`
            <html>
            <head>
                <title>Daily Report - ${shop.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; color: #111; max-width: 400px; margin: 0 auto; }
                    h2 { text-align: center; margin-bottom: 5px; }
                    .date { text-align: center; color: #666; font-size: 0.9em; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .summary { background: #f9f9f9; padding: 15px; border-radius: 8px; }
                    .summary div { display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold; }
                    .summary .total { font-size: 1.2em; border-top: 2px solid #ccc; padding-top: 8px; margin-top: 8px; }
                </style>
            </head>
            <body>
                <h2>${shop.name}</h2>
                <div class="date">Report Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                <table>
                    <thead>
                        <tr><th style="text-align:left; padding:8px;">Item</th><th style="text-align:left; padding:8px;">Count</th><th style="text-align:right; padding:8px;">Amount</th></tr>
                    </thead>
                    <tbody>${denomRows}</tbody>
                </table>
                <div class="summary">
                    <div><span>Yesterday Closing:</span> <span>₹${yesterday}</span></div>
                    <div><span>${plLabel}:</span> <span>${plAmount}</span></div>
                    <div class="total"><span>Current Drawer:</span> <span>${total}</span></div>
                </div>
                <script>
                    window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return { init, calculate, saveReport, loadShopData, printDailyReport };
})();