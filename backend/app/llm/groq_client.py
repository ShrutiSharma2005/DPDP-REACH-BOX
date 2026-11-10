import os
import time
import json
import logging
from typing import Dict, Any, Optional, List
from groq import Groq, RateLimitError, APIError
from app.config import settings

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        self.client = Groq(api_key=self.api_key) if self.api_key else None
        self.primary_model = settings.GROQ_MODEL
        self.fallback_model = settings.GROQ_FALLBACK_MODEL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.client)

    def chat_completion_json(
        self,
        messages: List[Dict[str, str]],
        max_retries: int = 3,
        use_fallback_model: bool = False
    ) -> Dict[str, Any]:
        """
        Executes chat completion with JSON mode, retrying on HTTP 429 rate limits with exponential backoff.
        Falls back to smaller model on persistent 429 or failure.
        """
        if not self.is_configured():
            raise ValueError("GROQ_API_KEY is not configured.")

        model = settings.GROQ_FALLBACK_MODEL if use_fallback_model else settings.GROQ_MODEL

        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=1000,
                )
                raw_content = response.choices[0].message.content
                return json.loads(raw_content)
            except RateLimitError as e:
                backoff = (2 ** attempt) + 1.0
                logger.warning(f"Groq Rate limit (429) encountered. Backing off for {backoff:.1f}s. Attempt {attempt+1}/{max_retries}. Error: {e}")
                time.sleep(backoff)
                if attempt == max_retries - 1 and not use_fallback_model:
                    logger.info(f"Switching to fast fallback model: {self.fallback_model}")
                    return self.chat_completion_json(messages, max_retries=2, use_fallback_model=True)
            except APIError as e:
                logger.error(f"Groq API error on attempt {attempt+1}: {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(1.5)
            except json.JSONDecodeError as e:
                logger.error(f"Groq returned invalid JSON: {e}")
                if attempt == max_retries - 1:
                    raise
        
        raise RuntimeError("Failed to complete Groq LLM request after retries.")

groq_service = GroqService()
