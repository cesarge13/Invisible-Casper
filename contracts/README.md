# Contratos de Casper

Esta carpeta contiene los archivos WASM de los contratos inteligentes de Casper.

## CEP-78 NFT Contract

Para desplegar el contrato CEP-78, necesitas el archivo WASM del contrato.

### Obtener el contrato CEP-78

1. Clona el repositorio oficial:
   ```bash
   git clone https://github.com/casper-ecosystem/cep-78-enhanced-nft.git
   cd cep-78-enhanced-nft
   ```

2. Compila el contrato (requiere Rust y cargo):
   ```bash
   make build-contract
   ```

3. Copia el archivo WASM compilado:
   ```bash
   cp target/wasm32-unknown-unknown/release/cep78-enhanced-nft.wasm ../Casper/contracts/cep78.wasm
   ```

### Alternativa: Descargar pre-compilado

Si no quieres compilar, puedes buscar una versión pre-compilada del contrato CEP-78 en:
- https://github.com/casper-ecosystem/cep-78-enhanced-nft/releases
- O usar el contrato desde el repositorio oficial

### Estructura esperada

```
contracts/
  └── cep78.wasm  ← Archivo WASM del contrato CEP-78
```

