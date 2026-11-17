"""Run both app processes in one free instance; exit if either process fails."""
import os
import signal
import subprocess
import sys
import time
import urllib.request

processes = []
stopping = False


def request_stop(_signum, _frame):
    global stopping
    stopping = True


for sig in (signal.SIGTERM, signal.SIGINT):
    signal.signal(sig, request_stop)

os.environ.setdefault('PORT', '10000')

try:
    ai = subprocess.Popen([
        'gunicorn', '--bind', '127.0.0.1:8000', '--workers', '1',
        '--threads', '2', '--timeout', '60', '--access-logfile', '-', 'app:app',
    ], cwd='/app/ai-service', start_new_session=True)
    processes.append(ai)
    deadline = time.monotonic() + 90
    while not stopping:
        if ai.poll() is not None or time.monotonic() >= deadline:
            raise RuntimeError('AI service failed to become ready')
        try:
            with urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2) as response:
                if response.status == 200:
                    break
        except OSError:
            time.sleep(0.5)

    if not stopping:
        processes.append(subprocess.Popen(
            ['node', 'server.js'], cwd='/app/server', start_new_session=True,
        ))
    while not stopping:
        for process in processes:
            if process.poll() is not None:
                raise RuntimeError(f'App process exited with status {process.returncode}')
        time.sleep(0.5)
except Exception as error:
    print(f'Startup supervisor: {error}', file=sys.stderr, flush=True)
    sys.exit(1)
finally:
    for process in processes:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
    for process in processes:
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
