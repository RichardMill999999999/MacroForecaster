"""One feed table + one public function per region.

Every fetch_<region>() can be called on its own from anywhere in the project, and is also
registered in newsfeeds.REGIONS so the aggregator can run them all.

Feed URLs change over time. A dead feed is reported in result["errors"] and skipped,
so just edit the tables below when one breaks.
"""
from __future__ import annotations

from .core import fetch_feeds

STATE = "state-affiliated media: read for the government's framing"
EXILE = "independent outlet operating from exile; considered 'undesirable' by Russian authorities"

# ------------------------------------------------------------------ UNITED STATES
US_FEEDS = [
    {"name": "NYT Home", "url": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", "lang": "en", "country": "US"},
    {"name": "NYT Business", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", "lang": "en", "country": "US", "category": "business"},
    {"name": "NYT Economy", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml", "lang": "en", "country": "US", "category": "economy"},
    {"name": "NYT World", "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "lang": "en", "country": "US", "category": "world"},
    {"name": "NYT DealBook", "url": "https://rss.nytimes.com/services/xml/rss/nyt/Dealbook.xml", "lang": "en", "country": "US", "category": "markets"},
    {"name": "NPR Business", "url": "https://feeds.npr.org/1006/rss.xml", "lang": "en", "country": "US", "category": "business"},
    {"name": "CNBC Economy", "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", "lang": "en", "country": "US", "category": "economy"},
    {"name": "MarketWatch", "url": "https://feeds.content.dowjones.io/public/rss/mw_topstories", "lang": "en", "country": "US", "category": "markets"},
    {"name": "Federal Reserve press", "url": "https://www.federalreserve.gov/feeds/press_all.xml", "lang": "en", "country": "US", "category": "central bank"},
]

# ------------------------------------------------------------------ CHINA / HONG KONG
CHINA_FEEDS = [
    # SCMP section ids: confirm at https://www.scmp.com/rss
    {"name": "SCMP China", "url": "https://www.scmp.com/rss/4/feed", "lang": "en", "country": "CN", "category": "china"},
    {"name": "SCMP Economy", "url": "https://www.scmp.com/rss/92/feed", "lang": "en", "country": "CN", "category": "economy"},
    {"name": "SCMP Business", "url": "https://www.scmp.com/rss/91/feed", "lang": "en", "country": "CN", "category": "business"},
    {"name": "China Daily Business", "url": "http://www.chinadaily.com.cn/rss/bizchina_rss.xml", "lang": "en", "country": "CN", "category": "business", "note": STATE},
    {"name": "Global Times", "url": "https://www.globaltimes.cn/rss/outbrain.xml", "lang": "en", "country": "CN", "note": STATE},
    {"name": "CGTN Business", "url": "https://www.cgtn.com/subscribe/rss/section/business.xml", "lang": "en", "country": "CN", "category": "business", "note": STATE},
    # Chinese-language, translated automatically
    {"name": "Sina Finance", "url": "https://rss.sina.com.cn/roll/finance/hot_roll.xml", "lang": "zh", "country": "CN", "category": "finance"},
]

# ------------------------------------------------------------------ EUROPE
EUROPE_FEEDS = [
    {"name": "DW Europe", "url": "https://rss.dw.com/xml/rss-en-eu", "lang": "en", "country": "DE"},
    {"name": "DW Business", "url": "https://rss.dw.com/xml/rss-en-bus", "lang": "en", "country": "DE", "category": "business"},
    {"name": "France 24 Europe", "url": "https://www.france24.com/en/europe/rss", "lang": "en", "country": "FR"},
    {"name": "Euronews Business", "url": "https://www.euronews.com/rss?level=theme&name=business", "lang": "en", "country": "EU", "category": "business"},
    {"name": "BBC Europe", "url": "https://feeds.bbci.co.uk/news/world/europe/rss.xml", "lang": "en", "country": "GB"},
    {"name": "Guardian Europe", "url": "https://www.theguardian.com/world/europe-news/rss", "lang": "en", "country": "GB"},
    {"name": "Spiegel International", "url": "https://www.spiegel.de/international/index.rss", "lang": "en", "country": "DE"},
    {"name": "ECB press", "url": "https://www.ecb.europa.eu/rss/press.xml", "lang": "en", "country": "EU", "category": "central bank"},
    # Native-language, translated automatically
    {"name": "Le Monde Economie", "url": "https://www.lemonde.fr/economie/rss_full.xml", "lang": "fr", "country": "FR", "category": "economy"},
    {"name": "Tagesschau Wirtschaft", "url": "https://www.tagesschau.de/wirtschaft/index~rss2.xml", "lang": "de", "country": "DE", "category": "economy"},
    {"name": "El Pais Economia", "url": "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada", "lang": "es", "country": "ES", "category": "economy"},
]

# ------------------------------------------------------------------ AFRICA
AFRICA_FEEDS = [
    {"name": "BBC Africa", "url": "https://feeds.bbci.co.uk/news/world/africa/rss.xml", "lang": "en", "country": "GB"},
    {"name": "Africanews", "url": "https://www.africanews.com/feed/rss", "lang": "en", "country": "CG"},
    {"name": "allAfrica", "url": "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", "lang": "en", "country": "ZA"},
    {"name": "Daily Maverick", "url": "https://www.dailymaverick.co.za/dmrss/", "lang": "en", "country": "ZA"},
    {"name": "Mail & Guardian", "url": "https://mg.co.za/feed/", "lang": "en", "country": "ZA"},
    {"name": "Premium Times", "url": "https://www.premiumtimesng.com/feed", "lang": "en", "country": "NG"},
    {"name": "Jeune Afrique", "url": "https://www.jeuneafrique.com/feed/", "lang": "fr", "country": "FR", "category": "africa"},
]

# ------------------------------------------------------------------ INDIA
INDIA_FEEDS = [
    {"name": "Economic Times Top", "url": "https://economictimes.indiatimes.com/rssfeedstopstories.cms", "lang": "en", "country": "IN", "category": "business"},
    {"name": "Economic Times Economy", "url": "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms", "lang": "en", "country": "IN", "category": "economy"},
    {"name": "Times of India Business", "url": "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", "lang": "en", "country": "IN", "category": "business"},
    {"name": "The Hindu Business", "url": "https://www.thehindu.com/business/feeder/default.rss", "lang": "en", "country": "IN", "category": "business"},
    {"name": "Mint Economy", "url": "https://www.livemint.com/rss/economy", "lang": "en", "country": "IN", "category": "economy"},
    {"name": "BBC Hindi", "url": "https://feeds.bbci.co.uk/hindi/rss.xml", "lang": "hi", "country": "IN"},
]

# ------------------------------------------------------------------ RUSSIA
RUSSIA_FEEDS = [
    {"name": "TASS", "url": "https://tass.com/rss/v2.xml", "lang": "en", "country": "RU", "note": STATE},
    {"name": "The Moscow Times", "url": "https://www.themoscowtimes.com/rss/news", "lang": "en", "country": "RU", "note": EXILE},
    {"name": "Meduza (EN)", "url": "https://meduza.io/rss/en/all", "lang": "en", "country": "LV", "note": EXILE},
    {"name": "Kommersant", "url": "https://www.kommersant.ru/RSS/news.xml", "lang": "ru", "country": "RU", "category": "business"},
    {"name": "RBC", "url": "https://rssexport.rbc.ru/rbcnews/news/30/full.rss", "lang": "ru", "country": "RU", "category": "business"},
]

# ------------------------------------------------------------------ LATIN AMERICA
LATAM_FEEDS = [
    {"name": "El Financiero", "url": "https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/?outputType=xml", "lang": "es", "country": "MX", "category": "business"},
    {"name": "El Economista", "url": "https://www.eleconomista.com.mx/rss/economia", "lang": "es", "country": "MX", "category": "economy"},
    {"name": "Expansion", "url": "https://expansion.mx/rss", "lang": "es", "country": "MX", "category": "business"},
    {"name": "Infobae", "url": "https://www.infobae.com/arc/outboundfeeds/rss/", "lang": "es", "country": "AR"},
    {"name": "MercoPress", "url": "https://en.mercopress.com/rss", "lang": "en", "country": "UY"},
]

# ------------------------------------------------------------------ MIDDLE EAST
MIDDLE_EAST_FEEDS = [
    {"name": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml", "lang": "en", "country": "QA", "note": "state-funded (Qatar)"},
    {"name": "Arab News", "url": "https://www.arabnews.com/rss.xml", "lang": "en", "country": "SA"},
]

# ------------------------------------------------------------------ ASIA-PACIFIC (ex-China)
ASIA_PACIFIC_FEEDS = [
    {"name": "Japan Times", "url": "https://www.japantimes.co.jp/feed/", "lang": "en", "country": "JP"},
    {"name": "Straits Times Business", "url": "https://www.straitstimes.com/news/business/rss.xml", "lang": "en", "country": "SG", "category": "business"},
    {"name": "Nikkei Asia", "url": "https://asia.nikkei.com/rss/feed/nar", "lang": "en", "country": "JP", "category": "business"},
]


# ================================================================== per-region functions
# Signature for all: (limit_per_feed=10, translate=True, query=None) -> dict

def fetch_us(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(US_FEEDS, "us", limit_per_feed, translate, query)

def fetch_china(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(CHINA_FEEDS, "china", limit_per_feed, translate, query)

def fetch_europe(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(EUROPE_FEEDS, "europe", limit_per_feed, translate, query)

def fetch_africa(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(AFRICA_FEEDS, "africa", limit_per_feed, translate, query)

def fetch_india(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(INDIA_FEEDS, "india", limit_per_feed, translate, query)

def fetch_russia(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(RUSSIA_FEEDS, "russia", limit_per_feed, translate, query)

def fetch_latam(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(LATAM_FEEDS, "latam", limit_per_feed, translate, query)

def fetch_middle_east(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(MIDDLE_EAST_FEEDS, "middle_east", limit_per_feed, translate, query)

def fetch_asia_pacific(limit_per_feed=10, translate=True, query=None):
    return fetch_feeds(ASIA_PACIFIC_FEEDS, "asia_pacific", limit_per_feed, translate, query)
