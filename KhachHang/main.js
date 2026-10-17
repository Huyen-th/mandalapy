const ROOM_DATA = [
    { id: 1, name: 'Deluxe Urban Queen', size: '25 m²', price: 1310000, img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80' },
    { id: 2, name: 'Deluxe Ocean Queen', size: '25 m²', price: 1550000, img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80' },
    { id: 3, name: 'Premium Deluxe Urban King', size: '32 m²', price: 1700000, img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&q=80' },
    { id: 4, name: 'Premium Deluxe Urban Twins', size: '32 m²', price: 1700000, img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80' },
    { id: 5, name: 'Executive Ocean King', size: '40 m²', price: 2263500, img: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80' },
    { id: 6, name: 'Junior Suite', size: '50 m²', price: 3712500, img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80' }
];

let guestCounts = { adult: 1, childOld: 0, childYoung: 0 };
let selectedRoomQuantities = {};
let currentUser = JSON.parse(localStorage.getItem('mandala_current_user')) || null;
let activeRoomDetail = null;
let timerInterval;

// KÍCH HOẠT LỊCH ĐỊNH DẠNG NGÀY/THÁNG/NĂM (dd/mm/yyyy)
window.onload = function() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    flatpickr("#checkin-date", {
        dateFormat: "d/m/Y",
        defaultDate: today,
        locale: flatpickr.l10ns.vn
    });

    flatpickr("#checkout-date", {
        dateFormat: "d/m/Y",
        defaultDate: tomorrow,
        locale: flatpickr.l10ns.vn
    });

    updateUserInterface();
    renderBookingHistory();
};

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToSection(secId) {
    switchView('home-view');
    setTimeout(() => {
        document.getElementById(secId).scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function toggleGuestDropdown() {
    const dd = document.getElementById('guestDropdown');
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

function updateGuest(type, change) {
    if (type === 'adult' && guestCounts.adult + change < 1) return;
    if (guestCounts[type] + change < 0) return;
    guestCounts[type] += change;
    document.getElementById(`${type}-count`).innerText = guestCounts[type];
    const totalChildren = guestCounts.childOld + guestCounts.childYoung;
    document.getElementById('guest-summary-text').innerText = `${guestCounts.adult} Người lớn, ${totalChildren} Trẻ em`;
}

function goToBookingEngine() {
    switchView('booking-view');
    
    document.getElementById('sum-checkin').innerText = document.getElementById('checkin-date').value;
    document.getElementById('sum-checkout').innerText = document.getElementById('checkout-date').value;

    const container = document.getElementById('booking-room-list');
    container.innerHTML = ROOM_DATA.map(r => `
        <div class="room-select-item">
            <img src="${r.img}">
            <div class="room-select-details">
                <div>
                    <h3>${r.name}</h3>
                    <p style="font-size:0.85rem; color:#64748b;">${r.size} • 2 Người lớn, 2 Trẻ em</p>
                    <b style="color:#8c6239;">${r.price.toLocaleString('vi-VN')} đ / đêm</b>
                </div>
                <div class="counter-controls" style="align-self: flex-end;">
                    <button class="btn-counter" onclick="changeRoomQty(${r.id}, -1)">-</button>
                    <span class="counter-value" id="rq-${r.id}">${selectedRoomQuantities[r.id] || 0}</span>
                    <button class="btn-counter" onclick="changeRoomQty(${r.id}, 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');

    updateSummaryCart();
}

function changeRoomQty(roomId, change) {
    let current = selectedRoomQuantities[roomId] || 0;
    if (current + change < 0) return;
    selectedRoomQuantities[roomId] = current + change;
    document.getElementById(`rq-${roomId}`).innerText = selectedRoomQuantities[roomId];
    updateSummaryCart();
}

function updateSummaryCart() {
    const listEl = document.getElementById('sum-selected-rooms');
    let total = 0;
    let html = '';

    ROOM_DATA.forEach(r => {
        let qty = selectedRoomQuantities[r.id] || 0;
        if(qty > 0) {
            let sub = qty * r.price;
            total += sub;
            html += `
                <div class="summary-row">
                    <span>x${qty} ${r.name}</span>
                    <b>${sub.toLocaleString('vi-VN')} đ</b>
                </div>
            `;
        }
    });

    listEl.innerHTML = html || `<p style="color:#64748b; font-size:0.85rem;">Chưa chọn phòng nào</p>`;
    document.getElementById('sum-total-price').innerText = total.toLocaleString('vi-VN') + ' đ';
}

function quickBook(roomName, price) {
    const room = ROOM_DATA.find(r => r.name === roomName) || { id: 1, price: price, name: roomName };
    selectedRoomQuantities = {};
    selectedRoomQuantities[room.id] = 1;
    goToBookingEngine();
}

function goToCheckout() {
    let totalQty = Object.values(selectedRoomQuantities).reduce((a, b) => a + b, 0);
    if (totalQty === 0) return alert('Vui lòng chọn ít nhất 1 phòng!');

    switchView('checkout-view');
    nextStep(1);

    if (currentUser) {
        document.getElementById('user-logged-info').style.display = 'block';
        document.getElementById('logged-user-name').innerText = currentUser.name;
        document.getElementById('guest-input-form').style.display = 'none';
    } else {
        document.getElementById('user-logged-info').style.display = 'none';
        document.getElementById('guest-input-form').style.display = 'block';
    }
}

function nextStep(stepNum) {
    if (stepNum === 2 && !currentUser) {
        const name = document.getElementById('co-name').value;
        const phone = document.getElementById('co-phone').value;
        const email = document.getElementById('co-email').value;
        if (!name || !phone || !email) return alert('Vui lòng điền đầy đủ thông tin để tiếp tục!');
    }

    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-head-${stepNum}`).classList.add('active');

    document.getElementById('step-content-1').style.display = stepNum === 1 ? 'block' : 'none';
    document.getElementById('step-content-2').style.display = stepNum === 2 ? 'block' : 'none';
    document.getElementById('step-content-3').style.display = stepNum === 3 ? 'block' : 'none';

    if(stepNum === 2) startTimer();
}

function startTimer() {
    let duration = 300;
    const display = document.getElementById('timer');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let minutes = parseInt(duration / 60, 10);
        let seconds = parseInt(duration % 60, 10);
        display.textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        if (--duration < 0) {
            clearInterval(timerInterval);
            alert("Đã hết thời gian giữ phòng. Vui lòng thực hiện lại!");
            switchView('home-view');
        }
    }, 1000);
}

function finishBooking() {
    clearInterval(timerInterval);
    const code = "MDL-" + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('final-booking-code').innerText = code;

    const name = currentUser ? currentUser.name : document.getElementById('co-name').value;
    const contact = currentUser ? currentUser.email : document.getElementById('co-phone').value;

    let bookedRoomsText = [];
    let totalBill = 0;
    ROOM_DATA.forEach(r => {
        let qty = selectedRoomQuantities[r.id] || 0;
        if (qty > 0) {
            bookedRoomsText.push(`${qty}x ${r.name}`);
            totalBill += qty * r.price;
        }
    });

    const newBooking = {
        code,
        guestName: name,
        contact: contact,
        room: bookedRoomsText.join(', '),
        totalPrice: totalBill.toLocaleString('vi-VN') + ' đ',
        status: "Thành công"
    };

    let history = JSON.parse(localStorage.getItem('mandala_bookings')) || [];
    history.unshift(newBooking);
    localStorage.setItem('mandala_bookings', JSON.stringify(history));

    nextStep(3);
}

function renderBookingHistory() {
    const tbody = document.getElementById('booking-history-body');
    let history = JSON.parse(localStorage.getItem('mandala_bookings')) || [];

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8;">Chưa có lịch sử đặt phòng nào.</td></tr>`;
        return;
    }

    tbody.innerHTML = history.map((item, index) => `
        <tr>
            <td><b>${item.code}</b></td>
            <td>${item.guestName}</td>
            <td>${item.contact}</td>
            <td>${item.room}</td>
            <td>${item.totalPrice}</td>
            <td><span style="color:${item.status === 'Đã hủy' ? '#ef4444' : '#16a34a'}; font-weight:bold;">${item.status}</span></td>
            <td>
                ${item.status !== 'Đã hủy' ? `<button class="btn-cancel" onclick="cancelBooking(${index})">Hủy đặt</button>` : '-'}
            </td>
        </tr>
    `).join('');
}

function cancelBooking(index) {
    if (confirm("Bạn có chắc chắn muốn hủy đơn đặt phòng này?")) {
        let history = JSON.parse(localStorage.getItem('mandala_bookings')) || [];
        history[index].status = "Đã hủy";
        localStorage.setItem('mandala_bookings', JSON.stringify(history));
        renderBookingHistory();
    }
}

function viewHistoryAndReset() {
    selectedRoomQuantities = {};
    renderBookingHistory();
    navigateToSection('history');
}

function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if(!name || !email || !pass) return alert("Vui lòng nhập đầy đủ!");

    let users = JSON.parse(localStorage.getItem('mandala_users')) || [];
    users.push({ name, phone, email, pass });
    localStorage.setItem('mandala_users', JSON.stringify(users));

    currentUser = { name, phone, email };
    localStorage.setItem('mandala_current_user', JSON.stringify(currentUser));
    
    alert("Đăng ký tài khoản thành công!");
    closeModal('registerModal');
    updateUserInterface();
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    let users = JSON.parse(localStorage.getItem('mandala_users')) || [];

    const user = users.find(u => u.email === email && u.pass === pass);
    if(user) {
        currentUser = user;
        localStorage.setItem('mandala_current_user', JSON.stringify(currentUser));
        alert("Đăng nhập thành công!");
        closeModal('loginModal');
        updateUserInterface();
    } else {
        alert("Email hoặc mật khẩu không chính xác!");
    }
}

function logout() {
    localStorage.removeItem('mandala_current_user');
    currentUser = null;
    updateUserInterface();
}

function updateUserInterface() {
    const container = document.getElementById('auth-container');
    if(currentUser) {
        container.innerHTML = `
            <span class="user-welcome">Xin chào, ${currentUser.name}</span>
            <button class="btn-auth" style="margin-left: 10px;" onclick="logout()">Đăng xuất</button>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-btns">
                <button class="btn-auth" onclick="openModal('loginModal')">Đăng nhập</button>
                <button class="btn-auth" style="background:#8c6239; color:white;" onclick="openModal('registerModal')">Đăng ký</button>
            </div>
        `;
    }
}

function openRoomDetail(name, priceStr, rawPrice) {
    document.getElementById('modal-room-title').innerText = name;
    activeRoomDetail = { name, price: parseInt(rawPrice) };
    openModal('roomDetailModal');
}

function confirmModalBook() {
    closeModal('roomDetailModal');
    quickBook(activeRoomDetail.name, activeRoomDetail.price);
}

function changeModalImg(src) { document.getElementById('modal-main-img').src = src; }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function toggleChatbot() {
    const bot = document.querySelector('.chatbot');
    bot.style.display = bot.style.display === 'flex' ? 'none' : 'flex';
}

function handleChat() {
    const input = document.getElementById('chat-textarea');
    const msg = input.value.trim();
    if(!msg) return;

    const chatbox = document.getElementById('chatbox');
    chatbox.innerHTML += `<li class="chat outgoing"><p>${msg}</p></li>`;
    input.value = "";
    chatbox.scrollTop = chatbox.scrollHeight;

    setTimeout(() => {
        let reply = "Mandala AI rất vui được hỗ trợ bạn! Bạn cần tư vấn thông tin loại phòng nào?";
        let lower = msg.toLowerCase();
        if(lower.includes("giá") || lower.includes("phòng")) reply = "Khách sạn có các hạng phòng từ Deluxe đến Junior Suite giá từ 1.310.000 đ/đêm đã bao gồm ăn sáng buffet.";
        else if(lower.includes("dịch vụ") || lower.includes("spa") || lower.includes("nhà hàng")) reply = "Mandala có sẵn Spa, Nhà hàng Á-Âu, Hồ bơi vô cực, Phòng Gym và Dịch vụ tiệc lãng mạn bên bờ biển.";
        else if(lower.includes("đặt")) reply = "Bạn chọn ngày ở thanh tìm kiếm phía trên, nhấn 'Tìm Phòng' và chọn loại phòng mong muốn nhé!";

        chatbox.innerHTML += `<li class="chat incoming"><p>${reply}</p></li>`;
        chatbox.scrollTop = chatbox.scrollHeight;
    }, 500);
}