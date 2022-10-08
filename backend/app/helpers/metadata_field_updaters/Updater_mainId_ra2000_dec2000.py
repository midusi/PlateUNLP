from app.helpers.metadata_field_updaters.Interface_field_updater import FieldUpdater
from astroquery.simbad import Simbad

class Updater_mainId_ra2000_dec2000(FieldUpdater):
    
    @classmethod
    def update(cls, metadata):
        if (True):
            simbad = Simbad().query_object(metadata['OBJECT'])
            metadata["MAIN-ID"] = simbad['MAIN_ID'][0]
            metadata["RA2000"] = simbad['RA'][0].replace(' ', ':')
            metadata["DEC2000"] = simbad['DEC'][0].replace(' ', ':')