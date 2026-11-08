"""Package browser runtime files for GitHub Pages, including project subpaths."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import hashlib
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '_site'
MEDIA = {'.png', '.svg', '.webp', '.jpg', '.jpeg', '.ico', '.woff', '.woff2', '.mp3', '.ogg'}


def local_target(value, parent):
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return None
    if url.path.startswith('/'):
        raise ValueError(f'Root-relative URL will break project Pages: {value}')
    target = (parent / unquote(url.path)).resolve()
    if not target.is_relative_to(OUTPUT.resolve()) or not target.exists():
        raise ValueError(f'Missing published resource: {value}')
    return target


class PageLinks(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'href', 'src'} and value:
                local_target(value, OUTPUT)


def version_assets(match):
    attribute, relative = match.group(1), match.group(2)
    digest = hashlib.sha256((OUTPUT / relative).read_bytes()).hexdigest()[:12]
    return f'{attribute}="{relative}?v={digest}"'


def build():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for item in sorted(ROOT.iterdir()):
        if item.is_file() and item.suffix in {'.html', '.css', '.js'}:
            shutil.copy2(item, OUTPUT / item.name)
    for item in (ROOT / 'assets').rglob('*'):
        if item.is_file() and item.suffix.lower() in MEDIA:
            target = OUTPUT / item.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
    (OUTPUT / '.nojekyll').write_text('')
    for page in OUTPUT.glob('*.html'):
        html = re.sub(r'(src|href)="([^"?:]+\.(?:js|css))(?:\?[^"\s]*)?"', version_assets, page.read_text())
        page.write_text(html)
        PageLinks().feed(html)
    for css in OUTPUT.glob('*.css'):
        for value in re.findall(r'url\([\'"]?([^\'"\)]+)[\'"]?\)', css.read_text()):
            local_target(value, css.parent)
    for script in OUTPUT.glob('*.js'):
        for asset in re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:png|svg)', script.read_text()):
            local_target(asset, OUTPUT)
    files = [p for p in OUTPUT.rglob('*') if p.is_file()]
    print(f'Built {len(files)} files, {sum(p.stat().st_size for p in files) / 1048576:.1f} MiB -> {OUTPUT}')


if __name__ == '__main__':
    build()
