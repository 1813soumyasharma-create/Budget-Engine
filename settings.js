document.addEventListener('DOMContentLoaded', () => {
    initLayout('settings');
    loadSettings();

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            firm_name: document.getElementById('setFirmName').value,
            gst_number: document.getElementById('setGstNumber').value,
            financial_year_start: document.getElementById('setFyStart').value,
            currency: document.getElementById('setCurrency').value,
            tally_host: document.getElementById('setTallyHost').value,
            tally_port: document.getElementById('setTallyPort').value
        };

        try {
            const res = await apiFetch('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const saveStatus = document.getElementById('saveStatus');
                saveStatus.style.display = 'inline-block';

                // Update local user if firm name changed
                const usr = JSON.parse(localStorage.getItem('be_user'));
                usr.firm_name = payload.firm_name;
                localStorage.setItem('be_user', JSON.stringify(usr));
                document.querySelector('.header-brand').textContent = payload.firm_name;

                setTimeout(() => saveStatus.style.display = 'none', 3000);
            }
        } catch (e) {
            console.error(e);
        }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const status = document.getElementById('passwordStatus');

        if (pwd !== confirm) {
            status.style.color = 'var(--accent-red)';
            status.textContent = 'Passwords do not match';
            return;
        }

        try {
            const res = await apiFetch('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ newPassword: pwd })
            });
            const data = await res.json();
            if (res.ok) {
                status.style.color = 'var(--accent-teal)';
                status.textContent = 'Password updated successfully';
                e.target.reset();
            } else {
                status.style.color = 'var(--accent-red)';
                status.textContent = data.error || 'Update failed';
            }
        } catch (err) {
            status.style.color = 'var(--accent-red)';
            status.textContent = 'Network error';
        }
    });
});

async function loadSettings() {
    try {
        const res = await apiFetch('/api/settings');
        const data = await res.json();

        document.getElementById('setFirmName').value = data.firm_name || '';
        document.getElementById('setGstNumber').value = data.gst_number || '';
        document.getElementById('setFyStart').value = data.financial_year_start || '';
        document.getElementById('setCurrency').value = data.currency || '';
        document.getElementById('setTallyHost').value = data.tally_host || '';
        document.getElementById('setTallyPort').value = data.tally_port || '';
    } catch (e) {
        console.error(e);
    }
}

async function testTallyConnection() {
    const statusEl = document.getElementById('tallyPingStatus');
    statusEl.style.color = 'var(--text-muted)';
    statusEl.textContent = 'Pinging...';

    try {
        const res = await apiFetch('/api/tally/ping');
        const data = await res.json();

        if (data.status === 'success') {
            statusEl.style.color = 'var(--accent-teal)';
            statusEl.textContent = '✓ CONNECTED';
        } else {
            statusEl.style.color = 'var(--accent-red)';
            statusEl.textContent = '✗ FAILED';
        }
    } catch (e) {
        statusEl.style.color = 'var(--accent-red)';
        statusEl.textContent = '✗ FAILED';
    }
}