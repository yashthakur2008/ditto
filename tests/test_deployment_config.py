import json
import subprocess
from pathlib import Path


def test_frontend_vercel_config_documents_nextjs_build_settings():
    config_path = Path("frontend/vercel.json")
    assert config_path.exists(), "frontend/vercel.json should make Vercel deploy settings explicit"

    config = json.loads(config_path.read_text())
    assert config["framework"] == "nextjs"
    assert config["installCommand"] == "npm install"
    assert config["buildCommand"] == "npm run build"


def test_vercel_deployment_doc_supports_root_level_cli_deploy():
    doc = Path("VERCEL_DEPLOYMENT.md").read_text()
    assert "npx vercel --cwd frontend --prod" in doc


def test_vercel_preflight_script_exists_and_is_executable():
    script = Path("scripts/vercel-preflight.sh")
    assert script.exists(), "preflight script should make deploy readiness repeatable"
    assert script.stat().st_mode & 0o111, "preflight script should be executable"


def test_vercel_preflight_script_checks_docs_and_frontend_config():
    result = subprocess.run(
        ["bash", "scripts/vercel-preflight.sh"],
        check=False,
        text=True,
        capture_output=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
    assert "Vercel preflight passed" in result.stdout
