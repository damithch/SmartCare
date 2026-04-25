# SmartCare PostgreSQL Migration

This document tracks the staged migration from MongoDB/Mongoose to PostgreSQL/Prisma.

## Current state

The application still runs on MongoDB. The PostgreSQL files added in this slice are scaffolding only:

- `prisma/schema.prisma`
- `src/config/prisma.js`
- `.env.example` with `DATABASE_URL`

No runtime service has been switched yet.

## First migrated domain

The first relational slice is:

- `users`
- `doctor_availability`
- `appointments`

These were chosen because:

- they are central to auth and booking
- their relationships are straightforward
- they do not depend on the more deeply embedded Mongo subdocuments used in billing, lab, and staff

## Prisma model mapping

### `User`

Source model:
- `src/models/user.model.js`

Relational notes:
- Mongo `_id` becomes UUID `id`
- `password` becomes `password_hash`
- role stays as an enum
- doctor/patient appointment relations are split into named relations

### `DoctorAvailability`

Source model:
- `src/models/doctorAvailability.model.js`

Relational notes:
- `doctor` becomes FK `doctor_id`
- `date` should be stored as a `DATE`, not a string
- unique composite constraint is preserved on `(doctor_id, date, start_time)`

### `Appointment`

Source model:
- `src/models/appointment.model.js`

Relational notes:
- `patient`, `doctor`, and `availabilitySlot` become foreign keys
- status and payment status become enums
- `paymentIntentId` remains nullable unique

## Module-by-module migration checklist

### Phase 1: foundation

1. Install `prisma` and `@prisma/client`
2. Run `npx prisma generate`
3. Create the first migration from `prisma/schema.prisma`
4. Add a shared UUID Joi validator
5. Replace Mongo-only route param validators in:
   - `src/validators/appointment.validation.js`
   - `src/validators/user.validation.js`
   - `src/validators/doctorAvailability.validation.js` where applicable

### Phase 2: users + auth

Files to migrate:
- `src/models/user.model.js`
- `src/services/user.service.js`
- `src/services/auth.service.js`
- `src/middlewares/auth.middleware.js`

Tasks:
1. Replace Mongoose user reads/writes with Prisma
2. Move password hashing out of Mongoose hooks and into service/repository code
3. Update JWT payload generation to use UUID `id`
4. Update auth middleware user lookup from Mongoose to Prisma

### Phase 3: doctor availability

Files to migrate:
- `src/models/doctorAvailability.model.js`
- `src/services/doctorAvailability.service.js`

Tasks:
1. Replace model operations with Prisma queries
2. Change date handling from string-based values to SQL `DATE`
3. Preserve capacity logic for `maxPatients`, `bookedCount`, and `isBooked`

### Phase 4: appointments

Files to migrate:
- `src/models/appointment.model.js`
- `src/services/appointment.service.js`
- `src/controllers/appointment.controller.js`

Tasks:
1. Replace `populate` usage with Prisma `include/select`
2. Replace duplicate-slot checks with relational queries
3. Keep Stripe flow unchanged while swapping persistence logic
4. Use transactions when booking a slot and incrementing slot capacity

## Known hard areas after the first slice

These modules should be migrated later because they depend on embedded arrays or Mongo-only patterns:

- `medicalRecord.model.js`
  - embedded `diagnoses`
  - embedded `prescriptions`
- `bill.model.js`
  - embedded `billItems`
  - dynamic `refPath`
  - pre-save bill number generation
- `payment.model.js`
  - embedded `receipt`
  - generated transaction reference
- `lab.model.js`
  - embedded request items
  - embedded result attachments
- `staff.model.js`
  - embedded credentials
  - embedded qualifications
  - embedded patient ratings

## Suggested next implementation step

Make the first runnable migration slice:

1. install Prisma packages
2. generate the Prisma client
3. add a shared UUID validator utility
4. migrate `user.service.js`
5. migrate `auth.service.js`
6. migrate `doctorAvailability.service.js`
7. migrate `appointment.service.js`

Only after those services are switched should `config/db.js` and server startup stop depending on MongoDB.
