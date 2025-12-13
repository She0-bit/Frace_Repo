import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error


# --- 1. DATA PREPARATION (MOCK DATA) ---

def generate_mock_data(n_samples=200):
    """
    ينشئ بيانات وهمية لمحاكاة العلاقة بين المدخلات والنتائج الصحية.
    الافتراض: الزيادة المتوقعة في الحالات تتأثر إيجابًا بالحرارة والكثافة.
    """
    print("--- 1. إنشاء البيانات الوهمية ---")

    # المدخلات (Features):
    # درجة الحرارة (بالسيلزيوس): تتراوح بين 35 إلى 50 درجة
    temperature = np.random.uniform(35, 50, n_samples)

    # كثافة الحشود (بالأشخاص لكل متر مربع): تتراوح بين 1 إلى 10
    crowd_density = np.random.uniform(1, 10, n_samples)

    # المخرجات (Target):
    # الزيادة المتوقعة في عدد الحالات (Target)
    # المعادلة: Cases = (Temp * 0.8) + (Density * 1.5) + ضوضاء عشوائية
    case_surge = (temperature * 0.8) + (crowd_density * 1.5) + np.random.normal(0, 5, n_samples)

    # يجب أن تكون الحالات موجبة دائمًا
    case_surge = np.maximum(0, np.round(case_surge)).astype(int)

    data = pd.DataFrame({
        'Temperature_C': temperature,
        'Crowd_Density': crowd_density,
        'Predicted_Case_Surge': case_surge
    })

    print(f"تم إنشاء {n_samples} عينة بيانات.")
    print("العلاقة المتوقعة: ارتفاع الحرارة والكثافة يؤدي إلى زيادة الحالات.")
    return data


# --- 2. MODEL TRAINING AND EVALUATION ---

def train_hazard_model(data: pd.DataFrame):
    """
    يقوم بتدريب نموذج الانحدار الخطي للتنبؤ بالزيادة في الحالات.
    """
    print("\n--- 2. تدريب نموذج التنبؤ ---")

    # تحديد المدخلات والمخرجات
    X = data[['Temperature_C', 'Crowd_Density']]
    y = data['Predicted_Case_Surge']

    # تقسيم البيانات لتدريب واختبار (80% تدريب، 20% اختبار)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # إنشاء وتدريب نموذج الانحدار الخطي
    model = LinearRegression()
    model.fit(X_train, y_train)

    # تقييم النموذج
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"تم تدريب النموذج بنجاح.")
    print(f"جذر متوسط الخطأ التربيعي (RMSE) على بيانات الاختبار: {rmse:.2f}")

    return model


# --- 3. REAL-TIME PREDICTION FUNCTION ---

def predict_case_surge(model, temperature: float, crowd_density: float):
    """
    يستخدم النموذج المدرب لإجراء تنبؤ استباقي في الوقت الفعلي.
    """
    # يجب تهيئة المدخلات في نفس شكل البيانات التي تم التدريب عليها (DataFrame)
    new_data = pd.DataFrame({
        'Temperature_C': [temperature],
        'Crowd_Density': [crowd_density]
    })

    # إجراء التنبؤ
    prediction = model.predict(new_data)[0]

    # تقريب النتيجة لأقرب عدد صحيح
    return max(0, int(round(prediction)))


# --- 4. DEMO EXECUTION ---

if __name__ == '__main__':
    # 1. إنشاء البيانات
    mock_data = generate_mock_data()

    # 2. تدريب النموذج
    trained_model = train_hazard_model(mock_data)

    print("\n--- 3. اختبار التنبؤات في الوقت الفعلي ---")

    # الحالة الأولى: بيئة منخفضة الخطورة
    temp_low = 36.0
    density_low = 2.0
    surge_low = predict_case_surge(trained_model, temp_low, density_low)
    print(f"البيئة المنخفضة (36°C, 2/m²): تنبؤ بزيادة ~{surge_low} حالة.")

    # الحالة الثانية: بيئة عالية الخطورة (تؤدي إلى تنبيه المستشفى)
    temp_high = 45.5
    density_high = 8.5
    surge_high = predict_case_surge(trained_model, temp_high, density_high)
    print(f"البيئة العالية (45.5°C, 8.5/m²): تنبؤ بزيادة ~{surge_high} حالة.")

    # الحالة الثالثة: بيئة متوسطة
    temp_mid = 40.0
    density_mid = 5.0
    surge_mid = predict_case_surge(trained_model, temp_mid, density_mid)
    print(f"البيئة المتوسطة (40.0°C, 5/m²): تنبؤ بزيادة ~{surge_mid} حالة.")

    # --- دمج الكود مع FRACE ---
    # يمكن دمج الدالة `predict_case_surge` ضمن مُكون React أو كـ API Backend
    # لتُستخدم لإرسال الإشعار الاستباقي للمستشفيات.
    if surge_high >= 15:
        print("\n--> تم تجاوز حد التنبؤ: إرسال إشعار استباقي للمستشفى.")

#######
import math
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

# Note: These imports are confirmed working in your environment

# --- CONSTANTS AND CONFIGURATION ---
RIYYADH_CENTER = (24.7136, 46.6753)
HOSPITAL_LOCATIONS = {
    "Riyadh Central": (24.7000, 46.6800),
    "East Health Center": (24.7500, 46.7200)
}
HAZARD_THRESHOLD_CROWD_DENSITY = 5  # Persons per sq meter
# Threshold for proactive hospital alert (if predicted surge exceeds this, notify hospital)
HOSPITAL_SURGE_ALERT_THRESHOLD = 15


# --- ML Model Functions (From your successful code) ---

def generate_mock_data(n_samples=200):
    """Generates mock data for training the hazard prediction model."""
    temperature = np.random.uniform(35, 50, n_samples)
    crowd_density = np.random.uniform(1, 10, n_samples)
    case_surge = (temperature * 0.8) + (crowd_density * 1.5) + np.random.normal(0, 5, n_samples)
    case_surge = np.maximum(0, np.round(case_surge)).astype(int)

    data = pd.DataFrame({
        'Temperature_C': temperature,
        'Crowd_Density': crowd_density,
        'Predicted_Case_Surge': case_surge
    })
    return data


def train_hazard_model(data: pd.DataFrame):
    """Trains a Linear Regression model for case surge prediction."""
    X = data[['Temperature_C', 'Crowd_Density']]
    y = data['Predicted_Case_Surge']
    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)
    return model


def predict_case_surge(model, temperature: float, crowd_density: float):
    """Uses the trained model for real-time proactive prediction."""
    new_data = pd.DataFrame({
        'Temperature_C': [temperature],
        'Crowd_Density': [crowd_density]
    })
    prediction = model.predict(new_data)[0]
    return max(0, int(round(prediction)))


# --- 1. HAZARD PREDICTOR (Now Integrated with ML) ---
class HazardPredictor:
    """
    Manages the AI layer, integrating a pre-trained ML model for forecasting future health risks.
    """

    def __init__(self):
        # Train the model once upon initialization (simulating loading a pre-trained model)
        print("Training ML model for Hazard Prediction...")
        mock_data = generate_mock_data()
        self.ml_model = train_hazard_model(mock_data)
        print("ML Model trained successfully.")

    def predict_hazard_intensity(self, area_id: str, current_crowd_density: float, weather_forecast: dict) -> dict:
        """
        Uses the trained model to predict the case surge and determines risk level.
        """
        temp = weather_forecast.get('temperature', 30)

        # Use the ML model for prediction
        predicted_case_increase = predict_case_surge(self.ml_model, temp, current_crowd_density)

        predicted_risk_level = "LOW"
        if predicted_case_increase >= HOSPITAL_SURGE_ALERT_THRESHOLD:
            predicted_risk_level = "HIGH"
        elif predicted_case_increase > 5:
            predicted_risk_level = "MODERATE"

        # Determine which nearby hospital needs warning (simplified)
        hospital_target = random.choice(list(HOSPITAL_LOCATIONS.keys()))

        prediction = {
            "area_id": area_id,
            "time_window": (datetime.now() + timedelta(hours=4)).isoformat(),
            "predicted_risk_level": predicted_risk_level,
            "predicted_hazard_type": "Heat Exhaustion/Crowd Overload",
            "hospital_target": hospital_target,
            "predicted_case_surge": predicted_case_increase
        }

        if predicted_risk_level in ["HIGH", "MODERATE"]:
            print(f"\n[AI PREDICTION ENGINE] ---> RISK ALERT: {predicted_risk_level} for {area_id}")
            self.notify_hospital_of_increase(hospital_target, predicted_case_increase)

        return prediction

    def notify_hospital_of_increase(self, hospital: str, cases: int):
        """Notifies nearby hospitals of a probable surge (Advanced Functionality)."""
        print(f"--- HOSPITAL ALERT ---")
        print(f"NOTIFICATION SENT to: {hospital} via secure API.")
        print(f"PREDICTION: Expecting an increase of ~{cases} cases in the next 4 hours.")
        print(f"----------------------")


# --- 2. CROWD REROUTING LOGIC ---
class ReroutingEngine:
    """
    Analyzes current hazards and crowd flow to recommend alternative, safer paths.
    (Logic remains the same)
    """

    def __init__(self):
        self.mock_paths = {
            "path_A": [(24.71, 46.67), (24.71, 46.68), (24.70, 46.69)],
            "path_B": [(24.72, 46.66), (24.70, 46.67), (24.69, 46.68)],
            "path_C": [(24.73, 46.69), (24.71, 46.69), (24.70, 46.70)],
        }

    def calculate_distance(self, loc1, loc2):
        """Simplified Euclidean distance calculation."""
        return math.sqrt((loc1[0] - loc2[0]) ** 2 + (loc1[1] - loc2[1]) ** 2)

    def find_safest_route(self, current_location: tuple, destination: tuple, hazard_zone: dict) -> str:
        """Determines the safest route by avoiding the hazard zone and minimizing distance."""
        safest_path = None
        min_cost = float('inf')

        for name, coordinates in self.mock_paths.items():
            is_hazardous = False
            total_distance = 0

            for lat, lng in coordinates:
                if (lat >= hazard_zone.get('lat_min', -99) and lat <= hazard_zone.get('lat_max', 99) and
                        lng >= hazard_zone.get('lng_min', -99) and lng <= hazard_zone.get('lng_max', 99)):
                    is_hazardous = True
                    break

            if is_hazardous:
                continue

            total_distance += self.calculate_distance(current_location, coordinates[0])
            for i in range(len(coordinates) - 1):
                total_distance += self.calculate_distance(coordinates[i], coordinates[i + 1])
            total_distance += self.calculate_distance(coordinates[-1], destination)

            current_cost = total_distance + (3.0 if name == 'path_C' else 0)

            if current_cost < min_cost:
                min_cost = current_cost
                safest_path = name

        return safest_path if safest_path else "No safe route found. Stop movement."


# --- 3. ORCHESTRATOR / EMERGENCY LOGIC RUNNER ---
def run_advanced_logic(user_location: tuple, user_destination: tuple, hazard_zone: dict, current_density: float,
                       current_temp: float):
    """
    Main function to run the advanced FRACE modules and orchestrate commands.
    """
    # Note: Predictor object is initialized once, training the model
    predictor = HazardPredictor()
    rerouter = ReroutingEngine()

    print("===================================================")
    print(f"ANALYSIS START: Location {user_location} -> Destination {user_destination}")
    print(f"Current Conditions: {current_temp}°C, Density {current_density}/m²")
    print("===================================================")

    # 1. RUN PREDICTIVE MODEL (Proactive Step)
    weather = {'temperature': current_temp}  # Pass real-time temperature
    prediction = predictor.predict_hazard_intensity("Current User Area", current_density, weather)
    print(
        f"\n[1. HAZARD PREDICTION]: Predicted Surge: {prediction['predicted_case_surge']} cases. Risk Level: {prediction['predicted_risk_level']}")

    # 2. RUN REROUTING ENGINE (Reactive Step)
    if hazard_zone['is_active']:
        print("\n[2. DANGER CHECK]: Confirmed active hazard zone detected.")

        safest_route = rerouter.find_safest_route(user_location, user_destination, hazard_zone)

        print(f"\n[3. REROUTING OUTPUT]:")
        if safest_route:
            print(f"   -> Command: REROUTE USER")
            print(f"   -> Recommended Path: {safest_route}")
            return f"REROUTE:{safest_route}"
        else:
            print("   -> Command: IMMEDIATE STOP")
            return "IMMEDIATE_STOP"
    else:
        print("\n[2. DANGER CHECK]: No active hazard confirmed. User proceeds on optimal path.")
        return "OPTIMAL_PATH"


# --- DEMO EXECUTION ---
if __name__ == '__main__':
    # --- MOCK DATA SETUP ---
    user_start = (24.7150, 46.6750)
    user_end = (24.7300, 46.7000)

    # CASE 1: High Risk (Triggers Hospital Alert & Rerouting)
    temp_high = 45.5
    density_high = 8.5
    active_hazard = {
        'is_active': True,
        'lat_min': 24.7000, 'lat_max': 24.7200,
        'lng_min': 46.6800, 'lng_max': 46.7000
    }

    print("--- SCENARIO 1: HIGH RISK, ACTIVE HAZARD, ML PREDICTION ---")
    command = run_advanced_logic(user_start, user_end, active_hazard, density_high, temp_high)
    print(f"\nFINAL FRACE COMMAND (API Dispatch): {command}")
    print("\n" + "=" * 50 + "\n")

    # CASE 2: Low Risk (No Hospital Alert, Optimal Path)
    temp_low = 36.0
    density_low = 2.0
    inactive_hazard = {'is_active': False}
    print("--- SCENARIO 2: LOW RISK, NO ACTIVE DANGER ---")
    command = run_advanced_logic(user_start, user_end, inactive_hazard, density_low, temp_low)
    print(f"\nFINAL FRACE COMMAND (API Dispatch): {command}")