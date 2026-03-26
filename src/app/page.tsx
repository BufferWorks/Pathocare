"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  Settings,
  Database,
  Printer
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="text-primary w-6 h-6 md:w-8 md:h-8 shrink-0" />
            <span className="text-lg md:text-xl font-bold tracking-tight truncate">Patho<span className="text-primary">Core</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-8 font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#solutions" className="hover:text-primary transition-colors">Solutions</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="md:px-5 md:py-2.5">Login</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm" className="md:px-5 md:py-2.5">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              Empowering Diagnostics Everywhere
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              The Next-Gen System for <br />
              <span className="text-primary">Modern Pathology Centers</span>
            </h1>
            <p className="text-lg text-secondary-foreground/60 max-w-2xl mx-auto mb-10">
              A comprehensive multi-tenant SaaS solution designed to streamline lab operations,
              from center management to patient reports. Scales from single clinics to global laboratory chains.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Launch My Center <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="glass rounded-3xl overflow-hidden border-8 border-white/50 shadow-2xl shadow-primary/20">
              <div className="w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                {/* Mockup Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                <div className="relative z-10 p-12 text-center">
                  <Activity className="w-20 h-20 text-primary mx-auto mb-6 opacity-20" />
                  <p className="text-secondary font-medium uppercase tracking-widest text-sm">Dashboard Mockup</p>
                </div>
                {/* Floating UI Elements */}
                <div className="absolute top-10 right-10 p-4 glass rounded-xl shadow-lg w-48 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="text-green-500 w-4 h-4" />
                    <span className="text-[10px] font-bold">New Booking</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                  <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-secondary">Robust tools for super admins, center managers, and laboratory technicians.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: <Database className="w-6 h-6 text-primary" />,
                title: "Multi-Tenant Architecture",
                desc: "Securely host multiple diagnostic centers under one umbrella with isolated data and custom branding."
              },
              {
                icon: <Settings className="w-6 h-6 text-primary" />,
                title: "Custom Test Management",
                desc: "Centers can add their own tests, define parameters, investigations, and set dynamic pricing."
              },
              {
                icon: <Printer className="w-6 h-6 text-primary" />,
                title: "Professional Reporting",
                desc: "Automated result calculation and one-click PDF report printing with unique center letterheads."
              },
              {
                icon: <Users className="w-6 h-6 text-primary" />,
                title: "Advanced RBAC",
                desc: "Role-based access control for super admins, center admins, billing staff, and lab technicians."
              },
              {
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "Booking & History",
                desc: "Detailed patient history, booking management, and live status tracking for all samples."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-primary" />,
                title: "Compliance Ready",
                desc: "Data encryption and audit logs ensuring medical data stays safe and follows standards."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 blur-[100px] -z-10" />

          <h2 className="text-4xl font-bold mb-6">Ready to modernize your laboratory?</h2>
          <p className="text-lg text-secondary max-w-xl mx-auto mb-10">
            Join 100+ pathology centers that have transformed their diagnostic operations with Pathocore.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">Start Free Trial</Button>
            </Link>
            <Button size="lg" variant="ghost">Talk to Sales</Button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Activity className="text-primary w-6 h-6" />
            <span className="text-lg font-bold tracking-tight">Pathocore</span>
          </div>
          <p className="text-sm text-secondary">© 2026 Pathocore Systems Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-secondary hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-sm text-secondary hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
