# Развёртывание ROLLER.TJ

Как устроен прод, как выкатывать изменения и что делать, когда что-то сломалось.

---

## 1. Что где находится

| | |
|---|---|
| Сервер | Timeweb Cloud, Москва, тариф MSK-50 — 2 vCPU / 4 ГБ / 50 ГБ NVMe |
| ОС | Ubuntu 26.04 LTS |
| IP | `193.233.103.132` |
| Каталог проекта | `/opt/roller` (клон репозитория) |
| Рабочий пользователь | `deploy` (состоит в группах `sudo` и `docker`) |
| Реестр образов | GHCR — `ghcr.io/mor8t/roller-backend`, `ghcr.io/mor8t/roller-frontend` |
| Домен | `roller.tj` — в процессе переноса на Cloudflare |

### Почему образы собираются не на сервере

`next build` на пике требует 3–4 ГБ памяти — больше, чем есть у этой машины.
Поэтому образы собирает GitHub Actions, а сервер их только скачивает. Никогда
не запускайте `docker compose build` на сервере.

### Схема веток

```
dev, development, feature-*          main
   обычная работа,                    │  влить = выпустить релиз
   сборок нет                         ▼
                            GitHub Actions собирает
                                      │
                                      ▼
                            ghcr.io/... :latest
                                      │
                                      ▼
                                   сервер
```

**Собирается только `main`.** Всё остальное — `dev`, `development`, ветки под
задачи — обычная работа без побочных эффектов: ни образов, ни минут раннера,
ни малейшего влияния на сервер. Выкатить изменения означает влить их в `main`.

Собрать другую ветку вручную можно кнопкой «Run workflow» на вкладке Actions.
Такой прогон даст теги `sha-*` и по имени ветки, но никогда не `latest`.

Теги, которые ставит CI:

| Тег | Когда | Зачем |
|---|---|---|
| `sha-<короткий>` | всегда | неподвижный — для отката и воспроизводимого деплоя |
| `main` | при пуше в `main` | движется вместе с веткой |
| `latest` | при пуше в `main` | то, что работает на сервере |

---

## 2. Состав стека

Четыре контейнера, описаны в `docker-compose.prod.yml`:

| Сервис | Образ | Порты наружу |
|---|---|---|
| `db` | `postgres:17-alpine` | нет |
| `backend` | GHCR | нет |
| `frontend` | GHCR | нет |
| `nginx` | `nginx:1.27-alpine` | **80, 443** |

Порты публикует только nginx. Это не косметика: Docker пишет свои правила в
iptables **раньше** ufw, поэтому любая строка `ports:` делает сервис доступным
из интернета независимо от настроек файрвола. Остальные три общаются по
внутренней сети Compose.

### Тома

| Том | Что хранит | Восполнимо? |
|---|---|---|
| `postgres_data` | база | **нет** |
| `backend_uploads` | фото, загруженные через админку | **нет** |
| `next_image_cache` | оптимизированные картинки `next/image` | да, отстроится |
| `letsencrypt` | сертификаты | да, перевыпустятся |
| `certbot_webroot` | ACME-челленджи | да |

Первые два невосполнимы — только их и нужно резервировать.

### Маршрутизация nginx

| Путь | Куда |
|---|---|
| `/api/*` | `backend:8000` |
| `/uploads/*` | `backend:8000` (файлы отдаются мимо Node) |
| `/_next/static/*` | `frontend:3031`, кэш на год |
| `/.well-known/acme-challenge/*` | webroot certbot, **без редиректа на https** |
| всё остальное | `frontend:3031` |

Сайт, API и загрузки живут на одном origin — поэтому браузер никогда не делает
кросс-доменных запросов, и список CORS на бэкенде пуст.

---

## 3. Переменные окружения

Файл `/opt/roller/.env`, права `600`, в git не попадает. Шаблон —
`.env.prod.example`.

| Переменная | Назначение |
|---|---|
| `REGISTRY` | `ghcr.io/mor8t` |
| `IMAGE_TAG` | какую сборку запускать; в норме `latest`. **Обязательна** |
| `PUBLIC_ORIGIN` | публичный адрес сайта, без слэша на конце. **Обязательна** |
| `NGINX_SITE_SERVER_NAME` | `server_name` для nginx |
| `NGINX_SITE_SSL_CERT` / `_KEY` | пути к сертификату внутри контейнера |
| `POSTGRES_USER` / `_PASSWORD` / `_DB` | база |
| `SECRET_KEY` | подпись JWT (`openssl rand -hex 32`) |
| `INITIAL_ADMIN_*` | первый администратор, создаётся один раз на пустой базе |

`IMAGE_TAG` и `PUBLIC_ORIGIN` намеренно сделаны обязательными. Значение по
умолчанию `latest` однажды молча запустило устаревший образ, чьи миграции были
старше уже применённых к базе, и бэкенд ушёл в цикл перезапусков с сообщением
`Can't locate revision identified by ...`, никак не указывающим на настоящую
причину.

**Про `$` в значениях.** Compose трактует `$` как начало подстановки. В пароли
берите только буквы, цифры и `-_.` — иначе значение молча окажется другим.

### Что требует пересборки, а что нет

Всё, кроме `NEXT_PUBLIC_*`, читается в рантайме — правка `.env` плюс
`docker compose up -d` достаточно. Переменные с префиксом `NEXT_PUBLIC_`
Next.js вшивает в клиентский бандл на этапе сборки, для них нужен новый прогон CI.

---

## 4. Деплой

```bash
cd /opt/roller && ./scripts/deploy.sh
```

Скрипт делает `git pull`, скачивает образы, пересоздаёт изменившиеся
контейнеры, ждёт `healthy` и печатает логи того, что не поднялось.

Развёрнутый вариант, если нужно по шагам:

```bash
cd /opt/roller
git pull --ff-only
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Флаг `-f` обязателен. Простой `docker compose up` подхватил бы ещё и
`docker-compose.override.yml` — конфигурацию для разработки, с `--reload`,
монтированием исходников и публикацией Postgres наружу.

**Порядок такой:** сначала изменения влиты в `main`, затем сборка на вкладке
Actions стала зелёной, и только потом деплой. Иначе скачается предыдущий образ.

Пока ветка не влита в `main`, сборка не запускается вообще — это сделано
намеренно, чтобы работа в `dev` и `development` никак не задевала боевой сайт.

### Миграции

Отдельного шага нет. `backend/entrypoint.sh` выполняет `alembic upgrade head`
перед запуском uvicorn при каждом старте контейнера; на актуальной схеме это
пустая операция.

### Откат

```bash
cd /opt/roller
sed -i "s|^IMAGE_TAG=.*|IMAGE_TAG=sha-XXXXXXX|" .env
docker compose -f docker-compose.prod.yml up -d
```

Теги смотреть на https://github.com/MOR8T?tab=packages.

⚠️ **Откат кода не откатывает миграции.** Alembic автоматически идёт только
вперёд. Если в откатываемой версии была миграция, менявшая схему, нужен
отдельный `alembic downgrade`, а удалённые ею данные уже не вернуть. Отсюда
правило: миграции пишем аддитивными — добавить колонку, а не переименовать.

---

## 5. Домен и Cloudflare

Порядок, в котором это делается.

1. **Cloudflare:** завести зону `roller.tj`, выписать выданные NS.
2. **Записи в Cloudflare, до смены NS:** `A @` и `A www` → `193.233.103.132`,
   обе **Proxied**. Удалить импортированные записи на `176.57.67.160` (Tilda).
3. **SSL/TLS → `Full`.** Пока **не** `Full (strict)`: на сервере ещё
   самоподписанный сертификат, строгий режим отдал бы 526.
4. **Включить режим обслуживания** в `/admin/settings` — иначе в момент
   переключения посетители увидят незаполненный сайт вместо заглушки.
5. **Сменить NS у регистратора** на адреса Cloudflare — заменить целиком, не
   добавлять к существующим.
6. **Дождаться делегирования:** `dig roller.tj NS +short`.
7. **Выпустить сертификат** (см. ниже).
8. **Переключить nginx** — три строки в `.env`:
   ```
   NGINX_SITE_SERVER_NAME=roller.tj www.roller.tj
   NGINX_SITE_SSL_CERT=/etc/letsencrypt/live/roller.tj/fullchain.pem
   NGINX_SITE_SSL_KEY=/etc/letsencrypt/live/roller.tj/privkey.pem
   PUBLIC_ORIGIN=https://roller.tj
   ```
   затем `docker compose -f docker-compose.prod.yml up -d`.
9. **SSL/TLS → `Full (strict)`**, включить Always Use HTTPS.
10. **Замерить из Душанбе:** открыть `https://roller.tj/cdn-cgi/trace` и
    посмотреть поле `colo=`. Если трафик уходит во Франкфурт, проксирование
    может оказаться медленнее прямого соединения с Москвой — тогда для
    основного домена оранжевое облако имеет смысл выключить.
11. **Вернуть защиту** — раздел 7.

### Сертификаты

Первый выпуск:

```bash
cd /opt/roller && ./scripts/issue-letsencrypt.sh roller.tj admin@roller.tj
```

Скрипт сначала прогоняет `--dry-run`: Let's Encrypt жёстко ограничивает число
неудачных попыток (5 в час на домен), а самая частая причина неудачи —
неправильно настроенный webroot.

Автопродление — задание в cron пользователя `deploy`:

```cron
0 3 * * 1 cd /opt/roller && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload
```

Используется webroot-челлендж, поэтому останавливать nginx для продления не нужно.

### Диапазоны Cloudflare

За Cloudflare каждый запрос приходит с его адреса, и без настройки в логах,
лимитах и fail2ban оказался бы IP Cloudflare, а не посетителя — первый же
перебор забанил бы сам Cloudflare и положил сайт целиком. Список диапазонов
лежит в `nginx/includes/cloudflare-realip.inc`. Когда Cloudflare его меняет:

```bash
cd /opt/roller && ./scripts/update-cloudflare-ips.sh
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 6. Наполнение сайта

Сиды создают при первом старте: администратора, страницу «О компании»,
таймлайн, сертификаты, контакты, соцсети, 6 категорий продукции, 6 продуктов,
настройки калькулятора и 55 схем.

Через админку заполняются: слайды главной, партнёры, новости, шоурумы, фото
категорий. Сидов у них нет — по замыслу, это содержимое клиента.

Админка: `/admin`, вход под `INITIAL_ADMIN_USERNAME`. Публичная часть при
включённом режиме обслуживания закрыта, `/admin`, `/login` и `/api` — нет.

---

## 7. ⚠️ Чеклист перед публикацией

**На время настройки защита сервера намеренно ослаблена.** До того, как сайт
станет публичным, нужно вернуть всё перечисленное.

- [ ] **Файрвол.** Сейчас `ufw` выключен.
      ```bash
      sudo ufw default deny incoming && sudo ufw default allow outgoing
      sudo ufw allow 22/tcp
      sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
      sudo ufw --force enable
      ```
      Если сайт работает за проксированным Cloudflare, 80 и 443 стоит открыть
      только его диапазонам — список в `nginx/includes/cloudflare-realip.inc`.
- [ ] **Вход по паролю.** Сейчас включён — включался, чтобы заходить с других
      устройств. Правильнее добавить ключ каждого устройства в
      `~/.ssh/authorized_keys` и вернуть:
      ```bash
      sudo tee /etc/ssh/sshd_config.d/00-hardening.conf > /dev/null <<'EOF'
      PermitRootLogin no
      PasswordAuthentication no
      PubkeyAuthentication yes
      EOF
      sudo sshd -t && sudo systemctl restart ssh
      ```
      Имя файла с префиксом `00-` существенно: в `sshd_config` побеждает первое
      встреченное значение, а провайдер кладёт свой `50-cloud-init.conf`.
- [ ] **fail2ban** установлен и `sudo fail2ban-client status sshd` отвечает.
      В `jail.local` обязателен `backend = systemd` — в Ubuntu 26.04 нет
      `/var/log/auth.log`.
- [ ] **Порт 10050** (`zabbix_agentd`, мониторинг Timeweb) закрыт или открыт
      только адресу их системы мониторинга.
- [ ] **Пароль администратора** сменён с того, что задавался при установке.
- [ ] **Бэкапы настроены** — раздел 8.
- [ ] **`IMAGE_TAG=latest`** в `/opt/roller/.env`.
- [ ] **Режим обслуживания выключен.**

---

## 8. Бэкапы

**Не настроены.** Невосполнимы два тома: `postgres_data` и `backend_uploads`.
Дамп базы:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > backup-$(date +%F).sql.gz
```

Архив загруженных файлов:

```bash
docker run --rm -v roller_backend_uploads:/data -v "$PWD":/out alpine \
  tar czf /out/uploads-$(date +%F).tar.gz -C /data .
```

Дополнительно в панели Timeweb включены снапшоты машины — но это копия всего
сервера, а не версионированные копии данных, и одно другого не заменяет.

---

## 9. Что делать, когда сломалось

**Бэкенд перезапускается по кругу, в логах `Can't locate revision identified by`.**
Образ старше базы: в `alembic_version` стоит ревизия, которой нет в образе.
Проверьте `IMAGE_TAG` — он указывает на устаревшую сборку. Поставьте актуальный
тег и перезапустите.

**nginx не стартует, `cannot load certificate`.** Нет файла по пути из
`NGINX_SITE_SSL_CERT`. До выпуска Let's Encrypt его создаёт
`./scripts/gen-selfsigned-cert.sh <ip-или-домен>`; сертификаты в git не хранятся.

**Cloudflare отдаёт 526.** Режим `Full (strict)` при самоподписанном
сертификате на сервере. Либо выпустить Let's Encrypt, либо временно вернуть `Full`.

**Let's Encrypt не выпускает.** Проверьте, что `/.well-known/acme-challenge/`
отвечает, а не редиректится на https:
```bash
curl -sI http://roller.tj/.well-known/acme-challenge/test
```
Ожидается 404, а не 301.

**Загрузка фото в админке отдаёт 413.** `client_max_body_size` в
`nginx/includes/app-locations.inc` меньше размера файла. Сейчас 12 МБ — под
`bodySizeLimit` из `next.config.ts`.

**Кончилось место.** Логи Docker ограничены (10 МБ × 3 на контейнер), обычно
виноваты старые образы:
```bash
docker image prune -a -f
```

**Общий осмотр:**
```bash
cd /opt/roller
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail 50 backend
df -h / && free -h
```

---

## 10. Локальная разработка

Локально — **dev-стек**, не прод:

```bash
docker compose up -d --build
```

Собирается из ваших исходников, поэтому миграции всегда совпадают с базой.
Сайт на `http://localhost:3031`, API на `:8000`.

Прод-стек локально запускать не нужно: он тянет образы под `linux/amd64`
(на Apple Silicon это эмуляция), требует сертификат, а главное — использует
тот же том с базой, что и dev-стек, и при расхождении версий бэкенд падает.
