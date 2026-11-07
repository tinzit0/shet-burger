# Cálculo automático por dirección

## Formulario de entrega

El cliente escribe calle y número en campos separados y puede agregar una población o sector opcional (con sugerencias de las siete zonas). Se conserva el texto escrito y se arma la dirección como `Río Itata 50, Nonguén, Concepción`. La cotización muestra esa dirección, el valor del despacho y el total del pedido. La población sigue siendo opcional; si falta, se intenta resolver con el mapa.

La lista de tarifas está disponible como referencia desplegable. El cliente puede cambiar entre delivery y retiro antes del pago; editar cualquier campo elimina la cotización anterior mientras se calcula la nueva.

El cálculo ya no depende de una clave de Google. Si la dirección contiene un sector conocido después del número (por ejemplo, `Los Boldos 123, Nonguén` o `rio itata 50 nonguen concepcion`), cotiza directamente la tarifa del sector: $1.000 para las zonas cercanas y $3.000 para Concepción Centro. Admite ciudad y país después del sector, comas opcionales, mayúsculas y tildes. Esto funciona para cualquier calle cuando se indica el sector; cotiza la zona escrita sin verificar que exista la vivienda.

Se reconocen las siete zonas configuradas: Nonguén, Collao, Valle Noble, San Guillermo, Palomares, Km 10 y Concepción Centro. También acepta Centro, Centro de Concepción, Centro Concepción, Km10 y Kilómetro 10. El sector puede escribirse después del número o en un primer segmento separado por coma. Una comuna diferente explícita después del número no hereda la tarifa de Centro.

Si no hay un sector explícito, intenta Google cuando tiene clave configurada y luego Photon (OpenStreetMap), que no requiere clave. Se busca una calle coincidente en Concepción, Chile, con un sector reconocido. Si no se confirma cobertura, muestra «No llegamos a esa zona por el momento. Puedes elegir retiro en el local.» y deja el total pendiente. Un error de red muestra un aviso de conexión distinto. No se cobra una tarifa arbitraria ni se muestra un selector; la lista de zonas y tarifas del formulario es solo informativa.

El carrito espera 1,5 segundos al escribir antes de consultar, cancela consultas Photon pendientes al editar y descarta respuestas antiguas. El pago queda pendiente hasta obtener una tarifa válida.

## Photon sin clave

Por defecto utiliza `https://photon.komoot.io/api/`. Se puede configurar una instancia propia con `VITE_PHOTON_URL` y volver a compilar. La instancia pública permite uso moderado sin garantía de disponibilidad: para tráfico elevado se requiere una instancia propia o un proveedor contratado. Referencia: https://github.com/komoot/photon

Se muestra atribución a OpenStreetMap en el formulario. No se persisten consultas del mapa. La conectividad se comprobó con la dirección pública del negocio: el mapa devuelve Río Loa en Concepción, pero no su sector tarifario, de modo que ese caso requiere incluir Nonguén en la dirección.

## Google opcional

1. En Google Cloud habilitar Maps JavaScript API y Geocoding API para el mismo proyecto y configurar la facturación requerida por Google.
2. Crear una clave de navegador restringida a los dominios del sitio y localhost de desarrollo, y a esas APIs.
3. Agregar `VITE_GOOGLE_MAPS_API_KEY=...` en `.env` (no subir este archivo a Git).
4. Reiniciar Vite; en producción configurar la variable y volver a compilar/desplegar.

La clave se usa en el navegador y es pública: sus restricciones deben configurarse en Google Cloud. La consulta de direcciones puede generar cargos según la cuenta de Google. No se activó ninguna cuenta ni facturación desde el proyecto.

## Cobertura y límites

Las tarifas existentes siguen definidas en `src/lib/delivery.js`. En resultados del mapa, se compara el barrio o sublocalidad con las zonas configuradas. Centro solo se acepta dentro de Concepción. No se infiere el sector a partir del nombre de la calle ni de toda la ciudad.

Los mapas no siempre devuelven el barrio. Si falta o la coincidencia es ambigua, no se confirma cobertura y se muestra el aviso de zona no disponible. Esto puede excluir una dirección realmente cubierta: corregirla incluyendo un sector conocido permite cotizar. Para reconocer automáticamente todos esos casos usando solo calle y número se requieren polígonos de cobertura confirmados por el comercio; no se inventaron límites geográficos ni tarifas por distancia.

Las pruebas cubren tarifas y totales sin clave, respuestas Photon simuladas, errores de red y exclusión de calles distintas y otras comunas. Validar con direcciones reales de cada zona, incluyendo fuera de cobertura e incompletas.

Referencia: https://developers.google.com/maps/documentation/javascript/geocoding
