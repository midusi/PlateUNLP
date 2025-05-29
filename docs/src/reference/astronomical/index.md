# `astronomical` module

This _internal_ module contains a set of astronomical algorithms that are used in the calculations of the `PlateUNLP` package. It's found in the [`app/common/astronomical`](https://github.com/midusi/PlateUNLP/tree/main/app/common/astronomical) directory.

> [!CAUTION]
> These functions are **NOT** intended to be used directly by the user.

Most of these functions follow the algorithms used by [SOFA](https://www.iausofa.org) and, subsequently, other big libraries like [ERFA](https://github.com/liberfa/erfa) or [Astropy](https://www.astropy.org/), ensuring the results are as consistent as possible even when working with a different programming language altogether.

* [Datetime](#datetime)
  * [`getLocalTime`](#getlocaltime)
  * [`getJulianDate`](#getjuliandate)

## Datetime

### `getLocalTime`

Gets the local time from a date (`date`), universal time (`ut`)[^ut-note] and the local timezone (`tz`). The local timezone must be one of the timezones defined in the [IANA Time Zone Database](https://www.iana.org/time-zones). The timezone is used to convert the universal time to local time taking into account the daylight saving time (DST) if applicable, thanks to the [tz database](https://en.wikipedia.org/wiki/Tz_database).

> [!WARNING]
> As implemented, there is no indication if the resulting local time is in a day diffrent from `date`.


### `getJulianDate`

Gets the Julian date from a given Gregorian date (`date`) and time (`ut`)[^ut-note]. It computes the Julian date using the algorithm described by Urban and Seidelmann (2013)[^almanac].

The method described only takes `date` into account, so the time is added as

$$
  \text{JD} \leftarrow \text{JD} + \frac{\text{UT} - 12\text{~hs}}{24\text{~hs}}.
$$

Note that _true_ Julian date don't consider leap seconds, but this is negligible for the aplications of this software.

### `getSiderealTime`

To compute the sidereal time (specifically, the Greenwich mean sidereal time), the algorithm described by Capitaine et al. (2005)[^capitaine2005], which is consistent with IAU 2006 precession, is used.
  
First, the Earth Rotation Angle (ERA), also known as stellar angle, is computed using the algorithm described by Capitaine et al. (2003)[^capitaine2003]:

$$
  \theta = 2\pi(0.7790572732640 + 1.00273781191135448 T_u),
$$

where $T_u$ is defined as the Julian days (in UT[^ut-note]) since the epoch J2000.0.

Then, we get $\Delta\text{T} = \text{TT} - \text{UT}$ from IERS, managed by the U.S. Naval Observatory (see https://maia.usno.navy.mil/products/deltaT). With the date in terrestrial time (TT), we can compute the Greenwich mean sidereal time (GMST) as a simple polynomial described by Capitaine et al. (2005)[^capitaine2005].

Finally, the local sidereal time is computed by rotating the GMST by the observer's longitude, the TIO (Terrestrial Intermediate Origin) locator $s'$ and the polar motion of the Earth (fetched from the IERS Bulletin A, see https://maia.usno.navy.mil/ser7/).

[^almanac]: S. E. Urban and P. K. Seidelmann, Eds. _Explanatory Supplement to the Astronomical Almanac_, 3rd ed. University Science Books, 2013, ch. 15, sec. 11, pp. 617-621.
[^capitaine2003]: N. Capitaine, P. T. Wallace, and D. D. McCarthy, "Expressions to implement the IAU 2000 definition of UT1," _Astronomy & Astrophysics_, vol. 406, no. 3, pp. 1135–1149, Aug. 2003, doi: 10.1051/0004-6361:20030817.
[^capitaine2005]: N. Capitaine, P. T. Wallace, and J. Chapront, "Improvement of the IAU 2000 precession model," _Astronomy & Astrophysics_, vol. 432, no. 1, pp. 355–367, Feb. 2005, doi: 10.1051/0004-6361:20041908.
[^ut-note]: The terms "UT" and "Universal Time" might not refer to [UT1](https://en.wikipedia.org/wiki/Universal_Time), since this software is meant to be used to process historical observations, some older than the introduction of UT1, when "Universal Time" was a synonym to [GMT](https://en.wikipedia.org/wiki/Greenwich_Mean_Time). Considering this and the fact that $\Delta \text{UT1} = \text{UT1} - \text{UTC} < 1\text{~sec}$, we interpret $\text{UT} \approx \text{UT1} \approx \text{UTC}$.