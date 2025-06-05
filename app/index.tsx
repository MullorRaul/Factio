// app/index.tsx
import { Redirect } from 'expo-router';

export default function StartPage() {
    // Redirige al flujo que lleva al login.
    // Si pantallaInicio es solo un redirect a login, puedes apuntar directamente a login
    // o a pantallaInicio para mantener esa lógica intermedia.
    return <Redirect href="/(auth)/pantallaInicio" />;
    // o return <Redirect href="/(auth)/login" />;
}