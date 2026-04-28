import { GoogleGenAI } from '@google/genai';
import Appointment from '../models/appointment.model.js';

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCBBxP_eRX46oXVFNyWPGah83Nrm5EX-gE";
const ai = new GoogleGenAI({ apiKey: apiKey });

export const predictWaitTime = async (req, res) => {
  try {
    const { numberOfPatients, doctorAvailability, timeSlots } = req.body;

    if (numberOfPatients === undefined || doctorAvailability === undefined || timeSlots === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide numberOfPatients, doctorAvailability, and timeSlots."
      });
    }

    // Fetch historical appointment data
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });

    const prompt = `
      You are an AI assistant in a healthcare system responsible for predicting patient waiting times.
      Based on the following parameters and historical data, predict the average patient waiting time in minutes.
      
      Current Parameters:
      - Number of patients currently waiting: ${numberOfPatients}
      - Number of doctors available: ${doctorAvailability}
      - Total time slots available (in minutes): ${timeSlots}

      Historical Data Context:
      - Total past appointments recorded: ${totalAppointments}
      - Historically completed appointments: ${completedAppointments}
      - Historically pending/delayed appointments: ${pendingAppointments}

      Analyze both the current load and historical patterns. For example, if there are many historical pending appointments, it might indicate a slower processing rate, thus higher waiting time. 
      Please output ONLY the predicted waiting time as a single number (in minutes). Do not provide any additional explanation.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const predictedTime = parseInt(response.text.trim(), 10);

    return res.status(200).json({
      success: true,
      data: {
        predictedWaitTimeMinutes: isNaN(predictedTime) ? 30 : predictedTime,
        historicalStats: {
          total: totalAppointments,
          completed: completedAppointments,
          pending: pendingAppointments
        }
      }
    });
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to predict patient waiting time.",
      error: error.message
    });
  }
};
