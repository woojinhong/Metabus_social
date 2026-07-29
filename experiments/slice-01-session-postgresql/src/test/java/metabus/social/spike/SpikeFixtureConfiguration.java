package metabus.social.spike;

import static metabus.social.spike.SpikeSecurityFixtures.ACCOUNT_ID;
import static metabus.social.spike.SpikeSecurityFixtures.ISSUED_SESSION_EPOCH;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@TestConfiguration(proxyBeanMethods = false)
class SpikeFixtureConfiguration {

  @Bean
  SpikeFixtureRepository fixtureRepository(
      DataSource dataSource, PlatformTransactionManager transactionManager) {
    return new SpikeFixtureRepository(new JdbcTemplate(dataSource), transactionManager);
  }

  @Bean
  SpikeRaceControl raceControl() {
    return new SpikeRaceControl();
  }

  @Bean
  SpikeSecurityFixtures.FixtureAuthenticationProvider fixtureAuthenticationProvider(
      SpikeFixtureRepository repository) {
    return new SpikeSecurityFixtures.FixtureAuthenticationProvider(repository);
  }

  @Bean
  SpikeSecurityFixtures.SessionEpochFilter sessionEpochFilter(SpikeFixtureRepository repository) {
    return new SpikeSecurityFixtures.SessionEpochFilter(repository);
  }

  @Bean
  DefaultCookieSerializer cookieSerializer() {
    var serializer = new DefaultCookieSerializer();
    serializer.setCookieName("SPIKE_SESSION");
    serializer.setUseBase64Encoding(false);
    serializer.setUseSecureCookie(false);
    serializer.setUseHttpOnlyCookie(true);
    return serializer;
  }

  @Bean
  SecurityFilterChain spikeSecurity(
      HttpSecurity http,
      SpikeSecurityFixtures.FixtureAuthenticationProvider provider,
      SpikeSecurityFixtures.SessionEpochFilter epochFilter,
      SpikeFixtureRepository repository)
      throws Exception {
    http.authenticationProvider(provider)
        .authorizeHttpRequests(
            requests ->
                requests
                    .requestMatchers(
                        "/login",
                        "/spike/preauth",
                        "/spike/login-fixture",
                        "/spike/probe",
                        "/spike/hold")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .formLogin(
            form ->
                form.successHandler(
                        (request, response, authentication) -> {
                          var account =
                              repository.findByLoginName(authentication.getName()).orElseThrow();
                          var session = request.getSession(true);
                          session.setAttribute(ACCOUNT_ID, account.accountId().toString());
                          session.setAttribute(ISSUED_SESSION_EPOCH, account.sessionEpoch());
                          response.setStatus(HttpServletResponseCodes.NO_CONTENT);
                        })
                    .failureHandler(
                        (request, response, exception) -> {
                          response.setStatus(HttpServletResponseCodes.UNAUTHORIZED);
                          response.setContentType("application/json");
                          response
                              .getOutputStream()
                              .write(
                                  "{\"error\":\"authentication_failed\"}"
                                      .getBytes(StandardCharsets.UTF_8));
                        }))
        .exceptionHandling(
            exceptions ->
                exceptions.authenticationEntryPoint(
                    (request, response, exception) ->
                        response.setStatus(HttpServletResponseCodes.UNAUTHORIZED)))
        .addFilterAfter(epochFilter, AnonymousAuthenticationFilter.class);
    return http.build();
  }

  @RestController
  static final class SpikeFixtureController {

    private final SpikeFixtureRepository repository;
    private final SpikeRaceControl races;

    SpikeFixtureController(SpikeFixtureRepository repository, SpikeRaceControl races) {
      this.repository = repository;
      this.races = races;
    }

    @GetMapping("/spike/preauth")
    ResponseEntity<Void> preAuthenticationSession(HttpServletRequest request) {
      request.getSession(true).setAttribute("spike.preauth", Boolean.TRUE);
      return ResponseEntity.noContent().build();
    }

    @GetMapping("/spike/login-fixture")
    ResponseEntity<Void> issueFixtureSession(HttpServletRequest request) {
      long epoch = repository.captureSessionEpoch(SpikeFixtureRepository.ACTIVE_ACCOUNT);
      var session = request.getSession(true);
      session.setAttribute(ACCOUNT_ID, SpikeFixtureRepository.ACTIVE_ACCOUNT.toString());
      session.setAttribute(ISSUED_SESSION_EPOCH, epoch);
      races.pauseLoginAfterEpochCapture();
      return ResponseEntity.noContent().build();
    }

    @GetMapping("/spike/probe")
    ResponseEntity<String> probe() {
      return ResponseEntity.ok("ok");
    }

    @GetMapping("/spike/secured")
    ResponseEntity<String> securedProbe() {
      return ResponseEntity.ok("secured");
    }

    @GetMapping("/spike/hold")
    ResponseEntity<Void> holdBeforeFilterSave(HttpServletRequest request) {
      request.getSession(false).setAttribute("spike.touch", UUID.randomUUID().toString());
      races.pauseRequestBeforeFilterSave();
      return ResponseEntity.noContent().build();
    }
  }

  private static final class HttpServletResponseCodes {
    static final int NO_CONTENT = 204;
    static final int UNAUTHORIZED = 401;

    private HttpServletResponseCodes() {}
  }
}
