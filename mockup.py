
import numpy as np
import pandas as pd
# Note: You need to ensure 'openpyxl' is installed (pip install openpyxl)
# pandas uses openpyxl as the engine to write .xlsx files.

# --- 1. DATA GENERATION (Mirroring ML Code Logic) ---

def generate_mock_data(n_samples=200):
    """
    Generates mock data for simulating the relationship between inputs and health outcomes,
    matching the logic used to train the Hazard Predictor in the FRACE system.
    """
    print("--- 1. Generating Mock Data for FRACE Model ---")

    # Input Features:
    # Temperature (35 to 50 C)
    temperature = np.random.uniform(35, 50, n_samples)

    # Crowd Density (1 to 10 persons per sq meter)
    crowd_density = np.random.uniform(1, 10, n_samples)

    # Target (Predicted Case Surge)
    # Equation: Cases = (Temp * 0.8) + (Density * 1.5) + Random Noise
    case_surge = (temperature * 0.8) + (crowd_density * 1.5) + np.random.normal(0, 5, n_samples)

    # Ensure cases are positive and integer
    case_surge = np.maximum(0, np.round(case_surge)).astype(int)

    data = pd.DataFrame({
        'Sample_ID': range(1, n_samples + 1),
        'Temperature_C': temperature.round(2),
        'Crowd_Density_P_sqm': crowd_density.round(2),
        'Predicted_Case_Surge': case_surge
    })

    print(f"Generated {n_samples} samples.")
    return data


# --- 2. EXPORT FUNCTION ---

def export_to_excel(dataframe: pd.DataFrame, filename: str = 'frace_ml_mock_data.xlsx'):
    """
    Exports the Pandas DataFrame containing mock data to an Excel (.xlsx) file.
    """
    try:
        # Use pandas to write to Excel (requires openpyxl engine)
        dataframe.to_excel(filename, index=False, sheet_name='FRACE_Mock_Data')
        print(f"\n--- 2. Export Success ---")
        print(f"Successfully exported mock data to '{filename}'")
        print("File is ready for review by financial/business experts.")
    except ImportError:
        print("\n--- EXPORT FAILED ---")
        print("Error: The 'openpyxl' library is required to write .xlsx files.")
        print("Please run: pip install openpyxl")
    except Exception as e:
        print(f"\n--- EXPORT FAILED ---")
        print(f"An unexpected error occurred: {e}")


# --- 3. EXECUTION ---
if __name__ == '__main__':
    # 1. Generate the data
    mock_data_df = generate_mock_data(n_samples=500) # Generating 500 samples for a robust file

    # 2. Export the data to Excel
    export_to_excel(mock_data_df)