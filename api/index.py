"""Flask application entry point for Vercel and local development."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from threading import Lock
from urllib.parse import urlparse

import requests
from flask import Flask, jsonify, render_template, request

ROOT = Path(__file__).resolve().parent.parent
app = Flask(__name__, template_folder=str(ROOT / "templates"), static_folder=str(ROOT / "static"))
API_URL = "https://data.moa.gov.tw/Service/OpenData/TransService.aspx"
CACHE_TTL = 600
_cache: dict[tuple, tuple[float, list]] = {}
_cache_lock = Lock()

AREA_MAP = {
    2: "臺北市", 3: "新北市", 4: "基隆市", 5: "宜蘭縣", 6: "桃園市",
    7: "新竹縣", 8: "新竹市", 9: "苗栗縣", 10: "臺中市", 11: "彰化縣",
    12: "南投縣", 13: "雲林縣", 14: "嘉義縣", 15: "嘉義市", 16: "臺南市",
    17: "高雄市", 18: "屏東縣", 19: "花蓮縣", 20: "臺東縣", 21: "澎湖縣",
    22: "金門縣", 23: "連江縣",
}
SEX = {"M": "小男生 ♂", "F": "小女生 ♀"}
BODY = {"SMALL": "嬌小迷你型", "MEDIUM": "剛剛好中型", "BIG": "大塊頭大型"}
STERILIZATION = {"T": "已完成絕育", "F": "尚未絕育", "N": "收容所確認中"}
VACCINE = {"T": "已打狂犬病疫苗", "F": "尚未施打", "N": "確認中"}


def load_content():
    with (ROOT / "data" / "content.json").open(encoding="utf-8") as f:
        return json.load(f)


@app.get("/")
def home():
    return render_template("index.html", title="浪浪小小守護者", page="home")


@app.get("/adopt")
def adopt():
    return render_template("adopt.html", title="幫浪浪找家", page="adopt", areas=AREA_MAP)


@app.get("/knowledge")
def knowledge():
    return render_template("knowledge.html", title="小小守護者學院", page="knowledge", topics=load_content()["topics"])


@app.get("/quiz")
def quiz():
    return render_template("quiz.html", title="小小守護者闖關挑戰", page="quiz", questions=load_content()["quiz"])


def clean_animal(row):
    image = str(row.get("album_file") or "").strip()
    parsed = urlparse(image)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    sex_code = str(row.get("animal_sex") or "").strip().upper()
    body_code = str(row.get("animal_bodytype") or "").strip().upper()
    variety = str(row.get("animal_Variety") or "").strip() or "可愛米克斯（混種）"
    area_id = row.get("animal_area_pkid")
    try:
        area_name = AREA_MAP.get(int(area_id), str(row.get("animal_place") or "所在地待確認"))
    except (TypeError, ValueError):
        area_name = str(row.get("animal_place") or "所在地待確認")
    return {
        "id": str(row.get("animal_id") or row.get("animal_subid") or ""),
        "shelter_id": str(row.get("animal_subid") or "資料待確認"),
        "kind": str(row.get("animal_kind") or "毛孩"), "name": str(row.get("animal_title") or variety),
        "variety": variety, "sex": SEX.get(sex_code, "性別待確認"),
        "bodytype": BODY.get(body_code, "體型待確認"), "color": str(row.get("animal_colour") or "毛色待確認"),
        "age": str(row.get("animal_age") or "年齡待確認"), "area": area_name,
        "shelter": str(row.get("shelter_name") or "收容所名稱待確認"),
        "phone": str(row.get("shelter_tel") or "請由家長查詢收容所"),
        "address": str(row.get("shelter_address") or row.get("animal_place") or "地址請洽收容所"),
        "image": image, "sterilization": STERILIZATION.get(str(row.get("animal_sterilization") or "").upper(), "收容所確認中"),
        "vaccine": VACCINE.get(str(row.get("animal_bacterin") or "").upper(), "確認中"),
    }


@app.get("/api/animals")
def animals_api():
    kind = request.args.get("kind", "").strip()
    area_id = request.args.get("area_id", "").strip()
    bodytype = request.args.get("bodytype", "").strip().upper()
    try:
        page = max(1, min(int(request.args.get("page", "1")), 100))
    except ValueError:
        page = 1
    if kind not in ("", "狗", "貓") or bodytype not in ("", "SMALL", "MEDIUM", "BIG"):
        return jsonify({"error": "篩選條件不正確，請重新選擇。"}), 400
    if area_id:
        try:
            if int(area_id) not in AREA_MAP:
                raise ValueError
            area_id = str(int(area_id))
        except ValueError:
            return jsonify({"error": "縣市選項不正確，請重新選擇。"}), 400

    key = (kind, area_id, bodytype, page)
    now = time.time()
    with _cache_lock:
        cached = _cache.get(key)
        if cached and now - cached[0] < CACHE_TTL:
            return jsonify({"animals": cached[1], "page": page, "cached": True})

    params = {"UnitId": "QcbUEzN6E6DL", "$top": 100, "$skip": (page - 1) * 100}
    if kind:
        params["animal_kind"] = kind
    if area_id:
        params["animal_area_pkid"] = area_id
    if bodytype:
        params["animal_bodytype"] = bodytype
    try:
        response = requests.get(API_URL, params=params, timeout=8)
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, dict):
            rows = rows.get("data", rows.get("value", []))
        if not isinstance(rows, list):
            raise ValueError("Unexpected API response")
        clean = [animal for row in rows if isinstance(row, dict) and (animal := clean_animal(row))]
        if bodytype:
            label = BODY[bodytype]
            clean = [animal for animal in clean if animal["bodytype"] == label]
        with _cache_lock:
            _cache[key] = (time.time(), clean)
        return jsonify({"animals": clean, "page": page, "cached": False})
    except (requests.RequestException, ValueError, json.JSONDecodeError) as exc:
        app.logger.warning("MOA adoption API unavailable: %s", type(exc).__name__)
        return jsonify({"error": "收容所資料正在整理中，請稍後再試一次喔！"}), 503


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=True)
