"""
Japan Real Estate Listing Pipeline
===================================

End-to-end automation for the Japan Cheap Houses map feature:

    Step A: scrape_listing_page()  — fetch + DOM-trim a Japanese listing page
    Step B: parse_and_translate()  — Anthropic Claude (forced tool calling) extracts and translates
            geocode_address()      — convert English address to lat/lng for the map
    Step C: publish_to_cms()       — upsert into Supabase `scraped_listings`
    Maint:  verify_listing()       — flag sold/404 listings for archival
            run_batch()            — orchestrate many URLs with dedup + rate limiting

Usage
-----
    # Scrape a single URL
    python scrape_listings.py scrape <url>

    # Scrape many URLs from a file (one URL per line, '#' comments ignored)
    python scrape_listings.py batch urls.txt

    # Verify every active listing in Supabase
    python scrape_listings.py verify

Required environment variables
------------------------------
    ANTHROPIC_API_KEY            Claude API key
    NEXT_PUBLIC_SUPABASE_URL     Your Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY    Service-role key (server-side only — bypasses RLS)

Optional
--------
    JPY_TO_USD_RATE              FX rate override (default 150)
    SCRAPE_DELAY_SECONDS         Per-request politeness delay (default 3.0)

Install
-------
    pip install -r scripts/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin

import anthropic
import httpx
from bs4 import BeautifulSoup

# Windows console defaults to cp1252 which can't print Japanese chars / em-dashes.
# Force stdout to UTF-8 so the final JSON dump doesn't UnicodeEncodeError.
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scrape_listings")

CLAUDE_MODEL = "claude-sonnet-4-6"        # Bulk-scrape optimized: ~5x cheaper than Opus 4.7
TOOL_NAME = "extract_japanese_real_estate"

JPY_TO_USD_RATE = float(os.environ.get("JPY_TO_USD_RATE", "150"))
SCRAPE_DELAY_SECONDS = float(os.environ.get("SCRAPE_DELAY_SECONDS", "3.0"))

# Browser-like UA — many Japanese real estate sites block default Python UAs.
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.5",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# The Japanese marker brokers use for "Sold" / "Under Contract".
SOLD_MARKERS = ("売約済", "契約済", "成約済", "ご成約")

# Supabase destination
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_TABLE = "scraped_listings"


# ---------------------------------------------------------------------------
# Claude tool schema — forces a structured, machine-parseable response
# ---------------------------------------------------------------------------

EXTRACTION_TOOL: dict = {
    "name": TOOL_NAME,
    "description": (
        "Extract and translate a Japanese real estate listing into clean English JSON. "
        "Every number must be in SI units (sqm). Prices are integers (yen with no commas). "
        "Preserve all structural defects, repair needs, and legal constraints from the original notes."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "title": {
                "type": "string",
                "description": (
                    "A compelling English listing title (≤ 80 chars). Mention LOCATION, "
                    "PROPERTY TYPE, and a notable feature (layout, size, view, condition). "
                    "CRITICAL: NEVER include the price — no ¥ amount, no $ amount, no 'M'/'K' "
                    "shorthand, no 'JPY'. Price lives in its own field and stays hidden from "
                    "free users on the website. Example GOOD: 'Riverfront 6LDK Two-Story Home "
                    "in Akita with 874 sqm Land'. Example BAD: 'Riverfront 6LDK — ¥2M'."
                ),
            },
            "price_jpy": {
                "type": "integer",
                "description": (
                    "Property price in Japanese yen as a clean integer (no commas, no '万' or '億'). "
                    "1万円 = 10000 yen, 1億円 = 100000000 yen. If only a 'price on inquiry' note is present, return 0."
                ),
            },
            "price_usd": {
                "type": "integer",
                "description": (
                    f"USD equivalent rounded to nearest dollar, using a fixed rate of "
                    f"1 USD = {int(JPY_TO_USD_RATE)} JPY. Compute as round(price_jpy / {JPY_TO_USD_RATE})."
                ),
            },
            "address_english": {
                "type": "string",
                "description": (
                    "Fully transliterated/translated address in standard English geocoder format: "
                    "'<Town>, <City>, <Prefecture>, Japan'. Use widely accepted romanizations "
                    "(Hepburn). Example: '相馬市, 福島県' → 'Soma City, Fukushima, Japan'."
                ),
            },
            "address_japanese": {
                "type": "string",
                "description": (
                    "The full address as it appears on the page in Japanese, including prefecture, "
                    "city, town, block, and street number if available. Example: "
                    "'秋田県秋田市土崎港北三丁目4-15'. Used for precise geocoding via GSI. "
                    "Return an empty string only if no Japanese address is on the page."
                ),
            },
            "prefecture": {
                "type": "string",
                "description": (
                    "Just the prefecture name in English (e.g. 'Fukushima', 'Wakayama', 'Miyazaki'). "
                    "Used for region filtering on the map."
                ),
            },
            "layout": {
                "type": "string",
                "description": "The Japanese layout code as-is: e.g. '3DK', '4LDK', '2K', 'Studio'.",
            },
            "land_area_sqm": {
                "type": "number",
                "description": (
                    "Land area in square meters. Convert 坪 (tsubo) → sqm using 1 tsubo = 3.30579 sqm. "
                    "Round to one decimal. Return 0 if not stated."
                ),
            },
            "floor_area_sqm": {
                "type": "number",
                "description": (
                    "Building floor area in square meters. Same conversion rules as land_area_sqm. "
                    "Return 0 if not stated."
                ),
            },
            "estimated_gross_yield": {
                "type": "number",
                "description": (
                    "Estimated annual gross rental yield as a percentage. "
                    "If the listing states monthly rent: yield = (monthly_rent * 12 / price_jpy) * 100. "
                    "If no rent is given, ESTIMATE a realistic gross yield (typically 5–12% for "
                    "regional Japan akiya, 3–6% for Tokyo) based on prefecture and property type. "
                    "Always return a positive number rounded to one decimal."
                ),
            },
            "description_english": {
                "type": "string",
                "description": (
                    "Engaging, marketing-friendly English translation of the broker notes (200–400 words). "
                    "Critical: PRESERVE every mention of structural issues, water damage, foundation "
                    "problems, asbestos, septic systems, road access, inheritance complications, "
                    "boundary disputes, or legal/zoning constraints. Never soften or omit risk language. "
                    "STRICTLY OMIT: (a) names of any private real estate broker / agency / agent, "
                    "(b) ALL phone numbers — including city hall and other government numbers, "
                    "(c) ALL email addresses, (d) physical office or street addresses for inquiries, "
                    "(e) license numbers or registration IDs, (f) URLs/links. You MAY name the "
                    "responsible public body in generic prose ('Akita City Akiya Bank handles "
                    "registration') but do NOT include any way to contact them directly — readers "
                    "will inquire through japancheaphouses.com."
                ),
            },
        },
        "required": [
            "title",
            "price_jpy",
            "price_usd",
            "address_english",
            "address_japanese",
            "prefecture",
            "layout",
            "land_area_sqm",
            "floor_area_sqm",
            "estimated_gross_yield",
            "description_english",
        ],
    },
}

SYSTEM_PROMPT = (
    "You are a meticulous data-extraction agent for a Japanese real estate platform. "
    "You receive trimmed HTML/text from a Japanese listing page and must call the "
    f"`{TOOL_NAME}` tool exactly once with all required fields populated. "
    "Never invent details. If a field is genuinely unavailable, use 0 (numbers) or an "
    "empty string. Preserve risk language verbatim in description_english."
)

BLOG_SYSTEM_PROMPT = (
    "You are a senior content writer for a Japanese real estate consulting firm "
    "serving international buyers. Write engaging, SEO-friendly long-form articles "
    "about specific properties. Your audience: foreigners interested in akiya (vacant "
    "Japanese homes) and rural property investment. Be honest about risks while "
    "highlighting genuine opportunity. Use markdown. NEVER restate the raw listing "
    "data verbatim — instead, contextualize it, tell a story, give market perspective, "
    "discuss the area, mention practical considerations. Always preserve any structural "
    "issues, repair needs, or legal concerns from the source description. "
    "STRICTLY OMIT names of any commercial real estate broker, agent, or agency, "
    "PLUS all phone numbers, email addresses, physical inquiry addresses, license "
    "numbers, registration IDs, and URLs — including those from government "
    "agencies (city hall, ward office, municipal akiya bank). Reference the "
    "responsible agency in generic prose if needed, but never provide a way to "
    "contact anyone directly — all inquiries route through japancheaphouses.com."
)


# ---------------------------------------------------------------------------
# Data class for type safety
# ---------------------------------------------------------------------------


@dataclass
class Listing:
    source_url: str
    title: str
    price_jpy: int
    price_usd: int
    address_english: str
    address_japanese: str
    prefecture: str
    layout: str
    land_area_sqm: float
    floor_area_sqm: float
    estimated_gross_yield: float
    description_english: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "active"  # 'active' | 'sold' | 'unavailable'
    image_urls: list[str] = field(default_factory=list)
    cover_image_url: Optional[str] = None


# ---------------------------------------------------------------------------
# Image extraction helpers
# ---------------------------------------------------------------------------

# URL substrings that strongly suggest UI chrome rather than a property photo.
_IMAGE_SKIP_PATTERNS = (
    "logo", "banner", "icon", "favicon", "sns", "social", "share", "arrow",
    "btn_", "btn-", "bg_", "bg-", "spacer", "pixel", "header", "footer",
    "menu", "sprite", "facebook", "twitter", "instagram", "line.", "youtube",
    "rss", "loading", "blank.", "transparent", "/bn-", "_bn.", "bn_",
    "vanta", "wats", "blades", "zenkoku", "navi", "wp-content/themes",
    "captcha", "qr-", "_button", "btn.", "/ui/", "thumb_arrow",
)

# Paths that almost always contain UI images, never content photos.
_IMAGE_SKIP_PATH_FRAGMENTS = ("/img/", "/icons/", "/buttons/", "/common/img/")

# Tiny intrinsic sizes → almost certainly an icon/spacer.
_MIN_IMAGE_DIM = 100

# Content paths Japanese gov CMS systems commonly use for uploaded photos.
_LIKELY_CONTENT_FRAGMENTS = ("/fs/", "/uploads/", "/files/", "/upload/", "/data/", "/_res/")


def extract_image_urls(soup, base_url: str) -> tuple[list[str], Optional[str]]:
    """Pull plausible property-photo URLs from a BeautifulSoup tree.

    Returns (all_filtered_images, cover_image). The cover prefers JPGs in
    content-y paths (e.g. /fs/, /uploads/) over PNGs in UI-y paths.
    """
    images: list[str] = []
    seen: set[str] = set()
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        src = src.strip()
        if not src or src.startswith("data:"):
            continue

        lower = src.lower()
        if any(p in lower for p in _IMAGE_SKIP_PATTERNS):
            continue
        if any(frag in lower for frag in _IMAGE_SKIP_PATH_FRAGMENTS):
            continue

        # Size sanity check (only when the page declares dimensions)
        width = img.get("width")
        height = img.get("height")
        try:
            if width and int(width) < _MIN_IMAGE_DIM:
                continue
            if height and int(height) < _MIN_IMAGE_DIM:
                continue
        except (TypeError, ValueError):
            pass

        absolute = urljoin(base_url, src)
        if absolute not in seen:
            seen.add(absolute)
            images.append(absolute)

    # Pick the best cover: first JPG in a content-y path, else first JPG, else first image.
    cover = None
    for url in images:
        if url.lower().endswith((".jpg", ".jpeg")) and any(
            frag in url.lower() for frag in _LIKELY_CONTENT_FRAGMENTS
        ):
            cover = url
            break
    if not cover:
        for url in images:
            if url.lower().endswith((".jpg", ".jpeg")):
                cover = url
                break
    if not cover and images:
        cover = images[0]

    return images, cover


# ===========================================================================
# Step A — Scraping
# ===========================================================================


def scrape_listing_page(url: str, *, timeout: float = 20.0) -> tuple[str, list[str]]:
    """Fetch a Japanese listing page and return (trimmed_text, image_urls).

    Image URLs are harvested BEFORE stripping <header>/<footer> etc. so that
    photos which sit inside semantic landmarks aren't lost. Tags themselves
    are removed only for text extraction (to conserve LLM tokens).

    Raises:
        httpx.HTTPError: network / DNS / TLS issues.
        ValueError:      non-2xx response, empty body, or no parseable content.
    """
    log.info("Fetching %s", url)
    try:
        response = httpx.get(
            url,
            headers=DEFAULT_HEADERS,
            timeout=timeout,
            follow_redirects=True,
        )
    except httpx.HTTPError as exc:
        log.error("Network error fetching %s: %s", url, exc)
        raise

    if response.status_code != 200:
        raise ValueError(f"HTTP {response.status_code} for {url}")

    # If the server didn't declare an encoding, httpx defaults to UTF-8.
    # Pass the raw bytes to BeautifulSoup and let it sniff <meta charset>.
    soup = BeautifulSoup(response.content, "html.parser")

    # Harvest images first (final URL after redirects is the right base).
    images, cover = extract_image_urls(soup, str(response.url))

    for tag in soup(["script", "style", "nav", "header", "footer", "noscript", "iframe"]):
        tag.decompose()

    # Collapse whitespace so the LLM gets clean text without huge blank gaps.
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)

    if len(text) < 200:
        raise ValueError(f"Page body too small ({len(text)} chars) — possibly blocked or empty")

    log.info("  scraped %d chars of trimmed text, %d candidate image(s)", len(text), len(images))
    return text, images, cover


# ===========================================================================
# Step B — Claude extraction + geocoding
# ===========================================================================


def parse_and_translate(html_text: str, client: anthropic.Anthropic) -> dict:
    """Send trimmed text to Claude with FORCED tool calling.

    `tool_choice={"type": "tool", "name": ...}` guarantees Claude returns ONLY the
    structured tool payload — no preamble text, no free-form prose. The schema is
    strictly validated server-side.

    Returns:
        The parsed tool input as a dict, matching EXTRACTION_TOOL.input_schema.

    Raises:
        anthropic.APIError: any Anthropic-side failure (rate limit, server, validation).
        ValueError:         response did not contain the expected tool call.
    """
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=[EXTRACTION_TOOL],
            tool_choice={"type": "tool", "name": TOOL_NAME},
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Extract every field from the following Japanese real estate listing. "
                        "Call the tool exactly once.\n\n"
                        "--- LISTING TEXT ---\n"
                        f"{html_text}\n"
                        "--- END LISTING ---"
                    ),
                }
            ],
        )
    except anthropic.RateLimitError as exc:
        log.error("Anthropic rate limited; back off and retry. %s", exc)
        raise
    except anthropic.APIError as exc:
        log.error("Anthropic API error: %s", exc)
        raise

    # With forced tool_choice, the SDK will return at least one tool_use block.
    for block in response.content:
        if block.type == "tool_use" and block.name == TOOL_NAME:
            log.info("  Claude returned tool payload (stop_reason=%s)", response.stop_reason)
            return block.input  # already a dict — SDK parses the JSON

    raise ValueError("Claude did not emit the expected tool call. Stop reason: " + response.stop_reason)


def _gsi_geocode(japanese_address: str) -> tuple[Optional[float], Optional[float]]:
    """Japan Geospatial Information Authority (GSI) geocoder.

    Free, no API key, run by the Japanese government, with detailed address
    coverage that Nominatim lacks. Takes Japanese-script addresses only.
    Returns the first match's coordinates (lon, lat → lat, lng for our schema).
    """
    if not japanese_address.strip():
        return None, None
    try:
        response = httpx.get(
            "https://msearch.gsi.go.jp/address-search/AddressSearch",
            params={"q": japanese_address},
            headers={"User-Agent": "japancheaphouses.com listing pipeline"},
            timeout=15.0,
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        log.warning("GSI geocode failed for '%s': %s", japanese_address, exc)
        return None, None

    if not results:
        return None, None

    # GSI returns GeoJSON-ish format: coordinates are [lon, lat]
    lon, lat = results[0]["geometry"]["coordinates"]
    return float(lat), float(lon)


def _nominatim_query(query: str) -> tuple[Optional[float], Optional[float]]:
    """Single Nominatim lookup. Sleeps 1s after every call (usage policy)."""
    try:
        response = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1, "countrycodes": "jp"},
            headers={"User-Agent": "japancheaphouses.com listing pipeline (contact: eliobardho7@gmail.com)"},
            timeout=15.0,
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        log.warning("Geocoding failed for '%s': %s", query, exc)
        return None, None
    finally:
        time.sleep(1.0)
    if not results:
        return None, None
    return float(results[0]["lat"]), float(results[0]["lon"])


def geocode_address(
    address_english: str,
    prefecture: str = "",
    address_japanese: str = "",
) -> tuple[Optional[float], Optional[float]]:
    """Resolve an address to (lat, lng).

    Strategy (most accurate first):
    1. GSI (Japan's gov geocoder) with the Japanese address — precise, free
    2. Nominatim with the English address (full)
    3. Nominatim with English, dropping the street (city + prefecture)
    4. Nominatim with prefecture-only fallback
    """
    # Attempt 1: GSI with Japanese address — best accuracy for Japan
    if address_japanese.strip():
        lat, lng = _gsi_geocode(address_japanese)
        if lat is not None:
            log.info("  ✓ GSI geocode: %s → %.4f, %.4f", address_japanese, lat, lng)
            return lat, lng

    if not address_english.strip():
        return None, None

    # Attempt 2: Nominatim full English address
    lat, lng = _nominatim_query(address_english)
    if lat is not None:
        return lat, lng

    # Attempt 3: drop leading street/number, keep city + prefecture
    parts = [p.strip() for p in address_english.split(",") if p.strip()]
    if len(parts) >= 2:
        coarser = ", ".join(parts[-3:]) if len(parts) >= 3 else ", ".join(parts)
        log.info("  geocode retry: %s", coarser)
        lat, lng = _nominatim_query(coarser)
        if lat is not None:
            return lat, lng

    # Attempt 4: prefecture-level fallback
    if prefecture:
        log.info("  geocode prefecture fallback: %s", prefecture)
        lat, lng = _nominatim_query(f"{prefecture}, Japan")
        if lat is not None:
            return lat, lng

    log.warning("No geocode match for '%s'", address_english)
    return None, None


# ===========================================================================
# Step C — Publish to Supabase (the project's CMS / database)
# ===========================================================================


def publish_to_cms(listing: Listing) -> bool:
    """Upsert a Listing into the `scraped_listings` table in Supabase.

    Uses the Supabase REST API directly (PostgREST) with the service-role key,
    which bypasses RLS. We upsert on `source_url` so re-scrapes update in place
    rather than creating duplicates.

    Returns True on success, False on transport/HTTP failure (logged).

    To target a different CMS (Webflow / WordPress / Strapi / etc.), replace
    the body of this function with the appropriate authenticated POST. Example:

        # Generic REST CMS adapter
        # response = httpx.post(
        #     os.environ["CMS_API_ENDPOINT"],
        #     headers={"Authorization": f"Bearer {os.environ['CMS_API_TOKEN']}",
        #              "Content-Type": "application/json"},
        #     json=asdict(listing),
        #     timeout=30.0,
        # )
        # response.raise_for_status()
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.warning("Supabase credentials not set — skipping publish. Set "
                    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
        return False

    endpoint = f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        # Upsert on the unique source_url column.
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    payload = {
        "source_url": listing.source_url,
        "title": listing.title,
        "price_jpy": listing.price_jpy,
        "price_usd": listing.price_usd,
        "address_english": listing.address_english,
        "address_japanese": listing.address_japanese,
        "prefecture": listing.prefecture,
        "layout": listing.layout,
        "land_area_sqm": listing.land_area_sqm,
        "floor_area_sqm": listing.floor_area_sqm,
        "estimated_gross_yield": listing.estimated_gross_yield,
        "description_english": listing.description_english,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "status": listing.status,
        "image_urls": listing.image_urls,
        "cover_image_url": listing.cover_image_url,
    }

    try:
        response = httpx.post(
            endpoint,
            headers=headers,
            params={"on_conflict": "source_url"},
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        log.error("Supabase publish failed for %s: %s | body=%s", listing.source_url, exc,
                  getattr(exc, "response", None) and exc.response.text)
        return False

    log.info("  ✓ Published to Supabase: %s", listing.title[:60])
    return True


# ===========================================================================
# Maintenance — verify existing listings, dedupe new ones
# ===========================================================================


def verify_listing(url: str, *, timeout: float = 15.0) -> str:
    """Check whether a previously-scraped listing is still live.

    Returns:
        'active'      — page reachable, no sold marker, no 404
        'sold'        — page contains a Japanese sold marker
        'unavailable' — 404 or other non-2xx; treat as removed
    """
    try:
        response = httpx.get(url, headers=DEFAULT_HEADERS, timeout=timeout, follow_redirects=True)
    except httpx.HTTPError as exc:
        log.warning("verify_listing: network error for %s: %s — marking unavailable", url, exc)
        return "unavailable"

    if response.status_code == 404:
        return "unavailable"
    if response.status_code != 200:
        log.warning("verify_listing: HTTP %s for %s", response.status_code, url)
        return "unavailable"

    body = response.text
    if any(marker in body for marker in SOLD_MARKERS):
        return "sold"

    return "active"


def already_scraped(url: str) -> bool:
    """Return True if `source_url` already exists in Supabase."""
    if not (SUPABASE_URL and SUPABASE_KEY):
        return False
    try:
        response = httpx.get(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            params={"source_url": f"eq.{url}", "select": "source_url", "limit": "1"},
            timeout=10.0,
        )
        response.raise_for_status()
        return len(response.json()) > 0
    except httpx.HTTPError as exc:
        log.warning("already_scraped check failed (%s) — assuming new", exc)
        return False


def fetch_all_active_urls() -> list[str]:
    """Pull every active listing URL from Supabase for verification sweeps."""
    if not (SUPABASE_URL and SUPABASE_KEY):
        log.error("Cannot fetch URLs — Supabase not configured")
        return []
    try:
        response = httpx.get(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            params={"status": "eq.active", "select": "source_url"},
            timeout=30.0,
        )
        response.raise_for_status()
        return [row["source_url"] for row in response.json()]
    except httpx.HTTPError as exc:
        log.error("Could not list active listings: %s", exc)
        return []


def update_status(url: str, new_status: str) -> None:
    """Patch the `status` column for a given source_url."""
    if not (SUPABASE_URL and SUPABASE_KEY):
        return
    try:
        response = httpx.patch(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            params={"source_url": f"eq.{url}"},
            json={"status": new_status},
            timeout=10.0,
        )
        response.raise_for_status()
        log.info("  flagged %s → %s", url, new_status)
    except httpx.HTTPError as exc:
        log.error("Could not update status for %s: %s", url, exc)


# ===========================================================================
# Orchestrators
# ===========================================================================


def run_pipeline_for_url(url: str, client: anthropic.Anthropic) -> Optional[Listing]:
    """Compose Step A → B → geocoding → C for a single URL.

    Returns the Listing on success, None on any handled failure (logged).
    Exceptions propagate only for programmer errors.
    """
    try:
        text, images, cover = scrape_listing_page(url)
    except (httpx.HTTPError, ValueError) as exc:
        log.error("Scrape failed for %s: %s", url, exc)
        return None

    try:
        extracted = parse_and_translate(text, client)
    except (anthropic.APIError, ValueError) as exc:
        log.error("Claude extraction failed for %s: %s", url, exc)
        return None

    lat, lng = geocode_address(
        extracted.get("address_english", ""),
        extracted.get("prefecture", ""),
        extracted.get("address_japanese", ""),
    )

    listing = Listing(
        source_url=url,
        latitude=lat,
        longitude=lng,
        image_urls=images,
        cover_image_url=cover,
        **extracted,  # destructure all 10 schema fields
    )

    publish_to_cms(listing)
    return listing


def run_batch(urls: list[str], client: anthropic.Anthropic, *, force: bool = False) -> None:
    """Iterate a list of URLs safely: dedup, scrape, rate-limit.

    Pass `force=True` to bypass the Supabase dedup check and re-scrape every URL.
    Useful when the extraction schema has changed and you want to backfill new fields.

    The delay between requests respects per-host politeness (default 3s, override
    with SCRAPE_DELAY_SECONDS env var). Sites that detect bot patterns will start
    returning 403/captcha; if you see that, raise the delay or add proxies.
    """
    seen_urls: set[str] = set()
    success_count = 0
    skip_count = 0

    for index, url in enumerate(urls, start=1):
        log.info("[%d / %d]  %s", index, len(urls), url)

        if url in seen_urls:
            log.info("  skip: already processed in this run")
            skip_count += 1
            continue
        seen_urls.add(url)

        if not force and already_scraped(url):
            log.info("  skip: already in Supabase (use --force to re-scrape)")
            skip_count += 1
            continue

        listing = run_pipeline_for_url(url, client)
        if listing is not None:
            success_count += 1

        if index < len(urls):  # no need to sleep after the last one
            time.sleep(SCRAPE_DELAY_SECONDS)

    log.info("Batch complete: %d new, %d skipped, %d failed",
             success_count, skip_count, len(urls) - success_count - skip_count)


def generate_blog_post(listing_row: dict, client: anthropic.Anthropic) -> Optional[str]:
    """Generate a narrative blog post about a single listing via Claude.

    Returns the markdown blog content, or None on failure. Designed to add
    SEO surface area beyond the structured listing page — the content should
    be a *narrative* with market context, not a restatement of the data.
    """
    prompt = (
        "Write a 600–800 word blog post about this Japanese property listing. "
        "Use markdown. Include an engaging opening hook, 3–4 H2 sections (## Headings), "
        "and a closing call-to-action paragraph. Cover: the area and its character, "
        "what kind of buyer this property suits, realistic renovation expectations, "
        "any risks or considerations, and the broader akiya context. Do NOT list "
        "raw specifications — those live on the listing page. Be specific to THIS "
        "property, not generic akiya advice.\n\n"
        f"=== LISTING DATA ===\n"
        f"Title: {listing_row.get('title')}\n"
        f"Location: {listing_row.get('address_english')} ({listing_row.get('prefecture')})\n"
        f"Price: ¥{listing_row.get('price_jpy', 0):,} (~${listing_row.get('price_usd', 0):,} USD)\n"
        f"Layout: {listing_row.get('layout')}\n"
        f"Floor area: {listing_row.get('floor_area_sqm')} m²\n"
        f"Land area: {listing_row.get('land_area_sqm')} m²\n"
        f"Estimated gross yield: {listing_row.get('estimated_gross_yield')}%\n\n"
        f"Original description (preserve any risks/issues mentioned):\n"
        f"{listing_row.get('description_english')}\n"
    )

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            system=BLOG_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError as exc:
        log.error("Blog generation failed for listing %s: %s", listing_row.get("id"), exc)
        return None

    for block in response.content:
        if block.type == "text":
            return block.text
    return None


def generate_all_blog_posts(client: anthropic.Anthropic, *, force: bool = False) -> None:
    """Loop every active scraped_listing and generate a blog post for any
    that doesn't already have one. Pass force=True to regenerate all.
    """
    if not (SUPABASE_URL and SUPABASE_KEY):
        log.error("Supabase not configured.")
        return

    select_filter = "" if force else "&blog_content=is.null"
    try:
        response = httpx.get(
            f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}"
            f"?status=eq.active&select=*&order=id.asc{select_filter}",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            timeout=30.0,
        )
        response.raise_for_status()
        listings_to_process = response.json()
    except httpx.HTTPError as exc:
        log.error("Could not list listings: %s", exc)
        return

    log.info("Generating blog posts for %d listings…", len(listings_to_process))
    success = 0
    for index, listing in enumerate(listings_to_process, start=1):
        log.info("[%d / %d]  %s", index, len(listings_to_process), listing.get("title", "")[:70])

        content = generate_blog_post(listing, client)
        if not content:
            continue

        # Persist
        try:
            patch_response = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}?id=eq.{listing['id']}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={
                    "blog_content": content,
                    "blog_published_at": "now()",
                },
                timeout=15.0,
            )
            patch_response.raise_for_status()
            log.info("  ✓ Blog post saved (%d chars)", len(content))
            success += 1
        except httpx.HTTPError as exc:
            log.error("  Failed to save blog post: %s", exc)

        # Small pause between Claude calls to be polite
        time.sleep(1.0)

    log.info("Blog generation complete: %d of %d succeeded", success, len(listings_to_process))


def clean_listing_titles() -> None:
    """One-off pass: strip leaked price references from existing scraped_listings titles.

    Older runs (before the schema CRITICAL note) often produced titles like
    'Cute 4DK Home in Akita — ¥2M'. This pass uses regex to remove that suffix
    so free-tier users never see the price via the title.
    """
    if not (SUPABASE_URL and SUPABASE_KEY):
        log.error("Supabase not configured.")
        return

    response = httpx.get(
        f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}?select=id,title",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30.0,
    )
    response.raise_for_status()
    rows = response.json()

    # Tokens that ARE the price (matched anywhere in the title, including middle segments).
    price_tokens = [
        r"¥\s?[\d,.]+\s?(million|mil|M|K|k)?\b",       # ¥2.5M, ¥2,500,000
        r"\$\s?[\d,.]+\s?(million|mil|M|K|k)?\b",      # $16K, $25,000
        r"\b[\d,.]+\s?(million|mil|M|K|k)\s*(JPY|yen|Yen|YEN|jpy)\b",  # 1.5M JPY, 6M Yen
        r"\b[\d,.]+\s*(JPY|yen|Yen|YEN|jpy)\b",        # 1500000 JPY
        r"\b[\d,]+\s*万円",                              # 1,780万円 (Japanese mannen)
    ]

    # Once price tokens are gone, clean up orphan separators / stray "for"-style intros
    cleanup_patterns = [
        # "for" before nothing (we stripped what came after)
        r"\s+(for|at|priced at|asking)\s+(?=[—–\-|/,]|$)",
        # Empty segment between two separators (a — — b → a — b)
        r"(\s*[—–\-|/]\s*){2,}",
        # Trailing separators / commas
        r"\s*[—–\-|/,;:]\s*$",
        # Leading separators
        r"^\s*[—–\-|/,;:]\s*",
        # Multiple spaces collapsed
        r"\s{2,}",
    ]

    changed = 0
    for row in rows:
        original = row.get("title") or ""
        cleaned = original
        # Step 1: remove the price tokens themselves
        for pattern in price_tokens:
            cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE)
        # Step 2: do multiple cleanup passes to handle nested orphan separators
        for _ in range(3):
            for pattern in cleanup_patterns:
                cleaned = re.sub(pattern, " " if pattern == r"\s{2,}" else "", cleaned, flags=re.IGNORECASE)
            cleaned = cleaned.strip().strip(",;:")
        if cleaned != original:
            patch = httpx.patch(
                f"{SUPABASE_URL}/rest/v1/{SUPABASE_TABLE}?id=eq.{row['id']}",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                json={"title": cleaned},
                timeout=10.0,
            )
            if patch.status_code in (200, 204):
                changed += 1
                log.info("[%d] %s  →  %s", row["id"], original, cleaned)
            else:
                log.error("[%d] PATCH failed: %s", row["id"], patch.text)

    log.info("Cleaned %d / %d titles", changed, len(rows))


def verify_all_listings() -> None:
    """Sweep every active listing, flagging sold/404 entries in Supabase."""
    urls = fetch_all_active_urls()
    log.info("Verifying %d active listings…", len(urls))

    flagged = 0
    for index, url in enumerate(urls, start=1):
        status = verify_listing(url)
        log.info("[%d / %d] %s → %s", index, len(urls), url, status)
        if status != "active":
            update_status(url, status)
            flagged += 1
        if index < len(urls):
            time.sleep(SCRAPE_DELAY_SECONDS)

    log.info("Verification complete: %d listings flagged for archival", flagged)


# ===========================================================================
# CLI
# ===========================================================================


def _load_urls_from_file(path: Path) -> list[str]:
    """Read a newline-delimited URL file; ignore blank lines and `#` comments."""
    urls: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p_scrape = sub.add_parser("scrape", help="Scrape a single URL")
    p_scrape.add_argument("url")

    p_batch = sub.add_parser("batch", help="Scrape URLs from a newline-delimited file")
    p_batch.add_argument("file", type=Path)
    p_batch.add_argument("--force", action="store_true",
                         help="Bypass the Supabase dedup check (re-scrape even existing rows)")

    sub.add_parser("verify", help="Verify all active listings (flag sold / 404)")

    sub.add_parser("clean-titles", help="Strip price references from existing titles")

    p_blog = sub.add_parser("generate-blog", help="Generate a narrative blog post for each listing")
    p_blog.add_argument("--force", action="store_true",
                        help="Regenerate blog posts even when they already exist")

    args = parser.parse_args(argv)

    if not os.environ.get("ANTHROPIC_API_KEY"):
        log.error("ANTHROPIC_API_KEY is not set. export ANTHROPIC_API_KEY=sk-ant-...")
        return 2

    # `anthropic.Anthropic()` reads the key from the env automatically.
    client = anthropic.Anthropic()

    if args.command == "scrape":
        listing = run_pipeline_for_url(args.url, client)
        if listing is None:
            return 1
        print(json.dumps(listing.__dict__, indent=2, ensure_ascii=False))
        return 0

    if args.command == "batch":
        if not args.file.exists():
            log.error("URL file not found: %s", args.file)
            return 2
        urls = _load_urls_from_file(args.file)
        if not urls:
            log.error("No URLs found in %s", args.file)
            return 2
        run_batch(urls, client, force=args.force)
        return 0

    if args.command == "verify":
        verify_all_listings()
        return 0

    if args.command == "clean-titles":
        clean_listing_titles()
        return 0

    if args.command == "generate-blog":
        generate_all_blog_posts(client, force=args.force)
        return 0

    return 2


if __name__ == "__main__":
    sys.exit(main())
