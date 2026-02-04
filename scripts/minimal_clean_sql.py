import re

INPUT_FILE = "supabase/migrations/20260203154500_init_from_prod.sql"
OUTPUT_FILE = "supabase/migrations/clean_schema_v4.sql"

def minimal_clean(input_path, output_path):
    with open(input_path, 'r') as f:
        lines = f.readlines()

    cleaned_lines = []
    for line in lines:
        # ONLY remove ALTER OWNER. 
        # These are strictly permission/role assignments that fail if the user isn't superuser 
        # or if the roles match strictly.
        if line.strip().startswith("ALTER OWNER"):
            continue
            
        # Keep everything else, including "SET" (which broke previous logic)
        cleaned_lines.append(line)

    with open(output_path, 'w') as f:
        f.writelines(cleaned_lines)
    
    print(f"Minimal clean SQL written to {output_path}")

if __name__ == "__main__":
    minimal_clean(INPUT_FILE, OUTPUT_FILE)
