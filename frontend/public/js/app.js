
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

});
