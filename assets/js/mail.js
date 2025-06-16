// variable para almacenar el email al cual se enviara el mensaje
var emailUser = 'contacto@miguelangeldamianlopez.com'
// hacemos referencia al formulario
let $enviarMail = document.querySelector('#form-mail')

// funcion para validae el formulario
function validarEmail(email) {
	let expresion = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/

	if (!expresion.exec(email)) {
		return false
	} else {
		return true
	}
}

// enviar el mensaje
$enviarMail.addEventListener('submit', (e) => {
	// prevenimos el recargo cuando se haga el submit
	e.preventDefault()

		// capturamos los datos del formulario
		let $nombre = document.querySelector('#nombre').value
		let $telefono = document.querySelector('#telefono').value
		let $mensaje = document.querySelector('#mensaje').value
		let $correo = document.querySelector('#correo').value

		// si los campos estan vacios no envia
		if (
			$nombre === '' ||
			$telefono === '' ||
			$mensaje === '' ||
			$correo === ''
		) {
			swal('Error', 'Ingrese todos los datos', 'error')
		} else {
			// capturamos los datos del formulario y le aÃ±adimos un dato mas
			let formData = new FormData($enviarMail)
			formData.append('email', emailUser)

			const url = './forms/contacto.php'

			// utilizamos fetch para enviar los datos al backend
			fetch(url, {
				method: 'POST',
				body: formData,
			})
				/* .then((response) => response.text())
				.then((data) => console.log(data)) */
				.then((response) => response.json())
				.then((dato) => {
					if (!dato.error) {
						swal('Perfecto', dato.mensaje, 'success')
						$nombre = '';
						$telefono = '';
						$mensaje = '';
						$correo = '';
					} else {
						swal('Lo sentimos', dato.mensaje, 'warning')
					}
				})
		}
	//}
})