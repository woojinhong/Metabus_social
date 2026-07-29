package metabus.social.spike;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;

final class SpikeSecurityFixtures {

  static final String ACCOUNT_ID = "spike.account-id";
  static final String ISSUED_SESSION_EPOCH = "spike.issued-session-epoch";
  static final String FIXTURE_PASSWORD = "fixture-pass";

  private SpikeSecurityFixtures() {}

  static final class FixtureAuthenticationProvider implements AuthenticationProvider {

    private final SpikeFixtureRepository repository;
    private final ConcurrentLinkedQueue<String> internalReasons = new ConcurrentLinkedQueue<>();

    FixtureAuthenticationProvider(SpikeFixtureRepository repository) {
      this.repository = repository;
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
      String loginName = authentication.getName();
      String supplied = String.valueOf(authentication.getCredentials());
      var account = repository.findByLoginName(loginName);
      String reason;
      if (account.isEmpty()) {
        reason = "ACCOUNT_NOT_FOUND";
      } else if (!constantTimeEquals(FIXTURE_PASSWORD, supplied)) {
        reason = "BAD_CREDENTIAL";
      } else if (!"ACTIVE".equals(account.orElseThrow().status())) {
        reason = account.orElseThrow().status();
      } else {
        internalReasons.add("SUCCESS");
        return UsernamePasswordAuthenticationToken.authenticated(
            loginName, null, List.of(new SimpleGrantedAuthority("ROLE_SPIKE")));
      }
      internalReasons.add(reason);
      throw new BadCredentialsException("authentication_failed");
    }

    @Override
    public boolean supports(Class<?> authentication) {
      return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }

    ConcurrentLinkedQueue<String> internalReasons() {
      return internalReasons;
    }

    private static boolean constantTimeEquals(String expected, String supplied) {
      return MessageDigest.isEqual(
          expected.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8));
    }
  }

  static final class SessionEpochFilter extends OncePerRequestFilter {

    private final SpikeFixtureRepository repository;

    SessionEpochFilter(SpikeFixtureRepository repository) {
      this.repository = repository;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
      var session = request.getSession(false);
      if (session == null) {
        rejectMissingFixtureSession(request, response);
        if (response.isCommitted()) {
          return;
        }
        filterChain.doFilter(request, response);
        return;
      }
      Object accountReference = session.getAttribute(ACCOUNT_ID);
      Object issuedEpoch = session.getAttribute(ISSUED_SESSION_EPOCH);
      if (accountReference == null || issuedEpoch == null) {
        rejectMissingFixtureSession(request, response);
        if (response.isCommitted()) {
          return;
        }
        filterChain.doFilter(request, response);
        return;
      }
      var account = repository.find(UUID.fromString(accountReference.toString()));
      long sessionEpoch = ((Number) issuedEpoch).longValue();
      if (!"ACTIVE".equals(account.status()) || sessionEpoch != account.sessionEpoch()) {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"access_denied\"}");
        return;
      }
      filterChain.doFilter(request, response);
    }

    private static void rejectMissingFixtureSession(
        HttpServletRequest request, HttpServletResponse response) {
      if (request.getRequestURI().equals("/spike/probe")
          || request.getRequestURI().equals("/spike/hold")) {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      }
    }
  }
}
