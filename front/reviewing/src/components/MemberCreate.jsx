import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  MenuItem,
  Box,
  Typography,
  Dialog, // Dialog 임포트
  DialogTitle, // DialogTitle 임포트 (모달 제목용)
  DialogContent, // DialogContent 임포트 (모달 내용용)
  DialogActions, // DialogActions 임포트 (모달 버튼용)
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react'; // CardActions는 사용되지 않아 제거
import { replace, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL, USER_SERVICE } from '../configs/host-config';
import AuthContext from '../context/UserContext';
import axios from 'axios';

const MemberCreate = () => {
  const [nickName, setNickName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kakaoId, setKakaoId] = useState(null);
  const [suggestLink, setSuggestLink] = useState(false);
  const [suggestLinkModalOpen, setSuggestLinkModalOpen] = useState(false); // 모달

  const [errors, setErrors] = useState({}); // 모든 에러 메시지를 위한 객체

  // 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailSendLoading, setEmailSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn, onLogin } = useContext(AuthContext);

  // kakao 사용자 정보 가져오기
  const location = useLocation();

  // 카카오 로그인 관련 상태
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isKakaoLogin, setIsKakaoLogin] = useState(false); // 카카오 로그인 여부 플래그

  useEffect(() => {
    if (location.state && location.state.isKakaoLogin) {
      console.log('MemberCreate: 카카오 로그인 정보 수신: ', location.state);

      setNickName(location.state.nickName || '');
      setEmail(location.state.email || '');
      setProfileImageUrl(location.state.profileImageUrl || '');
      setIsKakaoLogin(true);
      setKakaoId(location.state.kakaoId || null); // Long 타입으로 넘어오므로 null 허용

      const isSuggestLinkFromState = location.state.suggestLink || false;
      setSuggestLink(isSuggestLinkFromState);

      if (isSuggestLinkFromState) {
        setSuggestLinkModalOpen(true);
      }

      setIsEmailSent(true);
      setIsEmailVerified(true); // 카카오 로그인은 이메일이 이미 인증된 것으로 간주

      setPassword('');
      setConfirmPassword('');
      setRole('USER');

      setErrors({}); // 에러 메시지 초기화
    } else {
      // 카카오 로그인 정보가 없는 경우 (일반 회원가입으로 진입 시) 초기화
      setIsKakaoLogin(false);
      setKakaoId(null); // Long 타입이므로 null로 초기화
      setSuggestLink(false);
      setProfileImageUrl('');
      setSuggestLinkModalOpen(false);
      setIsEmailSent(false);
      setIsEmailVerified(false);
    }
  }, [location.state]);

  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const sendVerificationEmail = async () => {
    // isKakaoLogin이 true일 때 함 수 미실행;
    if (isKakaoLogin) return;

    console.log('이메일 인증 버튼이 클릭됨!');
    let currentErrors = {};

    // ✅ 이메일 입력값의 앞뒤 공백을 제거한 후 비어있는지 확인 (더 정확한 유효성 검사)
    if (!email.trim()) {
      currentErrors.email = '이메일을 먼저 입력해 주세요!';
    } else {
      const regEmail =
        /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
      if (!regEmail.test(email)) {
        currentErrors.email = '올바른 이메일 형식이 아닙니다.';
      }
    }

    // 현재 유효성 검사에서 에러가 발견되면, 에러를 표시하고 함수 실행 중단
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setEmailSendLoading(true); // 이메일 발송 로딩 상태 시작
    // 이메일 유효성 검사 통과 시 기존의 이메일 관련 에러 메시지 초기화
    setErrors((prev) => ({ ...prev, email: undefined }));

    try {
      const res = await axios.post(
        `${API_BASE_URL}${USER_SERVICE}/email-valid`,
        { email },
      );
      console.log('응답된 결과: ', res.data);

      setIsEmailSent(true); // 인증 코드를 입력할 수 있는 필드를 드러내도록 상태 변경
      alert('인증 코드가 이메일로 발송되었습니다.'); // 사용자에게 발송 성공 알림
    } catch (error) {
      const { status, data } = error.response || {};
      if (status === 400 && data.statusMessage) {
        // 백엔드에서 받은 구체적인 에러 메시지를 이메일 필드 아래에 표시
        setErrors((prev) => ({ ...prev, email: data.statusMessage }));
      } else {
        // 일반적인 통신 오류 메시지 표시
        setErrors((prev) => ({
          ...prev,
          email: '메일 전송 중 오류가 발생했습니다.',
        }));
      }
    } finally {
      setEmailSendLoading(false); // 로딩 상태 종료 (성공/실패 무관)
    }
  };

  // ✅ verifyEmailCode 함수: 오류 메시지를 TextField의 helperText로 표시하도록 통일
  const verifyEmailCode = async () => {
    //  카카오 로그인일경우 함수실행 막음
    if (isKakaoLogin) return;

    let currentErrors = {};

    // 인증 코드가 비어있는지 검사
    if (!verificationCode.trim()) {
      currentErrors.verificationCode = '인증 코드를 입력해 주세요!';
    }

    // 에러가 있으면 화면에 표시하고 함수 실행 중단
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setVerifyLoading(true); // 인증 확인 로딩 상태 시작
    // 인증 코드 유효성 검사 통과 시 기존 인증 코드 관련 에러 메시지 초기화
    setErrors((prev) => ({ ...prev, verificationCode: undefined }));

    try {
      const res = await axios.post(`${API_BASE_URL}${USER_SERVICE}/verify`, {
        email,
        code: verificationCode,
      });

      console.log('응답된 데이터: ', res.data);
      setIsEmailVerified(true); // 이메일 인증 완료 상태로 변경
      alert('이메일 인증이 완료되었습니다!'); // 사용자에게 인증 완료 알림
    } catch (error) {
      console.error('인증 확인 오류: ', error);
      const msg = error.response?.data?.statusMessage;
      let errorMessage = '시스템 문제 발생! 관리자에게 문의하세요!'; // 기본 오류 메시지

      // 백엔드에서 받은 메시지에 따라 구체적인 오류 메시지 설정
      if (msg === 'authCode expired!') {
        errorMessage =
          '인증 시간이 만료되었습니다. 인증 코드부터 다시 발급해 주세요!';
      } else if (msg === 'email blocked!') {
        errorMessage = '인증 횟수가 초과 되었습니다. 30분 뒤 다시 인증하세요';
      } else if (msg && msg.startsWith('wrong')) {
        const remaining = parseInt(msg.split(', ')[1], 10);
        errorMessage = `인증 코드가 올바르지 않습니다! 남은 횟수: ${remaining}`;
      }
      // ✅ 오류 메시지를 TextField의 helperText로 표시
      setErrors((prev) => ({ ...prev, verificationCode: errorMessage }));
    } finally {
      setVerifyLoading(false); // 로딩 상태 종료
    }
  };

  // ✅ memberCreate 함수를 handleSubmit 내부로 통합하므로, 이 함수는 더 이상 필요 없음.
  // 주석 처리 또는 제거합니다.
  /*
  const memberCreate = async (e) => {
    e.preventDefault(); // 이제 handleSubmit에서 전체 폼 제출을 관리하므로 여기서 preventDefault는 불필요

    const registData = {
      nickName,
      email,
      password,
      role,
    };

    const res = await fetch(`${API_BASE_URL}${USER_SERVICE}/users/signup`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(registData),
    });

    const data = await res.json();
    if (data.statusCode === 201) {
      alert(`${data.result}님 환영합니다!`);
      navigate('/');
    } else {
      console.log(data);
      alert(data.statusMessage || '회원가입에 실패했습니다.');
    }
  };
  */

  // 폼 제출 핸들러 (모든 유효성 검사 수행 및 API 호출)
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침) 방지

    setErrors({}); // 폼 제출 시 모든 기존 에러 메시지 초기화
    let newErrors = {}; // 새로운 에러들을 담을 객체
    let isValid = true; // 모든 유효성 검사를 통과했는지 여부

    // 닉네임 유효성 검사
    if (!nickName.trim()) {
      // trim()으로 공백 제거 후 확인
      newErrors.nickName = '닉네임을 입력해주세요.';
      isValid = false;
    }

    // 이메일 유효성 검사 (필수 입력 및 인증 여부 확인)
    if (!email.trim()) {
      // trim()으로 공백 제거 후 확인
      newErrors.email = '이메일을 입력해주세요.';
      isValid = false;
    } else if (!isEmailVerified && isKakaoLogin) {
      newErrors.email = '이메일 인증을 완료해주세요.'; // 이메일 형식이 아니라 '인증 여부'를 확인
      isValid = false;
    }

    // 비밀번호 유효성 검사
    if (!isKakaoLogin) {
      if (!password.trim()) {
        newErrors.password = '비밀번호를 입력해주세요.';
        isValid = false;
      } else if (password.length < 8) {
        newErrors.password = '비밀번호는 최소 8자리 이상이어야 합니다.';
        isValid = false;
      }

      // 비밀번호 확인 유효성 검사
      else if (!confirmPassword.trim()) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        isValid = false;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        isValid = false;
      }
    } else {
      // 카카오 로그인 시나리오에서는 비밀번호 입력 필드가 없으므로,
      // 비밀번호 관련 유효성 검사를 건너뜁니다.
      // 백엔드에서 password가 null일 때의 처리가 필요합니다.
    }

    // 역할 선택 유효성 검사
    if (!role) {
      newErrors.role = '회원 권한을 선택해주세요.';
      isValid = false;
    }

    // 현재까지 수집된 에러들이 하나라도 있으면 화면에 표시하고 함수 실행 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 모든 클라이언트 측 유효성 검사 통과 시 실제 회원가입 API 호출
    if (isValid) {
      let apiEndpoint;
      let requestData;

      if (isKakaoLogin && suggestLink) {
        // ⭐⭐ Case: 카카오 로그인으로 이메일 중복, 연동 제안 받은 경우 (link-kakao API 호출) ⭐⭐
        apiEndpoint = `${API_BASE_URL}${USER_SERVICE}/user/link-kakao`; // 새로운 API
        requestData = {
          email: email,
          kakaoId: kakaoId, // Long 타입으로 전달됨
          nickName: nickName, // 닉네임도 함께 보냄
          profileImage: profileImageUrl, // 프로필 이미지도 함께 보냄
        };
      } else {
        // Case: 신규 회원가입 (NEW_USER_SIGNUP 또는 일반 회원가입)
        apiEndpoint = `${API_BASE_URL}${USER_SERVICE}/users/signup`;
        requestData = {
          nickName,
          email,
          password: isKakaoLogin ? null : password, // 카카오 신규는 null, 일반은 입력된 password
          role,
          profileImage: profileImageUrl, // 카카오 신규 가입 시 프로필 이미지
          kakaoId: isKakaoLogin ? kakaoId : null, // 카카오 신규 가입 시 kakaoId
        };
      }

      console.log('API 요청 데이터:', requestData);
      console.log('API Endpoint:', apiEndpoint);

      try {
        // 연동은 POST 요청
        const res = await axios.post(apiEndpoint, requestData);

        console.log('API 응답:', res.data);

        if (res.data.statusCode === 200) {
          // 연동 성공은 200 OK
          alert(res.data.statusMessage || '계정 연동 및 로그인 성공!');
          // ⭐ 연동 성공 시 백엔드에서 받은 로그인 정보를 활용하여 앱 로그인 처리 ⭐
          if (
            onLogin &&
            res.data.result &&
            res.data.result.token &&
            res.data.result.id
          ) {
            onLogin({
              token: res.data.result.token,
              id: res.data.result.id,
              nickName: res.data.result.nickName,
              role: res.data.result.role,
              profileImage: res.data.result.profileImage,
            });
          }
          navigate('/'); // 메인 페이지로 이동
          return;
        } else if (res.data.statusCode === 201) {
          // 신규 가입 성공은 201 Created
          alert(res.data.statusMessage || '회원가입 성공!');
          navigate('/login', {
            state: { message: '회원가입 완료. 로그인 해주세요!' },
          });
          return;
        } else {
          alert(res.data.statusMessage || '처리 실패했습니다.');
          return;
        }
      } catch (error) {
        console.error(
          'API 통신 오류:',
          error.response ? error.response.data : error,
        );
        alert(
          '처리 실패: ' +
            (error.response?.data?.message ||
              error.response?.data?.statusMessage ||
              error.message),
        );
        // 에러 메시지 필드에 표시
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        }
      }

      ///////////////////////////////////
      const registData = {
        nickName,
        email,
        password,
        role,
      };

      // try {
      //   const res = await fetch(`${API_BASE_URL}${USER_SERVICE}/users/signup`, {
      //     method: 'POST',
      //     headers: {
      //       'Content-type': 'application/json',
      //     },
      //     body: JSON.stringify(registData),
      //   });

      //   // ✅ HTTP 응답이 성공(2xx) 상태인지 먼저 확인
      //   // 백엔드에서 4xx 에러가 발생하면 res.ok는 false가 됨
      //   if (res.ok) {
      //     const data = await res.json();
      //     if (data.statusCode === 201) {
      //       // 백엔드에서 정의한 성공 상태 코드 확인
      //       alert(`${data.result}님 환영합니다!`);
      //       navigate('/'); // 성공 시 메인 페이지로 이동
      //     } else {
      //       // 백엔드에서 정의한 논리적 오류 (예: 중복된 이메일) 처리
      //       alert(data.statusMessage || '회원가입에 실패했습니다.');
      //       // 특정 필드 에러를 백엔드에서 넘겨준다면 setErrors(data) 형태로 처리 가능
      //     }
      //   } else {
      //     // HTTP 에러 상태 (4xx, 5xx) 처리
      //     const errorData = await res.json(); // 에러 응답 본문을 JSON으로 파싱
      //     console.error('회원가입 HTTP 오류:', res.status, errorData);
      //     // 백엔드에서 각 필드별 에러 메시지를 보낼 경우 setErrors(errorData) 사용
      //     // 현재는 statusMessage를 alert으로 띄우는 방식으로 처리
      //     alert(
      //       errorData.statusMessage ||
      //         `회원가입 실패: 서버 오류 (상태코드: ${res.status})`,
      //     );
      //     // 만약 백엔드에서 { nickName: "...", email: "..." } 형태로 에러를 준다면,
      //     // setErrors(errorData)를 사용하여 각 TextField에 에러를 표시할 수 있습니다.
      //   }
      // } catch (error) {
      //   console.error('회원가입 API 통신 오류:', error);
      //   alert('서버와의 통신에 문제가 발생했습니다.');
      // }
    }
  };

  return (
    <Grid container justifyContent='center' marginTop='50px'>
      <Grid item xs={12} sm={10} md={8}>
        <Card
          sx={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '120%',
            padding: 2,
            border: '2px solid rgba(0, 0, 0, 0.3)',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <CardHeader title='회원가입' style={{ textAlign: 'center' }} />
          <CardContent>
            <form onSubmit={handleSubmit}>
              {' '}
              {/* 폼 제출은 handleSubmit이 담당 */}
              <TextField
                label='닉네임'
                value={nickName}
                onChange={(e) => {
                  setNickName(e.target.value);
                  clearError('nickName'); // 입력 시 에러 초기화
                }}
                error={Boolean(errors.nickName)} // errors.nickName이 존재하면 true
                helperText={errors.nickName} // errors.nickName의 값 표시
                fullWidth
                margin='normal'
                readOnly={isKakaoLogin} // 카카오 로그인 시 읽기 전용용
                required
              />
              {/* 이메일 필드와 인증 버튼 */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  label='Email'
                  type='email'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailSent(false); // 이메일 변경 시 인증 상태 초기화
                    setIsEmailVerified(false); // 이메일 변경 시 인증 상태 초기화
                    clearError('email'); // 이메일 필드 에러 초기화
                    clearError('verificationCode'); // 이메일 변경 시 인증 코드 에러도 초기화
                  }}
                  fullWidth
                  margin='normal'
                  required
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  disabled={isEmailVerified || isKakaoLogin} // 이메일 인증 완료 시 수정 불가
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: isEmailVerified ? '#f5f5f5' : 'inherit', // 인증 완료 시 배경색 변경
                    },
                  }}
                />
                <Button
                  variant='outlined'
                  onClick={sendVerificationEmail}
                  sx={{ mb: 1, minWidth: '60px' }}
                  disabled={emailSendLoading || isEmailVerified || isKakaoLogin} // 로딩 중이거나 인증 완료 시 버튼 비활성화
                >
                  {emailSendLoading
                    ? '발송중...'
                    : isEmailVerified
                      ? '인증완료'
                      : '인증'}
                </Button>
              </Box>
              {/* 인증 코드 입력 필드 (이메일 발송 후, 아직 인증 전일 때만 표시) */}
              {isEmailSent &&
                !isEmailVerified &&
                !isKakaoLogin && ( // <-- 모든 조건이 &&로 연결되고
                // <-- 소괄호로 렌더링할 JSX를 묶어줍니다.
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      label='인증 코드'
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        clearError('verificationCode');
                      }}
                      fullWidth
                      margin='normal'
                      placeholder='이메일로 받은 인증 코드를 입력하세요'
                      error={Boolean(errors.verificationCode)}
                      helperText={errors.verificationCode}
                    />
                    <Button
                      variant='outlined'
                      onClick={verifyEmailCode}
                      disabled={!verificationCode.trim() || verifyLoading}
                      sx={{ mb: 1, minWidth: '60px' }}
                    >
                      {verifyLoading ? '확인중...' : '확인'}
                    </Button>
                  </Box>
                )}{' '}
              {/* <-- 렌더링할 JSX를 묶는 소괄호 닫기 */}
              <TextField
                label='비밀번호'
                type='password'
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError('password'); // 입력 시 에러 초기화
                  clearError('confirmPassword'); // 비밀번호 변경 시 확인 필드 에러도 초기화
                }}
                error={Boolean(errors.password)}
                helperText={errors.password}
                fullWidth
                margin='normal'
                required
                inputProps={{ minLength: 8 }} // 최소 길이 8자리
              />
              <TextField
                label='비밀번호 확인'
                type='password'
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError('confirmPassword'); // 입력 시 에러 초기화
                }}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                fullWidth
                margin='normal'
                required
                inputProps={{ minLength: 8 }} // 최소 길이 8자리
              />
              <TextField
                label='회원 권한'
                select // select 속성으로 드롭다운 메뉴 활성화
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  clearError('role'); // 입력 시 에러 초기화
                }}
                error={Boolean(errors.role)}
                helperText={errors.role}
                fullWidth
                margin='normal'
                required
              >
                <MenuItem value=''>선택하세요</MenuItem>
                <MenuItem value='USER'>리뷰 작성자</MenuItem>
                <MenuItem value='OWNER'>사업자</MenuItem>
              </TextField>
              <Button
                type='submit' // 폼 제출을 트리거하는 버튼
                color='primary'
                variant='contained'
                fullWidth
                sx={{ background: 'peru' }}
                // disabled={!isEmailVerified} // 이메일 인증 완료 후 회원가입 버튼 활성화 여부는 필요에 따라 결정
              >
                등록
              </Button>
            </form>
          </CardContent>
        </Card>
      </Grid>
      {/* 연동 제안 모달 추가  */}
      <Dialog
        open={suggestLinkModalOpen}
        onClose={() => setSuggestLinkModalOpen(false)}
      >
        <DialogTitle>알림</DialogTitle>
        <DialogContent>
          <Typography variant='body1'>
            이 이메일로 이미 가입된 계정이 있습니다.
            <br />
            회원가입을 완료하시면 기존 계정에 카카오 계정이 연동됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSuggestLinkModalOpen(false); // 모달 닫기
              // 폼 제출을 트리거하는 가장 쉬운 방법: 폼을 직접 제출
              // 그러나 React에서는 handleSubmit 함수를 직접 호출하는 것이 더 일반적
              handleSubmit(new Event('submit')); // 가상의 이벤트 객체 전달
            }}
            color='primary'
            variant='contained'
          >
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default MemberCreate;
