import os
import pandas as pd

DATA_FOLDER = "data/"
OUTPUT_FOLDER = "data/processed/"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def convert_excel_to_text(file_path):
    df = pd.read_excel(file_path)

    # LIMIT rows for faster processing
    MAX_ROWS = 3000
    if len(df) > MAX_ROWS:
        df = df.head(MAX_ROWS)
        print(f"⚠️ Limiting {file_path} to first {MAX_ROWS} rows")

    text_rows = []

    for _, row in df.iterrows():
        row_text = ", ".join([f"{col}: {row[col]}" for col in df.columns])
        text_rows.append(row_text)

    return "\n".join(text_rows)


for file in os.listdir(DATA_FOLDER):
    if file.endswith(".xlsx") or file.endswith(".csv"):
        path = os.path.join(DATA_FOLDER, file)

        if file.endswith(".csv"):
            df = pd.read_csv(path)
            df.to_excel("temp.xlsx", index=False)
            path = "temp.xlsx"

        print(f"Processing {file}...")
        text_data = convert_excel_to_text(path)

        output_file = os.path.join(OUTPUT_FOLDER, file.replace(".xlsx", ".txt").replace(".csv", ".txt"))
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text_data)

print("✅ All files converted to text documents!")
