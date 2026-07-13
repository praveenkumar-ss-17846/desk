-- Web Push subscriptions and scheduled reminders.

-- One row per browser/device push subscription.
CREATE TABLE IF NOT EXISTS push_subs (
  endpoint   TEXT PRIMARY KEY,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Upcoming task reminders for a subscription. `notified` flips to 1 once the
-- cron job has sent the push for it (the service worker then reads and clears
-- these to show the actual task text).
CREATE TABLE IF NOT EXISTS reminders (
  endpoint TEXT NOT NULL,
  task_id  TEXT NOT NULL,
  due_at   INTEGER NOT NULL,
  text     TEXT NOT NULL,
  notified INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (endpoint, task_id)
);

CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders (due_at, notified);
