import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import { User, Center } from "@/lib/models";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    await connectDB();
                    const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });

                    if (!user) {
                        return null;
                    }

                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);

                    if (!isPasswordCorrect) {
                        return null;
                    }

                    // Check Center Status (Skip for Super Admin)
                    if (user.role !== "SUPER_ADMIN" && user.centerId) {
                        const center = await Center.findById(user.centerId);
                        if (center) {
                            const isExpired = center.expiryDate && new Date(center.expiryDate) < new Date();
                            if (!center.isActive || isExpired) {
                                throw new Error(isExpired ? "Center Access Expired" : "Center Suspended");
                            }
                        }
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        centerId: user.centerId?.toString()
                    };
                } catch (error) {
                    console.error("NEXTAUTH: Authorize error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.centerId = user.centerId;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token) {
                session.user.role = token.role;
                session.user.centerId = token.centerId;
                session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt" as const,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
