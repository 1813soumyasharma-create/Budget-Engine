let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initLayout('expenses');
    loadExpenses();

    const amtInput = document.getElementById('expAmt');
    const gstInput = document.getElementById('expGstRate');

    const updateCalculations = () => {
        const amt = parseFloat(amtInput.value) || 0;
        const rate = parseFloat(gstInput.value) || 0;
        const gstAmt = amt * (rate / 100);
        const total = amt + gstAmt;

        const preview = document.getElementById('calcPreview');
        if (preview) {
            preview.innerHTML = `GST: ${formatINR(gstAmt)} | Total: ${formatINR(total)}`;
        }
    };

    amtInput.addEventListener('input', updateCalculations);
    gstInput.addEventListener('change', updateCalculations);

    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            date: document.getElementById('expDate').value,
            description: document.getElementById('expDesc').value,
            category: document.getElementById('expCat').value,
            amount: parseFloat(document.getElementById('expAmt').value),
            gst_rate: parseFloat(document.getElementById('expGstRate').value),
            vendor: document.getElementById('expVendor').value,
            voucher_no: document.getElementById('expVoucher').value
        };

        const editId = document.getElementById('editId').value;
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `/api/expenses/${editId}` : '/api/expenses';

        try {
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                resetForm();
                loadExpenses();
                if (document.getElementById('calcPreview')) document.getElementById('calcPreview').innerHTML = '';
            } else {
                alert('Failed to save expense');
            }
        } catch (e) {
            console.error(e);
        }
    });
});

async function loadExpenses() {
    try {
        const res = await apiFetch('/api/expenses?limit=50');
        const { data } = await res.json();

        const tbody = document.getElementById('expenseTableBody');
        tbody.innerHTML = '';

        const categoryTotals = {};
        const currentMonth = new Date().getMonth();

        data.forEach(exp => {
            const tr = document.createElement('tr');

            const badge = syncBadge(exp.tally_synced);

            tr.innerHTML = \`
                <td>\${exp.id}</td>
                <td>\${exp.date}</td>
                <td>\${exp.description}</td>
                <td>\${exp.vendor || '-'}</td>
                <td>\${exp.category}</td>
                <td class="data-font">\${formatINR(exp.amount)}</td>
                <td>\${exp.gst_rate}%</td>
                <td class="data-font">\${formatINR(exp.gst_amount)}</td>
                <td class="data-font text-amber">\${formatINR(exp.total_amount)}</td>
                <td>\${exp.voucher_no || '-'}</td>
                <td>\${badge}</td>
                <td class="action-btns">
                    <button class="btn-outline" onclick='editExpense(\${JSON.stringify(exp).replace(/'/g, "&#39;")})'>EDIT</button>
                    <button class="btn-red" onclick='deleteExpense(\${exp.id})'>DEL</button>
                </td>
            \`;
            tbody.appendChild(tr);

            // Tally for chart (only current month approx)
            if (new Date(exp.date).getMonth() === currentMonth) {
                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.total_amount;
            }
        });

        updateChart(categoryTotals);
    } catch (e) {
        console.error(e);
    }
}

function updateChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ['#f5a623', '#00d4aa', '#ff4d4d', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { family: "'DM Sans', sans-serif", size: 10 } } }
            }
        }
    });
}

function editExpense(exp) {
    document.getElementById('editId').value = exp.id;
    document.getElementById('expDate').value = exp.date;
    document.getElementById('expDesc').value = exp.description;
    document.getElementById('expCat').value = exp.category;
    document.getElementById('expAmt').value = exp.amount;
    document.getElementById('expGstRate').value = exp.gst_rate;
    document.getElementById('expVendor').value = exp.vendor || '';
    document.getElementById('expVoucher').value = exp.voucher_no || '';
    
    document.getElementById('expSubmitBtn').textContent = 'UPDATE EXPENSE';
    document.getElementById('expCancelBtn').style.display = 'block';
}

function resetForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('expSubmitBtn').textContent = 'ADD EXPENSE';
    document.getElementById('expCancelBtn').style.display = 'none';
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
        const res = await apiFetch(\`/api/expenses/\${id}\`, { method: 'DELETE' });
        if (res.ok) loadExpenses();
    } catch (e) {
        console.error(e);
    }
}