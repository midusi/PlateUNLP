import { SpectrumMetadata } from "@/components/molecules/SpectrumMetadataForm"
import { epoca } from "./epoca"
import { sidereoTime } from "./sidereoTime"
import { localTime } from "./localTime"
import { toJulianDate } from "./toJulianDate"
import { hourAngle } from "./hourAngle"
import { raDec } from "./calculateRaDec"
import { getSptypeMainidRa2000Dec2000 } from "./getSptypeMainidRa2000Dec2000"
import { calculateAirmass } from "./AIRMASS"

export const calculateMetadata = (spectrumMetadata: SpectrumMetadata, observat: string): SpectrumMetadata => {
    [spectrumMetadata.SPTYPE, spectrumMetadata.MAIN_ID, spectrumMetadata.DEC2000, spectrumMetadata.RA2000] = getSptypeMainidRa2000Dec2000(spectrumMetadata.OBJECT)

    spectrumMetadata.EQUINOX = epoca(spectrumMetadata.DATE_OBS)

    spectrumMetadata.ST = sidereoTime(observat, spectrumMetadata.DATE_OBS, spectrumMetadata.UT)

    spectrumMetadata.TIME_OBS = localTime(observat, spectrumMetadata.DATE_OBS, spectrumMetadata.UT);

    [spectrumMetadata.RA1950, spectrumMetadata.DEC1950] = raDec(spectrumMetadata.RA2000, spectrumMetadata.DEC2000, 1950);

    [spectrumMetadata.RA, spectrumMetadata.DEC] = raDec(spectrumMetadata.RA2000, spectrumMetadata.DEC2000);

    spectrumMetadata.JD = toJulianDate(spectrumMetadata.DATE_OBS, spectrumMetadata.TIME_OBS)

    spectrumMetadata.HA = hourAngle(spectrumMetadata.RA, spectrumMetadata.ST)

    spectrumMetadata.AIRMASS = calculateAirmass(observat, spectrumMetadata.HA, spectrumMetadata.RA, spectrumMetadata.DEC)

    return spectrumMetadata
}
