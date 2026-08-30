#!/usr/bin/env python3
import json
import sys
import os
import argparse
import difflib
import urllib.request
import urllib.parse

DATA_FILE = "anime-ids.json"
DOWNLOADS_DIR = "downloads"

def load_catalog():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def fetch_anilibria_stream(alias, episode_num):
    if not alias:
        return None
    try:
        url = f"https://anilibria.top/api/v1/anime/releases/{alias}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            episodes = data.get("episodes", [])
            for ep in episodes:
                if int(ep.get("episode", 0)) == int(episode_num):
                    # Extract HD/SD video URL
                    hls = ep.get("hls", {})
                    video_url = hls.get("fhd") or hls.get("hd") or hls.get("sd")
                    if not video_url and ep.get("video"):
                        video_url = ep.get("video", {}).get("url")
                    if video_url and not video_url.startswith("http"):
                        video_url = "https://anilibria.top" + video_url
                    return video_url
    except Exception as e:
        print(f"AniLibria API error: {e}", file=sys.stderr)
    return None

def download_file(url, output_path):
    print(f"Downloading from {url} to {output_path}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as response, open(output_path, 'wb') as out_file:
            # Read in chunks
            while True:
                chunk = response.read(1024 * 64)
                if not chunk:
                    break
                out_file.write(chunk)
        print(f"Successfully downloaded: {output_path}")
        return True
    except Exception as e:
        print(f"Download failed: {e}", file=sys.stderr)
        return False

def search_anime(query, episode=1, limit=5, auto_download=False):
    catalog = load_catalog()
    if not catalog:
        return []
    
    query_lower = query.lower().strip()
    results = []

    for item in catalog:
        ru = (item.get("query_ru") or "").lower()
        en = (item.get("query_en") or "").lower()
        jp = (item.get("query_jp") or "").lower()
        
        score = 0
        if query_lower in ru or query_lower in en or query_lower in jp:
            score = 100
            if query_lower == ru or query_lower == en:
                score = 150
        else:
            matcher_ru = difflib.SequenceMatcher(None, query_lower, ru).ratio()
            matcher_en = difflib.SequenceMatcher(None, query_lower, en).ratio()
            max_ratio = max(matcher_ru, matcher_en)
            if max_ratio > 0.35:
                score = int(max_ratio * 90)

        if score > 0:
            results.append((score, item))

    results.sort(key=lambda x: x[0], reverse=True)
    matched_items = [item for score, item in results[:limit]]
    
    resolved = []
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)

    for item in matched_items:
        best = item.get("bestMatch", {})
        sources = item.get("sources", {})
        shiki = sources.get("shikimori", {}) or {}
        anilist = sources.get("anilist", {}) or {}
        
        title = best.get("shikimori_title") or item.get("query_ru") or item.get("query_en")
        shiki_id = best.get("shikimori_id")
        episodes_total = shiki.get("episodes") or anilist.get("episodes") or 12
        alias = best.get("anilibria_alias")
        
        stream_url = fetch_anilibria_stream(alias, episode)
        local_file = None
        
        if stream_url and auto_download:
            safe_title = "".join([c if c.isalnum() else "_" for c in title])
            filename = f"{safe_title}_ep_{episode}.mp4"
            local_path = os.path.join(DOWNLOADS_DIR, filename)
            if not os.path.exists(local_path):
                success = download_file(stream_url, local_path)
                if success:
                    local_file = local_path
            else:
                local_file = local_path
                print(f"File already exists: {local_path}")

        resolved.append({
            "shikimori_id": shiki_id,
            "title": title,
            "russian": item.get("query_ru"),
            "english": item.get("query_en"),
            "anilibria_title": best.get("anilibria_title"),
            "anilibria_alias": alias,
            "episodes_total": episodes_total,
            "target_episode": int(episode),
            "stream_url": stream_url,
            "downloaded_file": local_file,
            "kind": shiki.get("kind") or anilist.get("format") or "TV"
        })
    return resolved

def main():
    parser = argparse.ArgumentParser(description="AniCrash Python Anime & Episode Downloader")
    parser.add_argument("--query", type=str, help="Anime title query")
    parser.add_argument("--episode", type=int, default=1, help="Episode number")
    parser.add_argument("--download", action="store_true", help="Automatically download the episode video")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")
    args, unknown = parser.parse_known_args()

    query = args.query
    if not query and unknown:
        query = " ".join(unknown)
    
    if not query:
        print("Error: query is required", file=sys.stderr)
        sys.exit(1)

    results = search_anime(query, episode=args.episode, auto_download=args.download)

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        print(f"Searching for: '{query}', Episode {args.episode} (Download: {args.download})...\n")
        if not results:
            print("No anime found.")
            return
        for i, r in enumerate(results, 1):
            print(f"{i}. {r['title']} (Shiki ID: {r['shikimori_id']})")
            print(f"   Episode requested: {r['target_episode']} / Total: {r['episodes_total']}")
            if r['stream_url']:
                print(f"   Stream URL: {r['stream_url']}")
            if r['downloaded_file']:
                print(f"   Downloaded to: {r['downloaded_file']}")
            print("-" * 40)

if __name__ == "__main__":
    main()
