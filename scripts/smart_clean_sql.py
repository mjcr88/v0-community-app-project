import re

INPUT_FILE = "supabase/migrations/20260203154500_init_from_prod.sql"
OUTPUT_FILE = "supabase/migrations/clean_schema_v6.sql"

def optimal_clean(input_path, output_path):
    with open(input_path, 'r') as f:
        # Read all lines
        lines = f.readlines()

    final_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if this line is an ALTER TABLE ... OWNER TO block
        # Pattern 1: Multi-line
        # ALTER TABLE ONLY "public"."table_name"
        #     OWNER TO "postgres";
        
        if stripped.startswith('ALTER TABLE') and not stripped.endswith(';'):
            # This looks like the start of a multi-line ALTER TABLE.
            # Look ahead for OWNER TO, skipping empty lines
            look_ahead_idx = i + 1
            found_owner = False
            lines_to_skip = 0
            
            while look_ahead_idx < len(lines):
                next_line_content = lines[look_ahead_idx].strip()
                if not next_line_content: # Empty line
                    look_ahead_idx += 1
                    continue
                
                if next_line_content.startswith('OWNER TO'):
                     found_owner = True
                     # We need to skip from i up to look_ahead_idx (inclusive)
                     # actually we want to skip the ALTER TABLE line (i)
                     # AND all the empty lines in between
                     # AND the OWNER TO line (look_ahead_idx)
                     lines_to_skip = look_ahead_idx - i + 1
                
                # If we hit something else (like ADD CONSTRAINT), we stop looking
                break
            
            if found_owner:
                print(f"Removing Block starting at line {i+1}: {stripped}")
                i += lines_to_skip
                continue
        
        # Pattern 2: Single line (less common in dumps for Tables, but possible)
        # ALTER TABLE ... OWNER TO ...;
        if stripped.startswith('ALTER TABLE') and 'OWNER TO' in stripped:
             print(f"Removing Line: {stripped}")
             i += 1
             continue

        # Pattern 3: Standalone OWNER TO (if any)
        if stripped.startswith('OWNER TO'):
             print(f"Removing Orphan Owner: {stripped}")
             i += 1
             continue

        # Keep everything else (including SET, GRANT, etc.)
        final_lines.append(line)
        i += 1
        
    with open(output_path, 'w') as f:
        f.writelines(final_lines)
    
    print(f"Optimal clean SQL written to {output_path}")

if __name__ == "__main__":
    optimal_clean(INPUT_FILE, OUTPUT_FILE)
