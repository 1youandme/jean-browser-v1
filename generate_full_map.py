import os

def generate_project_map(start_path='.', indent=0, output_lines=None):
    if output_lines is None:
        output_lines = []
    
    try:
        items = sorted(os.listdir(start_path))
    except PermissionError:
        output_lines.append('  ' * indent + '⚠️ Permission denied')
        return output_lines
    
    for item in items:
        full_path = os.path.join(start_path, item)
        
        if os.path.isdir(full_path):
            output_lines.append('  ' * indent + f'📁 {item}/')
            generate_project_map(full_path, indent + 1, output_lines)
        else:
            output_lines.append('  ' * indent + f'📄 {item}')
            try:
                # قراءة المحتوى الكامل بدون حد للحجم
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if content.strip():
                        output_lines.append('    ' + '─' * 50)
                        output_lines.append('    ── محتوى كامل:')
                        output_lines.append('    ' + '─' * 50)
                        # عرض كل المحتوى بدون اختصار
                        for line in content.splitlines():
                            output_lines.append('    ' + line)
                        output_lines.append('    ' + '─' * 50)
                        output_lines.append('')  # سطر فارغ للفصل
            except Exception as e:
                output_lines.append(f'    ⚠️ Error reading file: {e}')
    
    return output_lines

if __name__ == '__main__':
    print("🧭 Generating complete project map with full file contents...")
    lines = ["🧭 Complete Project Map", "=" * 80, ""]
    lines += generate_project_map(start_path='.')
    
    output_file = "project_map_complete.txt"
    with open(output_file, "w", encoding='utf-8') as f:
        f.write("\n".join(lines))
    
    print(f"✅ Done. Saved to {output_file}")
    print(f"📊 Total lines: {len(lines)}")