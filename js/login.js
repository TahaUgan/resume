async function loadUsers() {
    try {
        const response = await fetch('/data/users.json');
        if (!response.ok) throw new Error('Failed to load users');
        return await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
        return null;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const usersData = await loadUsers();
    if (!usersData) {
        alert('Error loading user data. Please try again.');
        return;
    }
    
    // Check if user exists and password matches
    const user = usersData.users[username];
    if (user && user.password === password) {
        // Check if user is blocked
        if (usersData.blockedUsers.includes(username)) {
            alert('This account has been blocked. Please contact support.');
            return;
        }
        
        // Store current user in session
        sessionStorage.setItem('currentUser', JSON.stringify({
            username: username,
            role: user.role
        }));
        
        // Redirect based on role
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'home.html';
        }
    } else {
        alert('Invalid username or password');
    }
}

document.getElementById('login-form').addEventListener('submit', handleLogin); 