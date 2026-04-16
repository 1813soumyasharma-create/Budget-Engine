// ============================================================
// BE — Stock Management Logic
// File: /be-app/public/js/stock-management.js
// ============================================================

initLayout('stock');

async function loadStocks() {
    try {
        const res = await apiFetch('/api/stock/admin');
        const stocks = await res.json();
        const tbody = document.getElementById('stockTableBody');
        
        tbody.innerHTML = stocks.map(item => `
            <tr>
                <td style="font-weight: 500;">${item.name}</td>
                <td><span class="badge" style="background: var(--bg-hover);">${item.category}</span></td>
                <td class="data-font">₹${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>${item.unit}</td>
                <td>
                    <span class="badge ${item.status === 'active' ? 'badge-synced' : 'badge-pending'}">
                        ${item.status.toUpperCase().replace('_', ' ')}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="editStock(${item.id})">EDIT</button>
                        <button class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; color: #ef4444; border-color: rgba(239,68,68,0.2);" onclick="deleteStock(${item.id})">DEL</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

function openModal(item = null) {
    const modal = document.getElementById('stockModal');
    const form = document.getElementById('stockForm');
    const title = document.getElementById('modalTitle');
    
    if (item) {
        title.innerText = 'Edit Stock Item';
        document.getElementById('stockId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemUnit').value = item.unit;
        document.getElementById('itemDesc').value = item.description || '';
        document.getElementById('itemStatus').value = item.status;
    } else {
        title.innerText = 'Add New Stock';
        form.reset();
        document.getElementById('stockId').value = '';
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('stockModal').style.display = 'none';
}

async function editStock(id) {
    try {
        const res = await apiFetch('/api/stock/admin'); // In a real app, fetch single item
        const stocks = await res.json();
        const item = stocks.find(s => s.id === id);
        if (item) openModal(item);
    } catch (err) {
        console.error(err);
    }
}

async function deleteStock(id) {
    if (!confirm('Are you sure you want to delete this stock item?')) return;
    try {
        const res = await apiFetch(`/api/stock/${id}`, { method: 'DELETE' });
        if (res.ok) loadStocks();
    } catch (err) {
        alert('Failed to delete item');
    }
}

document.getElementById('stockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('stockId').value;
    const body = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: document.getElementById('itemPrice').value,
        unit: document.getElementById('itemUnit').value,
        description: document.getElementById('itemDesc').value,
        status: document.getElementById('itemStatus').value
    };

    try {
        const url = id ? `/api/stock/${id}` : '/api/stock';
        const method = id ? 'PUT' : 'POST';
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            closeModal();
            loadStocks();
        } else {
            const data = await res.json();
            alert(data.error || 'Operation failed');
        }
    } catch (err) {
        console.error(err);
    }
});

loadStocks();
