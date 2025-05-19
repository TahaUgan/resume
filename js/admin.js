// Check if user is admin
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
if (currentUser.role !== 'admin') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    // Load initial data
    await initializeData();
    
    // Tab switching functionality
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            const contentElement = document.getElementById(`${tabId}-tab`);
            
            if (contentElement) {
                contentElement.classList.add('active');
            }
        });
    });

    // Initialize the default tab (Bookings) on page load
    const initialTab = document.querySelector('.admin-tab.active');
    if (initialTab) {
        const tabId = initialTab.getAttribute('data-tab');
        const contentElement = document.getElementById(`${tabId}-tab`);
        if (contentElement) {
            contentElement.classList.add('active');
        }
    }
    
    // Initialize all sections
    initializeBookings();
    initializeRoomManagement();
    initializeUserManagement();
    initializeReports();
});

// File-based data storage functions
async function loadData(filename) {
    try {
        const response = await fetch(`/data/${filename}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return null;
    }
}

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

// Initialize data
async function initializeData() {
    const roomsData = await loadData('rooms.json');
    const bookingsData = await loadData('bookings.json');
    const usersData = await loadData('users.json');

    if (!roomsData || !bookingsData || !usersData) {
        console.error('Failed to load initial data');
        return;
    }

    // Store data in memory for faster access
    window.hotelData = {
        rooms: roomsData.rooms,
        bookings: bookingsData.bookings,
        users: usersData.users,
        blockedUsers: usersData.blockedUsers
    };
}

// Modified functions to use file-based storage
async function initializeBookings() {
    const bookingList = document.getElementById('admin-booking-list');
    const bookingFilter = document.getElementById('booking-filter');
    const dateFilter = document.getElementById('date-filter');
    
    function displayBookings(filteredBookings) {
        bookingList.innerHTML = '';
        
        if (filteredBookings.length === 0) {
            bookingList.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        filteredBookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'booking-card';
            const now = new Date().toISOString().split('T')[0];
            const isActive = booking.checkIn <= now && booking.checkOut >= now;
            const isFuture = booking.checkIn > now;
            const isPast = booking.checkOut < now;
            
            let status = 'Active';
            let statusClass = 'status-active';
            if (isPast) {
                status = 'Completed';
                statusClass = 'status-completed';
            } else if (isFuture) {
                status = 'Upcoming';
                statusClass = 'status-upcoming';
            }

            card.innerHTML = `
                <div class="booking-header">
                    <h3>${booking.roomName}</h3>
                    <span class="booking-status ${statusClass}">${status}</span>
                </div>
                <div class="booking-details">
                    <div class="detail-item">
                        <span>Guest</span>
                        <span>${booking.userId}</span>
                    </div>
                    <div class="detail-item">
                        <span>Check-in</span>
                        <span>${booking.checkIn}</span>
                    </div>
                    <div class="detail-item">
                        <span>Check-out</span>
                        <span>${booking.checkOut}</span>
                    </div>
                    <div class="detail-item">
                        <span>Nights</span>
                        <span>${booking.nights}</span>
                    </div>
                    <div class="detail-item">
                        <span>Total</span>
                        <span>$${booking.totalPrice}</span>
                    </div>
                </div>
                ${isFuture ? `
                    <div class="booking-actions">
                        <button onclick="cancelBooking('${booking.userId}', ${booking.id})" class="cancel-button">Cancel Booking</button>
                    </div>
                ` : ''}
            `;
            bookingList.appendChild(card);
        });
    }

    function filterBookings() {
        const filterValue = bookingFilter.value;
        const dateValue = dateFilter.value;
        const allBookings = window.hotelData.bookings;
        
        let filtered = allBookings;
        
        if (filterValue !== 'all') {
            const now = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(booking => {
                if (filterValue === 'active') {
                    return booking.checkIn <= now && booking.checkOut >= now;
                } else if (filterValue === 'future') {
                    return booking.checkIn > now;
                } else if (filterValue === 'past') {
                    return booking.checkOut < now;
                }
                return true;
            });
        }
        
        if (dateValue) {
            filtered = filtered.filter(booking => 
                booking.checkIn <= dateValue && booking.checkOut >= dateValue
            );
        }
        
        displayBookings(filtered);
    }

    bookingFilter.addEventListener('change', filterBookings);
    dateFilter.addEventListener('change', filterBookings);
    
    filterBookings();
}

async function cancelBooking(userId, bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const bookings = window.hotelData.bookings;
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        
        if (bookingIndex !== -1) {
            bookings.splice(bookingIndex, 1);
            
            // Save updated bookings
            const saved = await saveData('bookings.json', { bookings });
            if (saved) {
                // Update in-memory data
                window.hotelData.bookings = bookings;
                // Refresh the bookings display
                initializeBookings();
            } else {
                alert('Error saving booking data. Please try again.');
            }
        }
    }
}

async function initializeRoomManagement() {
    const roomStatusSummary = document.getElementById('room-status-summary');
    const maintenanceBtn = document.getElementById('maintenance-btn');
    const availableBtn = document.getElementById('available-btn');
    
    function updateRoomStatus() {
        const rooms = window.hotelData.rooms;
        const bookings = window.hotelData.bookings;
        const now = new Date().toISOString().split('T')[0];
        
        const statusCounts = {
            available: 0,
            occupied: 0,
            maintenance: 0
        };
        
        rooms.forEach(room => {
            if (room.maintenance) {
                statusCounts.maintenance++;
            } else {
                const isOccupied = bookings.some(booking => 
                    booking.roomId === room.id && 
                    booking.checkIn <= now && 
                    booking.checkOut >= now
                );
                if (isOccupied) {
                    statusCounts.occupied++;
                } else {
                    statusCounts.available++;
                }
            }
        });
        
        roomStatusSummary.innerHTML = `
            <div class="status-card">
                <h4>Available Rooms</h4>
                <p>${statusCounts.available}</p>
            </div>
            <div class="status-card">
                <h4>Occupied Rooms</h4>
                <p>${statusCounts.occupied}</p>
            </div>
            <div class="status-card">
                <h4>Under Maintenance</h4>
                <p>${statusCounts.maintenance}</p>
            </div>
        `;
    }
    
    function showRoomSelection(action) {
        const rooms = window.hotelData.rooms;
        const bookings = window.hotelData.bookings;
        const now = new Date().toISOString().split('T')[0];
        
        let availableRooms = rooms;
        if (action === 'maintenance') {
            availableRooms = rooms.filter(room => !room.maintenance);
        } else if (action === 'available') {
            availableRooms = rooms.filter(room => room.maintenance);
        }
        
        if (availableRooms.length === 0) {
            alert(`No rooms available for this action.`);
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'room-selection-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Select a Room</h3>
                <div class="room-list">
                    ${availableRooms.map(room => `
                        <div class="room-item" onclick="handleRoomAction(${room.id}, '${action}')">
                            <h4>${room.name}</h4>
                            <p>Floor: ${room.floor}</p>
                            <p>Capacity: ${room.capacity} persons</p>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Cancel</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }
    
    maintenanceBtn.addEventListener('click', () => showRoomSelection('maintenance'));
    availableBtn.addEventListener('click', () => showRoomSelection('available'));
    
    updateRoomStatus();
}

async function handleRoomAction(roomId, action) {
    const rooms = window.hotelData.rooms;
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex !== -1) {
        if (action === 'maintenance') {
            rooms[roomIndex].maintenance = true;
        } else if (action === 'available') {
            rooms[roomIndex].maintenance = false;
        }
        
        // Save updated rooms data
        const saved = await saveData('rooms.json', { rooms });
        if (saved) {
            // Update in-memory data
            window.hotelData.rooms = rooms;
            // Remove the dialog
            document.querySelector('.room-selection-dialog').remove();
            // Update the room status display
            initializeRoomManagement();
        } else {
            alert('Error saving room data. Please try again.');
        }
    }
}

async function initializeUserManagement() {
    const userList = document.getElementById('user-list');
    const blockUserBtn = document.getElementById('block-user-btn');
    const unblockUserBtn = document.getElementById('unblock-user-btn');
    
    function displayUsers() {
        const users = window.hotelData.users;
        const blockedUsers = window.hotelData.blockedUsers;
        
        userList.innerHTML = '';
        
        Object.entries(users).forEach(([username, userData]) => {
            const isBlocked = blockedUsers.includes(username);
            const card = document.createElement('div');
            card.className = `user-card ${isBlocked ? 'blocked' : ''}`;
            
            card.innerHTML = `
                <div class="user-info">
                    <h4>${username}</h4>
                    <p>Email: ${userData.email || 'N/A'}</p>
                    <p>Role: ${userData.role === 'admin' ? 'Administrator' : 'Guest'}</p>
                    <p>Status: ${isBlocked ? 'Blocked' : 'Active'}</p>
                </div>
                ${userData.role !== 'admin' ? `
                    <div class="user-actions">
                        <button onclick="handleUserAction('${username}', ${!isBlocked})" 
                                class="${isBlocked ? 'unblock-button' : 'block-button'}">
                            ${isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                    </div>
                ` : ''}
            `;
            
            userList.appendChild(card);
        });
    }
    
    // Add event listeners for bulk actions
    blockUserBtn.addEventListener('click', async () => {
        const selectedUsers = Array.from(document.querySelectorAll('.user-card:not(.blocked) input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedUsers.length === 0) {
            alert('Please select users to block.');
            return;
        }
        
        if (confirm(`Are you sure you want to block ${selectedUsers.length} user(s)?`)) {
            const blockedUsers = window.hotelData.blockedUsers;
            blockedUsers.push(...selectedUsers);
            
            // Save updated users data
            const saved = await saveData('users.json', {
                users: window.hotelData.users,
                blockedUsers: blockedUsers
            });
            
            if (saved) {
                // Update in-memory data
                window.hotelData.blockedUsers = blockedUsers;
                displayUsers();
            } else {
                alert('Error saving user data. Please try again.');
            }
        }
    });
    
    unblockUserBtn.addEventListener('click', async () => {
        const selectedUsers = Array.from(document.querySelectorAll('.user-card.blocked input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedUsers.length === 0) {
            alert('Please select users to unblock.');
            return;
        }
        
        if (confirm(`Are you sure you want to unblock ${selectedUsers.length} user(s)?`)) {
            const blockedUsers = window.hotelData.blockedUsers;
            const updatedBlockedUsers = blockedUsers.filter(user => !selectedUsers.includes(user));
            
            // Save updated users data
            const saved = await saveData('users.json', {
                users: window.hotelData.users,
                blockedUsers: updatedBlockedUsers
            });
            
            if (saved) {
                // Update in-memory data
                window.hotelData.blockedUsers = updatedBlockedUsers;
                displayUsers();
            } else {
                alert('Error saving user data. Please try again.');
            }
        }
    });
    
    // Initial display
    displayUsers();
}

async function handleUserAction(username, shouldBlock) {
    const users = window.hotelData.users;
    const user = users[username];
    
    if (user.role === 'admin') {
        alert('Cannot modify admin account.');
        return;
    }
    
    const blockedUsers = window.hotelData.blockedUsers;
    
    if (shouldBlock) {
        if (!blockedUsers.includes(username)) {
            blockedUsers.push(username);
        }
    } else {
        const index = blockedUsers.indexOf(username);
        if (index !== -1) {
            blockedUsers.splice(index, 1);
        }
    }
    
    // Save updated users data
    const saved = await saveData('users.json', {
        users: users,
        blockedUsers: blockedUsers
    });
    
    if (saved) {
        // Update in-memory data
        window.hotelData.blockedUsers = blockedUsers;
        initializeUserManagement();
    } else {
        alert('Error saving user data. Please try again.');
    }
}

function initializeReports() {
    const reportType = document.getElementById('report-type');
    const reportMonth = document.getElementById('report-month');
    const generateReportBtn = document.getElementById('generate-report');
    const reportContent = document.getElementById('report-content');
    
    function generateReport() {
        const type = reportType.value;
        const month = reportMonth.value;
        
        if (!month) {
            alert('Please select a month for the report.');
            return;
        }
        
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0);
        
        const bookings = window.hotelData.bookings;
        const rooms = window.hotelData.rooms;
        
        // Filter bookings for the selected month
        const monthBookings = bookings.filter(booking => {
            const bookingStart = new Date(booking.checkIn);
            const bookingEnd = new Date(booking.checkOut);
            return (bookingStart >= startDate && bookingStart <= endDate) ||
                   (bookingEnd >= startDate && bookingEnd <= endDate) ||
                   (bookingStart <= startDate && bookingEnd >= endDate);
        });
        
        let reportHTML = '';
        
        switch (type) {
            case 'occupancy':
                const totalRooms = rooms.length;
                const occupiedNights = monthBookings.reduce((total, booking) => {
                    const start = new Date(Math.max(new Date(booking.checkIn), startDate));
                    const end = new Date(Math.min(new Date(booking.checkOut), endDate));
                    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    return total + nights;
                }, 0);
                
                const totalNights = totalRooms * endDate.getDate();
                const occupancyRate = (occupiedNights / totalNights * 100).toFixed(1);
                
                reportHTML = `
                    <div class="report-card">
                        <h3>Occupancy Report - ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div class="report-details">
                            <div class="detail-item">
                                <span>Total Rooms</span>
                                <span>${totalRooms}</span>
                            </div>
                            <div class="detail-item">
                                <span>Total Nights</span>
                                <span>${totalNights}</span>
                            </div>
                            <div class="detail-item">
                                <span>Occupied Nights</span>
                                <span>${occupiedNights}</span>
                            </div>
                            <div class="detail-item">
                                <span>Occupancy Rate</span>
                                <span>${occupancyRate}%</span>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'revenue':
                const totalRevenue = monthBookings.reduce((total, booking) => total + booking.totalPrice, 0);
                const averageRevenue = (totalRevenue / monthBookings.length || 0).toFixed(2);
                
                reportHTML = `
                    <div class="report-card">
                        <h3>Revenue Report - ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div class="report-details">
                            <div class="detail-item">
                                <span>Total Bookings</span>
                                <span>${monthBookings.length}</span>
                            </div>
                            <div class="detail-item">
                                <span>Total Revenue</span>
                                <span>$${totalRevenue.toFixed(2)}</span>
                            </div>
                            <div class="detail-item">
                                <span>Average Revenue per Booking</span>
                                <span>$${averageRevenue}</span>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'bookings':
                const bookingsByRoom = {};
                monthBookings.forEach(booking => {
                    const room = rooms.find(r => r.id === booking.roomId);
                    if (room) {
                        if (!bookingsByRoom[room.name]) {
                            bookingsByRoom[room.name] = 0;
                        }
                        bookingsByRoom[room.name]++;
                    }
                });
                
                reportHTML = `
                    <div class="report-card">
                        <h3>Booking Statistics - ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div class="report-details">
                            <div class="detail-item">
                                <span>Total Bookings</span>
                                <span>${monthBookings.length}</span>
                            </div>
                            <h4>Bookings by Room Type</h4>
                            ${Object.entries(bookingsByRoom).map(([roomName, count]) => `
                                <div class="detail-item">
                                    <span>${roomName}</span>
                                    <span>${count} bookings</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
        }
        
        reportContent.innerHTML = reportHTML;
    }
    
    // Add event listener for report generation
    generateReportBtn.addEventListener('click', generateReport);
    
    // Set default month to current month
    const now = new Date();
    reportMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

document.getElementById('logout-link').onclick = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
};

// Initialize sample data if not exists
function initializeSampleData() {
    // Initialize rooms if not exists
    if (!localStorage.getItem('hotelRooms')) {
        const sampleRooms = [
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
        ];
        localStorage.setItem('hotelRooms', JSON.stringify(sampleRooms));
    }
}