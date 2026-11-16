#!/usr/bin/env python3
"""Grade one suite task against a built repo over HTTP, from outside the code.

Each task folder (suite/tasks/<id>/) holds a `checks.py` with
    run_checks(api) -> None     # HTTP criteria; call api.rec(...) per criterion
    static_checks(repo, api)    # optional: docs/files criteria, same api.rec
where `api.get/post/patch/put/delete(path, body=None)` return (status, json), or
(status, text) for a non-JSON body; `api.headers` holds the last response's headers
(lower-cased names), and `api.rec(cid, criterion, ok, detail="")` records one criterion.
A criterion a probe cannot observe (existing tests pass) is not recorded here:
the verify gate is its evidence.

usage: probe.py --repo <path> --task <id> [--port 7973] [--skip-build] [--out f.json]
prints one result line per criterion and `acceptance: <passed>/<scored>`.
"""
import argparse, importlib.util, json, os, signal, subprocess, sys
import urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from acceptance_probe import wait_ready  # same host-readiness logic as A/B


class Api:
    def __init__(self, base):
        self.base, self.results, self.headers = base, [], {}

    def call(self, method, path, body=None, raw=None, timeout=20):
        data = raw.encode() if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request(f"{self.base}{path}", method=method, data=data,
                                     headers={"Content-Type": "application/json"} if data is not None else {})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                self.headers = {k.lower(): v for k, v in r.headers.items()}
                txt = r.read().decode()
                ctype = r.headers.get("Content-Type", "")
                return r.status, (json.loads(txt or "null") if "json" in ctype or txt[:1] in "{[" else txt)
        except urllib.error.HTTPError as e:
            self.headers = {k.lower(): v for k, v in (e.headers or {}).items()}
            txt = e.read().decode(errors="replace")
            try:
                return e.code, json.loads(txt or "null")
            except Exception:
                return e.code, {"_raw": txt[:400]}
        except Exception as e:
            self.headers = {}
            return None, {"_error": str(e)[:200]}

    def get(self, path, **k): return self.call("GET", path, **k)
    def post(self, path, body=None, **k): return self.call("POST", path, body, **k)
    def patch(self, path, body=None, **k): return self.call("PATCH", path, body, **k)
    def put(self, path, body=None, **k): return self.call("PUT", path, body, **k)
    def delete(self, path, **k): return self.call("DELETE", path, **k)

    @staticmethod
    def err_code(body):
        return ((body or {}).get("error") or {}).get("code") if isinstance(body, dict) else None

    def rec(self, cid, criterion, ok, detail=""):
        self.results.append({"id": cid, "criterion": criterion, "result": "PASS" if ok else "FAIL",
                             "detail": "" if ok else str(detail)[:300]})


def load_checks(task):
    path = os.path.join(HERE, "tasks", task, "checks.py")
    spec = importlib.util.spec_from_file_location(f"checks_{task}", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--task", required=True)
    ap.add_argument("--port", type=int, default=7973)
    ap.add_argument("--skip-build", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()
    repo, mod = os.path.abspath(a.repo), load_checks(a.task)
    api = Api(f"http://127.0.0.1:{a.port}")
    env = dict(os.environ, AXC_ENVIRONMENT="test", FUNCTIONS_WORKER_RUNTIME="node",
               AzureWebJobsFeatureFlags="EnableWorkerIndexing", AzureWebJobsStorage="")
    if not a.skip_build:
        b = subprocess.run("corepack pnpm run build", shell=True, cwd=repo, capture_output=True,
                           text=True, env=env, timeout=1800)
        if b.returncode:
            print("BUILD FAILED\n" + (b.stdout or "")[-1500:] + (b.stderr or "")[-1500:])
            print("  acceptance: 0/1 (build failed)")
            return 2
    proc = subprocess.Popen(["func", "start", "--script-root", "deploy/", "--port", str(a.port)],
                            cwd=os.path.join(repo, "apps/api"), env=env, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        if not wait_ready(api.base, proc):
            print("host never became ready")
            print("  acceptance: 0/1 (host down)")
            return 3
        mod.run_checks(api)
    finally:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except Exception:
            pass
    if hasattr(mod, "static_checks"):
        mod.static_checks(repo, api)
    passed = sum(r["result"] == "PASS" for r in api.results)
    for r in api.results:
        print(f"  {'ok  ' if r['result'] == 'PASS' else 'FAIL'} {r['id']:8s} {r['criterion']}"
              + (f"\n           {r['detail']}" if r["detail"] else ""))
    print(f"  acceptance: {passed}/{len(api.results)} ({a.task})")
    if a.out:
        json.dump({"task": a.task, "passed": passed, "scored": len(api.results), "results": api.results},
                  open(a.out, "w"), indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
