package metabus.social.spike;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModulithStructureTests {

  @Test
  void reportsNotApplicableWithoutProductionModules() {
    assertThatThrownBy(() -> ApplicationModules.of(SpikeTestApplication.class).verify())
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("No classes found");
  }
}
