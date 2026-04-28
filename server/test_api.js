const url = 'http://localhost:5000/api/v1/ai/predict-wait-time';

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    numberOfPatients: 5,
    doctorAvailability: 2,
    timeSlots: 120
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
