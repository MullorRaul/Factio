// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
    // Al entrar en "/", te manda a "/signup"
    return <Redirect href="/login" />;
}
