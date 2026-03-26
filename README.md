# SmartCare

SmartCare is a hospital management system project. This repository currently contains the backend foundation for handling authentication, user roles, and module-based hospital operations.

## Project Overview

The system is organized around major hospital modules. Each module has specific users and responsibilities.

## 1. User Management Module

This module controls system access and user accounts.

### Users
- Admin - Creates and manages all user accounts
- Doctor - Can manage their own profile
- Patient - Can register and update their profile
- Nurse / Staff - Can update their own profile

### Main Responsibility

Admin controls the entire user system.

## 2. Appointment and Booking Management Module

This module handles appointment scheduling between patients and doctors.

### Users
- Patient - Book, reschedule, and cancel appointments
- Doctor - View scheduled appointments and manage availability
- Receptionist / Staff - Help patients schedule appointments
- Admin - Monitor appointment records

## 3. Patient Medical Record Management Module

This module manages patient health data and treatment history.

### Users
- Doctor - Create and update patient medical records
- Nurse - View and assist with patient records
- Patient - View their own medical history
- Admin - Access records for management purposes

### Important Rule

Only doctors can add diagnoses and prescriptions.

## 4. Billing and Payment Management Module

This module manages hospital financial operations.

### Users
- Receptionist / Billing Staff - Generate invoices and manage payments
- Patient - View and pay bills
- Admin - Monitor financial reports

## 5. Hospital Administration Module

This module controls overall hospital system operations.

### Users
- Admin - Full control of the system
- System Administrator - Manage system settings and permissions
- Hospital Manager - View reports and monitor operations

## 6. Pharmacy and Medicine Management Module

This module handles medicine inventory and prescription processing.

### Users
- Pharmacist - Manage medicine stock and dispense medicines
- Doctor - Write prescriptions
- Patient - Receive medicines
- Admin - Monitor pharmacy inventory

## Summary Table

| Module | Users |
| --- | --- |
| User Management | Admin, Doctor, Patient, Staff |
| Appointment Management | Patient, Doctor, Receptionist, Admin |
| Medical Records | Doctor, Nurse, Patient, Admin |
| Billing and Payment | Billing Staff, Patient, Admin |
| Hospital Administration | Admin, System Admin, Hospital Manager |
| Pharmacy Management | Pharmacist, Doctor, Patient, Admin |

## Current Backend Scope

The backend in this repository is currently structured with:

- Express.js for the API layer
- MongoDB with Mongoose for data storage
- JWT authentication for protected access
- Role-based access control for different hospital users

## Goal

The goal of SmartCare is to provide a centralized hospital management system where different users can securely access the features relevant to their role.
