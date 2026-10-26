# Заявки продавцов · API-контракт

**OpenAPI 3.1 + AsyncAPI 2.6 + Kafka + ReDoc + Prism**

Часть проектной документации маркетплейса N, модуль заявок продавцов. Название компании, реквизиты и данные продавцов изменены.

Маркетплейс N продаёт ювелирные изделия малых брендов и частных мастеров. Чтобы начать продавать, продавец подаёт заявку с документами, а юрист маркетплейса проверяет её и принимает решение.

## Методы API

```text
GET   /seller-applications                           Список заявок с фильтром и пагинацией
POST  /seller-applications                           Создать заявку
GET   /seller-applications/{applicationId}           Получить заявку
PATCH /seller-applications/{applicationId}           Изменить данные заявки
POST  /seller-applications/{applicationId}/submit    Отправить на проверку
POST  /seller-applications/{applicationId}/decision  Принять решение (юрист)
POST  /seller-applications/{applicationId}/archive   Перенести в архив
POST  /seller-applications/{applicationId}/restore   Восстановить из архива
```

Для каждого метода описаны запрос, ответ, коды ответов и примеры для успешных сценариев и ошибок. Ошибки возвращаются в едином формате.

## Статусы заявки

![Статусы заявки](docs/statuses.png)

- создание заявки, статус `DRAFT`: `POST /seller-applications`;
- отправка на проверку и повторная отправка, статус `SUBMITTED`: `POST .../submit`;
- решение юриста, статус `APPROVED`, `REJECTED` или `NEEDS_REWORK`: `POST .../decision`.

## Ключевые решения

- **Правка через PATCH, а не PUT.** Продавец передаёт только изменённые поля, например новый email, и не присылает заявку целиком.
- **Архив вместо удаления.** Заявка нужна для истории проверок, поэтому её не удаляют, а переносят в архив. Статус при этом сохраняется, и заявку можно восстановить.
- **Решение юриста одним методом.** Одобрить, отклонить и вернуть на доработку можно через `/decision`: правила проверки у этих действий общие.
- **События через Kafka.** Когда меняется статус заявки, сервис заявок отправляет событие в Kafka, а сервис уведомлений пишет продавцу письмо. Сервисы не зависят друг от друга.

## Что внутри

```text
openapi/      REST API: методы, параметры, ответы
asyncapi/     Событие о смене статуса в Kafka
schemas/      Схемы данных
examples/     Примеры запросов, ответов и событий
docs/         Схема статусов
scripts/      Сборка документации и запуск демо
```

## Как запустить

Нужны Git и Node.js 22.

```bash
git clone https://github.com/viiktoriia0990-del/system-analyst-portfolio.git
cd system-analyst-portfolio/seller-verification
npm install
npm run demo
```

| Что | Адрес |
|---|---|
| Документация API (ReDoc) | http://localhost:8080 |
| Документация событий (AsyncAPI) | http://localhost:8080/asyncapi |
| Mock-сервер (Prism) | http://localhost:4010 |

Остановить демо: `control + C` в терминале.
