const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const socketIO = require('socket.io');
const si = require('systeminformation');

const NOMBRE_APP = 'Monitor de recursos';
const PUERTO = 3000;
const INTERVALO_MS = 2000;
const MAX_INTENTOS = 3;
//let servidorActivo = false;
let leyendo = false;

function bytesAGB(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) {
    return 0;
  }
  return Number((bytes / 1073741824).toFixed(2));
}

function porcentaje(parte, total) {
  if (typeof total !== 'number' || total <= 0) {
    return 0;
  }
  return Number(((parte / total) * 100).toFixed(1));
}

function redondear(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    return 0;
  }
  return Number(valor.toFixed(1));
}

function formatearUptime(segundos) {
  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  return dias + 'd ' + horas + 'h ' + minutos + 'm';
}

class MonitorSistema {

  async obtenerSO() {
    const so = await si.osInfo();
    const tiempo = si.time();

    return {
      hostname: so.hostname,
      distribucion: so.distro,
      version: so.release,
      kernel: so.kernel,
      arquitectura: so.arch,
      uptime: formatearUptime(tiempo.uptime),
      uptimeSegundos: tiempo.uptime
    };
  }

  async obtenerCpu() {
    const info = await si.cpu();
    const carga = await si.currentLoad();
    const nucleos = [];

    for (let i = 0; i < carga.cpus.length; i++) {
      nucleos.push({
        nucleo: i + 1,
        uso: redondear(carga.cpus[i].load)
      });
    }

    let temperatura = 'No disponible';

    try {
      const temp = await si.cpuTemperature();

      if (temp.main !== null && typeof temp.main === 'number' && temp.main > 0) {
        temperatura = redondear(temp.main);
      }
    } catch (e) {
      console.error('Temperatura no disponible: ' + e.message);
    }

    return {
      fabricante: info.manufacturer,
      modelo: info.brand,
      nucleosFisicos: info.physicalCores,
      nucleosLogicos: info.cores,
      velocidadGHz: info.speed,
      uso: redondear(carga.currentLoad),
      temperatura: temperatura,
      nucleos: nucleos
    };
  }

  async obtenerMemoria() {
    const mem = await si.mem();

    let usada = mem.total - mem.available;

    if (usada < 0) {
      usada = 0;
    }

    return {
      totalGB: bytesAGB(mem.total),
      usadaGB: bytesAGB(usada),
      libreGB: bytesAGB(mem.available),
      uso: porcentaje(usada, mem.total),
      swapTotalGB: bytesAGB(mem.swaptotal),
      swapUsadaGB: bytesAGB(mem.swapused)
    };
  }

  async obtenerDiscos() {
    const particiones = await si.fsSize();
    const discos = [];

    for (let i = 0; i < particiones.length; i++) {
      const p = particiones[i];

      if (p.size > 0) {
        let uso = redondear(p.use);

        if (!Number.isFinite(uso)) {
          uso = porcentaje(p.used, p.size);
        }

        discos.push({
          punto: p.mount,
          filesystem: p.fs,
          tipo: p.type,
          totalGB: bytesAGB(p.size),
          usadoGB: bytesAGB(p.used),
          libreGB: bytesAGB(p.available),
          uso: uso
        });
      }
    }

    return discos;
  }

  async obtenerRed() {
    const interfaces = await si.networkInterfaces();
    let principal = null;

    for (let i = 0; i < interfaces.length; i++) {
      if (interfaces[i].internal === false && interfaces[i].ip4 !== '') {
        principal = interfaces[i];
        break;
      }
    }

    if (principal === null) {
      return {
        interfaz: 'Sin conexion',
        ip: '-',
        mac: '-',
        velocidadMbps: 0
      };
    }

    let velocidad = principal.speed;

    if (typeof velocidad !== 'number') {
      velocidad = 0;
    }

    return {
      interfaz: principal.iface,
      ip: principal.ip4,
      mac: principal.mac,
      velocidadMbps: velocidad
    };
  }

  async obtenerTodo() {
    const r = await Promise.all([
      this.obtenerSO(),
      this.obtenerCpu(),
      this.obtenerMemoria(),
      this.obtenerDiscos(),
      this.obtenerRed()
    ]);

    return {
      aplicacion: NOMBRE_APP,
      fecha: new Date().toISOString(),
      sistema: r[0],
      cpu: r[1],
      memoria: r[2],
      discos: r[3],
      red: r[4]
    };
  }

  async leerConReintentos() {
    let intentos = 0;
    let datos = null;

    do {
      intentos++;

      try {
        datos = await this.obtenerTodo();
      } catch (e) {
        console.error(
          'Lectura ' + intentos + '/' + MAX_INTENTOS + ': ' + e.message
        );
      }

    } while (datos === null && intentos < MAX_INTENTOS);

    return datos;
  }
}

const monitor = new MonitorSistema();
const app = express();
const servidorHttp = http.createServer(app);

const io = new socketIO.Server(servidorHttp, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const rutaPublic = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(rutaPublic));

app.get('/api/sistema', async function (req, res) {
  try {
    const datos = await monitor.leerConReintentos();

    if (datos === null) {
      res.status(500).json({ error: 'No se pudo leer el hardware' });
    } else {
      res.json(datos);
    }

  } catch (e) {
    console.error('Error API: ' + e.message);
    res.status(500).json({ error: 'Error interno del monitor' });
  }
});

app.get('/api/so', async function (req, res) {
  try {
    res.json(await monitor.obtenerSO());
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener el sistema' });
  }
});

app.get('/api/cpu', async function (req, res) {
  try {
    res.json(await monitor.obtenerCpu());
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener CPU' });
  }
});

app.get('/api/memoria', async function (req, res) {
  try {
    res.json(await monitor.obtenerMemoria());
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener memoria' });
  }
});

app.get('/api/discos', async function (req, res) {
  try {
    res.json(await monitor.obtenerDiscos());
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener discos' });
  }
});

app.get('/api/red', async function (req, res) {
  try {
    res.json(await monitor.obtenerRed());
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener red' });
  }
});

io.on('connection', async function (socket) {
  console.log('Cliente conectado: ' + socket.id);

  try {
    const datos = await monitor.leerConReintentos();

    if (datos !== null) {
      socket.emit('sistema', datos);
    } else {
      socket.emit('error-monitor', 'No se pudo leer el equipo');
    }

  } catch (e) {
    console.error('Primer envio fallido: ' + e.message);
    socket.emit('error-monitor', 'Fallo la primera lectura');
  }

  socket.on('disconnect', function () {
    console.log('Cliente desconectado: ' + socket.id);
  });
});

setInterval(async function () {
  if (io.engine.clientsCount === 0 || leyendo === true) {
    return;
  }

  leyendo = true;

  try {
    const datos = await monitor.leerConReintentos();

    if (datos !== null) {
      io.emit('sistema', datos);
    } else {
      io.emit('error-monitor', 'No se pudo leer el sistema');
    }

  } catch (e) {
    console.error('Error durante emision: ' + e.message);
    io.emit('error-monitor', 'Error de actualizacion');
  }

  leyendo = false;

}, INTERVALO_MS);

servidorHttp.listen(PUERTO, '0.0.0.0', function () {
  console.log(NOMBRE_APP + ' escuchando en puerto ' + PUERTO);
  console.log('API local: http://localhost:' + PUERTO + '/api/sistema');
  console.log('Panel web: http://IP_DE_LA_VM:' + PUERTO);
});

