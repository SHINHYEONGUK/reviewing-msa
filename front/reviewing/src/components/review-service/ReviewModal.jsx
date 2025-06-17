import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from './modal.module.scss';
import StarSvg from './StarSvg';
import AuthContext from '../../context/UserContext';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../configs/axios-config';
import { API_BASE_URL, REVIEW_SERVICE } from '../../configs/host-config';
import { handleAxiosError } from '../../configs/HandleAxiosError';

const ReviewModal = ({
  handleCancelBtnClick,
  onReviewSubmitted,
  isModify = false,
  modifyingInfo = {},
  restaurantName,
}) => {
  const [reviewImages, setReviewImages] = useState([]);
  const [thumbnailImages, setThumbnailImages] = useState([]);
  const [thumbnailImagesTemp, setThumbnailImagesTemp] = useState(
    modifyingInfo.images ? modifyingInfo.images : [],
  );
  const [deletedImage, setDeletedImage] = useState([]);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const effectiveRating = hoverRating > rating ? hoverRating : rating;

  const $fileTag = useRef();
  const location = useLocation();
  const { onLogout, userName } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [previewUrl, setPreviewUrl] = useState('');
  const { userId } = useContext(AuthContext);

  // 쿼리스트링 파싱
  const queryParams = new URLSearchParams(location.search);
  const restaurantId = queryParams.get('restaurantId');

  useEffect(() => {
    comeProfile();
    if (isModify && modifyingInfo) {
      setReviewContent(modifyingInfo.content);
      setRating(modifyingInfo.rating);
      handleThumbnailPreview();
    }
  }, []);
  useEffect(() => {
    // reviewImages가 바뀔 때마다 프리뷰를 생성
    if (!reviewImages.length) {
      setThumbnailImages((prev) => [...prev]);
      return;
    }
    const files = reviewImages;
    const thumbnailPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(thumbnailPromises).then((thumbnails) => {
      setThumbnailImages((prev) => [...thumbnails, ...thumbnailImagesTemp]);
    });
  }, [reviewImages]);

  const handlePostBtnClick = (e) => {
    if (!isModify) {
      postReview(e);
    } else {
      modifyReview(e);
    }
  };

  const comeProfile = async () => {
    const res = await axiosInstance.get(
      `${API_BASE_URL}/user-service/user/profileImage/${userId}`,
    );
    setPreviewUrl(res.data.result.profileImage);
  };

  const postReview = async (e) => {
    const reviewBody = new FormData();
    reviewBody.append('userId', localStorage.getItem('USER_ID'));
    reviewBody.append('restaurantId', id);
    reviewBody.append('rating', rating);
    reviewBody.append('content', reviewContent);
    const files = reviewImages;
    for (let i = 0; i < files.length; i++) {
      reviewBody.append('images', files[i]);
    }

    try {
      await axiosInstance.post(
        `${API_BASE_URL}${REVIEW_SERVICE}/review`,
        reviewBody,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      alert('리뷰 등록 완료!');
      handleCancelBtnClick();
      onReviewSubmitted();
    } catch (e) {
      handleAxiosError(e, onLogout, navigate);
    }
  };

  const modifyReview = async (e) => {
    const reviewBody = new FormData();
    reviewBody.append('id', modifyingInfo.id);
    reviewBody.append('userId', localStorage.getItem('USER_ID'));
    reviewBody.append('restaurantId', 1);
    reviewBody.append('rating', rating);
    reviewBody.append('content', reviewContent);
    const files = reviewImages;
    for (let i = 0; i < files.length; i++) {
      reviewBody.append('images', files[i]);
    }
    for (let img of deletedImage) {
      reviewBody.append('deletedImageUrls', img);
    }
    try {
      await axiosInstance.patch(
        `${API_BASE_URL}${REVIEW_SERVICE}/review`,
        reviewBody,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      alert('리뷰 수정 완료!');
      handleCancelBtnClick();
      onReviewSubmitted();
    } catch (e) {
      handleAxiosError(e, onLogout, navigate);
    }
  };

  const updateFiles = () => {
    const files = $fileTag.current.files;
    const newFiles = Array.from(files);
    setReviewImages((prev) => {
      const updated = [...prev, ...newFiles];
      // 썸네일은 비동기이므로 setState 이후 반영
      setTimeout(() => handleThumbnailPreview(), 0);
      return updated;
    });
  };

  const handleThumbnailPreview = () => {
    const thumbnails = [...thumbnailImages, ...thumbnailImagesTemp]; // 기존 URL 유지
    const newFiles = reviewImages.slice(thumbnails.length); // 새로 추가된 파일만 처리

    const newThumbnails = newFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newThumbnails).then((results) => {
      setThumbnailImages([...thumbnails, ...results]);
    });
  };

  const handleDeleteImage = (url) => {
    setDeletedImage((prev) => [...prev, url]);
    const idx = thumbnailImages.indexOf(url); // 첫 번째로 일치하는 위치(없으면 -1)
    if (idx !== -1) thumbnailImages.splice(idx, 1); // 해당 인덱스부터 1개 삭제
  };
  const handleStarClick = (value) => {
    console.log('클릭됨', value);
    setRating(value);
  };
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.entireWrap}>
        <div className={styles.restaurantNameWrap}>
          <span>{restaurantName}</span>
        </div>
        <div className={styles.reviewWrap}>
          <div className={styles.profileWrap}>
            <div className={styles.profileImageWrap}>
              <img src={previewUrl} />
            </div>
            <div className={styles.profileNameWrap}>
              <span>{userName}</span>
            </div>
          </div>
          <div className={styles.ratingWrap}>
            {[1, 2, 3, 4, 5].map((value) => (
              <StarSvg
                key={value}
                isGold={value <= effectiveRating}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                handleClick={() => handleStarClick(value)}
              />
            ))}
          </div>
          <div className={styles.contentWrap}>
            <textarea
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder='이곳에 다녀온 경험을 자세히 공유해 주세요.'
              value={reviewContent}
            ></textarea>
          </div>
          <div className={styles.imageAddWrap}>
            <input
              type='file'
              onChange={updateFiles}
              ref={$fileTag}
              accept='image/*'
              multiple
              className={styles.fileInput}
            />
          </div>
          <div className={styles.imagesWrap}>
            {thumbnailImages &&
              thumbnailImages.map((value, index) => {
                return (
                  <>
                    <button
                      type='button'
                      onClick={() => handleDeleteImage(value)}
                      className={styles.deleteBtn}
                    >
                      <span>X</span>
                    </button>
                    <img src={value} style={{ width: '70px' }} />
                  </>
                );
              })}
          </div>
        </div>
        <div className={styles.buttonsWrap}>
          <button type='button' onClick={handleCancelBtnClick}>
            취소
          </button>
          <button type='button' onClick={handlePostBtnClick}>
            게시
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
