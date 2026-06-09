package com.fluento.service;

import com.fluento.domain.user.User;
import com.fluento.domain.user.UserRepository;
import com.fluento.dto.auth.LoginResponse;
import com.fluento.exception.DuplicateEmailException;
import com.fluento.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CognitoService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final UserRepository userRepository;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    @Value("${aws.cognito.client-id}")
    private String clientId;

    @Transactional
    public Map<String, Object> signup(String username, String email, String password) {
        software.amazon.awssdk.services.cognitoidentityprovider.model.SignUpResponse response;
        try {
            response = cognitoClient.signUp(SignUpRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .password(password)
                    .userAttributes(
                            AttributeType.builder().name("email").value(email).build(),
                            AttributeType.builder().name("name").value(username).build()
                    )
                    .build());
        } catch (UsernameExistsException e) {
            throw new DuplicateEmailException("이미 가입된 이메일입니다.");
        }

        String sub = response.userSub();
        userRepository.findByGoogleId(sub)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseGet(() -> userRepository.save(
                                User.builder()
                                        .googleId(sub)
                                        .email(email)
                                        .name(username)
                                        .build()
                        )));

        return Map.of("email", email, "message", "이메일로 전송된 인증 코드를 입력해주세요.");
    }

    public void confirmSignup(String email, String code) {
        try {
            cognitoClient.confirmSignUp(
                    software.amazon.awssdk.services.cognitoidentityprovider.model.ConfirmSignUpRequest.builder()
                            .clientId(clientId)
                            .username(email)
                            .confirmationCode(code)
                            .build());
        } catch (software.amazon.awssdk.services.cognitoidentityprovider.model.CodeMismatchException e) {
            throw new com.fluento.exception.InvalidVerificationCodeException("인증 코드가 올바르지 않습니다.");
        } catch (software.amazon.awssdk.services.cognitoidentityprovider.model.ExpiredCodeException e) {
            throw new com.fluento.exception.InvalidVerificationCodeException("인증 코드가 만료되었습니다.");
        }
    }

    public LoginResponse login(String email, String password) {
        try {
            InitiateAuthResponse response = cognitoClient.initiateAuth(InitiateAuthRequest.builder()
                    .clientId(clientId)
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(Map.of("USERNAME", email, "PASSWORD", password))
                    .build());

            AuthenticationResultType result = response.authenticationResult();
            return new LoginResponse(
                    result.accessToken(),
                    result.idToken(),
                    result.refreshToken(),
                    result.expiresIn()
            );
        } catch (NotAuthorizedException | UserNotFoundException e) {
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
    }

}
