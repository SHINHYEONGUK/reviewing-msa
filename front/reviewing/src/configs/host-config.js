// src/config/host-config.js

// 현재 페이지의 프로토콜("http:" 또는 "https:")과 호스트 이름 가져오기
const { protocol, hostname } = window.location;

let backendHostName;

// 1) 로컬 개발 환경
if (hostname === 'localhost') {
  backendHostName = 'http://3.38.247.144:8000';
}
// 3) 실제 운영 도메인: gukshin.store
else if (hostname === 'gukshin.store') {
  // 페이지가 HTTPS라면 HTTPS API, 아니면 HTTP API
  backendHostName =
    protocol === 'https:'
      ? 'https://3.38.247.144:8000'
      : 'http://3.38.247.144:8000';

  // 4) 그 외 환경
} else {
  backendHostName =
    protocol === 'https:'
      ? 'https://3.38.247.144:8000'
      : 'http://3.38.247.144:8000';
}

export const API_BASE_URL = backendHostName;
export const USER_SERVICE = '/user-service';
export const RESTAURANT_SERVICE = '/restaurant-service';
export const REVIEW_SERVICE = '/review-service';
export const POINT_SERVICE = '/point-service';
