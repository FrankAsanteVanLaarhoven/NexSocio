"""Deterministic moderation engine with ML stub hook."""

import re
from dataclasses import dataclass

BLOCKLIST = [
    r"\bkill\b",
    r"\bhack\s+into\b",
    r"\bchild\s+exploit",
    r"\bterrorist\b",
    r"\bself[- ]harm\b",
]

WARNING_PATTERNS = [
    r"\bspam\b",
    r"\bscam\b",
    r"\bfake\s+news\b",
]


@dataclass
class ModerationResult:
    allowed: bool
    score: float
    labels: list[str]
    action: str
    message: str


class ModerationEngine:
    def __init__(self, blocklist: list[str] | None = None):
        self._block = [re.compile(p, re.I) for p in (blocklist or BLOCKLIST)]
        self._warn = [re.compile(p, re.I) for p in WARNING_PATTERNS]

    def analyze(self, text: str, author_mode: str = "prime") -> ModerationResult:
        labels: list[str] = []
        score = 0.0

        for pattern in self._block:
            if pattern.search(text):
                labels.append("blocked_content")
                return ModerationResult(
                    allowed=False,
                    score=1.0,
                    labels=labels,
                    action="block",
                    message="Content violates safety policy",
                )

        for pattern in self._warn:
            if pattern.search(text):
                labels.append("warning")
                score = max(score, 0.6)

        if author_mode == "kids":
            if re.search(r"\b(damn|hell|crap)\b", text, re.I):
                labels.append("kids_language")
                score = max(score, 0.7)
                return ModerationResult(
                    allowed=False,
                    score=score,
                    labels=labels,
                    action="block",
                    message="Language not appropriate for Kids mode",
                )

        # ML stub hook — production replaces with SageMaker/Bedrock
        ml_score = self._ml_stub_classify(text)
        score = max(score, ml_score)
        if ml_score > 0.85:
            labels.append("ml_high_risk")
            return ModerationResult(
                allowed=False,
                score=ml_score,
                labels=labels,
                action="block",
                message="ML moderation flagged content",
            )

        action = "allow" if score < 0.5 else "review"
        return ModerationResult(
            allowed=score < 0.5,
            score=score,
            labels=labels or ["clean"],
            action=action,
            message="Content passed moderation" if score < 0.5 else "Queued for review",
        )

    def _ml_stub_classify(self, text: str) -> float:
        risky_words = ["violence", "weapon", "drug", "explicit"]
        hits = sum(1 for w in risky_words if w in text.lower())
        return min(hits * 0.25, 0.9)