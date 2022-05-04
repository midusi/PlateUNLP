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

function deleteAlert({
  title = '¿Seguro que quieres borrar el espectro? Se perderan los datos relacionados',
  confirmButtonText = 'Borrar',
  denyButtonText = 'Cancelar',
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

function showAlert({ title = 'Cargado', message = 'Se cargo con éxito', type = 'success' } = {}) {
  Swal.close()
  Swal.fire(title, message, type)
}

function errorAlert({ title = 'Sucedio un error!', message = 'Ha ocurrido un error en el servidor.' } = {}) {
  Swal.close()
  Swal.fire(title, message, 'error')
}

function closeAlert() {
  Swal.close()
}

export {
  loadingAlert, closeAlert, errorAlert, showAlert, confirmAlert,deleteAlert
}
