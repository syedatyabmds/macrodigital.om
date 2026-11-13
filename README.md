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
│   ├── brand/         # favicon.svg (logo mark)
│   ├── fonts/         # Geist + Geist Mono (SIL OFL, vendored)
│   └── images/        # site imagery
└── .github/workflows/ # deploy workflow
```

The site has no build step and no external requests. Open `index.html` directly
in a browser to preview it offline.

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

### One-time server setup (done)

The site is already wired up on the server. For reference, the steps were:

```bash
# 1. Create the live folder (owned by the deploy user, group-writable)
sudo install -d -o deploy -g websites -m 2775 /opt/websites/sites/macrodigital.om

# 2. Add this block to /opt/websites/Caddyfile
#    macrodigital.om {
#        root * /srv/macrodigital.om      # /opt/websites/sites is mounted at /srv
#        encode gzip zstd
#        file_server
#    }

# 3. Validate and reload Caddy (zero downtime)
sudo docker exec caddy caddy validate --config /etc/caddy/Caddyfile
cd /opt/websites && sudo docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

`macrodigital.om` resolves to the Lightsail static IP `35.157.209.65`, so Caddy
obtains the TLS certificate automatically. The apex domain only — there is no
`www` record.

Manual deploy (fallback), if ever needed:

```bash
# Re-run the pipeline on the current main:
gh workflow run deploy.yml -R syedatyabmds/macrodigital.om

# Or clone fresh and rsync directly:
git clone https://github.com/syedatyabmds/macrodigital.om /tmp/macrodigital.om
rsync -az --delete \
  -e "ssh -i /home/ubuntu/.ssh/gh_deploy_key -o IdentitiesOnly=yes" \
  --exclude '.git/' --exclude '.github/' --exclude 'README.md' --exclude '.gitignore' \
  /tmp/macrodigital.om/ deploy@35.157.209.65:macrodigital.om/
```

## Contributing

1. Branch off `main`.
2. Make changes.
3. Open a pull request.

Do not put internal notes, prompts, or docs (e.g. `AGENTS.md`, `CLAUDE.md`,
`notes.txt`) in this repository — everything here is published to the public
website.
