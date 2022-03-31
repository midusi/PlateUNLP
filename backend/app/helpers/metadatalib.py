from astroquery.simbad import Simbad
from astropy.time import Time
from astropy.coordinates import SkyCoord
from astropy.coordinates import FK4
import astropy.units as unit
from astroplan import Observer
from timezonefinder import TimezoneFinder
import julian
import pytz, datetime
from datetime import timedelta
import math

def simbad_sptype(obj_metadata):    
    s = Simbad()
    s.add_votable_fields('sptype')
    result = s.query_object(obj_metadata)
    return result['SP_TYPE'][0]

def epoca(dateobs):
    t = Time(dateobs)
    t.format= 'decimalyear'
    epoch= "{:.1f}".format(t.value)
    return epoch


def divide_date(date, format, decimals):
    # print(date, format)
    sep = format.split(':')
    date_h = date[:date.find(sep[0])]
    date_m = date[date.find(sep[0])+1:date.find(sep[1])]
    date_s = date[date.find(sep[1])+1:date.find(sep[2])][:decimals]
    return date_h + ':' + date_m + ':' + date_s

def simbad_cooJ1950(ra, dec, epoch='J1950.0'):
    coords= ra + ' ' + dec
    if epoch != 'J1950.0':
      """
      Si epoch != J1950.0 el calculo que se hace es para emular las coodenadas
      del telescopio, es decir las coordenadas para la época correspondiente a
      la fecha de observación.
      Si epoch == J1950.0 se calculan las coordenadas de la estrella para la 
      époce J1950.0
      """
      epoch= 'J' + epoch
    c = SkyCoord(coords, frame='icrs', unit=(unit.hourangle, unit.deg))
    c_fk4= c.transform_to(FK4(equinox='B1950', obstime=epoch))
    coords= c_fk4.to_string('hmsdms')
    coords= coords.split(' ')
    ra= coords[0]
    dec= coords[1]
    raJ1950= divide_date(ra, 'h:m:s', 7)
    decJ1950= divide_date(dec, 'd:m:s', 7)
    return raJ1950, decJ1950

# Calculo con el tiempo_sidereo
def hora_local(observat, dateobs, ut):
    # Calculo las coordenadas terrestres del observatorio
    observat= observat[0:observat.find(':')]
    obs= Observer.at_site(observat)
    lon= str(obs.location.lon)
    lat= str(obs.location.lat)
    
    lon_d= int(lon.split('d')[0])
    lon_m= int(lon.split('d')[1].split('m')[0])
    lon_s= float(lon.split('d')[1].split('m')[1].split('s')[0])
    longitud= (lon_s/60. + lon_m)/60. + lon_d # longitud terrestre
            
    lat_d= int(lat.split('d')[0])
    lat_m= int(lat.split('d')[1].split('m')[0])
    lat_s= float(lat.split('d')[1].split('m')[1].split('s')[0])
    latitud= (lat_s/60. + lat_m)/60. + lat_d # latitud terrestre
            
    # Calculo la hora local de la observacion   
    time = Time(dateobs + ' ' + ut)
    tf = TimezoneFinder()
    tz= tf.timezone_at(lat= latitud, lng= longitud) # huso horario del observatorio       
    obs_time= datetime.datetime.now(pytz.timezone(tz))
    utcoffset= obs_time.utcoffset().total_seconds()/60./60. # Diferencia horaria con Greenwich
    time = time + timedelta(hours=utcoffset) # hora local de observacion
    t= Time(time)

    return t.strftime("%H:%M:%S")

def tiempo_sidereo(observat, dateobs, ut):
    # Calculo las coordenadas terrestres del observatorio
    observat= observat[0:observat.find(':')]
    obs= Observer.at_site(observat)
    time = Time(dateobs + ' ' + ut)
    t= Time(time)#, format='isot', scale='utc')
    t.format= 'decimalyear'
    st= str(obs.local_sidereal_time(t, 'mean'))
    return divide_date(st, 'h:m:s', 5)

def angulo_horario(ra, ts):

    # paso a fraccion de hora RA y ST para calcular el angulo horario
    if type(ra) is float:
        ra_fh= ra
    elif type(ra) is str:
        ra_h= ra[:ra.find(':')]
        ra= ra[ra.find(':')+1:]
        ra_m= ra[:ra.find(':')]
        ra_s= ra[ra.find(':')+1:]
        ra_fh= float(ra_h) + float(ra_m)/60. + float(ra_s)/60./60.
    else:
        print("El campo RA no esta en el formato correcto.")

    ts_h= ts[:ts.find(':')]
    ts= ts[ts.find(':')+1:]
    ts_m= ts[:ts.find(':')]
    ts_s= ts[ts.find(':')+1:]
    ts_fh= float(ts_h) + float(ts_m)/60. + float(ts_s)/60./60.

    # calculo el angulo horario          
    ha_fh= ts_fh - ra_fh
                    
    if ha_fh < 0:
        ha_fh= ha_fh + 24

    ha_h= int(ha_fh)
    ha_m= int( (ha_fh - ha_h) * 60. )
    ha_s= ( (ha_fh - ha_h) * 60. - ha_m ) * 60.

    ha= "{0:0>2d}:{1:0>2d}:{2:.2f}".format(ha_h, ha_m, ha_s)                    
    
    return ha

def calculate_jd(dateobs, timeObs):
        fecha= []
        for f in dateobs.split('-'):
            fecha.append(int(f))
        hora_timeObs= []
        for h in timeObs.split(':'):
            hora_timeObs.append(int(h))
        
        if len(hora_timeObs) < 3:
          for x in range(len(hora_timeObs) - 1, 2):
            hora_timeObs.append(0)
            
        dt= datetime.datetime(fecha[0], fecha[1], fecha[2], hora_timeObs[0], hora_timeObs[1], hora_timeObs[2])
        jd= julian.to_jd(dt + datetime.timedelta(hours=0), fmt='jd')

        return "{:.5f}".format(jd)

def calculate_airmass(observat, ha, ra, dec):

        observatory= Observer.at_site(observat)
        lat= str(observatory.location.lat)
        
        lat_d= int(lat.split('d')[0])
        lat_m= int(lat.split('d')[1].split('m')[0])
        lat_s= float(lat.split('d')[1].split('m')[1].split('s')[0])
        lat_deg= (lat_s/60. + lat_m)/60. + lat_d

        ha_h= int(ha.split(':')[0])
        ha_m= int(ha.split(':')[1])
        ha_s= float(ha.split(':')[2])
        ha_hs= (ha_s/60. + ha_m)/60. + ha_h
        ha_deg= ha_hs * 24. / 360.

        ra_h= int(ra.split(':')[0])
        ra_m= int(ra.split(':')[1])
        ra_s= float(ra.split(':')[2])
        ra_hs= (ra_s/60. + ra_m)/60. + ra_h
        # ra_deg= ra_hs * 24. / 360.
        
        dec_d= int(dec.split(':')[0])
        dec_m= int(dec.split(':')[1])
        dec_s= float(dec.split(':')[2])
        dec_deg= (dec_s/60. + dec_m)/60. + dec_d

        zz= math.sin(lat_deg) * math.sin(dec_deg) - math.cos(lat_deg) * math.cos(dec_deg) * math.cos(ha_deg)
        secz= 1./zz

        return "{:.5f}".format(secz)