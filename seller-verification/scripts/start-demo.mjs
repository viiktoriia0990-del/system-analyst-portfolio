// Собирает документацию и запускает локальные сервисы:
// ReDoc на http://localhost:8080, AsyncAPI на http://localhost:8080/asyncapi
// и mock-сервер Prism на http://localhost:4010.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const build = spawnSync('npm run build', { stdio: 'inherit', shell: true });
if (build.status !== 0) {
  console.error('Сборка документации не удалась. Проверьте ошибки выше.');
  process.exit(build.status ?? 1);
}

const pages = {
  '/': 'index.html',
  '/asyncapi': 'asyncapi.html',
};

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '') || '/';
  const file = pages[path];
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Страница не найдена. Откройте / или /asyncapi');
    return;
  }
  try {
    const html = await readFile(join('dist', file));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`dist/${file} не найден. Запустите npm run build`);
  }
});

let prism;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('\nПорт 8080 уже занят — скорее всего, демо уже запущено в другом терминале.');
    console.error('Остановите его через Ctrl + C или освободите порты командой:');
    console.error('  lsof -ti :8080 -ti :4010 | xargs kill\n');
    process.exit(1);
  }
  throw error;
});

server.listen(8080, () => {
  console.log('ReDoc:     http://localhost:8080');
  console.log('AsyncAPI:  http://localhost:8080/asyncapi');
  prism = spawn('npm run mock', { stdio: 'inherit', shell: true });
  console.log('Prism:     http://localhost:4010');
});

const stop = () => {
  prism?.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
