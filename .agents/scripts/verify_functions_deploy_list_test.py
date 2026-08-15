#!/usr/bin/env python3
"""verify_functions_deploy_list のユニットテスト。"""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
MODULE_PATH = SCRIPTS_DIR / "verify_functions_deploy_list.py"

spec = importlib.util.spec_from_file_location("verify_functions_deploy_list", MODULE_PATH)
assert spec and spec.loader
vfd = importlib.util.module_from_spec(spec)
sys.modules["verify_functions_deploy_list"] = vfd
spec.loader.exec_module(vfd)

SAMPLE_INDEX = """\
export const {
  fooBar,
  bazQux,
} = Object.assign({}, ...(await Promise.all([])))
"""

SAMPLE_DEPLOY_OK = """\
jobs:
  deploy:
    steps:
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only functions'
"""

SAMPLE_DEPLOY_LEGACY = """\
    strategy:
      matrix:
        group: ["hybrid","pf","enterprise"]
    steps:
      - name: Resolve deploy targets
        run: |
          case "$GROUP" in
            hybrid)
              echo "args=--force --only functions:fooBar" >> "$GITHUB_OUTPUT"
              ;;
          esac
      - name: Deploy to Firebase (${{ matrix.group }})
        with:
          args: ${{ steps.targets.outputs.args }}
"""

SAMPLE_FIREBASE_OK = """\
{
  "functions": [
    {
      "source": "functions/default",
      "codebase": "default"
    }
  ]
}
"""


class VerifyFunctionsDeployConfigTest(unittest.TestCase):
    def test_parse_index_exports(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".ts", delete=False) as f:
            f.write(SAMPLE_INDEX)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        self.assertEqual(vfd.parse_index_exports(path), {"fooBar", "bazQux"})

    def test_parse_firebase_functions_config(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            f.write(SAMPLE_FIREBASE_OK)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        self.assertEqual(
            vfd.parse_firebase_functions_config(path),
            (["default"], ["functions/default"]),
        )

    def test_collect_deploy_config_errors_ok(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            self.assertEqual(
                vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path),
                [],
            )

    def test_collect_deploy_config_errors_legacy_yml(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_LEGACY, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("strategy" in err or "--only functions:" in err for err in errors))
            self.assertTrue(any("--force" in err for err in errors))

    def test_collect_deploy_config_errors_allows_enterprise_in_comment(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      # enterprise rollout note
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only functions'
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            self.assertEqual(
                vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path),
                [],
            )

    def test_collect_deploy_config_errors_rejects_multiple_deploy_steps(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only functions'
      - name: Deploy hosting
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only hosting'
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("1 件である必要があります" in err for err in errors))

    def test_collect_deploy_config_errors_rejects_extra_deploy_step_without_args(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only functions'
      - name: Decoy deploy without args
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("1 件である必要があります" in err for err in errors))
            self.assertTrue(any("実際: 2 件" in err for err in errors))

    def test_collect_deploy_config_errors_missing_only_functions(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only hosting'
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("--only functions" in err for err in errors))

    def test_collect_deploy_config_errors_rejects_decoy_args_string(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      # args: '--only functions'
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only hosting'
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("実際の値" in err for err in errors))

    def test_collect_deploy_config_errors_rejects_env_args_decoy(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        env:
          args: '--only functions'
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only hosting'
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(deploy, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("--only functions" in err for err in errors))

    def test_parse_deploy_step_args_list_ignores_step_name(self) -> None:
        deploy = """\
jobs:
  deploy:
    steps:
      - name: Publish Cloud Functions
        uses: ./.github/actions/deploy
        with:
          args: '--only functions'
"""
        with tempfile.NamedTemporaryFile("w", suffix=".yml", delete=False) as f:
            f.write(deploy)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        self.assertEqual(vfd.parse_deploy_step_args_list(path), ["--only functions"])

    def test_collect_deploy_config_errors_empty_functions_array(self) -> None:
        firebase = json.dumps({"functions": []})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(firebase, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("functions が空" in err for err in errors))

    def test_collect_deploy_config_errors_rejects_invalid_firebase_source(self) -> None:
        firebase = json.dumps(
            {
                "functions": [
                    {"source": "functions/legacy", "codebase": "default"},
                ]
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(firebase, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("source" in err and "functions/default" in err for err in errors))

    def test_collect_deploy_config_errors_skips_empty_check_on_parse_error(self) -> None:
        firebase = json.dumps({"functions": [{"source": "functions/default"}]})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(firebase, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertEqual(len(errors), 1)
            self.assertIn("codebase", errors[0])
            self.assertNotIn("functions が空", errors[0])

    def test_collect_deploy_config_errors_empty_exports(self) -> None:
        empty_index = """\
export const {
} = Object.assign({}, ...(await Promise.all([])))
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(empty_index, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(SAMPLE_FIREBASE_OK, encoding="utf-8")
            errors = vfd.collect_deploy_config_errors(deploy_path, index_path, firebase_path)
            self.assertTrue(any("export がありません" in err for err in errors))

    def test_verify_ok_with_repo_defaults(self) -> None:
        self.assertEqual(vfd.verify(), 0)

    def test_verify_fails_on_invalid_firebase_codebase(self) -> None:
        firebase = json.dumps(
            {
                "functions": [
                    {"source": "functions/default", "codebase": "default"},
                    {"source": "functions/legacy", "codebase": "legacy"},
                ]
            }
        )
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            firebase_path = root / "firebase.json"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_OK, encoding="utf-8")
            firebase_path.write_text(firebase, encoding="utf-8")
            self.assertEqual(vfd.verify(index_path, deploy_path, firebase_path), 1)


if __name__ == "__main__":
    unittest.main()
