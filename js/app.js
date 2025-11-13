// js/app.js

const State = {
    LOCK: 'lock-screen',
    HOME: 'home-screen',
    WECHAT_CHAT: 'wechat-chat-screen'
};

let currentState = State.LOCK;
let startY = 0; // 用於記錄滑動起始 Y 座標
const SWIPE_THRESHOLD = 50; // 定義上滑解鎖所需的最小垂直距離 (px)

// --- 核心函式：時鐘更新 ---
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('zh-Hant', dateOptions);

    // 鎖屏時鐘
    const lockTimeEl = document.getElementById('lock-time');
    if (lockTimeEl) {
        lockTimeEl.textContent = timeString;
    }
    
    // 鎖屏日期
    const lockDateEl = document.querySelector('.lock-date');
    if (lockDateEl) {
        lockDateEl.textContent = dateString;
    }

    // 狀態列時鐘 (僅在主畫面/App內時更新)
    if (currentState !== State.LOCK) {
        document.getElementById('status-time').textContent = timeString;
    } else {
        // 鎖屏時狀態列時間設為 iOS 傳統的 9:41
        document.getElementById('status-time').textContent = '9:41';
    }
}

// --- 核心函式：畫面切換 ---
function navigateTo(newState) {
    const screens = document.querySelectorAll('.screen');
    
    // 移除所有 active 狀態
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // 設定新的 active 狀態
    const targetScreen = document.getElementById(newState);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    currentState = newState;
    updateClock(); // 切換畫面後確保時鐘狀態正確
    
    // 如果進入聊天畫面，渲染內容
    if (newState === State.WECHAT_CHAT) {
        renderWechatChat();
    }
}

// --- 處理解鎖 (模擬上滑手勢) ---
function handleUnlock() {
    if (currentState === State.LOCK) {
        navigateTo(State.HOME);
    }
}

// --- 處理滑動開始 ---
function handleTouchStart(event) {
    // 記錄起始 Y 座標，同時處理 Touch 和 Mouse 事件
    startY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // 針對滑鼠操作，需要監聽 mouseup 和 mousemove
    if (!event.touches) {
        document.addEventListener('mousemove', handleTouchMove);
        document.addEventListener('mouseup', handleTouchEnd);
    }
}

// --- 處理滑動移動 (不需要移動效果，只需記錄距離) ---
function handleTouchMove(event) {
    // 這裡可以加入視覺上的拖曳效果，但 v0.2 僅處理距離判斷
}

// --- 處理滑動結束 ---
function handleTouchEnd(event) {
    // 清理滑鼠監聽器
    document.removeEventListener('mousemove', handleTouchMove);
    document.removeEventListener('mouseup', handleTouchEnd);
    
    const endY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    
    // 判斷是否為上滑 (endY < startY) 且距離超過門檻
    if (startY - endY > SWIPE_THRESHOLD && currentState === State.LOCK) {
        handleUnlock();
    }
}

// --- 渲染微信聊天介面 ---
function renderWechatChat() {
    const chatContainer = document.getElementById(State.WECHAT_CHAT);
    
    const chatHTML = `
        <div class="chat-header">
            <span class="back-btn" onclick="navigateTo(State.HOME)">
                &lt; 微信
            </span>
            <span class="title">AI 助理</span>
            <span class="back-btn">...</span>
        </div>
        <div class="chat-messages" id="chat-messages">
            ${mockMessages.map(msg => `
                <div class="message-bubble ${msg.type}">
                    <div class="bubble ${msg.type}">${msg.text}</div>
                </div>
            `).join('')}
        </div>
        <div class="chat-input">
            <button>🎤</button>
            <input type="text" placeholder="輸入訊息...">
            <button>➕</button>
        </div>
    `;
    chatContainer.innerHTML = chatHTML;
    
    // 自動捲動到底部
    const messagesEl = document.getElementById('chat-messages');
    if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

// --- 初始化與事件監聽 ---
function init() {
    // 啟動時鐘更新 (每秒)
    updateClock();
    setInterval(updateClock, 1000);

    // 監聽鎖屏滑動事件 (模擬上滑解鎖)
    const lockScreenEl = document.getElementById(State.LOCK);
    if (lockScreenEl) {
        // 支援觸控 (手機) 和 滑鼠 (PC)
        lockScreenEl.addEventListener('touchstart', handleTouchStart);
        lockScreenEl.addEventListener('mousedown', handleTouchStart);
    }
    
    // 監聽 App 圖示點擊事件
    const homeScreenEl = document.getElementById(State.HOME);
    if (homeScreenEl) {
        homeScreenEl.addEventListener('click', (event) => {
            const appIcon = event.target.closest('.app-icon');
            if (appIcon && appIcon.dataset.app === 'wechat') {
                navigateTo(State.WECHAT_CHAT);
            }
        });
    }

    // 初始狀態導航到鎖屏
    navigateTo(State.LOCK);
}

// 啟動應用程式
document.addEventListener('DOMContentLoaded', init);
