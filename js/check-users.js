// Get the stored data from localStorage
const storedData = localStorage.getItem('hotelData');
if (storedData) {
    const data = JSON.parse(storedData);
    console.log('Stored Users:', data.users);
} else {
    console.log('No data found in localStorage');
} 