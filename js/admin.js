if (localStorage.getItem('hotelUser') !== 'admin') {
    window.location.href = 'login.html';
}

// Function to switch to a specific tab
function switchToTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to specified tab and corresponding content
    const tab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
    const contentElement = document.getElementById(`${tabId}-tab`);
    
    if (tab && contentElement) {
        tab.classList.add('active');
        contentElement.classList.add('active');
    }
}

// Tab switching functionality
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        switchToTab(tabId);
    });
});

// Handle hash-based navigation
function handleHashNavigation() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash) {
        switchToTab(hash);
    }
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashNavigation);

// Initialize all sections
try {
    initializeBookings();
} catch (error) {
    console.error('Error initializing bookings:', error);
}

try {
    initializeRoomManagement();
} catch (error) {
    console.error('Error initializing room management:', error);
}

try {
    initializeUserManagement();
} catch (error) {
    console.error('Error initializing user management:', error);
}

try {
    initializeReports();
} catch (error) {
    console.error('Error initializing reports:', error);
}

// Handle initial hash navigation
handleHashNavigation();

function initializeBookings() {
    const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
    const bookingList = document.getElementById('admin-booking-list');
    const filter = document.getElementById('booking-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (!bookingList || !filter || !dateFilter) {
        console.error('Required elements for bookings not found');
        return;
    }
    
    function displayBookings(filteredBookings) {
        bookingList.innerHTML = '';
        if (Object.keys(filteredBookings).length === 0) {
            bookingList.innerHTML = '<p>No bookings found.</p>';
            return;
        }
        
        Object.entries(filteredBookings).forEach(([user, userBookings]) => {
            userBookings.forEach(booking => {
                const now = new Date().toISOString().split('T')[0];
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
                    <p><strong>User:</strong> ${user}</p>
                    <p><strong>Room ID:</strong> ${booking.roomId}</p>
                    <p>Check-in: ${booking.checkIn}</p>
                    <p>Check-out: ${booking.checkOut}</p>
                    <p>Total Price: $${booking.totalPrice}</p>
                    <button onclick="cancelBooking('${user}', ${userBookings.indexOf(booking)})" class="cancel-button">Cancel Booking</button>
                `;
                bookingList.appendChild(card);
            });
        });
    }
    
    function filterBookings() {
        const filterValue = filter.value;
        const dateValue = dateFilter.value;
        let filteredBookings = {...bookings};
        
        // Apply status filter
        if (filterValue !== 'all') {
            const now = new Date().toISOString().split('T')[0];
            Object.keys(filteredBookings).forEach(user => {
                filteredBookings[user] = filteredBookings[user].filter(booking => {
                    switch(filterValue) {
                        case 'active':
                            return booking.checkIn <= now && booking.checkOut >= now;
                        case 'future':
                            return booking.checkIn > now;
                        case 'past':
                            return booking.checkOut < now;
                        default:
                            return true;
                    }
                });
            });
        }
        
        // Apply date filter
        if (dateValue) {
            Object.keys(filteredBookings).forEach(user => {
                filteredBookings[user] = filteredBookings[user].filter(booking => 
                    booking.checkIn <= dateValue && booking.checkOut >= dateValue
                );
            });
        }
        
        // Remove empty user bookings
        Object.keys(filteredBookings).forEach(user => {
            if (filteredBookings[user].length === 0) {
                delete filteredBookings[user];
            }
        });
        
        displayBookings(filteredBookings);
    }
    
    filter.addEventListener('change', filterBookings);
    dateFilter.addEventListener('change', filterBookings);
    displayBookings(bookings);
}

function initializeRoomManagement() {
    const roomStatus = document.getElementById('room-status-summary');
    const maintenanceBtn = document.getElementById('maintenance-btn');
    const availableBtn = document.getElementById('available-btn');
    const modal = document.getElementById('room-selection-modal');
    const modalTitle = document.getElementById('modal-title');
    const roomList = document.getElementById('room-selection-list');
    const floorFilter = document.getElementById('floor-filter');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const roomSearch = document.getElementById('room-search');
    const cancelBtn = document.getElementById('cancel-room-selection');
    const confirmBtn = document.getElementById('confirm-room-selection');
    
    let selectedRoom = null;
    let currentAction = null; // 'maintenance' or 'available'
    
    function showRoomSelectionModal(action) {
        currentAction = action;
        modalTitle.textContent = action === 'maintenance' ? 'Set Room for Maintenance' : 'Set Room as Available';
        modal.style.display = 'flex';
        updateRoomList();
    }
    
    function updateRoomList() {
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
        const now = new Date().toISOString().split('T')[0];
        
        const floorValue = floorFilter.value;
        const categoryValue = categoryFilter.value;
        const statusValue = statusFilter.value;
        const searchValue = roomSearch.value.toLowerCase();
        
        let filteredRooms = rooms.filter(room => {
            const isOccupied = Object.values(bookings).some(userBookings => 
                userBookings.some(booking => 
                    booking.roomId === room.roomID && 
                    booking.checkIn <= now && 
                    booking.checkOut >= now
                )
            );
            
            const roomStatus = room.maintenance ? 'maintenance' : (isOccupied ? 'occupied' : 'available');
            
            return (!floorValue || room.floor.toString() === floorValue) &&
                   (!categoryValue || room.category === categoryValue) &&
                   (!statusValue || roomStatus === statusValue) &&
                   (!searchValue || room.roomID.toLowerCase().includes(searchValue));
        });
        
        roomList.innerHTML = filteredRooms.map(room => {
            const isOccupied = Object.values(bookings).some(userBookings => 
                userBookings.some(booking => 
                    booking.roomId === room.roomID && 
                    booking.checkIn <= now && 
                    booking.checkOut >= now
                )
            );
            
            const roomStatus = room.maintenance ? 'maintenance' : (isOccupied ? 'occupied' : 'available');
            const isSelected = selectedRoom && selectedRoom.roomID === room.roomID;
            
            return `
                <div class="room-selection-item ${roomStatus} ${isSelected ? 'selected' : ''}" 
                     data-room-id="${room.roomID}">
                    <h4>${room.roomID}</h4>
                    <p>Type: ${room.category}</p>
                    <p>Floor: ${room.floor}</p>
                    <p>Status: ${roomStatus}</p>
                    <p>Price: $${room.price}/night</p>
                </div>
            `;
        }).join('');

        // Add click event listeners to room items
        roomList.querySelectorAll('.room-selection-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove selected class from all items
                roomList.querySelectorAll('.room-selection-item').forEach(i => i.classList.remove('selected'));
                // Add selected class to clicked item
                item.classList.add('selected');
                // Find and set the selected room
                const roomId = item.getAttribute('data-room-id');
                selectedRoom = rooms.find(r => r.roomID === roomId);
            });
        });
    }
    
    // Event listeners for filters
    floorFilter.addEventListener('change', updateRoomList);
    categoryFilter.addEventListener('change', updateRoomList);
    statusFilter.addEventListener('change', updateRoomList);
    roomSearch.addEventListener('input', updateRoomList);
    
    // Event listeners for buttons
    maintenanceBtn.addEventListener('click', () => showRoomSelectionModal('maintenance'));
    availableBtn.addEventListener('click', () => showRoomSelectionModal('available'));
    
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        selectedRoom = null;
    });
    
    confirmBtn.addEventListener('click', () => {
        if (!selectedRoom) {
            alert('Please select a room first.');
            return;
        }
        
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const room = rooms.find(r => r.roomID === selectedRoom.roomID);
        
        if (room) {
            room.maintenance = currentAction === 'maintenance';
            localStorage.setItem('rooms', JSON.stringify(rooms));
            updateRoomStatus();
            modal.style.display = 'none';
            selectedRoom = null;
            alert(`Room ${room.roomID} has been ${currentAction === 'maintenance' ? 'set for maintenance' : 'set as available'}.`);
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            selectedRoom = null;
        }
    });
    
    function updateRoomStatus() {
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
        const now = new Date().toISOString().split('T')[0];
        
        let status = {
            total: rooms.length,
            available: 0,
            occupied: 0,
            maintenance: 0,
            byCategory: {
                'Deluxe': { total: 0, available: 0, occupied: 0, maintenance: 0 },
                'Suite': { total: 0, available: 0, occupied: 0, maintenance: 0 },
                'Standard': { total: 0, available: 0, occupied: 0, maintenance: 0 }
            }
        };
        
        rooms.forEach(room => {
            // Update category stats
            status.byCategory[room.category].total++;
            
            if (room.maintenance) {
                status.maintenance++;
                status.byCategory[room.category].maintenance++;
            } else {
                let isOccupied = false;
                Object.values(bookings).forEach(userBookings => {
                    if (userBookings.some(booking => 
                        booking.roomId === room.roomID && 
                        booking.checkIn <= now && 
                        booking.checkOut >= now
                    )) {
                        isOccupied = true;
                    }
                });
                
                if (isOccupied) {
                    status.occupied++;
                    status.byCategory[room.category].occupied++;
                } else {
                    status.available++;
                    status.byCategory[room.category].available++;
                }
            }
        });
        
        // Create detailed room list
        let roomListHTML = '<div class="room-list">';
        rooms.forEach(room => {
            const isOccupied = Object.values(bookings).some(userBookings => 
                userBookings.some(booking => 
                    booking.roomId === room.roomID && 
                    booking.checkIn <= now && 
                    booking.checkOut >= now
                )
            );
            
            let statusClass = 'available';
            if (room.maintenance) statusClass = 'maintenance';
            else if (isOccupied) statusClass = 'occupied';
            
            roomListHTML += `
                <div class="room-item ${statusClass}">
                    <h4>${room.roomID}</h4>
                    <p>Type: ${room.category}</p>
                    <p>Floor: ${room.floor}</p>
                    <p>Status: ${room.maintenance ? 'Maintenance' : (isOccupied ? 'Occupied' : 'Available')}</p>
                    <p>Price: $${room.price}/night</p>
                </div>
            `;
        });
        roomListHTML += '</div>';
        
        roomStatus.innerHTML = `
            <div class="status-overview">
                <div class="status-card">
                    <h4>Total Rooms</h4>
                    <p>${status.total}</p>
                </div>
                <div class="status-card">
                    <h4>Available</h4>
                    <p>${status.available}</p>
                </div>
                <div class="status-card">
                    <h4>Occupied</h4>
                    <p>${status.occupied}</p>
                </div>
                <div class="status-card">
                    <h4>Maintenance</h4>
                    <p>${status.maintenance}</p>
                </div>
            </div>
            <div class="category-stats">
                <h3>Room Status by Category</h3>
                ${Object.entries(status.byCategory).map(([category, stats]) => `
                    <div class="category-card">
                        <h4>${category}</h4>
                        <p>Total: ${stats.total}</p>
                        <p>Available: ${stats.available}</p>
                        <p>Occupied: ${stats.occupied}</p>
                        <p>Maintenance: ${stats.maintenance}</p>
                    </div>
                `).join('')}
            </div>
            ${roomListHTML}
        `;
    }
    
    updateRoomStatus();
}

function initializeUserManagement() {
    const userList = document.getElementById('user-list');
    const blockBtn = document.getElementById('block-user-btn');
    const unblockBtn = document.getElementById('unblock-user-btn');
    
    if (!userList || !blockBtn || !unblockBtn) {
        console.error('Required elements for user management not found');
        return;
    }
    
    function updateUserList() {
        // Get users from hotelUsers in localStorage
        let localUsers = localStorage.getItem('hotelUsers') || '';
        const users = localUsers.split('\n')
            .filter(line => line.trim()) // Remove empty lines
            .map(line => line.split(':')[0]); // Get usernames only
        
        const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
        
        userList.innerHTML = users.map(user => `
            <div class="user-card ${blockedUsers.includes(user) ? 'blocked' : ''}">
                <h4>${user}</h4>
                <p>Status: ${blockedUsers.includes(user) ? 'Blocked' : 'Active'}</p>
            </div>
        `).join('');
    }
    
    blockBtn.addEventListener('click', () => {
        const username = prompt('Enter username to block:');
        if (username) {
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
            if (!blockedUsers.includes(username)) {
                blockedUsers.push(username);
                localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
                updateUserList();
                alert('User blocked successfully.');
            } else {
                alert('User is already blocked.');
            }
        }
    });
    
    unblockBtn.addEventListener('click', () => {
        const username = prompt('Enter username to unblock:');
        if (username) {
            const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
            const index = blockedUsers.indexOf(username);
            if (index > -1) {
                blockedUsers.splice(index, 1);
                localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
                updateUserList();
                alert('User unblocked successfully.');
            } else {
                alert('User is not blocked.');
            }
        }
    });
    
    updateUserList();
}

function initializeReports() {
    const reportType = document.getElementById('report-type');
    const reportMonth = document.getElementById('report-month');
    const generateBtn = document.getElementById('generate-report');
    const reportContent = document.getElementById('report-content');
    
    if (!reportType || !reportMonth || !generateBtn || !reportContent) {
        console.error('Required elements for reports not found');
        return;
    }
    
    generateBtn.addEventListener('click', () => {
        const type = reportType.value;
        const month = reportMonth.value;
        
        if (!month) {
            alert('Please select a month.');
            return;
        }
        
        const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        
        let report = '';
        switch(type) {
            case 'occupancy':
                report = generateOccupancyReport(bookings, rooms, month);
                break;
            case 'revenue':
                report = generateRevenueReport(bookings, month);
                break;
            case 'bookings':
                report = generateBookingStats(bookings, month);
                break;
        }
        
        reportContent.innerHTML = report;
    });
}

function generateOccupancyReport(bookings, rooms, month) {
    const [year, monthNum] = month.split('-');
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    let totalOccupied = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${monthNum}-${day.toString().padStart(2, '0')}`;
        let occupied = 0;
        
        Object.values(bookings).forEach(userBookings => {
            userBookings.forEach(booking => {
                if (booking.checkIn <= date && booking.checkOut >= date) {
                    occupied++;
                }
            });
        });
        
        totalOccupied += occupied;
    }
    
    const occupancyRate = (totalOccupied / (rooms.length * daysInMonth)) * 100;
    
    return `
        <div class="report-card">
            <h3>Occupancy Report for ${month}</h3>
            <p>Total Rooms: ${rooms.length}</p>
            <p>Total Room Nights: ${rooms.length * daysInMonth}</p>
            <p>Occupied Room Nights: ${totalOccupied}</p>
            <p>Occupancy Rate: ${occupancyRate.toFixed(2)}%</p>
        </div>
    `;
}

function generateRevenueReport(bookings, month) {
    const [year, monthNum] = month.split('-');
    let totalRevenue = 0;
    let bookingCount = 0;
    
    Object.values(bookings).forEach(userBookings => {
        userBookings.forEach(booking => {
            const bookingMonth = booking.checkIn.split('-')[1];
            if (bookingMonth === monthNum) {
                totalRevenue += booking.totalPrice;
                bookingCount++;
            }
        });
    });
    
    return `
        <div class="report-card">
            <h3>Revenue Report for ${month}</h3>
            <p>Total Bookings: ${bookingCount}</p>
            <p>Total Revenue: $${totalRevenue}</p>
            <p>Average Revenue per Booking: $${(totalRevenue / bookingCount || 0).toFixed(2)}</p>
        </div>
    `;
}

function generateBookingStats(bookings, month) {
    const [year, monthNum] = month.split('-');
    let stats = {
        total: 0,
        byRoomType: {},
        averageStay: 0,
        totalNights: 0
    };
    
    Object.values(bookings).forEach(userBookings => {
        userBookings.forEach(booking => {
            const bookingMonth = booking.checkIn.split('-')[1];
            if (bookingMonth === monthNum) {
                stats.total++;
                stats.totalNights += booking.nights;
                
                const roomType = booking.roomName.split(' ')[0];
                stats.byRoomType[roomType] = (stats.byRoomType[roomType] || 0) + 1;
            }
        });
    });
    
    stats.averageStay = stats.totalNights / stats.total || 0;
    
    return `
        <div class="report-card">
            <h3>Booking Statistics for ${month}</h3>
            <p>Total Bookings: ${stats.total}</p>
            <p>Average Stay Duration: ${stats.averageStay.toFixed(1)} nights</p>
            <h4>Bookings by Room Type:</h4>
            ${Object.entries(stats.byRoomType).map(([type, count]) => 
                `<p>${type}: ${count} bookings</p>`
            ).join('')}
        </div>
    `;
}

function cancelBooking(user, index) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const bookings = JSON.parse(localStorage.getItem('hotelBookings') || '{}');
        bookings[user].splice(index, 1);
        localStorage.setItem('hotelBookings', JSON.stringify(bookings));
        initializeBookings();
    }
}

document.getElementById('logout-link').onclick = function() {
    localStorage.removeItem('hotelUser');
    window.location.href = 'login.html';
}; 