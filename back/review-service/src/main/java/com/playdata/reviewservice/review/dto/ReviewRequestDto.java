package com.playdata.reviewservice.review.dto;

import com.playdata.reviewservice.review.entity.Review;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class ReviewRequestDto {
    private Long id;
    private String content;
    private Long rating;
    private Long userId;
    private Long restaurantId;

    private List<MultipartFile> images;
    private List<String> deletedImageUrls;
    public Review toEntity() {
        return Review.builder()
                .id(id)
                .content(content)
                .rating(rating)
                .userId(userId)
                .restaurantId(restaurantId)
                .build();
    }
}
