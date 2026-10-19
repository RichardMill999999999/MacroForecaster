# news_fetcher.py
import requests
import xml.etree.ElementTree as ET
from urllib.parse import quote, urlparse
from bs4 import BeautifulSoup

try:
    import trafilatura  # best-in-class news extraction
    _HAS_TRAFILATURA = True
except ImportError:
    _HAS_TRAFILATURA = False

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch_article_text(url, timeout=12, max_chars=8000):
    """
    Fetch full article body from a URL.
    Tries trafilatura first (best for news), falls back to BeautifulSoup.
    Returns "" on failure. Truncates to max_chars.
    """
    if not url:
        return ""

    # --- Strategy 1: trafilatura ---
    if _HAS_TRAFILATURA:
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(
                    downloaded,
                    include_comments=False,
                    include_tables=False,
                    favor_precision=True,
                )
                if text and len(text) > 200:
                    return text[:max_chars]
        except Exception as e:
            print(f"[fetch] trafilatura failed for {url}: {e}")

    # --- Strategy 2: requests + BeautifulSoup ---
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()

        soup = BeautifulSoup(r.text, "html.parser")

        for tag in soup(
            ["script", "style", "nav", "footer", "aside",
             "form", "noscript", "iframe", "header"]
        ):
            tag.decompose()

        container = (
            soup.find("article")
            or soup.find("main")
            or soup.find(attrs={"role": "main"})
            or soup.body
        )

        if not container:
            return ""

        text = container.get_text(separator="\n", strip=True)

        # Drop obvious boilerplate lines
        lines = [
            ln.strip()
            for ln in text.splitlines()
            if len(ln.strip()) > 40
        ]
        return "\n".join(lines)[:max_chars]

    except Exception as e:
        print(f"[fetch] fallback failed for {url}: {e}")
        return ""


def search_related_news(title, limit=6):
    """
    Use Google News RSS (free, no key) to find other outlets
    covering the same story. Returns list of dicts.
    """
    if not title:
        return []

    # Trim to the core phrase — Google News handles long queries poorly
    query = title.strip()
    if len(query) > 140:
        query = query[:140]

    url = (
        "https://news.google.com/rss/search"
        f"?q={quote(query)}&hl=en-US&gl=US&ceid=US:en"
    )

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        root = ET.fromstring(r.content)

        out = []
        for item in root.iter("item"):
            title_txt = item.findtext("title") or ""
            link = item.findtext("link") or ""
            source_el = item.find("source")
            source = source_el.text if source_el is not None else ""
            pubdate = item.findtext("pubDate") or ""

            out.append({
                "title": title_txt,
                "link": link,
                "source": source,
                "published": pubdate,
            })

            if len(out) >= limit:
                break

        return out

    except Exception as e:
        print(f"[news search] failed: {e}")
        return []