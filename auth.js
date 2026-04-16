document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect based on role
    const storedUser = JSON.parse(localStorage.getItem('be_user') || '{}');
    if (localStorage.getItem('be_token')) {
        if (storedUser.role === 'vendor') {
            window.location.href = '/vendors.html';
        } else {
            window.location.href = '/dashboard.html';
        }
    }

    const form = document.getElementById('loginForm');
    const card = document.getElementById('loginCard');
    const errorMsg = document.getElementById('errorMsg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('be_token', data.token);
                localStorage.setItem('be_user', JSON.stringify(data.user));
                
                // Role-based redirection
                if (data.user.role === 'vendor') {
                    window.location.href = '/vendors.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            } else {
                showError(data.error || 'Login failed');
            }
        } catch (err) {
            showError('Network error. Is the server running?');
        }
    });

    function showError(msg) {
        errorMsg.textContent = `> ERR: ${msg}`;
        errorMsg.style.display = 'block';
        card.classList.remove('shake');
        void card.offsetWidth; // trigger reflow
        card.classList.add('shake');
    }
});