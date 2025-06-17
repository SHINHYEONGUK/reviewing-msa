// src/components/KakaoRedirectHandler.js
import React, { useEffect, useRef, useContext } from 'react'; // useRef 추가
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, USER_SERVICE } from '../configs/host-config';
import AuthContext from '../context/UserContext';

const KakaoRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { onLogin } = useContext(AuthContext);

  // useRef를 사용하여 useEffect가 처음 한 번만 실행되도록 제어
  // 이 플래그는 리렌더링 되어도 값을 유지합니다.
  const hasFetched = useRef(false);

  useEffect(() => {
    // 개발 모드에서 StrictMode 때문에 useEffect가 두 번 실행되는 것을 방지
    // hasFetched.current가 true이면 이미 요청을 보냈다는 의미이므로 더 이상 실행하지 않음
    if (hasFetched.current) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      hasFetched.current = true; // 요청을 시작했음을 표시

      console.log('카카오 인증 코드 발견:', code);
      axios
        .get(`${API_BASE_URL}${USER_SERVICE}/oauth/kakao`, {
          params: {
            code: code,
          },
        })
        .then((response) => {
          const data = response.data;
          console.log('백엔드 카카오 로그인 처리 결과 (응답 데이터):', data);

          const {
            status,
            message,
            nickName,
            email,
            profileImageUrl,
            kakaoId,
            token,
            userInfo,
          } = data;

          switch (status) {
            case 'LOGIN_SUCCESS':
              console.log('기존 카카오 계정 로그인 성공:', message);
              if (onLogin && token && userInfo) {
                onLogin({
                  token: token,
                  id: userInfo.id,
                  nickName: userInfo.nickName,
                  role: userInfo.role,
                  profileImage: userInfo.profileImage,
                });
              }
              console.log('userInfo.token: ' + token);
              console.log('userInfo.id: ' + userInfo.id);
              navigate('/', { replace: true }); // 로그인 성공 후 history에 남기지 않기 위해 replace: true 사용
              break;

            case 'EMAIL_EXISTS_SUGGEST_LINK':
              console.log('이메일 존재, 연동 제안:', message);
              navigate('/member/create', {
                state: {
                  nickName: nickName,
                  email: email,
                  profileImageUrl: profileImageUrl,
                  kakaoId: kakaoId,
                  isKakaoLogin: true,
                  suggestLink: true,
                },
                replace: true, // 뒤로가기 시 이 페이지로 다시 오지 않도록
              });
              break;

            case 'NEW_USER_SIGNUP':
              console.log('신규 사용자: 회원가입 폼으로 이동');
              navigate('/member/create', {
                state: {
                  nickName: nickName,
                  email: email,
                  profileImageUrl: profileImageUrl,
                  kakaoId: kakaoId,
                  isKakaoLogin: true,
                },
                replace: true, // 뒤로가기 시 이 페이지로 다시 오지 않도록
              });
              break;

            default:
              console.error('알 수 없는 카카오 로그인 상태:', status, message);
              navigate('/login', {
                state: { error: message || '알 수 없는 로그인 오류.' },
                replace: true,
              });
              break;
          }
        })
        .catch((error) => {
          console.error(
            '카카오 로그인 처리 중 오류 발생 (Axios Catch): ',
            error,
          );
          if (error.response) {
            console.error('응답 상태 코드:', error.response.status);
            console.error('응답 데이터:', error.response.data);
          } else if (error.request) {
            console.error('요청:', error.request);
          } else {
            console.error('Error:', error.message);
          }

          navigate('/login', {
            state: { error: '카카오 로그인 처리 중 서버 오류가 발생했습니다.' },
            replace: true,
          });
        });
    } else {
      console.error('카카오 인증 코드가 없습니다.');
      navigate('/login', {
        state: { error: '카카오 인증 코드가 유효하지 않습니다.' },
        replace: true,
      });
    }
  }, [location, navigate, onLogin]); // 의존성 배열 유지

  return (
    <div>
      <p>카카오 로그인 처리 중입니다. 잠시만 기다려 주세요...</p>
      {/* 로딩 스피너 등을 여기에 추가할 수 있습니다 */}
    </div>
  );
};

export default KakaoRedirectHandler;
