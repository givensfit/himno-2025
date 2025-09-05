// configuración de express, http, socket.io
const express = require('express')
const socketIo = require('socket.io')
const http = require('http')
const fs = require('fs')
const path = require('path')

const contarIP = require('./contador')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// rutas de archivos
const logFile = path.join(__dirname, 'ips_visitadas.json')
const totalFile = path.join(__dirname, 'conteo_total.json')


// Variable en memoria para el conteo total
let totalIpsUnicas = { count: 0 }

// valores entre servidor & frontend
const fecha = new Date('September 15, 2025 15:00:00 GMT-0600')
let userCount = 0 // usuarios conectados
let himnoStarted = false // bandera para saber si ya inicio el himno
let himnoStartTime = null // sincronización del tiempo entre el audio y los usuarios

// Función para cargar el conteo total al inicio
const cargarConteoTotal = () => {
    fs.readFile(totalFile, 'utf8', (err, data) => {
        if (!err) {
            try {
                const totalData = JSON.parse(data)
                totalIpsUnicas.count = totalData.total
                console.log(`Conteo total de IPs cargado: ${totalIpsUnicas.count}`)
            } catch (e) {
                console.error("Error al cargar el conteo total:", e)
                totalIpsUnicas.count = 0;
            }
        } else {
            // Si el archivo no existe, lo creamos con 0
            fs.writeFile(totalFile, JSON.stringify({ total: 0 }), 'utf8', (err) => {
                if(err) console.error("Error al crear el archivo de conteo total.")
            })
        }
    })
}

cargarConteoTotal();

// archivos estáticos de la carpeta public
app.use(express.static('public'))

app.use(contarIP(io, totalIpsUnicas, totalFile, logFile))


// iniciamos la configuración con los sockets
// control sobre los usuarios
io.on('connection', socket => {
    // por cada conexión que se crea, un usuario es conectado
    userCount++
    // console.log(`nuevo usuario conectado, Total: ${userCount}`)

    // se envía el conteo actualizado por cada usuario que se conecta
    io.emit('userCountUpdate', userCount)

    // Enviamos el conteo total de IPs al usuario que se acaba de conectar
    socket.emit('totalIpsUpdate', totalIpsUnicas.count)

    // si el himno ya esta en reproducción
    if(himnoStarted) {
        // entonces que se reproduzca desde el tiempo correcto
        const tiempoTranscurrido = new Date() - himnoStartTime
        socket.emit('playHimno', tiempoTranscurrido)
    }

    // enviamos el total de IPs al usuario que se acaba de conectar
    socket.emit('totalIpsUpdate', totalIpsUnicas.count)

    // actualizamos el conteo por cada usuario que se desconecta
    socket.on('disconnect', () => {
        userCount--
        // console.log(`usuario desconectado, Total: ${userCount}`)

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

// Ruta para que la página web obtenga el conteo total al cargar
app.get('/conteo-ips', (req, res) => {
    res.status(200).json({ total_ips: totalIpsUnicas.count })
})

app.get('/', (req, res) => {
    console.log('¡contador IPs funcionando!')
})

// configuración del puerto de escucha
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`servidor corriendo en el purto: ${PORT}`)
})