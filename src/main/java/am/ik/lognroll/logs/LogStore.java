package am.ik.lognroll.logs;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface LogStore {

	void addAll(List<Log> logs);

	void clear();

	CompletableFuture<Void> vacuum();

}
