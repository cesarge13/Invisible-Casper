# Scripts de Deployment

Esta carpeta contiene scripts para desplegar contratos inteligentes en la red Casper.

## Deploy CEP-78 NFT Contract

### Requisitos Previos

1. **Variables de entorno configuradas** en `.env.local`:
   ```bash
   NODE_ADDRESS=https://rpc.testnet.casperlabs.io
   NETWORK_NAME=casper-test
   SPONSOR_PUBLIC_KEY=01...
   SPONSOR_PRIVATE_KEY=ed25519:...
   ```

2. **Archivo WASM del contrato** en `contracts/cep78.wasm`:
   - Ver `contracts/README.md` para instrucciones de cómo obtenerlo

3. **Balance suficiente** en la cuenta del sponsor para pagar los fees de deployment

### Ejecutar el Script

```bash
pnpm deploy:cep78
```

O directamente con tsx:

```bash
pnpm tsx scripts/deploy-cep78.ts
```

### Qué hace el script

1. ✅ Lee las variables de entorno
2. ✅ Carga la clave privada del sponsor
3. ✅ Crea un deploy de instalación con los argumentos:
   - `collection_name`: "GaslessGifterNFT"
   - `collection_symbol`: "GFT"
   - `total_token_supply`: 10000
   - `ownership_mode`: Transferable (0)
4. ✅ Firma el deploy con la clave del sponsor
5. ✅ Envía el deploy a la red
6. ✅ Espera el procesamiento y obtiene el contract hash
7. ✅ Guarda el contract hash en `lib/casper/contract.ts`

### Salida Esperada

```
📋 Configuración:
   NODE_ADDRESS: https://rpc.testnet.casperlabs.io
   NETWORK_NAME: casper-test
   SPONSOR_PUBLIC_KEY: 01...

🔑 Cargando clave del sponsor...
✅ Clave cargada correctamente

📦 Creando deploy de instalación...
✅ Argumentos de instalación creados:
   - collection_name: GaslessGifterNFT
   - collection_symbol: GFT
   - total_token_supply: 10000
   - ownership_mode: Transferable (0)

✍️  Firmando deploy...
✅ Deploy firmado

📤 Enviando deploy a la red...
✅ Deploy enviado exitosamente!
   Deploy Hash: abc123...

⏳ Esperando procesamiento del deploy...
   (Esto puede tomar varios segundos)

🎉 ¡Deploy completado!

📊 Resultados:
   Deploy Hash: abc123...
   Contract Hash: contract-abc123...
   Package Hash: package-abc123...

✅ Contract hash guardado en: lib/casper/contract.ts

🔗 Enlaces útiles:
   Explorador: https://testnet.cspr.live/deploy/abc123...
   Contract: https://testnet.cspr.live/contract/contract-abc123...
```

### Troubleshooting

**Error: "No se encontró el archivo WASM"**
- Asegúrate de tener el archivo `contracts/cep78.wasm`
- Ver `contracts/README.md` para instrucciones

**Error: "Faltan variables de entorno"**
- Verifica que `.env.local` tenga todas las variables requeridas
- Asegúrate de que el archivo esté en la raíz del proyecto

**Error: "Deploy falló"**
- Verifica que el sponsor tenga suficiente balance
- Revisa los logs del deploy en el explorador
- Verifica que los argumentos del contrato sean correctos

