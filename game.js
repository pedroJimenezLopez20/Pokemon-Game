// ============================
// DATOS DEL JUEGO
// ============================

// Tabla de efectividades (ejemplo resumido)
const tablaTipos = {
  fuego:  { planta: 1.5, agua: 0.75, fuego: 1, normal: 1 },
  agua:   { fuego: 1.5, planta: 0.75, agua: 1, normal: 1 },
  planta: { agua: 1.5, fuego: 0.75, planta: 1, normal: 1 },
  normal: { fuego: 1, agua: 1, planta: 1, normal: 1 }
  // pega aquí la tabla completa que hicimos si quieres
};

// Equipos
const jugadores = [
  {
    id: 1, // Jugador 1 (abajo)
    panelElemento: null,
    nombreElemento: null,
    barraVidaElemento: null,
    spriteElemento: null,
    botonAtaque: null,
    botonMochila: null,
    pokeballsElementos: [],
    indiceActivo: 0,
    objetos: {
      pocionPequena: 4,
      pocionMediana: 3
    },
    equipo: [
      { name: "Zoroark",   type: "siniestro", maxHp: 100, hp: 100, sprite: "img/pokemon2.png" },
      { name: "Piloswine", type: "hielo",     maxHp: 110, hp: 110, sprite: "img/piloswine.png" },
      { name: "Gurdurr",   type: "lucha",     maxHp: 90,  hp: 90,  sprite: "img/gurdurr.png" }
    ]
  },
  {
    id: 2, // Jugador 2 (arriba)
    panelElemento: null,
    nombreElemento: null,
    barraVidaElemento: null,
    spriteElemento: null,
    botonAtaque: null,
    botonMochila: null,
    pokeballsElementos: [],
    indiceActivo: 0,
    objetos: {
      pocionPequena: 4,
      pocionMediana: 3
    },
    equipo: [
      { name: "Seismitoad", type: "agua",   maxHp: 120, hp: 120, sprite: "img/pokemon1.png" },
      { name: "Leafeon",    type: "planta", maxHp: 80,  hp: 80,  sprite: "img/leafeon.png" },
      { name: "Lucario",    type: "lucha",  maxHp: 100, hp: 100, sprite: "img/lucario.png" }
    ]
  }
];

// 0 = turno jugador 1, 1 = turno jugador 2
let turnoActual = 0;
let partidaTerminada = false;

// Estado de la mochila
let indiceJugadorMochila = null;
let ventanaMochilaEl;
let contadorPequenaEl;
let contadorMedianaEl;
let btnUsarPequenaEl;
let btnUsarMedianaEl;
let btnCerrarMochilaEl;

// ============================
// INICIO
// ============================

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar referencias DOM de cada jugador
  jugadores.forEach((jugador, indice) => {
    const n = indice + 1; // 1 ó 2

    jugador.panelElemento     = document.getElementById(`p${n}-panel`);
    jugador.nombreElemento    = document.getElementById(`p${n}-name`);
    jugador.barraVidaElemento = document.getElementById(`p${n}-hp-bar`);
    jugador.spriteElemento    = document.getElementById(`p${n}-sprite`);
    jugador.botonAtaque       = document.getElementById(`attack-p${n}`);
    jugador.botonMochila      = document.getElementById(`bag-p${n}`);

    jugador.botonAtaque.addEventListener("click", () => realizarAtaque(indice));
    jugador.botonMochila.addEventListener("click", () => abrirMochila(indice));
  });

  // Pokéballs (cambio de Pokémon)
  document.querySelectorAll(".pokeball").forEach((elemento) => {
    const idJugador     = Number(elemento.dataset.player); // 1 ó 2
    const indiceJugador = idJugador - 1;                   // 0 ó 1
    const indicePokemon = Number(elemento.dataset.index);

    const jugador = jugadores[indiceJugador];
    jugador.pokeballsElementos[indicePokemon] = elemento;

    elemento.addEventListener("click", () => {
      cambiarPokemon(indiceJugador, indicePokemon);
    });
  });

  // Ventana mochila
  ventanaMochilaEl   = document.getElementById("ventana-mochila");
  contadorPequenaEl  = document.getElementById("contador-pequena");
  contadorMedianaEl  = document.getElementById("contador-mediana");
  btnUsarPequenaEl   = document.getElementById("btn-usar-pequena");
  btnUsarMedianaEl   = document.getElementById("btn-usar-mediana");
  btnCerrarMochilaEl = document.getElementById("btn-cerrar-mochila");

  btnUsarPequenaEl.addEventListener("click", () => usarPocion("pocionPequena", 20));
  btnUsarMedianaEl.addEventListener("click", () => usarPocion("pocionMediana", 40));
  btnCerrarMochilaEl.addEventListener("click", cerrarMochila);

  // Estado inicial
  actualizarUIJugador(0);
  actualizarUIJugador(1);
  actualizarUITurno();
});

// ============================
// FUNCIONES DE UTILIDAD
// ============================

function obtenerMultiplicadorTipo(tipoAtacante, tipoDefensor) {
  const fila = tablaTipos[tipoAtacante] || {};
  return fila[tipoDefensor] || 1;
}

function obtenerPokemonActivo(indiceJugador) {
  const jugador = jugadores[indiceJugador];
  return jugador.equipo[jugador.indiceActivo];
}

function equipoDerrotado(indiceJugador) {
  return jugadores[indiceJugador].equipo.every(pokemon => pokemon.hp <= 0);
}

// ============================
// ACTUALIZAR UI
// ============================

function actualizarUIJugador(indiceJugador) {
  const jugador = jugadores[indiceJugador];
  const pokemonActivo = obtenerPokemonActivo(indiceJugador);

  // Nombre
  jugador.nombreElemento.textContent = pokemonActivo.name;

  // Barra de vida
  const porcentaje = Math.max(0, (pokemonActivo.hp / pokemonActivo.maxHp) * 100);
  jugador.barraVidaElemento.style.width = `${porcentaje}%`;

  // Sprite grande
  if (pokemonActivo.sprite) {
    jugador.spriteElemento.src = pokemonActivo.sprite;
  }

  // Sprite gris si está muerto
  const activoVivo = pokemonActivo.hp > 0;
  jugador.spriteElemento.style.filter  = activoVivo ? "none" : "grayscale(1)";
  jugador.spriteElemento.style.opacity = activoVivo ? "1" : "0.5";

  // Pokéballs (estado y borde)
  jugador.equipo.forEach((pokemon, i) => {
    const pokeball = jugador.pokeballsElementos[i];
    if (!pokeball) return;

    const vivo = pokemon.hp > 0;
    pokeball.style.filter  = vivo ? "none" : "grayscale(1)";
    pokeball.style.opacity = vivo ? "1" : "0.5";

    pokeball.style.outline = (i === jugador.indiceActivo)
      ? "3px solid #ffeb3b"
      : "none";
  });
}

function actualizarUITurno() {
  jugadores.forEach((jugador, indice) => {
    const esSuTurno = indice === turnoActual;

    if (esSuTurno) {
      jugador.panelElemento.classList.add("turno-activo");
      jugador.botonAtaque.classList.remove("disabled");
      jugador.botonMochila.classList.remove("disabled");
    } else {
      jugador.panelElemento.classList.remove("turno-activo");
      jugador.botonAtaque.classList.add("disabled");
      jugador.botonMochila.classList.add("disabled");
    }
  });
}

function actualizarUIMochila() {
  if (indiceJugadorMochila === null) return;

  const jugador = jugadores[indiceJugadorMochila];
  const objetos = jugador.objetos;
  const pokemon = obtenerPokemonActivo(indiceJugadorMochila);

  contadorPequenaEl.textContent = objetos.pocionPequena;
  contadorMedianaEl.textContent = objetos.pocionMediana;

  const vidaLlena = pokemon.hp >= pokemon.maxHp || pokemon.hp <= 0;

  btnUsarPequenaEl.disabled = objetos.pocionPequena <= 0 || vidaLlena;
  btnUsarMedianaEl.disabled = objetos.pocionMediana <= 0 || vidaLlena;
}

// ============================
// MOCHILA
// ============================

function abrirMochila(indiceJugador) {
  if (partidaTerminada) return;
  if (indiceJugador !== turnoActual) return;

  indiceJugadorMochila = indiceJugador;
  actualizarUIMochila();
  ventanaMochilaEl.classList.remove("oculto");
}

function  cerrarMochila() {
  ventanaMochilaEl.classList.add("oculto");
  indiceJugadorMochila = null;
}


function usarPocion(claveObjeto, cantidadCura) {
  if (indiceJugadorMochila === null) return;
  const indiceJugador = indiceJugadorMochila;

  if (partidaTerminada) return;
  if (indiceJugador !== turnoActual) return;

  const jugador = jugadores[indiceJugador];
  const objetos = jugador.objetos;
  const pokemon = obtenerPokemonActivo(indiceJugador);

  if (objetos[claveObjeto] <= 0) return;
  if (pokemon.hp <= 0) return;
  if (pokemon.hp >= pokemon.maxHp) return;

  objetos[claveObjeto]--;
  pokemon.hp = Math.min(pokemon.maxHp, pokemon.hp + cantidadCura);

  actualizarUIJugador(indiceJugador);
  actualizarUIMochila();
}

// ============================
// CAMBIO DE POKÉMON
// ============================

function cambiarPokemon(indiceJugador, nuevoIndice) {
  if (partidaTerminada) return;
  if (indiceJugador !== turnoActual) return;

  const jugador = jugadores[indiceJugador];
  const pokemonObjetivo = jugador.equipo[nuevoIndice];

  if (!pokemonObjetivo || pokemonObjetivo.hp <= 0) return;

  jugador.indiceActivo = nuevoIndice;
  actualizarUIJugador(indiceJugador);
}

// ============================
// ATAQUE Y DAÑO
// ============================

function realizarAtaque(indiceJugador) {
  if (partidaTerminada) return;
  if (indiceJugador !== turnoActual) return;

  const indiceAtacante = indiceJugador;
  const indiceDefensor = 1 - indiceAtacante;

  const atacante = obtenerPokemonActivo(indiceAtacante);
  const defensor = obtenerPokemonActivo(indiceDefensor);

  if (atacante.hp <= 0) return;

  const danoBase = 15 + Math.floor(Math.random() * 11);
  const multiplicadorTipo = obtenerMultiplicadorTipo(atacante.type, defensor.type);
  const danoTotal = Math.round(danoBase * multiplicadorTipo);

  defensor.hp = Math.max(0, defensor.hp - danoTotal);

  actualizarUIJugador(indiceDefensor);

  if (defensor.hp <= 0) {
    if (equipoDerrotado(indiceDefensor)) {
      partidaTerminada = true;
      alert(`Jugador ${indiceAtacante + 1} ha ganado la batalla`);
      return;
    } else {
      alert(`El Pokémon del Jugador ${indiceDefensor + 1} se ha debilitado, elige otro.`);
    }
  }

  turnoActual = indiceDefensor;
  actualizarUITurno();
}
