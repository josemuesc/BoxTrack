# Plantillas de correo de Supabase Auth

Estas plantillas no se aplican solas: Supabase las sirve desde la
configuración del proyecto (Dashboard), no desde este repo. Este directorio
es solo para tenerlas versionadas y poder copiarlas.

## Cómo aplicarlas

1. Entra al Dashboard de Supabase → **Authentication → Emails** (o "Email
   Templates" según la versión).
2. Para cada plantilla, selecciona el tipo correspondiente y pega el
   contenido del archivo de este directorio en el campo **Message body**
   (HTML):
   - `confirm-signup.html` → **Confirm signup**
   - `reset-password.html` → **Reset password**
   - `magic-link.html` → **Magic Link**
3. En el campo **Subject**, usa el asunto sugerido en el comentario de la
   primera línea de cada archivo.
4. Guarda cada plantilla por separado.

## Por qué usan `{{ .ConfirmationURL }}`

El botón de cada correo debe apuntar a `{{ .ConfirmationURL }}` (no a
`{{ .Token }}` ni a un link armado a mano): es la URL que Supabase arma
apuntando a su propio endpoint de verificación, que valida el enlace y
luego redirige a `/auth/confirm` en BoxTrack (la ruta que ya maneja el
intercambio de código por sesión — ver `app/auth/confirm/route.ts`). Si se
reemplaza por otra variable, el flujo de login automático después de
confirmar deja de funcionar.

## Requisito ya configurado

Esto asume que `/auth/confirm` ya está en la lista de **Redirect URLs**
del proyecto (Authentication → URL Configuration), como se configuró junto
con la funcionalidad de "olvidé mi contraseña".
