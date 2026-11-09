
/* Monitor de Recursos GNU/Linux */
/* JavaScript del frontend */

// Esperar a que se cargue la página HTML
document.addEventListener("DOMContentLoaded", function () {

    console.log("Frontend del monitor iniciado correctamente");

    // Identificadores de las tarjetas del panel
    let elementos = [
        "cpu-uso",
        "ram-uso",
        "discos-lista",
        "red-lista",
        "so-nombre",
        "swap-uso"
    ];

    // Comprobar que los elementos existan en HTML
    for (let i = 0; i < elementos.length; i++) {

        let elemento = document.getElementById(elementos[i]);

        if (elemento !== null) {
            console.log("Elemento encontrado: " + elementos[i]);
        } else {
            console.log("Elemento no encontrado: " + elementos[i]);
        }

    }

    // Función para actualizar textos del panel
    function actualizarTexto(id, valor) {

        let elemento = document.getElementById(id);

        if (elemento !== null) {
            elemento.textContent = valor;
        }

    }

    // Función para actualizar las barras de progreso
    function actualizarBarra(id, porcentaje) {

        let barra = document.getElementById(id);

        if (barra !== null) {

            if (porcentaje < 0) {
                porcentaje = 0;
            }

            if (porcentaje > 100) {
                porcentaje = 100;
            }

            barra.style.width = porcentaje + "%";

        }

    }

    // Función para mostrar los datos de CPU
    function mostrarCPU(datos) {

        actualizarTexto("cpu-uso", datos.uso);
        actualizarTexto("cpu-modelo", datos.modelo);
        actualizarTexto("cpu-nucleos", datos.nucleosLogicos);

        actualizarBarra("cpu-barra", datos.uso);

    }

    // Función para mostrar los datos de memoria RAM
    function mostrarRAM(datos) {

        actualizarTexto("ram-uso", datos.uso);
        actualizarTexto("ram-total", datos.totalGB);
        actualizarTexto("ram-libre", datos.libreGB);

        actualizarBarra("ram-barra", datos.uso);

    }
  
    // Función para mostrar la información de discos
    function mostrarDiscos(datos) {

        let lista = document.getElementById("discos-lista");

        if (lista !== null) {

            lista.textContent = "";

            for (let i = 0; i < datos.length; i++) {

                let disco = datos[i];

                let parrafo = document.createElement("p");

                
                parrafo.textContent =
                    "Unidad: " + disco.punto +
                    " | Total: " + disco.totalGB + " GB" +
                    " | Disponible: " + disco.libreGB + " GB";


                lista.appendChild(parrafo);

            }

        }

    }


    
    // Función para mostrar la información de red
    function mostrarRed(datos) {

        let lista = document.getElementById("red-lista");

        if (lista !== null) {

            lista.textContent = "";

            let parrafo = document.createElement("p");

            parrafo.textContent =
                "Interfaz: " + datos.interfaz +
                " | IP: " + datos.ip +
                " | MAC: " + datos.mac +
                " | Velocidad: " + datos.velocidadMbps + " Mbps";

            lista.appendChild(parrafo);

        }

    }


    

    
    // Función para mostrar los datos del sistema operativo
    function mostrarSistemaOperativo(datos) {

        actualizarTexto("so-nombre", datos.distribucion);
        actualizarTexto("so-version", datos.version);
        actualizarTexto("so-arquitectura", datos.arquitectura);
        actualizarTexto("so-hostname", datos.hostname);
        actualizarTexto("so-uptime", datos.uptime);

    }


    
    // Función para mostrar los datos de memoria SWAP
    function mostrarSWAP(datos) {

        let total = datos.swapTotalGB;
        let usada = datos.swapUsadaGB;
        let libre = total - usada;
        let uso = 0;

        // Calcular el porcentaje de uso
        if (total > 0) {
            uso = Number(((usada / total) * 100).toFixed(1));
        }

        // Evitar valores negativos
        if (libre < 0) {
            libre = 0;
        }

        libre = Number(libre.toFixed(2));

        // Actualizar la tarjeta
        actualizarTexto("swap-uso", uso + "%");
        actualizarTexto("swap-total", total);
        actualizarTexto("swap-libre", libre);

        actualizarBarra("swap-barra", uso);

    }



    // Función para mostrar el estado de conexión
    function actualizarEstadoConexion(mensaje, tipo) {

        let estado = document.getElementById("estado-conexion");

        if (estado !== null) {
            estado.textContent = "Estado del servidor: " + mensaje;
            estado.className = "alert py-2 " + tipo;
        }

    }

    // Comprobar si Socket.IO está disponible
    if (typeof io === "undefined") {

        actualizarEstadoConexion(
            "Socket.IO todavía no está disponible",
            "alert-warning"
        );

    }

    // Conectar con el servidor mediante Socket.IO
    if (typeof io !== "undefined") {

        let socket = io();

        actualizarEstadoConexion(
            "Conectando...",
            "alert-warning"
        );

        // Cuando se establece la conexión
        socket.on("connect", function () {

            actualizarEstadoConexion(
                "Conectado",
                "alert-success"
            );

            console.log("Conexión con el servidor establecida");

        });

        // Cuando se pierde la conexión
        socket.on("disconnect", function () {

            actualizarEstadoConexion(
                "Desconectado",
                "alert-danger"
            );

            console.log("Conexión con el servidor perdida");

        });

        // Cuando ocurre un error de conexión
        socket.on("connect_error", function (error) {

            actualizarEstadoConexion(
                "Error de conexión",
                "alert-danger"
            );

            console.log("Error de conexión: " + error.message);

        });

        
        // Recibir las métricas enviadas por el backend
        socket.on("sistema", function (datos) {

            mostrarCPU(datos.cpu);
            mostrarRAM(datos.memoria);
            mostrarSWAP(datos.memoria);
            mostrarDiscos(datos.discos);
            mostrarRed(datos.red);
            mostrarSistemaOperativo(datos.sistema);

            console.log("Métricas del servidor recibidas");

        });

    }

    



   


});
