if (!localStorage.getItem('hotelUser')) {
    window.location.href = 'login.html';
}

const user = localStorage.getItem('hotelUser');
const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
const userBookings = bookings[user] || [];

const bookingList = document.getElementById('booking-list');
if (userBookings.length === 0) {
    bookingList.innerHTML = '<p>No bookings found.</p>';
} else {
    const now = new Date().toISOString().split('T')[0];
    userBookings.forEach((booking, index) => {
        const isOld = booking.checkOut < now;
        const isActive = booking.checkIn <= now && booking.checkOut >= now;
        const isFuture = booking.checkIn > now;
        let cardClass = 'booking-card';
        if (isOld) cardClass += ' old-booking';
        else if (isActive) cardClass += ' active-booking';
        else if (isFuture) cardClass += ' future-booking';
        
        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <h3>${booking.roomName}</h3>
            <p><strong>Room ID:</strong> ${booking.roomId}</p>
            <p>Check-in: ${booking.checkIn}</p>
            <p>Check-out: ${booking.checkOut}</p>
            <p>Total Price: $${booking.totalPrice}</p>
            ${isFuture ? `<button onclick="cancelBooking(${index})" class="cancel-button">Cancel Booking</button>` : ''}
        `;
        bookingList.appendChild(card);
    });
}

function cancelBooking(index) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const user = localStorage.getItem('hotelUser');
        const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
        const userBookings = bookings[user] || [];
        
        // Remove the booking
        userBookings.splice(index, 1);
        bookings[user] = userBookings;
        
        // Update localStorage
        localStorage.setItem('hotelBookings', JSON.stringify(bookings));
        
        // Refresh the page
        location.reload();
    }
}

document.getElementById('logout-link').onclick = function() {
    localStorage.removeItem('hotelUser');
    window.location.href = 'login.html';
}; 