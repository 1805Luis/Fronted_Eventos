const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const port = 3000;

const apiGatewayHost = 'api-gateway';  
const apiGatewayPort = 3010; 

const session = require("express-session");

app.use(session({
  secret: 'tu-secreto', 
  resave: false,
  saveUninitialized: true,
}));

// Configuración
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Middleware para agregar un título genérico
app.use((req, res, next) => {
  res.locals.title = "Planifica Tu Ocio"; // Título genérico
  next(); // Continuar con la siguiente función
});

// Simulación de base de datos de usuarios
const users = [
  { dni: "12345678A", clave: "1234567" },
  { dni: "87654321B", clave: "securepass" },
  { dni: "11223344C", clave: "mypassword" },
];

const events = [
  { 
    id: 1, 
    name: "Festival Indie", 
    description: "Un vibrante festival de música indie.", 
    location: "Barcelona", 
    seats: 150, 
    categories: [
      { type: "General", availableSeats: 70, precio: 15 },
      { type: "VIP", availableSeats: 50, precio: 25 },
      { type: "Zona Lounge", availableSeats: 30, precio: 40 }
    ]
  },
  { 
    id: 2, 
    name: "Musical Broadway", 
    description: "Un espectáculo lleno de magia y talento.", 
    location: "Sevilla", 
    seats: 200, 
    categories: [
      { type: "Balcones", availableSeats: 80, precio: 18 },
      { type: "VIP", availableSeats: 70, precio: 35 },
      { type: "Orquesta", availableSeats: 50, precio: 50 }
    ]
  },
  { 
    id: 3, 
    name: "Concierto de Jazz", 
    description: "Una noche para disfrutar del mejor jazz en vivo.", 
    location: "Granada", 
    seats: 120, 
    categories: [
      { type: "Pista", availableSeats: 60, precio: 20 },
      { type: "VIP", availableSeats: 40, precio: 30 },
      { type: "Galería", availableSeats: 20, precio: 25 }
    ]
  },
  { 
    id: 4, 
    name: "Teatro Moderno", 
    description: "Una obra emocionante sobre temas contemporáneos.", 
    location: "Bilbao", 
    seats: 180, 
    categories: [
      { type: "General", availableSeats: 100, precio: 10 },
      { type: "Platea", availableSeats: 50, precio: 20 },
      { type: "VIP", availableSeats: 30, precio: 30 }
    ]
  },
  { 
    id: 5, 
    name: "Fiesta Electrónica", 
    description: "Un evento con los mejores DJs internacionales.", 
    location: "Ibiza", 
    seats: 250, 
    categories: [
      { type: "General", availableSeats: 150, precio: 20 },
      { type: "Zona VIP", availableSeats: 60, precio: 40 },
      { type: "Mesa Privada", availableSeats: 40, precio: 80 }
    ]
  },
  { 
    id: 6, 
    name: "Maratón de Cine", 
    description: "Disfruta de clásicos del cine toda la noche.", 
    location: "Valencia", 
    seats: 90, 
    categories: [
      { type: "General", availableSeats: 50, precio: 8 },
      { type: "VIP", availableSeats: 25, precio: 15 },
      { type: "Butaca Premium", availableSeats: 15, precio: 20 }
    ]
  },
  { 
    id: 7, 
    name: "Charla Motivacional", 
    description: "Inspiración y estrategias para alcanzar el éxito.", 
    location: "Málaga", 
    seats: 100, 
    categories: [
      { type: "General", availableSeats: 60, precio: 10 },
      { type: "VIP", availableSeats: 30, precio: 20 },
      { type: "Front Row", availableSeats: 10, precio: 35 }
    ]
  },
  { 
    id: 8, 
    name: "Concierto Sinfónico", 
    description: "Una velada mágica con una gran orquesta sinfónica.", 
    location: "Zaragoza", 
    seats: 150, 
    categories: [
      { type: "General", availableSeats: 90, precio: 25 },
      { type: "VIP", availableSeats: 40, precio: 50 },
      { type: "Galería", availableSeats: 20, precio: 35 }
    ]
  },
  { 
    id: 9, 
    name: "Exposición de Arte Digital", 
    description: "Una muestra impresionante de obras digitales interactivas.", 
    location: "Madrid", 
    seats: 200, 
    categories: [
      { type: "General", availableSeats: 100, precio: 12 },
      { type: "Acceso Premium", availableSeats: 70, precio: 20 },
      { type: "Visita Guiada", availableSeats: 30, precio: 30 }
    ]
  },
];

let selectedSeats = [];

// Función para verificar si la base de datos está disponible
const isDatabaseAvailable = async () => {
  try {
    // Hacer una solicitud al API Gateway para verificar si está activo
    const response = await axios.get(`http://api-gateway:3010/health`);

    if (response.status === 200) {
      console.log('API Gateway está disponible');
      return true; // Si la respuesta es 200, el API Gateway está disponible
    } else {
      console.log('API Gateway no disponible, respuesta inesperada:', response.status);
      return false;
    }
  } catch (error) {
    console.log('Error al conectar al API Gateway:', error);
    return false; // Si hay un error, el API Gateway no está disponible
  }
};

// Redirige al login al iniciar
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Página de inicio de sesión
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.redirect("/login?error=Error%20Rellene%20todos%20los%20campos");
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    // Intentar buscar el usuario en la base de datos
    try {
      const response = await axios.get(`http://api-gateway:3010/api/usuarios/user/${username}`);
      const user = response.data;
      if (user && user.clave === password) {
        req.session.dni = user.dni;
        res.redirect("/menu");
      } else {
        res.redirect("/login?error=Error%20DNI%20y/o%20clave%20incorrectos");
      }
    } catch (error) {
      console.error("Error al buscar el usuario:", error);
      res.redirect("/login?error=Error%20DNI%20y/o%20clave%20incorrectos");
    }
  } else {
    // Usar datos simulados si la base de datos no está disponible
    const user = users.find(u => u.dni === username);
    if (user && user.clave === password) {
      req.session.dni = user.dni;
      res.redirect("/menu");
    } else {
      res.redirect("/login?error=Error%20DNI%20y/o%20clave%20incorrectos");
    }
  }
});

// Página de registro
app.get("/register", (req, res) => {
  res.render("register");
});

// Maneja el registro
app.post("/register", async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.redirect("/register?error=Por%20favor%20rellene%20todos%20los%20campos");
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const response = await axios.post(`http://api-gateway:3010/api/usuarios/user`, {username, password, name }); 
      req.session.dni = username;
      res.redirect("/menu");
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      res.redirect("/register?error=Usuario%20ya%20existe");
    }
  } else {
    // Verificar si el usuario ya existe en los datos simulados
    const userExists = users.find(u => u.dni === username);
    if (userExists) {
      return res.redirect("/register?error=Usuario%20ya%20existe");
    }

    // Agregar nuevo usuario a la base de datos simulada
    users.push({ name, username, password });
    req.session.dni = username;
    res.redirect("/menu");
  }
});

// Página del menú principal
app.get("/menu", async (req, res) => {
  const dbAvailable = await isDatabaseAvailable();

  let eventList = [];
  if (dbAvailable) {
    try {
      const response = await axios.get(`http://api-gateway:3010/api/eventos/eventos`); 
      eventList = response.data || []; // Asegurarse de que sea un arreglo
    } catch (error) {
      console.error("Error al obtener los eventos:", error);
    }
  } else {
    eventList = events; // Usar eventos simulados si la base de datos no está disponible
  }

  res.render("menu", { events: eventList });
});


app.get('/logout', (req, res) => {
  res.redirect('/login'); // Redirige a la página de login
});

app.get("/evento/:id", async (req, res) => {
  const eventId = req.params.id;
  const dbAvailable = await isDatabaseAvailable();

  let event;
  if (dbAvailable) {
    try {
      const response = await axios.get(`http://api-gateway:3010/api/eventos/eventos/${eventId}`);
      event = response.data;
    } catch (error) {
      console.error("Error al obtener el evento:", error);
      res.status(404).send("Evento no encontrado");
      return;
    }
  } else {
    event = events.find(e => e.id == eventId);
  }

  if (!event) {
    return res.status(404).send("Evento no encontrado");
  }

  res.render("evento", { event });
});

app.post("/reserva/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  const dbAvailable = await isDatabaseAvailable();

  let event;
  if (dbAvailable) {
    try {
      const response = await axios.get(`http://api-gateway:3010/api/eventos/eventos/${eventId}`); 
      event = response.data;
    } catch (error) {
      console.error("Error al obtener el evento:", error);
      return res.status(404).send("Evento no encontrado");
    }
  } else {
    event = events.find(e => e.id == eventId);
  }

  if (!event) {
    return res.status(404).send("Evento no encontrado");
  }

  const userDni  = req.session.dni;

  if (!userDni) {
    return res.redirect("/login");
  }

  // Procesar la reserva
  let totalPrice = 0;
  let entradas = {};
  let entradasMessage = '';

  for (let category of event.categories) {
    const quantity = parseInt(req.body[`category_${category.type}`]) || 0;
    
    if (quantity > 0) {
      if (quantity > category.availableSeats) {
        return res.status(400).send(`No hay suficientes asientos disponibles en la categoría ${category.type}`);
      }
      totalPrice += category.precio * quantity;
      category.availableSeats -= quantity; // Reducir los asientos disponibles

      // Actualizar las entradas seleccionadas para esta categoría
      entradas[category.type] = (entradas[category.type] || 0) + quantity;
    }
  }

  if (dbAvailable) {

    const reservaData = {
      id_evento: eventId,
      id_usuario: userDni, 
      entradas: entradasMessage 
    };

    try {
      const response = await axios.post(`http://api-gateway:3010/reservas/reserva`, reservaData);
      console.log('Reserva creada con éxito:', response.data);
      const updatedEvent = {
        ...event, 
        categories: event.categories.map(category => {
          const reservedSeats = entradas[category.type] || 0;
          category.availableSeats -= reservedSeats;
          return category;
        })
      };

      // Enviar la solicitud PUT para actualizar el evento
      await axios.put(`http://api-gateway:3010/eventos/eventos/${eventId}`, updatedEvent);
    } catch (error) {
      console.error("Error al realizar la reserva:", error);
      res.status(500).send("Error al procesar la reserva");
    }
  } else {
    selectedSeats.push({ event: event.name, totalPrice, details: req.body });
  }

  

  res.render("menu", { events });
});

app.get('/reservas', async (req, res) => {

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
  // Supongamos que el dni del usuario está almacenado en la sesión
    const userDni = req.session.dni;

    if (!userDni) {
        return res.redirect('/login'); // Redirige al login si no está logueado
    }

    try {
        // Aquí podrías hacer una consulta a la base de datos o a una API externa para obtener las reservas
        const reservasResponse = await axios.get(`http://api-gateway:3010/reservas/${userDni}`);
        const reservas = reservasResponse.data; // Suponiendo que la respuesta contiene un array de reservas

        // Renderizar la página de reservas
        res.render('reservas', { reservas });
    } catch (error) {
        console.error("Error al obtener las reservas:", error);
        res.status(500).send("Error al cargar las reservas");
    }
  }else{
    { res.render('reservas', { reservas: [] }); }
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
