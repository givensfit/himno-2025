const fs = require('fs')

const contarIP = (io, totalIpsUnicas, totalFile, logFile) => (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

    if (ip.includes('::ffff:')) {
        ip = ip.split(':').pop()
    }

    // NUEVA LÍNEA: Si la IP es una lista separada por comas, toma la primera.
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    fs.readFile(logFile, 'utf8', (err, data) => {
        let ips = {}
        if (!err) {
            try {
                ips = JSON.parse(data)
            } catch (e) {
                console.error("Error al parsear el archivo JSON de IPs:", e)
                ips = {}
            }
        }

        if (!ips[ip]) {
            // Si la IP no existe, la agregamos
            ips[ip] = { fecha: new Date().toISOString() }
            
            // Incrementamos el contador en memoria
            totalIpsUnicas.count++

            // Guardamos ambos archivos de forma asíncrona
            fs.writeFile(logFile, JSON.stringify(ips, null, 2), (err) => {
                if (err) console.error("Error al escribir el archivo de IPs.")
            })
            fs.writeFile(totalFile, JSON.stringify({ total: totalIpsUnicas.count }), 'utf8', (err) => {
                if (err) console.error("Error al escribir el conteo total.")
            })

            // emitimos el nuevo conteo a todos los clientes
            io.emit('totalIpsUpdate', totalIpsUnicas.count)
        }
    })

    next()
}

module.exports = contarIP