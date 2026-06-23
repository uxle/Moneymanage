const Reports = (() => {
    let dom = {};

    const init = () => {
        dom.cash = document.getElementById('overall-cash');
        dom.expenses = document.getElementById('overall-expenses');
        dom.profit = document.getElementById('overall-profit');
        dom.stats = document.getElementById('overall-stats');
    };

    const renderOverall = () => {
        const data = window.App.data;
        if (!data) return;

        // O(n) Single pass reduction for performance
        let totalCash = 0, totalExpenses = 0, totalIncome = 0;
        
        for (let i = 0; i < data.shops.length; i++) {
            totalCash += data.shops[i].cash || 0;
            totalExpenses += data.shops[i].expenses || 0;
            totalIncome += data.shops[i].income || 0;
        }
        
        const totalProfit = totalIncome - totalExpenses;

        if (dom.cash) dom.cash.textContent = `₹${totalCash.toLocaleString('en-IN')}`;
        if (dom.expenses) dom.expenses.textContent = `₹${totalExpenses.toLocaleString('en-IN')}`;
        if (dom.profit) dom.profit.textContent = `₹${totalProfit.toLocaleString('en-IN')}`;
        if (dom.stats) dom.stats.textContent = `${data.shops.length} / ${data.transactions.length}`;
    };

    const exportMarkdown = () => {
        const data = window.App.data;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        
        let md = `# ShopFlow Monthly Report\n`;
        md += `*Generated on: ${new Date().toLocaleDateString()}*\n`;
        md += `*Covering 30 Days (From ${thirtyDaysAgo})*\n\n---\n\n`;
        
        data.shops.forEach(shop => {
            md += `## 🏬 Workspace: ${shop.name}\n\n`;
            
            const txns = data.transactions.filter(t => t.shopId === shop.id && t.date >= thirtyDaysAgo);
            let income = 0, expenses = 0;
            const catMap = {};

            for (let i = 0; i < txns.length; i++) {
                const t = txns[i];
                if (t.type === 'IN') income += t.amount;
                else if (t.type === 'OUT') {
                    expenses += t.amount;
                    if (t.category) {
                        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
                    }
                }
            }
            
            md += `### Summary\n`;
            md += `- **Gross Income:** ₹${income.toLocaleString('en-IN')}\n`;
            md += `- **Total Expenses:** ₹${expenses.toLocaleString('en-IN')}\n`;
            md += `- **Net (Profit/Loss):** ₹${(income - expenses).toLocaleString('en-IN')}\n\n`;
            
            if (Object.keys(catMap).length > 0) {
                md += `### 💸 Expenses by Field\n`;
                Object.entries(catMap)
                    .sort((a,b) => b[1] - a[1]) // Sort descending
                    .forEach(([cat, amt]) => {
                        md += `- **${cat}**: ₹${amt.toLocaleString('en-IN')}\n`;
                    });
            }
            md += `\n---\n\n`;
        });
        
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const dl = document.createElement('a');
        dl.href = url;
        dl.download = `ShopFlow_Report_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(dl);
        dl.click();
        
        // Clean up memory
        setTimeout(() => {
            document.body.removeChild(dl);
            URL.revokeObjectURL(url);
        }, 100);
        
        UI.showToast("Markdown Report Exported!");
    };

    const exportJSON = () => {
        const dataStr = JSON.stringify(window.App.data);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const dl = document.createElement('a');
        
        dl.href = url;
        dl.download = `shopflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(dl);
        dl.click();

        setTimeout(() => {
            document.body.removeChild(dl);
            URL.revokeObjectURL(url);
        }, 100);

        UI.showToast("Backup Saved!");
    };

    const importJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported && imported.shops && imported.transactions) {
                    window.App.data = imported;
                    Storage.save(window.App.data);
                    window.App.refreshAll();
                    UI.showToast("Data Restored Successfully!");
                } else {
                    UI.showToast("Invalid JSON format", "error");
                }
            } catch (err) {
                UI.showToast("Failed to parse JSON", "error");
            }
        };
        reader.readAsText(file);
        
        // Reset input so the same file can be selected again if needed
        event.target.value = '';
    };

    return { init, renderOverall, exportMarkdown, exportJSON, importJSON };
})();
