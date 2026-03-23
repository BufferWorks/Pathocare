import "dotenv/config";
import connectDB from "./src/lib/mongodb.js";
import { User } from "./src/lib/models.js";
import bcrypt from "bcryptjs";

// Note: I'm adding .js extensions for the tsx loader if needed, 
// though tsx usually handles it. Actually, better use relative paths properly.

async function setupAdmin() {
    await connectDB();

    const adminEmail = "admin@pathocore.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
        console.log("Super Admin already exists.");
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await User.create({
        name: "System Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "SUPER_ADMIN"
    });

    console.log("Super Admin created successfully!");
    console.log("Email: admin@pathocore.com");
    console.log("Password: admin123");
    process.exit(0);
}

setupAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
