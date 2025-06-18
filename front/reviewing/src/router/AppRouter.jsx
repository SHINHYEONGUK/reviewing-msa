import React, { useContext } from 'react';
import { Route, Routes } from 'react-router-dom';

import Home from '../components/Home';
import MemberCreate from '../components/MemberCreate';
import LoginPage from '../components/LoginPage';
import PrivateRouter from './PrivateRouter';
import ReviewSection from '../components/review-service/ReviewSection';
import RestaurantForm from '../components/restaurant-service/RestaurantForm';
import RestaurantList from '../components/restaurant-service/RestaurantList';
import RestaurantDetail from '../components/restaurant-service/RestaurantDetail';
import RestaurantUpdate from '../components/restaurant-service/RestaurantUpdate';
import MyPage from '../user-service/MyPage';
import BlackList from '../user-service/admin/BlackList';
import Community from '../components/source/Community';
import NoticeEvent from '../components/source/NoticeEvent';
import UsageGuide from '../components/source/UsageGuide';
import ExperienceSearch from '../components/source/ExperienceSearch';
import FindPasswordForm from '../components/FindPasswordForm';
import VerifyCodeForm from '../components/VerifyCodeForm';
import ResetPasswordForm from '../components/ResetPasswordForm';
import KakaoRedirectHandler from '../components/KakaoRedirectHandler';

import AuthContext from '../context/UserContext';

const AppRouter = () => {
  const { userRole } = useContext(AuthContext);

  // 1) env에는 “절대 URL”이 아닌 path만 담아 두세요.
  //    .env → VITE_KAKAO_REDIRECT_URI=/oauth/kakao/callbackd
  const rawUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;

  // 2) 유효하지 않거나 undefined인 경우를 대비한 기본값
  const fallback = '/oauth/kakao/callbackd';

  let KAKAO_REDIRECT_URI_PATH = fallback;

  try {
    // 3) 두 번째 인자로 window.location.origin을 넘겨야 Invalid URL 방지
    const url = new URL(rawUri || fallback, window.location.origin);
    KAKAO_REDIRECT_URI_PATH = url.pathname;
  } catch (e) {
    console.error('Failed to construct URL for Kakao redirect:', rawUri, e);
    // fallback 그대로 사용
  }

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/member/create' element={<MemberCreate />} />
      <Route path='/login' element={<LoginPage />} />

      {/* 4) 수정된 Kakao 리다이렉트 경로 */}
      <Route
        path={KAKAO_REDIRECT_URI_PATH}
        element={<KakaoRedirectHandler />}
      />

      <Route path='/find-password' element={<FindPasswordForm />} />
      <Route path='/verify-code' element={<VerifyCodeForm />} />
      <Route path='/reset-password' element={<ResetPasswordForm />} />

      <Route path='/review' element={<ReviewSection userId={7} />} />
      <Route path='/restaurantForm' element={<RestaurantForm />} />
      <Route path='/restaurant/list' element={<RestaurantList />} />
      <Route path='/restaurantDetail' element={<RestaurantDetail />} />
      <Route path='/restaurantUpdate' element={<RestaurantUpdate />} />

      <Route
        path='/mypage'
        element={<PrivateRouter element={<MyPage />} requiredRole={userRole} />}
      />

      <Route path='/member/list' element={<BlackList />} />
      <Route path='/restaurantDetail/:id' element={<RestaurantDetail />} />
      <Route path='/restaurantUpdate/:id' element={<RestaurantUpdate />} />
      <Route path='/community' element={<Community />} />
      <Route path='/noticeEvent' element={<NoticeEvent />} />
      <Route path='/usageGuide' element={<UsageGuide />} />
      <Route path='/experienceSearch' element={<ExperienceSearch />} />
    </Routes>
  );
};

export default AppRouter;
