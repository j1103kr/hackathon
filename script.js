// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기
// -----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, onSnapshot, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initialData } from './data.js'; 

// -----------------------------------------------------------
// 2. Firebase 설정 
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBT1Mwd1rRLGn0JisQ4E_0h_-f_g3FKiII",
  authDomain: "korea-japan-trip.firebaseapp.com",
  projectId: "korea-japan-trip",
  storageBucket: "korea-japan-trip.firebasestorage.app",
  messagingSenderId: "850077166396",
  appId: "1:850077166396:web:7cbb5cad174b9a1db00c39",
  measurementId: "G-2MEV1JR83X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// -----------------------------------------------------------
// ⭐ 다국어 설정
// -----------------------------------------------------------
let currentLang = 'ko'; // 기본 언어

const translations = {
    ko: {
        placeholder: "어디로 떠나볼까요?",
        all: "전체", food: "🍜 맛집", view: "🏰 관광", culture: "💛 문화",
        exchangeTitle: "🇯🇵 JPY 100 ➔ 🇰🇷 KRW",
        starbucks: "스벅 라떼가 한국보다",
        cheap: "원 싸요!", expensive: "원 비싸요.",
        weatherDesc: "지도에서 핀을 눌러 날씨를 확인하세요!",
        cityNeed: "지역 선택 필요",
        w_hot: "너무 더워요! 실내 추천 🥵",
        w_warm: "반팔 입기 좋은 날씨! 👕",
        w_good: "여행하기 최고의 날씨! ✨",
        w_cool: "쌀쌀해요! 겉옷 챙기세요 🧥",
        w_cold: "너무 추워요! 패딩 필수 🧣",
        popup_weather: "날씨 확인",
        popup_like: "좋아요",
        
        review_write: "리뷰 쓰기",
        review_read: "리뷰 보기"
    },
    ja: {
        placeholder: "どこへ行きますか？",
        all: "すべて", food: "🍜 グルメ", view: "🏰 観光", culture: "💛 文化",
        exchangeTitle: "🇰🇷 KRW 1000 ➔ 🇯🇵 JPY",
        starbucks: "スタバのラテが日本より",
        cheap: "円 安い！", expensive: "円 高い。",
        weatherDesc: "ピンをクリックして天気を確認！",
        cityNeed: "地域を選択",
        w_hot: "暑すぎます！室内がおすすめ 🥵",
        w_warm: "半袖でいい天気！ 👕",
        w_good: "旅行に最高の天気！ ✨",
        w_cool: "肌寒いです！上着が必要 🧥",
        w_cold: "寒いです！ダウン必須 🧣",
        popup_weather: "天気予報",
        popup_like: "いいね",

        review_write: "レビューを書く",
        review_read: "レビューを見る"
    }
};


// -----------------------------------------------------------
// 3. 지도 및 기본 설정
// -----------------------------------------------------------
var map = L.map('map', { zoomControl: false }).setView([36.5, 133], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

var markerCluster = L.markerClusterGroup({
    maxClusterRadius: 30,      
    disableClusteringAtZoom: 11 
});
map.addLayer(markerCluster);


// -----------------------------------------------------------
// 4. 기능 함수들 (환율, 날씨)
// -----------------------------------------------------------
async function fetchExchangeRate() {
    const diffEl = document.querySelector('.exchange-diff');
    const descEl = document.querySelector('.exchange-desc');
    const rateEl = document.getElementById('rate-text');
    
    const t = translations[currentLang]; 

    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
        const data = await response.json();
        const rate = data.rates.KRW; 

        if (currentLang === 'ko') {
            const result = (rate * 100).toFixed(0);
            rateEl.innerText = `₩ ${result}`;
            
            const jpLatteInKrw = 490 * rate; 
            const diff = (5000 - jpLatteInKrw).toFixed(0);
            
            descEl.innerText = `"${t.starbucks} ${diff}${t.cheap}"`;
            diffEl.innerText = "▼ 슈퍼 엔저 찬스!";
            diffEl.style.color = "#2ecc71";

        } else {
            const result = (1000 / rate).toFixed(0);
            rateEl.innerText = `¥ ${result}`;

            const krLatteInJpy = 5000 / rate;
            const diff = (krLatteInJpy - 490).toFixed(0);

            descEl.innerText = `"${t.starbucks} ${diff}${t.expensive}"`; 
            diffEl.innerText = "▲ 韓国の方が高い"; 
            diffEl.style.color = "#e74c3c"; 
        }

    } catch (error) {
        console.error(error);
        rateEl.innerText = "Error";
    }
}
fetchExchangeRate(); 

window.fetchWeather = async function(lat, lng, cityName) {
    try {
        const t = translations[currentLang]; 

        document.getElementById('city-name').innerText = cityName;
        document.getElementById('current-temp').innerText = "..";
        
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await response.json();
        const temp = data.current_weather.temperature;
        
        document.getElementById('current-temp').innerText = `${temp}°C`;
        
        const descEl = document.querySelector('.weather-desc');
        const iconEl = document.querySelector('.weather-header i');

        if (temp >= 30) {
            descEl.innerText = t.w_hot;
            iconEl.className = "fas fa-sun";
        } else if (temp >= 23) {
            descEl.innerText = t.w_warm;
            iconEl.className = "fas fa-cloud-sun";
        } else if (temp >= 15) {
            descEl.innerText = t.w_good;
            iconEl.className = "fas fa-smile";
        } else if (temp >= 5) {
            descEl.innerText = t.w_cool;
            iconEl.className = "fas fa-wind";
        } else {
            descEl.innerText = t.w_cold;
            iconEl.className = "fas fa-snowflake";
        }

    } catch (error) { console.error(error); }
}


// -----------------------------------------------------------
// 5. Firebase 데이터 연동 & 로직 통합
// -----------------------------------------------------------
var locations = [];

const placesCol = collection(db, "places");

onSnapshot(placesCol, (snapshot) => {
    locations = []; 
    snapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() });
    });
    
    // 데이터 로드 후 현재 필터 상태에 맞춰 갱신
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    filterCategory(currentCategory);
});

window.toggleLike = async function(docId) {
    const docRef = doc(db, "places", docId);
    
    // 1. 내 브라우저에 저장된 '좋아요 목록' 가져오기
    let myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];

    try {
        if (myLikes.includes(docId)) {
            // 💔 이미 눌렀다면? -> 취소하기 (숫자 -1)
            await updateDoc(docRef, { likes: increment(-1) });
            
            // 목록에서 제거
            myLikes = myLikes.filter(id => id !== docId);
            localStorage.setItem('myLikedPlaces', JSON.stringify(myLikes));
            
            console.log("좋아요 취소");
        } else {
            // ❤️ 안 눌렀다면? -> 좋아요 (숫자 +1)
            await updateDoc(docRef, { likes: increment(1) });
            
            // 목록에 추가
            myLikes.push(docId);
            localStorage.setItem('myLikedPlaces', JSON.stringify(myLikes));
            
            console.log("좋아요 성공");
        }
    } catch (e) {
        console.error("좋아요 실패:", e);
        alert("오류가 발생했습니다.");
    }
}

// -----------------------------------------------------------
// [공통 함수] 지도에 핀(마커) 찍기 - 모든 기능 통합 (리뷰 버튼 포함!)
// -----------------------------------------------------------
function updateMapMarkers(targetLocations) {
    markerCluster.clearLayers(); 
    const t = translations[currentLang]; 
    
    // ⭐ 내 브라우저에 저장된 '좋아요 목록' 미리 가져오기
    const myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];

    targetLocations.forEach(loc => {
        var marker = L.marker([loc.lat, loc.lng]);
        
        let displayName = loc.name;
        if (currentLang === 'ja' && loc.name_ja) {
            displayName = loc.name_ja;
        }

        // ⭐ 내가 좋아요 누른 곳이면 빨간색(#ff4757), 아니면 회색(#ccc)
        const isLiked = myLikes.includes(loc.id);
        const heartColor = isLiked ? "#ff4757" : "#ccc"; 

        const popupContent = `
            <div class="popup-content">
                <span class="popup-title">${displayName}</span>
                
                <button class="weather-btn" onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                    <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                </button>
                
                <div style="display:flex; gap:5px; justify-content:center; margin-top:5px;">
                    <button class="weather-btn" style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); flex:1; padding:6px 5px; font-size:11px;" 
                            onclick="openReviewModal('${loc.id}', '${displayName}')">
                        <i class="fas fa-pen"></i> ${t.review_write}
                    </button>
                    <button class="weather-btn" style="background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%); flex:1; padding:6px 5px; font-size:11px;" 
                            onclick="openReadReviewModal('${loc.id}')">
                        <i class="fas fa-book"></i> ${t.review_read}
                    </button>
                </div>
                
                <div class="like-box" style="margin-top: 8px;" onclick="toggleLike('${loc.id}')">
                    <i class="fas fa-heart" style="color: ${heartColor}; transition: color 0.3s;"></i>
                    <span class="like-count" style="color: ${heartColor};">${loc.likes || 0}</span>
                    <span style="font-size:12px; margin-left:3px; color:#555;">${t.popup_like}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => { map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 }); });
        markerCluster.addLayer(marker);
    });
}

// [카테고리 필터]
window.filterCategory = function(category) {
    const filtered = category === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === category);

    updateMapMarkers(filtered); // 공통 함수 호출
    updateBtnStyle(category);
}

// [검색 기능]
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase(); 

    const searched = locations.filter(loc => {
        const koName = loc.name.toLowerCase();
        const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : "";
        return koName.includes(searchTerm) || jaName.includes(searchTerm);
    });

    updateMapMarkers(searched); // 공통 함수 호출
});

function updateBtnStyle(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// -----------------------------------------------------------
// 6. 언어 전환 함수
// -----------------------------------------------------------
window.toggleLanguage = function() {
    currentLang = currentLang === 'ko' ? 'ja' : 'ko';
    
    document.getElementById('lang-icon').innerText = currentLang === 'ko' ? "🇰🇷" : "🇯🇵";

    const t = translations[currentLang];
    
    document.getElementById('search-input').placeholder = t.placeholder;
    document.getElementById('btn-all').innerText = t.all;
    document.getElementById('btn-food').innerText = t.food;
    document.getElementById('btn-view').innerText = t.view;
    document.getElementById('btn-culture').innerText = t.culture;
    document.getElementById('exchange-title').innerText = t.exchangeTitle;
    document.getElementById('city-name').innerText = t.cityNeed; 
    document.querySelector('.weather-desc').innerText = t.weatherDesc;
    
    fetchExchangeRate(); 

    // 지도 핀 새로고침
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    filterCategory(currentCategory);
}

// -----------------------------------------------------------
// 7. 리뷰 모달 기능
// -----------------------------------------------------------
let currentReviewPlaceId = null;

window.openReviewModal = function(id, name) {
    currentReviewPlaceId = id;
    document.getElementById('modal-place-name').innerText = `Target: ${name}`;
    document.getElementById('review-text').value = ''; 
    setRating(5); 
    document.getElementById('review-modal').style.display = 'flex';
}

window.closeReviewModal = function() {
    document.getElementById('review-modal').style.display = 'none';
}

window.setRating = function(score) {
    document.getElementById('review-rating').value = score;
    document.getElementById('rating-value').innerText = score + "점";
    
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach((star, index) => {
        if (index < score) star.style.opacity = '1';
        else star.style.opacity = '0.3';
    });
}

window.submitReview = async function() {
    const text = document.getElementById('review-text').value;
    const rating = document.getElementById('review-rating').value;

    if (!text) { alert("내용을 입력해주세요!"); return; }

    try {
        await addDoc(collection(db, "reviews"), {
            placeId: currentReviewPlaceId,
            text: text,
            rating: parseInt(rating),
            // ⭐ [수정됨] 시/분/초 빼고 "2025. 11. 21." 형태로만 저장!
            createdAt: new Date().toLocaleDateString() 
        });

        alert("리뷰가 등록되었습니다!");
        closeReviewModal();
    } catch (e) {
        console.error("리뷰 저장 실패:", e);
        alert("오류가 발생했습니다.");
    }
}

window.openReadReviewModal = async function(placeId) {
    const container = document.getElementById('review-list-container');
    const modal = document.getElementById('read-review-modal');
    
    modal.style.display = 'flex';
    container.innerHTML = '<div style="text-align:center; padding:20px;">로딩중... ⌛</div>';

    try {
        const q = query(
            collection(db, "reviews"), 
            where("placeId", "==", placeId),
            orderBy("createdAt", "desc") 
        );
        
        const querySnapshot = await getDocs(q);
        let html = "";
        
        if (querySnapshot.empty) {
            html = '<div style="text-align:center; padding:40px; color:#999;">아직 작성된 리뷰가 없어요.<br>첫 번째 리뷰를 남겨보세요! ✍️</div>';
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const stars = "⭐".repeat(data.rating);
                
                html += `
                    <div class="review-item">
                        <div class="review-header">
                            <span class="review-stars">${stars}</span>
                            <span>${data.createdAt}</span> 
                        </div>
                        <div class="review-text">${data.text}</div>
                    </div>
                `;
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        if(e.message.includes("index")) alert("Firebase 콘솔에서 색인(Index)을 생성해야 합니다.");
        container.innerHTML = "리뷰를 불러오지 못했습니다.";
    }
}

window.closeReadReviewModal = function() {
    document.getElementById('read-review-modal').style.display = 'none';
}

// -----------------------------------------------------------
// 8. 데이터 업로드 (필요할 때만 주석 풀기)
// -----------------------------------------------------------
async function uploadData() {
    const placesCol = collection(db, "places");
    if (!confirm("데이터를 업로드하시겠습니까?")) return;
    console.log(`총 ${initialData.length}개 업로드 시작...`);
    for (const item of initialData) {
        try { await addDoc(placesCol, item); } catch (e) { console.error(e); }
    }
    alert("업로드 완료!");
}
// uploadData();