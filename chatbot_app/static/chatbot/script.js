/**
 * Docu-AI — Modern ChatGPT-Inspired Chatbot Interface
 * Multi-Chat Sessions, Pinned Messages, Document Upload Pop-up Modal & Dark/Light Theme
 */

document.addEventListener("DOMContentLoaded", function () {

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const brandHomeBtn = document.getElementById("brandHomeBtn");
    const sidebarLogoBtn = document.getElementById("sidebarLogoBtn");
    const sidebarOpenLogoBtn = document.getElementById("sidebarOpenLogoBtn");

    const newChatBtn = document.getElementById("newChatBtn");
    const chatHistoryList = document.getElementById("chatHistoryList");
    const chatsCount = document.getElementById("chatsCount");
    const pinnedList = document.getElementById("pinnedList");
    const pinnedCount = document.getElementById("pinnedCount");

    // Sidebar Bottom Upload (Above Rahul Online)
    const sidebarUploadTriggerBtn = document.getElementById("sidebarUploadTriggerBtn");
    const sidebarActiveDoc = document.getElementById("sidebarActiveDoc");
    const sidebarDocName = document.getElementById("sidebarDocName");
    const sidebarRemoveDocBtn = document.getElementById("sidebarRemoveDocBtn");

    // Top Navbar & Theme Toggle
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const themeLabel = document.getElementById("themeLabel");
    const topChatTitle = document.getElementById("topChatTitle");
    const clearChatBtn = document.getElementById("clearChatBtn");

    // Account Details Dropdown
    const accountDropdownWrapper = document.getElementById("accountDropdownWrapper");
    const accountTriggerBtn = document.getElementById("accountTriggerBtn");
    const accountTriggerAvatar = document.getElementById("accountTriggerAvatar");
    const accountMenuDropdown = document.getElementById("accountMenuDropdown");
    const accountNewChatBtn = document.getElementById("accountNewChatBtn");
    const accountUploadDocsBtn = document.getElementById("accountUploadDocsBtn");
    const accountClearChatBtn = document.getElementById("accountClearChatBtn");
    const accountLogoutBtn = document.getElementById("accountLogoutBtn");

    // Chat Area
    const chatScrollContainer = document.getElementById("chatScrollContainer");
    const welcomeHero = document.getElementById("welcomeHero");
    const chatMessages = document.getElementById("chatMessages");
    const typingIndicator = document.getElementById("typingIndicator");
    const statusIcon = document.getElementById("statusIcon");
    const statusText = document.getElementById("statusText");

    // Bottom Input Bar
    const filePreviewBar = document.getElementById("filePreviewBar");
    const fileNameDisplay = document.getElementById("fileNameDisplay");
    const fileSizeDisplay = document.getElementById("fileSizeDisplay");
    const removeFileBtn = document.getElementById("removeFileBtn");

    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const questionInput = document.getElementById("questionInput");
    const sendButton = document.getElementById("sendButton");
    const toastContainer = document.getElementById("toastContainer");

    // Upload Pop-up Modal Elements
    const uploadModalOverlay = document.getElementById("uploadModalOverlay");
    const uploadModal = document.getElementById("uploadModal");
    const closeUploadModalBtn = document.getElementById("closeUploadModalBtn");
    const modalCancelBtn = document.getElementById("modalCancelBtn");
    const modalAttachBtn = document.getElementById("modalAttachBtn");
    const modalDropArea = document.getElementById("modalDropArea");
    const modalChooseFileBtn = document.getElementById("modalChooseFileBtn");
    const modalFileInput = document.getElementById("modalFileInput");
    const modalSelectedFileCard = document.getElementById("modalSelectedFileCard");
    const modalFileName = document.getElementById("modalFileName");
    const modalFileSize = document.getElementById("modalFileSize");
    const modalRemoveFileBtn = document.getElementById("modalRemoveFileBtn");

    // Uploaded Documents Navigation & History Modal Elements
    const uploadedDocsNavBtn = document.getElementById("uploadedDocsNavBtn");
    const uploadedDocsCountPill = document.getElementById("uploadedDocsCountPill");
    const uploadedDocsModalOverlay = document.getElementById("uploadedDocsModalOverlay");
    const uploadedDocsModal = document.getElementById("uploadedDocsModal");
    const docsModalCountPill = document.getElementById("docsModalCountPill");
    const closeDocsHistoryModalBtn = document.getElementById("closeDocsHistoryModalBtn");
    const closeDocsHistoryFooterBtn = document.getElementById("closeDocsHistoryFooterBtn");
    const uploadedDocsContainer = document.getElementById("uploadedDocsContainer");

    // Design 1: Glassmorphic Glowing Document (Translucent cyan/electric blue glowing edges & clean lines)
    const BOT_AVATAR_HTML = `
        <div class="message-avatar bot-avatar" title="Docu-AI Assistant">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" fill="rgba(56, 189, 248, 0.16)" stroke="#38bdf8" stroke-width="1.7" stroke-linejoin="round"/>
                <path d="M14 2V7.5C14 7.77614 14.2239 8 14.5 8H20" stroke="#38bdf8" stroke-width="1.7" fill="rgba(56, 189, 248, 0.35)" stroke-linejoin="round"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke="#38bdf8" stroke-width="1.7" stroke-linecap="round"/>
                <line x1="8" y1="15" x2="16" y2="15" stroke="#38bdf8" stroke-width="1.7" stroke-linecap="round"/>
                <line x1="8" y1="18" x2="13" y2="18" stroke="#38bdf8" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
        </div>
    `;

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================
    const STORAGE_KEY = "docu_ai_chats_v2";
    const DOCS_STORAGE_KEY = "docu_ai_uploaded_documents_v2";
    const THEME_KEY = "docu_ai_theme";

    let chats = [];
    let uploadedDocs = [];
    let currentChatId = null;
    let currentUploadedFile = null;
    let modalPendingFile = null;

    // =========================================================================
    // THEME MANAGEMENT (DARK / LIGHT MODE)
    // =========================================================================
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
        applyTheme(savedTheme, false);
    }

    function applyTheme(theme, showNotice = true) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(THEME_KEY, theme);

        if (themeLabel) {
            themeLabel.textContent = theme === "light" ? "Light" : "Dark";
        }

        if (showNotice) {
            showToast(theme === "light" ? "☀️ Switched to Light Mode" : "🌙 Switched to Dark Mode");
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const nextTheme = currentTheme === "light" ? "dark" : "light";
        applyTheme(nextTheme, true);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", toggleTheme);
    }

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================
    function showToast(text, icon = "ℹ️") {
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3000);
    }

    // =========================================================================
    // STATUS INDICATOR (Generating response)
    // =========================================================================
    function startDynamicStatus(hasDocument = false) {
        if (statusIcon) statusIcon.textContent = "📄";
        if (statusText) statusText.textContent = "Generating response";
    }

    function stopDynamicStatus() {
        // No background timer needed
    }

    // =========================================================================
    // STORAGE & CHAT SESSIONS
    // =========================================================================
    function loadStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            chats = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load chats from localStorage:", e);
            chats = [];
        }

        if (!Array.isArray(chats) || chats.length === 0) {
            createNewChat(false);
        } else {
            currentChatId = chats[0].id;
        }
    }

    function saveStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch (e) {
            console.error("Failed to save chats to localStorage:", e);
        }
        renderSidebar();
    }

    function getCurrentChat() {
        return chats.find(c => c.id === currentChatId);
    }

    function createNewChat(shouldFocus = true) {
        const newChat = {
            id: "chat_" + Date.now(),
            title: "New chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
        chats.unshift(newChat);
        currentChatId = newChat.id;
        saveStorage();
        renderCurrentChat();

        if (shouldFocus && questionInput) {
            questionInput.focus();
        }
    }

    function selectChat(chatId) {
        if (currentChatId === chatId) return;
        currentChatId = chatId;
        renderSidebar();
        renderCurrentChat();
        closeMobileSidebar();
    }

    function deleteChat(chatId, e) {
        if (e) e.stopPropagation();
        chats = chats.filter(c => c.id !== chatId);
        if (chats.length === 0) {
            createNewChat(false);
        } else if (currentChatId === chatId) {
            currentChatId = chats[0].id;
        }
        saveStorage();
        renderCurrentChat();
        showToast("Chat deleted", "🗑️");
    }

    function clearCurrentChat() {
        const chat = getCurrentChat();
        if (!chat) return;
        chat.messages = [];
        chat.title = "New chat";
        chat.updatedAt = Date.now();
        saveStorage();
        renderCurrentChat();
        showToast("Chat cleared", "🧹");
    }

    // =========================================================================
    // PINNED MESSAGES
    // =========================================================================
    function togglePinMessage(chatId, msgId, e) {
        if (e) e.stopPropagation();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const msg = chat.messages.find(m => m.id === msgId);
        if (!msg) return;

        msg.isPinned = !msg.isPinned;
        chat.updatedAt = Date.now();
        saveStorage();
        renderCurrentChat();

        if (msg.isPinned) {
            showToast("Message pinned to sidebar!", "📌");
        } else {
            showToast("Message unpinned", "📌");
        }
    }

    function jumpToPinnedMessage(chatId, msgId) {
        if (currentChatId !== chatId) {
            selectChat(chatId);
        }

        setTimeout(() => {
            const el = document.getElementById("msg-" + msgId);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("flash-highlight");
                setTimeout(() => {
                    el.classList.remove("flash-highlight");
                }, 2000);
            }
        }, 150);
        closeMobileSidebar();
    }

    // =========================================================================
    // PIN CHAT SESSION
    // =========================================================================
    function togglePinChat(chatId, e) {
        if (e) e.stopPropagation();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        chat.isPinned = !chat.isPinned;
        chat.updatedAt = Date.now();
        saveStorage();
        showToast(chat.isPinned ? "Chat pinned to top 📌" : "Chat unpinned 📌");
    }

    // =========================================================================
    // RENDERING
    // =========================================================================
    function renderSidebar() {
        // 1. Render Old Chats
        if (chatHistoryList) {
            chatHistoryList.innerHTML = "";
            chatsCount.textContent = chats.length;

            // Sort pinned chats first, then newest updated
            const sortedChats = [...chats].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            });

            sortedChats.forEach(chat => {
                const item = document.createElement("div");
                item.className = `nav-item ${chat.id === currentChatId ? "active" : ""} ${chat.isPinned ? "is-chat-pinned" : ""}`;
                item.title = chat.title;

                const chatIconSvg = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="chat-msg-icon-svg">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;

                item.innerHTML = `
                    <div class="nav-item-content">
                        <span class="nav-item-icon">${chat.isPinned ? "📌" : chatIconSvg}</span>
                        <span class="nav-item-title">${escapeHtml(chat.title)}</span>
                    </div>
                    <div class="nav-item-actions">
                        <button type="button" class="item-action-btn pin-chat-btn ${chat.isPinned ? "pinned-active" : ""}" title="${chat.isPinned ? "Unpin chat" : "Pin chat"}">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="${chat.isPinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="17" x2="12" y2="22"></line>
                                <path d="M5 17h14l-2-6V4h1V2H6v2h1v7l-2 6z"></path>
                            </svg>
                        </button>
                        <button type="button" class="item-action-btn delete-chat-btn" title="Delete conversation">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;

                item.addEventListener("click", () => selectChat(chat.id));

                const pinBtn = item.querySelector(".pin-chat-btn");
                if (pinBtn) {
                    pinBtn.addEventListener("click", (e) => togglePinChat(chat.id, e));
                }

                const delBtn = item.querySelector(".delete-chat-btn");
                if (delBtn) {
                    delBtn.addEventListener("click", (e) => deleteChat(chat.id, e));
                }

                chatHistoryList.appendChild(item);
            });
        }

        // 2. Render Pinned Chats (Under PINNED MESSAGES)
        if (pinnedList) {
            pinnedList.innerHTML = "";
            const pinnedChats = chats.filter(c => c.isPinned);

            if (pinnedCount) {
                pinnedCount.textContent = pinnedChats.length;
            }

            pinnedChats.forEach(chat => {
                const pinDiv = document.createElement("div");
                pinDiv.className = `nav-item pinned-item ${chat.id === currentChatId ? "active" : ""}`;
                pinDiv.title = chat.title;

                pinDiv.innerHTML = `
                    <div class="nav-item-content">
                        <span class="nav-item-icon" style="color: var(--accent-pin);">📌</span>
                        <span class="nav-item-title">${escapeHtml(chat.title)}</span>
                    </div>
                    <div class="nav-item-actions">
                        <button type="button" class="item-action-btn unpin-btn" title="Unpin conversation">✖</button>
                    </div>
                `;

                pinDiv.addEventListener("click", () => selectChat(chat.id));

                const unpinBtn = pinDiv.querySelector(".unpin-btn");
                if (unpinBtn) {
                    unpinBtn.addEventListener("click", (e) => togglePinChat(chat.id, e));
                }

                pinnedList.appendChild(pinDiv);
            });
        }
    }

    function renderCurrentChat() {
        const chat = getCurrentChat();
        if (!chat) return;

        // Header title is removed per requirement so typing does not display question on top
        if (topChatTitle) {
            topChatTitle.innerHTML = "";
        }

        if (typingIndicator) {
            typingIndicator.style.display = "none";
            stopDynamicStatus();
        }

        if (!chatMessages) return;
        chatMessages.innerHTML = "";

        if (chat.messages.length === 0) {
            if (welcomeHero) welcomeHero.style.display = "flex";
        } else {
            if (welcomeHero) welcomeHero.style.display = "none";

            chat.messages.forEach(msg => {
                const msgEl = createMessageElement(chat.id, msg);
                chatMessages.appendChild(msgEl);
            });
        }

        scrollToBottom();
    }

    function createMessageElement(chatId, msg) {
        const item = document.createElement("div");
        item.id = "msg-" + msg.id;
        item.className = `message-item ${msg.role === "user" ? "user-item" : "bot-item"} ${msg.isPinned ? "is-pinned" : ""}`;

        const isUser = msg.role === "user";

        let docHtml = "";
        if (msg.documentName) {
            docHtml = `
                <div class="doc-attachment-pill">
                    <span>📄</span>
                    <span>${escapeHtml(msg.documentName)}</span>
                </div>
            `;
        }

        let pinnedBadgeHtml = "";
        if (msg.isPinned) {
            pinnedBadgeHtml = `<div class="pinned-badge">📌 Pinned Message</div>`;
        }

        if (isUser) {
            item.innerHTML = `
                <div class="message-content-wrapper">
                    ${docHtml}
                    <div class="user-bubble">${escapeHtml(msg.text)}</div>
                </div>
                <div class="message-avatar user-avatar-msg">👤</div>
            `;
        } else {
            const formattedBody = formatMarkdown(msg.text);

            item.innerHTML = `
                ${BOT_AVATAR_HTML}
                <div class="message-content-wrapper">
                    ${pinnedBadgeHtml}
                    ${docHtml}
                    <div class="bot-bubble">${formattedBody}</div>
                    <div class="message-actions">
                        <button type="button" class="msg-btn copy-msg-btn" title="Copy text">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Copy</span>
                        </button>
                        <button type="button" class="msg-btn pin-msg-btn ${msg.isPinned ? "pinned-active" : ""}" title="${msg.isPinned ? "Unpin message" : "Pin message"}">
                            <span>📌</span>
                            <span>${msg.isPinned ? "Pinned" : "Pin"}</span>
                        </button>
                    </div>
                </div>
            `;

            const copyBtn = item.querySelector(".copy-msg-btn");
            if (copyBtn) {
                copyBtn.addEventListener("click", () => {
                    navigator.clipboard.writeText(msg.text).then(() => {
                        copyBtn.querySelector("span").textContent = "Copied!";
                        setTimeout(() => {
                            copyBtn.querySelector("span").textContent = "Copy";
                        }, 2000);
                    });
                });
            }

            const pinBtn = item.querySelector(".pin-msg-btn");
            if (pinBtn) {
                pinBtn.addEventListener("click", (e) => togglePinMessage(chatId, msg.id, e));
            }

            const codeBlocks = item.querySelectorAll("pre");
            codeBlocks.forEach(pre => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "msg-btn";
                btn.style.position = "absolute";
                btn.style.top = "8px";
                btn.style.right = "8px";
                btn.style.background = "rgba(125,125,125,0.15)";
                btn.innerHTML = "<span>Copy Code</span>";
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const code = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        btn.querySelector("span").textContent = "Copied!";
                        setTimeout(() => {
                            btn.querySelector("span").textContent = "Copy Code";
                        }, 2000);
                    });
                });
                pre.appendChild(btn);
            });
        }

        return item;
    }

    function scrollToBottom() {
        if (chatScrollContainer) {
            chatScrollContainer.scrollTop = chatScrollContainer.scrollHeight;
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatMarkdown(text) {
        if (!text) return "";

        const codeBlocks = [];
        let html = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (match, lang, code) {
            const index = codeBlocks.length;
            codeBlocks.push(`<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`);
            return `__CODE_BLOCK_${index}__`;
        });

        html = html.replace(/`([^`]+)`/g, function (match, code) {
            return `<code>${escapeHtml(code)}</code>`;
        });

        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
        html = html.replace(/<\/ul>\s*<ul>/gim, '');

        const paragraphs = html.split(/\n{2,}/);
        html = paragraphs.map(p => {
            if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('__CODE_BLOCK_')) {
                return p;
            }
            return `<p>${p.replace(/\n/g, '<br>')}</p>`;
        }).join('');

        codeBlocks.forEach((block, index) => {
            html = html.replace(`__CODE_BLOCK_${index}__`, block);
        });

        return html;
    }

    // =========================================================================
    // UPLOAD DOCUMENTS MODAL & FILE MANAGEMENT
    // =========================================================================
    function formatFileSize(bytes) {
        if (!bytes) return "0 KB";
        return bytes > 1024 * 1024
            ? (bytes / (1024 * 1024)).toFixed(1) + " MB"
            : Math.round(bytes / 1024) + " KB";
    }

    function openUploadModal() {
        modalPendingFile = currentUploadedFile;
        updateModalPreview();
        if (uploadModalOverlay) {
            uploadModalOverlay.classList.add("active");
        }
    }

    function closeUploadModal() {
        if (uploadModalOverlay) {
            uploadModalOverlay.classList.remove("active");
        }
        modalPendingFile = null;
    }

    function updateModalPreview() {
        if (modalPendingFile) {
            if (modalFileName) modalFileName.textContent = modalPendingFile.name;
            if (modalFileSize) modalFileSize.textContent = formatFileSize(modalPendingFile.size);
            if (modalSelectedFileCard) modalSelectedFileCard.style.display = "flex";
            if (modalDropArea) modalDropArea.style.display = "none";
        } else {
            if (modalSelectedFileCard) modalSelectedFileCard.style.display = "none";
            if (modalDropArea) modalDropArea.style.display = "flex";
        }
    }

    function validateFile(file) {
        if (!file) return false;
        const validExtensions = [".pdf", ".doc", ".docx", ".txt", ".csv"];
        const lowerName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

        if (!isValid) {
            showToast("Unsupported file type. Use PDF, DOC, DOCX, TXT, CSV", "⚠️");
            return false;
        }
        return true;
    }

    function handleFileChosen(file) {
        if (!validateFile(file)) return;
        modalPendingFile = file;
        updateModalPreview();
    }

    function confirmAttachFile() {
        if (!modalPendingFile) {
            showToast("Please choose a document first", "⚠️");
            return;
        }

        currentUploadedFile = modalPendingFile;
        recordUploadedDocument(currentUploadedFile);

        // Update Bottom Bar Preview
        if (fileNameDisplay) fileNameDisplay.textContent = currentUploadedFile.name;
        if (fileSizeDisplay) fileSizeDisplay.textContent = `(${formatFileSize(currentUploadedFile.size)})`;
        if (filePreviewBar) filePreviewBar.style.display = "flex";

        // Update Sidebar Active Document (Above Rahul Online)
        if (sidebarDocName) sidebarDocName.textContent = currentUploadedFile.name;
        if (sidebarActiveDoc) sidebarActiveDoc.style.display = "flex";

        closeUploadModal();
        showToast(`Attached: ${currentUploadedFile.name}`, "📄");

        if (questionInput) questionInput.focus();
    }

    function removeCurrentFile() {
        currentUploadedFile = null;
        modalPendingFile = null;
        if (fileInput) fileInput.value = "";
        if (modalFileInput) modalFileInput.value = "";
        if (filePreviewBar) filePreviewBar.style.display = "none";
        if (sidebarActiveDoc) sidebarActiveDoc.style.display = "none";
        updateModalPreview();
        showToast("Attached document removed", "✖");
    }

    // =========================================================================
    // UPLOADED DOCUMENTS HISTORY & TIMESTAMP LOGIC
    // =========================================================================
    function formatDocTimestamp(isoOrDateString) {
        if (!isoOrDateString) {
            const now = new Date();
            return {
                text: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isToday: true
            };
        }

        const docDate = new Date(isoOrDateString);
        if (isNaN(docDate.getTime())) {
            return { text: isoOrDateString, isToday: false };
        }

        const now = new Date();
        const isToday = (
            docDate.getDate() === now.getDate() &&
            docDate.getMonth() === now.getMonth() &&
            docDate.getFullYear() === now.getFullYear()
        );

        if (isToday) {
            // Today: ONLY time (e.g. 11:42 AM)
            const timeStr = docDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { text: timeStr, isToday: true };
        } else {
            // Past: Date with time (e.g. 05 Oct 2026, 11:42 AM)
            const dateStr = docDate.toLocaleDateString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            const timeStr = docDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            return { text: `${dateStr}, ${timeStr}`, isToday: false };
        }
    }

    async function loadUploadedDocs() {
        try {
            const local = localStorage.getItem(DOCS_STORAGE_KEY);
            uploadedDocs = local ? JSON.parse(local) : [];
        } catch (e) {
            uploadedDocs = [];
        }

        // Fetch documents saved in database from Django /documents/ endpoint
        try {
            const response = await fetch("/documents/");
            const data = await response.json();
            if (data && data.documents && Array.isArray(data.documents)) {
                data.documents.forEach(doc => {
                    const existing = uploadedDocs.find(d => d.name === doc.title);
                    if (!existing) {
                        uploadedDocs.push({
                            id: "doc_" + doc.id,
                            name: doc.title,
                            fileUrl: doc.file_url,
                            uploadedAt: doc.uploaded_at || new Date().toISOString()
                        });
                    }
                });
                saveUploadedDocs();
            }
        } catch (e) {
            console.warn("Could not sync documents from /documents/:", e);
        }

        updateUploadedDocsBadge();
    }

    function saveUploadedDocs() {
        try {
            localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(uploadedDocs));
        } catch (e) {
            console.error("Failed to save uploaded documents:", e);
        }
        updateUploadedDocsBadge();
    }

    function updateUploadedDocsBadge() {
        if (uploadedDocsCountPill) {
            uploadedDocsCountPill.textContent = uploadedDocs.length;
        }
        if (docsModalCountPill) {
            docsModalCountPill.textContent = `${uploadedDocs.length} files`;
        }
    }

    function recordUploadedDocument(file) {
        if (!file || !file.name) return;
        const existingIndex = uploadedDocs.findIndex(d => d.name === file.name);
        const docEntry = {
            id: "doc_" + Date.now(),
            name: file.name,
            size: file.size || 0,
            uploadedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            uploadedDocs[existingIndex] = docEntry;
        } else {
            uploadedDocs.unshift(docEntry);
        }
        saveUploadedDocs();
    }

    function renderUploadedDocsModal() {
        if (!uploadedDocsContainer) return;
        uploadedDocsContainer.innerHTML = "";

        if (uploadedDocs.length === 0) {
            uploadedDocsContainer.innerHTML = `
                <div class="empty-state-text" style="padding: 24px; text-align: center; color: var(--text-muted);">
                    No documents uploaded yet.<br>Upload a PDF, DOCX, or text file to view it here.
                </div>
            `;
            return;
        }

        // Sort newest first
        const sortedDocs = [...uploadedDocs].sort((a, b) => {
            return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
        });

        sortedDocs.forEach(doc => {
            const { text: timeDisplay, isToday } = formatDocTimestamp(doc.uploadedAt);
            const item = document.createElement("div");
            item.className = "doc-history-item";

            item.innerHTML = `
                <div class="doc-history-left">
                    <div class="doc-history-icon">📄</div>
                    <div class="doc-history-details">
                        <span class="doc-history-name" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</span>
                        <span class="doc-history-time">
                            <span class="doc-history-time-badge ${isToday ? "is-today" : ""}">
                                ${isToday ? "🕒 " : "📅 "} ${escapeHtml(timeDisplay)}
                            </span>
                            ${doc.size ? `<span style="opacity: 0.7;">• ${formatFileSize(doc.size)}</span>` : ""}
                        </span>
                    </div>
                </div>
                <div class="doc-history-actions">
                    <button type="button" class="doc-action-use-btn" title="Attach to current chat">
                        Attach to Chat
                    </button>
                </div>
            `;

            const useBtn = item.querySelector(".doc-action-use-btn");
            if (useBtn) {
                useBtn.addEventListener("click", () => {
                    currentUploadedFile = { name: doc.name, size: doc.size || 0 };
                    if (fileNameDisplay) fileNameDisplay.textContent = doc.name;
                    if (fileSizeDisplay) fileSizeDisplay.textContent = doc.size ? `(${formatFileSize(doc.size)})` : "";
                    if (filePreviewBar) filePreviewBar.style.display = "flex";
                    if (sidebarDocName) sidebarDocName.textContent = doc.name;
                    if (sidebarActiveDoc) sidebarActiveDoc.style.display = "flex";

                    closeUploadedDocsModal();
                    showToast(`Attached ${doc.name} to chat`, "📄");
                    if (questionInput) questionInput.focus();
                });
            }

            uploadedDocsContainer.appendChild(item);
        });
    }

    function openUploadedDocsModal() {
        renderUploadedDocsModal();
        if (uploadedDocsModalOverlay) {
            uploadedDocsModalOverlay.classList.add("active");
        }
    }

    function closeUploadedDocsModal() {
        if (uploadedDocsModalOverlay) {
            uploadedDocsModalOverlay.classList.remove("active");
        }
    }

    // Modal Trigger Buttons
    if (sidebarUploadTriggerBtn) {
        sidebarUploadTriggerBtn.addEventListener("click", openUploadModal);
    }

    if (uploadBtn) {
        uploadBtn.addEventListener("click", openUploadModal);
    }

    // Modal Close Buttons
    if (closeUploadModalBtn) closeUploadModalBtn.addEventListener("click", closeUploadModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeUploadModal);

    if (uploadModalOverlay) {
        uploadModalOverlay.addEventListener("click", function (e) {
            if (e.target === uploadModalOverlay) {
                closeUploadModal();
            }
        });
    }

    // Modal File Picker
    if (modalChooseFileBtn) {
        modalChooseFileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (modalFileInput) modalFileInput.click();
        });
    }

    if (modalDropArea) {
        modalDropArea.addEventListener("click", () => {
            if (modalFileInput) modalFileInput.click();
        });

        modalDropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            modalDropArea.classList.add("drag-over");
        });
        modalDropArea.addEventListener("dragleave", () => {
            modalDropArea.classList.remove("drag-over");
        });
        modalDropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            modalDropArea.classList.remove("drag-over");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileChosen(e.dataTransfer.files[0]);
            }
        });
    }

    if (modalFileInput) {
        modalFileInput.addEventListener("change", function () {
            if (this.files && this.files.length > 0) {
                handleFileChosen(this.files[0]);
            }
        });
    }

    if (modalRemoveFileBtn) {
        modalRemoveFileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            modalPendingFile = null;
            if (modalFileInput) modalFileInput.value = "";
            updateModalPreview();
        });
    }

    if (modalAttachBtn) {
        modalAttachBtn.addEventListener("click", confirmAttachFile);
    }

    // Direct File Input (if triggered directly)
    if (fileInput) {
        fileInput.addEventListener("change", function () {
            if (this.files && this.files.length > 0) {
                handleFileChosen(this.files[0]);
                confirmAttachFile();
            }
        });
    }

    if (removeFileBtn) removeFileBtn.addEventListener("click", removeCurrentFile);
    if (sidebarRemoveDocBtn) sidebarRemoveDocBtn.addEventListener("click", removeCurrentFile);

    // =========================================================================
    // SEND MESSAGE TO DJANGO BACKEND (/chat/)
    // =========================================================================
    async function sendMessage(textToSend) {
        const text = (textToSend || (questionInput ? questionInput.value : "")).trim();

        if (text === "") {
            if (questionInput) questionInput.focus();
            return;
        }

        const chat = getCurrentChat();
        if (!chat) return;

        if (chat.messages.length === 0) {
            chat.title = text.length > 32 ? text.substring(0, 32) + "..." : text;
        }

        const attachedFileName = currentUploadedFile ? currentUploadedFile.name : null;

        const userMsg = {
            id: "msg_" + Date.now(),
            role: "user",
            text: text,
            documentName: attachedFileName,
            isPinned: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        chat.messages.push(userMsg);
        chat.updatedAt = Date.now();
        saveStorage();
        renderCurrentChat();

        if (questionInput) {
            questionInput.value = "";
            questionInput.style.height = "auto";
            if (sendButton) sendButton.classList.remove("active");
        }

        if (welcomeHero) welcomeHero.style.display = "none";
        if (typingIndicator) {
            typingIndicator.style.display = "flex";
            startDynamicStatus(Boolean(currentUploadedFile));
            scrollToBottom();
        }

        const formData = new FormData();
        formData.append("question", text);

        if (currentUploadedFile) {
            if (currentUploadedFile instanceof File || currentUploadedFile instanceof Blob) {
                formData.append("document", currentUploadedFile);
            }
            if (currentUploadedFile.name) {
                formData.append("document_name", currentUploadedFile.name);
            }
        }

        try {
            const response = await fetch("/chat/", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            stopDynamicStatus();
            if (typingIndicator) {
                typingIndicator.style.display = "none";
            }

            let botAnswerText = "";
            if (data.error) {
                botAnswerText = `⚠️ **Error:** ${data.error}`;
            } else {
                botAnswerText = data.answer || "No response received.";
            }

            const botMsg = {
                id: "msg_" + (Date.now() + 1),
                role: "bot",
                text: botAnswerText,
                documentName: data.document || null,
                isPinned: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            chat.messages.push(botMsg);
            chat.updatedAt = Date.now();
            saveStorage();
            renderCurrentChat();

        } catch (error) {
            console.error("Chat Error:", error);
            stopDynamicStatus();
            if (typingIndicator) {
                typingIndicator.style.display = "none";
            }

            const errorMsg = {
                id: "msg_" + (Date.now() + 1),
                role: "bot",
                text: "⚠️ Sorry, a network error occurred while connecting to the AI backend. Please verify your connection.",
                isPinned: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            chat.messages.push(errorMsg);
            chat.updatedAt = Date.now();
            saveStorage();
            renderCurrentChat();
        }
    }

    // =========================================================================
    // EVENT LISTENERS & SHORTCUTS
    // =========================================================================
    if (sendButton) {
        sendButton.addEventListener("click", function (e) {
            e.preventDefault();
            sendMessage();
        });
    }

    if (questionInput) {
        questionInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        questionInput.addEventListener("input", function () {
            this.style.height = "auto";
            this.style.height = Math.min(this.scrollHeight, 200) + "px";

            if (sendButton) {
                if (this.value.trim().length > 0) {
                    sendButton.classList.add("active");
                } else {
                    sendButton.classList.remove("active");
                }
            }
        });
    }

    if (uploadedDocsNavBtn) {
        uploadedDocsNavBtn.addEventListener("click", openUploadedDocsModal);
    }

    if (closeDocsHistoryModalBtn) {
        closeDocsHistoryModalBtn.addEventListener("click", closeUploadedDocsModal);
    }

    if (closeDocsHistoryFooterBtn) {
        closeDocsHistoryFooterBtn.addEventListener("click", closeUploadedDocsModal);
    }

    if (uploadedDocsModalOverlay) {
        uploadedDocsModalOverlay.addEventListener("click", function (e) {
            if (e.target === uploadedDocsModalOverlay) {
                closeUploadedDocsModal();
            }
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener("click", () => {
            createNewChat(true);
            closeMobileSidebar();
        });
    }

    if (brandHomeBtn) {
        brandHomeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            createNewChat(true);
            closeMobileSidebar();
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", clearCurrentChat);
    }

    // =========================================================================
    // ACCOUNT DETAILS DROPDOWN HANDLERS
    // =========================================================================
    function toggleAccountDropdown() {
        if (accountDropdownWrapper) {
            accountDropdownWrapper.classList.toggle("open");
            const isOpen = accountDropdownWrapper.classList.contains("open");
            if (accountTriggerBtn) {
                accountTriggerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
            }
        }
    }

    function closeAccountDropdown() {
        if (accountDropdownWrapper) {
            accountDropdownWrapper.classList.remove("open");
            if (accountTriggerBtn) {
                accountTriggerBtn.setAttribute("aria-expanded", "false");
            }
        }
    }

    function handleLogout() {
        showToast("Logged out successfully. Have a great day, Rahul!", "👋");
        setTimeout(() => {
            createNewChat(false);
        }, 400);
    }

    if (accountTriggerBtn) {
        accountTriggerBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleAccountDropdown();
        });
    }

    if (accountNewChatBtn) {
        accountNewChatBtn.addEventListener("click", function () {
            closeAccountDropdown();
            createNewChat(true);
        });
    }

    if (accountUploadDocsBtn) {
        accountUploadDocsBtn.addEventListener("click", function () {
            closeAccountDropdown();
            openUploadModal();
        });
    }

    if (accountClearChatBtn) {
        accountClearChatBtn.addEventListener("click", function () {
            closeAccountDropdown();
            clearCurrentChat();
        });
    }

    if (accountLogoutBtn) {
        accountLogoutBtn.addEventListener("click", function () {
            closeAccountDropdown();
            handleLogout();
        });
    }

    document.addEventListener("click", function (e) {
        if (accountDropdownWrapper && !accountDropdownWrapper.contains(e.target)) {
            closeAccountDropdown();
        }
    });

    const suggestionCards = document.querySelectorAll(".suggestion-card");
    suggestionCards.forEach(card => {
        card.addEventListener("click", () => {
            const prompt = card.getAttribute("data-prompt");
            if (prompt) {
                if (questionInput) questionInput.value = prompt;
                sendMessage(prompt);
            }
        });
    });

    function showSidebar() {
        if (sidebar) {
            sidebar.classList.remove("closed");
            sidebar.classList.add("open");
        }
        if (window.innerWidth <= 768 && sidebarOverlay) {
            sidebarOverlay.classList.add("active");
        }
        try {
            localStorage.setItem("docu_ai_sidebar_closed", "false");
        } catch (e) {}
    }

    function hideSidebar() {
        if (sidebar) {
            sidebar.classList.add("closed");
            sidebar.classList.remove("open");
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }
        try {
            localStorage.setItem("docu_ai_sidebar_closed", "true");
        } catch (e) {}
    }

    const openMobileSidebar = showSidebar;
    function closeMobileSidebar() {
        if (window.innerWidth <= 768) {
            if (sidebar) sidebar.classList.remove("open");
            if (sidebarOverlay) sidebarOverlay.classList.remove("active");
        }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", showSidebar);
    if (sidebarOpenLogoBtn) sidebarOpenLogoBtn.addEventListener("click", showSidebar);
    if (sidebarLogoBtn) sidebarLogoBtn.addEventListener("click", showSidebar);
    if (brandHomeBtn) brandHomeBtn.addEventListener("click", showSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", hideSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", hideSidebar);

    document.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            createNewChat(true);
        }
        if (e.key === "Escape") {
            closeUploadModal();
            closeUploadedDocsModal();
            closeMobileSidebar();
        }
    });

    function updateUserNameInitial() {
        const userNameEl = document.querySelector(".account-user-name") || document.querySelector(".user-name");
        const nameText = userNameEl ? userNameEl.textContent.trim() : "Rahul";
        const initial = (nameText ? nameText.charAt(0) : "R").toUpperCase();
        if (accountTriggerAvatar) {
            accountTriggerAvatar.textContent = initial;
        }
        const accountHeaderAvatar = document.querySelector(".account-header-avatar");
        if (accountHeaderAvatar) {
            accountHeaderAvatar.textContent = initial;
        }
        const userAvatar = document.querySelector(".user-avatar");
        if (userAvatar) {
            userAvatar.textContent = initial;
        }
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    function initSidebarState() {
        try {
            const isClosed = localStorage.getItem("docu_ai_sidebar_closed") === "true";
            if (isClosed && window.innerWidth > 768 && sidebar) {
                sidebar.classList.add("closed");
            }
        } catch (e) {}
    }

    initTheme();
    initSidebarState();
    updateUserNameInitial();
    loadStorage();
    loadUploadedDocs();
    renderSidebar();
    renderCurrentChat();

    console.log("Docu-AI Interface Ready with Modal & Theme Switcher 🚀");
});