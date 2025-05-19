document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }
    // Simulate fetch users.txt
    let exists = false;
    let users = [];
    try {
        const res = await fetch('../users.txt');
        const text = await res.text();
        users = text.split('\n').filter(Boolean);
        for (const line of users) {
            const [user] = line.split(':');
            if (user === username) {
                exists = true;
                break;
            }
        }
    } catch (err) {}
    if (exists) {
        alert('Username already exists.');
        return;
    }
    // Simulate writing to users.txt by storing in localStorage (for demo only)
    let localUsers = localStorage.getItem('hotelUsers') || '';
    localUsers += `\n${username}:${password}`;
    localStorage.setItem('hotelUsers', localUsers);
    
    // Set the current user in localStorage
    localStorage.setItem('hotelUser', username);
    
    alert('Sign up successful! Redirecting to rooms page...');
    window.location.href = 'rooms.html';
}); 