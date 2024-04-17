package com.lemon.backend.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    //스케치북
    SKETCHBOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "스케치북 정보를 찾을 수 없습니다."),

    //편지
    LETTER_NOT_FOUND(HttpStatus.NOT_FOUND, "편지 정보를 찾을 수 없습니다."),

    //회원
    USERS_NOT_FOUND(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다."),

    //캐릭터
    CHARACTER_NOT_FOUND(HttpStatus.NOT_FOUND, "캐릭터 정보를 찾을 수 없습니다."),

    //캐릭터모션
    CHARACTERMOTION_NOT_FOUND(HttpStatus.NOT_FOUND, "캐릭터 모션 정보를 찾을 수 없습니다."),

    //모션
    MOTION_NOT_FOUND(HttpStatus.NOT_FOUND, "모션 정보를 찾을 수 없습니다."),

    //유저
    NOT_FOUND_USER(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다."),
    EXPIRED_AUTH_TOKEN(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    NOT_FOUND_AUTH_TOKEN(HttpStatus.BAD_REQUEST, "토큰 정보가 없습니다."),
    UNAUTHORIZED_FUNCTION_ACCESS(HttpStatus.UNAUTHORIZED, "로그인 후 이용할 수 있습니다."),
    INVALID_AUTH_CODE(HttpStatus.NOT_FOUND, "인증코드가 일치하지 않습니다."),
    INVALID_AUTH_TOKEN(HttpStatus.UNAUTHORIZED, "권한 정보가 없는 토큰입니다.");


    private final HttpStatus status;
    private final String message;

}