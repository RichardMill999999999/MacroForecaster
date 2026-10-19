"""Shared plumbing: feed download/parsing, Article model, translation, caching."""
from __future__ import annotations

import html
import logging
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from functools import lru_cache, wraps
import xml.etree.ElementTree as ET

import requests

log = logging.getLogger("newsfeeds")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; EconDashboard/1.0)"}
TAG_RE = re.compile(r"<[^>]+>")
ENGLISH = {"en", "english", ""}


@dataclass
class Article:
    title: str
    link: str
    summary: str
    published: str          # ISO-8601 UTC or ""
    source: str
    region: str
    country: str
    language: str           # original language
    category: str = ""
    image: str = ""
    origin: str = "rss"     # rss | newsdata
    note: str = ""          # e.g. "state-affiliated media"
    translated: bool = False
    title_original: str = ""
    summary_original: str = ""


# ---------------------------------------------------------------- helpers
def clean(text: str) -> str:
    text = TAG_RE.sub(" ", html.unescape(text or ""))
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def parse_date(value: str) -> str:
    if not value:
        return ""
    value = value.strip()
    try:
        dt = parsedate_to_datetime(value)
    except (TypeError, ValueError):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def ttl_cache(seconds: int):
    def deco(fn):
        store, lock = {}, threading.Lock()

        @wraps(fn)
        def wrapper(*a, **kw):
            key = (a, tuple(sorted(kw.items())))
            now = time.time()
            with lock:
                hit = store.get(key)
                if hit and now - hit[0] < seconds:
                    return hit[1]
            val = fn(*a, **kw)
            with lock:
                store[key] = (now, val)
            return val

        wrapper.clear = store.clear
        return wrapper
    return deco


# ---------------------------------------------------------------- RSS / Atom
@ttl_cache(600)
def download(url: str) -> bytes:
    r = requests.get(url, headers=HEADERS, timeout=15)
    r.raise_for_status()
    return r.content


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_feed(content: bytes) -> list[dict]:
    """Parses RSS 2.0, RSS 1.0/RDF and Atom into plain dicts."""
    root = ET.fromstring(content)
    out = []
    for el in root.iter():
        if _local(el.tag) not in ("item", "entry"):
            continue
        f = {}
        for ch in el:
            f.setdefault(_local(ch.tag), ch)

        def txt(*names):
            for n in names:
                e = f.get(n)
                if e is not None and (e.text or "").strip():
                    return e.text
            return ""

        link = ""
        le = f.get("link")
        if le is not None:
            link = le.attrib.get("href") or (le.text or "").strip()
        image = ""
        for n in ("content", "thumbnail", "enclosure"):
            e = f.get(n)
            if e is not None and e.attrib.get("url"):
                image = e.attrib["url"]
                break
        out.append({
            "title": clean(txt("title")),
            "link": link,
            "summary": clean(txt("description", "summary", "encoded", "content")),
            "published": parse_date(txt("pubDate", "published", "updated", "date")),
            "image": image,
        })
    return out


# ---------------------------------------------------------------- translation
@lru_cache(maxsize=5000)
def translate_text(text: str, target: str = "en") -> str:
    """Free Google web translation via deep-translator. Falls back to the original text."""
    if not text or not text.strip():
        return text
    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="auto", target=target).translate(text[:4500]) or text
    except Exception as e:  # network, rate limit, missing package
        log.warning("translation failed: %s", e)
        return text


def translate_articles(articles: list[Article], target: str = "en", workers: int = 8) -> None:
    todo = [a for a in articles if a.language.lower() not in ENGLISH]

    def work(a: Article):
        a.title_original, a.summary_original = a.title, a.summary
        t = translate_text(a.title, target)
        s = translate_text(a.summary[:600], target) if a.summary else ""
        a.translated = (t != a.title) or (s != a.summary[:600] and bool(s))
        a.title, a.summary = t, s or a.summary

    with ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(work, todo))


def matches(a: Article, query: str) -> bool:
    hay = f"{a.title} {a.summary} {a.title_original}".lower()
    return all(w in hay for w in query.lower().split())


# ---------------------------------------------------------------- feed fetching
def result(region: str, articles: list[Article], errors: list[dict]) -> dict:
    articles = sorted(articles, key=lambda a: a.published or "", reverse=True)
    return {"region": region, "count": len(articles),
            "articles": [asdict(a) for a in articles], "errors": errors}


def fetch_feeds(feeds: list[dict], region: str, limit_per_feed: int = 10,
                translate: bool = True, query: str | None = None) -> dict:
    """feeds: [{name,url,lang,country,category?,note?}]. One dead feed never breaks the rest."""
    articles, errors = [], []

    def work(feed):
        items = parse_feed(download(feed["url"]))[:limit_per_feed]
        return [Article(
            title=i["title"], link=i["link"], summary=i["summary"][:600],
            published=i["published"], source=feed["name"], region=region,
            country=feed.get("country", ""), language=feed.get("lang", "en"),
            category=feed.get("category", ""), image=i["image"], note=feed.get("note", ""),
        ) for i in items if i["title"]]

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(work, f): f for f in feeds}
        for fut in as_completed(futs):
            f = futs[fut]
            try:
                articles.extend(fut.result())
            except Exception as e:
                errors.append({"source": f["name"], "url": f["url"], "error": str(e)})
                log.warning("feed failed %s: %s", f["name"], e)

    if translate:
        translate_articles(articles)
    if query:
        articles = [a for a in articles if matches(a, query)]
    return result(region, articles, errors)
