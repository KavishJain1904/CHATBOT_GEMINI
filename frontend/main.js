let prompt = document.querySelector("#prompt");
let submitbtn = document.querySelector("#submit");
let chatContainer = document.querySelector(".chat-container");
let imagebtn = document.querySelector("#image");
let image = document.querySelector("#image img");
let imageinput = document.querySelector("#image input");

const Api_Url = "http://localhost:5000/generate";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

function scrollToBottom(delay = 50) {
    setTimeout(() => {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight + 200, 
            behavior: "smooth"
        });
    }, delay);
}

async function generateResponse(aiChatBox) {
    const textContainer = aiChatBox.querySelector(".ai-chat-area");

    try {
        const response = await fetch(Api_Url, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        const data = await response.json();
        console.log("API response:", data);

        if (data?.text) {
            const loader = textContainer.querySelector("img.load");
            if (loader) loader.remove();

            const typingSpan = document.createElement("span");
            textContainer.appendChild(typingSpan);

            const content = data.text;
            let index = 0;

            const observer = new MutationObserver(() => {
                scrollToBottom(0); 
            });
            observer.observe(textContainer, { childList: true, characterData: true, subtree: true });

            function typeChar() {
                if (index < content.length) {
                    typingSpan.textContent += content.charAt(index++);
                    scrollToBottom(0);
                    setTimeout(typeChar, 15);
                } else {
                    observer.disconnect();
                }
            }

            typeChar();

        } else if (data.error) {
            textContainer.textContent = `❌ Error: ${data.error}`;
            console.error("Backend error:", data.details);
        } else {
            textContainer.textContent = "⚠️ No valid response from API.";
        }

    } catch (error) {
        textContainer.textContent = "🚫 Failed to connect to server.";
        console.error("Fetch error:", error);
    } finally {
        image.src = `img.svg`;
        image.classList.remove("choose");
        user.file = {};
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handlechatResponse(userMessage) {
    user.message = userMessage;

    let html = `<img src="user.png" alt="" id="userImage" width="8%">
        <div class="user-chat-area">
            ${user.message}
            ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
        </div>`;

    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    scrollToBottom(); 

    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
            <div class="ai-chat-area">
                 <img src="image.png" alt="" class="load" width="50px">
            </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        scrollToBottom();
        generateResponse(aiChatBox);
    }, 500);
}

prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && prompt.value.trim()) {
        handlechatResponse(prompt.value.trim());
    }
});

submitbtn.addEventListener("click", () => {
    if (prompt.value.trim()) {
        handlechatResponse(prompt.value.trim());
    }
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click();
});
