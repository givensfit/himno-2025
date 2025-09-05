// nos conectamos con el servidor de sockets
const socket = io()

// referencias a los elementos del DOM
const dias = document.getElementById('dias')
const horas = document.getElementById('horas')
const minutos = document.getElementById('minutos')
const segundos = document.getElementById('segundos')
const temporizadorContenedor = document.getElementById('temporizador-contenedor')
const himnoAudio = document.getElementById('himnoAudio')

const userTotalElement = document.getElementById('userTotal')

// switch para el audio ON/OFF
const audioContainer = document.getElementById('audio-container')
const audioSwitch = document.getElementById('audio-switch')

// variables para saber si el himno esta en curso y guardar el tiempo transcurrido
let himnoEnCurso = false
let tiempoHimno = 0
let intervaloTiempoHimno = null

const actualizarTiempoHimno = () => {
  if(intervaloTiempoHimno === null) {
    intervaloTiempoHimno = setInterval(() => {
      tiempoHimno += 1000
    }, 1000)
  }
}

// Actualizamos el conteo total de IPs
// Escucha del evento 'totalIpsUpdate' del servidor
socket.on('totalIpsUpdate', (count) => {
    // console.log(`Socket.IO: Recibido nuevo total de IPs: ${count}`)
    if(userTotalElement) {
        userTotalElement.textContent = count
    }
})

// Cuando la página carga por primera vez, pedimos el conteo inicial
// Lo hacemos con un fetch, pero la próxima actualización ya será vía sockets
fetch('/conteo-ips')
    .then(response => response.json())
    .then(data => {
        if (userTotalElement) {
            userTotalElement.textContent = data.total_ips
            console.log(`Conteo inicial de cargado: ${data.total_ips}`)
        }
    })
    .catch(error => {
        console.error('Error al obtener el conteo total de usuarios:', error)
        if (userTotalElement) {
            userTotalElement.textContent = 'Error'
        }
    })

// se actualiza el conteo de los usuarios en linea
// escucha del evento 'userCountUpdate' del servidor
socket.on('userCountUpdate', (count) => {
  const userCountElement = document.querySelector('#userCount')
  if(userCountElement) {
    userCountElement.textContent = count
  }
})

// actualización del temporizador
// escucha del evento 'countdownUpdate' del servidor
socket.on('countdownUpdate', (data) => {
  if(data.dias < 0) { // la cuenta regresiva ha terminado
    temporizadorContenedor.style.display = 'none'

    const fraseHimno = document.getElementById('frase-himno')
    if(!fraseHimno) {
      const fraseDiv = document.createElement('div')
      fraseDiv.id = 'frase-himno'
      fraseDiv.innerHTML = `
        <p>¡Es la hora!</p> 
        <p><span>JUNTOS</span> alcemos la voz sin miedo y hagamos que el mundo nos escuche.</p>
        <div class='tags'>
          <p>#vivamexico</p>
          <p>#mxlibre</p>
        </div>`

      document.querySelector('.temporizador-frase').appendChild(fraseDiv)
    }
  } else {
    dias.innerHTML = data.dias
    horas.innerHTML = data.horas
    minutos.innerHTML = data.minutos
    segundos.innerHTML = data.segundos
  }
})

// reproducción del himno
// escucha del evento 'iniciarHimno' del servidor
socket.on('iniciarHimno', () => {
      // temporizadorContenedor.innerHTML = '¡Es la hora!'
      himnoEnCurso = true
      actualizarTiempoHimno()


      if(audioSwitch.checked) {
        himnoAudio.play()
          .catch(e => console.error("Error al reproducir el Himno automáticamente:", e))
      }
})

// manejo de la reproducción del himno cuando entre un usuario más tarde
socket.on('playHimno', (tiempoTranscurrido) => {
  // temporizadorContenedor.innerHTML = '¡Es la hora!'
  himnoEnCurso = true
  tiempoHimno = tiempoTranscurrido
  actualizarTiempoHimno() // todo: mandar tambien el tiempoTranscurrido

  if(audioSwitch.checked) {
    himnoAudio.currentTime = tiempoHimno / 1000
    himnoAudio.play()
      .catch(e => console.error("Error al reproducir el Himno:", e))

  }

  // if(audioSwitch.checked) {
  // }
})

audioSwitch.addEventListener('change', () => {
  if(audioSwitch.checked) { // si el switch esta activo
    if(himnoEnCurso) { // si el himno ya esta en reproducción
      himnoAudio.currentTime = tiempoHimno / 1000
      himnoAudio.play()
        .catch(e => console.error("Error al reanudar el Himno:", e))
    }
  } else {
    himnoAudio.pause()
  }
})

himnoAudio.addEventListener('ended', () => {
  audioContainer.style.display = 'none'
  document.querySelector('.temporizador-frase').style.display = 'none'
  
  const mensajeFinal = document.createElement('div')
  mensajeFinal.innerHTML = `
    <p>Gracias por unirte a esta celebración</p>
    <p>¡Viva México!</p>`
  mensajeFinal.classList.add('mensaje-final')
  document.querySelector('main').appendChild(mensajeFinal)

  // activamos la animación del confeti
  const jsConfetti = new JSConfetti()
  jsConfetti.addConfetti({
    confettiColors: [
      '#006847',
      '#ffffff',
      '#CE1126',
    ],
  })
})

/*
const fechaObjetivo = new Date('September 16, 2025 15:00:00 GMT-0600');

const x = setInterval(function() {
  const ahora = new Date().getTime();
  const distancia = fechaObjetivo - ahora;

  const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

  document.getElementById("dias").innerHTML = dias;
  document.getElementById("horas").innerHTML = horas;
  document.getElementById("minutos").innerHTML = minutos;
  document.getElementById("segundos").innerHTML = segundos;

  if (distancia < 0) {
    clearInterval(x);
    document.getElementById("temporizador-contenedor").innerHTML = "¡Es la hora!";
    reproducirHimno();
  }
}, 1000);

function reproducirHimno() {
  const himno = document.getElementById('himnoAudio');
  himno.play();
}
*/