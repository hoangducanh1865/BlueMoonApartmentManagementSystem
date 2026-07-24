package com.example.demoapi.security;

import com.example.demoapi.model.UserAccount;
import com.example.demoapi.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserAccount userAccount = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Đây là mấu chốt: Cung cấp vai trò (role) cho Spring Security
        String roleName = userAccount.getRole();
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleName);

        return new User(
                userAccount.getEmail(),
                userAccount.getPassword(),
                Collections.singletonList(authority) // [ROLE_ADMIN] hoặc [ROLE_RESIDENT]
        );
    }
}