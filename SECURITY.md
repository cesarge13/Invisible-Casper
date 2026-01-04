# 🔒 Seguridad y Configuración

## ⚠️ IMPORTANTE: Claves Privadas

**NUNCA** compartas tus claves privadas en:
- Código fuente
- Repositorios públicos
- Mensajes o chats
- Documentación pública

## 📝 Variables de Entorno

Todas las claves sensibles deben estar en `.env.local` que está en `.gitignore`:

```bash
# .env.local (NO COMMITEAR)
SPONSOR_PRIVATE_KEY=ed25519:tu_clave_privada_aqui
SPONSOR_PUBLIC_KEY=tu_clave_publica_aqui
NODE_ADDRESS=https://rpc.testnet.casperlabs.io
NETWORK_NAME=casper-test
NEXT_PUBLIC_SPONSOR_PUBLIC_KEY=tu_clave_publica_aqui
```

## 🔐 Generar Nuevas Claves

Si necesitas generar un nuevo par de claves Ed25519 para Casper:

```bash
node -e "const { Keys } = require('casper-js-sdk'); const keyPair = Keys.Ed25519.new(); const privateKeyHex = Buffer.from(keyPair.privateKey).toString('hex'); console.log('SPONSOR_PUBLIC_KEY=' + keyPair.publicKey.toHex()); console.log('SPONSOR_PRIVATE_KEY=ed25519:' + privateKeyHex);"
```

## ✅ Checklist de Seguridad

- [ ] `.env.local` está en `.gitignore`
- [ ] No hay claves hardcodeadas en el código
- [ ] Las claves privadas solo están en `.env.local`
- [ ] El repositorio es público solo si no contiene claves

