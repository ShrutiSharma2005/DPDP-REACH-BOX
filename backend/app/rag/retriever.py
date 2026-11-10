import os
import re
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from app.rag.ingest import load_knowledge_chunks, DocumentChunk

class BM25Retriever:
    _instance: Optional["BM25Retriever"] = None

    def __init__(self, knowledge_dir: str):
        self.knowledge_dir = knowledge_dir
        self.chunks: List[DocumentChunk] = []
        self.bm25: Optional[BM25Okapi] = None
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_]+\b', text)]

    def _build_index(self):
        self.chunks = load_knowledge_chunks(self.knowledge_dir)
        if not self.chunks:
            # Fallback mock chunk if knowledge dir is empty
            self.chunks = [DocumentChunk("seed_1", "DPDP Act", "Section 8", "DPDP Act 2023 obligations for reasonable security safeguards and 72-hour breach reporting.")]
        tokenized_corpus = [self._tokenize(c.content) for c in self.chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.bm25 or not self.chunks:
            return []
        tokens = self._tokenize(query)
        if not tokens:
            return [c.to_dict() for c in self.chunks[:top_k]]
        
        doc_scores = self.bm25.get_scores(tokens)
        scored_pairs = sorted(zip(self.chunks, doc_scores), key=lambda x: x[1], reverse=True)
        return [c.to_dict() for c, score in scored_pairs[:top_k]]

_retriever_instance: Optional[BM25Retriever] = None

def get_retriever() -> BM25Retriever:
    global _retriever_instance
    if _retriever_instance is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        knowledge_path = os.path.join(base_dir, "data", "knowledge")
        _retriever_instance = BM25Retriever(knowledge_path)
    return _retriever_instance
