// Bắt đầu file /js/app.js

// 🔥 1. KHAI BÁO HẰNG SỐ VÀ BIẾN CHUNG
const WORKER_URL = "https://blynk-token-proxy.tanthanhlttb123.workers.dev";
const VIRTUAL_PIN = "V1"; // Pin cho Bếp (giả định)
const VPIN_WATER = 'V1'; // Pin cho Tưới cây (giả định)
const API_URL_BLYNK = 'https://blynk.cloud/external/api/';

// *** THAY TOKEN CỦA BẠN VÀO ĐÂY ***
const BLYNK_TOKEN_CAY = 'TOKEN_CỦA_DỰ_ÁN_TƯỚI_CÂY'; 
const BLYNK_TOKEN_BEP = 'TOKEN_CỦA_DỰ_ÁN_BẾP'; // Nếu Worker không xử lý

// Cần khai báo các trang để hàm SPA hoạt động trong home.html
const pages = {
    home: document.getElementById('page-home'),
    rem: document.getElementById('page-rem'),
    aptomat: document.getElementById('page-aptomat'),
    quangcao: document.getElementById('page-quangcao'),
    camera: document.getElementById('page-camera')
};
let current = 'home'; 
let currentStoveState = false;

// === KHAI BÁO QUYỀN GHI TỪ SESSION ===


// === KHAI BÁO QUYỀN GHI TỪ LOCAL STORAGE ===
// Cần đồng bộ với cách lưu quyền ở login.html
const isAdmin = localStorage.getItem('isAdmin') === 'true'; // <<< ĐÃ CHUYỂN SANG localStorage
let isUserAllowedToWrite = isAdmin; // Chỉ Admin được GHI

console.log(`[QUYỀN GHI] Bạn là Admin: ${isAdmin}. Được phép GHI lệnh: ${isUserAllowedToWrite}`);









// -----------------------------------------------------------

// 🔥 2. HÀM ĐĂNG XUẤT VÀ CHUYỂN TRANG CƠ BẢN

// HÀM ĐĂNG XUẤT MỚI: Dùng sessionStorage (ĐỒNG BỘ VỚI LOGIN.HTML)
function logout(){ 
   localStorage.clear();
   sessionStorage.clear(); // Xóa tất cả trạng thái phiên
   localStorage.removeItem('isLoggedIn'); // Xóa trạng thái cũ (đề phòng)
    window.location.replace('index.html'); // <<< SỬA TẠI ĐÂY (login.html -> index.html)

    
}

function setApt(on){ 
    if (isUserAllowedToWrite) {
         // TODO: Gửi lệnh Aptomat thật
         alert('[ADMIN] Gửi lệnh aptomat thật: ' + (on ? 'BẬT' : 'TẮT')); 
    } else {
        alert('[KHÁCH] Chỉ xem Demo. Không gửi lệnh thật.');
    }
}

// ... Giữ nguyên các hàm SPA (showPage, goto, back) ...
function showPage(id, direction='left'){
    if(id === current) return;
    const from = pages[current];
    const to = pages[id];
    if(!from || !to) return;
    
    to.classList.remove('hidden');
    from.classList.remove('enter-left','enter-right','center');
    to.classList.remove('enter-left','enter-right','center');
    
    if(direction === 'left'){
      to.classList.add('enter-right');
      void to.offsetWidth;
      to.classList.remove('enter-right');
      to.classList.add('center');
      from.classList.add('enter-left');
    } else {
      to.classList.add('enter-left');
      void to.offsetWidth;
      to.classList.remove('enter-left');
      to.classList.add('center');
      from.classList.add('enter-right');
    }
      
    setTimeout(() => {
        from.classList.add('hidden');
        to.scrollTop = 0;
    }, 450); 
    current = id;
}

function goto(name){
    if(name === 'home') showPage('home','right');
    else if(name === 'rem') showPage('rem','left');
    else if(name === 'aptomat') showPage('aptomat','left');
    else if(name === 'quangcao') showPage('quangcao','left');
    else if(name === 'camera') showPage('camera','left');
}

function back(){ showPage('home','right'); }

// -----------------------------------------------------------

// 🔥 3. LOGIC THIẾT BỊ (Đã bọc kiểm tra quyền GHI)

// Hàm update giao diện UI theo trạng thái (Giữ nguyên)
function updateUI(state) {
    const stoveImg = document.getElementById("stove-image");
    const stoveText = document.getElementById('stove');
    const cbDot = document.getElementById("cb-status");
    const viewStatusBtn = document.querySelector(".view-status-btn");
    
    if (stoveText) stoveText.innerText = state === 1 ? 'Bật' : 'Tắt';
    if (stoveImg) stoveImg.src = state === 1 ? "img/bep_on.jpg" : "img/bep_off.jpg";

    if (cbDot) {
        cbDot.style.backgroundColor = state === 1 ? "#22c55e" : "#777";
        cbDot.style.boxShadow = state === 1 ? "0 0 8px #22c55e" : "none";
    }

    if (viewStatusBtn) {
        viewStatusBtn.style.background = state === 1 
            ? "linear-gradient(90deg, #10b981, #22c55e)" 
            : "linear-gradient(90deg, #9ca3af, #6b7280)";
        viewStatusBtn.style.color = "#fff";
    }
}






// Gửi lệnh bật/tắt đến ESP (BẾP) - CHỈ CHẠY KHI LÀ ADMIN
// Gửi lệnh bật/tắt đến ESP (BẾP) - CHỈ CHẠY KHI LÀ ADMIN
async function sendCommand(commandValue) {
    const responseBox = document.getElementById("responseBox");

    // 1. Cập nhật giao diện ngay lập tức cho cả Admin và Khách (tạo cảm giác nhanh)
    updateUI(commandValue); 
    
    // === KIỂM TRA QUYỀN GHI VÀ CHẶN KHÁCH ===
    if (!isUserAllowedToWrite) {
        // Đây là KHÁCH: Chỉ thấy Demo, CHẶN lệnh gửi đi
        responseBox.textContent = "❌ (Demo)";
        responseBox.style.color = "red";
        return; // CHẶN LỆNH GỬI ĐI THẬT SỰ
    }
    // === ADMIN ĐƯỢC CHẠY FETCH ===

    const actionText = commandValue === 1 ? "Mở Bếp" : "Tắt Bếp";

    try {
        const res = await fetch(`${WORKER_URL}?action=update&pin=${VIRTUAL_PIN}&value=${commandValue}`);

        if (res.ok) {
            responseBox.textContent = `✅ Lệnh ${actionText} gửi thành công.`;
            responseBox.style.color = "green";
        } else {
            const errorText = await res.text();
            responseBox.textContent = `❌ LỖI KẾT NỐI: ${res.status}. ${errorText}`;
            responseBox.style.color = "red";
        }

    } catch (error) {
        // ... (Logic xử lý lỗi) ...
    }
}









function turnOn() { sendCommand(1); }
function turnOff() { sendCommand(0); }

// Đọc trạng thái hiện tại từ Blynk qua Worker (Giữ nguyên)
async function getStatus() {
    const responseBox = document.getElementById("responseBox");
    // ... (Giữ nguyên logic getStatus) ...
     try {
        const res = await fetch(`${WORKER_URL}?action=get&pin=${VIRTUAL_PIN}`);
        if (res.ok) {
           const rawValue = await res.text();
           const cleanValue = rawValue.replace(/[^0-9]/g, '');
           const state = (cleanValue === '1') ? 1 : 0;
           
           updateUI(state); 
           
           if(responseBox) {
               responseBox.textContent = `✅`;
             responseBox.style.color = "darkblue";
           }
        } else {
            if(responseBox) {
                responseBox.textContent = `❌ Lỗi đọc trạng thái: ${res.status}`;
                responseBox.style.color = "red";
            }
        }
    } catch (error) {
        if(responseBox) {
            responseBox.textContent = `⚠️ Lỗi kết nối: Không thể gọi Worker.`;
            responseBox.style.color = "orange";
        }
    }
}


// -----------------------------------------------------------

// ... KHỐI GÁN SỰ KIỆN (Giữ nguyên) ...
document.addEventListener('DOMContentLoaded', () => {
    
    if (document.getElementById('page-home')) {
        getStatus(); 
    }

});

// ... HÀM MÃ HÓA CẦN THIẾT CHO LOGIN (Giữ nguyên) ...
function encodeCredentials(username, password) {
    return btoa(`${username}:${password}`); 
}

window.onload = function() {
    
    // 1. LOGIC ĐĂNG NHẬP (Chỉ hoạt động ở login.html)
    const btnLoginElement = document.getElementById('btn-do-login');
    
    if (btnLoginElement) {
        btnLoginElement.onclick = ()=>{
            // LOGIC NÀY BỊ THAY THẾ HOÀN TOÀN BỞI CODE TRONG LOGIN.HTML 
            // KHÔNG CẦN CHẠY NỮA, NẾU CHẠY SẼ GÂY LỖI
            alert('Lỗi: Logic Login đã được chuyển sang <script type="module"> trong index.html. Vui lòng kiểm tra lại!');
        };
    }
    
    // ... Giữ nguyên Logic cho Slider & GÁN SỰ KIỆN ENTER ...
    const authInner = document.getElementById('auth-inner');
    if (authInner) {
        const showRegisterBtn = document.getElementById('show-register');
        const backLoginBtn = document.getElementById('back-login');

        if (showRegisterBtn) showRegisterBtn.onclick = ()=> authInner.style.transform = 'translateX(-100%)';
        if (backLoginBtn) backLoginBtn.onclick = ()=> authInner.style.transform = 'translateX(0)';
    }

    ['li-email','li-pass'].forEach(id=>{
        const e = document.getElementById(id);
        if(e) e.addEventListener('keydown', ev=>{ if(ev.key==='Enter') document.getElementById('btn-do-login').click(); });
    });
};


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//=========================================================================
// LOGIC TƯỚI CÂY (Đã bọc kiểm tra quyền GHI)

// 1. Gửi lệnh điều khiển (1=BẬT, 0=TẮT) cho V1 - CHỈ CHẠY KHI LÀ ADMIN
async function sendWaterCommand(commandValue) {
    const responseBox = document.getElementById('waterResponseBox');
    
    if (!responseBox) return;

    // === KIỂM TRA QUYỀN GHI ===
    if (!isUserAllowedToWrite) {
        updateWaterUI(commandValue); // Cho Khách thấy hiệu ứng tưới ảo
        responseBox.innerText = '❌ ';
        responseBox.style.color = 'red'; 
        return; // CHẶN
    }
    // === ADMIN ĐƯỢC CHẠY ===

    responseBox.innerText = 'Đang gửi lệnh tưới cây...';
    responseBox.style.color = '#ff9800'; 
    
    try {
        const url = `${API_URL_BLYNK}update?token=${BLYNK_TOKEN_CAY}&${VPIN_WATER}=${commandValue}`;
        
        const response = await fetch(url, { method: 'GET' });

        if (response.ok) {
            updateWaterUI(commandValue); 
            responseBox.innerText = `✅ Lệnh tưới gửi thành công. V1: ${commandValue === 1 ? 'BẬT' : 'TẮT'}`;
            responseBox.style.color = '#4CAF50';
        } else {
            responseBox.innerText = `Lỗi gửi lệnh tưới: ${response.status} ${response.statusText}`;
            responseBox.style.color = 'red';
            getWaterStatus(); 
        }
    } catch (error) {
        responseBox.innerText = `Lỗi kết nối: Không thể gửi lệnh tưới đến Blynk.`;
        responseBox.style.color = 'red';
    }
}

// 2. Kiểm tra và đồng bộ trạng thái hiện tại từ V1 (Giữ nguyên)
async function getWaterStatus() {
    const responseBox = document.getElementById('waterResponseBox');
    // ... (Giữ nguyên logic getWaterStatus) ...
    if (!responseBox) return;

    responseBox.innerText = 'Đang kiểm tra trạng thái tưới...';
    responseBox.style.color = '#004c8c'; 

    try {
        const url = `${API_URL_BLYNK}get?token=${BLYNK_TOKEN_CAY}&${VPIN_WATER}`;
        
        const response = await fetch(url, { method: 'GET' }); 

        if (response.ok) {
            const result = await response.json();
            const currentState = parseInt(result[0]); 
            
            updateWaterUI(currentState);
            
            responseBox.innerText = `✅ Đồng bộ tưới thành công. V1 hiện tại: ${currentState === 1 ? 'BẬT' : 'TẮT'}`;
            responseBox.style.color = '#004c8c';
        } else {
            responseBox.innerText = `Lỗi kiểm tra trạng thái tưới: ${response.status}`;
            responseBox.style.color = 'red';
        }
    } catch (error) {
        responseBox.innerText = `Lỗi kết nối: Không thể lấy trạng thái Blynk.`;
        responseBox.style.color = 'red';
    }
}

// 3. Cập nhật giao diện người dùng (UI) dựa trên trạng thái (Giữ nguyên)
function updateWaterUI(state) {
    const waterBtn = document.getElementById('waterBtn');
    const waterStatusText = document.getElementById('waterStatusText');
    const waterImage = document.getElementById('water-image');
    
    if (!waterBtn || !waterStatusText || !waterImage) return;

    if (state === 1) {
        waterBtn.innerText = 'TẮT'; 
        waterBtn.style.backgroundColor = '#4CAF50';
        
        waterStatusText.innerText = 'BẬT';
        waterStatusText.style.color = '#4CAF50';
        
        waterImage.src = 'images/cay_on.jpg';
    } else {
        waterBtn.innerText = 'BẬT'; 
        waterBtn.style.backgroundColor = 'gray'; 
        
        waterStatusText.innerText = 'TẮT';
        waterStatusText.style.color = 'gray';
        
        waterImage.src = 'images/cay_off.jpg';
    }
}