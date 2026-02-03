import re

INPUT_FILE = "supabase/migrations/fresh_dump.sql"
OUTPUT_FILE = "supabase/migrations/clean_schema_final.sql"

def is_new_command(line):
    # Keywords that start a NEW statement, imply the previous one is finished
    keywords = [
        "CREATE", "DROP", "ALTER", "INSERT", 
        "UPDATE", "DELETE", "SELECT", "GRANT", 
        "REVOKE", "COMMENT", "SET", "RESET", 
        "DO", "beGIN", "COMMIT", "ROLLBACK"
    ]
    u_line = line.upper()
    for k in keywords:
        if u_line.startswith(k + " "):
            return True
    return False

def definitive_clean(input_path, output_path):
    with open(input_path, 'r') as f:
        lines = f.readlines()

    cmd_buffer = []
    
    # We will iterate lines, but when we see ALTER TABLE, we look ahead.
    
    final_lines = []
    skip_until_index = -1
    
    for i in range(len(lines)):
        if i <= skip_until_index:
            continue
            
        line = lines[i]
        stripped = line.strip()
        
        # Detect ALTER TABLE start
        if stripped.startswith("ALTER TABLE") and not stripped.endswith(";"):
            # Look ahead for the continuation
            look_ahead_idx = i + 1
            next_significant_line = None
            
            while look_ahead_idx < len(lines):
                content = lines[look_ahead_idx].strip()
                if content and not content.startswith("--"):
                    next_significant_line = content
                    break
                look_ahead_idx += 1
            
            # Logic:
            # 1. If EOF or no next significant line -> drop (hanging at end)
            # 2. If next sig line is OWNER TO -> drop BOTH (we want to strip owners)
            # 3. If next sig line is a NEW COMMAND -> drop current (hanging)
            # 4. Otherwise (e.g. ADD CONSTRAINT) -> Keep current
            
            should_drop = False
            
            if not next_significant_line:
                should_drop = True
                print(f"Dropping hanging (EOF) at {i+1}: {stripped}")
            elif next_significant_line.startswith("OWNER TO"):
                should_drop = True
                print(f"Dropping Owner block at {i+1}: {stripped}")
                # We also want to skip the OWNER TO line itself
                # So we update skip_until_index to look_ahead_idx
                skip_until_index = look_ahead_idx
            elif is_new_command(next_significant_line):
                should_drop = True
                # e.g. next is "CREATE INDEX...", so this ALTER TABLE had no body.
                print(f"Dropping hanging (New Cmd) at {i+1}: {stripped}")
            else:
                # Valid continuation (ADD, ENABLE, etc)
                pass
                
            if should_drop:
                continue
                
        # Also strip standalone OWNER TO lines if they exist
        if stripped.startswith("OWNER TO "):
             continue

        final_lines.append(line)
        
    with open(output_path, 'w') as f:
        f.writelines(final_lines)
    
    print(f"Definitive clean SQL written to {output_path}")

if __name__ == "__main__":
    definitive_clean(INPUT_FILE, OUTPUT_FILE)
