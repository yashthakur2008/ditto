import json
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
