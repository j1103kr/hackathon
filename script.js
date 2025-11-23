// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기
// -----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, increment, onSnapshot, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initialData } from './data.js'; 

// -----------------------------------------------------------
// 2. Firebase 설정 
// -----------------------------------------------------------
// ⭐ Firebase ID는 현재 "hackathon-40673"로 설정되어 있습니다.
const firebaseConfig = {
  apiKey: "AIzaSyD07_-y8JQJUorLcbkr4Cp7Xw2_w0dlzeY",
  authDomain: "hackathon-40673.firebaseapp.com",
  projectId: "hackathon-40673",
  storageBucket: "hackathon-40673.firebasestorage.app",
  messagingSenderId: "1004330982884",
  appId: "1:1004330982884:web:d974018e61680e7971bbf1",
  measurementId: "G-FHJ3CY1783"
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
        all: "전체", food: "🍜 맛집", view: "🏰 관광", culture: "🏛️ 유적", station: "🚇 교통", // ⭐ 교통 탭 추가

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
        alert_already_reviewed: "이미 이 장소에 리뷰를 작성하셨습니다!"
    },
    ja: {
        placeholder: "どこへ行きますか？",
        all: "すべて", food: "🍜 グルメ", view: "🏰 観光", culture: "🏛️ 遺跡", station: "🚇 交通", // ⭐ 교통 탭 추가

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
        alert_already_reviewed: "すでにこの場所のレビューを作成しました！"
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

// script.js (3. 지도 및 기본 설정 섹션)

// script.js (3. 지도 및 기본 설정 섹션)

var markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,      // 마커를 묶는 최대 반경 (50px)
    disableClusteringAtZoom: 13, // 클러스터링 해제 Zoom Level (13)
    
    // ⭐ [핵심 수정] 클러스터 아이콘 생성 함수 정의
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

        // 2. ⭐ 요청하신 개수에 따른 색상 클래스 적용
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

// ⭐ 실시간 데이터 리스너: Firebase에서 데이터가 변경되면 자동으로 갱신됩니다.
onSnapshot(placesCol, (snapshot) => {
    try {
        locations = []; 
        snapshot.forEach((doc) => {
            locations.push({ id: doc.id, ...doc.data() });
        });
        
        // 데이터 로드 후 현재 필터 상태에 맞춰 갱신
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
        filterCategory(currentCategory);
        
        // 데이터 로드 완료 후 탭 이벤트를 다시 연결합니다.
        // (이 로직은 보통 HTML 로드 후 한 번만 실행하는 것이 좋지만, onSnapshot 내부에서도 작동합니다.)
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                filterCategory(button.dataset.category);
            });
        });
        
    } catch (e) {
        // 이 에러가 보인다면 보안 규칙이나 연결 설정을 다시 확인해야 합니다.
        console.error("Firebase 실시간 데이터 로드 중 오류 발생:", e);
        // alert("Firebase 데이터 로드 중 오류가 발생했습니다. (보안 규칙 문제일 가능성 높음)");
    }
});

window.toggleLike = async function(docId) {
    // 1. 클릭하자마자 '현재 보고 있는 장소'로 설정
    selectedPlaceId = docId; 

    const docRef = doc(db, "places", docId);
    
    // 2. 내 컴퓨터 목록 가져오기
    let myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];
    const isLiked = myLikes.includes(docId);

    if (isLiked) {
        // 이미 눌렀으니 취소 (목록에서 제거)
        myLikes = myLikes.filter(id => id !== docId);
    } else {
        // 안 눌렀으니 추가 (목록에 추가)
        myLikes.push(docId);
    }
    // 저장!
    localStorage.setItem('myLikedPlaces', JSON.stringify(myLikes));

    // 3. 이제 서버에 숫자 변경 요청 (비동기)
    try {
        if (isLiked) {
            await updateDoc(docRef, { likes: increment(-1) }); // -1
        } else {
            await updateDoc(docRef, { likes: increment(1) });  // +1
        }
    } catch (e) {
        console.error("좋아요 실패:", e);
        alert("오류가 발생했습니다.");
    }
}

// -----------------------------------------------------------
// 4.1. 카테고리별 커스텀 마커 아이콘 설정
// -----------------------------------------------------------
const categoryIcons = {
    food: { icon: 'fa-utensils', color: '#e67e22' },   // 주황색
    view: { icon: 'fa-mountain', color: '#3498db' },   // 파란색
    culture: { icon: 'fa-archway', color: '#9b59b6' }, // 보라색
    station: { icon: 'fa-subway', color: '#2c3e50' }   // 진한 회색
};

/**
 * 카테고리에 맞는 Font Awesome 아이콘을 가진 커스텀 마커 아이콘을 생성합니다.
 */
function getCustomIcon(category) {
    const iconData = categoryIcons[category] || { icon: 'fa-map-pin', color: '#7f8c8d' };
    
    // custom-marker 클래스는 CSS에서 정의된 핀 모양 디자인을 적용합니다.
    const htmlContent = `<div class="custom-marker" style="background-color: ${iconData.color};">
                             <i class="fas ${iconData.icon}"></i>
                         </div>`;

    return L.divIcon({
        className: 'custom-marker-wrapper', // CSS에서 Leaflet 기본 스타일을 덮어쓰기 위한 래퍼
        html: htmlContent,
        iconSize: [30, 42],     // 마커의 크기 (CSS와 일치)
        iconAnchor: [15, 42]    // 핀의 뾰족한 끝이 정확한 좌표를 가리키도록 설정
    });
}

function updateMapMarkers(targetLocations) {
    markerCluster.clearLayers(); 
    const t = translations[currentLang]; 
    
    // 1. 내 컴퓨터의 '좋아요 목록'을 꺼내옴 (방금 업데이트된 따끈한 정보)
    const myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];

    // ⭐ 현재 필터링된 목록에서 "station" 카테고리가 포함되어 있는지 확인
    const isStationCategory = targetLocations.some(loc => loc.category === 'station'); 

    targetLocations.forEach(loc => {
        // ⭐ [수정] 카테고리에 맞는 커스텀 아이콘 생성 및 적용
        const customIcon = getCustomIcon(loc.category);
        var marker = L.marker([loc.lat, loc.lng], {
            icon: customIcon // 커스텀 아이콘 적용
        });
        // ⭐ [수정 끝]
        
        let displayName = loc.name;
        if (currentLang === 'ja' && loc.name_ja) {
            displayName = loc.name_ja;
        }

        // 2. 내 목록에 있으면 빨강, 없으면 회색
        const isLiked = myLikes.includes(loc.id);
        const heartColor = isLiked ? "#ff4757" : "#ccc"; 
        const heartIcon = isLiked ? "fas" : "far"; 

        // ⭐⭐⭐ [요청 반영] 교통 카테고리일 때 팝업 내용 간소화 ⭐⭐⭐
        let popupContent = '';
        if (loc.category === 'station' && isStationCategory) {
            popupContent = `
                <div class="popup-content" style="min-width: 180px; display: flex; flex-direction: column; gap: 8px;">
                    <span class="popup-title" style="margin-bottom: 5px; font-size: 16px; color:#0056b3;">
                        <i class="fas fa-train" style="margin-right: 5px;"></i>${displayName}
                    </span>
                    
                    <button class="weather-btn" style="width: 100%; display: flex; justify: center; align-items: center;" 
                            onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                        <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                    </button>

                    <button class="weather-btn" style="width: 100%; background: white; border: 1px solid #ddd; color: #333; display: flex; justify: center; align-items: center; margin:0;" 
                            onclick="toggleLike('${loc.id}')">
                        <i class="${heartIcon} fa-heart" style="color: ${heartColor}; margin-right: 5px;"></i>
                        <span style="font-weight:bold; color:${heartColor};">${loc.likes || 0}</span>
                        <span style="font-size:11px; color:#888; margin-left:5px;">${t.popup_like}</span>
                    </button>
                </div>
            `;
        } else {
            // ⭐ 일반적인 관광지 팝업 내용 (기존 내용)
            popupContent = `
                <div class="popup-content" style="min-width: 220px; display: flex; flex-direction: column; gap: 8px;">
                    <span class="popup-title" style="margin-bottom: 5px; font-size: 15px;">${displayName}</span>
                    
                    <button class="weather-btn" style="width: 100%; display: flex; justify: center; align-items: center;" 
                            onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                        <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                    </button>
                    
                    <div style="display:flex; gap:6px; width: 100%;">
                        <button class="weather-btn" style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); flex:1; display: flex; justify: center; align-items: center; margin:0; padding: 8px 0;" 
                                onclick="openReviewModal('${loc.id}', '${displayName}')">
                            <i class="fas fa-pen"></i> ${t.review_write}
                        </button>
                        <button class="weather-btn" style="background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%); flex:1; display: flex; justify: center; align-items: center; margin:0; padding: 8px 0;" 
                                onclick="openReadReviewModal('${loc.id}')">
                            <i class="fas fa-book"></i> ${t.review_read}
                        </button>
                    </div>
                    
                    <button class="weather-btn" style="width: 100%; background: white; border: 1px solid #ddd; color: #333; display: flex; justify: center; align-items: center; margin:0;" 
                            onclick="toggleLike('${loc.id}')">
                        <i class="${heartIcon} fa-heart" style="color: ${heartColor}; margin-right: 5px;"></i>
                        <span style="font-weight:bold; color:${heartColor};">${loc.likes || 0}</span>
                        <span style="font-size:11px; color:#888; margin-left:5px;">${t.popup_like}</span>
                    </button>
                </div>
            `;
        }

        marker.bindPopup(popupContent);
        
        marker.on('click', () => { 
            selectedPlaceId = loc.id; 
            //map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 }); // 확대/축소 기능 제거 (기존 상태 유지)
        });
        
        marker.on('popupclose', () => {
            setTimeout(() => {
                if (selectedPlaceId === loc.id) {
                    // 닫힘 처리
                }
            }, 100);
        });

        markerCluster.addLayer(marker);

        if (selectedPlaceId === loc.id) {
            setTimeout(() => { marker.openPopup(); }, 100);
        }
    });
}

// [카테고리 필터]
window.filterCategory = function(category) {
    let filtered;
    
    // ⭐ [핵심 수정] 'all' 탭을 눌렀을 때 'station' 카테고리만 제외하고 필터링합니다.
    if (category === 'all') {
        filtered = locations.filter(loc => loc.category !== 'station'); 
    } else {
        // 'food', 'view', 'culture', 'station' 등 특정 탭을 누른 경우
        filtered = locations.filter(loc => loc.category === category);
    }
    
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
    // 언어 변경
    currentLang = currentLang === 'ko' ? 'ja' : 'ko';
    
    // ⭐ [디자인 변경 로직 추가]
    if (currentLang === 'ko') {
        document.getElementById('lang-ko').classList.add('active');
        document.getElementById('lang-ja').classList.remove('active');
    } else {
        document.getElementById('lang-ko').classList.remove('active');
        document.getElementById('lang-ja').classList.add('active');
    }
    const t = translations[currentLang];
    
    // 기존 텍스트 변경
    document.getElementById('search-input').placeholder = t.placeholder;
    document.getElementById('btn-all').innerText = t.all;
    document.getElementById('btn-food').innerText = t.food;
    document.getElementById('btn-view').innerText = t.view;
    document.getElementById('btn-culture').innerText = t.culture;
    document.getElementById('btn-station').innerText = t.station;
    document.getElementById('exchange-title').innerText = t.exchangeTitle;
    document.getElementById('city-name').innerText = t.cityNeed; 
    document.querySelector('.weather-desc').innerText = t.weatherDesc;
    document.getElementById('modal-write-title').innerText = t.modal_write_title;
    document.getElementById('modal-read-title').innerText = t.modal_read_title;
    document.getElementById('review-text').placeholder = t.placeholder_review;
    document.getElementById('btn-submit').innerText = t.btn_submit;
    const currentScore = document.getElementById('review-rating').value;
    document.getElementById('rating-value').innerText = currentScore + t.score_unit;
    
    fetchExchangeRate(); 

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

    const t = translations[currentLang]; 
    document.getElementById('rating-value').innerText = score + t.score_unit;
    
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach((star, index) => {
        if (index < score) star.style.opacity = '1';
        else star.style.opacity = '0.3';
    });
}

// [수정] 리뷰 저장 함수 (1인 1리뷰 제한 기능 추가)
window.submitReview = async function() {
    const text = document.getElementById('review-text').value;
    const rating = document.getElementById('review-rating').value;
    
    // 현재 언어 설정
    const t = translations[currentLang];

    // 1. 내용 비었는지 확인
    if (!text) { 
        alert(t.alert_input_empty); 
        return; 
    }

    // ⭐ 2. 이미 썼는지 확인 (내 컴퓨터 기록 조회)
    let myReviews = JSON.parse(localStorage.getItem('myReviewedPlaces')) || [];

    if (myReviews.includes(currentReviewPlaceId)) {
        alert(t.alert_already_reviewed); // "이미 작성했습니다!"
        return; // 함수 강제 종료 (저장 안 함)
    }

    try {
        // 3. Firebase에 저장
        await addDoc(collection(db, "reviews"), {
            placeId: currentReviewPlaceId,
            text: text,
            rating: parseInt(rating),
            createdAt: new Date().toISOString() 
        });

        // 4. 성공했으면 내 컴퓨터에 "나 여기 썼음!" 하고 기록장(localStorage)에 추가
        myReviews.push(currentReviewPlaceId);
        localStorage.setItem('myReviewedPlaces', JSON.stringify(myReviews));

        alert(t.alert_success);
        closeReviewModal();
    } catch (e) {
        console.error("리뷰 저장 실패:", e);
        alert("Error.");
    }
}

window.openReadReviewModal = async function(placeId) {
    const container = document.getElementById('review-list-container');
    const modal = document.getElementById('read-review-modal');
    const t = translations[currentLang]; 
    
    modal.style.display = 'flex';
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">${t.msg_loading}</div>`;

    try {
        const q = query(
            collection(db, "reviews"), 
            where("placeId", "==", placeId),
            orderBy("createdAt", "desc") 
        );
        
        const querySnapshot = await getDocs(q);
        let html = "";
        
        if (querySnapshot.empty) {
            html = `<div style="text-align:center; padding:40px; color:#999; line-height:1.6;">${t.no_reviews}</div>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const stars = "⭐".repeat(data.rating);
                
                // 날짜 변환
                let dateStr = data.createdAt;
                const dateObj = new Date(data.createdAt);
                if (!isNaN(dateObj.getTime())) { 
                    if (currentLang === 'ko') dateStr = dateObj.toLocaleString('ko-KR');
                    else dateStr = dateObj.toLocaleString('ja-JP');
                }

                // 텍스트에 따옴표가 있으면 오류나니까 안전하게 처리
                const safeText = data.text.replace(/"/g, '&quot;').replace(/'/g, "&#39;");
                const btnText = currentLang === 'ko' ? "🤖 번역" : "🤖 翻訳";

                html += `
                    <div class="review-item">
                        <div class="review-header">
                            <span class="review-stars">${stars}</span>
                            <span style="color:#aaa; font-size:11px;">${dateStr}</span> 
                        </div>
                        <div class="review-text" id="review-text-${doc.id}" style="margin-bottom: 5px;">${data.text}</div>
                        
                        <div id="trans-result-${doc.id}" style="font-size:13px; color:#4facfe; margin-bottom:5px; display:none;"></div>

                        <button onclick="translateReview('${doc.id}', '${safeText}')" 
                        style="font-size:11px; background:none; border:1px solid #ccc; border-radius:12px; padding:2px 8px; cursor:pointer; color:#555;">
                        ${btnText}
                        </button>
                    </div>
                `;
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        if(e.message.includes("index")) alert("Firebase 콘솔에서 색인(Index)을 생성해야 합니다.");
        container.innerHTML = "Error.";
    }
}

window.closeReadReviewModal = function() {
    document.getElementById('read-review-modal').style.display = 'none';
}

// ==========================================
// MyMemory 무료 번역 API 함수
// ==========================================
window.translateReview = async function(docId, text) {
    const resultBox = document.getElementById(`trans-result-${docId}`);
    
    if (resultBox.style.display === 'block') {
        resultBox.style.display = 'none';
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerText = "Translating... ⌛";

    try {
        const targetLang = currentLang; 

        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${targetLang}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const translatedText = data.responseData.translatedText;

        // 1. API가 "야, 원문이랑 도착 언어가 똑같잖아!" 라고 에러를 보낸 경우
        if (translatedText.includes("PLEASE SELECT TWO DISTINCT LANGUAGES") || 
            translatedText.includes("IS INVALID")) {
            
            resultBox.innerText = "ℹ️ " + (currentLang === 'ko' ? "이미 한국어입니다." : "すでに日本語です。");
            
        } 
        // 2. 번역된 결과가 원문이랑 토씨 하나 안 틀리고 똑같은 경우 (혹시 몰라서 확인)
        else if (translatedText.trim() === text.trim()) {
            
            resultBox.innerText = "ℹ️ " + (currentLang === 'ko' ? "이미 한국어입니다." : "すでに日本語です。");
            
        } 
        // 3. 정상 번역
        else {
            resultBox.innerText = "✅ " + translatedText;
        }

    } catch (e) {
        console.error("번역 에러:", e);
        resultBox.innerText = "Network Error";
    }
}

// -----------------------------------------------------------
// 8. 데이터 업로드 (필요할 때만 주석 풀기)
// -----------------------------------------------------------
async function uploadData() {
    // 확인 팝업의 텍스트를 "덮어쓰기"로 명확히 수정
    if (!confirm("데이터를 업로드하시겠습니까? (기존 데이터는 덮어쓰여집니다)")) return;
    
    console.log(`총 ${initialData.length}개 업로드 시작...`);
    
    let uploadCount = 0;
    
    for (const item of initialData) {
        // 1. 장소 이름을 기반으로 고유 ID 생성 (특수문자 및 공백 제거)
        // 이 고유 ID가 Firebase 문서 ID로 사용됩니다.
        const uniqueId = item.name.replace(/[^a-zA-Z0-9가-힣]/g, ''); 
        
        try {
            // 2. addDoc 대신 setDoc 사용: 중복 방지
            await setDoc(doc(db, "places", uniqueId), item);
            uploadCount++;
        } catch (e) { 
            console.error("데이터 업로드 중 오류 발생:", item.name, e); 
        }
    }
    
    console.log(`✅ 총 ${uploadCount}개의 데이터 업로드 완료.`);
    alert(`데이터 업로드 완료! 총 ${uploadCount}개 항목이 덮어쓰여졌습니다.`);
}

//uploadData(); // ⭐ 최종 사용 시점에는 반드시 다시 주석 처리합니다.