import { pool } from "./src/config/db.js";
import Appointment from "./src/models/appointment.model.js";

async function seedData() {
  try {
    console.log("Adding mock appointments...");

    // Create some historical appointments
    const statuses = ['completed', 'pending', 'cancelled'];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00'];
    
    for (let i = 0; i < 50; i++) {
      const isHistorical = i < 40; // 40 past appointments, 10 future/pending
      
      const date = new Date();
      if (isHistorical) {
        date.setDate(date.getDate() - Math.floor(Math.random() * 30) - 1); // past 30 days
      } else {
        date.setDate(date.getDate() + Math.floor(Math.random() * 7)); // next 7 days
      }

      await Appointment.create({
        patient: "mock_patient_id_" + Math.floor(Math.random() * 10),
        doctor: "mock_doctor_id_1",
        date: date.toISOString().split('T')[0],
        time: times[Math.floor(Math.random() * times.length)],
        status: isHistorical ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)],
        reason: "Routine checkup",
        notes: "Historical AI seed data"
      });
    }

    console.log("Mock data seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
