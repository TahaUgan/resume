if (!localStorage.getItem('hotelUser')) {
    window.location.href = 'login.html';
}

const categories = [
    { name: 'Deluxe', price: 200, capacity: 2, description: 'Spacious room with city view and premium amenities', image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80' },
    { name: 'Suite', price: 350, capacity: 4, description: 'Luxury suite with separate living area and premium services', image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80' },
    { name: 'Standard', price: 150, capacity: 2, description: 'Comfortable room with essential amenities', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80' }
];

const rooms = [];
let roomCounter = 1;
for (let floor = 1; floor <= 5; floor++) {
    categories.forEach(cat => {
        for (let i = 1; i <= 4; i++) {
            rooms.push({
                id: roomCounter,
                roomID: `F${floor}${cat.name[0]}${i}`,
                name: `${cat.name} Room`,
                category: cat.name,
                type: cat.name,
                price: cat.price,
                capacity: cat.capacity,
                floor: floor,
                description: cat.description,
                image: cat.image,
                available: true,
                amenities: getAmenitiesForCategory(cat.name)
            });
            roomCounter++;
        }
    });
}

function getAmenitiesForCategory(category) {
    const commonAmenities = ['Free WiFi', 'Air Conditioning', 'TV', 'Mini Bar'];
    const specificAmenities = {
        'Deluxe': ['City View', 'King Size Bed', 'Work Desk', 'Premium Toiletries'],
        'Suite': ['Living Room', 'Kitchenette', 'Jacuzzi', 'Room Service'],
        'Standard': ['Queen Size Bed', 'Desk', 'Basic Toiletries']
    };
    return [...commonAmenities, ...(specificAmenities[category] || [])];
}

const placeholderImg = 'https://via.placeholder.com/400x220?text=No+Image';
let currentCategory = null;
let currentBookingRoom = null;

function displayCategories() {
    const catList = document.getElementById('category-list');
    catList.innerHTML = '';
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'room-card';
        card.innerHTML = `
            <img src="${cat.image}" alt="${cat.name}" onerror="this.onerror=null;this.src='${placeholderImg}';">
            <div class="room-card-content">
                <h3>${cat.name} Room</h3>
                <p>${cat.description}</p>
                <p><strong>Capacity:</strong> ${cat.capacity} persons</p>
                <p><strong>Price:</strong> $${cat.price} per night</p>
                <div class="amenities">
                    <h4>Amenities:</h4>
                    <ul>
                        ${getAmenitiesForCategory(cat.name).map(amenity => `<li>${amenity}</li>`).join('')}
                    </ul>
                </div>
                <button onclick="startBooking('${cat.name}')">Book Now</button>
            </div>
        `;
        catList.appendChild(card);
    });
}

displayCategories();

window.startBooking = function(category) {
    currentCategory = category;
    document.getElementById('booking-modal').style.display = 'flex';
    document.getElementById('modal-checkin').value = '';
    document.getElementById('modal-checkout').value = '';
    document.getElementById('modal-persons').value = '';
    document.getElementById('room-select-area').style.display = 'none';
    
    // Show the category's default image immediately
    const categoryInfo = categories.find(cat => cat.name === category);
    if (categoryInfo) {
        document.getElementById('modal-room-image').innerHTML = `
            <img src="${categoryInfo.image}" 
                 alt="${categoryInfo.name}" 
                 style="width:100%;height:auto;max-height:500px;object-fit:cover;border-radius:12px;">
        `;
    }
    
    currentBookingRoom = null;
};

document.getElementById('close-modal').onclick = function() {
    document.getElementById('booking-modal').style.display = 'none';
    currentBookingRoom = null;
    currentCategory = null;
};

function getAvailableRooms(category, checkIn, checkOut, persons) {
    // Only rooms of the category with enough capacity and not booked for the dates
    let filtered = rooms.filter(r => r.category === category && persons <= r.capacity);
    let bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
    let allBookings = Object.values(bookings).flat();
    filtered = filtered.filter(room => {
        return !allBookings.some(b => b.roomId === room.roomID && (
            (checkIn >= b.checkIn && checkIn < b.checkOut) ||
            (checkOut > b.checkIn && checkOut <= b.checkOut) ||
            (checkIn <= b.checkIn && checkOut >= b.checkOut)
        ));
    });
    return filtered;
}

function showRoomSelection(rooms) {
    const area = document.getElementById('room-select-area');
    if (rooms.length === 0) {
        area.innerHTML = '<p style="color:#c00;font-weight:bold;">No available rooms for your selection.</p>';
        area.style.display = 'block';
        document.getElementById('modal-room-image').innerHTML = '';
        currentBookingRoom = null;
        return;
    }
    area.innerHTML = '<label style="font-size:1.1rem;">Select Room:<select id="modal-room-select" style="font-size:1.1rem;padding:0.7rem 1rem;width:100%;margin-top:0.5rem;">' +
        rooms.map(r => `<option value="${r.id}">${r.roomID} (Floor ${r.floor}) - $${r.price}/night</option>`).join('') +
        '</select></label>';
    area.style.display = 'block';
    // Show image of first room by default
    const firstRoom = rooms[0];
    document.getElementById('modal-room-image').innerHTML = `
        <img src="${firstRoom.image}" alt="${firstRoom.name}" style="width:100%;height:auto;max-height:500px;object-fit:cover;border-radius:12px;">
    `;
    document.getElementById('modal-room-select').onchange = function() {
        const selected = rooms.find(r => r.id == this.value);
        document.getElementById('modal-room-image').innerHTML = `
            <img src="${selected.image}" alt="${selected.name}" style="width:100%;height:auto;max-height:500px;object-fit:cover;border-radius:12px;">
        `;
        currentBookingRoom = selected;
    };
    currentBookingRoom = firstRoom;
}

function updateRoomSelectionFromModal() {
    const checkIn = document.getElementById('modal-checkin').value;
    const checkOut = document.getElementById('modal-checkout').value;
    const persons = parseInt(document.getElementById('modal-persons').value, 10) || 1; // Default to 1 if not set
    
    if (!checkIn || !checkOut) return;
    
    // Check if dates are valid
    const today = new Date().toISOString().split('T')[0];
    if (checkIn < today) {
        alert('Check-in date cannot be in the past!');
        document.getElementById('modal-checkin').value = '';
        return;
    }
    
    if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date!');
        document.getElementById('modal-checkout').value = '';
        return;
    }
    
    const availRooms = getAvailableRooms(currentCategory, checkIn, checkOut, persons);
    showRoomSelection(availRooms);
}

document.getElementById('modal-checkin').addEventListener('change', function() {
    updateRoomSelectionFromModal();
});

document.getElementById('modal-checkout').addEventListener('change', function() {
    updateRoomSelectionFromModal();
});

document.getElementById('modal-persons').addEventListener('input', function() {
    const checkIn = document.getElementById('modal-checkin').value;
    const checkOut = document.getElementById('modal-checkout').value;
    if (checkIn && checkOut) {
        updateRoomSelectionFromModal();
    }
});

document.getElementById('booking-form').onsubmit = function(e) {
    e.preventDefault();
    const checkIn = document.getElementById('modal-checkin').value;
    const checkOut = document.getElementById('modal-checkout').value;
    const persons = parseInt(document.getElementById('modal-persons').value, 10);
    
    // Validation
    if (!checkIn || !checkOut || !persons) {
        alert('Please fill in all fields.');
        return;
    }
    
    // Check if dates are valid
    const today = new Date().toISOString().split('T')[0];
    if (checkIn < today) {
        alert('Check-in date cannot be in the past!');
        return;
    }
    
    if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date!');
        return;
    }
    
    // Calculate number of nights
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (nights > 14) {
        alert('Maximum stay duration is 14 nights.');
        return;
    }
    
    // If room selection not shown yet, show it
    if (!currentBookingRoom) {
        const availRooms = getAvailableRooms(currentCategory, checkIn, checkOut, persons);
        showRoomSelection(availRooms);
        return false;
    }
    
    let room = currentBookingRoom;
    
    // Check persons vs capacity
    if (persons > room.capacity) {
        alert('Number of persons exceeds room capacity!');
        return;
    }
    
    // Check availability for date range
    const user = localStorage.getItem('hotelUser');
    let bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
    let allBookings = Object.values(bookings).flat();
    const overlap = allBookings.some(b => b.roomId === room.roomID && (
        (checkIn >= b.checkIn && checkIn < b.checkOut) ||
        (checkOut > b.checkIn && checkOut <= b.checkOut) ||
        (checkIn <= b.checkIn && checkOut >= b.checkOut)
    ));
    
    if (overlap) {
        alert('This room is already booked for the selected dates.');
        return;
    }
    
    // Calculate total price
    const totalPrice = room.price * nights;
    
    // Create booking data
    const bookingData = {
        roomId: room.roomID,
        floor: room.floor,
        capacity: room.capacity,
        persons,
        roomName: room.name,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        amenities: room.amenities
    };
    
    // Store booking data temporarily
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    
    // Close modal and redirect to payment page
    document.getElementById('booking-modal').style.display = 'none';
    currentBookingRoom = null;
    currentCategory = null;
    document.getElementById('room-select-area').style.display = 'none';
    
    // Redirect to payment page
    window.location.href = 'payment.html';
};

document.getElementById('logout-link').onclick = function() {
    localStorage.removeItem('hotelUser');
    window.location.href = 'login.html';
}; 