package metabus.social;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ApplicationModuleStructureTests {

  private final ApplicationModules modules = ApplicationModules.of("metabus.social");

  @Test
  void discoversApprovedApplicationModules() {
    var moduleNames = modules.stream().map(module -> module.getIdentifier().toString()).toList();

    assertThat(moduleNames)
        .containsExactlyInAnyOrder("account", "authentication", "authorization", "audit", "common");
  }

  @Test
  void hasNoCyclesIllegalDependenciesOrInternalAccess() {
    modules.verify();
  }
}
