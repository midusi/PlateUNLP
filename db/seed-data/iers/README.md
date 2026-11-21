# IERS snapshots

Fallback copies of the Earth-orientation files that `db/seed.ts` downloads from the USNO server
(`maia.usno.navy.mil`). That server is often unreachable (it resets the TLS handshake), which used
to leave `pnpm db:init` half-seeded: no ΔT / Bulletin A rows and no `admin` user.

The seed always tries the USNO URL first and only reads these files when the download fails (it
prints a warning when it does). They are plain, unmodified copies — keep them byte-for-byte as
published, because the seed parses them by fixed column positions.

| File | Used for | Original URL | Obtained from | Covers |
|------|----------|--------------|---------------|--------|
| `deltat.data` | ΔT (TT − UT1), 1973 – present | `https://maia.usno.navy.mil/ser7/deltat.data` | Wayback Machine capture of 2026-07-02 | 1973-02-01 – 2026-04-01 |
| `historic_deltat.data` | ΔT (TT − UT1), 1657 – 1984 | `https://maia.usno.navy.mil/ser7/historic_deltat.data` | Wayback Machine capture of 2026-06-15 | 1657.0 – 1984.5 |
| `finals2000A.all` | Bulletin A: polar motion and DUT1 | `https://maia.usno.navy.mil/ser7/finals2000A.all` | `https://datacenter.iers.org/data/9/finals2000A.all`, downloaded 2026-10-14 | IERS values up to 2026-10-08 (the rest are predictions, which the seed skips) |

## Refreshing

These files go stale (new IERS values are published weekly), but the fallback only needs to be good
enough for a development database, so refresh them occasionally rather than on every release. When
the USNO server is reachable:

```bash
cd db/seed-data/iers
curl -fsSO https://maia.usno.navy.mil/ser7/deltat.data
curl -fsSO https://maia.usno.navy.mil/ser7/historic_deltat.data
curl -fsSO https://maia.usno.navy.mil/ser7/finals2000A.all
```

Then update the table above. `finals2000A.all` weighs ~3.7 MB, so every refresh adds roughly 1 MB to
the repository history.
