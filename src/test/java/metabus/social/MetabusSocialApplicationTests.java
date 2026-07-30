package metabus.social;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

@SpringBootTest(
    properties =
        "spring.autoconfigure.exclude="
            + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
            + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
            + "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration")
@Import(MetabusSocialApplicationTests.DbFreePersistenceTestConfiguration.class)
class MetabusSocialApplicationTests {

  @Autowired private ApplicationContext context;

  @Test
  void contextLoadsWithoutExternalInfrastructure() {
    assertThat(context.containsBean("accountStatusHistoryRepository")).isTrue();
    assertThat(context.containsBean("auditRecordRepository")).isTrue();
    assertThat(context.containsBean("authorizationHistoryRepository")).isTrue();
  }

  @TestConfiguration(proxyBeanMethods = false)
  static class DbFreePersistenceTestConfiguration {

    @Bean
    EntityManager entityManager() {
      return mock(EntityManager.class);
    }
  }
}
