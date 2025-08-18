// configuración de express, http, socket.io
const express = require('express')
const socketIo = require('socket.io')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// valores entre servidor & frontend
const fecha = new Date('September 15, 2025 15:00:00 GMT-0600')
let userCount = 0 // usuarios conectados
let himnoStarted = false // bandera para saber si ya inicio el himno
let himnoStartTime = null // sincronización del tiempo entre el audio y los usuarios

// archivos estáticos de la carpeta public
app.use(express.static('public'))

// iniciamos la configuración con los sockets
// control sobre los usuarios
io.on('connection', socket => {
    // por cada conexión que se crea, un usuario es conectado
    userCount++
    console.log(`nuevo usuario conectado, Total: ${userCount}`)

    // se envía el conteo actualizado por cada usuario que se conecta
    io.emit('userCountUpdate', userCount)

    // si el himno ya esta en reproducción
    if(himnoStarted) {
        // entonces que se reproduzca desde el tiempo correcto
        const tiempoTranscurrido = new Date() - himnoStartTime
        socket.emit('playHimno', tiempoTranscurrido)
    }

    // actualizamos el conteo por cada usuario que se desconecta
    socket.on('disconnect', () => {
        userCount--
        console.log(`usuario desconectado, Total: ${userCount}`)

        io.emit('userCountUpdate', userCount)
    })
})

// control sobre el temporizador
// se envia el tiempo restante a los usuarios cada segundo
setInterval(() => {
    const ahora = new Date().getTime()
    const distancia = fecha.getTime() - ahora

    // se calcula el tiempo restante
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24))
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000)

    io.emit('countdownUpdate', { dias, horas, minutos, segundos })

    // si la cuenta regresiva termina, se emite el evento para iniciar el himno
    if(distancia < 0 && !himnoStarted) {
        io.emit('iniciarHimno')
        himnoStarted = true
        himnoStartTime = new Date()
        console.log('El Himno ha iniciado!')
    }
}, 1000);


// configuración del puerto de escucha
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`servidor corriendo en el purto: ${PORT}`)
})