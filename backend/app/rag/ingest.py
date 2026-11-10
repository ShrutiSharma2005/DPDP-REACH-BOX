import os
import re
from typing import List, Dict, Any

class DocumentChunk:
    def __init__(self, doc_id: str, title: str, section: str, content: str):
        self.doc_id = doc_id
        self.title = title
        self.section = section
        self.content = content.strip()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "doc_id": self.doc_id,
            "title": self.title,
            "section": self.section,
            "content": self.content
        }

def load_knowledge_chunks(knowledge_dir: str) -> List[DocumentChunk]:
    chunks: List[DocumentChunk] = []
    if not os.path.exists(knowledge_dir):
        return chunks

    for filename in sorted(os.listdir(knowledge_dir)):
        filepath = os.path.join(knowledge_dir, filename)
        if filename.endswith(".md") or filename.endswith(".txt"):
            with open(filepath, "r", encoding="utf-8") as f:
                raw_text = f.read()
            
            # Split by markdown headers ## or ###
            sections = re.split(r'\n(?=#{2,3}\s+)', raw_text)
            for idx, sec in enumerate(sections):
                lines = sec.strip().split("\n")
                if not lines:
                    continue
                header_match = re.match(r'^#{2,3}\s+(.+)$', lines[0])
                header = header_match.group(1).strip() if header_match else f"Section {idx+1}"
                body = "\n".join(lines[1:]).strip() if header_match else sec.strip()
                if body:
                    # Extract any statutory section number (e.g. "Section 8", "Section 3(c)(ii)(A)")
                    sec_match = re.search(r'Section\s+(\d+[a-zA-Z0-9\(\)]*)', header, re.IGNORECASE)
                    section_ref = sec_match.group(0) if sec_match else header
                    chunks.append(DocumentChunk(
                        doc_id=f"{filename}_{idx}",
                        title=f"{filename}: {header}",
                        section=section_ref,
                        content=f"## {header}\n{body}"
                    ))
    return chunks

_VALID_ACT_SECTIONS = None

def get_valid_act_sections(knowledge_dir: str) -> set[str]:
    """Extract all valid statutory sections (e.g. 'Section 3', 'Section 5', 'Section 8', 'Section 33') from the knowledge text."""
    global _VALID_ACT_SECTIONS
    if _VALID_ACT_SECTIONS is not None:
        return _VALID_ACT_SECTIONS

    sections_found = set()
    chunks = load_knowledge_chunks(knowledge_dir)
    for c in chunks:
        # Match Section \d+
        matches = re.findall(r'\bSection\s+(\d+)', c.content, re.IGNORECASE)
        for m in matches:
            sections_found.add(f"Section {m}")
    
    # Ensure all core DPDP Act 2023 sections (Sections 1 through 44) are registered
    # The DPDP Act 2023 has 44 sections across 8 chapters
    for i in range(1, 45):
        sections_found.add(f"Section {i}")
    
    _VALID_ACT_SECTIONS = sections_found
    return _VALID_ACT_SECTIONS
