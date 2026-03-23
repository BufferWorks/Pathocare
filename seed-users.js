import connectDB from "./src/lib/mongodb.js";
import { User, Center } from "./src/lib/models.js";
import bcrypt from "bcryptjs";

async function seed() {
    await connectDB();

    // 1. Create a Sample Center if it doesn't exist
    let center = await Center.findOne({ name: "LifeCare Diagnostics" });
    if (!center) {
        center = await Center.create({
            name: "LifeCare Diagnostics",
            email: "info@lifecare.com",
            phone: "+91 9988776655",
            address: "123 Green Valley, Medical Hub",
        });
        console.log("Created Sample Center: LifeCare Diagnostics");
    }

    const centerId = center._id;

    // 2. Define users to create
    const users = [
        {
            name: "System Super Admin",
            email: "superadmin@pathocare.com",
            password: "superpassword123",
            role: "SUPER_ADMIN",
            centerId: null
        },
        {
            name: "LifeCare Admin",
            email: "centeradmin@lifecare.com",
            password: "adminpassword123",
            role: "CENTER_ADMIN", // Can change rates
            centerId: centerId
        },
        {
            name: "Staff Member 1",
            email: "staff1@lifecare.com",
            password: "staffpassword123",
            role: "STAFF", // Can book and fill investigations
            centerId: centerId
        },
        {
            name: "Staff Member 2",
            email: "staff2@lifecare.com",
            password: "staffpassword123",
            role: "STAFF",
            centerId: centerId
        }
    ];

    for (const u of users) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await User.create({
                ...u,
                password: hashedPassword
            });
            console.log(`Created User: ${u.name} (${u.role})`);
        } else {
            console.log(`User already exists: ${u.name}`);
        }
    }

    console.log("\n------------------------------------------------");
    console.log("LOGIN CREDENTIALS PROVIDED:");
    console.log("------------------------------------------------");
    console.log("1. SUPER ADMIN (Full Software Access)");
    console.log("   Email: superadmin@pathocare.com");
    console.log("   Password: superpassword123");
    console.log("\n2. CENTER ADMIN (Branch Admin - Can change rates)");
    console.log("   Email: centeradmin@lifecare.com");
    console.log("   Password: adminpassword123");
    console.log("\n3. STAFF ACCOUNTS (Booking & Investigations)");
    console.log("   Email: staff1@lifecare.com / staff2@lifecare.com");
    console.log("   Password: staffpassword123");
    console.log("------------------------------------------------");

    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
