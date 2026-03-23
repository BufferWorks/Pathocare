import mongoose, { Schema, model, models } from "mongoose";

// Center Model
const CenterSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    logo: { type: String }, // Base64 or URL
    tagline: { type: String },
    headerText: { type: String },
    footerText: { type: String },
    website: { type: String },
    showHeader: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true },
    signatories: [{
        name: { type: String },
        designation: { type: String }
    }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    subscriptionAmount: { type: Number, default: 0 },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    labId: { type: String, unique: true, sparse: true },
    apiKey: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
});

if (models.Center) {
    delete (models as any).Center;
}
export const Center = model("Center", CenterSchema);

// User Model
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["SUPER_ADMIN", "CENTER_ADMIN", "STAFF"],
        default: "STAFF"
    },
    centerId: { type: Schema.Types.ObjectId, ref: "Center" },
    createdAt: { type: Date, default: Date.now },
});

if (models.User) delete (models as any).User;
export const User = model("User", UserSchema);

// Doctor Model (Supporting DoctorMaster.html)
const DoctorSchema = new Schema({
    name: { type: String, required: true },
    specialization: { type: String },
    phone: { type: String },
    email: { type: String },
    centerId: { type: Schema.Types.ObjectId, ref: "Center" }, // Branch specific
    createdAt: { type: Date, default: Date.now },
});

if (models.Doctor) delete (models as any).Doctor;
export const Doctor = model("Doctor", DoctorSchema);

// Outsource Lab Model (Supporting outsourcelabs.html)
const OutsourceLabSchema = new Schema({
    name: { type: String, required: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    centerId: { type: Schema.Types.ObjectId, ref: "Center" },
    createdAt: { type: Date, default: Date.now },
});

if (models.OutsourceLab) delete (models as any).OutsourceLab;
export const OutsourceLab = model("OutsourceLab", OutsourceLabSchema);

// Panel Model (Corporate/TPA tie-ups)
const PanelSchema = new Schema({
    name: { type: String, required: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center" },
    createdAt: { type: Date, default: Date.now },
});

if (models.Panel) delete (models as any).Panel;
export const Panel = model("Panel", PanelSchema);

// Parameter Master (Global for consistency)
const ParameterSchema = new Schema({
    name: { type: String, required: true },
    unit: { type: String },
    normalRange: { type: String },
    centerId: { type: Schema.Types.ObjectId, ref: "Center" },
    createdAt: { type: Date, default: Date.now },
});

if (models.Parameter) delete (models as any).Parameter;
export const Parameter = model("Parameter", ParameterSchema);

// Test Model (Group of Parameters)
const TestSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    price: { type: Number }, // Now optional for Global Templates
    centerId: { type: Schema.Types.ObjectId, ref: "Center" }, // Now optional for Global Templates
    isGlobal: { type: Boolean, default: false },
    parameters: [{
        name: { type: String, required: true },
        unit: { type: String },
        normalRange: { type: String },
    }],
    method: { type: String }, // e.g., Slide Agglutination, ELISA, etc.
    interpretation: { type: String }, // Detailed clinical note template
    tags: [String], // Synonyms: cbc, lft, liver, heart, etc.
    createdAt: { type: Date, default: Date.now },
});

if (models.Test) delete (models as any).Test;
export const Test = model("Test", TestSchema);

// Package/Profile Model (Group of Tests)
const PackageSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number }, // Now optional for Global Templates
    tests: [{ type: Schema.Types.ObjectId, ref: "Test" }],
    centerId: { type: Schema.Types.ObjectId, ref: "Center" }, // Now optional for Global Templates
    isGlobal: { type: Boolean, default: false },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
});

if (models.Package) delete (models as any).Package;
export const Package = model("Package", PackageSchema);

// Booking Model
const BookingSchema = new Schema({
    barcode: { type: String, unique: true, sparse: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    phone: { type: String, required: true },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    panelId: { type: Schema.Types.ObjectId, ref: "Panel" },
    referralName: { type: String },
    tests: [{ type: Schema.Types.ObjectId, ref: "Test" }],
    packages: [{ type: Schema.Types.ObjectId, ref: "Package" }],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    refund: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ["Fully Paid", "Due", "Refund"],
        default: "Due"
    },
    paymentMode: {
        type: String,
        enum: ["Cash", "Cheque", "Card", "Online", "UPI", "None"],
        default: "None"
    },
    isUrgent: { type: Boolean, default: false },
    deliveryMode: {
        type: String,
        enum: ["None", "Delivery Boy", "Email", "Hospital", "Courier", "Self", "Logistics", "Portal"],
        default: "Self"
    },
    isChecked: { type: Boolean, default: false }, // Technical validation
    isPublished: { type: Boolean, default: false }, // Live for patient/doctor
    isDelivered: { type: Boolean, default: false }, // Physical delivery
    status: {
        type: String,
        enum: ["Pending", "Collected", "Process", "Completed", "Cancelled"],
        default: "Pending"
    },
    sampleType: { type: String }, // e.g., Serum, Whole Blood
    clientCode: { type: String }, // Institutional routing code
    sampleDrawnAt: { type: Date },
    registeredAt: { type: Date, default: Date.now },
    collectedAt: { type: Date },
    reportedAt: { type: Date },
    bookingDate: { type: Date, default: Date.now },
}, { timestamps: true });

if (models.Booking) delete (models as any).Booking;
export const Booking = model("Booking", BookingSchema);

// Report Model
const ReportSchema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    results: [{
        testId: { type: Schema.Types.ObjectId, ref: "Test" },
        method: { type: String },
        interpretation: { type: String },
        parameterResults: [{
            name: { type: String },
            value: { type: String },
            unit: { type: String },
            normalRange: { type: String },
            status: { type: String } // e.g., Normal, High, Low
        }]
    }],
    shareToken: { type: String, unique: true, sparse: true },
    shareExpiresAt: { type: Date },
    status: { type: String, enum: ["Pending", "Draft", "Finalized"], default: "Pending" },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

if (models.Report) delete (models as any).Report;
export const Report = model("Report", ReportSchema);

// Audit Log Model for Accountability & Compliance
const AuditLogSchema = new Schema({
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "PATIENT_REGISTRATION", "RESULT_ENTRY", "RESULT_CORRECTION", "INVOICE_GENERATION"
    targetId: { type: Schema.Types.ObjectId, required: true }, // The ID of the booking/report/etc.
    targetModel: { type: String, required: true }, // e.g., "Booking", "Report"
    details: { type: Schema.Types.Mixed }, // JSON for old_value/new_value or description
    timestamp: { type: Date, default: Date.now }
});

if (models.AuditLog) delete (models as any).AuditLog;
export const AuditLog = model("AuditLog", AuditLogSchema);

// Subscription Payment Model (Center to Super Admin)
const SubscriptionPaymentSchema = new Schema({
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
    amount: { type: Number, required: true },
    plan: { type: String, enum: ["Monthly", "Yearly", "Custom"], default: "Yearly" },
    method: { type: String, enum: ["Cash", "Online", "Bank Transfer"], default: "Online" },
    expiryDate: { type: Date, required: true },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now }
});

if (models.SubscriptionPayment) delete (models as any).SubscriptionPayment;
export const SubscriptionPayment = model("SubscriptionPayment", SubscriptionPaymentSchema);

// Notification Model
const NotificationSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, default: "info" }, // info, warning, success, error
    icon: { type: String }, // lucide icon name
    centerId: { type: Schema.Types.ObjectId, ref: "Center" }, // Null for Global (Super Admin)
    isRead: { type: Boolean, default: false },
    recipientRole: { type: String }, // Optional: "SUPER_ADMIN", "CENTER_ADMIN"
    createdAt: { type: Date, default: Date.now }
});

if (models.Notification) delete (models as any).Notification;
export const Notification = model("Notification", NotificationSchema);

// Machine Model (Hardware Node)
const MachineSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    protocol: { type: String, default: "HL7 v2.x" },
    port: { type: String },
    centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true },
    isPaused: { type: Boolean, default: false },
    secretKey: { type: String, unique: true }, // Unique key for data ingestion authentication
    health: { type: Number, default: 100 },
    lastSync: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false }, // Real-time relay heartbeat
    machineIP: { type: String }, // Physical address of the connected instrument
    relayIP: { type: String }, // IP address of the relay bridge computer
    relayPort: { type: Number, default: 5600 }, // TCP Port of the relay
    terminalLogs: [String], // Forensic Terminal Buffer
    connectionMode: { type: String, enum: ["SERIAL", "NETWORK"], default: "SERIAL" },
    config: { type: Schema.Types.Mixed }, // Port configs, mappings, etc.
}, { timestamps: true });

if (models.Machine) delete (models as any).Machine;
export const Machine = model("Machine", MachineSchema);
