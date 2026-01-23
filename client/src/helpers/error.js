import Swal from 'sweetalert2'

export default function showError(error) {
  console.log(error, "<<< error")
  
  if (error.response) {
    Swal.fire({
      title: 'Error!',
      text: error.response.data.message || "Something went wrong",
      icon: 'error'
    })
  } else {
    Swal.fire({
      title: 'Error!',
      text: "Something went wrong",
      icon: 'error'
    })
  }
}