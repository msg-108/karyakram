import ast
import os

def check_file(filepath):
    with open(filepath, 'r') as f:
        try:
            tree = ast.parse(f.read())
        except Exception as e:
            return
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            if not ast.get_docstring(node):
                print(f'{filepath}:{node.lineno} - {node.name}')

for root, _, files in os.walk('apps'):
    if 'migrations' in root or 'tests' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            check_file(os.path.join(root, file))
