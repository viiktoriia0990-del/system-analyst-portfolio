// Собирает AsyncAPI-контракт из нескольких файлов в один и создаёт страницу dist/asyncapi.html.
// Страница использует готовый компонент документации AsyncAPI (@asyncapi/react-component).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const load = (file) => parse(readFileSync(file, 'utf8'));

// Заменяет внешние $ref (ссылки на другие файлы) их содержимым.
function inline(node, file) {
  if (Array.isArray(node)) return node.map((item) => inline(item, file));
  if (node === null || typeof node !== 'object') return node;
  if (typeof node.$ref === 'string' && !node.$ref.startsWith('#')) {
    const [path, fragment = ''] = node.$ref.split('#');
    const target = resolve(dirname(file), path);
    let value = load(target);
    for (const key of fragment.split('/').filter(Boolean)) value = value[key];
    return inline(value, target);
  }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, inline(value, file)]));
}

const source = resolve('asyncapi/asyncapi.yaml');
const spec = inline(load(source), source);
const json = JSON.stringify(spec).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${spec.info.title}</title>
  <link rel="stylesheet" href="https://unpkg.com/@asyncapi/react-component@latest/styles/default.min.css">
</head>
<body>
  <div id="asyncapi"></div>
  <script src="https://unpkg.com/@asyncapi/react-component@latest/browser/standalone/index.js"></script>
  <script>
    AsyncApiStandalone.render({ schema: ${json}, config: { show: { sidebar: true } } }, document.getElementById('asyncapi'));
  </script>
</body>
</html>
`;

mkdirSync('dist', { recursive: true });
writeFileSync('dist/asyncapi.html', html);
console.log('AsyncAPI-документация собрана: dist/asyncapi.html');
