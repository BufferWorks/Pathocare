import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Test, Package } from "@/lib/models";

export async function GET() {
    try {
        await connectDB();

        // 1. COMPREHENSIVE GLOBAL AUTHORIZED TEST MATRIX (BHAGVAN MAHAVEER PATHOLOGY STANDARDS)
        const globalTests = [
            // --- HEMATOLOGY ---
            { name: "Haemoglobin (Hb)", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["hb", "haemoglobin", "blood", "heme"] },
            { name: "RBC Count", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["rbc", "red blood cells"] },
            { name: "WBC Count", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["wbc", "white blood cells"] },
            { name: "TLC & DLC", category: "HEMATOLOGY", isGlobal: true, price: 25, tags: ["tlc", "dlc", "differential"] },
            { name: "Hb, TLC, DLC (Haemogram)", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["haemogram", "hb", "tlc", "dlc"] },
            { name: "CBC (Haemogram)", category: "HEMATOLOGY", isGlobal: true, price: 120, tags: ["cbc", "complete blood count", "haemogram"] },
            { name: "Hb, TLC, Pl. Count", category: "HEMATOLOGY", isGlobal: true, price: 120, tags: ["hb", "tlc", "platelet"] },
            { name: "Platelet Count", category: "HEMATOLOGY", isGlobal: true, price: 90, tags: ["platelets", "pc", "plt"] },
            { name: "ESR", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["esr", "sedimentation"] },
            { name: "MCV, MCH, MCHC", category: "HEMATOLOGY", isGlobal: true, price: 120, tags: ["mcv", "mch", "mchc", "indices"] },
            { name: "Anemia Typing", category: "HEMATOLOGY", isGlobal: true, price: 180, tags: ["anemia", "typing"] },
            { name: "CBC & Anemia Typing", category: "HEMATOLOGY", isGlobal: true, price: 240, tags: ["cbc", "anemia"] },
            { name: "PS for Comments", category: "HEMATOLOGY", isGlobal: true, price: 180, tags: ["ps", "smear", "comments"] },
            { name: "MP by PS", category: "HEMATOLOGY", isGlobal: true, price: 70, tags: ["mp", "malaria", "parasite"] },
            { name: "Reticulocyte Count", category: "HEMATOLOGY", isGlobal: true, price: 90, tags: ["reticulocyte"] },
            { name: "PCV/HCT", category: "HEMATOLOGY", isGlobal: true, price: 40, tags: ["pcv", "hct", "hematocrit"] },
            { name: "BT & CT", category: "HEMATOLOGY", isGlobal: true, price: 60, tags: ["bt", "ct", "bleeding", "clotting"] },
            { name: "AEC", category: "HEMATOLOGY", isGlobal: true, price: 90, tags: ["aec", "eosinophil"] },
            { name: "Blood Group & Typing", category: "HEMATOLOGY", isGlobal: true, price: 60, tags: ["blood group", "abo", "rh"] },
            { name: "G6 PD Test", category: "HEMATOLOGY", isGlobal: true, price: 190, tags: ["g6pd"] },
            { name: "Sickling Test", category: "HEMATOLOGY", isGlobal: true, price: 80, tags: ["sickling", "hbs"] },
            { name: "Abnormal Cells", category: "HEMATOLOGY", isGlobal: true, price: 130, tags: ["abnormal", "cells"] },
            { name: "Prothrombin Time (PT)", category: "HEMATOLOGY", isGlobal: true, price: 300, tags: ["pt", "inr", "prothrombin"] },
            { name: "Bone marrow Examination", category: "HEMATOLOGY", isGlobal: true, price: 750, tags: ["bone marrow"] },
            { name: "PS for Filaria", category: "HEMATOLOGY", isGlobal: true, price: 120, tags: ["filaria", "microfilaria"] },

            // --- CYTOLOGY/HISTOPATH ---
            { name: "CSF R/M", category: "CYTOLOGY", isGlobal: true, price: 80, tags: ["csf", "fluid"] },
            { name: "Pleural Fluid R/M", category: "CYTOLOGY", isGlobal: true, price: 120, tags: ["pleural", "fluid"] },
            { name: "Pericardial Fluid R/M", category: "CYTOLOGY", isGlobal: true, price: 120, tags: ["pericardial", "fluid"] },
            { name: "Ascetic Fluid R/M", category: "CYTOLOGY", isGlobal: true, price: 120, tags: ["ascetic", "fluid"] },
            { name: "Synovial Fluid R/M", category: "CYTOLOGY", isGlobal: true, price: 120, tags: ["synovial", "fluid"] },
            { name: "Pap-Cytology", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["pap", "cytology"] },
            { name: "Fine-Cytology", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["fine", "cytology"] },
            { name: "Sputum-Cytology", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["sputum", "cytology"] },
            { name: "Ascetic Fluid Cytology", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["ascetic", "cytology"] },
            { name: "Pleural Fluid Cytology", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["pleural", "cytology"] },
            { name: "FNAC smear", category: "CYTOLOGY", isGlobal: true, price: 180, tags: ["fnac", "smear"] },
            { name: "Pap's smear (Slide received)", category: "CYTOLOGY", isGlobal: true, price: 140, tags: ["pap", "smear"] },

            // --- BIOCHEMISTRY ---
            { name: "Sr. Urea", category: "BIOCHEMISTRY", isGlobal: true, price: 60, tags: ["urea", "kft", "kidney"] },
            { name: "Sr. Creatinine", category: "BIOCHEMISTRY", isGlobal: true, price: 60, tags: ["creatinine", "kft", "kidney"] },
            { name: "Sr. Uric Acid", category: "BIOCHEMISTRY", isGlobal: true, price: 60, tags: ["uric acid", "kft", "gout"] },
            { name: "Blood Sugar (Fasting)", category: "BIOCHEMISTRY", isGlobal: true, price: 40, tags: ["sugar", "fasting", "glucose", "diabetes"] },
            { name: "Blood Sugar (P.P.)", category: "BIOCHEMISTRY", isGlobal: true, price: 40, tags: ["sugar", "pp", "glucose", "diabetes"] },
            { name: "Blood Sugar (Random)", category: "BIOCHEMISTRY", isGlobal: true, price: 40, tags: ["sugar", "random", "glucose", "diabetes"] },
            { name: "Sr. Total Protein", category: "BIOCHEMISTRY", isGlobal: true, price: 60, tags: ["protein", "lft", "liver"] },
            { name: "Sr. Albumin", category: "BIOCHEMISTRY", isGlobal: true, price: 60, tags: ["albumin", "lft", "liver"] },
            { name: "Sr. Globulin", category: "BIOCHEMISTRY", isGlobal: true, price: 80, tags: ["globulin", "lft", "liver"] },
            { name: "Sr. Bilirubin (Total, Direct, Indirect)", category: "BIOCHEMISTRY", isGlobal: true, price: 180, tags: ["bilirubin", "lft", "liver", "jaundice"] },
            { name: "Sr. SGOT", category: "BIOCHEMISTRY", isGlobal: true, price: 80, tags: ["sgot", "ast", "lft", "liver"] },
            { name: "Sr. SGPT", category: "BIOCHEMISTRY", isGlobal: true, price: 80, tags: ["sgpt", "alt", "lft", "liver"] },
            { name: "Sr Alk. Phosphatase (ALP)", category: "BIOCHEMISTRY", isGlobal: true, price: 120, tags: ["alp", "lft", "liver", "bone"] },
            { name: "Sr. Amylase", category: "BIOCHEMISTRY", isGlobal: true, price: 510, tags: ["amylase", "pancreas"] },
            { name: "Sr. Lipase", category: "BIOCHEMISTRY", isGlobal: true, price: 510, tags: ["lipase", "pancreas"] },
            { name: "Sr LDH", category: "BIOCHEMISTRY", isGlobal: true, price: 280, tags: ["ldh", "marker"] },
            { name: "Sr. Gamma GT", category: "BIOCHEMISTRY", isGlobal: true, price: 240, tags: ["ggt", "lft", "liver"] },
            { name: "HbA1c", category: "BIOCHEMISTRY", isGlobal: true, price: 360, tags: ["hba1c", "sugar", "diabetes"] },
            { name: "Lipid Profile", category: "BIOCHEMISTRY", isGlobal: true, price: 450, tags: ["lipid", "cholesterol", "heart", "cardiac"] },
            { name: "Sr. HDL", category: "BIOCHEMISTRY", isGlobal: true, price: 90, tags: ["hdl", "good cholesterol"] },
            { name: "Sr. Calcium", category: "BIOCHEMISTRY", isGlobal: true, price: 180, tags: ["calcium", "bone"] },
            { name: "Sr. Phosphorus", category: "BIOCHEMISTRY", isGlobal: true, price: 180, tags: ["phosphorus", "bone"] },
            { name: "Electrolytes (Na, K, Cl)", category: "BIOCHEMISTRY", isGlobal: true, price: 400, tags: ["electrolytes", "sodium", "potassium", "chloride"] },
            { name: "Sr. CRP", category: "BIOCHEMISTRY", isGlobal: true, price: 300, tags: ["crp", "inflammation"] },
            { name: "Sr. RA Factor", category: "BIOCHEMISTRY", isGlobal: true, price: 180, tags: ["ra", "rheumatoid", "arthritis"] },
            { name: "Sr. ASLO", category: "BIOCHEMISTRY", isGlobal: true, price: 180, tags: ["aslo", "infection"] },

            // --- URINE EXAMINATION ---
            { name: "Urine Routine/Microscopic", category: "URINE", isGlobal: true, price: 60, tags: ["urine", "routine", "microscopic"] },
            { name: "Urine-Sugar", category: "URINE", isGlobal: true, price: 25, tags: ["urine", "sugar"] },
            { name: "Urine-Albumin", category: "URINE", isGlobal: true, price: 25, tags: ["urine", "albumin"] },
            { name: "Urine Bence Jones Prot", category: "URINE", isGlobal: true, price: 400, tags: ["bence jones", "protein", "multiple myeloma"] },
            { name: "Bile Pigment (Urine)", category: "URINE", isGlobal: true, price: 25, tags: ["urine", "bile", "pigment"] },
            { name: "Bile Salt (Urine)", category: "URINE", isGlobal: true, price: 25, tags: ["urine", "bile", "salt"] },
            { name: "Urobilinogen (Urine)", category: "URINE", isGlobal: true, price: 35, tags: ["urine", "urobilinogen"] },
            { name: "Occult Blood (Urine)", category: "URINE", isGlobal: true, price: 35, tags: ["urine", "occult blood"] },
            { name: "Chyle (Urine)", category: "URINE", isGlobal: true, price: 55, tags: ["urine", "chyle"] },

            // --- IMMUNOLOGY ---
            { name: "Thyroid Profile (T3, T4, TSH)", category: "IMMUNOLOGY", isGlobal: true, price: 750, tags: ["thyroid", "t3", "t4", "tsh", "hormone"] },
            { name: "Widal Test", category: "IMMUNOLOGY", isGlobal: true, price: 180, tags: ["widal", "typhoid", "fever"] },
            { name: "HIV (Rapid)", category: "IMMUNOLOGY", isGlobal: true, price: 180, tags: ["hiv", "aids"] },
            { name: "HBsAg (Rapid)", category: "IMMUNOLOGY", isGlobal: true, price: 130, tags: ["hbsag", "hepatitis"] },
            { name: "VDRL", category: "IMMUNOLOGY", isGlobal: true, price: 130, tags: ["vdrl", "syphilis"] },
            { name: "Pregnancy Test", category: "IMMUNOLOGY", isGlobal: true, price: 130, tags: ["pregnancy", "upt", "hcg"] },
            { name: "Mantoux Test", category: "IMMUNOLOGY", isGlobal: true, price: 130, tags: ["mantoux", "tb", "tuberculosis"] },
            { name: "Typhi dot", category: "IMMUNOLOGY", isGlobal: true, price: 260, tags: ["typhi", "dot", "typhoid"] },
            { name: "Malaria Antigen", category: "IMMUNOLOGY", isGlobal: true, price: 100, tags: ["malaria", "antigen", "pf", "pv"] },
            { name: "ADA", category: "IMMUNOLOGY", isGlobal: true, price: 300, tags: ["ada", "tb"] },
        ];

        await Test.deleteMany({ isGlobal: true });
        const seededTests = await Test.insertMany(globalTests);

        const findId = (name: string) => seededTests.find(t => t.name.toLowerCase().includes(name.toLowerCase()))?._id;

        // 2. COMBO OFFERS (PACKAGES) - DIRECT FROM BOOKLET
        const globalPackages = [
            {
                name: "Complete Lipid Profile",
                description: "Cholesterol, Triglycerides, HDL, LDL, VLDL",
                isGlobal: true,
                price: 300,
                tags: ["lipid", "cholesterol", "heart", "cardiac"],
                tests: [findId("Lipid Profile")]
            },
            {
                name: "Liver aur Kidney Panel (L-K Panel)",
                description: "LFT + KFT + Electrolytes: SGOT, SGPT, Bilirubin, Protein, ALP, Urea, Creatinine, Uric Acid, Phosphorus",
                isGlobal: true,
                price: 470,
                tags: ["lft", "kft", "liver", "kidney", "integrated", "l-k"],
                tests: [findId("Bilirubin"), findId("SGOT"), findId("SGPT"), findId("Urea"), findId("Creatinine"), findId("Uric Acid"), findId("Electrolytes")]
            },
            {
                name: "Swasth Hriday Panel (Heart Check)",
                description: "Sugar(F), Lipid Profile, hsCRP, SGOT, SGPT, Bilirubin, Creatinine, Uric Acid",
                isGlobal: true,
                price: 600,
                tags: ["heart", "cardiac", "hriday", "lipid"],
                tests: [findId("Lipid Profile"), findId("Sugar (Fasting)"), findId("SGOT"), findId("SGPT"), findId("Creatinine"), findId("Uric Acid"), findId("CRP")]
            },
            {
                name: "Diabetic Panel (Sugar Monitor)",
                description: "Sugar(F/PP), Lipid Profile, Urea, Creatinine, Urine R/M, HbA1c",
                isGlobal: true,
                price: 770,
                tags: ["sugar", "diabetes", "diabetic", "hba1c"],
                tests: [findId("Sugar (Fasting)"), findId("HbA1c"), findId("Lipid Profile"), findId("Urea"), findId("Creatinine"), findId("Urine Routine")]
            },
            {
                name: "Harmonal Profile",
                description: "T3, T4, TSH + Vitamin B12 + Vitamin D",
                isGlobal: true,
                price: 1300,
                tags: ["hormone", "thyroid", "vitamins"],
                tests: [findId("Thyroid Profile")]
            },
            {
                name: "Strong Bone Profile (Strong Bone Screen)",
                description: "Calcium, Phosphorus, ALP, Vitamin-D 25 Hydroxy",
                isGlobal: true,
                price: 950,
                tags: ["bone", "calcium", "vitamin d"],
                tests: [findId("Calcium"), findId("Phosphorus"), findId("ALP")]
            },
            {
                name: "Senior Citizen Panel (Male)",
                description: "Sugar(F/PP), CBC, LFT, KFT, Lipid Profile, PSA",
                isGlobal: true,
                price: 750,
                tags: ["senior citizen", "male", "psa", "full body"],
                tests: [findId("CBC"), findId("Sugar (Fasting)"), findId("Lipid Profile"), findId("Urea"), findId("Creatinine"), findId("SGOT"), findId("SGPT")]
            },
            {
                name: "Sampurn Swasthya Panel A",
                description: "Sugar(F/PP), CBC, LFT, KFT, Lipid Profile, T3 T4 TSH, HbA1c",
                isGlobal: true,
                price: 1250,
                tags: ["sampurn", "full body", "comprehensive"],
                tests: [findId("CBC"), findId("Sugar (Fasting)"), findId("Lipid Profile"), findId("Thyroid Profile"), findId("HbA1c"), findId("Urea"), findId("Creatinine")]
            },
            {
                name: "Sampurn Swasthya Panel B",
                description: "Panel A + Vitamin D + Vitamin B12",
                isGlobal: true,
                price: 2250,
                tags: ["sampurn", "full body", "advanced"],
                tests: [findId("CBC"), findId("Sugar (Fasting)"), findId("Lipid Profile"), findId("Thyroid Profile"), findId("HbA1c"), findId("Urea"), findId("Creatinine")]
            }
        ];

        await Package.deleteMany({ isGlobal: true });
        await Package.insertMany(globalPackages);

        return NextResponse.json({
            status: "Global Authorized Matrix Successfully Deployed",
            testsSeeded: globalTests.length,
            packagesSeeded: globalPackages.length,
            note: "Authorized by Bhagvan Mahaveer Pathology Catalog standards."
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
