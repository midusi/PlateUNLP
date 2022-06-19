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
    imageUrl: "https://cdn-icons.flaticon.com/png/512/3756/premium/3756620.png?token=exp=1655600396~hmac=ab481900f0cac56c37363c6df46cb1f6",
    imageWidth: 250,
    imageHeight: 250,
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

function showAlert({ title = 'Cargado', message = 'Se cargo con éxito', type = 'success' } = {}) {
  Swal.close()
  Swal.fire({
  icon: type,
  title: title,
  text: message,
  showConfirmButton: false,
  timer: 1000
  })
}

function errorAlert({ title = 'Sucedio un error!', message = 'Ha ocurrido un error en el servidor.' } = {}) {
  Swal.close()
  Swal.fire(title, message, 'error')
}

async function closeAlert() {
  await Swal.close()
}

export {
  loadingAlert, closeAlert,serverAlert, errorAlert, showAlert, confirmAlert,deleteAlert
}
