package com.playdata.reviewservice.review.controller;

import com.playdata.reviewservice.common.auth.TokenUserInfo;
import com.playdata.reviewservice.common.dto.CommonResDto;
import com.playdata.reviewservice.review.dto.ReviewRequestDto;
import com.playdata.reviewservice.review.dto.ReviewResponseDto;
import com.playdata.reviewservice.review.dto.ReviewStatsDto;
import com.playdata.reviewservice.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/review-service")
public class ReviewController {

    private final ReviewService reviewService;

    // 리뷰 등록하기
    @PostMapping("/review")
    public ResponseEntity<?> createReview(@AuthenticationPrincipal TokenUserInfo tokenUserInfo,
                                          ReviewRequestDto reviewRequestDto) throws IOException {

        reviewService.createReview(reviewRequestDto);
        CommonResDto resDto = new CommonResDto(HttpStatus.CREATED, "리뷰 작성이 완료되었습니다.", null);
        return ResponseEntity.ok().body(resDto);
    }

    // 식당 별 리뷰 가져오기
    @GetMapping("/reviews/restaurant/{restaurantId}")
    public ResponseEntity<?> getRestaurantReviews(@PathVariable Long restaurantId) {
        List<ReviewResponseDto> reviews = reviewService.getRestaurantReviews(restaurantId);

        CommonResDto resDto = new CommonResDto(
                HttpStatus.OK, "리뷰 얻어오기 성공!", reviews
        );
        return ResponseEntity.ok().body(resDto);
    }

    // 유저 별 리뷰 가져오기
    @GetMapping("/reviews/user/{id}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long id) {
        List<ReviewResponseDto> userReviews = reviewService.getUserReviews(id);
        CommonResDto resDto = new CommonResDto(
                HttpStatus.OK, "리뷰 얻어오기 성공!", userReviews
        );
        return ResponseEntity.ok().body(resDto);
    }

    // 리뷰 수정
    @PatchMapping("/review")
    public ResponseEntity<?> updateReview(@AuthenticationPrincipal TokenUserInfo tokenUserInfo,
                                          ReviewRequestDto reviewRequestDto) throws IOException {
        reviewService.updateReview(reviewRequestDto, tokenUserInfo.getEmail());
        CommonResDto resDto = new CommonResDto(
                HttpStatus.OK, "리뷰 수정 완료!", null
        );
        return ResponseEntity.ok().body(resDto);
    }

    // 리뷰 삭제
    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@AuthenticationPrincipal TokenUserInfo tokenUserInfo,
                                          @PathVariable Long id) throws Exception {
        reviewService.deleteReview(id, tokenUserInfo.getEmail());
        CommonResDto resDto = new CommonResDto(
                HttpStatus.OK, "리뷰 삭제 완료!", null
        );
        return ResponseEntity.ok().body(resDto);
    }

    // 유저 리뷰 개수 가져오기
    @GetMapping("/review/count/{userId}")
    public ResponseEntity<?> getReviewCount(@PathVariable Long userId) {
        long reviewCount = reviewService.getReviewCountByUserId(userId);
        CommonResDto resDto = new CommonResDto(
                HttpStatus.OK, "리뷰 개수 조회 성공!", reviewCount
        );
        return ResponseEntity.ok().body(resDto);
    }

    // 식당 리뷰 개수, 평균 별점 가져오기
    @GetMapping("/reviews/stats/restaurant/{restaurantId}")
    public ResponseEntity<?> getRestaurantReviewsStats(@PathVariable Long restaurantId) {
        return ResponseEntity.ok().body(reviewService.getRestaurantReviewStats(restaurantId));
    }

}
