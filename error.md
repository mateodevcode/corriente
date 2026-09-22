ASUS@ROCKITO MINGW64 ~/Documents/PROYECTOS/corriente (main)
$ npm run dev

> corriente@1.0.0 dev
> node dev.mjs


[setup] Preparando entorno
  ✓ BD VPS → 161.97.146.80:5435

[setup] Verificando VPS 161.97.146.80:5435…
  ✓ VPS responde (161.97.146.80:5435)
  ✓ venv backend OK
  ✓ node_modules admin OK
  ✓ node_modules frontend OK

[setup] Migraciones y seed → VPS 161.97.146.80:5435
  ✓ alembic upgrade head OK
  ✓ seed OK (admin@corriente.com / corriente2026)

[limpieza] Liberando puertos previos…
  ! Timeout conectando al VPS (3s)
  ✓ Puertos listos

[dev] Levantando servicios…

──────────────── CORRIENTE (VPS) ────────────────
  Frontend (Astro)   →  http://localhost:4321
  Admin (Vite)       →  http://localhost:5173
  API (Swagger)      →  http://localhost:8000/docs
  BD VPS             →  161.97.146.80:5435 / corriente_db
  Login              →  admin@corriente.com / corriente2026

  Una sola terminal — Ctrl+C mata los 3 servicios

(node:26456) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
[API  ] INFO:     Will watch for changes in these directories: ['C:\\Users\\ASUS\\Documents\\PROYECTOS\\corriente\\backend']
[API  ] INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
[API  ] INFO:     Started reloader process [33248] using WatchFiles
[FRONT] > corriente-frontend@1.0.0 dev
[FRONT] > astro dev --port 4321 --host
[ADMIN] > corriente-admin@1.0.0 dev
[ADMIN] > vite --port 5173 --strictPort
[ADMIN] VITE v5.4.21  ready in 473 ms
[ADMIN] ➜  Local:   http://localhost:5173/
[ADMIN]   ➜  Network: use --host to expose
[API  ] Process SpawnProcess-1:
[API  ] Traceback (most recent call last):
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\multiprocessing\process.py", line 313, in _bootstrap
[API  ] self.run()
[API  ] ~~~~~~~~^^
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\multiprocessing\process.py", line 108, in run
[API  ] self._target(*self._args, **self._kwargs)
[API  ] ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\_subprocess.py", line 80, in subprocess_started
[API  ] target(sockets=sockets)
[API  ] ~~~~~~^^^^^^^^^^^^^^^^^
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\server.py", line 66, in run
[API  ] return asyncio.run(self.serve(sockets=sockets))
[API  ] ~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\asyncio\runners.py", line 195, in run
[API  ] return runner.run(main)
[API  ] ~~~~~~~~~~^^^^^^
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\asyncio\runners.py", line 118, in run
[API  ] return self._loop.run_until_complete(task)
[API  ] ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\asyncio\base_events.py", line 725, in run_until_complete
[API  ] return future.result()
[API  ] ~~~~~~~~~~~~~^^
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\server.py", line 70, in serve
[API  ] await self._serve(sockets)
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\server.py", line 77, in _serve
[API  ] config.load()
[API  ] ~~~~~~~~~~~^^
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\config.py", line 435, in load
[API  ] self.loaded_app = import_from_string(self.app)
[API  ] ~~~~~~~~~~~~~~~~~~^^^^^^^^^^
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\importer.py", line 22, in import_from_string
[API  ] raise exc from None
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\.venv-backend\Lib\site-packages\uvicorn\importer.py", line 19, in import_from_string
[API  ] module = importlib.import_module(module_str)
[API  ] File "C:\Users\ASUS\AppData\Local\Programs\Python\Python313\Lib\importlib\__init__.py", line 88, in import_module
[API  ] return _bootstrap._gcd_import(name[level:], package, level)
[API  ] ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
[API  ] File "<frozen importlib._bootstrap>", line 1387, in _gcd_import
[API  ] File "<frozen importlib._bootstrap>", line 1360, in _find_and_load
[API  ] File "<frozen importlib._bootstrap>", line 1331, in _find_and_load_unlocked
[API  ] File "<frozen importlib._bootstrap>", line 935, in _load_unlocked
[API  ] File "<frozen importlib._bootstrap_external>", line 1026, in exec_module
[API  ] File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\app\main.py", line 7, in <module>
[API  ] from app.routers import ALL_ROUTERS
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\app\routers\__init__.py", line 5, in <module>
[API  ] from app.routers.articles import router as articles_router
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\app\routers\articles.py", line 22, in <module>
[API  ] from app.utils.bloques import bloques_a_html
[API  ] File "C:\Users\ASUS\Documents\PROYECTOS\corriente\backend\app\utils\bloques.py", line 4, in <module>
[API  ] import bleach
[API  ] ModuleNotFoundError: No module named 'bleach'
[FRONT] 20:42:56 [@astrojs/node] Enabling sessions with filesystem storage
[FRONT] 20:42:56 [types] Generated 1ms
[FRONT] 20:42:56 [content] Syncing content
[FRONT] 20:42:56 [content] Synced content
[FRONT]  astro  v5.18.2 ready in 938 ms
[FRONT] ┃ Local    http://localhost:4321/
[FRONT] ┃ Network  http://100.88.213.83:4321/
[FRONT] http://172.29.80.1:4321/
[FRONT] http://192.168.56.1:4321/
[FRONT] http://172.31.83.72:4321/
[FRONT] 20:42:56 watching for file changes...