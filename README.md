# Invisible Casper

Permite que cualquier usuario entre y ejecute acciones on-chain —como mintear un NFT— sin pagar gas ni tener tokens.

## 🚀 Características

- **NFT Minting Gasless**: Mintea NFTs sin pagar fees de gas
- **Sistema de Patrocinio**: El servidor paga automáticamente los fees de las transacciones
- **Integración con Casper Wallet**: Soporte completo para Casper Wallet y CSPR.click
- **Dashboard Interactivo**: Interfaz moderna para gestionar tus NFTs y transferencias

## 🛠️ Tecnologías

- **Next.js 14** con App Router
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **Casper JS SDK** para interacción con la blockchain
- **CEP-78** para estándar de NFTs

## 📦 Getting Started

### Prerrequisitos

- Node.js 18+ 
- pnpm (o npm/yarn)
- Casper Wallet instalado en tu navegador

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/cesarge13/Invisible-Casper.git
cd Invisible-Casper
```

2. Instala las dependencias:
```bash
pnpm install
```

3. Copia el archivo de variables de entorno:
```bash
cp .env.local.example .env.local
```

4. Configura tus variables de entorno en `.env.local`:
```env
NODE_ADDRESS=https://rpc.testnet.casperlabs.io
NETWORK_NAME=casper-test
SPONSOR_PUBLIC_KEY=tu_clave_publica_del_patrocinador
SPONSOR_PRIVATE_KEY=tu_clave_privada_del_patrocinador
```

5. Ejecuta el servidor de desarrollo:
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
Invisible-Casper/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── balance/        # Consulta de balance
│   │   ├── config/          # Configuración pública
│   │   └── sponsor/         # Sistema de patrocinio
│   ├── dashboard/           # Dashboard principal
│   └── page.tsx            # Página de inicio
├── components/              # Componentes React
│   ├── Logo.tsx            # Logo de Invisible Casper
│   └── web3/               # Componentes Web3
│       ├── ClickWrapper.tsx # Wrapper para CSPR.click
│       ├── MintButton.tsx  # Botón de mint de NFTs
│       └── WalletNav.tsx   # Navegación de wallet
├── lib/                    # Utilidades
│   └── casper/             # Utilidades de Casper
│       ├── cep78.ts        # Funciones CEP-78
│       ├── client.ts        # Cliente de Casper
│       ├── config.ts        # Configuración
│       ├── sponsor.ts       # Servicio de patrocinio
│       └── walletSigning.ts # Firma de transacciones
├── contracts/              # Contratos inteligentes
│   └── cep78.wasm         # Contrato CEP-78
└── scripts/               # Scripts de utilidad
```

## 🔐 Variables de Entorno

Ver `.env.local.example` para la lista completa de variables de entorno requeridas.

**Importante**: Nunca subas tu `.env.local` al repositorio. Contiene información sensible.

## 🎨 Características de la UI

- **Logo Animado**: Logo personalizado con animaciones
- **Dark Mode**: Soporte completo para modo oscuro
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Gradientes Modernos**: Diseño visual atractivo

## 📝 Uso

1. **Conecta tu Wallet**: Usa el botón "Connect Wallet" en la esquina superior derecha
2. **Ve al Dashboard**: Navega al dashboard para ver tus opciones
3. **Mint NFTs**: Usa el botón "Mint NFT (Gas 0)" para crear NFTs sin pagar gas
4. **Transfiere CSPR**: Realiza transferencias usando el sistema de patrocinio

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🔗 Enlaces

- [Repositorio en GitHub](https://github.com/cesarge13/Invisible-Casper)
- [Documentación de Casper](https://docs.casper.network/)
- [CEP-78 Standard](https://github.com/casper-ecosystem/cep-78-enhanced-nft)

## ⚠️ Seguridad

**IMPORTANTE**: 
- Nunca compartas tu clave privada del patrocinador
- No subas archivos `.env.local` al repositorio
- Usa variables de entorno seguras en producción
- Revisa `SECURITY.md` para más información

---

Hecho con ❤️ para la comunidad de Casper
