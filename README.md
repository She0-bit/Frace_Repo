# Frace
# 🇸🇦 FRACE: Surgical-Precision Public Health Response System

### **⚠️ Stop Panic, Start Precision.**

FRACE (Foresight, Resilience, Analytics, Compliance Engine) is a pioneering architectural solution designed to protect citizens during mass gatherings. We shift public health defense from slow, broad warnings to **instant, individual, and surgically precise alerts** by leveraging anonymized location data under strict national compliance standards.

---

## 🎯 The Core Value Proposition

FRACE achieves national-level safety promotion by guaranteeing speed and accuracy that current systems cannot match.

| Key Metric | Current Method | FRACE System (Goal) |
| :--- | :--- | :--- |
| **Response Time** | Hours / Days | **Seconds** (Instant Query) |
| **Alert Precision** | Low (Broad Area SMS) | **High** (Filtered, GPS-based Exposure) |
| **Compliance** | Vulnerable | **Mandatory** (SDAIA, Local Azure, AES-256) |

---

## 🏗️ ARCHITECTURE & DATA FLOW

FRACE operates on a secure, two-tiered system designed for data sovereignty and high performance.

### **I. Dual-Database Model (DB Separation)**

| Component | Contribution | Role & Security |
| :--- | :--- | :--- |
| **Location Logs (DB 2)** | **70%** (High Volume Data) | Stores continuous **Anonymized UIDs** and GPS points. Access is strictly Read-Only for the Query Engine. |
| **Incident Reports (DB 1)** | **10%** (Low Volume Trigger) | Stores verified symptoms and risk Geofence. Entered only by Verified Health Authority Access. |
| **National Integration Keys** | **5%** (Output Layer) | Authentication for sending alerts via **Sehaty/Tawakkalna** APIs. |
| **Decision Logic (Internal)** | **15%** (Logic Layer) | Executes Decision Tree and ML models to determine mandate. |

### **II. Advanced Logic & AI Layer**

This layer integrates high-value features for proactive safety:

| Feature | Role | Implementation |
| :--- | :--- | :--- |
| **🧠 Hazard Predictor** | **Proactive AI:** Uses an **ML Model** (Linear Regression, trained on Temp/Density) to forecast and notify hospitals of **probable case surges** (e.g., 20 extra heat stroke cases) in advance. | Python (NumPy, Pandas, Scikit-learn) |
| **🗺️ Hajj Rerouting** | **Reactive Safety:** Calculates the safest path for users to avoid active hazard zones (issues **REROUTE** or **IMMEDIATE STOP** commands). | Custom Rerouting Logic, Geofence Avoidance |
| **🎯 Precision Filter** | **Custom Algorithms:** Runs against DB 2 results to remove **GPS False Positives** (noise/passing traffic), ensuring alert list accuracy. | Custom Math & Filtering Logic |

---

## 🔒 SECURITY & GOVERNANCE (SDAIA MANDATE)

Trust is non-negotiable. Our architecture is built on mandated security pillars:

* **Data Sovereignty:** All data is hosted on **Local Microsoft Azure Servers** within KSA.
* **Encryption Standard:** Mandatory **AES-256 Encryption** applied to all **Data at Rest**.
* **Privacy by Design:** Strict adherence to **Data Minimization** (no PII stored) and automated data deletion policies.
* **Validation:** Commitment to **Annual Cybersecurity Certification** by accredited firms.

---

## 🛠️ TECHNOLOGY STACK

| Layer | Technology / Tool |
| :--- | :--- |
| **Logic Core** | Python, NumPy, Pandas, Scikit-learn (ML) |
| **Data Storage** | Google Firebase Firestore (Mock DBs) |
| **Frontend/Demo** | React / Tailwind CSS |
| **Cloud Host** | Microsoft Azure (Mandated Local Servers) |

## 🏃 DEMO & FILES

The project includes functional Python modules for ML simulation and a React application to visualize the full lifecycle.

| File | Purpose |
| :--- | :--- |
| **`frace_advanced_logic.py`** | Demonstrates the live ML prediction and Hajj rerouting logic. |
| **`export_mock_data.py`** | Script to generate and export training data (`frace_ml_mock_data.xlsx`). |
| **`ml_data_prep_report.md`** | Explains the ML model's data cleaning, training, and evaluation (RMSE). |
| **`frace_prototype.jsx`** | The main React app demonstrating the Dual DB query lifecycle. |
