import apiWorkspace from '../api/workspace'
import {
  closeAlert,serverAlert
} from '../helpers/Alert'

export async function serverUp(){
  try{
    const serverUp = await apiWorkspace.loadConfig();
    return true;
    }
    catch{
      closeAlert();
      await serverAlert({title: 'Se perdio la conexion con el servidor',text: 'La aplicacion se reiniciara',confirmButtonText : 'Aceptar'});
      location.reload()
      return false;
    }
}

