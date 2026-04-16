document.addEventListener('DOMContentLoaded', async () => {
    initLayout('dashboard');

    try {
        const res = await apiFetch('/api/dashboard/summary');
        const data = await res.json();

        // 1. KPI Cards
        document.getElementById('kpiIncome').textContent = formatINR(data.kpis.totalIncome);
        document.getElementById('kpiExpenses').textContent = formatINR(data.kpis.totalExpenses);

        const profitEl = document.getElementById('kpiProfit');
        profitEl.textContent = formatINR(data.kpis.netProfit);
        if (data.kpis.netProfit >= 0) {
            profitEl.classList.add('text-green');
        } else {
            profitEl.classList.add('text-red');
        }

        document.getElementById('kpiSyncs').textContent = data.kpis.pendingTallySyncs;

        // 2. Chart
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                datasets: [
                    {
                        label: 'Income',
                        data: data.chart.income,
                        backgroundColor: '#00d4aa',
                        borderRadius: 2
                    },
                    {
                        label: 'Expenses',
                        data: data.chart.expenses,
                        backgroundColor: '#f5a623',
                        borderRadius: 2
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#2d3748' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: "'IBM Plex Mono', monospace" }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { family: "'IBM Plex Mono', monospace" } }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#e2e8f0', font: { family: "'DM Sans', sans-serif" } } }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });

        // 3. Transactions Table
        const tbody = document.getElementById('txTableBody');
        tbody.innerHTML = '';
        data.recentTransactions.forEach(tx => {
            const tr = document.createElement('tr');

            const badge = syncBadge(tx.tally_synced);
            // removed old ternary 

            const typeColor = tx.type === 'Income' ? 'text-teal' : 'text-amber';

            tr.innerHTML = `
                <td>${tx.date}</td>
                <td class="${typeColor}">${tx.type}</td>
                <td>${tx.description}</td>
                <td class="data-font">${formatINR(tx.amount)}</td>
                <td class="data-font">${formatINR(tx.gst)}</td>
                <td>${badge}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading dashboard', err);
    }
});