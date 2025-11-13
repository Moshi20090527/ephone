// js/app.js

const State = {
    LOCK: 'lock-screen',
    HOME: 'home-screen',
    WECHAT_CHAT: 'wechat-chat-screen'
};

let currentState = State.LOCK;
let isDragging = false; // 新增拖曳狀態旗標
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
    if (currentState !== State.LOCK) return; // 只在鎖屏時允許拖曳

    // 確保只處理單點觸控
    if (event.touches && event.touches.length > 1) return; 

    // 記錄起始 Y 座標，同時處理 Touch 和 Mouse 事件
    startY = event.touches ? event.touches[0].clientY : event.clientY;
    
    // 針對滑鼠和觸控，都在 document 級別監聽 move 和 end 事件，以保證手勢不中斷
    if (!event.touches) {
        document.addEventListener('mousemove', handleTouchMove);
        document.addEventListener('mouseup', handleTouchEnd);
    } else {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    isDragging = true;
    document.getElementById(State.LOCK).style.transition = 'none'; // 拖曳時移除 CSS transition
}

// --- 處理滑動移動 (即時應用 transform) ---
function handleTouchMove(event) {
    if (!isDragging || currentState !== State.LOCK) return;
    
    // 阻止瀏覽器滾動
    if (event.cancelable) event.preventDefault();
    
    const currentY = event.touches ? event.touches[0].clientY : event.clientY;
    let deltaY = currentY - startY; // 負值代表向上滑動
    
    const lockScreenEl = document.getElementById(State.LOCK);

    // 限制只能向上拖曳，如果向下拉，則略微抵抗 (模擬 iOS 的橡皮筋效果)
    if (deltaY < 0) {
        lockScreenEl.style.transform = `translateY(${deltaY}px)`;
    } else {
        lockScreenEl.style.transform = `translateY(${deltaY * 0.1}px)`;
    }
}

// --- 處理滑動結束 ---
function handleTouchEnd(event) {
    if (!isDragging || currentState !== State.LOCK) return;
    
    // 清理所有監聽器
    document.removeEventListener('mousemove', handleTouchMove);
    document.removeEventListener('mouseup', handleTouchEnd);
    document.removeEventListener('touchmove', handleTouchMove, { passive: false });
    document.removeEventListener('touchend', handleTouchEnd);

    // 判斷是觸控事件結束還是滑鼠事件結束
    const endY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    const lockScreenEl = document.getElementById(State.LOCK);
    
    lockScreenEl.style.transition = 'transform 0.3s ease-out'; // 恢復平滑彈回的 CSS transition

    // 判斷是否為上滑 (endY < startY) 且距離超過門檻
    if (startY - endY > SWIPE_THRESHOLD && currentState === State.LOCK) {
        handleUnlock();
        // 讓它快速滑出螢幕 (解鎖動畫)
        lockScreenEl.style.transform = `translateY(-${lockScreenEl.offsetHeight}px)`; 
    } else {
        // 未達門檻，平滑彈回原位
        lockScreenEl.style.transform = 'translateY(0)';
    }
    isDragging = false;
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

    // 監聽鎖屏滑動開始事件
    const lockScreenEl = document.getElementById(State.LOCK);
    if (lockScreenEl) {
        // 只需要監聽 start 事件，move/end 事件會在 start 發生時加入到 document
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
