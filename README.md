# 🏨 Sistema de Hotel

Un sistema completo de gestión hotelera desarrollado con HTML, CSS y JavaScript vanilla.

## ✨ Características

- **Sistema de Autenticación**: Registro e inicio de sesión de usuarios
- **Gestión de Habitaciones**: Visualización y reserva de habitaciones
- **Sistema de Compras**: Compra de habitaciones con múltiples métodos de pago
- **Panel de Usuario**: Gestión de reservas y compras del usuario
- **Panel de Administración**: Gestión completa del hotel
- **Atención al Cliente**: Sistema de feedback y soporte
- **Interfaz Responsiva**: Diseño moderno y adaptable

## 🚀 Despliegue en Netlify

### Opción 1: Despliegue Directo desde GitHub

1. **Sube tu código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   git push -u origin main
   ```

2. **Conecta con Netlify**:
   - Ve a [netlify.com](https://netlify.com)
   - Inicia sesión o crea una cuenta
   - Haz clic en "New site from Git"
   - Selecciona tu repositorio de GitHub
   - Configuración automática (Netlify detectará que es un sitio estático)

### Opción 2: Despliegue Manual

1. **Prepara los archivos**:
   - Asegúrate de que todos los archivos estén en la raíz del proyecto
   - El archivo `index.html` debe estar en la raíz

2. **Sube a Netlify**:
   - Ve a [netlify.com](https://netlify.com)
   - Arrastra y suelta la carpeta del proyecto en el área de despliegue
   - Netlify subirá automáticamente tu sitio

## 📁 Estructura del Proyecto

```
hotel/
├── index.html              # Página principal
├── registro.html           # Sistema de autenticación
├── habitaciones.html       # Catálogo de habitaciones
├── usuarios.html           # Panel de usuario
├── admin.html              # Panel de administración
├── atencion-cliente.html   # Sistema de atención al cliente
├── styles.css              # Estilos principales
├── script.js               # Funciones principales
├── habitaciones.js         # Lógica de habitaciones
├── usuarios.js             # Lógica de usuarios
├── admin.js                # Lógica de administración
├── atencion-cliente.js     # Lógica de atención al cliente
├── admin-feedback.js       # Gestión de feedback
├── admin-habitaciones.js   # Gestión de habitaciones (admin)
├── admin-habitaciones.css  # Estilos de administración
├── netlify.toml            # Configuración de Netlify
└── README.md               # Este archivo
```

## 🎯 Funcionalidades Principales

### Para Usuarios
- **Registro e Inicio de Sesión**: Sistema seguro de autenticación
- **Explorar Habitaciones**: Ver disponibilidad y detalles
- **Comprar Habitaciones**: Hasta 2 habitaciones por usuario
- **Apartar Habitaciones**: Reservas sin límite
- **Panel Personal**: Ver historial de transacciones
- **Múltiples Métodos de Pago**: Tarjeta y efectivo

### Para Administradores
- **Gestión de Habitaciones**: Agregar, editar, eliminar
- **Gestión de Usuarios**: Ver y administrar usuarios
- **Sistema de Feedback**: Revisar comentarios de clientes
- **Estadísticas**: Dashboard con métricas importantes

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos y responsivos
- **JavaScript ES6+**: Funcionalidad interactiva
- **LocalStorage**: Almacenamiento local de datos
- **Font Awesome**: Iconos
- **SweetAlert2**: Alertas modernas

## 📱 Compatibilidad

- ✅ Chrome (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móviles

## 🔧 Configuración Local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
   ```

2. **Abre el proyecto**:
   - Abre `index.html` en tu navegador
   - O usa un servidor local como Live Server en VS Code

## 📊 Estado del Proyecto

- ✅ **Sistema de Autenticación**: Completado
- ✅ **Gestión de Habitaciones**: Completado
- ✅ **Sistema de Compras**: Completado
- ✅ **Panel de Usuario**: Completado
- ✅ **Panel de Administración**: Completado
- ✅ **Atención al Cliente**: Completado
- ✅ **Interfaz Responsiva**: Completado

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes alguna pregunta o problema:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo

---

**¡Disfruta usando el Sistema de Hotel! 🏨✨** 