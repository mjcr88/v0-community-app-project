import re

INPUT_FILE = "supabase/migrations/clean_schema_v2.sql"
OUTPUT_FILE = "supabase/migrations/clean_schema_v3.sql"

def fix_sql(input_path, output_path):
    with open(input_path, 'r') as f:
        content = f.read()

    # The issue seems to be empty "ALTER TABLE ONLY ...;" or "ALTER TABLE ONLY ... [newline] [newline] ..."
    # We need to remove ALTER TABLE statements that don't satisfy constraints or are truncated.
    
    # 1. Remove "ALTER TABLE ONLY ...;" (on one line) if it has no other content?
    # No, that's not the issue. The issue is likely:
    # ALTER TABLE ONLY "public"."announcements"
    # [nothing]
    #
    # or
    # ALTER TABLE ONLY "public"."announcements"
    # OWNER TO postgres;  <-- We might have removed "OWNER TO" but kept the ALTER TABLE line?
    
    lines = content.splitlines()
    cleaned_lines = []
    
    # We will iterate and skip lines that are *just* "ALTER TABLE ONLY ... " and seem to hang?
    # A manual state machine might be better, but let's try a regex approach on the whole content first
    # to find patterns like "ALTER TABLE ... \n \n"
    
    buffer = []
    
    stmt_buffer = ""
    
    # Regex to identify specific bad patterns. 
    # The user saw: ALTER TABLE ONLY "public"."announcements" (then error)
    # If the next effective line is ANOTHER ALTER TABLE, then the first one is incomplete.
    
    normalized_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Filter out bad lines we know we don't want (like OWNER TO)
        if stripped.startswith("OWNER TO"):
            # This handles the case where ALTER TABLE was on prev line and OWNER TO is here.
            # But we need to remove the PREVIOUS line too if it was just "ALTER TABLE"
            continue
            
        normalized_lines.append(line)

    # RE-PROCESS to catch hanging ALTER TABLEs
    # If we see "ALTER TABLE ..." followed immediately by another "ALTER TABLE ..." without a ";" or body?
    
    final_lines = []
    i = 0
    while i < len(normalized_lines):
        line = normalized_lines[i]
        stripped = line.strip()
        
        if stripped.startswith("ALTER TABLE ONLY") and not stripped.endswith(";"):
            # formatting: often pg_dump does:
            # ALTER TABLE ONLY "public"."foo"
            #     ADD CONSTRAINT ...;
            
            # Check next line
            if i + 1 < len(normalized_lines):
                next_line = normalized_lines[i+1].strip()
                if next_line.startswith("ALTER TABLE") or next_line.startswith("CREATE") or next_line.startswith("DROP"):
                    # The current ALTER TABLE is likely hanging/empty. SKIP IT.
                    # This happens if we stripped the 'OWNER TO' line that was supposed to be here.
                    print(f"Removing hanging line: {line.strip()}")
                    i += 1
                    continue
                if not next_line:
                    # End of file case?
                    i += 1
                    continue
            
        final_lines.append(line)
        i += 1
        
    with open(output_path, 'w') as f:
        f.write("\n".join(final_lines))
        
    print(f"Fixed SQL written to {output_path}")

if __name__ == "__main__":
    fix_sql(INPUT_FILE, OUTPUT_FILE)
