package metabus.social.spike;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

final class SpikeRaceControl {

  private final AtomicReference<Gate> loginGate = new AtomicReference<>();
  private final AtomicReference<Gate> requestGate = new AtomicReference<>();

  Gate armLogin() {
    return arm(loginGate);
  }

  Gate armRequest() {
    return arm(requestGate);
  }

  void pauseLoginAfterEpochCapture() {
    pause(loginGate);
  }

  void pauseRequestBeforeFilterSave() {
    pause(requestGate);
  }

  private static Gate arm(AtomicReference<Gate> slot) {
    var gate = new Gate();
    if (!slot.compareAndSet(null, gate)) {
      throw new IllegalStateException("A race gate is already armed");
    }
    return gate;
  }

  private static void pause(AtomicReference<Gate> slot) {
    var gate = slot.getAndSet(null);
    if (gate == null) {
      return;
    }
    gate.arrived.countDown();
    await(gate.release, Duration.ofSeconds(10));
  }

  static void await(CountDownLatch latch, Duration timeout) {
    try {
      if (!latch.await(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
        throw new IllegalStateException("Timed out waiting for deterministic race gate");
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Interrupted while waiting for race gate", exception);
    }
  }

  static final class Gate {
    final CountDownLatch arrived = new CountDownLatch(1);
    final CountDownLatch release = new CountDownLatch(1);
  }
}
