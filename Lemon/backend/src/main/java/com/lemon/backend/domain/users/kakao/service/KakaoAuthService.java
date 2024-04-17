package com.lemon.backend.domain.users.kakao.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lemon.backend.domain.users.kakao.dto.KakaoProfile;
import com.lemon.backend.domain.users.kakao.dto.KakaoProperties;
import com.lemon.backend.domain.users.kakao.dto.KakaoProviderProperties;
import com.lemon.backend.domain.users.kakao.dto.KakaoToken;
import com.lemon.backend.domain.users.user.dto.LoginResponse;
import com.lemon.backend.domain.users.user.entity.Social;
import com.lemon.backend.domain.users.user.entity.Users;
import com.lemon.backend.domain.users.user.repository.UserRepository;
import com.lemon.backend.domain.users.user.service.UserService;
import com.lemon.backend.global.jwt.JwtTokenProvider;
import com.lemon.backend.global.jwt.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class KakaoAuthService {

    private final KakaoProperties kakaoProperties;
    private final KakaoProviderProperties kakaoProviderProperties;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;


    // 카카오로부터 accessToken 받는 함수
    public KakaoToken getAccessToken(String code) {
        // 요청 파라미터
        MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
        parameters.add("grant_type", kakaoProperties.getAuthorizationGrantType());
        parameters.add("client_id", kakaoProperties.getClientId());
        parameters.add("redirect_uri", kakaoProperties.getRedirectUri());
        parameters.add("code", code);
        parameters.add("client_secret", kakaoProperties.getClientSecret());

        // 요청보내고 응답 받기
        String accessTokenUri = kakaoProviderProperties.getTokenUri();
        WebClient webClient = WebClient.create(accessTokenUri);
        String response = webClient.post()
                .uri(accessTokenUri)
                .bodyValue(parameters)
                .header("Content-type", "application/x-www-form-urlencoded;charset=utf-8")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // 응답 파싱해서 토큰 반환
        ObjectMapper objectMapper = new ObjectMapper();
        KakaoToken kakaoToken = null;
        try {
            kakaoToken = objectMapper.readValue(response, KakaoToken.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return kakaoToken;
    }


    public KakaoProfile getUserInfo(String accessToken) {
        String userInfoUri = kakaoProviderProperties.getUserInfoUri();
        // 요청
        WebClient webClient = WebClient.create(userInfoUri);
        String response = webClient.post()
                .uri(userInfoUri)
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-type", "application/x-www-form-urlencoded;charset=utf-8")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // 응답 파싱해서 유저 정보 반환
        ObjectMapper objectMapper = new ObjectMapper();
        KakaoProfile kakaoProfile = null;
        try {
            kakaoProfile = objectMapper.readValue(response, KakaoProfile.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return kakaoProfile;
    }

    public LoginResponse login(String code) {
        String accessToken = getAccessToken(code).getAccessToken();
        KakaoProfile profile = getUserInfo(accessToken);

        Users user = userRepository.findByKakaoId(profile.getId()).orElseGet(() -> userService.createKakaoUser(profile, Social.KAKAO));
        TokenResponse tokenResponse = jwtTokenProvider.createToken(user.getId());

        userService.saveRefreshTokenIntoRedis(user.getId(), tokenResponse.getRefreshToken());

        return LoginResponse.builder().token(tokenResponse)
                .isLanguageSet(user.getIsLanguage())
                .nickname(user.getNickname())
                .nicknameTag(user.getNicknameTag()).build();
    }
}