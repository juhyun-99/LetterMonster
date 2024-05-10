package com.lemon.backend.domain.FavoriteSketchbook.controller;

import com.lemon.backend.domain.FavoriteSketchbook.dto.FavoriteSketchbookGetDto;
import com.lemon.backend.domain.FavoriteSketchbook.entity.FavoriteSketchbook;
import com.lemon.backend.domain.FavoriteSketchbook.service.FavoriteSketchbookService;
import com.lemon.backend.global.exception.CustomException;
import com.lemon.backend.global.exception.ErrorCode;
import com.lemon.backend.global.response.SuccessCode;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import static com.lemon.backend.global.response.CommonResponseEntity.getResponseEntity;

@Tag(name = "FavoriteSketchbook 컨트롤러", description = "FavoriteSketchbook Controller API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/favorite")
public class FavoriteSketchbookController {

    private final FavoriteSketchbookService favoriteSketchbookService;

    @GetMapping
    public ResponseEntity<?> findAll(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Integer) {
            Integer loginId = (Integer) authentication.getPrincipal();
            Optional<List<FavoriteSketchbookGetDto>> list = favoriteSketchbookService.getFavoriteSketchbooksByUser(loginId);
            return getResponseEntity(SuccessCode.OK, list);
        } else {
            throw new CustomException(ErrorCode.INVALID_ACCESS);
        }
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(Authentication authentication, @RequestParam(value = "sketchbookId") Long sketchbookId) {
        if (authentication.getPrincipal() instanceof Integer) {
            Integer loginId = (Integer) authentication.getPrincipal();

            String favorite = favoriteSketchbookService.addFavoriteSketchbook(loginId, sketchbookId);
            return getResponseEntity(SuccessCode.OK, favorite);
        } else {
            throw new CustomException(ErrorCode.INVALID_ACCESS);
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteFavorite(Authentication authentication, @RequestParam(value = "sketchbookId") Long sketchbookId) {
        if (authentication.getPrincipal() instanceof Integer) {
            Integer loginId = (Integer) authentication.getPrincipal();
            favoriteSketchbookService.deleteFavotieSketchbook(loginId, sketchbookId);
            return getResponseEntity(SuccessCode.OK);
        } else {
            throw new CustomException(ErrorCode.INVALID_ACCESS);
        }
    }
}