async function loadUsers() {
    try {
        const response = await fetch('/data/users.json');
        if (!response.ok) {
            // If file doesn't exist, return default structure
            if (response.status === 404) {
                return {
                    users: {
                        admin: {
                            email: "admin@hotel.com",
                            password: "admin123",
                            role: "admin"
                        }
                    },
                    blockedUsers: []
                };
            }
            throw new Error('Failed to load users');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading users:', error);
        return null;
    }
}

async function saveUsers(usersData) {
    try {
        console.log('Saving users data:', usersData);
        const response = await fetch('/data/users.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(usersData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save users');
        }
        
        const result = await response.json();
        console.log('Save response:', result);
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate input
    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Load existing users
    const usersData = await loadUsers();
    if (!usersData) {
        alert('Error loading user data. Please try again.');
        return;
    }
    
    // Check if username already exists
    if (usersData.users[username]) {
        alert('Username already exists');
        return;
    }
    
    // Add new user
    usersData.users[username] = {
        email: email,
        password: password,
        role: 'user'
    };
    
    console.log('Attempting to save user:', username);
    
    // Save updated users data
    const saved = await saveUsers(usersData);
    if (saved) {
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    } else {
        alert('Error saving user data. Please try again.');
    }
}

// Add event listener when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    } else {
        console.error('Signup form not found');
    }
});

document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        // Load existing users
        const response = await fetch('/data/users.json');
        if (!response.ok) throw new Error('Failed to load users');
        const data = await response.json();
        
        // Check if username already exists
        if (data.users[username]) {
            alert('Username already exists');
            return;
        }
        
        // Add new user
        data.users[username] = {
            password: password,
            role: 'user'
        };
        
        // Save updated users
        const saveResponse = await fetch('/data/users.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!saveResponse.ok) throw new Error('Failed to save user data');
        
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    }
}); 