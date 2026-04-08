import os

def merge_project_files(root_dir, output_file):
    # 1. Các thư mục muốn BỎ QUA
    exclude_dirs = {
        '.git', '.idea', '__pycache__', 'node_modules', 
        '.venv', 'env', 'dist', 'build', 'coverage', '.vscode',
        'models', 'runtime', 'logs', 'tmp', 'temp', '.turbo', '.pnpm-store'
    }
    
    # 2. Các đường dẫn THƯ MỤC cụ thể (Relative Path)
    exclude_dir_paths = {
        os.path.normpath('apps/web/.next'),
    }

    # 3. Các FILE muốn bỏ qua (Chỉ cần tên file)
    exclude_files = {
        'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'poetry.lock',
        '.env', '.DS_Store', 'favicon.ico', output_file # Luôn bỏ qua chính file output
    }

    # 4. Các đường dẫn FILE cụ thể (Nếu muốn đích danh 1 file ở 1 chỗ cố định)
    exclude_file_paths = {
        os.path.normpath('apps/api/test.spec.ts'),
    }

    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(root_dir):
            
            # Lọc thư mục
            dirs[:] = [d for d in dirs if d not in exclude_dirs and 
                       os.path.normpath(os.path.relpath(os.path.join(root, d), root_dir)) not in exclude_dir_paths]
            
            for file in files:
                file_path = os.path.join(root, file)
                rel_file_path = os.path.normpath(os.path.relpath(file_path, root_dir))
                
                # --- KIỂM TRA LOẠI BỎ FILE ---
                # 1. Bỏ qua nếu tên file nằm trong danh sách cấm
                if file in exclude_files:
                    continue
                
                # 2. Bỏ qua nếu đường dẫn file cụ thể nằm trong danh sách cấm
                if rel_file_path in exclude_file_paths:
                    continue
                
                # 3. Kiểm tra đuôi file (Option)
                _, ext = os.path.splitext(file)
                # -----------------------------

                outfile.write('\n' + '='*80 + '\n')
                outfile.write(f'START OF FILE: {file_path}\n')
                outfile.write('='*80 + '\n')
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                        outfile.write('\n')
                except Exception as e:
                    outfile.write(f'\n[Lỗi không đọc được file này: {e}]\n')

if __name__ == "__main__":
    # Tên file output nên nằm trong exclude_files để tránh đệ quy
    merge_project_files('.', 'secret.txt')
    print("Đã tạo xong 'secret.txt'. Các file rác và file lock đã được loại bỏ.")