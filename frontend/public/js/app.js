
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
        actualizarTexto("cpu-nucleos", datos.nucleos);

        actualizarBarra("cpu-barra", datos.uso);

    }

    // Función para mostrar los datos de memoria RAM
    function mostrarRAM(datos) {

        actualizarTexto("ram-uso", datos.uso);
        actualizarTexto("ram-total", datos.total);
        actualizarTexto("ram-libre", datos.libre);

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
                    "Unidad: " + disco.unidad +
                    " | Total: " + disco.total + " GB" +
                    " | Disponible: " + disco.libre + " GB";

                lista.appendChild(parrafo);

            }

        }

    }


    // Función para mostrar las interfaces de red
    function mostrarRed(datos) {

        let lista = document.getElementById("red-lista");

        if (lista !== null) {

            lista.textContent = "";

            for (let i = 0; i < datos.length; i++) {

                let interfaz = datos[i];

                let parrafo = document.createElement("p");

                parrafo.textContent =
                    "Interfaz: " + interfaz.nombre +
                    " | IP: " + interfaz.ip +
                    " | Estado: " + interfaz.estado;

                lista.appendChild(parrafo);

            }

        }

    }

    
    // Función para mostrar los datos del sistema operativo
    function mostrarSistemaOperativo(datos) {

        actualizarTexto("so-nombre", datos.nombre);
        actualizarTexto("so-version", datos.version);
        actualizarTexto("so-arquitectura", datos.arquitectura);
        actualizarTexto("so-hostname", datos.hostname);
        actualizarTexto("so-uptime", datos.uptime);

    }


    // Función para mostrar los datos de memoria SWAP
    function mostrarSWAP(datos) {

        actualizarTexto("swap-uso", datos.uso + "%");
        actualizarTexto("swap-total", datos.total);
        actualizarTexto("swap-libre", datos.libre);

        actualizarBarra("swap-barra", datos.uso);

    }


    



   


});
