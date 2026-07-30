package metabus.social.audit.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class AuditRecordRepositoryConditionTests {

  private final ApplicationContextRunner contextRunner =
      new ApplicationContextRunner().withUserConfiguration(AuditRecordRepository.class);

  @Test
  void createsTheRequiredAuditAdapterWithoutASpringDatasourceUrlProperty() {
    contextRunner
        .withBean(EntityManager.class, () -> mock(EntityManager.class))
        .run(
            context -> {
              assertThat(context).hasNotFailed();
              assertThat(context).hasSingleBean(AuditRecordRepository.class);
            });
  }

  @Test
  void failsClosedWhenRequiredPersistenceInfrastructureIsMissing() {
    contextRunner.run(context -> assertThat(context).hasFailed());
  }
}
