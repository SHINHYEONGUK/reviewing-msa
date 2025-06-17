import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  Grid,
  TextField,
  Box,
} from '@mui/material';
import React, { useContext, useState, useEffect } from 'react';
import { replace, useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/UserContext';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_BASE_URL, USER_SERVICE } from '../configs/host-config';
import kakaoImg from '../assets/kakao_login_medium_narrow.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { onLogin } = useContext(AuthContext);

  const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

  const kakaoAuth = async () => {
    const kakaoUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&prompt=login`;

    window.location.href = kakaoUrl;
  };

  const login = async () => {
    const loginData = {
      email,
      password,
    };

    try {
      const res = await axios.post(
        `${API_BASE_URL}${USER_SERVICE}/user/login`,
        loginData,
      );
      console.log('로그인 응답 결과:', res.data);
      alert('로그인 성공!');
      onLogin(res.data.result);
      navigate('/');
    } catch (e) {
      if (e.response?.status === 403) {
        alert('정지된 계정입니다. 관리자에게 문의하세요.');
      } else {
        console.log(e); // 백엔드 데이터: e.response.data
        alert('로그인 실패입니다. 아이디 또는 비밀번호를 확인하세요!');
      }
    }
  };

  return (
    <Grid container justifyContent='center' marginTop={'100px'}>
      <Grid
        sx={{
          border: '2px solid rgba(0, 0, 0, 0.3)',
          borderRadius: 2,
          boxShadow: 1,
        }}
        item
        xs={12}
        sm={6}
        md={4}
      >
        <Card>
          <CardHeader title='로그인' style={{ textAlign: 'center' }} />
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login();
              }}
            >
              <TextField
                label='Email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin='normal'
                required
              />
              <TextField
                label='Password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin='normal'
                required
              />

              <Grid
                container
                spacing={1}
                justifyContent='center'
                alignItems='center'
                sx={{ mt: 2 }}
              >
                {/* 비밀번호 찾기 버튼 */}
                <Grid item xs={4}>
                  {' '}
                  {/* 12칸 중 4칸 할당 (3개 버튼이므로 12/3=4) */}
                  <Button
                    color='secondary'
                    fullWidth // Grid item 내에서 버튼을 꽉 채움
                    onClick={() => navigate('/find-password')}
                    sx={{ height: 40 }} // 높이 통일
                  >
                    비밀번호 찾기
                  </Button>
                </Grid>

                {/* 로그인 버튼 */}
                <Grid item xs={4}>
                  <Button
                    type='submit'
                    color='primary'
                    variant='contained'
                    sx={{ background: 'peru', height: 40 }} // 높이 통일
                    fullWidth // Grid item 내에서 버튼을 꽉 채움
                  >
                    로그인
                  </Button>
                </Grid>

                {/* 카카오 로그인 버튼 (이미지) */}
                <Grid item xs={4}>
                  <Box
                    onClick={kakaoAuth}
                    component='img'
                    src={kakaoImg}
                    alt='카카오 로그인'
                    sx={{
                      height: 40, // 높이 통일
                      width: '100%', // Grid item 내에서 너비를 꽉 채움
                      objectFit: 'contain',
                      cursor: 'pointer',
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
      {/* 비밀번호 변경 모달 부분은 주석 처리된 그대로 둠 */}
    </Grid>
  );
};

export default LoginPage;
