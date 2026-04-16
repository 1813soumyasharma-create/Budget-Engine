document.addEventListener('DOMContentLoaded', async () => {
    initLayout('tally');
    loadLogs();

    // Load current auto-sync state
    try {
        const res = await apiFetch('/api/settings');
        const data = await res.json();
        document.getElementById('autoSyncToggle').checked = data.tally_auto_sync === '1';
    } catch (e) { console.error(e); }
});

async function pushToTally() {
    const btn = document.getElementById('btnPush');
    const statusEl = document.getElementById('pushStatus');

    try {
        btn.disabled = true;
        btn.textContent = 'SYNCING...';
        statusEl.textContent = '';

        const res = await apiFetch('/api/tally/push', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            statusEl.innerHTML = \`<span class="text-teal">✓ Synced \${data.successCount} records</span><br><span class="text-red">✗ Failed \${data.failedCount} records</span>\`;
            loadLogs();
        } else {
            statusEl.innerHTML = \`<span class="text-red">Error: \${data.error || 'Unknown Error'}</span>\`;
        }
    } catch (e) {
        statusEl.innerHTML = \`<span class="text-red">Network Error - Tally might be unreachable</span>\`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'SYNC PENDING';
    }
}

async function pullFromTally() {
    const btn = document.getElementById('btnPull');
    const statusEl = document.getElementById('pullStatus');
    
    try {
        btn.disabled = true;
        btn.textContent = 'IMPORTING...';
        statusEl.textContent = '';
        
        const res = await apiFetch('/api/tally/pull', { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
            statusEl.innerHTML = \`<span class="text-teal">✓ Imported \${data.count} records from Tally</span>\`;
            loadLogs();
        } else {
            statusEl.innerHTML = \`<span class="text-red">Error: \${data.error || 'Unknown Error'}</span>\`;
        }
    } catch (e) {
        statusEl.innerHTML = \`<span class="text-red">Network Error - Tally might be unreachable</span>\`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'IMPORT DATA';
    }
}

async function loadLogs() {
    try {
        const res = await apiFetch('/api/tally/logs');
        const data = await res.json();
        
        const tbody = document.getElementById('logTableBody');
        tbody.innerHTML = '';
        
        data.forEach(log => {
            const tr = document.createElement('tr');
            const statusClass = log.status === 'success' ? 'text-teal' : (log.status === 'failed' ? 'text-red' : 'text-amber');
            
            tr.innerHTML = `
                <td>${new Date(log.synced_at).toLocaleString('en-IN')}</td>
                <td style="text-transform: uppercase;">${log.sync_type}</td>
                <td style="text-transform: capitalize;">${log.record_type}</td>
                <td>${log.record_id || '-'}</td>
                <td>${log.tally_voucher_no || '-'}</td>
                <td class="${statusClass}" style="text-transform: uppercase;">${log.status}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${log.message}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
    }
}
async function updateAutoSync(enabled) {
    try {
        await apiFetch('/api/settings', {
            method: 'PUT',
            body: JSON.stringify({ tally_auto_sync: enabled ? '1' : '0' })
        });
    } catch (e) {
        console.error('Failed to update auto-sync', e);
    }
}