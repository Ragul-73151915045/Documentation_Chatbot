# pyrefly: ignore [missing-import]
from django.urls import path

from . import views


urlpatterns = [
    path("", views.home, name="home"),
    path("chat/", views.chat, name="chat"),
    path("documents/", views.get_documents, name="documents"),
]