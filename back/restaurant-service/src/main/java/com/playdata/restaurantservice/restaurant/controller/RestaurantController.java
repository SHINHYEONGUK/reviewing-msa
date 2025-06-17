package com.playdata.restaurantservice.restaurant.controller;

import com.playdata.restaurantservice.common.dto.CommonResDto;
import com.playdata.restaurantservice.restaurant.dto.RestaurantIdDto;
import com.playdata.restaurantservice.restaurant.dto.RestaurantReqDto;
import com.playdata.restaurantservice.restaurant.dto.RestaurantResDto;
import com.playdata.restaurantservice.restaurant.dto.RestaurantSearchDto;
import com.playdata.restaurantservice.restaurant.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/restaurant-service")
@Slf4j
public class RestaurantController {

    private final RestaurantService restaurantService;

    // 상점 등록
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/restaurants")
    public ResponseEntity<?> createRestaurant(RestaurantReqDto restaurantReqDto) throws IOException {
        restaurantService.RestaurantCreate(restaurantReqDto);
        CommonResDto resDto = new CommonResDto(HttpStatus.CREATED, "상점 등록이 완료되었습니다.", null);
        return new ResponseEntity<>(resDto, HttpStatus.CREATED);
    }

    // 상점 수정
    @PutMapping("/restaurant/{id}")
    public ResponseEntity<?> updateRestaurant(RestaurantReqDto dto, @PathVariable Long id) throws Exception {
        restaurantService.updateRestaurantInfo(id, dto);
        CommonResDto resDto = new CommonResDto(HttpStatus.OK, "수정 완료되었습니다.", null);
        return ResponseEntity.ok().body(resDto);
    }

    // 단일 상점 조회
    @GetMapping("/restaurants/{id}")
    public ResponseEntity<?> getRestaurantById(@PathVariable Long id) {
        RestaurantResDto dto = restaurantService.getRestaurantDetail(id);
        CommonResDto resDto = new CommonResDto(HttpStatus.OK, "조회 완료되었습니다.", dto);
        return ResponseEntity.ok().body(resDto);
    }

    // 상점 삭제
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    @DeleteMapping("/restaurant/{id}")
    public ResponseEntity<?> deleteRestaurant(@PathVariable Long id) throws Exception {
        restaurantService.restaurantDelete(id);
        CommonResDto resDto = new CommonResDto(HttpStatus.OK, "삭제 완료되었습니다.", id);
        return ResponseEntity.ok().body(resDto);
    }

    // 상점 목록
    @GetMapping("/restaurant/list")
    public ResponseEntity<?> listRestaurant(RestaurantSearchDto dto, @RequestParam int page,
                                            @RequestParam int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")); // 무조건 최신순
        log.info("/restaurant/list: GET, pageable: {}", pageable);
        log.info("dto: {}", dto);

        List<RestaurantResDto> dtoList = restaurantService.restaurantList(dto, pageable);
        log.info("dtoList: {}", dtoList);
        CommonResDto resDto = new CommonResDto(HttpStatus.OK, "상점이 조회 되었습니다.", dtoList);
        return ResponseEntity.ok().body(resDto);
    }

    @GetMapping("/restaurant/{userId}")
    public ResponseEntity<?> getRestaurantIdByUserId(@PathVariable Long userId) {
        RestaurantIdDto restaurantIdByUserId = restaurantService.getRestaurantIdByUserId(userId);
        CommonResDto resDto = new CommonResDto(HttpStatus.OK, "restaurantId 조회 성공!", restaurantIdByUserId);
        return ResponseEntity.ok().body(resDto);
    }


}
