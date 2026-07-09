"""NEXSOCIO AI compose — draft enhancement for posts and twin scripts."""

import re


def compose_with_ai(draft: str, tone: str = "friendly", context: str = "social") -> str:
    text = draft.strip()
    if not text:
        return ""

    tone_openers = {
        "friendly": "",
        "professional": "",
        "bold": "🔥 ",
        "casual": "",
    }
    opener = tone_openers.get(tone, "")

    sentences = re.split(r"(?<=[.!?])\s+", text)
    polished: list[str] = []
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if s[0].islower():
            s = s[0].upper() + s[1:]
        if s[-1] not in ".!?":
            s += "."
        polished.append(s)

    body = " ".join(polished)

    if context == "professional" and not body.startswith("Excited"):
        body = f"Excited to share: {body}"

    hashtags = _suggest_hashtags(body)
    if hashtags:
        body = f"{body}\n\n{hashtags}"

    return f"{opener}{body}".strip()


def _suggest_hashtags(text: str) -> str:
    keywords = {
        "launch": "#NEXSOCIO #Launch",
        "product": "#NEXSOCIO #Product",
        "team": "#NEXSOCIO #Team",
        "update": "#NEXSOCIO #Update",
        "ai": "#NEXSOCIO #AI",
        "twin": "#NEXSOCIO #DigitalTwin",
    }
    lower = text.lower()
    for key, tags in keywords.items():
        if key in lower:
            return tags
    return "#NEXSOCIO"