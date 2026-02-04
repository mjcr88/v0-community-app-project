import re

INPUT_FILE = "supabase/migrations/20260203154500_init_from_prod.sql"
OUTPUT_FILE = "supabase/migrations/clean_schema_v2.sql"

def clean_sql(input_path, output_path):
    with open(input_path, 'r') as f:
        lines = f.readlines()

    cleaned_lines = []
    for line in lines:
        # Remove ALTER OWNER statements (often cause permission issues if role doesn't exist)
        if line.startswith("ALTER OWNER"):
            continue
        # Remove variable SET statements (can cause session issues in some editors)
        if line.startswith("SET "):
            continue
        # Remove "CREATE EXTENSION" if not exists noise (usually fine, but can clutter)
        # Keep them for now as they are idempotent.
        
        cleaned_lines.append(line)

    with open(output_path, 'w') as f:
        f.writelines(cleaned_lines)
    
    print(f"Cleaned SQL written to {output_path}")

if __name__ == "__main__":
    clean_sql(INPUT_FILE, OUTPUT_FILE)
