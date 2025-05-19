document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    let valid = false;
    let isAdmin = false;

    // Check admin.txt for admin login
    try {
        const res = await fetch('../admin.txt');
        const text = await res.text();
        const lines = text.split('\n');
        for (const line of lines) {
            const [user, pass] = line.trim().split(':');
            if (user === username && pass === password) {
                valid = true;
                isAdmin = true;
                break;
            }
        }
    } catch (err) {}

    // If not admin, check users.txt
    if (!valid) {
        try {
            const res = await fetch('../users.txt');
            const text = await res.text();
            const lines = text.split('\n');
            for (const line of lines) {
                const [user, pass] = line.trim().split(':');
                if (user === username && pass === password) {
                    valid = true;
                    break;
                }
            }
        } catch (err) {}
    }

    // If not found, check localStorage
    if (!valid) {
        let localUsers = localStorage.getItem('hotelUsers') || '';
        const lines = localUsers.split('\n');
        for (const line of lines) {
            const [user, pass] = line.trim().split(':');
            if (user === username && pass === password) {
                valid = true;
                // Check if user is admin
                if (user === 'admin') {
                    isAdmin = true;
                }
                break;
            }
        }
    }

    if (valid) {
        localStorage.setItem('hotelUser', username);
        if (isAdmin || username === 'admin') {
            window.location.href = 'adminHome.html';
        } else {
            window.location.href = 'loggedHome.html';
        }
    } else {
        alert('Invalid username or password.');
    }
}); 