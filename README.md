# Nirvana Café Gourmet - Menú Digital

Web app completa para usar una tablet vertical como menú visual interactivo frente a caja/barra. No incluye carrito, checkout ni pedidos: el cliente navega, mira productos, variantes y sugerencias, y luego pide a la cajera.

## Stack

- React + Vite
- Firebase Auth
- Firestore
- Firebase Storage
- Lucide React
- CSS moderno con variables, modo claro/oscuro y sombras automáticas para productos

## Instalación

```bash
npm install
npm run dev
```

La app pública queda en `/` y el panel admin en `/admin`.

## Variables Firebase

Copiá `.env.example` a `.env` y completá:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

El código no hardcodea credenciales: todo se lee desde `import.meta.env`.

## Crear usuario admin

1. Entrá a Firebase Console.
2. Authentication -> Sign-in method -> activá Email/Password.
3. Authentication -> Users -> Add user.
4. Usá ese email y contraseña en `/admin/login`.

## Firestore

Colecciones usadas:

- `categories`
- `products`
- `variantGroups`
- `settings/main`

Si Firestore está vacío, la vista pública muestra datos demo locales. Desde `/admin` podés usar el botón **Cargar demo** para sembrar categorías, productos, variantes y settings reales en Firestore.

## Cargar productos

En `/admin/products` podés crear, editar, eliminar, activar/desactivar, destacar, cambiar orden, asociar categoría, variantes y productos sugeridos.

Los campos de tags se cargan separados por coma.

## Cargar imágenes

El componente `ImageUploader` permite:

- subir PNG/JPG/WebP a Firebase Storage
- pegar una URL manual
- previsualizar antes de guardar
- reemplazar imagen principal o destacada

Las imágenes se renderizan con `object-fit: contain`, sin deformarse ni recortarse, y reciben sombra automática por CSS.

## Modo claro/oscuro y apariencia

En `/admin/appearance` podés editar:

- modo claro / oscuro
- color acento
- intensidad de sombra: `none`, `soft`, `medium`, `strong`
- radio de bordes
- marca, subtítulos y título del menú
- logo
- footer

La configuración se guarda en `settings/main` y afecta la vista pública.

## Publicación

Para compilar:

```bash
npm run build
```

Podés publicar `dist` en Firebase Hosting, Vercel o cualquier hosting estático compatible con SPAs.
