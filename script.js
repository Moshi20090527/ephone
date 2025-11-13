document.addEventListener('DOMContentLoaded', () => {
    const lockScreen = document.getElementById('lock-screen');
    const homeScreen = document.getElementById('home-screen');
    const appGrid = document.getElementById('app-grid');
    const appPageContainer = document.getElementById('app-page-container');
    const lockTime = document.getElementById('lock-time');
    const homeTime = document.getElementById('home-time');
    const dateDisplay = document.querySelector('.date-display'); // 選取日期顯示元素
    
    let isLocked = true;
    let clickTimer = null; // 用於雙擊檢測
    
    // 用於滑動解鎖的變數
    let startY = 0; 
    const SWIPE_THRESHOLD = 50; // 向上滑動超過 50 像素即解鎖

    /**
     * 更新數位時鐘和日期
     */
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        lockTime.textContent = timeString;
        homeTime.textContent = timeString;

        // 更新日期顯示，格式為「星期幾, 月份 日」
        const options = { weekday: 'short', month: 'numeric', day: 'numeric' };
        // 使用 'zh-Hant-TW' 確保台灣中文格式
        const dateString = now.toLocaleDateString('zh-Hant-TW', options)
                            .replace('週', '星期'); // 將「週」替換為「星期」
        dateDisplay.textContent = dateString;
    }

    // 立即執行並每分鐘更新
    updateClock();
    setInterval(updateClock, 60000); // 每分鐘更新一次時鐘

    /**
     * --- 滑動解鎖邏輯 --- (保持不變)
     */
    
    // 1. 記錄起始位置 (手機觸摸事件)
    lockScreen.addEventListener('touchstart', (e) => {
        if (!isLocked) return;
        startY = e.touches[0].clientY;
    });

    // 2. 處理滑動 (手機觸摸事件)
    lockScreen.addEventListener('touchmove', (e) => {
        if (!isLocked) return;
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY; // 正值表示向上滑動

        if (deltaY > 0) {
            // 避免瀏覽器滾動
            e.preventDefault(); 
            // 鎖屏隨著向上滑動
            lockScreen.style.transform = `translateY(-${deltaY}px)`;
        }
    });

    // 3. 判斷是否解鎖 (手機觸摸事件)
    lockScreen.addEventListener('touchend', (e) => {
        if (!isLocked) return;
        const endY = e.changedTouches[0].clientY;
        const deltaY = startY - endY;

        if (deltaY > SWIPE_THRESHOLD) {
            // 向上滑動超過門檻，執行解鎖
            unlockPhone();
        } else {
            // 滑動距離不足，鎖屏彈回原位
            lockScreen.style.transition = 'transform 0.3s ease-out';
            lockScreen.style.transform = 'translateY(0)';
            // 確保動畫結束後重置 transition
            setTimeout(() => {
                lockScreen.style.transition = 'transform 0.5s ease-out, opacity 0.5s'; 
            }, 300);
        }
        // 重置 startY
        startY = 0;
    });

    // 兼容桌機鼠標點擊拖拽解鎖
    lockScreen.addEventListener('mousedown', (e) => {
        if (!isLocked) return;
        startY = e.clientY;
        lockScreen.onmousemove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            if (deltaY > 0) {
                 lockScreen.style.transform = `translateY(-${deltaY}px)`;
            }
        };
        lockScreen.onmouseup = (upEvent) => {
            lockScreen.onmousemove = null;
            const deltaY = startY - upEvent.clientY;
            if (deltaY > SWIPE_THRESHOLD) {
                unlockPhone();
            } else {
                lockScreen.style.transition = 'transform 0.3s ease-out';
                lockScreen.style.transform = 'translateY(0)';
                setTimeout(() => {
                    lockScreen.style.transition = 'transform 0.5s ease-out, opacity 0.5s'; 
                }, 300);
            }
            startY = 0;
            lockScreen.onmouseup = null;
        };
    });
    // 防止鎖屏上的點擊行為干擾，只允許滑動
    lockScreen.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    function unlockPhone() {
        if (!isLocked) return;
        isLocked = false;
        
        lockScreen.style.transition = 'transform 0.5s ease-out';
        lockScreen.style.transform = 'translateY(-100%)';
        homeScreen.classList.add('active');
        
        setTimeout(() => {
            lockScreen.classList.remove('active');
            lockScreen.style.transform = 'translateY(0)'; 
            lockScreen.style.transition = 'transform 0.5s ease-out, opacity 0.5s'; 
        }, 500);
        
        console.log('手機已解鎖');
    }

    /**
     * 處理軟件圖標的點擊和雙擊事件 (保持不變)
     */
    appGrid.querySelectorAll('.app-icon').forEach(icon => {
        icon.addEventListener('click', (event) => {
            const appName = icon.dataset.app;

            if (clickTimer === null) {
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    openApp(appName);
                }, 300);
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                changeAppCover(icon);
            }
        });
    });

    /**
     * 單擊：打開應用程式 (保持不變)
     * @param {string} appName - 應用程式名稱
     */
    function openApp(appName) {
        console.log(`開啟應用程式: ${appName}`);
        appPageContainer.innerHTML = `
            <div class="app-header">
                <span class="back-button" onclick="closeApp()">⬅️</span>
                <h2>${appName.charAt(0).toUpperCase() + appName.slice(1)}</h2>
            </div>
            <div class="app-content">
                <p>這是 ${appName} 的內容頁面。</p>
                </div>
        `;
        appPageContainer.classList.add('visible');
    }

    /**
     * 雙擊：更改軟件封面 (保持不變)
     * @param {HTMLElement} iconElement - 被雙擊的圖標元素
     */
    function changeAppCover(iconElement) {
        const img = iconElement.querySelector('img');
        const currentColor = img.style.backgroundColor;
        
        if (currentColor === 'rgb(162, 210, 255)') { 
            img.style.backgroundColor = 'var(--color-pink)';
        } else {
            img.style.backgroundColor = 'var(--color-blue)';
        }
        console.log(`已更改 ${iconElement.dataset.app} 的封面！`);
    }

    /**
     * 關閉應用程式 (保持不變)
     */
    window.closeApp = function() {
        appPageContainer.classList.remove('visible');
        setTimeout(() => {
            appPageContainer.innerHTML = '';
        }, 300);
    }
});
