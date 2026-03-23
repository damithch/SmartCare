
export const mockUsers= [
{
  id: 'u1',
  name: 'Sarah Johnson',
  email: 'patient@smartcare.com',
  role: 'patient',
  phone: '+1 (555) 123-4567',
  avatar: 'https://i.pravatar.cc/150?u=u1'
},
{
  id: 'u2',
  name: 'Dr. James Wilson',
  email: 'doctor@smartcare.com',
  role: 'doctor',
  phone: '+1 (555) 987-6543',
  specialization: 'Cardiology',
  qualifications: 'MD, FACC',
  consultationFee: 150,
  bio: 'Board-certified cardiologist with over 15 years of experience in treating heart conditions.',
  avatar: 'https://i.pravatar.cc/150?u=u2'
},
{
  id: 'u3',
  name: 'Mike Chen',
  email: 'pharmacist@smartcare.com',
  role: 'pharmacist',
  phone: '+1 (555) 456-7890',
  avatar: 'https://i.pravatar.cc/150?u=u3'
}];


export const mockDoctors= [
mockUsers[1],
{
  id: 'd2',
  name: 'Dr. Emily Chen',
  email: 'emily@smartcare.com',
  role: 'doctor',
  specialization: 'Dermatology',
  rating: 4.9,
  consultationFee: 120,
  avatar: 'https://i.pravatar.cc/150?u=d2'
},
{
  id: 'd3',
  name: 'Dr. Michael Brown',
  email: 'michael@smartcare.com',
  role: 'doctor',
  specialization: 'Orthopedics',
  rating: 4.7,
  consultationFee: 180,
  avatar: 'https://i.pravatar.cc/150?u=d3'
},
{
  id: 'd4',
  name: 'Dr. Sarah Davis',
  email: 'sarah@smartcare.com',
  role: 'doctor',
  specialization: 'General',
  rating: 4.8,
  consultationFee: 80,
  avatar: 'https://i.pravatar.cc/150?u=d4'
},
{
  id: 'd5',
  name: 'Dr. Robert Taylor',
  email: 'robert@smartcare.com',
  role: 'doctor',
  specialization: 'Neurology',
  rating: 4.9,
  consultationFee: 200,
  avatar: 'https://i.pravatar.cc/150?u=d5'
},
{
  id: 'd6',
  name: 'Dr. Lisa Anderson',
  email: 'lisa@smartcare.com',
  role: 'doctor',
  specialization: 'Pediatrics',
  rating: 4.9,
  consultationFee: 110,
  avatar: 'https://i.pravatar.cc/150?u=d6'
},
{
  id: 'd7',
  name: 'Dr. William Martinez',
  email: 'william@smartcare.com',
  role: 'doctor',
  specialization: 'ENT',
  rating: 4.6,
  consultationFee: 130,
  avatar: 'https://i.pravatar.cc/150?u=d7'
},
{
  id: 'd8',
  name: 'Dr. Jessica White',
  email: 'jessica@smartcare.com',
  role: 'doctor',
  specialization: 'Gynecology',
  rating: 4.8,
  consultationFee: 160,
  avatar: 'https://i.pravatar.cc/150?u=d8'
}];


// Helper to generate relative dates
const getRelativeDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const mockAppointments= [
{
  id: 'a1',
  patientId: 'u1',
  doctorId: 'u2',
  date: getRelativeDate(0),
  time: '10:00 AM',
  status: 'confirmed',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
{
  id: 'a2',
  patientId: 'u1',
  doctorId: 'd4',
  date: getRelativeDate(-15),
  time: '02:30 PM',
  status: 'completed',
  fee: 80,
  doctorName: 'Dr. Sarah Davis',
  doctorSpecialization: 'General',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
{
  id: 'a3',
  patientId: 'u1',
  doctorId: 'd2',
  date: getRelativeDate(3),
  time: '11:15 AM',
  status: 'pending',
  fee: 120,
  doctorName: 'Dr. Emily Chen',
  doctorSpecialization: 'Dermatology',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
{
  id: 'a4',
  patientId: 'u1',
  doctorId: 'd6',
  date: getRelativeDate(-45),
  time: '09:00 AM',
  status: 'completed',
  fee: 110,
  doctorName: 'Dr. Lisa Anderson',
  doctorSpecialization: 'Pediatrics',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
{
  id: 'a5',
  patientId: 'u1',
  doctorId: 'd3',
  date: getRelativeDate(10),
  time: '03:45 PM',
  status: 'confirmed',
  fee: 180,
  doctorName: 'Dr. Michael Brown',
  doctorSpecialization: 'Orthopedics',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
{
  id: 'a6',
  patientId: 'u1',
  doctorId: 'd7',
  date: getRelativeDate(-5),
  time: '01:00 PM',
  status: 'cancelled',
  fee: 130,
  doctorName: 'Dr. William Martinez',
  doctorSpecialization: 'ENT',
  patientName: 'Sarah Johnson',
  patientAge: 32
},
// Additional appointments for doctor view
{
  id: 'a7',
  patientId: 'p2',
  doctorId: 'u2',
  date: getRelativeDate(0),
  time: '11:30 AM',
  status: 'confirmed',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Michael Scott',
  patientAge: 45
},
{
  id: 'a8',
  patientId: 'p3',
  doctorId: 'u2',
  date: getRelativeDate(0),
  time: '02:00 PM',
  status: 'pending',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Pam Beesly',
  patientAge: 29
},
{
  id: 'a9',
  patientId: 'p4',
  doctorId: 'u2',
  date: getRelativeDate(1),
  time: '09:00 AM',
  status: 'confirmed',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Jim Halpert',
  patientAge: 34
},
{
  id: 'a10',
  patientId: 'p5',
  doctorId: 'u2',
  date: getRelativeDate(-1),
  time: '10:30 AM',
  status: 'completed',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Dwight Schrute',
  patientAge: 38
},
{
  id: 'a11',
  patientId: 'p6',
  doctorId: 'u2',
  date: getRelativeDate(2),
  time: '01:15 PM',
  status: 'confirmed',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Angela Martin',
  patientAge: 35
},
{
  id: 'a12',
  patientId: 'p7',
  doctorId: 'u2',
  date: getRelativeDate(2),
  time: '03:30 PM',
  status: 'cancelled',
  fee: 150,
  doctorName: 'Dr. James Wilson',
  doctorSpecialization: 'Cardiology',
  patientName: 'Kevin Malone',
  patientAge: 42
}];


export const mockMedicines= [
{
  id: 'm1',
  name: 'Amoxicillin 500mg',
  category: 'Antibiotic',
  stockQty: 450,
  unitPrice: 12.5,
  expiryDate: '2025-12-01',
  supplier: 'PharmaCorp',
  status: 'in_stock'
},
{
  id: 'm2',
  name: 'Lisinopril 10mg',
  category: 'Blood Pressure',
  stockQty: 20,
  unitPrice: 8.0,
  expiryDate: '2024-06-15',
  supplier: 'MediSupply',
  status: 'low_stock'
},
{
  id: 'm3',
  name: 'Metformin 500mg',
  category: 'Diabetes',
  stockQty: 0,
  unitPrice: 5.5,
  expiryDate: '2025-01-20',
  supplier: 'HealthInc',
  status: 'out_of_stock'
},
{
  id: 'm4',
  name: 'Ibuprofen 400mg',
  category: 'Painkiller',
  stockQty: 800,
  unitPrice: 4.0,
  expiryDate: '2026-03-10',
  supplier: 'PharmaCorp',
  status: 'in_stock'
},
{
  id: 'm5',
  name: 'Omeprazole 20mg',
  category: 'Antacid',
  stockQty: 150,
  unitPrice: 15.0,
  expiryDate: '2023-11-30',
  supplier: 'MediSupply',
  status: 'expiring_soon'
},
{
  id: 'm6',
  name: 'Atorvastatin 40mg',
  category: 'Cholesterol',
  stockQty: 320,
  unitPrice: 18.5,
  expiryDate: '2025-08-22',
  supplier: 'HealthInc',
  status: 'in_stock'
},
{
  id: 'm7',
  name: 'Amlodipine 5mg',
  category: 'Blood Pressure',
  stockQty: 45,
  unitPrice: 6.2,
  expiryDate: '2024-10-05',
  supplier: 'PharmaCorp',
  status: 'low_stock'
},
{
  id: 'm8',
  name: 'Albuterol Inhaler',
  category: 'Asthma',
  stockQty: 120,
  unitPrice: 45.0,
  expiryDate: '2026-01-15',
  supplier: 'MediSupply',
  status: 'in_stock'
},
{
  id: 'm9',
  name: 'Gabapentin 300mg',
  category: 'Nerve Pain',
  stockQty: 500,
  unitPrice: 14.0,
  expiryDate: '2025-05-30',
  supplier: 'HealthInc',
  status: 'in_stock'
},
{
  id: 'm10',
  name: 'Sertraline 50mg',
  category: 'Antidepressant',
  stockQty: 210,
  unitPrice: 11.5,
  expiryDate: '2024-12-10',
  supplier: 'PharmaCorp',
  status: 'in_stock'
},
{
  id: 'm11',
  name: 'Azithromycin 250mg',
  category: 'Antibiotic',
  stockQty: 0,
  unitPrice: 22.0,
  expiryDate: '2024-02-28',
  supplier: 'MediSupply',
  status: 'out_of_stock'
},
{
  id: 'm12',
  name: 'Fluticasone Nasal Spray',
  category: 'Allergy',
  stockQty: 85,
  unitPrice: 16.8,
  expiryDate: '2023-12-15',
  supplier: 'HealthInc',
  status: 'expiring_soon'
},
{
  id: 'm13',
  name: 'Losartan 50mg',
  category: 'Blood Pressure',
  stockQty: 410,
  unitPrice: 9.5,
  expiryDate: '2025-11-20',
  supplier: 'PharmaCorp',
  status: 'in_stock'
},
{
  id: 'm14',
  name: 'Pantoprazole 40mg',
  category: 'Antacid',
  stockQty: 280,
  unitPrice: 13.2,
  expiryDate: '2026-04-05',
  supplier: 'MediSupply',
  status: 'in_stock'
},
{
  id: 'm15',
  name: 'Meloxicam 15mg',
  category: 'Anti-inflammatory',
  stockQty: 15,
  unitPrice: 7.8,
  expiryDate: '2024-09-12',
  supplier: 'HealthInc',
  status: 'low_stock'
}];


export const mockPrescriptions= [
{
  id: 'p1',
  appointmentId: 'a2',
  patientId: 'u1',
  doctorId: 'd4',
  patientName: 'Sarah Johnson',
  doctorName: 'Dr. Sarah Davis',
  date: getRelativeDate(-15),
  status: 'dispensed',
  medicines: [
  {
    medicineId: 'm1',
    name: 'Amoxicillin 500mg',
    dosage: '1 pill',
    frequency: 'Twice daily',
    duration: '7 days',
    notes: 'Take after meals'
  },
  {
    medicineId: 'm4',
    name: 'Ibuprofen 400mg',
    dosage: '1 pill',
    frequency: 'As needed',
    duration: '5 days',
    notes: 'For pain'
  }]

},
{
  id: 'p2',
  appointmentId: 'a1',
  patientId: 'u1',
  doctorId: 'u2',
  patientName: 'Sarah Johnson',
  doctorName: 'Dr. James Wilson',
  date: getRelativeDate(0),
  status: 'pending',
  medicines: [
  {
    medicineId: 'm6',
    name: 'Atorvastatin 40mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '30 days',
    notes: 'Take at bedtime'
  }]

},
{
  id: 'p3',
  appointmentId: 'a10',
  patientId: 'p5',
  doctorId: 'u2',
  patientName: 'Dwight Schrute',
  doctorName: 'Dr. James Wilson',
  date: getRelativeDate(-1),
  status: 'processing',
  medicines: [
  {
    medicineId: 'm2',
    name: 'Lisinopril 10mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '90 days',
    notes: 'Take in the morning'
  },
  {
    medicineId: 'm7',
    name: 'Amlodipine 5mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '90 days',
    notes: ''
  }]

},
{
  id: 'p4',
  appointmentId: 'a4',
  patientId: 'u1',
  doctorId: 'd6',
  patientName: 'Sarah Johnson',
  doctorName: 'Dr. Lisa Anderson',
  date: getRelativeDate(-45),
  status: 'dispensed',
  medicines: [
  {
    medicineId: 'm11',
    name: 'Azithromycin 250mg',
    dosage: '2 pills day 1, 1 pill days 2-5',
    frequency: 'Once daily',
    duration: '5 days',
    notes: 'Complete full course'
  }]

},
{
  id: 'p5',
  appointmentId: 'a13',
  patientId: 'p8',
  doctorId: 'd2',
  patientName: 'Stanley Hudson',
  doctorName: 'Dr. Emily Chen',
  date: getRelativeDate(0),
  status: 'pending',
  medicines: [
  {
    medicineId: 'm12',
    name: 'Fluticasone Nasal Spray',
    dosage: '2 sprays per nostril',
    frequency: 'Once daily',
    duration: '30 days',
    notes: 'Shake well before use'
  }]

}];


export const mockConsultations= [
{
  id: 'c1',
  appointmentId: 'a2',
  patientId: 'u1',
  doctorId: 'd4',
  doctorName: 'Dr. Sarah Davis',
  date: getRelativeDate(-15),
  diagnosis: 'Mild respiratory infection',
  notes:
  'Patient presented with mild cough and sore throat for 3 days. No fever. Lungs clear to auscultation. Prescribed antibiotics and pain relievers.',
  prescriptionId: 'p1',
  medicines: [
  {
    medicineId: 'm1',
    name: 'Amoxicillin 500mg',
    dosage: '1 pill',
    frequency: 'Twice daily',
    duration: '7 days'
  },
  {
    medicineId: 'm4',
    name: 'Ibuprofen 400mg',
    dosage: '1 pill',
    frequency: 'As needed',
    duration: '5 days'
  }]

},
{
  id: 'c2',
  appointmentId: 'a4',
  patientId: 'u1',
  doctorId: 'd6',
  doctorName: 'Dr. Lisa Anderson',
  date: getRelativeDate(-45),
  diagnosis: 'Sinusitis',
  notes:
  'Patient reports facial pain, nasal congestion, and headache for 1 week. Diagnosed with acute sinusitis. Prescribed Z-Pak.',
  prescriptionId: 'p4',
  medicines: [
  {
    medicineId: 'm11',
    name: 'Azithromycin 250mg',
    dosage: '2 pills day 1, 1 pill days 2-5',
    frequency: 'Once daily',
    duration: '5 days'
  }]

},
{
  id: 'c3',
  appointmentId: 'a10',
  patientId: 'p5',
  doctorId: 'u2',
  doctorName: 'Dr. James Wilson',
  date: getRelativeDate(-1),
  diagnosis: 'Hypertension',
  notes:
  'BP 150/95. Patient reports occasional headaches. Discussed lifestyle modifications (diet, exercise). Starting on dual therapy for better BP control.',
  prescriptionId: 'p3',
  medicines: [
  {
    medicineId: 'm2',
    name: 'Lisinopril 10mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '90 days'
  },
  {
    medicineId: 'm7',
    name: 'Amlodipine 5mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '90 days'
  }]

},
{
  id: 'c4',
  appointmentId: 'a14',
  patientId: 'u1',
  doctorId: 'd3',
  doctorName: 'Dr. Michael Brown',
  date: getRelativeDate(-120),
  diagnosis: 'Sprained Ankle',
  notes:
  'Patient twisted right ankle while jogging. Swelling and tenderness over lateral malleolus. X-ray negative for fracture. Advised RICE protocol and prescribed NSAIDs.',
  medicines: [
  {
    medicineId: 'm15',
    name: 'Meloxicam 15mg',
    dosage: '1 pill',
    frequency: 'Once daily',
    duration: '14 days'
  }]

},
{
  id: 'c5',
  appointmentId: 'a15',
  patientId: 'u1',
  doctorId: 'u2',
  doctorName: 'Dr. James Wilson',
  date: getRelativeDate(-180),
  diagnosis: 'Routine Checkup',
  notes:
  'Annual physical. All vitals normal. EKG shows normal sinus rhythm. Ordered routine blood work. Patient is in good health.'
}];


export const mockNotifications= [
{
  id: 'n1',
  userId: 'u1',
  title: 'Appointment Confirmed',
  message:
  'Your appointment with Dr. Wilson is confirmed for today at 10:00 AM.',
  timestamp: '2 hours ago',
  isRead: false,
  type: 'appointment'
},
{
  id: 'n2',
  userId: 'u1',
  title: 'Prescription Ready',
  message:
  'Your prescription for Amoxicillin is ready for pickup at the pharmacy.',
  timestamp: '1 day ago',
  isRead: true,
  type: 'prescription'
},
{
  id: 'n3',
  userId: 'u1',
  title: 'Lab Results Available',
  message:
  'Your recent blood work results are now available in your medical history.',
  timestamp: '3 days ago',
  isRead: true,
  type: 'system'
},
{
  id: 'n4',
  userId: 'u1',
  title: 'Appointment Reminder',
  message:
  'Reminder: You have an upcoming appointment with Dr. Chen tomorrow at 11:15 AM.',
  timestamp: '5 hours ago',
  isRead: false,
  type: 'appointment'
},
{
  id: 'n5',
  userId: 'u1',
  title: 'Payment Successful',
  message:
  'Your payment of $150 for consultation with Dr. Wilson was successful.',
  timestamp: '1 hour ago',
  isRead: false,
  type: 'system'
},

{
  id: 'n6',
  userId: 'u2',
  title: 'New Appointment',
  message: 'Sarah Johnson booked an appointment for today at 10:00 AM.',
  timestamp: '1 day ago',
  isRead: true,
  type: 'appointment'
},
{
  id: 'n7',
  userId: 'u2',
  title: 'Cancellation',
  message: 'Kevin Malone cancelled their appointment for Oct 18 at 3:30 PM.',
  timestamp: '4 hours ago',
  isRead: false,
  type: 'appointment'
},
{
  id: 'n8',
  userId: 'u2',
  title: 'Schedule Update',
  message: 'Your availability for next week has been successfully updated.',
  timestamp: '2 days ago',
  isRead: true,
  type: 'system'
},
{
  id: 'n9',
  userId: 'u2',
  title: 'New Patient Message',
  message:
  'Dwight Schrute sent a message regarding their recent prescription.',
  timestamp: '30 mins ago',
  isRead: false,
  type: 'system'
},
{
  id: 'n10',
  userId: 'u2',
  title: 'Lab Results Received',
  message: 'Lab results for Jim Halpert have been uploaded.',
  timestamp: '1 hour ago',
  isRead: false,
  type: 'system'
},

{
  id: 'n11',
  userId: 'u3',
  title: 'New Prescription',
  message: 'New prescription received for Sarah Johnson from Dr. Wilson.',
  timestamp: '5 mins ago',
  isRead: false,
  type: 'prescription'
},
{
  id: 'n12',
  userId: 'u3',
  title: 'Low Stock Alert',
  message: 'Lisinopril 10mg is running low (20 units remaining).',
  timestamp: '2 hours ago',
  isRead: false,
  type: 'system'
},
{
  id: 'n13',
  userId: 'u3',
  title: 'Out of Stock',
  message: 'Metformin 500mg is currently out of stock. Please reorder.',
  timestamp: '1 day ago',
  isRead: true,
  type: 'system'
},
{
  id: 'n14',
  userId: 'u3',
  title: 'Expiring Inventory',
  message: 'Omeprazole 20mg batch is expiring in less than 30 days.',
  timestamp: '3 days ago',
  isRead: true,
  type: 'system'
},
{
  id: 'n15',
  userId: 'u3',
  title: 'Prescription Dispensed',
  message: 'Prescription #p4 for Sarah Johnson has been marked as dispensed.',
  timestamp: '4 hours ago',
  isRead: true,
  type: 'prescription'
}];


export const mockTimeSlots= [
{
  id: 'ts1',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '09:00 AM',
  endTime: '09:30 AM',
  isBooked: false
},
{
  id: 'ts2',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '09:30 AM',
  endTime: '10:00 AM',
  isBooked: false
},
{
  id: 'ts3',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '10:00 AM',
  endTime: '10:30 AM',
  isBooked: true
},
{
  id: 'ts4',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '11:00 AM',
  endTime: '11:30 AM',
  isBooked: false
},
{
  id: 'ts5',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '11:30 AM',
  endTime: '12:00 PM',
  isBooked: true
},
{
  id: 'ts6',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '01:00 PM',
  endTime: '01:30 PM',
  isBooked: false
},
{
  id: 'ts7',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '01:30 PM',
  endTime: '02:00 PM',
  isBooked: false
},
{
  id: 'ts8',
  doctorId: 'u2',
  date: getRelativeDate(0),
  startTime: '02:00 PM',
  endTime: '02:30 PM',
  isBooked: true
},

{
  id: 'ts9',
  doctorId: 'd2',
  date: getRelativeDate(3),
  startTime: '09:00 AM',
  endTime: '09:30 AM',
  isBooked: false
},
{
  id: 'ts10',
  doctorId: 'd2',
  date: getRelativeDate(3),
  startTime: '10:00 AM',
  endTime: '10:30 AM',
  isBooked: false
},
{
  id: 'ts11',
  doctorId: 'd2',
  date: getRelativeDate(3),
  startTime: '11:15 AM',
  endTime: '11:45 AM',
  isBooked: true
},
{
  id: 'ts12',
  doctorId: 'd2',
  date: getRelativeDate(3),
  startTime: '02:00 PM',
  endTime: '02:30 PM',
  isBooked: false
}];
