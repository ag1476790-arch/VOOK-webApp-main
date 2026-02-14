# Monitoring & Alerts Setup

## Sentry + Vercel Integration

To receive P95 latency alerts and error notifications in Slack/Discord:

1.  **Sentry Alerts**:
    - Go to Sentry Dashboard > Alerts.
    - Create a new Alert Rule for "Transaction Duration" (P95 > 1000ms).
    - Add a "Slack" or "Discord" notification action.

2.  **Vercel Integration**:
    - Go to Vercel Dashboard > Settings > Integrations.
    - Add the "Sentry" integration to link your project.
    - This will automatically upload source maps on build.

## Load Testing

Run the Artillery load test locally:

```bash
npx artillery run tests/load/artillery.yaml
```

This simulates a user logging in and browsing the feed.
