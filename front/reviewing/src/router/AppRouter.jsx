import React, { useContext } from 'react';
import Home from '../components/Home';
import MemberCreate from '../components/MemberCreate';
import LoginPage from '../components/LoginPage';
import { Route, Routes } from 'react-router-dom';
import PrivateRouter from './PrivateRouter';
import ReviewCard from '../components/review-service/ReviewCard';
import ReviewSection from '../components/review-service/ReviewSection';
import RestaurantForm from '../components/restaurant-service/RestaurantForm';
import RestaurantDetail from '../components/restaurant-service/RestaurantDetail';
import RestaurantUpdate from '../components/restaurant-service/RestaurantUpdate';
import RestaurantList from '../components/restaurant-service/RestaurantList';
import MyPage from '../user-service/MyPage';
import AuthContext from '../context/UserContext';
import Community from '../components/source/Community';
import NoticeEvent from '../components/source/NoticeEvent';
import UsageGuide from '../components/source/UsageGuide';
import ExperienceSearch from '../components/source/ExperienceSearch';
import BlackList from '../user-service/admin/BlackList';
import KakaoRedirectHandler from '../components/KakaoRedirectHandler';
import FindPasswordForm from '../components/FindPasswordForm';
import VerifyCodeForm from '../components/VerifyCodeForm';
import ResetPasswordForm from '../components/ResetPasswordForm';

const AppRouter = () => {
  const { userRole } = useContext(AuthContext); // private 라우터를 이용하기 위해 추가(하준)
  const KAKAO_REDIRECT_URI_PATH = new URL(
    import.meta.env.VITE_KAKAO_REDIRECT_URI,
  ).pathname;

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/member/create' element={<MemberCreate />} />
      <Route path='/login' element={<LoginPage />} />
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
      <Route path='/coummunity' element={<Community />} />
      <Route path='/noticeEvent' element={<NoticeEvent />} />
      <Route path='/usageGuide' element={<UsageGuide />} />
      <Route path='/experienceSearch' element={<ExperienceSearch />} />
      {/* <Route path='/mypage' element={<PrivateRouter element={<MyPage />} />} /> */}
    </Routes>
  );
};

export default AppRouter;
