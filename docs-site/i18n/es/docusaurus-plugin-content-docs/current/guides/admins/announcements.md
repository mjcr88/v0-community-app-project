# Administración de Anuncios

El módulo de Anuncios permite a los Administradores de Inquilinos transmitir información importante, alertas y políticas a su comunidad. A diferencia de las publicaciones del foro de la comunidad, los anuncios son comunicaciones oficiales y unidireccionales que aparecen en la parte superior del panel de residentes.

## Conceptos Clave

- **Tipos:** Clasifica el anuncio (por ejemplo, General, Emergencia, Mantenimiento, Evento, Política). Brinda a los residentes contexto visual.
- **Prioridad:** Determina el peso visual.
  - *Normal:* Insignia gris estándar.
  - *Importante:* Insignia naranja, destacada en los feeds.
  - *Urgente:* Insignia roja, mostrada de manera prominente.
- **Estado:**
  - *Borrador:* Guardado pero no visible para los residentes. No se envían notificaciones.
  - *Publicado:* Visible en los paneles de control inmediatamente. Envía notificaciones push/por correo electrónico.
  - *Archivado:* Movido fuera del panel principal a la pestaña histórica de "Archivos".
- **Comunicaciones Dirigidas (Vecindarios):** Los anuncios pueden transmitirse "A toda la comunidad" o restringirse a vecindarios específicos para que solo los residentes cuyos lotes pertenezcan a esos vecindarios los vean.

![Tabla de Anuncios de Admin](/screenshots/announcements-admin-table.png)

## Crear un Anuncio

1. Navegue a su Panel de Administrador.
2. En "Comunicaciones", seleccione "Anuncios".
3. Haga clic en **"Crear Anuncio"**.
4. **Detalles Básicos:** Proporcione un título claro y conciso y una descripción opcional de texto enriquecido.
5. **Categorización:** Seleccione el Tipo y la Prioridad.
6. **Enlaces Opcionales:**
   - *Comunicaciones Dirigidas:* Seleccione vecindarios específicos si esto no se aplica a toda la comunidad. Déjelo en blanco para dirigirse a todos.
   - *Enlace de Evento:* Adjunte un evento comunitario existente al anuncio.
   - *Ubicación:* Adjunte una instalación comunitaria o coloque un pin GPS personalizado en el mapa.
7. **Auto-Archivar:** Seleccione una fecha y hora opcionales. El sistema moverá automáticamente el anuncio al Archivo cuando pase este tiempo, evitando desordenar los paneles de control de los residentes.
8. **Guardar:** Elija "Guardar como Borrador" (para editar más tarde) o "Publicar Ahora" (lo activa inmediatamente y notifica a los residentes).

![Formulario de Creación de Anuncio de Admin](/screenshots/announcements-create-form.png)

> [!NOTE] 
> El archivado automático se maneja mediante un trabajo programado en segundo plano. Para obtener detalles técnicos, consulte [Trabajos en Segundo Plano](../../developers/architecture/background-jobs.md).

## Editar y Administrar

Desde la tabla de datos principal de Anuncios, puede ver todas sus comunicaciones.

- **Editar:** Haga clic en el ícono de editar para cambiar cualquier detalle. *Nota: Si edita un anuncio ya publicado, se enviará una notificación secundaria de "Actualizado" a los residentes.*
- **Publicación Rápida:** Transición de un borrador directamente a publicado utilizando el ícono de 📢.
- **Archivar:** Oculte un anuncio del feed principal de residentes anticipadamente usando el ícono de archivo 📦.
- **Eliminar:** Use el ícono de la papelera 🗑️ para eliminar permanentemente un anuncio si se creó por error.
- **Ver Estadísticas:** La tabla muestra cuántos residentes han "leído" activamente su anuncio (al expandirlo o hacer clic en él).
