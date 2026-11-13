# macrodigital.om

Static source for **https://macrodigital.om**, served by Caddy on our AWS Lightsail host
(the same multi-site setup that serves muscataimarkets.om).

This repository is the source of truth for the site content. The live copy on the
server (`/opt/websites/sites/macrodigital.om/`) is a **deploy target** — do not
edit it by hand, edit here and deploy.

## Layout

```
.
├── index.html
├── styles.css
├── script.js
├── assets/
│   ├── brand/         # logo, favicons (favicon-32.png, favicon-64.png, apple-touch-icon.png)
│   ├── images/        # site imagery
│   └── vendor/        # third-party css/js/fonts (Tailwind, AOS, Font Awesome, Plus Jakarta Sans)
└── .github/workflows/ # deploy workflow
```

## Deploying

Pushing to `main` (i.e. merging a pull request) runs `.github/workflows/deploy.yml`,
which rsyncs this repository's files to the live folder on the server.

**Mapping rule:** the repository name is the domain and the live folder — this
repo deploys to `/opt/websites/sites/macrodigital.om/`.

Static content is served straight off the bind mount, so no web-server reload is
required for content changes. Adding the site to Caddy for the first time does
need a Caddyfile block and a reload (see below).

### Required repository secrets

Set these under **Settings → Secrets and variables → Actions** (same values/pattern
as muscataimarkets.om):

| Secret               | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `DEPLOY_SSH_KEY`     | Private key whose public half is in the deploy user's `authorized_keys` (rrsync-jailed to `/opt/websites/sites`) |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan` output for the server                          |
| `DEPLOY_HOST`        | Server hostname / IP                                         |
| `DEPLOY_USER`        | Deploy user                                                  |

### One-time server setup

```bash
# 1. Create the live folder
sudo mkdir -p /opt/websites/sites/macrodigital.om

# 2. Add a site block to the Caddyfile, e.g.
#    macrodigital.om, www.macrodigital.om {
#        root * /srv/sites/macrodigital.om   # path as seen inside the Caddy container
#        file_server
#        encode zstd gzip
#    }
#    (mirror whatever the muscataimarkets.om block uses)

# 3. Reload Caddy
```

Point the `macrodigital.om` (and `www`) DNS A records at the Lightsail static IP
so Caddy can obtain the TLS certificate.

Manual deploy (from the server), if ever needed:

```bash
rsync -az --delete /home/ubuntu/work_area/macrodigital.om/ \
  /opt/websites/sites/macrodigital.om/
```

## Contributing

1. Branch off `main`.
2. Make changes.
3. Open a pull request.

Do not put internal notes, prompts, or docs (e.g. `AGENTS.md`, `CLAUDE.md`,
`notes.txt`) in this repository — everything here is published to the public
website.
