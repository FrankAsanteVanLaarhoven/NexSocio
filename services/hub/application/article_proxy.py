import re
from html import unescape
from typing import Any
from urllib.parse import urlparse

import httpx

ALLOWED_HOSTS = (
    "finance.yahoo.com",
    "www.finance.yahoo.com",
    "news.yahoo.com",
    "www.yahoo.com",
    "techcrunch.com",
    "www.bbc.com",
    "www.bbc.co.uk",
    "reuters.com",
    "www.reuters.com",
    "bloomberg.com",
    "www.bloomberg.com",
)


class ArticleProxy:
    def __init__(self, user_agent: str):
        self.headers = {"User-Agent": user_agent}

    def _allowed(self, url: str) -> bool:
        try:
            host = urlparse(url).netloc.lower()
            return any(host == h or host.endswith("." + h) for h in ALLOWED_HOSTS)
        except Exception:
            return False

    async def fetch(self, url: str) -> dict[str, Any]:
        if not self._allowed(url):
            raise ValueError("URL not allowed for in-app reading")

        async with httpx.AsyncClient(timeout=15.0, headers=self.headers, follow_redirects=True) as client:
            res = await client.get(url)
            res.raise_for_status()
            html = res.text

        title = self._extract_title(html) or "Article"
        content = self._extract_content(html)
        if not content:
            content = f'<p class="text-[#8A8A8A]">Preview unavailable. <a href="{url}">Open source</a></p>'

        return {
            "title": unescape(title),
            "content_html": content,
            "source_url": url,
            "publisher": urlparse(url).netloc.replace("www.", ""),
        }

    def _extract_title(self, html: str) -> str | None:
        for pattern in [
            r"<meta[^>]+property=[\"']og:title[\"'][^>]+content=[\"']([^\"']+)",
            r"<title>([^<]+)</title>",
        ]:
            m = re.search(pattern, html, re.I)
            if m:
                return m.group(1).strip()
        return None

    def _extract_content(self, html: str) -> str:
        patterns = [
            r"<article[^>]*>(.*?)</article>",
            r'<div[^>]+class="[^"]*article-body[^"]*"[^>]*>(.*?)</div>',
            r'<div[^>]+class="[^"]*caas-body[^"]*"[^>]*>(.*?)</div>',
        ]
        for pattern in patterns:
            m = re.search(pattern, html, re.I | re.S)
            if m:
                return self._sanitize(m.group(1))
        paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", html, re.I | re.S)
        if paragraphs:
            top = "".join(f"<p>{self._strip_tags(p)}</p>" for p in paragraphs[:12])
            return self._sanitize(top)
        return ""

    def _strip_tags(self, text: str) -> str:
        return unescape(re.sub(r"<[^>]+>", "", text)).strip()

    def _sanitize(self, html: str) -> str:
        html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.I | re.S)
        html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.I | re.S)
        html = re.sub(r"on\w+=[\"'][^\"']*[\"']", "", html, flags=re.I)
        return html[:50_000]