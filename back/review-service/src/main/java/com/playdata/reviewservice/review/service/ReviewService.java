package com.playdata.reviewservice.review.service;

import com.playdata.reviewservice.client.PointServiceClient;
import com.playdata.reviewservice.client.UserServiceClient;
import com.playdata.reviewservice.common.auth.Role;
import com.playdata.reviewservice.common.config.AwsS3Config;
import com.playdata.reviewservice.review.dto.*;
import com.playdata.reviewservice.review.entity.Review;
import com.playdata.reviewservice.review.entity.ReviewImage;
import com.playdata.reviewservice.review.repository.ReviewRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserServiceClient userServiceClient;
    private final PointServiceClient pointServiceClient;
    private final AwsS3Config awsS3Config;

    public void createReview(ReviewRequestDto reviewRequestDto) throws IOException {
        int NO_IMAGE_POINT = 5;
        int IMAGE_POINT = 10;
        Review review = reviewRequestDto.toEntity();

        if (reviewRequestDto.getImages() != null) {
            List<MultipartFile> reviewImages = reviewRequestDto.getImages();
            for (MultipartFile reviewImage : reviewImages) {
                String uniqueFileName = UUID.randomUUID() + "_" + reviewImage.getOriginalFilename();
                String imageUrl = awsS3Config.uploadToS3Bucket(reviewImage.getBytes(), uniqueFileName);
                ReviewImage image = new ReviewImage();
                image.setUrl(imageUrl);
                image.setSort_order(0);
                review.addImage(image);
            }
            userServiceClient.updatePoint(review.getUserId(), IMAGE_POINT);
        } else {
            userServiceClient.updatePoint(review.getUserId(), NO_IMAGE_POINT);
        }

        reviewRepository.save(review);
    }

    public List<ReviewResponseDto> getRestaurantReviews(Long restaurantId) {
        List<Review> reviews = reviewRepository.findAllByRestaurantIdOrderByCreatedAtDesc(restaurantId).orElseThrow(
                () -> new EntityNotFoundException("Review not found!")
        );

        List<ReviewResponseDto> reviewDtos = reviews.stream()
                .map(Review::toResponseDto)
                .collect(Collectors.toList());

        List<Integer> userIds = reviewDtos.stream().map((review) -> review.getUserId().intValue()).collect(Collectors.toList());
        List<UserResDto> userResDtos= userServiceClient.getUserForReivew(userIds);
        Map<Long, String> idToNickname = userResDtos.stream().collect(Collectors.toMap(
                UserResDto::getId,
                UserResDto::getNickName,
                (v1, v2) -> v1 // 중복 키 값 발생 시 기존 값을 유지
        ));
        Map<Long, String> idToProfileImage = userResDtos.stream().collect(Collectors.toMap(
                UserResDto::getId,
                (userDto) -> {
                    return userDto.getProfileImage() != null ? userDto.getProfileImage() : "";
                },
                (v1, v2) -> v1 // 중복 키 값 발생 시 기존 값을 유지
        ));
        for (ReviewResponseDto reviewDto : reviewDtos) {
            reviewDto.setBadgeInfo(
                    pointServiceClient.getUserBadgeByUserId(reviewDto.getUserId())
            );
            reviewDto.setNickname(idToNickname.get(reviewDto.getUserId()));
            reviewDto.setProfileImage(idToProfileImage.get(reviewDto.getUserId()));
        }
        log.info("User reviews found: " + userResDtos.size());
        return reviewDtos;
    }

    public List<ReviewResponseDto> getUserReviews(Long id) {
        List<Review> reviews = reviewRepository.findAllByUserId(id).orElseThrow(
                () -> new EntityNotFoundException("Review not found!")
        );

        List<ReviewResponseDto> reviewDtos = reviews.stream()
                .map(Review::toResponseDto)
                .collect(Collectors.toList());

        List<Integer> userIds = reviewDtos.stream().map((review) -> review.getUserId().intValue()).collect(Collectors.toList());
        List<UserResDto> userResDtos= userServiceClient.getUserForReivew(userIds);
        Map<Long, String> idToNickname = userResDtos.stream().collect(Collectors.toMap(
                UserResDto::getId,
                UserResDto::getNickName,
                (v1, v2) -> v1 // 중복 키 값 발생 시 기존 값을 유지
        ));
        for (ReviewResponseDto reviewDto : reviewDtos) {
            reviewDto.setBadgeInfo(
                    pointServiceClient.getUserBadgeByUserId(reviewDto.getUserId())
            );
            reviewDto.setNickname(idToNickname.get(reviewDto.getUserId()));
        }
        return reviewDtos;
    }

    public void deleteReview(Long id, String email) throws Exception {
        Review review = reviewRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException("Review not found!")
        );

        UserResDto userResDto = userServiceClient.getUserByEmail(email);
        if(userResDto == null) {
            throw new EntityNotFoundException("User not found for delete review!!");
        } else if(userResDto.getRole() != Role.ADMIN && !userResDto.getId().equals(review.getUserId())) {
            throw new EntityNotFoundException("User id not matched for delete review!!");
        }

        for (ReviewImage reviewImage : review.getImages()) {
            awsS3Config.deleteFromS3Bucket(reviewImage.getUrl());
        }
        reviewRepository.delete(review);
    }

    public void updateReview(ReviewRequestDto reviewRequestDto, String email) throws IOException {
        Review review = reviewRepository.findById(reviewRequestDto.getId()).orElseThrow(
                () -> new EntityNotFoundException("Review not found!")
        );
        UserResDto userResDto = userServiceClient.getUserByEmail(email);
        if(userResDto == null) {
            throw new EntityNotFoundException("User not found for update review!!");
        } else if(!userResDto.getId().equals(review.getUserId())) {
            throw new EntityNotFoundException("User id not matched for update review!!");
        }

        review.setRating(reviewRequestDto.getRating());
        review.setContent(reviewRequestDto.getContent());

        // 1. 삭제할 이미지 처리
        List<String> deletedImageUrls = reviewRequestDto.getDeletedImageUrls();
        if (deletedImageUrls != null) {
            review.getImages().removeIf(image -> {
                if (deletedImageUrls.contains(image.getUrl())) {
                    try {
                        awsS3Config.deleteFromS3Bucket(image.getUrl());
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                    return true; // 리스트에서도 제거
                }
                return false;
            });
        }

        // 2. 새 이미지 추가 처리
        List<MultipartFile> reviewImages = reviewRequestDto.getImages();
        if (reviewImages != null) {
            for (MultipartFile reviewImage : reviewImages) {
                String uniqueFileName = UUID.randomUUID() + "_" + reviewImage.getOriginalFilename();
                String imageUrl = awsS3Config.uploadToS3Bucket(reviewImage.getBytes(), uniqueFileName);

                ReviewImage image = new ReviewImage();
                image.setUrl(imageUrl);
                image.setSort_order(0);
                image.setReview(review); // 연관관계 바인딩 필수!

                review.getImages().add(image);
            }
        }
        reviewRepository.save(review);
    }

    public long getReviewCountByUserId(Long userId) {
        return reviewRepository.countByUserId(userId);
    }

    public ReviewStatsDto getRestaurantReviewStats(Long restaurantId) {
        return reviewRepository.getReviewCountAndAverageRating(restaurantId);

    }
}
