document.addEventListener('DOMContentLoaded', () => {
    initLayout('income');
    loadIncome();

    const amtInput = document.getElementById('incAmt');
    const gstInput = document.getElementById('incGstRate');

    const updateCalculations = () => {
        const amt = parseFloat(amtInput.value) || 0;
        const rate = parseFloat(gstInput.value) || 0;
        const gstAmt = amt * (rate / 100);
        const total = amt + gstAmt;

        // Show in a small info text if we had one, but let's just make sure the submission handles it.
        // The prompt says "Auto-calculate GST Amount and Total on input".
        // I'll add a preview div in the HTML shortly.
        const preview = document.getElementById('calcPreview');
        if (preview) {
            preview.innerHTML = `GST: ${formatINR(gstAmt)} | Total: ${formatINR(total)}`;
        }
    };

    amtInput.addEventListener('input', updateCalculations);
    gstInput.addEventListener('change', updateCalculations);

    document.getElementById('incomeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            date: document.getElementById('incDate').value,
            description: document.getElementById('incDesc').value,
            category: document.getElementById('incCat').value,
            amount: parseFloat(document.getElementById('incAmt').value),
            gst_rate: parseFloat(document.getElementById('incGstRate').value),
            invoice_no: document.getElementById('incInv').value
        };

        const editId = document.getElementById('editId').value;
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `/api/income/${editId}` : '/api/income';

        try {
            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                resetForm();
                loadIncome();
                if (document.getElementById('calcPreview')) document.getElementById('calcPreview').innerHTML = '';
            } else {
                alert('Failed to save income');
            }
        } catch (e) {
            console.error(e);
        }
    });
});

async function loadIncome() {
    try {
        const res = await apiFetch('/api/income?limit=50');
        const { data } = await res.json();

        const tbody = document.getElementById('incomeTableBody');
        tbody.innerHTML = '';

        data.forEach(inc => {
            const tr = document.createElement('tr');

            const badge = syncBadge(inc.tally_synced);

            tr.innerHTML = `
                <td>${inc.id}</td>
                <td>${inc.date}</td>
                <td>${inc.description}</td>
                <td>${inc.category}</td>
                <td class="data-font">${formatINR(inc.amount)}</td>
                <td>${inc.gst_rate}%</td>
                <td class="data-font">${formatINR(inc.gst_amount)}</td>
                <td class="data-font text-teal">${formatINR(inc.total_amount)}</td>
                <td>${inc.invoice_no}</td>
                <td>${badge}</td>
                <td class="action-btns">
                    <button class="btn-outline" onclick='editIncome(${JSON.stringify(inc).replace(/'/g, "&#39;")})'>EDIT</button>
                    <button class="btn-red" onclick='deleteIncome(${inc.id})'>DEL</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}

function editIncome(inc) {
    document.getElementById('editId').value = inc.id;
    document.getElementById('incDate').value = inc.date;
    document.getElementById('incDesc').value = inc.description;
    document.getElementById('incCat').value = inc.category;
    document.getElementById('incAmt').value = inc.amount;
    document.getElementById('incGstRate').value = inc.gst_rate;
    document.getElementById('incInv').value = inc.invoice_no;

    document.getElementById('incSubmitBtn').textContent = 'UPDATE INCOME';
    document.getElementById('incCancelBtn').style.display = 'block';
}

function resetForm() {
    document.getElementById('incomeForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('incSubmitBtn').textContent = 'ADD INCOME';
    document.getElementById('incCancelBtn').style.display = 'none';
}

async function deleteIncome(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
        const res = await apiFetch(`/api/income/${id}`, { method: 'DELETE' });
        if (res.ok) loadIncome();
    } catch (e) {
        console.error(e);
    }
}