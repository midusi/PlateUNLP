function getObservat() {
  return [
    'ctio: Cerro Tololo Interamerican Observatory',
    'kpno: Kitt Peak National Observatory',
    'casleo: Complejo Astronomico El Leoncito, San Juan',
    'wiyn: WIYN Observatory',
    'lasilla: European Southern Observatory: La Silla',
    'paranal: European Southern Observatory: Paranal',
    'lick: Lick Observatory',
    'mmto: MMT Observatory',
    'cfht: Canada-France-Hawaii Telescope',
    'lapalma: Roque de los Muchachos, La Palma',
    'mso: Mt. Stromlo Observatory',
    'sso: Siding Spring Observatory',
    'aao: Anglo-Australian Observatory',
    'mcdonald: McDonald Observatory',
    'lco: Las Campanas Observatory',
    'mtbigelow: Catalina Observatory: 61 inch telescope',
    'dao: Dominion Astrophysical Observatory',
    'spm: Observatorio Astronomico Nacional, San Pedro Martir',
    'tona: Observatorio Astronomico Nacional, Tonantzintla',
    'Palomar: The Hale Telescope',
    'mdm: Michigan-Dartmouth-MIT Observatory',
    'NOV: National Observatory of Venezuela',
    'bmo: Black Moshannon Observatory',
    'BAO: Beijing XingLong Observatory',
    'keck: W. M. Keck Observatory',
    'ekar: Mt. Ekar 182 cm. Telescope',
    'apo: Apache Point Observatory',
    'lowell: Lowell Observatory',
    'vbo: Vainu Bappu Observatory',
    'iao: Indian Astronomical Observatory, Hanle',
    'flwo: Whipple Observatory',
    'flwo1: Whipple Observatory',
    'oro: Oak Ridge Observatory',
    'lna: Laboratorio Nacional de Astrofisica - Brazil',
    'saao: South African Astronomical Observatory',
    'bosque: Estacion Astrofisica Bosque Alegre, Cordoba',
    'rozhen: National Astronomical Observatory Rozhen - Bulgaria',
    'irtf: NASA Infrared Telescope Facility',
    'bgsuo: Bowling Green State Univ Observatory',
    'DSAZ: Deutsch-Spanisches Observatorium Calar Alto - Spain',
    'ca: Calar Alto Observatory',
    'holi: Observatorium Hoher List (Universitaet Bonn) - Germany',
    'lmo: Leander McCormick Observatory',
    'fmo: Fan Mountain Observatory',
    'whitin: Whitin Observatory, Wellesley College',
    'osn: Observatorio de Sierra Nevada',
    'gemini-north: Gemini North Observatory',
    'gemini-south: Gemini South Observatory',
    'lasilla: European Southern Observatory: La Silla',
    'paranal: European Southern Observatory: Paranal',
    'esontt: European Southern Observatory, NTT, La Silla',
    'eso36m: European Southern Observatory, 3.6m Telescope, La Silla',
    'esovlt: European Southern Observatory, VLT, Paranal',
    'sln: SLN - Catania Astrophysical Observatory',
    'euo: Ege University Observatory',
    'tug: TUBITAK National Observatory, Turkey',
    'mgo: Mount Graham Observatory',
    'aries: Aryabhatta Research Institute of Observational Sciences',
    'oalp: Observatorio Astronomico de La Plata',
    'olin: Connecticut',
    'boyden: Boyden',
    'lulin: Lulin Observatory',
    'soar: Southern Astrophysical Research Telescope',
    'baker: Baker Observatory',
    'het: McDonald Observatory - Hobby-Eberly Telescope',
    'jcdo: Jack C. Davis Observatory, Western Nevada College',
    'lno: Langkawi National Observatory']
}

function getObserver() {
  if (localStorage.getItem('observers'))
    return JSON.parse(localStorage.getItem('observers'))
}

function getObserverDef() {
  if (localStorage.getItem('observerDefault'))
    return JSON.parse(localStorage.getItem('observerDefault'))

  return ''
}

function getImageTyp() {
  if (localStorage.getItem('imageTypes'))
    return JSON.parse(localStorage.getItem('imageTypes'))
}

function getImageTypDef() {
  if (localStorage.getItem('imageTypeDefault'))
    return JSON.parse(localStorage.getItem('imageTypeDefault'))

  return ''
}

function getDigitali() {
  if (localStorage.getItem('digitalis'))
    return JSON.parse(localStorage.getItem('digitalis'))
}

function getDigitaliDef() {
  if (localStorage.getItem('digitaliDefault'))
    return JSON.parse(localStorage.getItem('digitaliDefault'))

  return ''
}

function getScanner() {
  if (localStorage.getItem('scanners'))
    return JSON.parse(localStorage.getItem('scanners'))
}

function getScannerDef() {
  if (localStorage.getItem('scannerDefault'))
    return JSON.parse(localStorage.getItem('scannerDefault'))

  return ''
}

function getScanres() {
  if (localStorage.getItem('scanress'))
    return JSON.parse(localStorage.getItem('scanress'))
}

function getScanresDef() {
  if (localStorage.getItem('scanresDefault'))
    return JSON.parse(localStorage.getItem('scanresDefault'))

  return ''
}

function getScancol() {
  if (localStorage.getItem('scancols'))
    return JSON.parse(localStorage.getItem('scancols'))
}

function getScancolDef() {
  if (localStorage.getItem('scancolDefault'))
    return JSON.parse(localStorage.getItem('scancolDefault'))

  return ''
}

function getSoftware() {
  if (localStorage.getItem('softwares'))
    return JSON.parse(localStorage.getItem('softwares'))
}

function getSoftwareDef() {
  if (localStorage.getItem('softwareDefault'))
    return JSON.parse(localStorage.getItem('softwareDefault'))

  return ''
}

function getMetadataFields() {
  return {
    object_: {
      label: 'OBJECT',
      type: 'text',
      info: 'Name of the object observed',
      required: true,
      pre_fetch: true,
      global: false
    },
    observat: {
      label: 'OBSERVAT',
      type: 'text',
      info: 'Organization or institution',
      required: true,
      options: getObservat(),
      global: true
    },
    dateObs: {
      label: 'DATE-OBS',
      type: 'text',
      info: 'Date of observation (yyyy-mm-dd)',
      required: true,
      pre_fetch: true,
      global: false
    },
    ut: {
      label: 'UT',
      type: 'text',
      info: 'Universal time (hh:mm:ss)',
      required: true,
      pre_fetch: true,
      global: false
    },
    suffix: {
      label: 'SUFFIX',
      type: 'text',
      info: 'Suffix for filename',
      required: false,
      pre_fetch: true,
      global: false
    },
    // Remote Metadata
    mainId: {
      label: 'MAIN-ID',
      type: 'text',
      info: 'Simbad main ID object name',
      required: true,
      remote: true,
      global: false
    },
    ra2000: {
      label: 'RA2000',
      type: 'text',
      info: 'Right ascension J2000',
      required: false,
      remote: true,
      global: false
    },
    dec2000: {
      label: 'DEC2000',
      type: 'text',
      info: 'Declination J2000',
      required: false,
      remote: true,
      global: false
    },
    sptype: {
      label: 'SPTYPE',
      type: 'text',
      info: 'Simbad spectral type',
      required: false,
      remote: true,
      global: false
    },
    equinox: {
      label: 'EQUINOX',
      type: 'text',
      info: 'Equinox of ra y dec',
      required: false,
      remote: true,
      numeric: true,
      global: false
    },
    ra: {
      label: 'RA',
      type: 'text',
      info: 'Right ascension',
      required: false,
      remote: true,
      global: false
    },
    dec: {
      label: 'DEC',
      type: 'text',
      info: 'Declination',
      required: false,
      remote: true,
      global: false
    },
    ra1950: {
      label: 'RA1950',
      type: 'text',
      info: 'RA2000 precessed to ep.1950 eq.1950',
      required: false,
      remote: true,
      numeric: true,
      global: false
    },
    dec1950: {
      label: 'DEC1950',
      type: 'text',
      info: 'DEC2000 precessed to ep.1950 eq.1950',
      required: false,
      remote: true,
      global: false
    },
    timeObs: {
      label: 'TIME-OBS',
      type: 'text',
      info: 'Local time at the start of the observation',
      required: false,
      remote: true,
      global: false
    },
    st: {
      label: 'ST',
      type: 'text',
      info: 'Local mean sidereal time',
      required: false,
      remote: true,
      global: false
    },
    ha: {
      label: 'HA',
      type: 'text',
      info: 'Hour angle',
      required: false,
      remote: true,
      global: false
    },
    airmass: {
      label: 'AIRMASS',
      type: 'text',
      info: 'Air mass measure',
      required: false,
      remote: true,
      global: false
    },
    jd: {
      label: 'JD',
      type: 'text',
      info: 'Geocentric Julian day (Greenwich)',
      required: false,
      remote: true,
      global: false
    },
    exptime: {
      label: 'EXPTIME',
      type: 'text',
      info: 'Integration time in seconds',
      required: false,
      remote: true,
      global: false
    },
    // End Remote Metadata
    plateN: {
      label: 'PLATE-N',
      type: 'text',
      info: 'Identification number',
      required: true,
      global: true
    },
    /* gain: {
      label: 'GAIN',
      type: 'text',
      info: 'Gain, electrons per adu',
      required: false
    },
    noise: {
      label: 'NOISE',
      type: 'text',
      info: 'Read noise',
      required: false
    }, */
    // selector
    imageTyp: {
      label: 'IMAGETYP',
      type: 'text',
      info: 'Object, dark, zero, etc',
      required: false,
      options: getImageTyp(),
      default: getImageTypDef(),
      global: false
    },
    observer: {
      label: 'OBSERVER',
      type: 'text',
      info: 'Observer name',
      required: false,
      options: getObserver(),
      default: getObserverDef(),
      global: false
    },
    digitali: {
      label: 'DIGITALI',
      type: 'text',
      info: 'Digitalizer name',
      required: false,
      options: getDigitali(),
      default: getDigitaliDef(),
      global: true
    },
    scanner: {
      label: 'SCANNER',
      type: 'text',
      info: 'Scanner name',
      required: false,
      options: getScanner(),
      default: getScannerDef(),
      global: true
    },
    scanRes: {
      label: 'SCAN-RES',
      type: 'text',
      info: 'Scanner dpi resolution',
      required: false,
      options: getScanres(),
      default: getScanresDef(),
      global: true
    },
    scanCol: {
      label: 'SCAN-COL',
      type: 'text',
      info: 'Scanner color resolution',
      required: false,
      options: getScancol(),
      default: getScancolDef(),
      required: false,
      global: true
    },
    software: {
      label: 'SOFTWARE',
      type: 'text',
      info: 'Scan software',
      required: false,
      options: getSoftware(),
      default: getSoftwareDef(),
      global: true
    },
    detector: {
      label: 'DETECTOR',
      type: 'text',
      info: 'Detector',
      required: false,
      global: false
    }
  }
}

export {
  getMetadataFields,
  getDigitaliDef,
  getImageTypDef,
  getObserverDef,
  getScannerDef,
  getScanresDef,
  getScancolDef,
  getSoftwareDef
}
