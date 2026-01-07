package am.ik.lognroll.maintenance;

import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.stereotype.Component;

@Component
public class MaintenanceMode {

	private final AtomicBoolean enabled = new AtomicBoolean(false);

	private final AtomicBoolean vacuumInProgress = new AtomicBoolean(false);

	public boolean isEnabled() {
		return this.enabled.get();
	}

	public void enable() {
		this.enabled.set(true);
	}

	public boolean disable() {
		if (this.vacuumInProgress.get()) {
			return false;
		}
		this.enabled.set(false);
		return true;
	}

	public boolean isVacuumInProgress() {
		return this.vacuumInProgress.get();
	}

	public void setVacuumInProgress(boolean inProgress) {
		this.vacuumInProgress.set(inProgress);
	}

}
