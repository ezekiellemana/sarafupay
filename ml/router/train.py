"""
Fine-tunes Muse Glimmer 30B (LoRA SFT, Fireworks Serverless Training) on the SarafuPay router data,
using the fw-ai/cookbook Muse Glimmer starter, and reports base vs tuned on OUR template-disjoint
holdout.

  pip install -e <cookbook>/training   # see README.md
  FIREWORKS_API_KEY=... python ml/router/train.py plan|prepare|launch [--run-id ID]

The starter normally shuffles the file and holds out the first --n-eval rows. build_dataset.py puts
the holdout rows first, so we turn the starter's shuffle off: its holdout is then exactly ours.
"""
import json
import os
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data" / "router_train.jsonl"
N_EVAL = sum(1 for l in (HERE / "data" / "holdout.jsonl").read_text().splitlines() if l.strip())
COOKBOOK = Path(os.environ.get("COOKBOOK_DIR", HERE / ".cookbook")) / "training"


class _KeepOrder(random.Random):
    def shuffle(self, x, *a, **k):  # holdout first, as written by build_dataset.py
        return None


def main():
    assert os.environ.get("FIREWORKS_API_KEY"), "Set FIREWORKS_API_KEY"
    sys.path.insert(0, str(COOKBOOK))
    os.chdir(COOKBOOK)
    from examples.sft import muse_glimmer_starter as starter

    real_random = starter.random

    class _Patched:
        def __getattr__(self, name):
            return getattr(real_random, name)

        @staticmethod
        def Random(seed=None):
            return _KeepOrder(seed)

    cmd, rest = sys.argv[1], sys.argv[2:]
    args = [cmd]
    if cmd in ("prepare", "launch"):
        starter.random = _Patched()  # only the split; training batches are still shuffled
    if cmd in ("plan", "launch"):
        args += ["--surface", "serverless"]
    if cmd != "plan" or "--file" not in rest:
        args += ["--file", str(DATA)]
    if cmd in ("prepare", "launch"):
        # Short JSON answers: small eval budget keeps the base model from rambling for 2k tokens.
        args += ["--n-eval", str(N_EVAL), "--max-eval-tokens", "96", "--max-seq-len", "1024"]
    sys.argv = ["muse_glimmer_starter", *args, *rest]
    starter.main()


if __name__ == "__main__":
    main()
