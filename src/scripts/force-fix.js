const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define Schemas locally to avoid import issues
const CenterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    expiryDate: { type: Date }
});

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String },
    centerId: { type: mongoose.Schema.Types.ObjectId }
});

const NotificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, default: "info" },
    icon: { type: String },
    centerId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
    recipientRole: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Center = mongoose.models.Center || mongoose.model("Center", CenterSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

async function fix() {
    try {
        await mongoose.connect("mongodb+srv://abhinav2003singh16_db_user:IPA5D3H0PKyMSIVG@pathology.gihxkmm.mongodb.net/pathocore?appName=pathology");
        console.log("Connected to MongoDB Matrix");

        // 1. Force Activate ALL Centers & Reset Expiry
        const centerResult = await Center.updateMany({}, {
            isActive: true,
            expiryDate: new Date("2032-01-01"), // Valid for 6 more years
            subscriptionAmount: 9999
        });
        console.log(`Centers Calibrated: ${centerResult.modifiedCount} nodes activated.`);

        // 2. Calibrate Super Admin Identity
        const email = "admin@test.com";
        const hashedPassword = await bcrypt.hash("admin123", 10);
        let user = await User.findOne({ email: email.toLowerCase().trim() });

        if (user) {
            console.log("Found identity, applying SUPER_ADMIN permissions...");
            user.role = "SUPER_ADMIN";
            user.password = hashedPassword;
            user.centerId = undefined; // Super Admins should be global
            await user.save();
            console.log("Identity elevated.");
        } else {
            console.log("Identity missing. Initializing Root Admin...");
            await User.create({
                name: "Global Root",
                email: "admin@test.com",
                password: hashedPassword,
                role: "SUPER_ADMIN"
            });
            console.log("Root Admin initialized (admin123).");
        }

        // 4. Create Initial Notifications
        await Notification.deleteMany({ title: { $in: ["New Center Onboarded", "Revenue Payout Processing", "Security Protocols Active", "Welcome to Pathocore Matrix"] } });

        await Notification.create([
            {
                title: "Welcome to Pathocore Matrix",
                description: "System calibration complete. All nodes are now functional and synchronized.",
                type: "success",
                icon: "CheckCircle",
                recipientRole: "SUPER_ADMIN"
            },
            {
                title: "New Center Onboarded",
                description: "LifeCare Labs has successfully established a node in the enterprise matrix.",
                type: "success",
                icon: "Building2",
                recipientRole: "SUPER_ADMIN"
            },
            {
                title: "Revenue Payout Processing",
                description: "Enterprise account payout cycle has initiated for all active clinical nodes.",
                type: "info",
                icon: "TrendingUp",
                recipientRole: "SUPER_ADMIN"
            },
            {
                title: "Security Protocols Active",
                description: "Cluster integrity verification complete. Neural firewall is standing by.",
                type: "warning",
                icon: "ShieldCheck",
                recipientRole: "SUPER_ADMIN"
            }
        ]);

        console.log("Global Persistence Calibration: SUCCESS");
        process.exit(0);
    } catch (err) {
        console.error("Calibration Failure:", err);
        process.exit(1);
    }
}

fix();
