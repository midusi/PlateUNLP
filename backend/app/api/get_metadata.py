from flask import request, jsonify
from astroquery.simbad import Simbad
from app.helpers.metadatalib import simbad_sptype,epoca, simbad_cooJ1950, hora_local, tiempo_sidereo, angulo_horario, calculate_jd, calculate_airmass
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
        simbad = Simbad().query_object(metadata['OBJECT'])
        metadata = {**metadata, **{
        "MAIN-ID": simbad['MAIN_ID'][0],
        "RA2000": simbad['RA'][0].replace(' ', ':'),
        "DEC2000": simbad['DEC'][0].replace(' ', ':'),
        "SPTYPE": simbad_sptype(metadata['OBJECT']),
        "EQUINOX": epoca(metadata['DATE-OBS']),
        "EPOCH": epoca(metadata['DATE-OBS'])
        }}
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

        # print("Exception type : %s " % ex_type.__name__)
        # print("Exception message : %s" %ex_value)
        # print("Stack trace : %s" %stack_trace)
        data = {
            'message': message,
            'metadata': {}
        }
        return jsonify(data), 400
    
    try:
        ra, dec = simbad_cooJ1950(metadata["RA2000"], metadata["DEC2000"], metadata["EPOCH"])
        ra1950, dec1950 = simbad_cooJ1950(metadata["RA2000"], metadata["DEC2000"])

        time_obs = hora_local(metadata["OBSERVAT"] , metadata["DATE-OBS"], metadata["UT"])
        st = tiempo_sidereo(metadata["OBSERVAT"], metadata["DATE-OBS"], metadata["UT"])
    except USE:
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

    ha = angulo_horario(ra1950, st)
    metadata = {**metadata, **{
    "RA": ra,
    "DEC": dec,
    "RA1950": ra1950,
    "DEC1950": dec1950,
    "TIME-OBS": time_obs,
    "ST": st,
    "HA": ha,
    "AIRMASS": calculate_airmass(metadata["OBSERVAT"].split(':')[0], ha, ra, dec),
    "JD": calculate_jd(metadata['DATE-OBS'], time_obs)
    }}
    
    
    metadata.pop('OBSERVAT', None)

    # api response data
    data = {
        'message': 'success',
        'metadata': metadata
    }
        
    return jsonify(data)