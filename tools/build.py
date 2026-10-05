#!/usr/bin/env python3
"""Generate the per-page files for GitHub Pages from index.html.

index.html is the site: it contains the whole app and is also the home page. GitHub Pages can only
serve real files, so each address (/work/ownit, /aboutresume, ...) gets its own copy of index.html
with that page's title, description and social-preview image in the <head>. The app then draws the
right page from the address. Run this after editing index.html or the project list:

    python3 tools/build.py
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://liamowen.org"
TODAY = "2026-10-05"

src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()


def unesc(t):
    return re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), t).replace("\\'", "'")


# ---- read the project list out of index.html so titles and copy never drift ----
projects = []
start = src.index("const projects = [")
block = src[start:src.index("\n];", start)]
for chunk in block.split("{ slug:'")[1:]:
    slug = chunk.split("'", 1)[0]

    def grab(key):
        m = re.search(key + r":'((?:[^'\\]|\\.)*)'", chunk)
        return unesc(m.group(1)) if m else ""

    body = re.search(r"body:\['((?:[^'\\]|\\.)*)'", chunk)
    projects.append({
        "slug": slug, "title": grab("title"), "dir": grab("dir"), "hero": grab("hero"),
        "lede": grab("lede"), "body0": unesc(body.group(1)) if body else "",
    })

HOME_TITLE = "Liam Owen, Digital Designer"
HOME_DESC = "Liam Owen is a digital designer working across product launches, packaging, brand campaigns and web. Currently at Arccos Golf."
routes = [
    ("aboutresume", "About & Resume | Liam Owen",
     "Digital designer and University of South Carolina graduate. Experience, skills, tools, awards and a few things I like.",
     "images/about/liam-golf.jpg"),
    ("contact", "Contact | Liam Owen", "Get in touch with Liam Owen.", "images/hero/hero.jpg"),
]
for p in projects:
    desc = (p["lede"] + " " + p["body0"]).strip()[:190]
    routes.append((f"work/{p['slug']}", f"{p['title']} | Liam Owen", desc, f"images/{p['dir']}/{p['hero']}.jpg"))


def page(title, desc, path, img, noindex=False):
    out = src
    q = lambda s: html.escape(s, quote=True)
    url = SITE + path
    out = re.sub(r"<title>.*?</title>", lambda m: f"<title>{q(title)}</title>", out, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{q(desc)}">', out, count=1)
    out = re.sub(r'<meta property="og:title" content="[^"]*">', lambda m: f'<meta property="og:title" content="{q(title)}">', out, count=1)
    out = re.sub(r'<meta property="og:description" content="[^"]*">', lambda m: f'<meta property="og:description" content="{q(desc)}">', out, count=1)
    out = re.sub(r'<meta property="og:image" content="[^"]*">', lambda m: f'<meta property="og:image" content="{SITE}/{img}">', out, count=1)
    out = re.sub(r'<meta property="og:url" content="[^"]*">', lambda m: f'<meta property="og:url" content="{url}">', out, count=1)
    out = re.sub(r'<link rel="canonical" href="[^"]*">', lambda m: f'<link rel="canonical" href="{url}">', out, count=1)
    if noindex:
        out = out.replace('<meta name="color-scheme"', '<meta name="robots" content="noindex">\n<meta name="color-scheme"', 1)
    return out


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(text)


for path, title, desc, img in routes:
    write(f"{path}/index.html", page(title, desc, "/" + path, img))

# /work on its own shows the home page (the app swaps the address back to /)
write("work/index.html", page(HOME_TITLE, HOME_DESC, "/", "images/hero/hero.jpg"))
# any unknown address: GitHub Pages serves this file with a 404; the app swaps the address back to /
write("404.html", page(HOME_TITLE, HOME_DESC, "/", "images/hero/hero.jpg", noindex=True))

urls = [SITE + "/"] + [f"{SITE}/{p}" for p, *_ in routes]
write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + "".join(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n")
write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

print(f"built {len(routes)} pages + work/, 404.html, sitemap.xml, robots.txt")
for path, title, desc, img in routes:
    print(f"  /{path:28} {title}")
