// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기 (deleteDoc 추가 확인)
// ----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// ⭐ deleteDoc이 추가되어야 합니다.
import { getFirestore, collection, getDocs, doc, updateDoc, increment, onSnapshot, addDoc, query, where, orderBy, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initialData } from './data.js'; 

// -----------------------------------------------------------
// 2. Firebase 설정 
// ----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD07_-y8JQJUorLcbkr4Cp7Xw2_w0dlzeY",
  authDomain: "hackathon-40673.firebaseapp.com",
  projectId: "hackathon-40673",
  storageBucket: "hackathon-40673.firebase-storage.app",
  messagingSenderId: "1004330982884",
  appId: "1:1004330982884:web:d974018e61680e7971bbf1",
  measurementId: "G-FHJ3CY1783"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let isSnapshotUpdate = false; 

// -----------------------------------------------------------
// ⭐ 다국어 설정 (view -> landmark로 변경 완료)
// ----------------------------------------------------------
let currentLang = 'ko'; // 기본 언어

const translations = {
    ko: {
        placeholder: "어디로 떠나볼까요?",
        all: "전체", food: "🍜 맛집", landmark: "🏰 관광", culture: "🏛️ 유적", station: "🚇 교통", 

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
        review_read: "리뷰 보기",
        modal_write_title: "📝 리뷰 쓰기",
        modal_read_title: "📋 여행자 생생 리뷰",
        placeholder_review: "이곳의 후기를 남겨주세요! (예: 야경이 정말 예뻐요)",
        btn_submit: "등록하기",
        no_reviews: "아직 작성된 리뷰가 없어요.<br>첫 번째 리뷰를 남겨보세요! ✍️",
        msg_loading: "로딩중... ⌛",
        score_unit: "점",
        alert_input_empty: "내용을 입력해주세요!",
        alert_success: "리뷰가 등록되었습니다!",
        alert_already_reviewed: "이미 이 장소에 리뷰를 작성하셨습니다!",
        placeholder_nickname: "닉네임"
    },
    ja: {
        placeholder: "どこへ行きますか？",
        all: "すべて", food: "🍜 グルメ", landmark: "🏰 観光", culture: "🏛️ 遺跡", station: "🚇 交通", 

        exchangeTitle: "🇰🇷 KRW 1000 ➔ 🇯🇵 JPY",
        starbucks: "スタバのラテが日本より",
        cheap: "円 安い！", expensive: "円 高い。",
        weatherDesc: "ピンをクリックして天気を確認！",
        cityNeed: "地域を選択",
        w_hot: "暑すぎます！室内がおすすめ 🥵",
        w_warm: "半袖でいい天気！ 👕",
        w_good: "旅行に最高の天気！ ✨",
        w_cool: "肌寒いです！上着が必要です 🧥",
        w_cold: "寒いです！ダウン必須 🧣",
        popup_weather: "天気予報",
        popup_like: "いいね",
        review_write: "レビューを書く",
        review_read: "レビューを見る",
        modal_write_title: "📝 レビューを書く",
        modal_read_title: "📋 旅行者のリアルな口コミ",
        placeholder_review: "ここに感想を残してください！ (例: 夜景がとても綺麗です)",
        btn_submit: "登録する",
        no_reviews: "まだレビューがありません。<br>最初のレビューを投稿しましょう！ ✍️",
        msg_loading: "読み込み中... ⌛",
        score_unit: "点",
        alert_input_empty: "内容を入力してください！",
        alert_success: "レビューが登録されました！",
        alert_already_reviewed: "すでにこの場所のレビューを作成しました！",
        placeholder_nickname: "ニックネーム"
    }
};


// -----------------------------------------------------------
// 3. 지도 및 기본 설정
// ----------------------------------------------------------
// 화면 너비가 600px보다 작으면 모바일로 간주
var isMobile = window.innerWidth < 600;

// 모바일이면 줌 7 (멀리), PC면 줌 8 (가깝게)
var initialZoom = isMobile ? 7 : 7;

// 중심 좌표: 부산과 후쿠오카의 중간 지점
var map = L.map('map', { zoomControl: false }).setView([34.4, 129.5], initialZoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

var markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,      // 마커를 묶는 최대 반경 (50px)
    disableClusteringAtZoom: 13, // 클러스터링 해제 Zoom Level (13)
    
    // ⭐ 클러스터 아이콘 생성 함수 정의
    iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount(); // 클러스터 내부 마커 개수
        var className = 'marker-cluster'; // 라이브러리 기본 클래스
        var colorClass = ''; // 색상을 결정하는 클래스

        // 1. 크기(외형)를 결정하는 기본 클래스 적용 (Leaflet.markercluster의 기본 디자인 유지)
        if (count < 10) {
            className += ' marker-cluster-small';
        } else if (count < 100) {
            className += ' marker-cluster-medium';
        } else {
            className += ' marker-cluster-large';
        }

        // 2. 개수에 따른 색상 클래스 적용
        if (count <= 10) {
            colorClass = ' mc-green'; // mc-green 클래스 추가
        } else if (count <= 30) {
            colorClass = ' mc-yellow'; // mc-yellow 클래스 추가
        } else if (count <= 50) {
            colorClass = ' mc-orange'; // mc-orange 클래스 추가
        } else {
            colorClass = ' mc-red'; // mc-red 클래스 추가
        }
        
        // 최종 클래스 조합: Leaflet 기본 디자인 + 커스텀 색상
        className += colorClass;

        return L.divIcon({ 
            html: '<div><span>' + count + '</span></div>', 
            className: className, 
            iconSize: new L.Point(40, 40) // Leaflet 기본값 유지
        });
    }
});
map.addLayer(markerCluster);

// ⭐ 현재 열려있는 팝업(장소)의 ID를 기억하는 변수
let selectedPlaceId = null; 
let currentEditingReviewId = null; // ⭐ 리뷰 수정 중인지 확인하는 전역 변수

// -----------------------------------------------------------
// 4. 기능 함수들 (환율, 날씨)
// ----------------------------------------------------------
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

// ⭐ [window 할당] 날씨 확인 함수
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
// ----------------------------------------------------------
var locations = [];
var allMarkers = {}; // 마커 객체를 ID로 저장할 맵

const placesCol = collection(db, "places");

onSnapshot(placesCol, (snapshot) => {
    try {
        locations = []; 
        snapshot.forEach((doc) => {
            locations.push({ id: doc.id, ...doc.data() });
        });
        
        isSnapshotUpdate = true; 

        // 데이터 로드 후 현재 필터 상태에 맞춰 갱신
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
        filterCategory(currentCategory);

        // ⭐ [수정] 업데이트 플래그 해제 (다시 원래대로)
        isSnapshotUpdate = false; 
        
        // 데이터 로드 완료 후 탭 이벤트를 다시 연결합니다.
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                filterCategory(button.dataset.category);
            });
        });
        
    } catch (e) {
        console.error("Firebase 실시간 데이터 로드 중 오류 발생:", e);
    }
});

/**
 * 카테고리에 맞는 Font Awesome 아이콘을 가진 커스텀 마커 아이콘을 생성합니다.
 */
// 4.1. 카테고리별 커스텀 마커 아이콘 설정 (view -> landmark로 변경 대응)
const categoryIcons = {
    // 🍜 맛집
    food: { icon: 'fa-utensils', color: '#e74c3c' },   
    // 🏰 관광 
    landmark: { icon: 'fa-archway', color: '#3498db' }, 
    // 🏛️ 유적
    culture: { icon: 'fa-landmark', color: '#9b59b6' }, 
    // 🚇 교통
    station: { icon: 'fa-train', color: '#2ecc71' }   
};

function getCustomIcon(category) {
    // categoryIcons에서 찾고, 없으면 기본 아이콘 사용
    const iconData = categoryIcons[category] || { icon: 'fa-map-pin', color: '#7f8c8d' };
    const color = iconData.color; // 카테고리 색상
    
    // ⭐ [핵심 수정] 핀 머리(원)와 핀 꼬리(삼각형)를 분리하여 색상을 모두 적용
    const htmlContent = `
        <div class="custom-marker-head" style="background-color: ${color};">
            <i class="fas ${iconData.icon}"></i>
        </div>
        <div class="custom-marker-tail" style="border-top-color: ${color};"></div>
    `;

    return L.divIcon({
        className: 'custom-marker-container', // 새로운 래퍼 클래스 이름
        html: htmlContent,
        iconSize: [30, 42],     // 마커의 크기 (CSS와 일치)
        iconAnchor: [15, 42]    // 핀의 뾰족한 끝이 정확한 좌표를 가리키도록 설정
    });
}


/**
 * 지도에 마커를 다시 그리고 카드 리스트를 갱신하는 핵심 함수
 */
function updateMapMarkers(data) {
    markerCluster.clearLayers();
    allMarkers = {}; // 마커 맵 초기화
    const t = translations[currentLang];

    // ⭐ 렌더링 시점의 최신 로컬 스토리지 상태 가져오기
    const myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];

    const markers = data.map(loc => {
        const marker = L.marker([loc.lat, loc.lng], {
            icon: getCustomIcon(loc.category)
        });

        allMarkers[loc.id] = marker;

        const displayName = loc[`name_${currentLang}`] || loc.name;
        const safeDisplayName = displayName.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeLocId = loc.id.replace(/'/g, "\\'");

        const myStyle = categoryIcons[loc.category] || { color: '#7f8c8d', icon: 'fa-map-pin' };

        // 좋아요 상태에 따른 아이콘 및 색상 결정
        const isLiked = myLikes.includes(loc.id);
        const likeIconClass = isLiked ? 'fas fa-heart' : 'far fa-heart';
        const likeColor = isLiked ? '#e74c3c' : '#333'; 

        const popupContent = `
            <div class="popup-content" style="min-width: 220px; display: flex; flex-direction: column; gap: 8px;">
                <span class="popup-title" style="font-size: 15px; font-weight: bold; color: ${myStyle.color}; margin-bottom: 5px;">
                    <i class="fas ${myStyle.icon}" style="margin-right: 5px;"></i>${displayName}
                </span>

                <button class="weather-btn" style="width: 100%; display: flex; justify-content: center; align-items: center; margin: 0;" onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${safeDisplayName}')">
                    <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                </button>

                <div style="display:flex; gap:6px; width: 100%;">
                    <button class="weather-btn" style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); flex:1; display: flex; justify-content: center; align-items: center; margin:0; padding: 8px 0;" onclick="window.openReviewModal('${safeLocId}', '${safeDisplayName}')">
                        <i class="fas fa-pen"></i> ${t.review_write}
                    </button>
                    <button class="weather-btn" style="background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%); flex:1; display: flex; justify-content: center; align-items: center; margin:0; padding: 8px 0;" onclick="window.openReadReviewModal('${safeLocId}')">
                        <i class="fas fa-book"></i> ${t.review_read}
                    </button>
                </div>

                <div class="like-box" style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                    <span id="like-count-${loc.id}" style="font-size: 14px; font-weight: bold; color: #e74c3c;">${loc.likes}</span>
                    <button class="like-btn" onclick="toggleLike(event, '${loc.id}')" style="color: ${likeColor}; border-color: ${likeColor};">
                        <i id="like-icon-${loc.id}" class="${likeIconClass}"></i> ${t.popup_like}
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, {
            maxWidth: 300,
            closeButton: false,
            autoClose: false
        });

        marker.on('click', function() {
            selectedPlaceId = loc.id;
            fetchWeather(loc.lat, loc.lng, displayName);
        });

        return marker;
    });

    // 1. 모든 마커를 클러스터(지도)에 먼저 추가합니다.
    markerCluster.addLayers(markers);

    // 2. ⭐ [핵심 수정] 마커가 지도에 다 올라간 뒤에 팝업을 엽니다.
    if (selectedPlaceId && allMarkers[selectedPlaceId]) {
        const targetMarker = allMarkers[selectedPlaceId];
        
        // Leaflet.markercluster의 기능을 사용하여, 클러스터링 되어 있어도 줌을 당겨서 열어줍니다.
        markerCluster.zoomToShowLayer(targetMarker, function() {
            targetMarker.openPopup();
        });
    }

    updateCardList(data);
}

// -----------------------------------------------------------
// 6. 좋아요 기능 (토글)
// ----------------------------------------------------------
// ⭐ [window 할당] 좋아요 토글 함수 
window.toggleLike = async function(e, docId) {
    // 1. 이벤트 전파 중단 (지도 클릭 방지)
    if (e) {
        e.stopPropagation();
    }

    // 2. 현재 보고 있는 장소 ID 유지 (팝업 재오픈용)
    selectedPlaceId = docId;

    const docRef = doc(db, "places", docId);
    let myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];
    const isLiked = myLikes.includes(docId);

    // 3. ⭐ [핵심] 로컬 스토리지 먼저 업데이트 (UI 즉시 반영을 위해)
    if (isLiked) {
        myLikes = myLikes.filter(id => id !== docId);
    } else {
        myLikes.push(docId);
    }
    localStorage.setItem('myLikedPlaces', JSON.stringify(myLikes));

    // 4. Firebase 업데이트 (비동기)
    try {
        if (isLiked) {
            await updateDoc(docRef, { likes: increment(-1) });
        } else {
            await updateDoc(docRef, { likes: increment(1) });
        }
        // onSnapshot이 트리거되어 updateMapMarkers가 호출됩니다.
    } catch (e) {
        console.error("좋아요 토글 실패:", e);
        // 에러 발생 시 로컬 스토리지 원복 (선택 사항)
        alert(currentLang === 'ko' ? "좋아요 처리 중 오류가 발생했습니다." : "「いいね」処理中にエラーが発生しました。");
    }
}



// -----------------------------------------------------------
// 7. 필터링 및 검색 기능
// ----------------------------------------------------------
// ⭐ [window 할당] 카테고리 필터 함수 (필터로 동작)
window.filterCategory = function(category) {
    let filtered;
    
    // ⭐ [수정] 사용자가 직접 필터 버튼을 누른 게 아니라면(좋아요 등), 팝업 상태를 유지합니다.
    if (!isSnapshotUpdate) {
        selectedPlaceId = null; 
    }
    
    if (category === 'all') {
        filtered = locations;
    } else {
        filtered = locations.filter(loc => loc.category === category);
    }

    // 맵 마커와 카드 리스트 갱신
    updateMapMarkers(filtered);
    
    // 버튼 Active 클래스 관리
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[data-category="${category}"]`).classList.add('active');
}

function updateCardList(data) {
    const cardsContainer = document.querySelector('.bottom-cards');
    cardsContainer.innerHTML = ''; // 기존 카드 모두 제거
    
    const t = translations[currentLang];
    
    data.forEach(loc => {
        const myStyle = categoryIcons[loc.category] || { color: '#7f8c8d' };
        const displayName = loc[`name_${currentLang}`] || loc.name;
        
        // 좋아요 상태 확인
        const myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];
        const isLiked = myLikes.includes(loc.id);
        const likeIconClass = isLiked ? 'fas fa-heart' : 'far fa-heart';
        
        // 국가 태그 (부산/후쿠오카)
        const isBusan = loc.lat > 34; // 대략적인 위도로 부산/후쿠오카 구분
        const countryTag = isBusan ? `<span class="card-tag kr">🇰🇷 ${currentLang === 'ko' ? '부산' : '釜山'}</span>` : `<span class="card-tag jp">🇯🇵 ${currentLang === 'ko' ? '후쿠오카' : '福岡'}</span>`;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            ${countryTag}
            <div class="card-header" style="color: ${myStyle.color};">
                <i class="fas ${myStyle.icon}" style="margin-right: 5px;"></i>
                <span class="card-title">${displayName}</span>
            </div>
            <div class="card-body">
                <button class="card-like-btn" onclick="toggleLike(event, '${loc.id}')">
                    <span id="card-like-count-${loc.id}" style="font-weight: bold;">${loc.likes}</span>
                    <i id="card-like-icon-${loc.id}" class="${likeIconClass}"></i>
                </button>
            </div>
        `;
        
        // 카드 클릭 시 맵 중심 이동 및 팝업 열기 (카드 클릭 이벤트는 팝업을 닫지 않음)
        card.addEventListener('click', () => {
            const targetMarker = allMarkers[loc.id];
            if (targetMarker) {
                // 맵을 마커 위치로 이동 및 줌 레벨 조정
                map.flyTo([loc.lat, loc.lng], 15, { duration: 1.5 });
                selectedPlaceId = loc.id; 
                
                // flyTo 애니메이션이 끝난 후 팝업을 열기 위해 딜레이
                setTimeout(() => {
                    // 클러스터에 숨겨져 있다면, 줌 레벨이 높아졌으므로 팝업을 엽니다.
                    targetMarker.openPopup(); 
                }, 1500); 
            }
        });
        
        cardsContainer.appendChild(card);
    });
}

// 검색 기능 리스너
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', function() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === "") {
        filterCategory('all'); // 검색어가 비어 있으면 '전체' 카테고리 필터 적용
        return;
    }
    
    // 검색 중에는 selectedPlaceId를 초기화 (검색 결과만 보여주기 위함)
    selectedPlaceId = null; 
    
    const searched = locations.filter(loc => {
        const koName = loc.name.toLowerCase();
        const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : "";
        return koName.includes(searchTerm) || jaName.includes(searchTerm);
    });

    // 검색 결과로 지도 마커 갱신 (빈 검색어면 전체)
    updateMapMarkers(searched);
    
    // 검색 중에는 필터 버튼의 Active 상태를 해제 (선택된 카테고리가 없음을 표시)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.filter-btn[data-category="all"]').classList.add('active'); // '전체' 탭 Active 유지
});

// 검색 후 Enter 시, 결과가 1개면 줌인
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value.toLowerCase();
        
        // 다시 한 번 검색 결과 찾기
        const searched = locations.filter(loc => {
            const koName = loc.name.toLowerCase();
            const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : "";
            return koName.includes(searchTerm) || jaName.includes(searchTerm);
        });

        if (searched.length === 0) {
            return; // 결과 없으면 가만히 있음
        }
        
        // ⭐ 검색 시에도 selectedPlaceId 초기화
        selectedPlaceId = null; 

        // A. 결과가 딱 1개면 -> 거기로 '슝~' 날아가기
        if (searched.length === 1) {
            const target = searched[0];
            map.flyTo([target.lat, target.lng], 15, { duration: 1.5 });
            
            // 팝업 열기
            selectedPlaceId = target.id; 
            
            // flyTo 애니메이션이 끝난 후 팝업을 열기 위해 딜레이
            setTimeout(() => {
                const targetMarker = allMarkers[target.id];
                if (targetMarker) {
                    targetMarker.openPopup(); 
                }
            }, 1500);

        } else if (searched.length > 1) {
            // B. 결과가 여러 개면 -> 첫 번째 결과로 이동하여 클러스터링된 상태를 보여줌
             const target = searched[0];
             map.flyTo([target.lat, target.lng], 10, { duration: 1.5 });
        }
    }
});


// -----------------------------------------------------------
// 8. 언어 설정 토글
// ----------------------------------------------------------
// ⭐ [window 할당] 언어 토글 함수
window.toggleLanguage = function() {
    currentLang = currentLang === 'ko' ? 'ja' : 'ko';
    localStorage.setItem('currentLang', currentLang);
    
    // UI 텍스트 업데이트
    updateUITexts();
    
    // 맵 마커와 카드 리스트 전체를 다시 그려서 팝업과 카드의 언어를 업데이트
    filterCategory(document.querySelector('.filter-btn.active').dataset.category);

    // 언어 스위치 UI 업데이트
    document.getElementById('lang-ko').classList.toggle('active', currentLang === 'ko');
    document.getElementById('lang-ja').classList.toggle('active', currentLang === 'ja');
    
    // 리뷰 읽기 모달이 열려 있다면 닫고 재오픈
    const readModal = document.getElementById('read-review-modal');
    if (readModal.style.display === 'flex') {
        const tempPlaceId = currentReviewPlaceId;
        window.closeReadReviewModal();
        // 팝업이 닫힌 후 다시 열기 위해 딜레이
        setTimeout(() => {
            window.openReadReviewModal(tempPlaceId);
        }, 100);
    }
}

function updateUITexts() {
    const t = translations[currentLang];
    
    // 1. 검색창
    document.getElementById('search-input').placeholder = t.placeholder;
    
    // 2. 카테고리 버튼
    document.querySelector('.filter-btn[data-category="all"]').innerText = t.all;
    document.querySelector('.filter-btn[data-category="food"]').innerText = t.food;
    document.querySelector('.filter-btn[data-category="landmark"]').innerText = t.landmark;
    document.querySelector('.filter-btn[data-category="culture"]').innerText = t.culture;
    document.querySelector('.filter-btn[data-category="station"]').innerText = t.station;
    
    // 3. 환율 위젯
    document.getElementById('exchange-title').innerText = t.exchangeTitle;
    fetchExchangeRate(); // 환율 정보 업데이트 (환율 텍스트도 업데이트)
    
    // 4. 날씨 위젯
    document.querySelector('.weather-desc').innerText = t.weatherDesc;
    document.getElementById('city-name').innerText = t.cityNeed;
    
    // 5. 모달 타이틀
    document.getElementById('modal-write-title').innerText = t.modal_write_title;
    document.getElementById('modal-read-title').innerText = t.modal_read_title;
    document.getElementById('review-text').placeholder = t.placeholder_review;
    document.getElementById('btn-submit').innerText = t.btn_submit;
    document.getElementById('review-nickname').placeholder = t.placeholder_nickname;

    // 6. 현재 보고 있는 팝업이 있다면 내용만 업데이트
    // selectedPlaceId를 통해 팝업 내용 업데이트를 위해 갱신 
    if (selectedPlaceId) { 
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
        filterCategory(currentCategory); // 팝업 내용 업데이트를 위해 갱신
    }
}

// 페이지 로드 시 UI 텍스트 초기 설정
document.addEventListener('DOMContentLoaded', () => {
    // 로컬 스토리지에서 언어 설정 불러오기
    const storedLang = localStorage.getItem('currentLang');
    if (storedLang) {
        currentLang = storedLang;
    }
    
    // 언어 스위치 UI 업데이트
    document.getElementById('lang-ko').classList.toggle('active', currentLang === 'ko');
    document.getElementById('lang-ja').classList.toggle('active', currentLang === 'ja');

    // UI 텍스트 초기 설정
    updateUITexts();
});


// -----------------------------------------------------------
// 9. 리뷰 모달 및 기능 (window 명시적 할당)
// ----------------------------------------------------------
let currentReviewPlaceId = null; // 현재 리뷰를 작성/읽는 장소 ID

// ⭐ [window 할당] 리뷰 쓰기 모달 열기
window.openReviewModal = function(placeId, placeName) {
    currentReviewPlaceId = placeId;
    currentEditingReviewId = null; // 새 리뷰 작성 모드
    const t = translations[currentLang];
    
    // UI 초기화
    document.getElementById('modal-write-title').innerHTML = t.modal_write_title;
    document.getElementById('review-name').innerText = placeName;
    document.getElementById('review-nickname').value = '';
    document.getElementById('review-text').value = '';
    document.getElementById('review-rating').value = 0;
    document.getElementById('rating-value').innerText = `0${t.score_unit}`;
    
    // 별점 초기화 (모든 별 아이콘 색상 초기화)
    document.querySelectorAll('.star-rating .star').forEach(star => {
        star.style.color = '#ddd'; // 초기화 색상 (회색)
    });
    
    // ⭐ [수정] 모달 ID를 'review-modal'로 변경
    document.getElementById('review-modal').style.display = 'flex';
}

// ⭐ [window 할당] 리뷰 쓰기 모달 닫기
window.closeReviewModal = function() {
    // ⭐ [수정] 모달 ID를 'review-modal'로 변경
    document.getElementById('review-modal').style.display = 'none';
    currentEditingReviewId = null; // 수정 모드 해제
}

// ⭐ [window 할당] 별점 설정
window.setRating = function(rating) {
    const t = translations[currentLang];
    document.getElementById('review-rating').value = rating;
    document.getElementById('rating-value').innerText = `${rating}${t.score_unit}`;
    
    // ⭐ [수정] innerText 대신 style.color를 사용
    document.querySelectorAll('.star-rating .star').forEach((star, index) => {
        star.style.color = index < rating ? '#f39c12' : '#ddd';
    });
}

// ⭐ [window 할당] 리뷰 수정 모달 열기
window.openEditModal = function(reviewDocId, placeId, placeName, nickname, text, rating) {
    window.closeReadReviewModal(); // 읽기 모달 닫기
    
    currentReviewPlaceId = placeId;
    currentEditingReviewId = reviewDocId; // 수정할 리뷰 ID 설정
    const t = translations[currentLang];
    
    // UI 설정
    document.getElementById('modal-write-title').innerHTML = `${t.modal_write_title} (수정)`;
    document.getElementById('review-name').innerText = placeName;
    document.getElementById('review-nickname').value = nickname;
    document.getElementById('review-text').value = text;
    
    // 별점 설정 함수 호출
    window.setRating(rating); 
    
    // ⭐ [수정] 모달 ID를 'review-modal'로 변경
    document.getElementById('review-modal').style.display = 'flex';
}


// ⭐ [window 할당] 리뷰 등록/수정
window.submitReview = async function() {
    const t = translations[currentLang];
    const nickname = document.getElementById('review-nickname').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const rating = document.getElementById('review-rating').value;
    
    if (nickname === "" || text === "") {
        alert(t.alert_input_empty);
        return;
    }
    
    try {
        if (currentEditingReviewId) {
            // ⭐ 1. 수정 모드: updateDoc 실행
            const docRef = doc(db, "reviews", currentEditingReviewId);
            await updateDoc(docRef, {
                nickname: nickname,
                text: text,
                rating: parseInt(rating),
                updatedAt: new Date().toISOString() // 수정 시간 기록
            });
            alert(currentLang === 'ko' ? "리뷰가 수정되었습니다!" : "レビューが修正されました！");
            window.closeReviewModal();
            window.openReadReviewModal(currentReviewPlaceId);

        } else {
            // ⭐ 2.2. 등록 모드: addDoc 실행
            let myReviews = JSON.parse(localStorage.getItem('myReviewedPlaces')) || [];
            
            // 등록 모드에서만 중복 확인
            if (myReviews.includes(currentReviewPlaceId)) {
                alert(t.alert_already_reviewed);
                return;
            }

            const userCountry = currentLang === 'ko' ? 'KR' : 'JP';
            
            await addDoc(collection(db, "reviews"), {
                placeId: currentReviewPlaceId,
                nickname: nickname,
                text: text,
                rating: parseInt(rating),
                createdAt: new Date().toISOString(),
                country: userCountry // ⭐ 언어 기반으로 국가 코드 저장 (번역 방향 결정용)
            });

            // 로컬 저장소에 기록 추가 (중복 리뷰 방지)
            myReviews.push(currentReviewPlaceId);
            localStorage.setItem('myReviewedPlaces', JSON.stringify(myReviews));
            
            alert(t.alert_success);
            window.closeReviewModal();
            window.openReadReviewModal(currentReviewPlaceId); // 등록 후 읽기 모달 열기
        }
    } catch (e) {
        console.error("리뷰 등록/수정 실패:", e);
        alert(currentLang === 'ko' ? "리뷰 등록/수정 중 오류가 발생했습니다." : "レビュー登録/修正中にエラーが発生しました。");
    }
}

// ⭐ [window 할당] 리뷰 삭제 (deleteDoc 사용)
window.deleteReview = async function(reviewDocId, placeId) {
    if (!confirm(currentLang === 'ko' ? "정말로 이 리뷰를 삭제하시겠습니까?" : "本当にこのレビューを削除しますか？")) {
        return;
    }
    
    try {
        // 1. 서버에서 문서 삭제
        const docRef = doc(db, "reviews", reviewDocId);
        await deleteDoc(docRef);
        
        // 2. 로컬 저장소 업데이트 (사용자가 다시 리뷰를 쓸 수 있도록 기록 삭제)
        let myReviewedPlaces = JSON.parse(localStorage.getItem('myReviewedPlaces')) || [];
        myReviewedPlaces = myReviewedPlaces.filter(id => id !== placeId);
        localStorage.setItem('myReviewedPlaces', JSON.stringify(myReviewedPlaces));
        
        alert(currentLang === 'ko' ? "리뷰가 삭제되었습니다." : "レビューが削除されました。");
        
        // 3. 리뷰 목록 새로고침
        window.openReadReviewModal(placeId);

    } catch (e) {
        console.error("리뷰 삭제 실패:", e);
        alert(currentLang === 'ko' ? "리뷰 삭제 중 오류가 발생했습니다." : "レビュー削除中にエラーが発生しました。");
    }
}


// ⭐ [window 할당] 리뷰 읽기 모달 닫기
window.closeReadReviewModal = function() {
    document.getElementById('read-review-modal').style.display = 'none';
}

// =========================================================
// ⭐ [수정됨] 리뷰 읽기 모달 열기 (번역 버튼 인자 전달 방식 수정)
// =========================================================
window.openReadReviewModal = async function(placeId) {
    currentReviewPlaceId = placeId;
    const container = document.getElementById('review-list-container');
    const modal = document.getElementById('read-review-modal');
    const t = translations[currentLang];
    
    modal.style.display = 'flex';
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">${t.msg_loading}</div>`;
    
    try {
        // ⭐ 추가: 현재 장소 데이터 찾기 (수정 버튼에 장소 이름 전달을 위해 필요)
        const loc = locations.find(l => l.id === placeId);
        // 싱글 쿼트 이스케이프
        const safeName = (loc[`name_${currentLang}`] || loc.name).replace(/'/g, "\\'"); 
        
        const q = query(collection(db, "reviews"), where("placeId", "==", placeId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">${t.no_reviews}</div>`;
            return;
        }

        let html = '';
        let myReviewedPlaces = JSON.parse(localStorage.getItem('myReviewedPlaces')) || [];
        // 사용자가 이 장소에 리뷰를 썼는지 확인
        const isPlaceReviewedByMe = myReviewedPlaces.includes(placeId); 
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const reviewDocId = doc.id;
            
            // ⭐ 닉네임과 텍스트의 이스케이프 처리 (JS 인자 전달용)
            // openEditModal에 전달할 텍스트는 싱글 쿼트 이스케이프
            const safeText = data.text.replace(/'/g, "\\'"); 
            const safeNickname = data.nickname.replace(/'/g, "\\'"); 
            // 번역 함수에 전달할 텍스트는 HTML 속성용으로 안전하게 처리
            const safeTextForHtmlAttr = encodeURIComponent(data.text);
            
            // 별점 표시
            let starsHtml = '';
            for(let i = 1; i <= 5; i++) {
                starsHtml += `<span style="color: ${i <= data.rating ? '#f39c12' : '#ddd'}; font-size: 18px;">${i <= data.rating ? '★' : '☆'}</span>`;
            }
            
            // 관리 버튼: 사용자가 작성한 리뷰이거나, 현재 작성 모드가 아닌 경우만 표시
            let adminButtons = '';
            // 해당 리뷰의 작성자가 '로컬 리뷰 기록'에 있는 경우에만 수정/삭제 버튼 표시
            if (isPlaceReviewedByMe) {
                 adminButtons = `
                    <button onclick="window.openEditModal('${reviewDocId}', '${placeId}', '${safeName}', '${safeNickname}', '${safeText}', ${data.rating})"
                            style="font-size:11px; background:#f1c40f; border:none; border-radius:12px; padding:4px 10px; cursor:pointer; color:white; display:inline-flex; align-items:center; gap:4px;">
                        <i class="fas fa-edit"></i> ${currentLang === 'ko' ? '수정' : '修正'}
                    </button>
                    <button onclick="window.deleteReview('${reviewDocId}', '${placeId}')"
                            style="font-size:11px; background:#e74c3c; border:none; border-radius:12px; padding:4px 10px; cursor:pointer; color:white; display:inline-flex; align-items:center; gap:4px;">
                        <i class="fas fa-trash"></i> ${currentLang === 'ko' ? '삭제' : '削除'}
                    </button>`;
            }
            
            // ⭐ [번역 로직 단순화] 번역 버튼 텍스트 결정 (FLIP 기능으로 변경)
            // 텍스트 기반으로 국가 추측 (DB에 country 필드가 없을 경우 대비)
            const reviewCountry = data.country || (data.text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/) ? 'JP' : 'KR');
            
            let btnText;
            if (reviewCountry === 'KR') {
                btnText = currentLang === 'ko' ? '번역' : '翻訳'; 
            } else {
                btnText = currentLang === 'ko' ? '번역' : '翻訳';
            }
            
            html += `
                <div class="review-item" style="border-bottom: 1px solid #eee; padding: 15px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <div style="font-size: 15px; font-weight: bold; color: #333;">
                            <span style="background:${data.country === 'KR' ? '#ecf0f1' : '#ffebee'}; color: ${data.country === 'KR' ? '#2c3e50' : '#e74c3c'}; border-radius: 4px; padding: 2px 6px; font-size: 10px; display: inline-flex; justify-content: center; align-items: center; margin-right: 5px;">${data.country}</span> ${data.nickname} 
                        </div>
                        <div style="font-size: 12px; color: #999;">${new Date(data.createdAt).toLocaleDateString(currentLang)}</div>
                    </div>
                    <div style="margin-bottom: 10px;">${starsHtml}</div>
                    <div class="review-text" id="review-text-${reviewDocId}" style="font-size: 14px; margin-bottom: 10px; line-height: 1.6;">${data.text}</div>
                    
                    <div id="trans-result-${reviewDocId}" style="font-size:13px; color:#4facfe; margin-bottom:5px; display:none; background:#f0f8ff; padding:8px; border-radius:8px;"></div>
                    
                    <div style="display:flex; justify-content: flex-end; align-items:center; gap:8px;">
                        <button onclick="window.translateReview('${reviewDocId}', '${safeTextForHtmlAttr}')" style="font-size:11px; background:white; border:1px solid #ddd; border-radius:12px; padding:4px 10px; cursor:pointer; color:#555; display:inline-flex; align-items:center; gap:4px;">
                            <i class="fas fa-language"></i> ${btnText}
                        </button>
                        ${adminButtons}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        
    } catch (e) {
        console.error("리뷰 불러오기 실패:", e);
        container.innerHTML = `<div style="text-align:center; padding:20px; color:#e74c3c;">${currentLang === 'ko' ? '리뷰를 불러오는 중 오류가 발생했습니다.' : 'レビューの読み込み中にエラーが発生しました。'}</div>`;
    }
}


// ==========================================================
// ⭐ [수정됨] 번역 기능: 한국어 <-> 일본어 무조건 상호 교차 번역 (Unconditional FLIP)
// ==========================================================
window.translateReview = async function(docId, text) {
    const resultBox = document.getElementById(`trans-result-${docId}`);
    
    // 1. 토글 로직: 번역 결과가 이미 표시되어 있으면 숨기고 함수 종료
    if (resultBox.style.display === 'block') {
        resultBox.style.display = 'none';
        return;
    }

    resultBox.style.display = 'block';
    // 로딩 텍스트 설정
    resultBox.innerText = currentLang === 'ko' ? "번역 중... ⌛" : "翻訳中... ⌛";
    resultBox.style.backgroundColor = '#f0f8ff'; // 로딩 시 배경색
    resultBox.style.color = '#4facfe'; // 로딩 시 글자색
    resultBox.style.padding = '8px'; // 패딩 추가

    try {
        // HTML 이스케이프 문자 디코딩
        const decodedText = decodeURIComponent(text).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        let translatedText = '';
        
        // --- 1차 시도: 한국어 번역 결과를 얻어 언어 감지 ---
        // 임시로 tl=ko로 설정하여, 일본어 리뷰일 경우 바로 한국어 번역 결과를 얻습니다. (sl=auto)
        const initialUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(decodedText)}`;
        let response = await fetch(initialUrl);
        let data = await response.json();
        
        const detectedSourceLang = data[2]; // 감지된 언어 (ko, ja 등)
        translatedText = data[0].map(segment => segment[0]).join(''); // 1차 한국어 번역 결과

        // ⭐ 2. FLIP 로직 실행: 목표 언어를 다시 계산하고, 필요하면 2차 Fetch 수행
        if (detectedSourceLang === 'ja') {
            // Case 1: 일본어 -> 한국어 (1차 시도 결과가 목표. 추가 fetch 불필요)
            // translatedText 변수에 한국어 번역 결과가 이미 들어있습니다.
            
        } 
        else if (detectedSourceLang === 'ko') {
            // Case 2: 한국어 -> 일본어 (2차 fetch 필수)
            const finalTargetLang = 'ja';
            const finalUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${finalTargetLang}&dt=t&q=${encodeURIComponent(decodedText)}`;
            
            response = await fetch(finalUrl);
            data = await response.json();
            
            translatedText = data[0].map(segment => segment[0]).join(''); // 일본어 번역 결과 덮어쓰기
        }
        else {
            // Case 3: 한국어/일본어가 아닌 기타 언어(en, zh 등)
            // ko <-> ja 토글이 사용자 요구이므로, 기타 언어는 번역하지 않고 숨깁니다.
            resultBox.style.display = 'none';
            return;
        }

        // 3. 최종 결과 표시 (번역에 성공했고, 원문과 다르면 표시)
        if (translatedText && translatedText.trim() !== decodedText.trim()) {
            resultBox.innerText = "✅ " + translatedText;
            resultBox.style.color = '#4facfe'; 
            resultBox.style.backgroundColor = '#f0f8ff'; 
        } else {
            // 번역 결과가 원문과 같거나, 번역할 내용이 없는 경우
            resultBox.style.display = 'none';
        }

    } catch (e) {
        console.error("번역 에러:", e);
        
        let errMsg = currentLang === 'ko' ? "번역 실패 (네트워크 또는 서버 한도 초과)" : "翻訳失敗 (ネットワークまたはサーバー制限)";
        
        if (e.message && (e.message.includes('403') || e.message.includes('400'))) {
             errMsg = currentLang === 'ko' ? "⚠️ 번역 한도 초과. 잠시 후 다시 시도해 주세요. (API 오류)" : "⚠️ 翻訳制限超過。しばらくしてから再試行してください。(APIエラー)";
        }

        resultBox.innerText = errMsg;
        resultBox.style.color = '#e74c3c'; 
        resultBox.style.backgroundColor = '#ffecec';
    }
}


// -----------------------------------------------------------
// 10. 기타 관리 기능
// ----------------------------------------------------------
// ⭐ [window 할당] 모든 좋아요 초기화 (개발/테스트용)
window.resetAllLikes = async function() {
    if (!confirm(currentLang === 'ko' ? "경고: 모든 장소의 좋아요 수를 0으로 초기화하고, 사용자님의 로컬 좋아요 기록도 삭제합니다. 계속하시겠습니까?" : "警告: 全ての場所の「いいね」数を0にリセットし、ローカルの「いいね」履歴も削除します。続行しますか？")) return;
    
    try {
        const placesRef = collection(db, "places");
        const snapshot = await getDocs(placesRef);
        
        const updates = [];
        snapshot.forEach(doc => {
            const docRef = doc.ref;
            // 좋아요 수를 0으로 설정
            updates.push(updateDoc(docRef, { likes: 0 })); 
        });

        // 모든 업데이트를 병렬로 실행
        await Promise.all(updates);
        
        // 로컬 좋아요 기록도 초기화
        localStorage.removeItem('myLikedPlaces');
        
        alert(currentLang === 'ko' ? `총 ${snapshot.size}개의 장소의 좋아요 수가 0으로 설정되었습니다.` : `${snapshot.size}箇所の「いいね」数が0にリセットされました。`);
        
        // 지도 마커 갱신을 위해 데이터 재로드 
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
        filterCategory(currentCategory);

    } catch (e) {
        console.error("좋아요 초기화 실패:", e);
        alert(currentLang === 'ko' ? "좋아요 초기화 중 오류가 발생했습니다. 콘솔을 확인해주세요." : "「いいね」リセット中にエラーが発生しました。");
    }
}

// ⭐ [window 할당] 모든 리뷰 초기화 (개발/테스트용) - [추가됨]
window.resetAllReviews = async function() {
    const t = translations[currentLang];
    
    if (!confirm(currentLang === 'ko' ? "경고: 모든 리뷰 데이터를 삭제하고, 사용자님의 로컬 리뷰 기록도 삭제합니다. 계속하시겠습니까?" : "警告: 全てのレビューデータを削除し、ローカルのレビュー履歴も削除します。続行しますか？")) return;

    try {
        const reviewsRef = collection(db, "reviews");
        // 모든 리뷰 문서를 가져옵니다.
        const snapshot = await getDocs(reviewsRef);
        
        const deletions = [];
        snapshot.forEach(doc => {
            const docRef = doc.ref;
            // 리뷰 문서 삭제 작업을 배열에 추가
            deletions.push(deleteDoc(docRef)); 
        });

        // 모든 삭제 작업을 병렬로 실행
        await Promise.all(deletions);
        
        // 로컬 리뷰 기록 초기화
        localStorage.removeItem('myReviewedPlaces');
        
        alert(currentLang === 'ko' ? `총 ${snapshot.size}개의 리뷰가 삭제되었습니다.` : `${snapshot.size}件のレビューが削除されました。`);
        
        // 리뷰 읽기 모달이 열려 있다면 닫기
        if (window.closeReadReviewModal) {
            window.closeReadReviewModal();
        }

    } catch (e) {
        console.error("리뷰 초기화 실패:", e);
        alert(currentLang === 'ko' ? "리뷰 초기화 중 오류가 발생했습니다. 콘솔을 확인해주세요." : "レビューリセット中にエラーが発生しました。");
    }
}


// -----------------------------------------------------------
// 11. 데이터 업로드 (필요할 때만 주석 풀기)
// ----------------------------------------------------------

async function uploadData() {
    // 확인 팝업의 텍스트를 "덮어쓰기"로 명확히 수정
    if (!confirm("데이터를 업로드하시겠습니까? (기존 데이터는 덮어쓰여집니다)")) return;
    
    console.log(`총 ${initialData.length}개 업로드 시작...`);
    
    let uploadCount = 0;
    
    for (const item of initialData) {
        // 1. 장소 이름을 기반으로 고유 ID 생성 (특수문자 및 공백 제거)
        // 이 고유 ID가 Firebase 문서 ID로 사용됩니다.
        // 모든 문자를 제거하고 영어, 숫자, 한글만 남깁니다.
        const uniqueId = item.name.replace(/[^a-zA-Z0-9가-힣]/g, ''); 
        
        // **⭐ 이 부분이 Firestore에 데이터를 저장하는 핵심 코드입니다.**
        try {
            // Firestore 컬렉션 'places'에 uniqueId를 문서 ID로 사용하여 item 데이터 저장
            // setDoc을 사용하면 동일한 uniqueId가 이미 존재하면 덮어쓰게 됩니다.
            await setDoc(doc(db, "places", uniqueId), item);
            uploadCount++;
            console.log(`✅ ${uploadCount}/${initialData.length} 업로드 성공: ${item.name} (ID: ${uniqueId})`);
        } catch (e) {
            console.error(`❌ 업로드 실패: ${item.name}`, e);
        }
    }

    console.log("=========================================");
    console.log(`🎉 모든 데이터(${uploadCount}개) 업로드가 완료되었습니다!`);
    console.log("=========================================");
}

//window.uploadData = uploadData;
//uploadData();