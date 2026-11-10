import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)

from app.rag.ingest import load_knowledge_chunks, get_valid_act_sections
from app.rag.retriever import get_retriever

def main():
    print("📚 Ingesting knowledge documents into local BM25 index...")
    knowledge_dir = os.path.join(BACKEND_DIR, "data", "knowledge")
    chunks = load_knowledge_chunks(knowledge_dir)
    print(f"✅ Ingested {len(chunks)} chunks from {knowledge_dir}:")
    for c in chunks:
        print(f"   - [{c.section}] {c.title}")
    
    sections = get_valid_act_sections(knowledge_dir)
    print(f"✅ Registered {len(sections)} statutory sections for hallucination verification.")

    retriever = get_retriever()
    test_query = "breach notification timeline Section 8"
    results = retriever.retrieve(test_query, top_k=2)
    print(f"🔍 Test retrieval for '{test_query}': retrieved {len(results)} chunks.")

if __name__ == "__main__":
    main()
