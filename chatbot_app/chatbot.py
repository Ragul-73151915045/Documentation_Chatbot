import os
import re


# =========================================================
# PROJECT PATH
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

KNOWLEDGE_FOLDER = os.path.join(
    BASE_DIR,
    "knowledge"
)


# =========================================================
# READ KNOWLEDGE FILES (OKF - Open Knowledge Format)
# =========================================================

def clean_okf_content(content):
    """
    Cleans OKF markdown files by stripping code wrappers and YAML frontmatter.
    """
    if not content:
        return ""
    # Remove leading ```markdown code fence
    content = re.sub(r"^```markdown\s*", "", content, flags=re.IGNORECASE)
    content = re.sub(r"^```\s*", "", content)
    # Remove YAML front-matter: --- ... ---
    content = re.sub(r"^---\s*[\s\S]*?---\s*", "", content)
    # Remove trailing ```
    content = re.sub(r"```\s*$", "", content)
    return content.strip()


def read_knowledge():

    knowledge = {}

    if not os.path.exists(KNOWLEDGE_FOLDER):
        return knowledge

    for filename in os.listdir(KNOWLEDGE_FOLDER):

        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(
            KNOWLEDGE_FOLDER,
            filename
        )

        try:
            with open(
                filepath,
                "r",
                encoding="utf-8"
            ) as file:
                content = file.read()

            topic = filename.replace(
                ".md",
                ""
            ).lower()

            knowledge[topic] = clean_okf_content(content)
        except Exception:
            pass

    return knowledge


# =========================================================
# CLEAN TEXT
# =========================================================

def clean_text(text):

    text = text.lower()

    text = re.sub(
        r"[^\w\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# NORMALIZE WORD
# =========================================================

def normalize_word(word):

    word = word.lower().strip()

    word = re.sub(
        r"[^a-z0-9+#.]",
        "",
        word
    )

    return word


# =========================================================
# STOP WORDS
# =========================================================

STOP_WORDS = {
    "what",
    "is",
    "are",
    "the",
    "a",
    "an",
    "of",
    "in",
    "to",
    "for",
    "on",
    "with",
    "and",
    "or",
    "how",
    "why",
    "can",
    "you",
    "me",
    "tell",
    "about",
    "please",
    "give",
    "explain",
    "show",
    "find",
    "get",
    "enna",
    "nu",
    "la",
    "ku",
    "solla",
    "solle",
    "sollu",
    "solunga",
    "keta",
    "irukku",
    "iruthuchuna"
}


# =========================================================
# FIND ANSWER IN DOCUMENT (ACCURATE WINDOWED MATCHING)
# =========================================================

def find_answer_in_document(document_text, question):
    """
    Finds accurate answers from an uploaded document (PDF, DOCX, TXT, CSV).
    Uses sliding line windows, key-value recognition (e.g. Admin Password),
    and guarantees an answer is returned without ever saying 'not found' or 'illa'.
    """
    if not document_text or not document_text.strip():
        return None

    # Clean and split into individual lines
    sanitized = document_text.replace("\xa0", " ").replace("\ufffd", "").replace("\r", "")
    raw_lines = [line.strip() for line in sanitized.split("\n") if line.strip()]
    if not raw_lines:
        return None

    q_clean = clean_text(question)
    q_words = [
        normalize_word(w)
        for w in q_clean.split()
        if normalize_word(w) and normalize_word(w) not in STOP_WORDS
    ]

    # 1. Check for Summary or Overview intent
    summary_triggers = [
        "summary", "summarize", "overview", "what is this document",
        "explain document", "about document", "document details"
    ]
    if any(st in q_clean for st in summary_triggers) and len(q_words) <= 3:
        overview_lines = raw_lines[:8]
        return "📄 **Document Overview:**\n\n" + "\n".join(overview_lines)

    # 2. Sliding Window Search across 1 to 6 lines
    best_score = -1
    best_i = 0
    best_w_size = 1

    for w_size in [1, 2, 3, 4, 5, 6]:
        for i in range(len(raw_lines) - w_size + 1):
            window = raw_lines[i : i + w_size]
            window_text = " ".join(window).lower()

            score = 0
            matched_words = 0
            for qw in q_words:
                if qw in window_text:
                    matched_words += 1
                    score += 15
                    # Bonus for whole word boundary
                    if re.search(r"\b" + re.escape(qw) + r"\b", window_text):
                        score += 10

            # Huge bonus if all query keywords appear in this window
            if q_words and matched_words == len(q_words):
                score += 80
                # Compactness bonus (smaller window containing all terms is more precise)
                score += (7 - w_size) * 12

            # Exact query phrase bonus
            if q_clean and q_clean in window_text:
                score += 120

            if score > best_score:
                best_score = score
                best_i = i
                best_w_size = w_size

    # Expand context to include preceding headers/labels if applicable
    start_idx = best_i
    if start_idx > 0:
        prev_line = raw_lines[start_idx - 1]
        prev_lower = prev_line.lower()
        if any(qw in prev_lower for qw in q_words) or any(
            hdr in prev_lower for hdr in ["credentials", "login", "step", "part", "1.", "2.", "3.", "admin", "guide"]
        ):
            start_idx = max(0, start_idx - 1)
            if start_idx > 0 and any(h in raw_lines[start_idx - 1].lower() for h in ["1.", "part", "logging in"]):
                start_idx -= 1

    end_idx = min(len(raw_lines), best_i + best_w_size + 1)

    if best_score > 0:
        matched_chunk = "\n".join(raw_lines[start_idx:end_idx])
        return f"📄 **Document Answer:**\n\n{matched_chunk}"
    else:
        # Guarantee an answer from the document - never return 'not found' / 'illa'
        matched_chunk = "\n".join(raw_lines[:6])
        return f"📄 **Document Information:**\n\n{matched_chunk}"


# =========================================================
# FIND ANSWER (OKF & DOCUMENT SEARCH)
# =========================================================

def find_answer_in_text(text, question_clean, question_words):
    """
    Splits text into sections/paragraphs and finds the highest scoring section.
    Used for OKF Knowledge files.
    """
    if not text:
        return None, 0

    # Split by markdown headers (#, ##, ###) or double newlines
    if "#" in text:
        sections = re.split(r"\n(?=#)", text)
    else:
        sections = [s for s in text.split("\n\n") if s.strip()]

    best_section = None
    best_score = 0

    for section in sections:
        section_clean = clean_text(section)
        section_words = set(section_clean.split())
        score = 0

        for word in question_words:
            if word in STOP_WORDS:
                continue
            if word in section_words:
                score += 1

        # Exact phrase bonus
        if question_clean and question_clean in section_clean:
            score += 10

        if score > best_score:
            best_score = score
            best_section = section

    return best_section, best_score


def find_answer(question, document_text=""):

    question_clean = clean_text(question)

    if not question_clean:
        return "Please enter a valid question."

    question_words = [
        normalize_word(word)
        for word in question_clean.split()
        if normalize_word(word)
    ]

    # 1. First, search inside uploaded document if present
    # Guarantees that when a document is provided, it always returns the answer from that document!
    if document_text and document_text.strip():
        doc_answer = find_answer_in_document(document_text, question)
        if doc_answer:
            return doc_answer

    # -----------------------------------------------------
    # EXACT TOPIC DETECTION
    # -----------------------------------------------------

    topic_keywords = {
        "python": [
            "python",
            "py"
        ],

        "django": [
            "django",
            "drf",
            "restframework",
            "rest",
            "api"
        ],

        "javascript": [
            "javascript",
            "js"
        ],

        "sql": [
            "sql",
            "mysql",
            "database",
            "db"
        ]
    }

    detected_topic = None

    for topic, keywords in topic_keywords.items():
        for keyword in keywords:
            if keyword in question_words:
                detected_topic = topic
                break
        if detected_topic:
            break

    # -----------------------------------------------------
    # GREETING DETECTION
    # -----------------------------------------------------
    GREETINGS = {"hi", "hello", "hey", "hii", "hiii", "vanakkam", "hola"}
    if question_clean in GREETINGS:
        return (
            "👋 Hello! How can I assist you today?\n\n"
            "You can attach a document (PDF, DOCX, TXT, CSV) to ask questions about its content, "
            "or ask any programming questions."
        )

    # -----------------------------------------------------
    # CHECK IF DOCUMENT IS REQUIRED BUT NOT ATTACHED
    # -----------------------------------------------------
    DOC_INQUIRY_KEYWORDS = {
        "document", "documents", "doc", "docs", "file", "files",
        "attach", "attached", "attachment", "upload", "uploaded",
        "pdf", "docx", "csv", "data", "datas", "pick", "order", "table"
    }

    NO_DOC_MSG = (
        "📄 **No Document Attached**\n\n"
        "There is currently no document attached to this chat. "
        "Please attach or upload a file (PDF, DOCX, TXT, CSV) to analyze and view its details."
    )

    if not (document_text and document_text.strip()):
        is_doc_inquiry = any(w in DOC_INQUIRY_KEYWORDS for w in question_words)
        if is_doc_inquiry or not detected_topic:
            return NO_DOC_MSG

    # 2. Search local Open Knowledge Base (OKF)
    knowledge = read_knowledge()

    if not knowledge:
        return NO_DOC_MSG

    # -----------------------------------------------------
    # SEARCH CONTENT
    # -----------------------------------------------------

    content = ""

    if detected_topic and detected_topic in knowledge:
        content = knowledge[detected_topic]
    else:
        for topic, topic_content in knowledge.items():
            content_clean = clean_text(topic_content)
            if any(
                word in content_clean.split()
                for word in question_words
                if word not in STOP_WORDS
            ):
                content = topic_content
                break

    if not content:
        if not (document_text and document_text.strip()):
            return NO_DOC_MSG
        return (
            "Sorry, I could not find a relevant answer in the attached document "
            "or Open Knowledge Base (OKF)."
        )

    # -----------------------------------------------------
    # MATCH QUESTION WITH SECTION
    # -----------------------------------------------------

    best_section, best_score = find_answer_in_text(
        content,
        question_clean,
        question_words
    )

    if best_section and best_score > 0:
        return best_section.strip()

    # -----------------------------------------------------
    # FALLBACK
    # -----------------------------------------------------

    return (
        "I found the related topic in the Open Knowledge Base, but could not "
        "find an exact section matching your question."
    )