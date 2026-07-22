# sgi-portal

Wrapper mínimo para servir el Consolidador GS (Google Apps Script) bajo el
dominio propio **https://sgi.getsystem.io**.

## Qué hace

`index.html` es una página que sólo contiene un `<iframe>` a tope de pantalla
apuntando al Web App de Apps Script (`.../exec`). El login lo sigue manejando
Google Workspace: sólo cuentas `@getsystem.io` logueadas pueden ver el
contenido. Este repo NO contiene lógica de negocio — el código real vive en el
repo privado `consolidador-sgi`.

## Cambiar la URL del Web App

Si volvés a desplegar el consolidador y cambia la URL `/exec`, editá el
atributo `src` del `<iframe>` en `index.html` y hacé push. GitHub Pages se
actualiza solo en un par de minutos.

## Publicación (GitHub Pages)

1. Settings → Pages → Source: rama `main`, carpeta `/ (root)`.
2. Custom domain: `sgi.getsystem.io` → guardar.
3. Esperar a que GitHub verifique el dominio y tildar **Enforce HTTPS**.

## DNS (Route53, zona getsystem.io)

Crear un registro:

```
sgi   CNAME   gs-get-system.github.io.
```
