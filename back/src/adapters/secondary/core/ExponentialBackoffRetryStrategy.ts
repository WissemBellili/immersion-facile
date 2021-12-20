import {
  differenceInMilliseconds,
  minutesToMilliseconds,
  secondsToMilliseconds,
} from "date-fns";
import { Clock } from "../../../domain/core/ports/Clock";
import { RetryStrategy } from "../../../domain/core/ports/RetryStrategy";
import { RandomFn, SleepFn } from "../../../shared/utils";

export const defaultMaxBackoffPeriodMs = secondsToMilliseconds(32);
export const defaultRetryDeadlineMs = minutesToMilliseconds(10);

// Simple truncated exponential backoff retry strategy implementation:
// - the 1st try is done immediately
// - if it fails, a 2nd try is attempted after a random duration between 1s - 2s
// - if it fails, a 3rd try is attempted after a random duration between 2s - 3s
// - if it fails, a 4th try is attempted after a random duration between 4s - 5s
// - etc.
//
// - The backoff duration will not exceed maxBackOffPeriodMs.
// - Retrying is abandoned after retryDeadlineMs is reached.
export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  public constructor(
    private readonly maxBackoffPeriodMs: number,
    private readonly retryDeadlineMs: number,
    private readonly clock: Clock,
    private readonly sleepFn: SleepFn,
    private readonly randomFn: RandomFn,
  ) {}

  public async apply<T>(cb: () => Promise<T>): Promise<T> {
    const startTime = this.clock.now();
    let backoffDurationS = 1;

    while (true) {
      try {
        return await cb();
      } catch (error: any) {
        // Callback failed, wait and retry.

        // TODO: Distinguish retriable from non-retriable errors.
        const backoffDurationMs =
          secondsToMilliseconds(backoffDurationS) + this.randomFn(1000);
        const truncatedBackoffDurationMs = Math.min(
          backoffDurationMs,
          this.maxBackoffPeriodMs,
        );

        this.sleepFn(truncatedBackoffDurationMs);

        if (
          differenceInMilliseconds(this.clock.now(), startTime) >=
          this.retryDeadlineMs
        ) {
          throw new Error(
            "Timeout exceeded while retrying failed requests. Last error: " +
              error,
          );
        }

        backoffDurationS *= 2;
      }
    }
  }
}
