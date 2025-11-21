// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기 (CDN 방식)
// -----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// Firebase 실행
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


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

// 카드 클릭 시 해당 위치로 이동하는 함수 (index.html에서 사용됨)
window.moveToLocation = function(lat, lng) {
    map.flyTo([lat, lng], 14, { duration: 1.5 });
}


// -----------------------------------------------------------
// 4. 기능 함수들 (환율, 날씨)
// -----------------------------------------------------------
async function fetchExchangeRate() {
    const diffEl = document.querySelector('.exchange-diff');
    const descEl = document.querySelector('.exchange-desc');
    const rateEl = document.getElementById('rate-text');

    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
        const data = await response.json();
        const rate = data.rates.KRW; 
        const result = (rate * 100).toFixed(0); 
        
        // 화면에 환율 표시
        rateEl.innerText = `₩ ${result}`;

        // 스벅 라떼 계산
        const japanLattePrice = 490 * rate; 
        const diff = (5000 - japanLattePrice).toFixed(0); 

        // 멘트 업데이트
        if (result < 950) {
            diffEl.innerText = "▼ 슈퍼 엔저 찬스!";
            diffEl.style.color = "#2ecc71"; 
            descEl.innerText = `"스벅 라떼가 한국보다 ${diff}원 싸요!"`;
        } else if (result < 1000) {
            diffEl.innerText = "- 적절한 환율";
            diffEl.style.color = "#333"; 
            descEl.innerText = `"스벅 라떼가 한국보다 ${diff}원 저렴해요."`;
        } else {
            diffEl.innerText = "▲ 환율이 조금 올랐어요";
            diffEl.style.color = "#e74c3c"; 
            descEl.innerText = "물가 차이가 많이 줄었어요.";
        }

    } catch (error) {
        // 🚨 에러 발생 시에도 자연스럽게 보이도록 처리
        console.error("환율 로딩 실패:", error);
        rateEl.innerText = "₩ 910 (예상)"; // 예상치
        
        // 예상치(910원) 기준 멘트 강제 적용
        diffEl.innerText = "▼ 환율 정보 로딩 실패";
        diffEl.style.color = "#888"; 
        descEl.innerText = "기본값(910원)으로 표시됩니다.";
    }
}
fetchExchangeRate();

// 날씨 함수
window.fetchWeather = async function(lat, lng, cityName) {
    try {
        // 로딩 표시
        document.getElementById('city-name').innerText = cityName;
        document.getElementById('current-temp').innerText = "..";
        
        // API 호출
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await response.json();
        const temp = data.current_weather.temperature;
        
        // 온도 업데이트
        document.getElementById('current-temp').innerText = `${temp}°C`;
        
        // 멘트 자동 변경 로직
        const descEl = document.querySelector('.weather-desc');
        const iconEl = document.querySelector('.weather-header i');

        if (temp >= 30) {
            descEl.innerText = "너무 더워요! 실내 위주로 다니세요 🥵";
            iconEl.className = "fas fa-sun"; 
        } else if (temp >= 23) {
            descEl.innerText = "반팔 입기 좋은 초여름 날씨! 👕";
            iconEl.className = "fas fa-cloud-sun";
        } else if (temp >= 15) {
            descEl.innerText = "여행하기 최고의 날씨입니다! ✨";
            iconEl.className = "fas fa-smile";
        } else if (temp >= 5) {
            descEl.innerText = "쌀쌀해요! 코트나 자켓 챙기세요 🧥"; 
            iconEl.className = "fas fa-wind";
        } else {
            descEl.innerText = "너무 추워요! 패딩 필수입니다 🧣";
            iconEl.className = "fas fa-snowflake";
        }

    } catch (error) { console.error(error); }
}


// -----------------------------------------------------------
// 5. ⭐ Firebase 데이터 연동 & 좋아요 기능
// -----------------------------------------------------------
var locations = [];
var currentMarkers = [];

// (1) 데이터 실시간 감시 (onSnapshot)
const placesCol = collection(db, "places"); 

onSnapshot(placesCol, (snapshot) => {
    locations = []; 
    snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
            id: doc.id, 
            ...data
        });
    });
    
    // 데이터가 바뀌면 지도 핀도 새로고침
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? getCategoryFromBtn(activeBtn) : 'all';
    filterCategory(currentCategory);
});

// (2) 좋아요 클릭 함수
window.toggleLike = async function(docId) {
    const docRef = doc(db, "places", docId);
    try {
        await updateDoc(docRef, {
            likes: increment(1)
        });
        console.log("좋아요 성공!");
    } catch (e) {
        console.error("좋아요 실패:", e);
        alert("좋아요를 누르지 못했습니다.");
    }
}

// (3) 필터 및 마커 찍기
window.filterCategory = function(category) {
    markerCluster.clearLayers();

    const filtered = category === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === category);

    filtered.forEach(loc => {
        var marker = L.marker([loc.lat, loc.lng]);
        
        // 팝업 내용 (기존 디자인 유지)
        const popupContent = `
            <div class="popup-content">
                <span class="popup-title">${loc.name}</span>
                <button class="weather-btn" onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${loc.name}')">
                    <i class="fas fa-cloud-sun"></i> 날씨 확인
                </button>
                <br>
                <div class="like-box" onclick="toggleLike('${loc.id}')">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${loc.likes || 0}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // 클릭 이벤트
        marker.on('click', () => {
            map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 });
        });

        markerCluster.addLayer(marker);
    });
    
    // 버튼 스타일 업데이트
    updateBtnStyle(category);
}

// 버튼 스타일 헬퍼 함수
function updateBtnStyle(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// 버튼 텍스트로 카테고리 유추 (간단 버전)
function getCategoryFromBtn(btn) {
    if (btn.innerText.includes('맛집')) return 'food';
    if (btn.innerText.includes('관광')) return 'view';
    if (btn.innerText.includes('교류')) return 'culture';
    return 'all';
}


// -----------------------------------------------------------
// 6. 비행기 가격 표시 및 정각마다 업데이트 (랜덤 가격으로 동작)
// -----------------------------------------------------------

// 💡 (가상 데이터) 주요 도시별 최저가 비행기 가격 범위
const flightPriceRange = {
    tokyo: { min: 180000, max: 250000 },
    seoul: { min: 90000, max: 120000 },
    osaka: { min: 160000, max: 230000 }
};

// 랜덤으로 가격을 변동시키는 함수 (실제 API 역할을 대신함)
function generateRandomPrice(city) {
    const min = flightPriceRange[city].min;
    const max = flightPriceRange[city].max;
    // 최저가와 최고가 사이에서 1000원 단위로 랜덤 가격 생성
    const newPrice = Math.floor(Math.random() * ((max - min) / 1000 + 1)) * 1000 + min;
    return newPrice;
}

function displayFlightPrices() {
    // 1. 가격 데이터 업데이트 및 UI 적용
    const tokyoPrice = generateRandomPrice('tokyo');
    const seoulPrice = generateRandomPrice('seoul');
    const osakaPrice = generateRandomPrice('osaka');
    
    // 가격을 한국 통화 형식으로 포맷팅
    const formatPrice = (price) => `₩ ${price.toLocaleString()} ~`;

    // 하단 카드 가격 업데이트
    const tokyoPriceEl = document.getElementById('price-tokyo');
    const seoulPriceEl = document.getElementById('price-seoul');
    const osakaPriceEl = document.getElementById('price-osaka');
    
    if (tokyoPriceEl) tokyoPriceEl.innerHTML = `<i class="fas fa-plane"></i> ${formatPrice(tokyoPrice)}`;
    if (seoulPriceEl) seoulPriceEl.innerHTML = `<i class="fas fa-plane"></i> ${formatPrice(seoulPrice)}`;
    if (osakaPriceEl) osakaPriceEl.innerHTML = `<i class="fas fa-plane"></i> ${formatPrice(osakaPrice)}`;

    // 2. 상태 위젯 업데이트
    const now = new Date();
    document.getElementById('last-update').innerText = `최근 업데이트: ${now.toLocaleTimeString('ko-KR')}`;
    
    // 다음 업데이트 시간 계산 및 표시
    // 다음 정각은 현재 시간 + 1시간 (3600000ms)으로 고정됩니다.
    const nextUpdate = new Date(now.getTime() + 3600000); 
    document.getElementById('next-update-time').innerText = nextUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    console.log(`[Flight] 비행기 가격 업데이트 완료: ${now.toLocaleTimeString('ko-KR')}`);
}

// 💡 정각 업데이트를 위한 초기 딜레이 계산 함수
function startHourlyUpdate() {
    const now = new Date();
    // 현재 분과 초를 밀리초로 변환 
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const elapsed = (minutes * 60 + seconds) * 1000;
    
    // 다음 정각까지 남은 시간 = 1시간(3600000ms) - 현재 경과 시간
    const delay = 3600000 - elapsed;

    // 💡 (수정된 부분) 다음 업데이트 시각을 미리 계산하여 표시합니다.
    const nextUpdate = new Date(now.getTime() + delay); 
    document.getElementById('next-update-time').innerText = nextUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    console.log(`[Flight] 다음 정각까지 ${Math.ceil(delay / 60000)}분 대기 후 첫 업데이트를 시작합니다.`);

    // 1. 다음 정각에 한 번 실행
    setTimeout(() => {
        displayFlightPrices(); // 첫 정각 업데이트 실행
        
        // 2. 이후부터는 1시간(3600000ms)마다 반복 실행
        setInterval(displayFlightPrices, 3600000);
    }, delay);
}

// 💡 정각 업데이트 시작
startHourlyUpdate(); 


// -----------------------------------------------------------
// 7. 데이터 업로드 도구 (기존 섹션 유지)
// -----------------------------------------------------------

// ==========================================
// 🚨 [데이터 업로드 도구]
// 사용법:
// 1. 아래 uploadData(); 주석을 푼다.
// 2. 새로고침 한다.
// 3. "완료" 창이 뜨면 다시 주석 처리한다.
// ==========================================

async function uploadData() {
    const placesCol = collection(db, "places");
    
    // 혹시 모르니 확인창 띄우기
    if (!confirm("정말로 데이터를 업로드 하시겠습니까? (중복 주의)")) return;

    console.log(`총 ${initialData.length}개의 데이터를 업로드합니다...`);

    for (const item of initialData) {
        try {
            await addDoc(placesCol, item);
            console.log(`[성공] ${item.name}`);
        } catch (e) {
            console.error(`[실패] ${item.name}`, e);
        }
    }
    
    alert("업로드 끝! 콘솔창(F12)을 확인해보세요.");
}

// 👇 실행하려면 아래 주석(//)을 지우고 저장하세요.
//uploadData();