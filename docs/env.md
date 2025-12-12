## Environment Variables

Set the following variables to keep local/test and production credentials separate.  
`NEXT_PUBLIC_APP_ENV` (or `APP_ENV`) controls which set is used at runtime.  
`NEXT_PUBLIC_JIRA_ENVIRONMENT`/`JIRA_ENV` are optional aliases; any of them set to `prod` switches the app to production credentials.

| Variable                                    | Local / Preview (`test`)                | Production (`prod`)                                 | Notes                                             |
| ------------------------------------------- | --------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV` / `APP_ENV`           | `test`                                  | `prod`                                              | Controls which suffix (`_TEST` / `_PROD`) is read |
| `NEXT_PUBLIC_JIRA_ENVIRONMENT` / `JIRA_ENV` | `test`                                  | `prod`                                              | Optional aliases for Jira; same behavior as above |
| `NEXT_PUBLIC_SUPABASE_URL_TEST`             | Supabase project URL                    | –                                                   | Preview/local                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST`        | Supabase anon key                       | –                                                   | Preview/local                                     |
| `SUPABASE_SERVICE_ROLE_KEY_TEST`            | Supabase service-role key               | –                                                   | Preview/local                                     |
| `NEXT_PUBLIC_SUPABASE_URL_PROD`             | –                                       | Supabase project URL                                | Production                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD`        | –                                       | Supabase anon key                                   | Production                                        |
| `SUPABASE_SERVICE_ROLE_KEY_PROD`            | –                                       | Supabase service-role key                           | Production                                        |
| `JIRA_CLIENT_ID_TEST`                       | Atlassian OAuth client id (dev app)     | –                                                   | Preview/local                                     |
| `JIRA_CLIENT_SECRET_TEST`                   | Atlassian OAuth client secret (dev app) | –                                                   | Preview/local                                     |
| `NEXT_PUBLIC_APP_URL_TEST`                  | `http://localhost:3000`                 | –                                                   | Redirect base for dev                             |
| `JIRA_CLIENT_ID_PROD`                       | –                                       | Atlassian OAuth client id (prod app)                | Production                                        |
| `JIRA_CLIENT_SECRET_PROD`                   | –                                       | Atlassian OAuth client secret (prod app)            | Production                                        |
| `NEXT_PUBLIC_APP_URL_PROD`                  | –                                       | `https://teamhubx-web.vercel.app` (or custom domain) | Redirect base for prod                            |

### Local setup (`.env.local`)

```bash
NEXT_PUBLIC_APP_ENV=test
APP_ENV=test

NEXT_PUBLIC_SUPABASE_URL_TEST=...
NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST=...
SUPABASE_SERVICE_ROLE_KEY_TEST=...

JIRA_CLIENT_ID_TEST=...
JIRA_CLIENT_SECRET_TEST=...
NEXT_PUBLIC_APP_URL_TEST=http://localhost:3000
```

### Vercel (Production Environment tab)

```bash
NEXT_PUBLIC_APP_ENV=prod
APP_ENV=prod

NEXT_PUBLIC_SUPABASE_URL_PROD=...
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=...
SUPABASE_SERVICE_ROLE_KEY_PROD=...

JIRA_CLIENT_ID_PROD=...
JIRA_CLIENT_SECRET_PROD=...
NEXT_PUBLIC_APP_URL_PROD=https://teamhubx-web.vercel.app
```

Preview deployments can either copy the test values above or override with their own `_TEST` entries.

## Env Değerleri

Hem lokal geliştirme hem de Vercel prod ortamında tek set değişkene ihtiyacımız var.

```
NEXT_PUBLIC_SUPABASE_URL=<Supabase Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>

JIRA_CLIENT_ID=<Atlassian OAuth client id>
JIRA_CLIENT_SECRET=<Atlassian OAuth client secret>
JIRA_BASE_URL=<örn. teamhubx.atlassian.net>   # opsiyonel; kullanıcı verisi yoksa fallback
NEXT_PUBLIC_APP_URL=<https://teamhubx-web.vercel.app>  # OAuth redirect base

NEXT_PUBLIC_SITE_URL=<https://teamhubx-web.vercel.app> # robots/sitemap için
```

`.env.local` dosyanıza aynı değerleri girin, Vercel → Production sekmesine de birebir kopyalayın. Prod/test ayrımı yok; tüm kod bu isimleri bekliyor.
