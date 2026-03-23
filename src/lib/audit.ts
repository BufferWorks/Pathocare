import { AuditLog } from "./models";
import connectDB from "./mongodb";

export async function createAuditLog({
    centerId,
    userId,
    action,
    targetId,
    targetModel,
    details
}: {
    centerId: string;
    userId: string;
    action: string;
    targetId: string;
    targetModel: string;
    details?: any;
}) {
    try {
        await connectDB();
        await AuditLog.create({
            centerId,
            userId,
            action,
            targetId,
            targetModel,
            details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
