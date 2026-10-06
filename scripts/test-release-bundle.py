"""Exercise the workflow's actual assembly block in a disposable source copy.

Requires Python 3.10+, Node 24+, bash and zip. No publishing or network calls.
"""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import textwrap
import zipfile

ROOT = Path(__file__).resolve().parent.parent
workflow = (ROOT / '.github/workflows/release.yml').read_text()
assembly = workflow.split('      - name: assemble the floors bundle\n        run: |\n', 1)[1].split('      - uses:', 1)[0]
assembly = textwrap.dedent(assembly)
node = shutil.which('node')
assert node, 'Node 24+ required'
with tempfile.TemporaryDirectory() as tmp:
    source = Path(tmp) / 'source'
    shutil.copytree(ROOT, source, ignore=shutil.ignore_patterns('.git', 'dist', 'out', '__pycache__'))
    env = dict(os.environ, GITHUB_REF_NAME='v0.0.0-test')
    subprocess.run(['bash', '-eu', '-c', assembly], cwd=source, env=env, check=True, capture_output=True, timeout=15)
    extracted = Path(tmp) / 'extracted'
    with zipfile.ZipFile(source / 'dist/centerfugeq-v0.0.0-test.zip') as archive:
        archive.extractall(extracted)
    bundle = extracted / 'centerfugeq-v0.0.0-test'
    # Older bundles flattened the engine; execute it there to reproduce the missing template.
    engine = bundle / 'quantTernEngine/gen.ts'
    if not engine.exists():
        engine = bundle / 'gen.ts'
    for modality in ('image', 'marioq', 'son-go-ku'):
        subprocess.run([node, str(engine), modality, 'synthetic release smoke'], cwd=bundle,
                       check=True, capture_output=True, timeout=10)
        outputs = list((bundle / 'out').glob(modality + '-*.json'))
        # A flattened generator also writes outside the extracted bundle.
        assert outputs, f'{modality}: manifest must stay inside bundle'
        if modality != 'image':
            floors = list((bundle / 'out').glob(modality + '-*.html'))
            assert len(floors) == 1 and 'const M = __MANIFEST__;' not in floors[0].read_text()
    shutil.rmtree(source / 'quantTernEngine')
    failed = subprocess.run(['bash', '-eu', '-c', assembly], cwd=source, env=env,
                            capture_output=True, timeout=15)
    assert failed.returncode != 0, 'missing required engine must fail assembly'
    print('PASS extracted bundle: image, marioq, son-go-ku; missing engine fails assembly')
