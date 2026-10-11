import csv
import io
import os
import requests

import docx
import pypdf

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .chatbot import find_answer
from .models import Document


def home(request):
    return render(
        request,
        "chatbot/index.html"
    )


# Set to True later when you want to enable Google Gemini API again.
# Currently set to False to use OKF (Open Knowledge Format) exclusively.
USE_GEMINI_API = False

# In-memory document text cache to speed up multi-turn Q&A on attached documents
_DOC_TEXT_CACHE = {}


def extract_text_from_file_bytes(file_bytes, filename):
    """
    Extracts clean readable text from uploaded documents (DOCX, PDF, CSV, TXT).
    """
    ext = os.path.splitext(filename)[1].lower()

    # 1. DOCX Support (Paragraphs & Tables)
    if ext == ".docx":
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            lines = []
            for p in doc.paragraphs:
                t = p.text.strip().replace("\xa0", " ").replace("\ufffd", "")
                if t:
                    lines.append(t)
            for table in doc.tables:
                for row in table.rows:
                    cells = [
                        c.text.strip().replace("\xa0", " ").replace("\ufffd", "")
                        for c in row.cells
                        if c.text.strip()
                    ]
                    if cells:
                        unique: list[str] = []
                        for c in cells:
                            if not unique or c != unique[-1]:
                                unique.append(c)
                        lines.append(" | ".join(unique))
            return "\n".join(lines)
        except Exception:
            return ""

    # 2. PDF Support
    elif ext == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = []
            for page in reader.pages:
                t = page.extract_text()
                if t and t.strip():
                    pages.append(t.strip())
            return "\n\n".join(pages)
        except Exception:
            return ""

    # 3. CSV Support
    elif ext == ".csv":
        try:
            try:
                decoded_str = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                decoded_str = file_bytes.decode("latin-1", errors="ignore")
            reader = csv.reader(io.StringIO(decoded_str))
            rows = []
            for r in reader:
                if any(cell.strip() for cell in r):
                    rows.append(" | ".join([c.strip() for c in r]))
            return "\n".join(rows)
        except Exception:
            return ""

    # 4. Plain Text, Markdown, JSON, etc.
    else:
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="ignore")


def get_text_for_document_name(doc_name):
    """
    Retrieves document content by name from cache, database, or documents directory.
    """
    if not doc_name:
        return ""

    # Check cache first
    if doc_name in _DOC_TEXT_CACHE:
        return _DOC_TEXT_CACHE[doc_name]

    # Search in database
    try:
        doc_obj = Document.objects.filter(title__icontains=doc_name).order_by("-uploaded_at").first()
        if doc_obj and doc_obj.file:
            if os.path.exists(doc_obj.file.path):
                with open(doc_obj.file.path, "rb") as f:
                    extracted = extract_text_from_file_bytes(f.read(), doc_obj.title)
                    if extracted:
                        _DOC_TEXT_CACHE[doc_name] = extracted
                        return extracted
    except Exception:
        pass

    # Search in documents folder
    try:
        base_dir = getattr(settings, "BASE_DIR", None)
        if base_dir:
            docs_dir = os.path.join(base_dir, "documents")
            if os.path.exists(docs_dir):
                for f_name in os.listdir(docs_dir):
                    if doc_name.lower() in f_name.lower():
                        full_path = os.path.join(docs_dir, f_name)
                        with open(full_path, "rb") as f:
                            extracted = extract_text_from_file_bytes(f.read(), f_name)
                            if extracted:
                                _DOC_TEXT_CACHE[doc_name] = extracted
                                return extracted
    except Exception:
        pass

    return ""


@csrf_exempt
def chat(request):

    if request.method != "POST":

        return JsonResponse(
            {
                "error": "Only POST method is allowed."
            },
            status=405
        )

    try:

        question = request.POST.get(
            "question",
            ""
        ).strip()

        if not question:

            return JsonResponse(
                {
                    "error": "Please enter a question."
                },
                status=400
            )

        # Handle uploaded document from request.FILES or existing document name
        uploaded_file = request.FILES.get("document") or request.FILES.get("file")
        document_name = request.POST.get("document_name", "").strip()
        file_content = ""
        active_doc_name = None

        if uploaded_file:
            active_doc_name = uploaded_file.name
            try:
                raw_bytes = uploaded_file.read()
                file_content = extract_text_from_file_bytes(raw_bytes, uploaded_file.name)
                _DOC_TEXT_CACHE[uploaded_file.name] = file_content
                uploaded_file.seek(0)
            except Exception:
                file_content = ""

            try:
                Document.objects.create(
                    title=uploaded_file.name,
                    file=uploaded_file
                )
            except Exception:
                pass
        elif document_name:
            active_doc_name = document_name
            file_content = get_text_for_document_name(document_name)

        # -----------------------------------------------------
        # 1. OKF (OPEN KNOWLEDGE FORMAT) & DOCUMENT SEARCH
        # -----------------------------------------------------
        okf_answer = find_answer(question, document_text=file_content)

        # If Gemini API is disabled (default per requirement), return OKF answer directly!
        if not USE_GEMINI_API:
            return JsonResponse(
                {
                    "question": question,
                    "answer": okf_answer,
                    "document": active_doc_name,
                    "engine": "OKF"
                }
            )

        # -----------------------------------------------------
        # 2. GEMINI API (Can be re-enabled later by setting USE_GEMINI_API = True)
        # -----------------------------------------------------
        if uploaded_file and file_content:
            prompt_text = (
                f"Document ({uploaded_file.name}):\n{file_content}\n\n"
                f"Answer this question clearly and beginner-friendly based on the document:\n\n{question}"
            )
        else:
            prompt_text = (
                "Answer this question clearly "
                "and beginner-friendly:\n\n"
                + question
            )

        # Gemini API
        url = (
            "https://generativelanguage.googleapis.com/"
            "v1beta/models/gemini-1.5-flash:generateContent"
        )

        response = requests.post(
            url,
            params={
                "key": settings.GEMINI_API_KEY
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt_text
                            }
                        ]
                    }
                ]
            },
            timeout=30
        )

        # Fallback to active models if gemini-1.5-flash is unavailable or busy
        if response.status_code != 200:
            for fallback_model in ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]:
                fallback_url = (
                    f"https://generativelanguage.googleapis.com/"
                    f"v1beta/models/{fallback_model}:generateContent"
                )
                fallback_response = requests.post(
                    fallback_url,
                    params={
                        "key": settings.GEMINI_API_KEY
                    },
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": prompt_text
                                    }
                                ]
                            }
                        ]
                    },
                    timeout=30
                )
                if fallback_response.status_code == 200:
                    response = fallback_response
                    break

        response_data = response.json()

        if response.status_code != 200:

            # Fallback to OKF knowledge search answer if available
            if okf_answer and not okf_answer.startswith("Sorry") and not okf_answer.startswith("Knowledge files"):
                return JsonResponse(
                    {
                        "question": question,
                        "answer": okf_answer,
                        "document": uploaded_file.name if uploaded_file else None
                    }
                )

            return JsonResponse(
                {
                    "error": response_data.get(
                        "error",
                        {}
                    ).get(
                        "message",
                        "Gemini API error."
                    )
                },
                status=500
            )

        gemini_answer = (
            response_data["candidates"][0]
            ["content"]["parts"][0]["text"]
        )

        return JsonResponse(
            {
                "question": question,
                "answer": gemini_answer,
                "document": uploaded_file.name if uploaded_file else None
            }
        )

    except Exception as e:

        return JsonResponse(
            {
                "error": str(e)
            },
            status=500
        )


def get_documents(request):
    """
    Returns list of all uploaded documents with timestamps for the pop-up modal.
    """
    try:
        documents = Document.objects.all().order_by("-uploaded_at")
        doc_list = []
        for doc in documents:
            doc_list.append({
                "id": doc.id,
                "title": doc.title,
                "file_url": doc.file.url if doc.file else "",
                "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else "",
            })
        return JsonResponse({"documents": doc_list})
    except Exception as e:
        return JsonResponse({"documents": [], "error": str(e)})