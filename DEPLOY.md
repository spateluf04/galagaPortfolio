# Portfolio Launch Sequence

Getting `galagaPortfolio` onto Netlify with a working contact form, then onto a
free student domain. Nine steps in two phases — five you can finish today, four
that wait on GitHub Education approval.

| | |
|---|---|
| **Repo** | `github.com/spateluf04/galagaPortfolio` — already exists, `main` tracks `origin` |
| **Host** | Netlify — build settings pinned in `netlify.toml` |
| **Form mail** | sampatel0803@gmail.com |

---

## The contact form needs no code

Netlify Forms is already wired into `index.html` (`data-netlify="true"`, honeypot
`_gotcha`), and those attributes were confirmed to survive the production build.
Making it email you is a dashboard toggle — **step 4** — not a backend.

Skip Formspree and EmailJS. They add a third-party dependency you don't need, and
EmailJS would ship a sendable API key in your client bundle. One bonus you get for
free: the form has a field named exactly `email`, which Netlify uses as the
notification's **Reply-To**, so hitting reply in Gmail answers the sender directly.

---

# Phase 1 — Today

*Nothing here waits on anyone. Ends with a live, working site.*

## 1. Commit what's only on your machine — `TERMINAL`

Twelve files are uncommitted, and five of them are new and load-bearing. Netlify
builds from the repo, so anything unpushed simply won't exist — you'd get a green
deploy of a site missing its résumé, social image, and project dialog.

```bash
# confirm the build is clean before pushing anything
npm run build

# stage the seven modified files
git add -u

# stage the five new ones (start.md is scratch — leave it out)
git add netlify.toml public/og-image.png public/resume.pdf \
        src/project-modal.ts src/styles/project-modal.css

# verify start.md is NOT staged, then ship it
git status --short
git commit -m "Add Netlify config, resume, OG image, and project dialog"
git push
```

`dist/` and `node_modules/` are correctly gitignored — Netlify runs the build itself.

## 2. Start the GitHub Education application — `GITHUB`

**Do this second, not fifth.** Approval ranges from minutes to several days, and
it's the only thing gating Phase 2. Starting it now means it approves in the
background while you finish everything else.

Apply at [education.github.com](https://education.github.com) using your real UF
address — whichever one is actually on your account. Have a student ID photo or a
class schedule showing current enrollment ready to upload.

## 3. Import the repo into Netlify — `NETLIFY`

Sign in with GitHub, then **Add new site → Import an existing project → GitHub →
galagaPortfolio**.

Don't touch the build fields. `netlify.toml` already pins the build command,
publish directory, and Node 22, and **it overrides anything you set in the UI** —
so changing settings in the dashboard just creates a silent mismatch. Leave base
directory blank.

Deploy, then open the temporary `*.netlify.app` URL and check the fonts, the pixel
art, the project dialog, and that DOWNLOAD RESUME actually returns a PDF.

## 4. Point the contact form at your inbox — `NETLIFY`

This is the step that makes the form email you.

- Go to **Site configuration → Forms**. A form named `contact` should be listed —
  Netlify's build bot detects it from the deployed HTML.
- Open **Form notifications → Add notification → Email notification**.
- Send to `sampatel0803@gmail.com`. Save.
- Submit the form on your live site as a real test, then confirm the mail arrives
  and that *Reply* addresses the sender rather than Netlify.

> **If no form is listed:** detection ran at build time and failed — the
> notification setting won't help. Confirm `index.html` was actually pushed in
> step 1, then redeploy. Submissions only start recording *after* a build in which
> the form was detected.

## 5. Retire the GitHub Pages workflow — `GITHUB`

`.github/workflows/deploy.yml` still fires on every push to `main`. Once Netlify is
live you'd have two public copies of the site — one where the contact form works,
one where it always falls back to showing your email — plus duplicate content split
across two domains.

Recommended: delete it. Easy to restore from git history.

```bash
git rm .github/workflows/deploy.yml
git commit -m "Deploy via Netlify only"
git push
```

---

# Phase 2 — After approval

*Blocked on step 2. The site is already live and working before any of this.*

## 6. Claim the free domain — `REGISTRAR`

Open your Student Pack benefits and pick one registrar — Namecheap has offered a
free `.me` for a year, Name.com `.dev` and `.app`. Verify the current offer when you
get there; the lineup shifts.

Authorize the registrar to read your GitHub account, search your name, register.
**Put the renewal date in your calendar immediately** — the free period is one year,
and a lapsed domain takes the site down.

## 7. Point the domain at Netlify — `NETLIFY`

In Netlify: **Domain management → Add a domain**, enter the name you registered.
Netlify hands you four nameservers.

In the registrar dashboard, switch the domain from default DNS to **Custom DNS** and
paste all four. Letting Netlify run DNS is less error-prone than hand-managing A and
CNAME records.

## 8. Replace the placeholder domain in the meta tags — `TERMINAL`

Easy to forget, and it silently breaks every link you share. `index.html` carries a
placeholder origin in **five places** — canonical, `og:url`, `og:image`, and the
Twitter tags. Open Graph requires absolute URLs, so until this is real, a link pasted
into LinkedIn renders as bare text and the generated OG image never appears.

```bash
# swap YOURDOMAIN.me for the real one
sed -i 's|https://samirpatel.netlify.app|https://YOURDOMAIN.me|g' index.html

# the leftover comment above the tags can go too
npm run build
git commit -am "Point social tags at the live domain"
git push
```

## 9. Confirm HTTPS, then set the primary domain — `NETLIFY`

Nameserver changes usually resolve within an hour but can take up to 48. Once
Netlify's domain panel stops warning about DNS, check that the Let's Encrypt
certificate provisioned on its own — it's automatic, but it won't fire until DNS
resolves.

Then set the custom domain as **primary**, so the `.netlify.app` URL redirects to it
instead of serving a second indexable copy.

---

# Final pass

Run against the real domain before sending it to anyone.

- [ ] DOWNLOAD RESUME returns a 61 KB PDF, not a 404
- [ ] Contact form submits and the mail lands in Gmail
- [ ] Reply on that mail addresses the sender, not Netlify
- [ ] Paste the URL into LinkedIn or Slack — the arcade OG card renders
- [ ] GITHUB and LINKEDIN buttons both open the right profiles
- [ ] All four project cards open their MISSION BRIEF dialog
- [ ] The `.netlify.app` URL redirects to the custom domain
- [ ] Load it on a phone: no sideways scrolling anywhere

---

## Why there is no catch-all redirect

The catch-all `/* /index.html 200` rule was deliberately removed from
`netlify.toml`, and `public/_redirects` should not be added either.

This site is a single page whose only navigation is hash links, which never reach
the server — so the rewrite buys nothing and actively breaks the form's safety net.
A catch-all 200 answers *any* unhandled POST with a success status, so if form
detection ever failed, `initContactForm()` in `src/main.ts` would see `res.ok` and
tell the visitor "message received" for a submission nobody recorded. Without the
rewrite, an undetected POST returns an error status and the code correctly falls
back to showing the email address.
