// Data storage (simulating a database)
let rooms = [
    {
        id: 1,
        name: "Deluxe Room",
        price: 150,
        capacity: 2,
        description: "Spacious room with city view",
        image: "images/room1.jpg",
        available: true
    },
    {
        id: 2,
        name: "Suite",
        price: 250,
        capacity: 4,
        description: "Luxury suite with separate living area",
        image: "images/room2.jpg",
        available: true
    },
    {
        id: 3,
        name: "Standard Room",
        price: 100,
        capacity: 2,
        description: "Comfortable room for two",
        image: "images/room3.jpg",
        available: true
    }
];

let bookings = [];
let currentUser = null;

// Navigation
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(page).classList.add('active');
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// Initialize the application
function init() {
    // Set up navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Set up login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Load rooms
    displayRooms();
}

// Display rooms
function displayRooms() {
    const roomList = document.getElementById('room-list');
    roomList.innerHTML = '';

    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
            <img src="${room.image}" alt="${room.name}">
            <div class="room-card-content">
                <h3>${room.name}</h3>
                <p>${room.description}</p>
                <p>Capacity: ${room.capacity} persons</p>
                <p>Price: $${room.price} per night</p>
                <button onclick="bookRoom(${room.id})" ${!room.available ? 'disabled' : ''}>
                    ${room.available ? 'Book Now' : 'Not Available'}
                </button>
            </div>
        `;
        roomList.appendChild(roomCard);
    });
}

// Handle room booking
function bookRoom(roomId) {
    if (!currentUser) {
        alert('Please login to book a room');
        navigateTo('login');
        return;
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.available) {
        alert('Room is not available');
        return;
    }

    const checkIn = prompt('Enter check-in date (YYYY-MM-DD):');
    const checkOut = prompt('Enter check-out date (YYYY-MM-DD):');

    if (!checkIn || !checkOut) {
        alert('Please provide both check-in and check-out dates');
        return;
    }

    const booking = {
        id: bookings.length + 1,
        roomId,
        userId: currentUser.id,
        checkIn,
        checkOut,
        totalPrice: calculateTotalPrice(room.price, checkIn, checkOut)
    };

    bookings.push(booking);
    room.available = false;
    
    alert('Booking successful!');
    displayBookings();
    displayRooms();
}

// Calculate total price
function calculateTotalPrice(pricePerNight, checkIn, checkOut) {
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    return pricePerNight * nights;
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple authentication (in a real app, this would be more secure)
    if (username && password) {
        currentUser = {
            id: 1,
            username: username
        };
        alert('Login successful!');
        navigateTo('home');
    } else {
        alert('Please enter both username and password');
    }
}

// Display bookings
function displayBookings() {
    if (!currentUser) {
        document.getElementById('booking-list').innerHTML = '<p>Please login to view your bookings</p>';
        return;
    }

    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    const bookingList = document.getElementById('booking-list');
    bookingList.innerHTML = '';

    if (userBookings.length === 0) {
        bookingList.innerHTML = '<p>No bookings found</p>';
        return;
    }

    userBookings.forEach(booking => {
        const room = rooms.find(r => r.id === booking.roomId);
        const bookingCard = document.createElement('div');
        bookingCard.className = 'booking-card';
        bookingCard.innerHTML = `
            <h3>${room.name}</h3>
            <p>Check-in: ${booking.checkIn}</p>
            <p>Check-out: ${booking.checkOut}</p>
            <p>Total Price: $${booking.totalPrice}</p>
        `;
        bookingList.appendChild(bookingCard);
    });
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init); 