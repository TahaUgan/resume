// Simple file-based storage system
class DataStorage {
    constructor() {
        this.data = {
            users: {
                admin: {
                    email: "admin@hotel.com",
                    password: "admin123",
                    role: "admin"
                }
            },
            blockedUsers: [],
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
                }
            ],
            bookings: []
        };

        // Load data from localStorage if available
        this.loadFromStorage();
    }

    loadFromStorage() {
        const storedData = localStorage.getItem('hotelData');
        if (storedData) {
            this.data = JSON.parse(storedData);
        } else {
            this.saveToStorage();
        }
    }

    saveToStorage() {
        localStorage.setItem('hotelData', JSON.stringify(this.data));
    }

    // User management
    addUser(username, userData) {
        this.data.users[username] = userData;
        this.saveToStorage();
    }

    getUser(username) {
        return this.data.users[username];
    }

    getAllUsers() {
        return this.data.users;
    }

    blockUser(username) {
        if (!this.data.blockedUsers.includes(username)) {
            this.data.blockedUsers.push(username);
            this.saveToStorage();
        }
    }

    unblockUser(username) {
        const index = this.data.blockedUsers.indexOf(username);
        if (index !== -1) {
            this.data.blockedUsers.splice(index, 1);
            this.saveToStorage();
        }
    }

    // Room management
    getAllRooms() {
        return this.data.rooms;
    }

    updateRoom(roomId, updates) {
        const room = this.data.rooms.find(r => r.id === roomId);
        if (room) {
            Object.assign(room, updates);
            this.saveToStorage();
        }
    }

    // Booking management
    addBooking(booking) {
        this.data.bookings.push(booking);
        this.saveToStorage();
    }

    getAllBookings() {
        return this.data.bookings;
    }

    cancelBooking(bookingId) {
        const index = this.data.bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            this.data.bookings.splice(index, 1);
            this.saveToStorage();
        }
    }
}

// Create a global instance
window.hotelData = new DataStorage(); 