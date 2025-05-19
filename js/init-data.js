// Initialize sample data
async function initializeSampleData() {
    // Sample rooms data
    const roomsData = {
        rooms: [
            {
                id: 1,
                name: "Deluxe Room",
                floor: 1,
                capacity: 2,
                price: 150,
                maintenance: false
            },
            {
                id: 2,
                name: "Suite",
                floor: 2,
                capacity: 4,
                price: 250,
                maintenance: false
            },
            {
                id: 3,
                name: "Standard Room",
                floor: 1,
                capacity: 2,
                price: 100,
                maintenance: false
            },
            {
                id: 4,
                name: "Executive Suite",
                floor: 3,
                capacity: 2,
                price: 300,
                maintenance: false
            },
            {
                id: 5,
                name: "Family Room",
                floor: 2,
                capacity: 6,
                price: 200,
                maintenance: false
            }
        ]
    };

    // Sample users data
    const usersData = {
        users: {
            admin: {
                email: "admin@hotel.com",
                password: "admin123",
                role: "admin"
            },
            guest1: {
                email: "guest1@example.com",
                password: "guest123",
                role: "user"
            }
        },
        blockedUsers: []
    };

    // Sample bookings data
    const bookingsData = {
        bookings: [
            {
                id: 1,
                userId: "guest1",
                roomId: 1,
                roomName: "Deluxe Room",
                checkIn: "2024-03-01",
                checkOut: "2024-03-05",
                nights: 4,
                totalPrice: 600
            }
        ]
    };

    // Save sample data to files
    try {
        await saveData('rooms.json', roomsData);
        await saveData('users.json', usersData);
        await saveData('bookings.json', bookingsData);
        console.log('Sample data initialized successfully');
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Function to save data to files
async function saveData(filename, data) {
    try {
        const response = await fetch(`/data/${filename}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return true;
    } catch (error) {
        console.error(`Error saving ${filename}:`, error);
        return false;
    }
}

async function initializeUsers() {
    try {
        const response = await fetch('/data/users.json');
        if (response.ok) {
            console.log('Users file already exists');
            return;
        }

        // Create initial users data
        const usersData = {
            users: {
                admin: {
                    email: "admin@hotel.com",
                    password: "admin123",
                    role: "admin"
                }
            },
            blockedUsers: []
        };

        // Save the initial data
        const saveResponse = await fetch('/data/users.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usersData)
        });

        if (!saveResponse.ok) {
            throw new Error('Failed to save initial users data');
        }

        console.log('Users file initialized successfully');
    } catch (error) {
        console.error('Error initializing users:', error);
    }
}

// Initialize data when the script is loaded
initializeSampleData();
initializeUsers(); 