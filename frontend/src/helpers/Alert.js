import Swal from 'sweetalert2'

function loadingAlert(message = 'Cargando...') {
  Swal.fire({
    title: message,
    allowEscapeKey: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

function confirmAlert({
  title = 'Quieres exportar a .FITS?',
  confirmButtonText = 'Guardar',
  denyButtonText = 'No guardar',
  succesFunc = () => {}
} = {}) {
  Swal.fire({
    title,
    showDenyButton: true,
    showCancelButton: false,
    confirmButtonText,
    denyButtonText
  })
    .then((result) => {
      if (result.isConfirmed) succesFunc()
    })
}


async function serverAlert({
  title = 'No fue posible conectarse al servidor',
  text =  '',
  confirmButtonText = 'Reintentar',
  succesFunc = () => {}
} = {}) {
  await Swal.fire({
    title,
    text,
    iconHtml: '<img style="padding: 5px;" src="https://cdn-icons.flaticon.com/png/512/3756/premium/3756620.png?token=exp=1655849631~hmac=edb45575494b09295929db34b322b6b8" width="190" height="200">',
    confirmButtonText
  })
}

function deleteAlert({
  title = '¿Seguro que quieres borrar el espectro?',
  text =  'Se perderan los datos relacionados',
  confirmButtonText = 'Borrar',
  denyButtonText = 'Cancelar',
  succesFunc = () => {}
} = {}) {
  Swal.fire({
    title,
    text,
    showDenyButton: true,
    showCancelButton: false,
    confirmButtonText,
    denyButtonText
  })
    .then((result) => {
      if (result.isConfirmed) succesFunc()
    })
}

function showAlert({ title = 'Se cargo con exito', type = 'success' } = {}) {
  Swal.close()
  Swal.fire({
  icon: type,
  title: title,
  showConfirmButton: false,
  timer: 1000
  })
}

function errorAlert({ title = 'Sucedio un error!', message = 'Ha ocurrido un error en el servidor.' } = {}) {
  Swal.close()
  Swal.fire(title, message, 'error')
}

async function remoteErrorAlert({
  title = 'Ha ocurrido un error en el servidor', 
  text = '¿Quiere cargar los datos de forma manual?',
  } = {}) {
  let response = false;
  Swal.close()
  await Swal.fire({title, text, icon: 'error', showDenyButton: true,
  showCancelButton: false,
  confirmButtonText: "Aceptar",
  denyButtonText: "Cancelar"})
  .then((result) => {
    if (result.isConfirmed) response = true;
  })

  return response;
}

async function closeAlert() {
  await Swal.close()
}

export {
  loadingAlert, remoteErrorAlert, closeAlert, serverAlert, errorAlert, showAlert, confirmAlert, deleteAlert
}
