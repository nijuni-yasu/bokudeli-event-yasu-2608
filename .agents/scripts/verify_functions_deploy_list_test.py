#!/usr/bin/env python3
"""verify_functions_deploy_list のユニットテスト。"""

from __future__ import annotations

import importlib.util
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

SAMPLE_DEPLOY_MATCHING = """\
case "$GROUP" in
  hybrid)
    echo "args=--force --only functions:fooBar" >> "$GITHUB_OUTPUT"
    ;;
  pf)
    echo "args=--force --only functions:bazQux" >> "$GITHUB_OUTPUT"
    ;;
  enterprise)
    echo "args=--force --only functions:createEnterprise" >> "$GITHUB_OUTPUT"
    ;;
esac
"""


class VerifyFunctionsDeployListTest(unittest.TestCase):
    def test_parse_index_exports(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".ts", delete=False) as f:
            f.write(SAMPLE_INDEX)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        self.assertEqual(vfd.parse_index_exports(path), {"fooBar", "bazQux"})

    def test_parse_deploy_targets(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".yml", delete=False) as f:
            f.write(SAMPLE_DEPLOY_MATCHING)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        deployed, by_group = vfd.parse_deploy_targets(path)
        self.assertEqual(deployed, {"fooBar", "bazQux", "createEnterprise"})
        self.assertEqual(set(by_group), {"hybrid", "pf", "enterprise"})

    def test_parse_index_exports_strips_inline_comment(self) -> None:
        index = """\
export const {
  fooBar, // first export
  bazQux,
} = Object.assign({}, ...(await Promise.all([])))
"""
        with tempfile.NamedTemporaryFile("w", suffix=".ts", delete=False) as f:
            f.write(index)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        self.assertEqual(vfd.parse_index_exports(path), {"fooBar", "bazQux"})

    def test_parse_deploy_targets_allows_blank_line_before_echo(self) -> None:
        deploy = """\
case "$GROUP" in
  hybrid)

    echo "args=--force --only functions:fooBar" >> "$GITHUB_OUTPUT"
    ;;
  pf)
    echo "args=--force --only functions:bazQux" >> "$GITHUB_OUTPUT"
    ;;
  enterprise)
    echo "args=--force --only functions:createEnterprise" >> "$GITHUB_OUTPUT"
    ;;
esac
"""
        with tempfile.NamedTemporaryFile("w", suffix=".yml", delete=False) as f:
            f.write(deploy)
            path = Path(f.name)
        self.addCleanup(path.unlink, missing_ok=True)
        deployed, by_group = vfd.parse_deploy_targets(path)
        self.assertEqual(deployed, {"fooBar", "bazQux", "createEnterprise"})
        self.assertEqual(set(by_group), {"hybrid", "pf", "enterprise"})

    def test_collect_mismatch_missing_export(self) -> None:
        errors = vfd.collect_mismatch_errors(
            exports={"fooBar", "missingFn"},
            deployed={"fooBar"},
            by_group={"hybrid": ["fooBar"]},
        )
        self.assertTrue(any("missingFn" in err for err in errors))

    def test_collect_mismatch_stale_deploy(self) -> None:
        errors = vfd.collect_mismatch_errors(
            exports={"fooBar"},
            deployed={"fooBar", "staleFn"},
            by_group={"hybrid": ["fooBar"], "pf": ["staleFn"]},
        )
        self.assertTrue(any("staleFn" in err for err in errors))

    def test_collect_mismatch_duplicate_group(self) -> None:
        errors = vfd.collect_mismatch_errors(
            exports={"dupFn"},
            deployed={"dupFn"},
            by_group={"hybrid": ["dupFn"], "pf": ["dupFn"]},
        )
        self.assertTrue(any("重複登録" in err for err in errors))

    def test_verify_fails_when_deploy_has_extra_export(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_MATCHING, encoding="utf-8")
            # index に無い createEnterprise が deploy 側にあるため verify は失敗する
            self.assertEqual(vfd.verify(index_path, deploy_path), 1)

    def test_verify_ok_when_fully_matched(self) -> None:
        index = """\
export const {
  fooBar,
  bazQux,
  createEnterprise,
} = Object.assign({}, ...(await Promise.all([])))
"""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            index_path.write_text(index, encoding="utf-8")
            deploy_path.write_text(SAMPLE_DEPLOY_MATCHING, encoding="utf-8")
            self.assertEqual(vfd.verify(index_path, deploy_path), 0)

    def test_verify_fails_on_missing_group(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            index_path = root / "index.ts"
            deploy_path = root / "deploy.yml"
            index_path.write_text(SAMPLE_INDEX, encoding="utf-8")
            deploy_path.write_text(
                'hybrid)\n  echo "args=--force --only functions:fooBar"\n',
                encoding="utf-8",
            )
            self.assertEqual(vfd.verify(index_path, deploy_path), 1)


if __name__ == "__main__":
    unittest.main()
