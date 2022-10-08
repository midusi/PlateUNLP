from flask import request, jsonify
from app.helpers.metadatalib import angulo_horario, calculate_jd, calculate_airmass
from app.helpers.metadata_field_updaters.Updater_mainId_ra2000_dec2000 import Updater_mainId_ra2000_dec2000
from app.helpers.metadata_field_updaters.Updater_SPTYPE import Updater_SPTYPE
from app.helpers.metadata_field_updaters.Updater_EQUINOX import Updater_EQUINOX
from app.helpers.metadata_field_updaters.Updater_EPOCH import Updater_EPOCH
from app.helpers.metadata_field_updaters.Updater_RA_DEC import Updater_RA_DEC
from app.helpers.metadata_field_updaters.Updater_RA1950_DEC1950 import Updater_RA1950_DEC1950
from app.helpers.metadata_field_updaters.Updater_TIMEOBS import Updater_TIMEOBS
from app.helpers.metadata_field_updaters.Updater_ST import Updater_ST
from app.helpers.metadata_field_updaters.Updater_HA import Updater_HA
from app.helpers.metadata_field_updaters.Updater_AIRMASS import Updater_AIRMASS
from app.helpers.metadata_field_updaters.Updater_JD import Updater_JD
import sys
import traceback
from astropy.coordinates.errors import UnknownSiteException as USE

def api_get_metadata():
    
    # Inicialización metadatos iniciales
    metadata = {
        "OBJECT" : request.json['OBJECT'],
        "OBSERVAT": request.json['OBSERVAT'],
        "DATE-OBS": request.json['DATE-OBS'],
        "UT": request.json['UT'],
        # "EXPTIME": 960, # No usado
        # "PLATE-N": "A4430" # No usado
    }
    
    try:
        Updater_mainId_ra2000_dec2000.update(metadata)
        Updater_SPTYPE.update(metadata)
        Updater_EQUINOX.update(metadata)
        Updater_EPOCH.update(metadata)
    except Exception as e:
        # Get current system exception
        ex_type, ex_value, ex_traceback = sys.exc_info()
        # Extract unformatter stack traces as tuples
        trace_back = traceback.extract_tb(ex_traceback)
        # Format stacktrace
        stack_trace = list()
        message = ''
        for trace in trace_back:
            stack_trace.append("File : %s , Line : %d, Func.Name : %s, Message : %s" % (trace[0], trace[1], trace[2], trace[3]))
            if 'MAIN-ID' in trace[3]:
                message = 'El OBJECT es incorrecto.'
        data = {
            'message': message,
            'metadata': {}
        }
        return jsonify(data), 400
    
    try:
        Updater_RA_DEC.update(metadata)
        Updater_RA1950_DEC1950.update(metadata)
        Updater_TIMEOBS.update(metadata)   
        Updater_ST.update(metadata)
    except USE:
        print("NoOK")
        data = {
            'message': 'El observatorio no esta en la base de datos.',
            'metadata': {}
        }
        return jsonify(data), 400
    except Exception as e:
        print(e)
        data = {
            'message': 'El UT es incorrecto.',
            'metadata': {}
        }
        return jsonify(data), 400   

    Updater_HA.update(metadata)
    Updater_AIRMASS.update(metadata)
    Updater_JD.update(metadata)
    
    metadata.pop('OBSERVAT', None)

    # api response data
    data = {
        'message': 'success',
        'metadata': metadata
    }
        
    return jsonify(data)